const pool = require("../config/database");
const { createClient } = require("@supabase/supabase-js");
const { createNotification } = require('./notificationController');
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Configure multer for temporary local storage before uploading to Supabase
const paymentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/temp_payments";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `payment-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Upload payment proof
const uploadPaymentProof = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { paymentId } = req.params;
    const userId = req.user.id;

    console.log("Starting payment proof upload...");
    console.log("Payment ID:", paymentId);
    console.log("User ID:", userId);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    console.log("File received:", {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
    });

    // Verify payment belongs to user's request
    const paymentCheck = await client.query(
      `
      SELECT p.payment_id, p.request_id, sr.requested_by_user_id, sr.request_number
      FROM payments p
      JOIN service_requests sr ON p.request_id = sr.request_id
      WHERE p.payment_id = $1
    `,
      [paymentId]
    );

    if (paymentCheck.rows.length === 0) {
      console.log("ERROR: Payment not found");
      // Clean up temp file
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const payment = paymentCheck.rows[0];
    console.log("SUCCESS: Payment found:", {
      paymentId: payment.payment_id,
      requestId: payment.request_id,
      requestNumber: payment.request_number,
    });

    // Check if user owns this request
    if (payment.requested_by_user_id !== userId) {
      console.log("ERROR: User not authorized");
      // Clean up temp file
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({
        success: false,
        message: "Unauthorized to upload proof for this payment",
      });
    }

    // Upload file to Supabase Storage
    console.log("Reading file buffer...");
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileName = `${
      payment.request_number
    }-payment${paymentId}-${Date.now()}${path.extname(req.file.originalname)}`;
    const filePath = `payment-proofs/${fileName}`;

    console.log("Preparing Supabase upload...");
    console.log("Bucket:", "payment-documents");
    console.log("File path:", filePath);
    console.log("File name:", fileName);
    console.log("Buffer size:", fileBuffer.length, "bytes");
    console.log("Content type:", req.file.mimetype);
    console.log("Supabase URL:", process.env.SUPABASE_URL);
    console.log("Has Service Key:", !!process.env.SUPABASE_SERVICE_KEY);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("payment-documents")
      .upload(filePath, fileBuffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    // Clean up local temp file after upload attempt
    try {
      fs.unlinkSync(req.file.path);
      console.log("Temp file cleaned up");
    } catch (cleanupError) {
      console.error("WARNING: Failed to clean up temp file:", cleanupError);
    }

    if (uploadError) {
      console.error("ERROR: Supabase upload failed");
      console.error("Error message:", uploadError.message);
      console.error("Error name:", uploadError.name);
      console.error("Error code:", uploadError.statusCode);
      console.error("Full error:", JSON.stringify(uploadError, null, 2));
      throw new Error(`Failed to upload payment proof: ${uploadError.message}`);
    }

    console.log("SUCCESS: Supabase upload completed");
    console.log("Upload data:", uploadData);

    // Update payment with proof file path
    const updateQuery = `
      UPDATE payments 
      SET proof_of_payment_file = $1,
          updated_at = NOW()
      WHERE payment_id = $2
      RETURNING payment_id, proof_of_payment_file
    `;

    const result = await client.query(updateQuery, [filePath, paymentId]);
    console.log("SUCCESS: Database updated with file path");

    await client.query("COMMIT");

    // ✅ SEND NOTIFICATIONS (after successful commit)
    try {
      // Get detailed payment and request information for notifications
      const notifQuery = `
        SELECT 
          p.payment_id,
          p.payment_phase,
          p.amount,
          sr.request_id,
          sr.request_number,
          sr.requested_by_user_id,
          sr.assigned_to_staff_id,
          CONCAT(customer.first_name, ' ', customer.last_name) as customer_name,
          customer.email as customer_email,
          CONCAT(staff.first_name, ' ', staff.last_name) as staff_name,
          staff.email as staff_email
        FROM payments p
        JOIN service_requests sr ON p.request_id = sr.request_id
        JOIN users customer ON sr.requested_by_user_id = customer.user_id
        LEFT JOIN users staff ON sr.assigned_to_staff_id = staff.user_id
        WHERE p.payment_id = $1
      `;

      const notifResult = await pool.query(notifQuery, [paymentId]);
      const paymentInfo = notifResult.rows[0];

      const formattedAmount = `₱${parseFloat(
        paymentInfo.amount
      ).toLocaleString()}`;

      // 1. Notify customer (confirmation)
      await createNotification(
        paymentInfo.requested_by_user_id,
        "Payment",
        `Proof of Payment Uploaded - ${paymentInfo.request_number}`,
        `Your proof of payment for ${paymentInfo.payment_phase} (${formattedAmount}) on service request #${paymentInfo.request_number} has been uploaded successfully. TRISHKAYE will review and confirm your payment shortly.`,
        paymentInfo.customer_email
      );

      console.log(`✅ Customer notified about proof upload`);

      // 2. Notify ALL admins
      const adminsQuery = `
        SELECT user_id, email, first_name, last_name 
        FROM users 
        WHERE user_type = 'admin' AND status = 'Active'
      `;
      const adminsResult = await pool.query(adminsQuery);

      for (const admin of adminsResult.rows) {
        await createNotification(
          admin.user_id,
          "Payment",
          `New Proof of Payment - ${paymentInfo.request_number}`,
          `📄 ${paymentInfo.customer_name} uploaded proof of payment for ${paymentInfo.payment_phase} (${formattedAmount}) on service request #${paymentInfo.request_number}. Please review and confirm the payment.`,
          admin.email
        );
      }

      console.log(`✅ Admin(s) notified about proof upload`);

      // 3. Notify assigned staff (if exists)
      if (paymentInfo.assigned_to_staff_id && paymentInfo.staff_email) {
        await createNotification(
          paymentInfo.assigned_to_staff_id,
          "Payment",
          `New Proof of Payment - ${paymentInfo.request_number}`,
          `📄 ${paymentInfo.customer_name} uploaded proof of payment for ${paymentInfo.payment_phase} (${formattedAmount}) on your assigned service request #${paymentInfo.request_number}. Please review and confirm the payment.`,
          paymentInfo.staff_email
        );

        console.log(`✅ Assigned staff notified about proof upload`);
      }
    } catch (notifError) {
      console.error(
        "❌ Failed to send proof upload notifications:",
        notifError
      );
      // Don't fail the request if notifications fail
    }

    res.json({
      success: true,
      message: "Payment proof uploaded successfully",
      data: {
        paymentId: result.rows[0].payment_id,
        fileName: fileName,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    // Clean up uploaded temp file on error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("Failed to clean up temp file:", cleanupError);
      }
    }

    console.error("ERROR: Upload payment proof failed:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to upload payment proof",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

// View payment proof (for admin/staff/customer)
const viewPaymentProof = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType;

    const query = `
      SELECT p.proof_of_payment_file, sr.requested_by_user_id
      FROM payments p
      JOIN service_requests sr ON p.request_id = sr.request_id
      WHERE p.payment_id = $1
    `;

    const result = await pool.query(query, [paymentId]);

    if (result.rows.length === 0 || !result.rows[0].proof_of_payment_file) {
      return res.status(404).json({
        success: false,
        message: "Payment proof not found",
      });
    }

    const payment = result.rows[0];

    // Check authorization (customer can only view their own, admin/staff can view all)
    if (userType === "client" && payment.requested_by_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this payment proof",
      });
    }

    const filePath = payment.proof_of_payment_file;

    // Get signed URL from Supabase Storage (valid for 1 hour)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from("payment-documents")
      .createSignedUrl(filePath, 3600);

    if (urlError) {
      console.error("Error creating signed URL:", urlError);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve payment proof",
        error:
          process.env.NODE_ENV === "development" ? urlError.message : undefined,
      });
    }

    if (!signedUrlData || !signedUrlData.signedUrl) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate file URL",
      });
    }

    // Redirect to signed URL
    res.redirect(signedUrlData.signedUrl);
  } catch (error) {
    console.error("View payment proof error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve payment proof",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete payment proof
const deletePaymentProof = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { paymentId } = req.params;
    const userId = req.user.id;

    // Get payment and verify ownership
    const paymentCheck = await client.query(
      `
      SELECT p.payment_id, p.proof_of_payment_file, sr.requested_by_user_id
      FROM payments p
      JOIN service_requests sr ON p.request_id = sr.request_id
      WHERE p.payment_id = $1
    `,
      [paymentId]
    );

    if (paymentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const payment = paymentCheck.rows[0];

    if (payment.requested_by_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this payment proof",
      });
    }

    // Delete file from Supabase Storage
    if (payment.proof_of_payment_file) {
      const { error: deleteError } = await supabase.storage
        .from("payment-documents")
        .remove([payment.proof_of_payment_file]);

      if (deleteError) {
        console.error("Error deleting file from storage:", deleteError);
        // Continue with database update even if file deletion fails
      }
    }

    // Update database
    await client.query(
      `
      UPDATE payments 
      SET proof_of_payment_file = NULL,
          updated_at = NOW()
      WHERE payment_id = $1
    `,
      [paymentId]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Payment proof deleted successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Delete payment proof error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete payment proof",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

// Update payment status (admin/staff only)
const updatePaymentStatus = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { paymentId } = req.params;
    const { status } = req.body; // 'Paid', 'Pending', 'Overdue', 'Cancelled'

    if (
      !status ||
      !["Paid", "Pending", "Overdue", "Cancelled"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    // Get payment and request details
    const paymentQuery = `
      SELECT p.payment_id, p.payment_phase, p.amount, p.status as current_status,
             sr.request_id, sr.request_number, sr.requested_by_user_id,
             u.email as customer_email, u.first_name as customer_first_name
      FROM payments p
      JOIN service_requests sr ON p.request_id = sr.request_id
      JOIN users u ON sr.requested_by_user_id = u.user_id
      WHERE p.payment_id = $1
    `;

    const paymentResult = await client.query(paymentQuery, [paymentId]);

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const payment = paymentResult.rows[0];

    // Update payment status
    const updateQuery = `
      UPDATE payments 
      SET status = $1,
          paid_on = CASE WHEN $1 = 'Paid' THEN NOW() ELSE paid_on END,
          updated_at = NOW()
      WHERE payment_id = $2
      RETURNING *
    `;

    await client.query(updateQuery, [status, paymentId]);

    // Update overall service request payment status
    const requestPaymentsQuery = `
      SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END) as paid_count
      FROM payments
      WHERE request_id = $1
    `;

    const statusResult = await client.query(requestPaymentsQuery, [
      payment.request_id,
    ]);
    const { total_payments, paid_count } = statusResult.rows[0];

    let overallStatus = "Pending";
    if (paid_count === parseInt(total_payments)) {
      overallStatus = "Paid";
    } else if (paid_count > 0) {
      overallStatus = "Partial";
    }

    await client.query(
      `
      UPDATE service_requests 
      SET payment_status = $1
      WHERE request_id = $2
    `,
      [overallStatus, payment.request_id]
    );

    await client.query("COMMIT");

    // Send notifications
    try {
      if (status !== payment.current_status) {
        await createNotification(
          payment.requested_by_user_id,
          "Payment",
          `Payment ${status}`,
          `Your ${payment.payment_phase} payment for service request #${payment.request_number} has been marked as ${status}.`,
          payment.customer_email
        );
        console.log(
          `Payment notification sent to customer ${payment.customer_email}`
        );
      }

      if (status === "Paid") {
        const adminQuery = `SELECT user_id, email FROM users WHERE user_type = 'admin' AND status = 'Active'`;
        const admins = await client.query(adminQuery);

        for (const admin of admins.rows) {
          await createNotification(
            admin.user_id,
            "Payment",
            "Payment Received",
            `${payment.payment_phase} payment received for service request #${
              payment.request_number
            }. Amount: ₱${parseFloat(payment.amount).toLocaleString()}`,
            admin.email
          );
        }
        console.log("Payment notifications sent to admins");
      }
    } catch (notifError) {
      console.error("Failed to create payment notifications:", notifError);
    }

    res.json({
      success: true,
      message: "Payment status updated successfully",
      data: {
        paymentId: paymentId,
        status: status,
        overallPaymentStatus: overallStatus,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

const paymentUpload = multer({
  storage: paymentStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG, and PDF are allowed."));
    }
  },
}).single("paymentProof");

module.exports = {
  paymentUpload,
  uploadPaymentProof,
  viewPaymentProof,
  deletePaymentProof,
  updatePaymentStatus,
};
