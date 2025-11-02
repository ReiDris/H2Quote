const { createClient } = require("@supabase/supabase-js");
const pool = require("../config/database");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const {
  sendAccountApprovalEmail,
  sendAccountRejectionEmail,
} = require("../emailServices/emailService");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const getPendingUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select(
        `
        user_id, first_name, last_name, email, phone, 
        verification_file_original_name, verification_file_path, created_at,
        companies (company_name, phone, email)
      `
      )
      .eq("status", "Inactive")
      .eq("user_type", "client")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get pending users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending users",
    });
  }
};

const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ["admin", "staff", "client"];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Valid role is required (admin, staff, or client)",
      });
    }

    const { data: userData, error: getUserError } = await supabase
      .from("users")
      .select(
        `
        first_name, last_name, email, company_id, is_primary_contact,
        companies (company_name)
      `
      )
      .eq("user_id", userId)
      .single();

    if (getUserError || !userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prepare update data based on role
    const updateData = {
      status: "Active",
      user_type: role,
      updated_at: new Date().toISOString(),
    };

    // If changing to staff or admin, set company_id to NULL (required by constraint)
    if (role === "staff" || role === "admin") {
      updateData.company_id = null;
      updateData.is_primary_contact = false;
    }

    const { error: userError } = await supabase
      .from("users")
      .update(updateData)
      .eq("user_id", userId);

    if (userError) {
      throw userError;
    }

    // Only update company status if user is approved as client and is primary contact
    if (
      role === "client" &&
      userData.is_primary_contact &&
      userData.company_id
    ) {
      await supabase
        .from("companies")
        .update({
          status: "Active",
          updated_at: new Date().toISOString(),
        })
        .eq("company_id", userData.company_id);
    }

    await supabase.from("audit_log").insert({
      table_name: "users",
      record_id: userId,
      action: "UPDATE",
      new_values: { status: "Active", user_type: role },
      changed_by: req.user.email,
      change_reason: `User approved by admin with role: ${role}`,
      ip_address: req.ip || req.connection.remoteAddress,
    });

    try {
      const customerName = `${userData.first_name} ${userData.last_name}`;
      const companyName = userData.companies?.company_name || "Your Company";

      const emailSent = await sendAccountApprovalEmail(
        customerName,
        companyName,
        userData.email
      );

      if (emailSent) {
        console.log("Approval email sent successfully to:", userData.email);
      } else {
        console.error("Failed to send approval email to:", userData.email);
      }
    } catch (emailError) {
      console.error("Email sending error:", emailError);
    }

    res.json({
      success: true,
      message: `User approved successfully as ${role} and notification email sent`,
    });
  } catch (error) {
    console.error("Approve user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve user",
    });
  }
};

const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Enhanced logging for debugging
    console.log("🔍 Reject User Request:");
    console.log("═══════════════════════════════════════");
    console.log("User ID:", userId);
    console.log("Reason:", reason);
    console.log("Admin Email:", req.user?.email);
    console.log("═══════════════════════════════════════");

    // Validate inputs
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    // First, check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select(`
        user_id, first_name, last_name, email, status,
        companies (company_name)
      `
      )
      .eq("user_id", userId)
      .single();

    if (checkError) {
      console.error("❌ Error checking user:", checkError);
      return res.status(404).json({
        success: false,
        message: "User not found",
        error:
          process.env.NODE_ENV === "development"
            ? checkError.message
            : undefined,
      });
    }

    console.log(
      "✅ User found:",
      existingUser.first_name,
      existingUser.last_name
    );

    // Update user status - CHANGED FROM 'Rejected' TO 'Suspended'
    // The database constraint only allows: 'Active', 'Inactive', 'Suspended'
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        status: "Suspended",
        rejection_reason: reason.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select();

    if (updateError) {
      console.error("❌ Error updating user:", updateError);
      throw updateError;
    }

    console.log("✅ User status updated successfully");

    // Insert audit log (with error handling)
    try {
      const { error: auditError } = await supabase.from("audit_log").insert({
        table_name: "users",
        record_id: userId,
        action: "UPDATE",
        new_values: { status: "Suspended", rejection_reason: reason.trim() },
        changed_by: req.user?.email || "Unknown",
        change_reason: "User rejected by admin",
        ip_address: req.ip || req.connection?.remoteAddress || "Unknown",
      });

      if (auditError) {
        console.error("⚠️  Warning: Failed to create audit log:", auditError);
        // Don't fail the request if audit log fails
      } else {
        console.log("✅ Audit log created successfully");
      }
    } catch (auditException) {
      console.error("⚠️  Warning: Audit log exception:", auditException);
      // Don't fail the request if audit log fails
    }

    setImmediate(async () => {
      try {
        const userName =
          `${existingUser.first_name} ${existingUser.last_name}`.trim();
        const companyName =
          existingUser.companies?.company_name || "Your Company";

        await sendAccountRejectionEmail(
          userName,
          existingUser.email,
          companyName,
          reason.trim()
        );

        console.log(
          "✅ Rejection email sent successfully to:",
          existingUser.email
        );
      } catch (emailError) {
        console.error("❌ Failed to send rejection email:", emailError.message);
        // Don't fail the request if email fails
      }
    });

    console.log("✅ Rejection completed successfully");

    res.json({
      success: true,
      message: "User rejected successfully",
    });
  } catch (error) {
    console.error("❌ Reject user error:");
    console.error("═══════════════════════════════════════");
    console.error("Error Message:", error.message);
    console.error("Error Code:", error.code);
    console.error("Error Details:", error.details);
    console.error("Error Hint:", error.hint);
    console.error("Full Error:", error);
    console.error("═══════════════════════════════════════");

    res.status(500).json({
      success: false,
      message: "Failed to reject user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      details:
        process.env.NODE_ENV === "development" ? error.details : undefined,
    });
  }
};

const serveVerificationFile = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from("users")
      .select("verification_file_path, verification_file_original_name")
      .eq("user_id", userId)
      .single();

    if (error || !user || !user.verification_file_path) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Get signed URL from Supabase Storage
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from("verification-documents")
      .createSignedUrl(user.verification_file_path, 3600); // 1 hour expiry

    if (urlError) {
      console.error("Error creating signed URL:", urlError);
      return res.status(500).json({
        success: false,
        message: "Failed to generate file URL",
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
    console.error("Error serving file:", error);
    res.status(500).json({
      success: false,
      message: "Failed to serve file",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getPendingUsers,
  approveUser,
  rejectUser,
  serveVerificationFile,
};
