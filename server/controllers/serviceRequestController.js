const { createClient } = require("@supabase/supabase-js");
const pool = require("../config/database");
const { createNotification } = require("./notificationController");
const {
  createServiceRequestNotification,
} = require("./notificationController");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const createDefaultPayments = async (requestId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // FIXED: Calculate actual total from all item tables
    const totalQuery = `
      SELECT 
        sr.downpayment_percentage, 
        sr.payment_terms,
        sr.discount_percentage,
        COALESCE(
          (SELECT SUM(sri.line_total) FROM service_request_items sri WHERE sri.request_id = sr.request_id) +
          (SELECT COALESCE(SUM(src.line_total), 0) FROM service_request_chemicals src WHERE src.request_id = sr.request_id) +
          (SELECT COALESCE(SUM(srr.line_total), 0) FROM service_request_refrigerants srr WHERE srr.request_id = sr.request_id),
          sr.estimated_cost
        ) as subtotal
      FROM service_requests sr
      WHERE sr.request_id = $1
    `;
    const result = await client.query(totalQuery, [requestId]);
    const { subtotal, downpayment_percentage, payment_terms, discount_percentage } = result.rows[0];
    
    // Calculate total after discount
    const discountAmount = (subtotal * (discount_percentage || 0)) / 100;
    const estimated_cost = subtotal - discountAmount;

    // Check if it's Full Payment
    if (payment_terms === "Full" || !downpayment_percentage) {
      // Create single payment for full amount
      await client.query(
        `
        INSERT INTO payments (request_id, payment_phase, amount, status)
        VALUES ($1, 'Full Payment', $2, 'Pending')
      `,
        [requestId, estimated_cost]
      );
    } else {
      // Create two payments for down payment scenario
      const downpaymentPercent = downpayment_percentage || 50;
      const downpaymentAmount = Math.round(
        (estimated_cost * downpaymentPercent) / 100
      );
      const remainingAmount = estimated_cost - downpaymentAmount;

      await client.query(
        `
        INSERT INTO payments (request_id, payment_phase, amount, status)
        VALUES ($1, 'Down Payment', $2, 'Pending'), ($1, 'Completion Balance', $3, 'Pending')
      `,
        [requestId, downpaymentAmount, remainingAmount]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const recreatePayments = async (requestId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check if any payments have been made
    const paymentCheck = await client.query(
      `SELECT COUNT(*) as paid_count FROM payments 
       WHERE request_id = $1 AND status = 'Paid'`,
      [requestId]
    );

    if (parseInt(paymentCheck.rows[0].paid_count) > 0) {
      throw new Error(
        "Cannot modify request - payments have already been made"
      );
    }

    // Delete all pending payments
    await client.query(
      "DELETE FROM payments WHERE request_id = $1 AND status = 'Pending'",
      [requestId]
    );

    // FIXED: Calculate actual total from all item tables (same as createDefaultPayments)
    const totalQuery = `
      SELECT 
        sr.downpayment_percentage, 
        sr.payment_terms,
        sr.discount_percentage,
        COALESCE(
          (SELECT SUM(sri.line_total) FROM service_request_items sri WHERE sri.request_id = sr.request_id) +
          (SELECT COALESCE(SUM(src.line_total), 0) FROM service_request_chemicals src WHERE src.request_id = sr.request_id) +
          (SELECT COALESCE(SUM(srr.line_total), 0) FROM service_request_refrigerants srr WHERE srr.request_id = sr.request_id),
          sr.estimated_cost
        ) as subtotal
      FROM service_requests sr
      WHERE sr.request_id = $1
    `;
    const result = await client.query(totalQuery, [requestId]);
    const { subtotal, downpayment_percentage, payment_terms, discount_percentage } = result.rows[0];
    
    // Calculate total after discount
    const discountAmount = (subtotal * (discount_percentage || 0)) / 100;
    const estimated_cost = subtotal - discountAmount;

    // Check if it's Full Payment
    if (payment_terms === "Full" || !downpayment_percentage) {
      await client.query(
        `
        INSERT INTO payments (request_id, payment_phase, amount, status)
        VALUES ($1, 'Full Payment', $2, 'Pending')
      `,
        [requestId, estimated_cost]
      );
    } else {
      const downpaymentPercent = downpayment_percentage || 50;
      const downpaymentAmount = Math.round(
        (estimated_cost * downpaymentPercent) / 100
      );
      const remainingAmount = estimated_cost - downpaymentAmount;

      await client.query(
        `
        INSERT INTO payments (request_id, payment_phase, amount, status)
        VALUES ($1, 'Down Payment', $2, 'Pending'), ($1, 'Completion Balance', $3, 'Pending')
      `,
        [requestId, downpaymentAmount, remainingAmount]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const createServiceRequest = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      selectedServices,
      paymentMode,
      paymentTerms,
      downpayment,
      remarks,
      siteLocation,
      preferredSchedule,
      specialRequirements,
    } = req.body;

    const customerId = req.user.id;
    const companyId = req.user.companyId;

    if (!selectedServices || selectedServices.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one service must be selected",
      });
    }

    const requestNumberResult = await client.query(
      "SELECT generate_request_number() as request_number"
    );
    const requestNumber = requestNumberResult.rows[0].request_number;

    let totalCost = 0;
    let estimatedDuration = 0;
    const serviceDetails = [];

    for (const service of selectedServices) {
      let itemQuery, itemData;
      let actualId = service.id;
      let itemType = "service";

      if (typeof service.id === "string" && service.id.startsWith("chem_")) {
        actualId = parseInt(service.id.replace("chem_", ""));
        itemType = "chemical";
        itemQuery = `
          SELECT chemical_id as id, chemical_name as name, price as base_price, 'chemical' as type
          FROM chemicals 
          WHERE chemical_id = $1 AND is_active = true
        `;
      } else if (
        typeof service.id === "string" &&
        service.id.startsWith("refrig_")
      ) {
        actualId = parseInt(service.id.replace("refrig_", ""));
        itemType = "refrigerant";
        itemQuery = `
          SELECT refrigerant_id as id, refrigerant_name as name, price as base_price, 'refrigerant' as type
          FROM refrigerants 
          WHERE refrigerant_id = $1 AND is_active = true
        `;
      } else {
        actualId = parseInt(service.id);
        itemType = "service";
        itemQuery = `
          SELECT service_id as id, service_name as name, base_price, estimated_duration_hours, 'service' as type
          FROM services 
          WHERE service_id = $1 AND is_active = true
        `;
      }

      const result = await client.query(itemQuery, [actualId]);
      itemData = result.rows[0];

      if (!itemData) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: `Item with ID ${service.id} not found or inactive`,
        });
      }

      if (itemData.type === "service" && itemData.estimated_duration_hours) {
        const serviceDays = Math.ceil(itemData.estimated_duration_hours / 8);
        estimatedDuration = Math.max(estimatedDuration, serviceDays);
      }

      const itemTotal = itemData.base_price * service.quantity;
      totalCost += itemTotal;

      if (itemData.type !== "service" && estimatedDuration === 0) {
        estimatedDuration = 1;
      }

      serviceDetails.push({
        originalId: service.id,
        itemId: actualId,
        itemType: itemData.type,
        quantity: service.quantity,
        unitPrice: itemData.base_price,
        totalPrice: itemTotal,
        name: itemData.name,
      });
    }

    const statusResult = await client.query(
      "SELECT status_id FROM request_statuses WHERE status_name = $1",
      ["New"]
    );
    const initialStatusId = statusResult.rows[0]?.status_id || 1;

    let downpaymentPercentage = null;
    if (downpayment && downpayment.includes("%")) {
      downpaymentPercentage = parseFloat(downpayment.replace("%", ""));
    }

    const insertRequestQuery = `
      INSERT INTO service_requests 
      (request_number, company_id, requested_by_user_id, status_id, 
       description, site_location, preferred_schedule, special_requirements, 
       remarks, estimated_cost, estimated_duration_days, payment_mode, 
       payment_terms, downpayment_percentage)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING request_id
    `;

    const requestResult = await client.query(insertRequestQuery, [
      requestNumber,
      companyId,
      customerId,
      initialStatusId,
      "Service request from customer portal",
      siteLocation,
      preferredSchedule,
      specialRequirements,
      remarks,
      totalCost,
      estimatedDuration,
      paymentMode,
      paymentTerms,
      downpaymentPercentage,
    ]);

    const requestId = requestResult.rows[0].request_id;

    for (const item of serviceDetails) {
      if (item.itemType === "service") {
        const insertItemQuery = `
          INSERT INTO service_request_items 
          (request_id, service_id, quantity, unit_price, line_total)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(insertItemQuery, [
          requestId,
          item.itemId,
          item.quantity,
          item.unitPrice,
          item.totalPrice,
        ]);
      } else if (item.itemType === "chemical") {
        const insertChemicalQuery = `
          INSERT INTO service_request_chemicals 
          (request_id, chemical_id, quantity, unit_price, line_total)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(insertChemicalQuery, [
          requestId,
          item.itemId,
          item.quantity,
          item.unitPrice,
          item.totalPrice,
        ]);
      } else if (item.itemType === "refrigerant") {
        const insertRefrigerantQuery = `
          INSERT INTO service_request_refrigerants 
          (request_id, refrigerant_id, quantity, unit_price, line_total)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(insertRefrigerantQuery, [
          requestId,
          item.itemId,
          item.quantity,
          item.unitPrice,
          item.totalPrice,
        ]);
      }
    }

    await client.query("COMMIT");

    // IMPORTANT: Create default payments AFTER commit, using the final total cost
    try {
      await createDefaultPayments(requestId);
      console.log("Default payments created successfully");
    } catch (paymentError) {
      console.error("Failed to create default payments:", paymentError);
    }

    // ✅ SEND NOTIFICATION TO CUSTOMER
    try {
      await createServiceRequestNotification(
        customerId,
        requestNumber,
        requestId,
        "Pending",
        `Your service request #${requestNumber} has been submitted successfully. Total cost: ₱${totalCost.toLocaleString()}. We will review it shortly.`
      );
      console.log("Customer notification sent for new request");
    } catch (notifError) {
      console.error("Failed to send customer notification:", notifError);
    }

    // ✅ SEND NOTIFICATIONS TO ADMIN AND STAFF
    try {
      const staffQuery = `
        SELECT user_id, email, first_name, last_name 
        FROM users 
        WHERE user_type IN ('admin', 'staff') AND status = 'Active'
      `;
      const staffResult = await pool.query(staffQuery);

      console.log(
        `Creating notifications for ${staffResult.rows.length} admin/staff users`
      );

      for (const staff of staffResult.rows) {
        await createNotification(
          staff.user_id,
          "Service Request",
          `New Service Request - ${requestNumber}`,
          `A new service request #${requestNumber} has been submitted by ${
            req.user.email
          }. Total cost: ₱${totalCost.toLocaleString()}`,
          staff.email
        );
      }

      console.log("Admin/staff notifications sent successfully");
    } catch (notifError) {
      console.error("Failed to create admin/staff notifications:", notifError);
    }

    res.status(201).json({
      success: true,
      message: "Service request created successfully",
      data: {
        requestId: requestId,
        requestNumber: requestNumber,
        totalCost: totalCost,
        estimatedDuration: estimatedDuration,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create service request error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create service request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

const getCustomerRequests = async (req, res) => {
  try {
    const customerId = req.user.id;

    const query = `
      SELECT 
        sr.request_id, 
        sr.request_number, 
        rs.status_name as status, 
        sr.estimated_cost, 
        sr.request_date as created_at,
        sr.target_completion_date, 
        sr.estimated_duration_days,
        CONCAT(staff.first_name, ' ', staff.last_name) as assigned_staff_name,
        sr.payment_mode, 
        sr.payment_terms, 
        sr.downpayment_percentage,
        -- Add service status for frontend
        CASE 
          WHEN rs.status_name = 'New' THEN 'Pending'
          WHEN rs.status_name = 'Under Review' THEN 'Assigned'
          WHEN rs.status_name = 'Quote Sent' THEN 'Waiting for Approval'
          WHEN rs.status_name = 'Quote Approved' THEN 'Approved'
          WHEN rs.status_name = 'In Progress' THEN 'Ongoing'
          WHEN rs.status_name = 'Completed' THEN 'Completed'
          ELSE rs.status_name
        END as service_status,
        -- Add payment status calculation
        CASE 
          WHEN sr.payment_status IS NULL THEN 'Pending'
          ELSE sr.payment_status
        END as payment_status,
        -- Add warranty status
        CASE 
          WHEN rs.status_name = 'Completed' AND sr.warranty_start_date IS NOT NULL THEN 'Valid'
          WHEN rs.status_name = 'Completed' AND sr.warranty_start_date IS NULL THEN 'Pending'
          ELSE 'N/A'
        END as warranty_status
      FROM service_requests sr
      JOIN request_statuses rs ON sr.status_id = rs.status_id
      LEFT JOIN users staff ON sr.assigned_to_staff_id = staff.user_id
      WHERE sr.requested_by_user_id = $1
      ORDER BY sr.request_date DESC
    `;

    const result = await pool.query(query, [customerId]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get customer requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service requests",
    });
  }
};

const getRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType;

    let whereClause = "sr.request_id = $1";
    let queryParams = [requestId];

    if (userType === "client") {
      whereClause += " AND sr.requested_by_user_id = $2";
      queryParams.push(userId);
    }

    const requestQuery = `
  SELECT 
    sr.*, 
    rs.status_name,
    CONCAT(u.first_name, ' ', u.last_name) as customer_name,
    c.company_name,
    CONCAT(staff.first_name, ' ', staff.last_name) as assigned_staff_name,
    TO_CHAR(sr.request_date, 'Mon DD, YYYY - HH:MI AM') as requested_at,
    CASE 
      WHEN rs.status_name = 'New' THEN 'Pending'
      WHEN rs.status_name = 'Under Review' THEN 'Assigned'
      WHEN rs.status_name = 'Quote Sent' THEN 'Waiting for Approval'
      WHEN rs.status_name = 'Quote Approved' THEN 'Approved'
      WHEN rs.status_name = 'In Progress' THEN 'Ongoing'
      WHEN rs.status_name = 'Completed' THEN 'Completed'
      ELSE rs.status_name
    END as service_status,
    CASE 
      WHEN sr.payment_status IS NULL THEN 'Pending'
      ELSE sr.payment_status
    END as payment_status,
    CASE 
      WHEN sr.estimated_duration_days IS NOT NULL THEN CONCAT(sr.estimated_duration_days, ' Days')
      ELSE '3 - 7 Days'
    END as estimated_duration,
    TO_CHAR(sr.service_start_date, 'YYYY-MM-DD') as service_start_date,
    TO_CHAR(sr.target_completion_date, 'Mon DD, YYYY') as estimated_end_date,
    TO_CHAR(sr.payment_deadline, 'Mon DD, YYYY') as payment_deadline,
    TO_CHAR(sr.request_acknowledged_date, 'Mon DD, YYYY') as request_acknowledged_date,
    TO_CHAR(sr.actual_completion_date, 'YYYY-MM-DD') as actual_completion_date,
    u.email as email,
    u.phone as phone,
    sr.discount_percentage
  FROM service_requests sr
  JOIN request_statuses rs ON sr.status_id = rs.status_id
  JOIN users u ON sr.requested_by_user_id = u.user_id
  JOIN companies c ON sr.company_id = c.company_id
  LEFT JOIN users staff ON sr.assigned_to_staff_id = staff.user_id
  WHERE ${whereClause}
`;

    const requestResult = await pool.query(requestQuery, queryParams);

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    const request = requestResult.rows[0];

    const servicesQuery = `
      SELECT 
        sri.*, 
        s.service_name as name, 
        sc.category_name as category,
        CASE 
          WHEN sc.category_name IS NOT NULL THEN sc.category_name
          ELSE 'Services'
        END as service_category,
        s.service_name as service,
        COALESCE(sri.notes, '-') as remarks,
        sri.quantity,
        sri.unit_price,
        sri.line_total,
        'service' as item_type,
        COALESCE(sri.warranty_months, 6) as warranty_months,
        TO_CHAR(sri.warranty_start_date, 'YYYY-MM-DD') as warranty_start_date,
        TO_CHAR(sri.warranty_end_date, 'YYYY-MM-DD') as warranty_end_date,
        CASE 
          WHEN sri.warranty_end_date IS NULL THEN 'Not Set'
          WHEN sri.warranty_end_date < CURRENT_DATE THEN 'Expired'
          ELSE 'Valid'
        END as warranty_status
      FROM service_request_items sri
      JOIN services s ON sri.service_id = s.service_id
      LEFT JOIN service_categories sc ON s.category_id = sc.category_id
      WHERE sri.request_id = $1
      ORDER BY sri.item_id
    `;

    const chemicalsQuery = `
      SELECT 
        src.*,
        c.chemical_name as name,
        'Chemicals' as category,
        'Chemicals' as service_category,
        c.chemical_name as service,
        COALESCE(src.notes, '-') as remarks,
        src.quantity,
        src.unit_price,
        src.line_total,
        'chemical' as item_type,
        src.item_id
      FROM service_request_chemicals src
      JOIN chemicals c ON src.chemical_id = c.chemical_id
      WHERE src.request_id = $1
      ORDER BY src.item_id
    `;

    const refrigerantsQuery = `
      SELECT 
        srr.*,
        r.refrigerant_name as name,
        'Refrigerants' as category,
        'Refrigerants' as service_category,
        r.refrigerant_name as service,
        COALESCE(srr.notes, '-') as remarks,
        srr.quantity,
        srr.unit_price,
        srr.line_total,
        'refrigerant' as item_type,
        srr.item_id
      FROM service_request_refrigerants srr
      JOIN refrigerants r ON srr.refrigerant_id = r.refrigerant_id
      WHERE srr.request_id = $1
      ORDER BY srr.item_id
    `;

    const [servicesResult, chemicalsResult, refrigerantsResult] =
      await Promise.all([
        pool.query(servicesQuery, [requestId]),
        pool.query(chemicalsQuery, [requestId]),
        pool.query(refrigerantsQuery, [requestId]),
      ]);

    // Calculate subtotal from all items
    const subtotal = [
      ...servicesResult.rows,
      ...chemicalsResult.rows,
      ...refrigerantsResult.rows,
    ].reduce((sum, item) => {
      return sum + parseFloat(item.line_total || 0);
    }, 0);

    // Calculate discount
    const discountPercentage = request.discount_percentage || 0;
    const discountAmount = (subtotal * discountPercentage) / 100;
    const totalCostAfterDiscount = subtotal - discountAmount;

    // Format items for display
    const allItems = [
      ...servicesResult.rows,
      ...chemicalsResult.rows,
      ...refrigerantsResult.rows,
    ].map((item) => ({
      ...item,
      unit_price: `₱${parseFloat(item.unit_price).toLocaleString()}`,
      total_price: `₱${parseFloat(item.line_total).toLocaleString()}`,
    }));

    const paymentQuery = `
      WITH payment_total AS (
        SELECT SUM(amount) as total
        FROM payments
        WHERE request_id = $1
      )
      SELECT 
        payment_id,
        payment_phase as phase,
        CONCAT(ROUND((amount::numeric / NULLIF((SELECT total FROM payment_total), 0) * 100), 0), '%') as percentage,
        CONCAT('₱', amount::text) as amount,
        COALESCE(proof_of_payment_file, '-') as "proofOfPayment",
        CASE 
          WHEN paid_on IS NOT NULL THEN TO_CHAR(paid_on, 'Mon DD, YYYY')
          ELSE 'Pending'
        END as "paidOn",
        status as "paymentStatus"
      FROM payments
      WHERE request_id = $1
      ORDER BY payment_id
    `;

    const paymentResult = await pool.query(paymentQuery, [requestId]);

    let paymentHistory = paymentResult.rows;

    // Only create default payment history if no payments exist
    if (paymentResult.rows.length === 0) {
      const downpaymentPercent = request.downpayment_percentage || 50;
      const remainingPercent = 100 - downpaymentPercent;
      const downpaymentAmount = Math.round(
        (totalCostAfterDiscount * downpaymentPercent) / 100
      );
      const remainingAmount = totalCostAfterDiscount - downpaymentAmount;

      paymentHistory = [
        {
          payment_id: null,
          phase: "Down Payment",
          percentage: `${downpaymentPercent}%`,
          amount: `₱${downpaymentAmount.toLocaleString()}`,
          proofOfPayment: "-",
          paidOn: "Pending",
          paymentStatus: "Pending",
        },
        {
          payment_id: null,
          phase: "Completion Balance",
          percentage: `${remainingPercent}%`,
          amount: `₱${remainingAmount.toLocaleString()}`,
          proofOfPayment: "-",
          paidOn: "Pending",
          paymentStatus: "Pending",
        },
      ];
    }

    res.json({
      success: true,
      data: {
        request: {
          ...request,
          id: request.request_number,
          totalCost: `₱${totalCostAfterDiscount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          paymentHistory: paymentHistory,
        },
        items: allItems,
        statusHistory: [],
        quotation: null,
      },
    });
  } catch (error) {
    console.error("Get request details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch request details",
    });
  }
};

const getAllRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "1=1";
    let queryParams = [];

    if (status) {
      whereClause += " AND rs.status_name = $" + (queryParams.length + 1);
      queryParams.push(status);
    }

    if (search) {
      whereClause += ` AND (CONCAT(u.first_name, ' ', u.last_name) ILIKE $${
        queryParams.length + 1
      } OR sr.request_number ILIKE $${
        queryParams.length + 1
      } OR c.company_name ILIKE $${queryParams.length + 1})`;
      queryParams.push(`%${search}%`);
    }

    const query = `
      SELECT 
        sr.request_id, 
        sr.request_number, 
        rs.status_name as status,
        -- FIXED: Calculate actual total cost from all item tables
        COALESCE(
          (SELECT SUM(sri.line_total) FROM service_request_items sri WHERE sri.request_id = sr.request_id) +
          (SELECT COALESCE(SUM(src.line_total), 0) FROM service_request_chemicals src WHERE src.request_id = sr.request_id) +
          (SELECT COALESCE(SUM(srr.line_total), 0) FROM service_request_refrigerants srr WHERE srr.request_id = sr.request_id),
          sr.estimated_cost
        ) as estimated_cost,
        sr.request_date as created_at,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        c.company_name,
        CONCAT(staff.first_name, ' ', staff.last_name) as assigned_staff_name,
        sr.priority,
        -- Add service status mapping for frontend
        CASE 
          WHEN rs.status_name = 'New' THEN 'Pending'
          WHEN rs.status_name = 'Under Review' THEN 'Assigned'
          WHEN rs.status_name = 'Quote Sent' THEN 'Waiting for Approval'
          WHEN rs.status_name = 'Quote Approved' THEN 'Approved'
          WHEN rs.status_name = 'In Progress' THEN 'Ongoing'
          WHEN rs.status_name = 'Completed' THEN 'Completed'
          ELSE rs.status_name
        END as service_status,
        -- Add payment status calculation
        CASE 
          WHEN sr.payment_status IS NULL THEN 'Pending'
          ELSE sr.payment_status
        END as payment_status,
        -- Add warranty status
        CASE 
          WHEN rs.status_name = 'Completed' AND sr.warranty_start_date IS NOT NULL THEN 'Valid'
          WHEN rs.status_name = 'Completed' AND sr.warranty_start_date IS NULL THEN 'Pending'
          ELSE 'N/A'
        END as warranty_status,
        -- Add item counts for debugging
        (
          SELECT COUNT(*)::int 
          FROM service_request_items sri 
          WHERE sri.request_id = sr.request_id
        ) as services_count,
        (
          SELECT COUNT(*)::int 
          FROM service_request_chemicals src 
          WHERE src.request_id = sr.request_id
        ) as chemicals_count,
        (
          SELECT COUNT(*)::int 
          FROM service_request_refrigerants srr 
          WHERE srr.request_id = sr.request_id
        ) as refrigerants_count,
        -- Add item summary for display
        (
          SELECT STRING_AGG(
            CASE 
              WHEN item_type = 'service' THEN CONCAT(qty, 'x ', name, ' (Service)')
              WHEN item_type = 'chemical' THEN CONCAT(qty, 'x ', name, ' (Chemical)')
              WHEN item_type = 'refrigerant' THEN CONCAT(qty, 'x ', name, ' (Refrigerant)')
            END, ', '
          )
          FROM (
            SELECT 'service' as item_type, sri.quantity as qty, s.service_name as name
            FROM service_request_items sri
            JOIN services s ON sri.service_id = s.service_id
            WHERE sri.request_id = sr.request_id
            
            UNION ALL
            
            SELECT 'chemical' as item_type, src.quantity as qty, c.chemical_name as name
            FROM service_request_chemicals src
            JOIN chemicals c ON src.chemical_id = c.chemical_id
            WHERE src.request_id = sr.request_id
            
            UNION ALL
            
            SELECT 'refrigerant' as item_type, srr.quantity as qty, r.refrigerant_name as name
            FROM service_request_refrigerants srr
            JOIN refrigerants r ON srr.refrigerant_id = r.refrigerant_id
            WHERE srr.request_id = sr.request_id
          ) items_summary
        ) as items_summary
      FROM service_requests sr
      JOIN request_statuses rs ON sr.status_id = rs.status_id
      JOIN users u ON sr.requested_by_user_id = u.user_id
      JOIN companies c ON sr.company_id = c.company_id
      LEFT JOIN users staff ON sr.assigned_to_staff_id = staff.user_id
      WHERE ${whereClause}
      ORDER BY sr.request_date DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    const countQuery = `
      SELECT COUNT(*) FROM service_requests sr
      JOIN request_statuses rs ON sr.status_id = rs.status_id
      JOIN users u ON sr.requested_by_user_id = u.user_id
      JOIN companies c ON sr.company_id = c.company_id
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        requests: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service requests",
    });
  }
};

const addServicesToRequest = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { requestId } = req.params;
    const { additionalServices, adminNotes } = req.body;
    const adminId = req.user.id;

    const requestQuery = `
      SELECT sr.*, rs.status_name 
      FROM service_requests sr
      JOIN request_statuses rs ON sr.status_id = rs.status_id
      WHERE sr.request_id = $1
    `;
    const requestResult = await client.query(requestQuery, [requestId]);

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    const request = requestResult.rows[0];

    if (
      !["New", "Under Review", "Quote Prepared"].includes(request.status_name)
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot modify request in current status",
      });
    }

    let additionalCost = 0;

    for (const service of additionalServices) {
      const serviceQuery = `
        SELECT service_id, base_price FROM services 
        WHERE service_id = $1 AND is_active = true
      `;
      const serviceResult = await client.query(serviceQuery, [service.id]);

      if (serviceResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: `Service with ID ${service.id} not found`,
        });
      }

      const serviceData = serviceResult.rows[0];
      const itemTotal = serviceData.base_price * service.quantity;
      additionalCost += itemTotal;

      await client.query(
        `
        INSERT INTO service_request_items 
        (request_id, service_id, quantity, unit_price, line_total, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          requestId,
          service.id,
          service.quantity,
          serviceData.base_price,
          itemTotal,
          "Added by admin",
        ]
      );
    }

    await client.query(
      `
      UPDATE service_requests 
      SET updated_at = NOW()
      WHERE request_id = $1
    `,
      [requestId]
    );

    const quoteStatusResult = await client.query(
      "SELECT status_id FROM request_statuses WHERE status_name = $1",
      ["Quote Prepared"]
    );
    const quoteStatusId = quoteStatusResult.rows[0]?.status_id;

    if (quoteStatusId) {
      await client.query(
        `
        UPDATE service_requests 
        SET status_id = $1
        WHERE request_id = $2
      `,
        [quoteStatusId, requestId]
      );
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Additional services added successfully",
      data: {
        additionalCost: additionalCost,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Add services to request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add services to request",
    });
  } finally {
    client.release();
  }
};

const createQuotation = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { requestId } = req.params;
    const {
      discountAmount = 0,
      taxRate = 0.12,
      paymentTerms,
      paymentMode,
      validUntil,
      termsConditions,
      notes,
    } = req.body;
    const adminId = req.user.id;

    const requestQuery = `
      SELECT sr.*, calculate_request_total(sr.request_id) as subtotal,
             sr.requested_by_user_id, sr.request_number,
             u.email as customer_email,
             CONCAT(u.first_name, ' ', u.last_name) as customer_name
      FROM service_requests sr
      JOIN users u ON sr.requested_by_user_id = u.user_id
      WHERE sr.request_id = $1
    `;
    const requestResult = await client.query(requestQuery, [requestId]);

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    const request = requestResult.rows[0];
    const subtotal = parseFloat(request.subtotal);
    const discountedSubtotal = subtotal - parseFloat(discountAmount);
    const taxAmount = discountedSubtotal * parseFloat(taxRate);
    const totalAmount = discountedSubtotal + taxAmount;

    const quotationNumber = `QUOT-${new Date().getFullYear()}-${String(
      Date.now()
    ).slice(-6)}`;

    const insertQuotationQuery = `
      INSERT INTO quotations 
      (request_id, quotation_number, subtotal, tax_rate, tax_amount, 
       discount_amount, total_amount, payment_terms, payment_mode, 
       valid_until, terms_conditions, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING quotation_id
    `;

    const quotationResult = await client.query(insertQuotationQuery, [
      requestId,
      quotationNumber,
      subtotal,
      taxRate,
      taxAmount,
      discountAmount,
      totalAmount,
      paymentTerms,
      paymentMode,
      validUntil,
      termsConditions,
      adminId,
    ]);

    const quotationId = quotationResult.rows[0].quotation_id;

    const copyItemsQuery = `
      INSERT INTO quotation_items (quotation_id, service_id, item_description, quantity, unit_price, line_total, notes)
      SELECT $1, sri.service_id, s.service_name, sri.quantity, sri.unit_price, sri.line_total, sri.notes
      FROM service_request_items sri
      JOIN services s ON sri.service_id = s.service_id
      WHERE sri.request_id = $2
    `;
    await client.query(copyItemsQuery, [quotationId, requestId]);

    const quoteStatusResult = await client.query(
      "SELECT status_id FROM request_statuses WHERE status_name = $1",
      ["Quote Prepared"]
    );
    const quoteStatusId = quoteStatusResult.rows[0]?.status_id;

    if (quoteStatusId) {
      await client.query(
        `
        UPDATE service_requests 
        SET status_id = $1, quote_sent_date = NOW()
        WHERE request_id = $2
      `,
        [quoteStatusId, requestId]
      );
    }

    await client.query("COMMIT");

    // ✅ SEND NOTIFICATION TO CUSTOMER ABOUT QUOTATION
    try {
      await createServiceRequestNotification(
        request.requested_by_user_id,
        request.request_number,
        requestId,
        "Quote Prepared",
        `A quotation (${quotationNumber}) has been prepared for your service request #${
          request.request_number
        }. Total amount: ₱${totalAmount.toLocaleString()}. Please review and approve at your earliest convenience.`
      );

      console.log(`Quotation notification sent to ${request.customer_email}`);
    } catch (notifError) {
      console.error("Failed to send quotation notification:", notifError);
    }

    res.json({
      success: true,
      message: "Quotation created successfully",
      data: {
        quotationId: quotationId,
        quotationNumber: quotationNumber,
        totalAmount: totalAmount,
        discountAmount: discountAmount,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create quotation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create quotation",
    });
  } finally {
    client.release();
  }
};

const respondToQuotation = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { quotationId } = req.params;
    const { approved, customerNotes } = req.body;
    const customerId = req.user.id;

    const quotationQuery = `
      SELECT q.*, sr.requested_by_user_id, sr.request_number,
             u.email as customer_email,
             CONCAT(u.first_name, ' ', u.last_name) as customer_name
      FROM quotations q
      JOIN service_requests sr ON q.request_id = sr.request_id
      JOIN users u ON sr.requested_by_user_id = u.user_id
      WHERE q.quotation_id = $1 AND sr.requested_by_user_id = $2
    `;
    const quotationResult = await client.query(quotationQuery, [
      quotationId,
      customerId,
    ]);

    if (quotationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    const quotation = quotationResult.rows[0];
    const newQuotationStatus = approved ? "Approved" : "Rejected";
    const newRequestStatus = approved ? "Quote Approved" : "Under Review";

    await client.query(
      `
      UPDATE quotations 
      SET status = $1, approved_date = $2, approved_by_user_id = $3
      WHERE quotation_id = $4
    `,
      [
        newQuotationStatus,
        approved ? "NOW()" : null,
        approved ? customerId : null,
        quotationId,
      ]
    );

    const statusResult = await client.query(
      "SELECT status_id FROM request_statuses WHERE status_name = $1",
      [newRequestStatus]
    );
    const statusId = statusResult.rows[0]?.status_id;

    if (statusId) {
      await client.query(
        `
        UPDATE service_requests 
        SET status_id = $1, client_approved_date = $2
        WHERE request_id = $3
      `,
        [statusId, approved ? "NOW()" : null, quotation.request_id]
      );
    }

    await client.query("COMMIT");

    // ✅ SEND NOTIFICATION TO CUSTOMER ABOUT THEIR RESPONSE
    try {
      const message = approved
        ? `You have approved the quotation for service request #${quotation.request_number}. We will begin work shortly. Thank you for your confirmation!`
        : `You have rejected the quotation for service request #${quotation.request_number}. Our team will contact you to discuss alternatives and address your concerns.`;

      await createServiceRequestNotification(
        customerId,
        quotation.request_number,
        quotation.request_id,
        approved ? "Quote Approved" : "Under Review",
        message
      );

      console.log(
        `Quotation response notification sent to ${quotation.customer_email}`
      );
    } catch (notifError) {
      console.error(
        "Failed to send quotation response notification:",
        notifError
      );
    }

    // ✅ NOTIFY ADMIN/STAFF ABOUT CUSTOMER'S DECISION
    try {
      const staffQuery = `
        SELECT user_id, email FROM users 
        WHERE user_type IN ('admin', 'staff') AND status = 'Active'
      `;
      const staffResult = await pool.query(staffQuery);

      for (const staff of staffResult.rows) {
        await createNotification(
          staff.user_id,
          "Quotation Response",
          `Quotation ${approved ? "Approved" : "Rejected"} - ${
            quotation.request_number
          }`,
          `Customer ${quotation.customer_name} has ${
            approved ? "approved" : "rejected"
          } the quotation for service request #${quotation.request_number}. ${
            customerNotes ? `Note: ${customerNotes}` : ""
          }`,
          staff.email
        );
      }

      console.log(`Admin/staff notifications sent about quotation response`);
    } catch (notifError) {
      console.error("Failed to notify staff:", notifError);
    }

    res.json({
      success: true,
      message: approved
        ? "Quotation approved successfully"
        : "Quotation rejected",
      data: {
        approved: approved,
        quotationStatus: newQuotationStatus,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Respond to quotation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process quotation response",
    });
  } finally {
    client.release();
  }
};

const getServicesCatalog = async (req, res) => {
  try {
    const { category } = req.query;

    let whereClause = "s.is_active = true";
    let queryParams = [];

    if (category) {
      whereClause += " AND sc.category_name = $1";
      queryParams.push(category);
    }

    const query = `
      SELECT 
        s.service_id, 
        s.service_name as name, 
        sc.category_name as category, 
        s.base_price, 
        s.description, 
        s.estimated_duration_hours,
        s.requires_site_visit, 
        s.chemicals_required,
        s.equipment_required,
        s.service_code,
        s.price_unit
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.category_id
      WHERE ${whereClause}
      ORDER BY sc.category_name, s.service_name
    `;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get services catalog error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch services catalog",
    });
  }
};

