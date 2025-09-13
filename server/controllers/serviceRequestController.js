const { createClient } = require('@supabase/supabase-js');
const pool = require('../config/database');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const createServiceRequest = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      selectedServices, 
      paymentMode,
      paymentTerms,
      downpayment,
      remarks,
      siteLocation,
      preferredSchedule,
      specialRequirements
    } = req.body;

    const customerId = req.user.id;
    const companyId = req.user.companyId;

    if (!selectedServices || selectedServices.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one service must be selected'
      });
    }

    const requestNumberResult = await client.query('SELECT generate_request_number() as request_number');
    const requestNumber = requestNumberResult.rows[0].request_number;

    let totalCost = 0;
    let estimatedDuration = 0;
    const serviceDetails = [];

    for (const service of selectedServices) {
      const serviceQuery = `
        SELECT service_id, service_name, base_price, estimated_duration_hours 
        FROM services 
        WHERE service_id = $1 AND is_active = true
      `;
      const serviceResult = await client.query(serviceQuery, [service.id]);
      
      if (serviceResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Service with ID ${service.id} not found`
        });
      }

      const serviceData = serviceResult.rows[0];
      const itemTotal = serviceData.base_price * service.quantity;
      totalCost += itemTotal;
      
      const serviceDays = Math.ceil(serviceData.estimated_duration_hours / 8);
      estimatedDuration = Math.max(estimatedDuration, serviceDays);

      serviceDetails.push({
        serviceId: serviceData.service_id,
        quantity: service.quantity,
        unitPrice: serviceData.base_price,
        totalPrice: itemTotal
      });
    }

    const statusResult = await client.query('SELECT status_id FROM request_statuses WHERE status_name = $1', ['New']);
    const initialStatusId = statusResult.rows[0]?.status_id || 1;

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
      requestNumber, companyId, customerId, initialStatusId,
      'Service request from customer portal', siteLocation, preferredSchedule,
      specialRequirements, remarks, totalCost, estimatedDuration,
      paymentMode, paymentTerms, downpayment
    ]);

    const requestId = requestResult.rows[0].request_id;

    for (const service of serviceDetails) {
      const insertItemQuery = `
        INSERT INTO service_request_items 
        (request_id, service_id, quantity, unit_price, line_total)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await client.query(insertItemQuery, [
        requestId, service.serviceId, service.quantity, 
        service.unitPrice, service.totalPrice
      ]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Service request created successfully',
      data: {
        requestId: requestId,
        requestNumber: requestNumber,
        totalCost: totalCost,
        estimatedDuration: estimatedDuration
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create service request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service request'
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
        sr.request_id, sr.request_number, rs.status_name as status, 
        sr.estimated_cost, sr.request_date as created_at,
        sr.target_completion_date, sr.estimated_duration_days,
        CONCAT(staff.first_name, ' ', staff.last_name) as assigned_staff_name,
        sr.payment_mode, sr.payment_terms, sr.downpayment_percentage
      FROM service_requests sr
      JOIN request_statuses rs ON sr.status_id = rs.status_id
      LEFT JOIN users staff ON sr.assigned_to_staff_id = staff.user_id
      WHERE sr.requested_by_user_id = $1
      ORDER BY sr.request_date DESC
    `;

    const result = await pool.query(query, [customerId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get customer requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service requests'
    });
  }
};

const getRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType;

    let whereClause = 'sr.request_id = $1';
    let queryParams = [requestId];

    if (userType === 'client') {
      whereClause += ' AND sr.requested_by_user_id = $2';
      queryParams.push(userId);
    }

    const requestQuery = `
      SELECT 
        sr.*, rs.status_name,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        c.company_name,
        CONCAT(staff.first_name, ' ', staff.last_name) as assigned_staff_name
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
        message: 'Service request not found'
      });
    }

    const request = requestResult.rows[0];

    const itemsQuery = `
      SELECT 
        sri.*, s.service_name, sc.category_name as category
      FROM service_request_items sri
      JOIN services s ON sri.service_id = s.service_id
      LEFT JOIN service_categories sc ON s.category_id = sc.category_id
      WHERE sri.request_id = $1
      ORDER BY sri.item_id
    `;
    const itemsResult = await pool.query(itemsQuery, [requestId]);

    const historyQuery = `
      SELECT 
        rsh.*, 
        rs_from.status_name as from_status,
        rs_to.status_name as to_status,
        CONCAT(u.first_name, ' ', u.last_name) as changed_by_name
      FROM request_status_history rsh
      LEFT JOIN request_statuses rs_from ON rsh.from_status_id = rs_from.status_id
      JOIN request_statuses rs_to ON rsh.to_status_id = rs_to.status_id
      LEFT JOIN users u ON rsh.changed_by = u.user_id
      WHERE rsh.request_id = $1
      ORDER BY rsh.changed_at DESC
    `;
    const historyResult = await pool.query(historyQuery, [requestId]);

    const quotationQuery = `
      SELECT q.*, CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM quotations q
      LEFT JOIN users u ON q.created_by = u.user_id
      WHERE q.request_id = $1
      ORDER BY q.created_at DESC
      LIMIT 1
    `;
    const quotationResult = await pool.query(quotationQuery, [requestId]);

    res.json({
      success: true,
      data: {
        request: request,
        items: itemsResult.rows,
        statusHistory: historyResult.rows,
        quotation: quotationResult.rows[0] || null
      }
    });

  } catch (error) {
    console.error('Get request details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch request details'
    });
  }
};

const getAllRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    let queryParams = [];
    
    if (status) {
      whereClause += ' AND rs.status_name = $1';
      queryParams.push(status);
    }

    const query = `
      SELECT 
        sr.request_id, sr.request_number, rs.status_name as status,
        sr.estimated_cost, sr.request_date as created_at,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        c.company_name,
        CONCAT(staff.first_name, ' ', staff.last_name) as assigned_staff_name,
        sr.priority
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
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service requests'
    });
  }
};

const addServicesToRequest = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

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
        message: 'Service request not found'
      });
    }

    const request = requestResult.rows[0];

    if (!['New', 'Under Review', 'Quote Prepared'].includes(request.status_name)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify request in current status'
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
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Service with ID ${service.id} not found`
        });
      }

      const serviceData = serviceResult.rows[0];
      const itemTotal = serviceData.base_price * service.quantity;
      additionalCost += itemTotal;

      await client.query(`
        INSERT INTO service_request_items 
        (request_id, service_id, quantity, unit_price, line_total, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [requestId, service.id, service.quantity, serviceData.base_price, itemTotal, 'Added by admin']);
    }

    await client.query(`
      UPDATE service_requests 
      SET updated_at = NOW()
      WHERE request_id = $1
    `, [requestId]);

    const quoteStatusResult = await client.query('SELECT status_id FROM request_statuses WHERE status_name = $1', ['Quote Prepared']);
    const quoteStatusId = quoteStatusResult.rows[0]?.status_id;

    if (quoteStatusId) {
      await client.query(`
        UPDATE service_requests 
        SET status_id = $1
        WHERE request_id = $2
      `, [quoteStatusId, requestId]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Additional services added successfully',
      data: {
        additionalCost: additionalCost
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add services to request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add services to request'
    });
  } finally {
    client.release();
  }
};

const createQuotation = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { requestId } = req.params;
    const { 
      discountAmount = 0, 
      taxRate = 0.12, 
      paymentTerms, 
      paymentMode,
      validUntil,
      termsConditions,
      notes
    } = req.body;
    const adminId = req.user.id;

    const requestQuery = `
      SELECT sr.*, calculate_request_total(sr.request_id) as subtotal
      FROM service_requests sr
      WHERE sr.request_id = $1
    `;
    const requestResult = await client.query(requestQuery, [requestId]);
    
    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    const request = requestResult.rows[0];
    const subtotal = parseFloat(request.subtotal);
    const discountedSubtotal = subtotal - parseFloat(discountAmount);
    const taxAmount = discountedSubtotal * parseFloat(taxRate);
    const totalAmount = discountedSubtotal + taxAmount;

    const quotationNumber = `QUOT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const insertQuotationQuery = `
      INSERT INTO quotations 
      (request_id, quotation_number, subtotal, tax_rate, tax_amount, 
       discount_amount, total_amount, payment_terms, payment_mode, 
       valid_until, terms_conditions, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING quotation_id
    `;

    const quotationResult = await client.query(insertQuotationQuery, [
      requestId, quotationNumber, subtotal, taxRate, taxAmount,
      discountAmount, totalAmount, paymentTerms, paymentMode,
      validUntil, termsConditions, adminId
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

    const quoteStatusResult = await client.query('SELECT status_id FROM request_statuses WHERE status_name = $1', ['Quote Prepared']);
    const quoteStatusId = quoteStatusResult.rows[0]?.status_id;

    if (quoteStatusId) {
      await client.query(`
        UPDATE service_requests 
        SET status_id = $1, quote_sent_date = NOW()
        WHERE request_id = $2
      `, [quoteStatusId, requestId]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Quotation created successfully',
      data: {
        quotationId: quotationId,
        quotationNumber: quotationNumber,
        totalAmount: totalAmount,
        discountAmount: discountAmount
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create quotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quotation'
    });
  } finally {
    client.release();
  }
};

const respondToQuotation = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { quotationId } = req.params;
    const { approved, customerNotes } = req.body;
    const customerId = req.user.id;

    const quotationQuery = `
      SELECT q.*, sr.requested_by_user_id 
      FROM quotations q
      JOIN service_requests sr ON q.request_id = sr.request_id
      WHERE q.quotation_id = $1 AND sr.requested_by_user_id = $2
    `;
    const quotationResult = await client.query(quotationQuery, [quotationId, customerId]);
    
    if (quotationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const quotation = quotationResult.rows[0];
    const newQuotationStatus = approved ? 'Approved' : 'Rejected';
    const newRequestStatus = approved ? 'Quote Approved' : 'Under Review';

    await client.query(`
      UPDATE quotations 
      SET status = $1, approved_date = $2, approved_by_user_id = $3
      WHERE quotation_id = $4
    `, [newQuotationStatus, approved ? 'NOW()' : null, approved ? customerId : null, quotationId]);

    const statusResult = await client.query('SELECT status_id FROM request_statuses WHERE status_name = $1', [newRequestStatus]);
    const statusId = statusResult.rows[0]?.status_id;

    if (statusId) {
      await client.query(`
        UPDATE service_requests 
        SET status_id = $1, client_approved_date = $2
        WHERE request_id = $3
      `, [statusId, approved ? 'NOW()' : null, quotation.request_id]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: approved ? 'Quotation approved successfully' : 'Quotation rejected',
      data: {
        approved: approved,
        quotationStatus: newQuotationStatus
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Respond to quotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process quotation response'
    });
  } finally {
    client.release();
  }
};

const getServicesCatalog = async (req, res) => {
  try {
    const { category } = req.query;
    
    let whereClause = 's.is_active = true';
    let queryParams = [];
    
    if (category) {
      whereClause += ' AND sc.category_name = $1';
      queryParams.push(category);
    }

    const query = `
      SELECT 
        s.service_id, s.service_name as name, sc.category_name as category, 
        s.base_price, s.description, s.estimated_duration_hours,
        s.requires_site_visit, s.chemicals_required
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.category_id
      WHERE ${whereClause}
      ORDER BY sc.category_name, s.service_name
    `;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get services catalog error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services catalog'
    });
  }
};

const getChemicalsCatalog = async (req, res) => {
  try {
    const query = `
      SELECT 
        chemical_id as id, 
        CONCAT(brand, ' - ', chemical_name) as name,
        'chemical' as category,
        price as base_price,
        description,
        capacity,
        hazard_type,
        uses
      FROM chemicals 
      WHERE is_active = true
      ORDER BY brand, chemical_name
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get chemicals catalog error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chemicals catalog'
    });
  }
};

module.exports = {
  createServiceRequest,
  getCustomerRequests,
  getRequestDetails,
  getAllRequests,
  addServicesToRequest,
  createQuotation,
  respondToQuotation,
  getServicesCatalog,
  getChemicalsCatalog
};