const getChemicalsCatalog = async (req, res) => {
  try {
    const query = `
      SELECT 
        chemical_id as id, 
        CONCAT(brand, ' - ', chemical_name) as name,
        brand,
        chemical_name,
        'chemical' as category,
        price as base_price,
        description,
        capacity,
        hazard_type,
        uses,
        status,
        stock_quantity,
        supplier,
        sds_available
      FROM chemicals 
      WHERE is_active = true
      ORDER BY brand, chemical_name
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get chemicals catalog error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chemicals catalog",
    });
  }
};

const getRefrigerantsCatalog = async (req, res) => {
  try {
    const query = `
      SELECT 
        refrigerant_id as id, 
        refrigerant_name as name,
        'refrigerant' as category,
        price as base_price,
        description,
        capacity,
        hazard_type,
        chemical_components,
        status,
        stock_quantity,
        sds_file
      FROM refrigerants 
      WHERE is_active = true
      ORDER BY refrigerant_name
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get refrigerants catalog error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch refrigerants catalog",
    });
  }
};

const getServiceWithRelatedItems = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const serviceQuery = `
      SELECT 
        s.*,
        sc.category_name
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.category_id
      WHERE s.service_id = $1 AND s.is_active = true
    `;

    const chemicalsQuery = `
      SELECT 
        c.*,
        schem.quantity_required,
        schem.is_primary,
        schem.notes as junction_notes
      FROM service_chemicals schem
      JOIN chemicals c ON schem.chemical_id = c.chemical_id
      WHERE schem.service_id = $1 AND c.is_active = true
      ORDER BY schem.is_primary DESC, c.brand, c.chemical_name
    `;

    const refrigerantsQuery = `
      SELECT 
        r.*,
        sr.quantity_required,
        sr.is_alternative,
        sr.notes as junction_notes
      FROM service_refrigerants sr
      JOIN refrigerants r ON sr.refrigerant_id = r.refrigerant_id
      WHERE sr.service_id = $1 AND r.is_active = true
      ORDER BY sr.is_alternative ASC, r.refrigerant_name
    `;

    const [serviceResult, chemicalsResult, refrigerantsResult] =
      await Promise.all([
        pool.query(serviceQuery, [serviceId]),
        pool.query(chemicalsQuery, [serviceId]),
        pool.query(refrigerantsQuery, [serviceId]),
      ]);

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    res.json({
      success: true,
      data: {
        service: serviceResult.rows[0],
        relatedChemicals: chemicalsResult.rows,
        relatedRefrigerants: refrigerantsResult.rows,
      },
    });
  } catch (error) {
    console.error("Get service with related items error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service details",
    });
  }
};

const checkStockAvailability = async (req, res) => {
  try {
    const { items } = req.body;

    const stockChecks = [];

    for (const item of items) {
      if (item.type === "chemical") {
        const query = `
          SELECT chemical_id, chemical_name, stock_quantity, status
          FROM chemicals 
          WHERE chemical_id = $1 AND is_active = true
        `;
        const result = await pool.query(query, [item.id]);
        if (result.rows.length > 0) {
          const chemical = result.rows[0];
          stockChecks.push({
            type: "chemical",
            id: item.id,
            name: chemical.chemical_name,
            requestedQuantity: item.quantity,
            availableStock: chemical.stock_quantity,
            status: chemical.status,
            available:
              chemical.stock_quantity >= item.quantity &&
              chemical.status === "In stock",
          });
        }
      } else if (item.type === "refrigerant") {
        const query = `
          SELECT refrigerant_id, refrigerant_name, stock_quantity, status
          FROM refrigerants 
          WHERE refrigerant_id = $1 AND is_active = true
        `;
        const result = await pool.query(query, [item.id]);
        if (result.rows.length > 0) {
          const refrigerant = result.rows[0];
          stockChecks.push({
            type: "refrigerant",
            id: item.id,
            name: refrigerant.refrigerant_name,
            requestedQuantity: item.quantity,
            availableStock: refrigerant.stock_quantity,
            status: refrigerant.status,
            available:
              refrigerant.stock_quantity >= item.quantity &&
              refrigerant.status === "In stock",
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        stockChecks: stockChecks,
        allAvailable: stockChecks.every((check) => check.available),
      },
    });
  } catch (error) {
    console.error("Check stock availability error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check stock availability",
    });
  }
};

const debugRequestItems = async (req, res) => {
  try {
    const { requestId } = req.params;

    const servicesQuery = `
      SELECT 'service' as type, sri.*, s.service_name as name
      FROM service_request_items sri
      JOIN services s ON sri.service_id = s.service_id
      WHERE sri.request_id = $1
    `;

    const chemicalsQuery = `
      SELECT 'chemical' as type, src.*, c.chemical_name as name
      FROM service_request_chemicals src
      JOIN chemicals c ON src.chemical_id = c.chemical_id
      WHERE src.request_id = $1
    `;

    const refrigerantsQuery = `
      SELECT 'refrigerant' as type, srr.*, r.refrigerant_name as name
      FROM service_request_refrigerants srr
      JOIN refrigerants r ON srr.refrigerant_id = r.refrigerant_id
      WHERE srr.request_id = $1
    `;

    const [servicesResult, chemicalsResult, refrigerantsResult] =
      await Promise.all([
        pool.query(servicesQuery, [requestId]),
        pool.query(chemicalsQuery, [requestId]),
        pool.query(refrigerantsQuery, [requestId]),
      ]);

    res.json({
      success: true,
      data: {
        requestId: requestId,
        services: servicesResult.rows,
        chemicals: chemicalsResult.rows,
        refrigerants: refrigerantsResult.rows,
        totalItems:
          servicesResult.rows.length +
          chemicalsResult.rows.length +
          refrigerantsResult.rows.length,
        summary: {
          servicesCount: servicesResult.rows.length,
          chemicalsCount: chemicalsResult.rows.length,
          refrigerantsCount: refrigerantsResult.rows.length,
        },
      },
    });
  } catch (error) {
    console.error("Debug request items error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to debug request items",
      error: error.message,
    });
  }
};

const updateRequestStatus = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { requestId } = req.params;
    const {
      serviceStatus,
      paymentStatus,
      warrantyStatus,
      serviceStartDate,
      serviceEndDate,
      paymentBreakdown,
    } = req.body;

    const userId = req.user.id;
    const userType = req.user.userType;

    console.log("Update request:", requestId);
    console.log("New service status:", serviceStatus);

    let whereClause = "request_id = $1";
    let queryParams = [requestId];

    if (userType === "client") {
      whereClause += " AND requested_by_user_id = $2";
      queryParams.push(userId);
    }

    const requestCheck = await client.query(
      `SELECT sr.request_id, sr.status_id, rs.status_name as current_status_name
       FROM service_requests sr
       JOIN request_statuses rs ON sr.status_id = rs.status_id
       WHERE ${whereClause}`,
      queryParams
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service request not found or access denied",
      });
    }

    const currentRequest = requestCheck.rows[0];
    const currentStatusName = currentRequest.current_status_name;

    console.log("Current status in DB:", currentStatusName);

    const statusMapping = {
      Pending: "New",
      Assigned: "Under Review",
      Processing: "Quote Prepared",
      "Waiting for Approval": "Quote Sent",
      Approved: "Quote Approved",
      Ongoing: "In Progress",
      Completed: "Completed",
    };

    const statusOrder = [
      "New", // 0 - Pending
      "Under Review", // 1 - Assigned
      "Quote Prepared", // 2 - Processing
      "Quote Sent", // 3 - Waiting for Approval
      "Quote Approved", // 4 - Approved
      "In Progress", // 5 - Ongoing
      "Completed", // 6 - Completed
    ];

    let newStatusId = currentRequest.status_id;

    if (serviceStatus) {
      const backendStatus = statusMapping[serviceStatus] || serviceStatus;
      console.log("Mapped backend status:", backendStatus);

      const currentIndex = statusOrder.indexOf(currentStatusName);
      const newIndex = statusOrder.indexOf(backendStatus);

      console.log("Current index:", currentIndex, "New index:", newIndex);

      if (currentIndex === -1) {
        console.error("Current status not found in order:", currentStatusName);
      }

      if (newIndex === -1) {
        console.error("New status not found in order:", backendStatus);
      }

      if (currentIndex !== -1 && newIndex !== -1 && newIndex < currentIndex) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: `Cannot move backward from "${currentStatusName}" to "${backendStatus}". Status can only progress forward.`,
          currentStatus: currentStatusName,
          attemptedStatus: backendStatus,
        });
      }

      const statusResult = await client.query(
        "SELECT status_id FROM request_statuses WHERE status_name = $1",
        [backendStatus]
      );

      if (statusResult.rows.length > 0) {
        newStatusId = statusResult.rows[0].status_id;
      } else {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: `Invalid status: ${backendStatus}`,
        });
      }
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (newStatusId !== currentRequest.status_id) {
      updateFields.push(`status_id = $${paramCount++}`);
      updateValues.push(newStatusId);
    }

    if (paymentStatus) {
      updateFields.push(`payment_status = $${paramCount++}`);
      updateValues.push(paymentStatus);
    }

    if (serviceStartDate) {
      updateFields.push(`service_start_date = $${paramCount++}`);
      updateValues.push(serviceStartDate);
    }

    if (serviceEndDate) {
      updateFields.push(`actual_completion_date = $${paramCount++}`);
      updateValues.push(serviceEndDate);
    }

    if (serviceStatus === "Completed" && !serviceEndDate) {
      updateFields.push(`warranty_start_date = $${paramCount++}`);
      updateValues.push(new Date().toISOString().split("T")[0]);
    }

    updateFields.push(`updated_at = $${paramCount++}`);
    updateValues.push(new Date());

    updateValues.push(requestId);

    if (updateFields.length > 1) {
      const updateQuery = `
        UPDATE service_requests 
        SET ${updateFields.join(", ")}
        WHERE request_id = $${paramCount}
      `;

      await client.query(updateQuery, updateValues);

      if (newStatusId !== currentRequest.status_id) {
        await client.query(
          `
          INSERT INTO request_status_history 
          (request_id, from_status_id, to_status_id, changed_by, change_reason, changed_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `,
          [
            requestId,
            currentRequest.status_id,
            newStatusId,
            userId,
            "Status updated by admin/staff",
          ]
        );
      }
    }

    if (paymentBreakdown && Array.isArray(paymentBreakdown)) {
      for (let i = 0; i < paymentBreakdown.length; i++) {
        const payment = paymentBreakdown[i];
        if (payment.paymentStatus) {
          await client.query(
            `
            UPDATE payments 
            SET status = $1, updated_at = NOW()
            WHERE request_id = $2 AND payment_phase = $3
          `,
            [payment.paymentStatus, requestId, payment.phase]
          );
        }
      }
    }

    try {
      await supabase.from("audit_log").insert({
        table_name: "service_requests",
        record_id: requestId,
        action: "UPDATE",
        new_values: {
          service_status: serviceStatus,
          payment_status: paymentStatus,
          warranty_status: warrantyStatus,
          service_start_date: serviceStartDate,
          service_end_date: serviceEndDate,
        },
        changed_by: req.user.email,
        change_reason: "Service request status update",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Failed to log audit entry:", auditError);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Service request updated successfully",
      data: {
        requestId: requestId,
        updatedStatus: serviceStatus,
        updatedPaymentStatus: paymentStatus,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update request status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update service request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

const addChemicalsToRequest = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { requestId } = req.params;
    const { chemicals, adminNotes } = req.body;

    const requestQuery = `
      SELECT sr.*, rs.status_name 
      FROM service_requests sr
      JOIN request_statuses rs ON sr.status_id = rs.status_id
      WHERE sr.request_id = $1
    `;
    const requestResult = await client.query(requestQuery, [requestId]);

    if (requestResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    const request = requestResult.rows[0];

    if (
      !["New", "Under Review", "Quote Prepared"].includes(request.status_name)
    ) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Cannot modify request in current status",
      });
    }

    let additionalCost = 0;
    const addedChemicals = [];

    for (const chemical of chemicals) {
      const chemicalQuery = `
        SELECT chemical_id, chemical_name, brand, price 
        FROM chemicals 
        WHERE chemical_id = $1 AND is_active = true
      `;
      const chemicalResult = await client.query(chemicalQuery, [chemical.id]);

      if (chemicalResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: `Chemical with ID ${chemical.id} not found or inactive`,
        });
      }

      const chemicalData = chemicalResult.rows[0];
      const itemTotal = chemicalData.price * chemical.quantity;
      additionalCost += itemTotal;

      const insertQuery = `
        INSERT INTO service_request_chemicals 
        (request_id, chemical_id, quantity, unit_price, line_total, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING item_id
      `;

      const insertResult = await client.query(insertQuery, [
        requestId,
        chemical.id,
        chemical.quantity,
        chemicalData.price,
        itemTotal,
        adminNotes || `Added by ${req.user.email}`,
      ]);

      addedChemicals.push({
        itemId: insertResult.rows[0].item_id,
        chemicalId: chemical.id,
        name: `${chemicalData.brand} - ${chemicalData.chemical_name}`,
        quantity: chemical.quantity,
        unitPrice: chemicalData.price,
        totalPrice: itemTotal,
      });
    }

    const updateCostQuery = `
      UPDATE service_requests 
      SET estimated_cost = estimated_cost + $1,
          updated_at = NOW()
      WHERE request_id = $2
    `;
    await client.query(updateCostQuery, [additionalCost, requestId]);

    await client.query("COMMIT");

    // Recreate payments with new total (outside transaction)
    try {
      await recreatePayments(requestId);
    } catch (paymentError) {
      console.error("Failed to recreate payments:", paymentError);
      return res.status(400).json({
        success: false,
        message: paymentError.message,
      });
    }

    // Log in audit_log
    try {
      await supabase.from("audit_log").insert({
        table_name: "service_request_chemicals",
        record_id: requestId,
        action: "CREATE",
        new_values: {
          chemicals_added: addedChemicals.length,
          additional_cost: additionalCost,
          admin_notes: adminNotes,
        },
        changed_by: req.user.email,
        change_reason: "Chemicals added to service request",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Failed to log audit entry:", auditError);
    }

    res.json({
      success: true,
      message: `Successfully added ${addedChemicals.length} chemical(s) to request and updated payments`,
      data: {
        addedChemicals: addedChemicals,
        additionalCost: additionalCost,
        newTotalCost: request.estimated_cost + additionalCost,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Add chemicals to request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add chemicals to request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

// Similarly for refrigerants
const addRefrigerantsToRequest = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { requestId } = req.params;
    const { refrigerants, adminNotes } = req.body;

    const requestQuery = `
      SELECT sr.*, rs.status_name 
      FROM service_requests sr
      JOIN request_statuses rs ON sr.status_id = rs.status_id
      WHERE sr.request_id = $1
    `;
    const requestResult = await client.query(requestQuery, [requestId]);

    if (requestResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    const request = requestResult.rows[0];

    if (
      !["New", "Under Review", "Quote Prepared"].includes(request.status_name)
    ) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Cannot modify request in current status",
      });
    }

    let additionalCost = 0;
    const addedRefrigerants = [];

    for (const refrigerant of refrigerants) {
      const refrigerantQuery = `
        SELECT refrigerant_id, refrigerant_name, price 
        FROM refrigerants 
        WHERE refrigerant_id = $1 AND is_active = true
      `;
      const refrigerantResult = await client.query(refrigerantQuery, [
        refrigerant.id,
      ]);

      if (refrigerantResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: `Refrigerant with ID ${refrigerant.id} not found or inactive`,
        });
      }

      const refrigerantData = refrigerantResult.rows[0];
      const itemTotal = refrigerantData.price * refrigerant.quantity;
      additionalCost += itemTotal;

      const insertQuery = `
        INSERT INTO service_request_refrigerants 
        (request_id, refrigerant_id, quantity, unit_price, line_total, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING item_id
      `;

      const insertResult = await client.query(insertQuery, [
        requestId,
        refrigerant.id,
        refrigerant.quantity,
        refrigerantData.price,
        itemTotal,
        adminNotes || `Added by ${req.user.email}`,
      ]);

      addedRefrigerants.push({
        itemId: insertResult.rows[0].item_id,
        refrigerantId: refrigerant.id,
        name: refrigerantData.refrigerant_name,
        quantity: refrigerant.quantity,
        unitPrice: refrigerantData.price,
        totalPrice: itemTotal,
      });
    }

    const updateCostQuery = `
      UPDATE service_requests 
      SET estimated_cost = estimated_cost + $1,
          updated_at = NOW()
      WHERE request_id = $2
    `;
    await client.query(updateCostQuery, [additionalCost, requestId]);

    await client.query("COMMIT");

    // Recreate payments with new total (outside transaction)
    try {
      await recreatePayments(requestId);
    } catch (paymentError) {
      console.error("Failed to recreate payments:", paymentError);
      return res.status(400).json({
        success: false,
        message: paymentError.message,
      });
    }

    try {
      await supabase.from("audit_log").insert({
        table_name: "service_request_refrigerants",
        record_id: requestId,
        action: "CREATE",
        new_values: {
          refrigerants_added: addedRefrigerants.length,
          additional_cost: additionalCost,
          admin_notes: adminNotes,
        },
        changed_by: req.user.email,
        change_reason: "Refrigerants added to service request",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Failed to log audit entry:", auditError);
    }

    res.json({
      success: true,
      message: `Successfully added ${addedRefrigerants.length} refrigerant(s) to request and updated payments`,
      data: {
        addedRefrigerants: addedRefrigerants,
        additionalCost: additionalCost,
        newTotalCost: request.estimated_cost + additionalCost,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Add refrigerants to request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add refrigerants to request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

// Remove chemicals from service request
const removeChemicalsFromRequest = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { requestId } = req.params;
    const { chemicalItemIds } = req.body; // Array of item_ids to remove
    const adminId = req.user.id;

    if (!Array.isArray(chemicalItemIds) || chemicalItemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Chemical item IDs array is required",
      });
    }

    // Verify request exists and get current status
    const requestQuery = `
      SELECT sr.*, rs.status_name 
      FROM service_requests sr
      JOIN request_statuses rs ON sr.status_id = rs.status_id
      WHERE sr.request_id = $1
    `;
    const requestResult = await client.query(requestQuery, [requestId]);

    if (requestResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    const request = requestResult.rows[0];

    if (
      !["New", "Under Review", "Quote Prepared"].includes(request.status_name)
    ) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Cannot modify request in current status",
      });
    }

    // Get the chemicals to be removed and calculate cost reduction
    const getChemicalsQuery = `
      SELECT item_id, chemical_id, quantity, line_total
      FROM service_request_chemicals
      WHERE request_id = $1 AND item_id = ANY($2)
    `;
    const chemicalsResult = await client.query(getChemicalsQuery, [
      requestId,
      chemicalItemIds,
    ]);

    if (chemicalsResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "No chemicals found with provided IDs",
      });
    }

    const costReduction = chemicalsResult.rows.reduce(
      (sum, item) => sum + parseFloat(item.line_total),
      0
    );

    // Delete the chemicals
    const deleteQuery = `
      DELETE FROM service_request_chemicals
      WHERE request_id = $1 AND item_id = ANY($2)
      RETURNING item_id
    `;
    const deleteResult = await client.query(deleteQuery, [
      requestId,
      chemicalItemIds,
    ]);

    // Update request total cost
    const updateCostQuery = `
      UPDATE service_requests 
      SET estimated_cost = GREATEST(estimated_cost - $1, 0),
          updated_at = NOW()
      WHERE request_id = $2
      RETURNING estimated_cost
    `;
    const updateResult = await client.query(updateCostQuery, [
      costReduction,
      requestId,
    ]);

    // Log in audit_log
    try {
      await supabase.from("audit_log").insert({
        table_name: "service_request_chemicals",
        record_id: requestId,
        action: "DELETE",
        old_values: {
          chemicals_removed: deleteResult.rows.length,
          cost_reduction: costReduction,
          item_ids: chemicalItemIds,
        },
        changed_by: req.user.email,
        change_reason: "Chemicals removed from service request",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Failed to log audit entry:", auditError);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: `Successfully removed ${deleteResult.rows.length} chemical(s) from request`,
      data: {
        removedCount: deleteResult.rows.length,
        costReduction: costReduction,
        newTotalCost: updateResult.rows[0].estimated_cost,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Remove chemicals from request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove chemicals from request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

// Remove refrigerants from service request
const removeRefrigerantsFromRequest = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { requestId } = req.params;
    const { refrigerantItemIds } = req.body; // Array of item_ids to remove
    const adminId = req.user.id;

    if (!Array.isArray(refrigerantItemIds) || refrigerantItemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Refrigerant item IDs array is required",
      });
    }

    const requestQuery = `
      SELECT sr.*, rs.status_name 
      FROM service_requests sr
      JOIN request_statuses rs ON sr.status_id = rs.status_id
      WHERE sr.request_id = $1
    `;
    const requestResult = await client.query(requestQuery, [requestId]);

    if (requestResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    const request = requestResult.rows[0];

    if (
      !["New", "Under Review", "Quote Prepared"].includes(request.status_name)
    ) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Cannot modify request in current status",
      });
    }

    // Get the refrigerants to be removed and calculate cost reduction
    const getRefrigerantsQuery = `
      SELECT item_id, refrigerant_id, quantity, line_total
      FROM service_request_refrigerants
      WHERE request_id = $1 AND item_id = ANY($2)
    `;
    const refrigerantsResult = await client.query(getRefrigerantsQuery, [
      requestId,
      refrigerantItemIds,
    ]);

    if (refrigerantsResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "No refrigerants found with provided IDs",
      });
    }

    const costReduction = refrigerantsResult.rows.reduce(
      (sum, item) => sum + parseFloat(item.line_total),
      0
    );

    // Delete the refrigerants
    const deleteQuery = `
      DELETE FROM service_request_refrigerants
      WHERE request_id = $1 AND item_id = ANY($2)
      RETURNING item_id
    `;
    const deleteResult = await client.query(deleteQuery, [
      requestId,
      refrigerantItemIds,
    ]);

    // Update request total cost
    const updateCostQuery = `
      UPDATE service_requests 
      SET estimated_cost = GREATEST(estimated_cost - $1, 0),
          updated_at = NOW()
      WHERE request_id = $2
      RETURNING estimated_cost
    `;
    const updateResult = await client.query(updateCostQuery, [
      costReduction,
      requestId,
    ]);

    // Log in audit_log
    try {
      await supabase.from("audit_log").insert({
        table_name: "service_request_refrigerants",
        record_id: requestId,
        action: "DELETE",
        old_values: {
          refrigerants_removed: deleteResult.rows.length,
          cost_reduction: costReduction,
          item_ids: refrigerantItemIds,
        },
        changed_by: req.user.email,
        change_reason: "Refrigerants removed from service request",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Failed to log audit entry:", auditError);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: `Successfully removed ${deleteResult.rows.length} refrigerant(s) from request`,
      data: {
        removedCount: deleteResult.rows.length,
        costReduction: costReduction,
        newTotalCost: updateResult.rows[0].estimated_cost,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Remove refrigerants from request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove refrigerants from request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

const getStaffList = async (req, res) => {
  try {
    const query = `
      SELECT user_id, first_name, last_name, department
      FROM users 
      WHERE user_type = 'staff' AND status = 'Active'
      ORDER BY first_name, last_name
    `;

    const result = await pool.query(query);

    const staffList = result.rows.map((staff) => ({
      id: staff.user_id,
      name: `${staff.first_name} ${staff.last_name}`,
      department: staff.department,
    }));

    res.json({
      success: true,
      data: staffList,
    });
  } catch (error) {
    console.error("Get staff list error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch staff list",
    });
  }
};

const updateItemWarranty = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { requestId } = req.params;
    const { itemId, itemType, warrantyMonths, warrantyStartDate } = req.body;

    // Only allow for services
    if (itemType !== "service") {
      return res.status(400).json({
        success: false,
        message: "Warranties can only be set for services",
      });
    }

    // Calculate warranty end date
    let warrantyEndDate = null;
    if (warrantyStartDate && warrantyMonths) {
      const startDate = new Date(warrantyStartDate);
      warrantyEndDate = new Date(startDate);
      warrantyEndDate.setMonth(
        warrantyEndDate.getMonth() + parseInt(warrantyMonths)
      );
    }

    const updateQuery = `
      UPDATE service_request_items
      SET 
        warranty_months = $1,
        warranty_start_date = $2,
        warranty_end_date = $3
      WHERE item_id = $4 AND request_id = $5
      RETURNING *
    `;

    await client.query(updateQuery, [
      warrantyMonths,
      warrantyStartDate,
      warrantyEndDate,
      itemId,
      requestId,
    ]);

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Warranty updated successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update warranty error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update warranty",
    });
  } finally {
    client.release();
  }
};

const updateServiceRequest = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { requestId } = req.params;
    const {
      serviceStatus,
      paymentStatus,
      assignedStaff,
      serviceStartDate,
      services,
      paymentBreakdown,
      discount,
    } = req.body;

    const currentRequestQuery = `
      SELECT sr.assigned_to_staff_id, sr.actual_completion_date, 
             sr.request_acknowledged_date, rs.status_name as current_status_name,
             sr.requested_by_user_id, sr.request_number,
             u.email as customer_email, 
             CONCAT(u.first_name, ' ', u.last_name) as customer_name
      FROM service_requests sr
      JOIN request_statuses rs ON sr.status_id = rs.status_id
      JOIN users u ON sr.requested_by_user_id = u.user_id
      WHERE sr.request_id = $1
    `;
    const currentRequestResult = await client.query(currentRequestQuery, [
      requestId,
    ]);

    if (currentRequestResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    const currentRequest = currentRequestResult.rows[0];
    const currentStatusName = currentRequest.current_status_name;

    const statusMapping = {
      Pending: "New",
      Assigned: "Under Review",
      "Waiting for Approval": "Quote Sent",
      Approved: "Quote Approved",
      Ongoing: "In Progress",
      Completed: "Completed",
    };

    const statusOrder = [
      "New",
      "Under Review",
      "Quote Sent",
      "Quote Approved",
      "In Progress",
      "Completed",
    ];

    const backendStatus = statusMapping[serviceStatus] || serviceStatus;

    if (serviceStatus && backendStatus !== currentStatusName) {
      const currentIndex = statusOrder.indexOf(currentStatusName);
      const newIndex = statusOrder.indexOf(backendStatus);

      if (currentIndex !== -1 && newIndex !== -1 && newIndex < currentIndex) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: `Cannot move backward from "${currentStatusName}" to "${backendStatus}". Status can only progress forward.`,
          currentStatus: currentStatusName,
          attemptedStatus: backendStatus,
        });
      }
    }

    const statusResult = await client.query(
      "SELECT status_id FROM request_statuses WHERE status_name = $1",
      [backendStatus]
    );

    if (statusResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: `Invalid status: ${serviceStatus}`,
      });
    }

    const statusId = statusResult.rows[0].status_id;

    let assignedStaffId = null;
    let requestAcknowledgedDate = currentRequest.request_acknowledged_date;
    let staffName = null;

    if (assignedStaff && assignedStaff !== "Not assigned") {
      const staffResult = await client.query(
        `SELECT user_id, CONCAT(first_name, ' ', last_name) as name FROM users WHERE CONCAT(first_name, ' ', last_name) = $1`,
        [assignedStaff]
      );
      if (staffResult.rows.length > 0) {
        assignedStaffId = staffResult.rows[0].user_id;
        staffName = staffResult.rows[0].name;

        if (!currentRequest.assigned_to_staff_id && assignedStaffId) {
          requestAcknowledgedDate = new Date().toISOString().split("T")[0];
        }
      }
    }

    let actualCompletionDate = currentRequest.actual_completion_date;
    if (
      backendStatus === "Completed" &&
      !currentRequest.actual_completion_date
    ) {
      actualCompletionDate = new Date().toISOString().split("T")[0];
    }

    let discountPercentage = 0;
    if (discount && discount !== "No Discount") {
      discountPercentage = parseFloat(discount.replace("%", ""));
    }

    const updateRequestQuery = `
      UPDATE service_requests 
      SET 
        status_id = $1,
        payment_status = $2,
        assigned_to_staff_id = $3,
        service_start_date = $4,
        request_acknowledged_date = $5,
        actual_completion_date = $6,
        discount_percentage = $7,
        updated_at = NOW()
      WHERE request_id = $8
    `;

    await client.query(updateRequestQuery, [
      statusId,
      paymentStatus,
      assignedStaffId,
      serviceStartDate,
      requestAcknowledgedDate,
      actualCompletionDate,
      discountPercentage,
      requestId,
    ]);

    const hasManualWarrantyData =
      services &&
      services.length > 0 &&
      services.some((s) => s.warranty_start_date);

    if (backendStatus === "Completed" && !hasManualWarrantyData) {
      const warrantyStartDate = new Date().toISOString().split("T")[0];
      const warrantyMonths = 6;
      const warrantyEndDate = new Date();
      warrantyEndDate.setMonth(warrantyEndDate.getMonth() + warrantyMonths);

      await client.query(
        `UPDATE service_request_items
        SET warranty_months = $1, warranty_start_date = $2, warranty_end_date = $3
        WHERE request_id = $4`,
        [
          warrantyMonths,
          warrantyStartDate,
          warrantyEndDate.toISOString().split("T")[0],
          requestId,
        ]
      );

      await client.query(
        `UPDATE service_requests
        SET warranty_start_date = $1, warranty_months = $2
        WHERE request_id = $3`,
        [warrantyStartDate, warrantyMonths, requestId]
      );
    }

    if (services && services.length > 0) {
      for (const service of services) {
        if (service.itemType === "service" && service.service_id) {
          if (service.warranty_start_date) {
            const months = service.warranty_months || 6;
            const endDate = new Date(service.warranty_start_date);
            endDate.setMonth(endDate.getMonth() + months);
            const warrantyEndDate = endDate.toISOString().split("T")[0];

            await client.query(
              `UPDATE service_request_items
              SET warranty_months = $1, warranty_start_date = $2, warranty_end_date = $3
              WHERE request_id = $4 AND service_id = $5`,
              [
                months,
                service.warranty_start_date,
                warrantyEndDate,
                requestId,
                service.service_id,
              ]
            );
          }
        }
      }
    }

    if (paymentBreakdown && paymentBreakdown.length > 0) {
      for (const payment of paymentBreakdown) {
        await client.query(
          `UPDATE payments
          SET status = $1,
              paid_on = CASE WHEN $1 = 'Paid' THEN NOW() ELSE paid_on END,
              updated_at = NOW()
          WHERE request_id = $2 AND payment_phase = $3`,
          [payment.paymentStatus, requestId, payment.phase]
        );
      }
    }

    await client.query("COMMIT");

    try {
      if (backendStatus !== currentStatusName) {
        let notificationMessage = `Your service request #${currentRequest.request_number} status has been updated to ${serviceStatus}.`;

        if (assignedStaffId && staffName) {
          notificationMessage += ` Assigned to: ${staffName}.`;
        }

        if (backendStatus === "In Progress" && serviceStartDate) {
          notificationMessage += ` Service will begin on ${new Date(
            serviceStartDate
          ).toLocaleDateString()}.`;
        }

        if (backendStatus === "Completed") {
          notificationMessage += ` Thank you for choosing our services!`;
        }

        await createServiceRequestNotification(
          currentRequest.requested_by_user_id,
          currentRequest.request_number,
          requestId,
          serviceStatus,
          notificationMessage
        );

        console.log(
          `Status update notification sent to ${currentRequest.customer_email}`
        );
      }

      if (
        assignedStaffId &&
        assignedStaffId !== currentRequest.assigned_to_staff_id &&
        staffName
      ) {
        await createServiceRequestNotification(
          currentRequest.requested_by_user_id,
          currentRequest.request_number,
          requestId,
          "Assigned",
          `Your service request #${currentRequest.request_number} has been assigned to ${staffName}. They will contact you shortly to discuss the service details.`
        );

        console.log(
          `Staff assignment notification sent to ${currentRequest.customer_email}`
        );
      }

      if (paymentBreakdown && paymentBreakdown.length > 0) {
        const paidPayments = paymentBreakdown.filter(
          (p) => p.paymentStatus === "Paid"
        );
        if (paidPayments.length > 0) {
          const paidPhases = paidPayments.map((p) => p.phase).join(", ");
          await createServiceRequestNotification(
            currentRequest.requested_by_user_id,
            currentRequest.request_number,
            requestId,
            "Payment Confirmed",
            `Payment received for service request #${currentRequest.request_number}. Phase(s): ${paidPhases}. Thank you!`
          );

          console.log("Payment notification sent to customer");
        }
      }
    } catch (notifError) {
      console.error("Failed to create customer notification:", notifError);
    }

    res.json({
      success: true,
      message: "Service request updated successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update service request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update service request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

const setServiceWarranty = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { requestId } = req.params;
    const {
      warrantyStartDate,
      warrantyMonths = 6, // Default 6 months
      applyToAllServices = true,
    } = req.body;

    // Verify request exists and is completed
    const requestQuery = `
      SELECT sr.request_id, rs.status_name
      FROM service_requests sr
      JOIN request_statuses rs ON sr.status_id = rs.status_id
      WHERE sr.request_id = $1
    `;
    const requestResult = await client.query(requestQuery, [requestId]);

    if (requestResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    const request = requestResult.rows[0];

    // Only allow setting warranty for completed services
    if (request.status_name !== "Completed") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Warranty can only be set for completed service requests",
      });
    }

    const startDate =
      warrantyStartDate || new Date().toISOString().split("T")[0];

    // Calculate warranty end date
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + parseInt(warrantyMonths));
    const warrantyEndDate = endDate.toISOString().split("T")[0];

    // Update ALL service items in the request with warranty information
    const updateQuery = `
      UPDATE service_request_items
      SET 
        warranty_months = $1,
        warranty_start_date = $2,
        warranty_end_date = $3
      WHERE request_id = $4
      RETURNING item_id, service_id
    `;

    const updateResult = await client.query(updateQuery, [
      warrantyMonths,
      startDate,
      warrantyEndDate,
      requestId,
    ]);

    // Also update the service_requests table
    await client.query(
      `
      UPDATE service_requests
      SET 
        warranty_start_date = $1,
        warranty_months = $2
      WHERE request_id = $3
    `,
      [startDate, warrantyMonths, requestId]
    );

    // Log audit entry
    try {
      await supabase.from("audit_log").insert({
        table_name: "service_request_items",
        record_id: requestId,
        action: "UPDATE",
        new_values: {
          warranty_set: true,
          warranty_start_date: startDate,
          warranty_months: warrantyMonths,
          warranty_end_date: warrantyEndDate,
          items_updated: updateResult.rows.length,
        },
        changed_by: req.user.email,
        change_reason: "Warranty activated for completed service",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Failed to log audit entry:", auditError);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: `Warranty set successfully for ${updateResult.rows.length} service(s)`,
      data: {
        warrantyStartDate: startDate,
        warrantyEndDate: warrantyEndDate,
        warrantyMonths: warrantyMonths,
        servicesUpdated: updateResult.rows.length,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Set service warranty error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set warranty",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

// Add this function to update individual service item warranty
const updateIndividualServiceWarranty = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { requestId, itemId } = req.params;
    const { warrantyMonths, warrantyStartDate } = req.body;

    if (!warrantyMonths || !warrantyStartDate) {
      return res.status(400).json({
        success: false,
        message: "Warranty months and start date are required",
      });
    }

    // Calculate warranty end date
    const startDate = new Date(warrantyStartDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + parseInt(warrantyMonths));
    const warrantyEndDate = endDate.toISOString().split("T")[0];

    // Update specific service item
    const updateQuery = `
      UPDATE service_request_items
      SET 
        warranty_months = $1,
        warranty_start_date = $2,
        warranty_end_date = $3
      WHERE item_id = $4 AND request_id = $5
      RETURNING item_id, service_id
    `;

    const result = await client.query(updateQuery, [
      warrantyMonths,
      warrantyStartDate,
      warrantyEndDate,
      itemId,
      requestId,
    ]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Service item not found",
      });
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Service warranty updated successfully",
      data: {
        warrantyStartDate: warrantyStartDate,
        warrantyEndDate: warrantyEndDate,
        warrantyMonths: warrantyMonths,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update individual service warranty error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update service warranty",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  createServiceRequest,
  getCustomerRequests,
  getRequestDetails,
  debugRequestItems,
  getAllRequests,
  addServicesToRequest,
  createQuotation,
  respondToQuotation,
  getServicesCatalog,
  getChemicalsCatalog,
  getRefrigerantsCatalog,
  getServiceWithRelatedItems,
  checkStockAvailability,
  updateRequestStatus,
  addChemicalsToRequest,
  addRefrigerantsToRequest,
  removeChemicalsFromRequest,
  removeRefrigerantsFromRequest,
  getStaffList,
  updateItemWarranty,
  updateServiceRequest,
  setServiceWarranty,
  updateIndividualServiceWarranty,
};
