const pool = require("../config/database");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// SERVICES MANAGEMENT
// ============================================

const getAllServices = async (req, res) => {
  try {
    const query = `
      SELECT 
        s.service_id,
        s.service_name,
        s.service_code,
        s.description,
        s.base_price,
        s.price_unit,
        s.estimated_duration_hours,
        s.requires_site_visit,
        s.chemicals_required,
        s.equipment_required,
        s.is_active,
        sc.category_id,
        sc.category_name,
        s.created_at,
        s.updated_at
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.category_id
      ORDER BY sc.category_name, s.service_name
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch services",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getServiceCategories = async (req, res) => {
  try {
    const query = `
      SELECT category_id, category_name, description, is_active
      FROM service_categories
      WHERE is_active = true
      ORDER BY category_name
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch service categories",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateService = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { serviceId } = req.params;
    const {
      service_name,
      description,
      base_price,
      price_unit,
      estimated_duration_hours,
      category_id,
      requires_site_visit,
      chemicals_required,
      equipment_required,
      is_active,
    } = req.body;

    const getOldDataQuery = `
      SELECT * FROM services WHERE service_id = $1
    `;
    const oldData = await client.query(getOldDataQuery, [serviceId]);

    if (oldData.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const updateQuery = `
      UPDATE services
      SET 
        service_name = COALESCE($1, service_name),
        description = COALESCE($2, description),
        base_price = COALESCE($3, base_price),
        price_unit = COALESCE($4, price_unit),
        estimated_duration_hours = COALESCE($5, estimated_duration_hours),
        category_id = COALESCE($6, category_id),
        requires_site_visit = COALESCE($7, requires_site_visit),
        chemicals_required = COALESCE($8, chemicals_required),
        equipment_required = COALESCE($9, equipment_required),
        is_active = COALESCE($10, is_active),
        updated_at = NOW()
      WHERE service_id = $11
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      service_name,
      description,
      base_price,
      price_unit,
      estimated_duration_hours,
      category_id,
      requires_site_visit,
      chemicals_required,
      equipment_required,
      is_active,
      serviceId,
    ]);

    try {
      await supabase.from("audit_log").insert({
        table_name: "services",
        record_id: serviceId,
        action: "UPDATE",
        old_values: oldData.rows[0],
        new_values: result.rows[0],
        changed_by: req.user.email,
        change_reason: "Service updated via customization panel",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Audit log error:", auditError);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Service updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({
      success: false,
      message: "Failed to update service",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

const createService = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      service_name,
      service_code,
      description,
      base_price,
      price_unit,
      estimated_duration_hours,
      category_id,
      requires_site_visit,
      chemicals_required,
      equipment_required,
    } = req.body;

    if (!service_name || !base_price) {
      return res.status(400).json({
        success: false,
        message: "Service name and base price are required",
      });
    }

    const insertQuery = `
      INSERT INTO services (
        service_name,
        service_code,
        description,
        base_price,
        price_unit,
        estimated_duration_hours,
        category_id,
        requires_site_visit,
        chemicals_required,
        equipment_required,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW(), NOW())
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      service_name,
      service_code,
      description,
      base_price,
      price_unit || "per service",
      estimated_duration_hours,
      category_id,
      requires_site_visit || false,
      chemicals_required,
      equipment_required,
    ]);

    try {
      await supabase.from("audit_log").insert({
        table_name: "services",
        record_id: result.rows[0].service_id,
        action: "CREATE",
        new_values: result.rows[0],
        changed_by: req.user.email,
        change_reason: "New service created via customization panel",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Audit log error:", auditError);
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({
      success: false,
      message: "Failed to create service",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

// ============================================
// CHEMICALS MANAGEMENT
// ============================================

const getAllChemicals = async (req, res) => {
  try {
    const query = `
      SELECT 
        chemical_id,
        brand,
        chemical_name,
        description,
        capacity,
        price,
        hazard_type,
        stock_quantity,
        status,
        uses,
        supplier,
        sds_available,
        is_active,
        created_at,
        updated_at
      FROM chemicals
      ORDER BY brand, chemical_name
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch chemicals",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateChemical = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { chemicalId } = req.params;
    const {
      brand,
      chemical_name,
      description,
      capacity,
      price,
      hazard_type,
      stock_quantity,
      status,
      uses,
      supplier,
      sds_available,
      is_active,
    } = req.body;

    const getOldDataQuery = `
      SELECT * FROM chemicals WHERE chemical_id = $1
    `;
    const oldData = await client.query(getOldDataQuery, [chemicalId]);

    if (oldData.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Chemical not found",
      });
    }

    const updateQuery = `
      UPDATE chemicals
      SET 
        brand = COALESCE($1, brand),
        chemical_name = COALESCE($2, chemical_name),
        description = COALESCE($3, description),
        capacity = COALESCE($4, capacity),
        price = COALESCE($5, price),
        hazard_type = COALESCE($6, hazard_type),
        stock_quantity = COALESCE($7, stock_quantity),
        status = COALESCE($8, status),
        uses = COALESCE($9, uses),
        supplier = COALESCE($10, supplier),
        sds_available = COALESCE($11, sds_available),
        is_active = COALESCE($12, is_active),
        updated_at = NOW()
      WHERE chemical_id = $13
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      brand,
      chemical_name,
      description,
      capacity,
      price,
      hazard_type,
      stock_quantity,
      status,
      uses,
      supplier,
      sds_available,
      is_active,
      chemicalId,
    ]);

    try {
      await supabase.from("audit_log").insert({
        table_name: "chemicals",
        record_id: chemicalId,
        action: "UPDATE",
        old_values: oldData.rows[0],
        new_values: result.rows[0],
        changed_by: req.user.email,
        change_reason: "Chemical updated via customization panel",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Audit log error:", auditError);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Chemical updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({
      success: false,
      message: "Failed to update chemical",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

const createChemical = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      brand,
      chemical_name,
      description,
      capacity,
      price,
      hazard_type,
      stock_quantity,
      status,
      uses,
      supplier,
      sds_available,
    } = req.body;

    if (!brand || !chemical_name || !capacity || !price) {
      return res.status(400).json({
        success: false,
        message: "Brand, chemical name, capacity, and price are required",
      });
    }

    const insertQuery = `
      INSERT INTO chemicals (
        brand,
        chemical_name,
        description,
        capacity,
        price,
        hazard_type,
        stock_quantity,
        status,
        uses,
        supplier,
        sds_available,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW(), NOW())
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      brand,
      chemical_name,
      description,
      capacity,
      price,
      hazard_type,
      stock_quantity || 0,
      status || "In stock",
      uses,
      supplier,
      sds_available || false,
    ]);

    try {
      await supabase.from("audit_log").insert({
        table_name: "chemicals",
        record_id: result.rows[0].chemical_id,
        action: "CREATE",
        new_values: result.rows[0],
        changed_by: req.user.email,
        change_reason: "New chemical created via customization panel",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Audit log error:", auditError);
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Chemical created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({
      success: false,
      message: "Failed to create chemical",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

// ============================================
// REFRIGERANTS MANAGEMENT
// ============================================

const getAllRefrigerants = async (req, res) => {
  try {
    const query = `
      SELECT 
        refrigerant_id,
        refrigerant_name,
        chemical_components,
        capacity,
        price,
        hazard_type,
        description,
        stock_quantity,
        status,
        sds_file,
        is_active,
        created_at,
        updated_at
      FROM refrigerants
      ORDER BY refrigerant_name
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch refrigerants",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateRefrigerant = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { refrigerantId } = req.params;
    const {
      refrigerant_name,
      chemical_components,
      capacity,
      price,
      hazard_type,
      description,
      stock_quantity,
      status,
      sds_file,
      is_active,
    } = req.body;

    const getOldDataQuery = `
      SELECT * FROM refrigerants WHERE refrigerant_id = $1
    `;
    const oldData = await client.query(getOldDataQuery, [refrigerantId]);

    if (oldData.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Refrigerant not found",
      });
    }

    const updateQuery = `
      UPDATE refrigerants
      SET 
        refrigerant_name = COALESCE($1, refrigerant_name),
        chemical_components = COALESCE($2, chemical_components),
        capacity = COALESCE($3, capacity),
        price = COALESCE($4, price),
        hazard_type = COALESCE($5, hazard_type),
        description = COALESCE($6, description),
        stock_quantity = COALESCE($7, stock_quantity),
        status = COALESCE($8, status),
        sds_file = COALESCE($9, sds_file),
        is_active = COALESCE($10, is_active),
        updated_at = NOW()
      WHERE refrigerant_id = $11
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      refrigerant_name,
      chemical_components,
      capacity,
      price,
      hazard_type,
      description,
      stock_quantity,
      status,
      sds_file,
      is_active,
      refrigerantId,
    ]);

    try {
      await supabase.from("audit_log").insert({
        table_name: "refrigerants",
        record_id: refrigerantId,
        action: "UPDATE",
        old_values: oldData.rows[0],
        new_values: result.rows[0],
        changed_by: req.user.email,
        change_reason: "Refrigerant updated via customization panel",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Audit log error:", auditError);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Refrigerant updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({
      success: false,
      message: "Failed to update refrigerant",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

const createRefrigerant = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      refrigerant_name,
      chemical_components,
      capacity,
      price,
      hazard_type,
      description,
      stock_quantity,
      status,
      sds_file,
    } = req.body;

    if (!refrigerant_name || !capacity || !price) {
      return res.status(400).json({
        success: false,
        message: "Refrigerant name, capacity, and price are required",
      });
    }

    const insertQuery = `
      INSERT INTO refrigerants (
        refrigerant_name,
        chemical_components,
        capacity,
        price,
        hazard_type,
        description,
        stock_quantity,
        status,
        sds_file,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      refrigerant_name,
      chemical_components,
      capacity,
      price,
      hazard_type,
      description,
      stock_quantity || 0,
      status || "In stock",
      sds_file,
    ]);

    try {
      await supabase.from("audit_log").insert({
        table_name: "refrigerants",
        record_id: result.rows[0].refrigerant_id,
        action: "CREATE",
        new_values: result.rows[0],
        changed_by: req.user.email,
        change_reason: "New refrigerant created via customization panel",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Audit log error:", auditError);
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Refrigerant created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({
      success: false,
      message: "Failed to create refrigerant",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

// ============================================
// CHATBOT MANAGEMENT
// ============================================

const getChatIntents = async (req, res) => {
  try {
    const query = `
      SELECT 
        intent_id,
        intent_name,
        description,
        keywords,
        responses,
        is_active,
        priority,
        created_at,
        updated_at
      FROM chat_intents
      ORDER BY priority DESC, intent_name
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat intents",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateChatIntent = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { intentId } = req.params;
    const { intent_name, description, keywords, responses, is_active, priority } = req.body;

    const getOldDataQuery = `
      SELECT * FROM chat_intents WHERE intent_id = $1
    `;
    const oldData = await client.query(getOldDataQuery, [intentId]);

    if (oldData.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Chat intent not found",
      });
    }

    const updateQuery = `
      UPDATE chat_intents
      SET 
        intent_name = COALESCE($1, intent_name),
        description = COALESCE($2, description),
        keywords = COALESCE($3, keywords),
        responses = COALESCE($4, responses),
        is_active = COALESCE($5, is_active),
        priority = COALESCE($6, priority),
        updated_at = NOW()
      WHERE intent_id = $7
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      intent_name,
      description,
      keywords,
      responses,
      is_active,
      priority,
      intentId,
    ]);

    try {
      await supabase.from("audit_log").insert({
        table_name: "chat_intents",
        record_id: intentId,
        action: "UPDATE",
        old_values: oldData.rows[0],
        new_values: result.rows[0],
        changed_by: req.user.email,
        change_reason: "Chat intent updated via customization panel",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Audit log error:", auditError);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Chat intent updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({
      success: false,
      message: "Failed to update chat intent",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

const createChatIntent = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { intent_name, description, keywords, responses, priority } = req.body;

    if (!intent_name || !keywords || !responses) {
      return res.status(400).json({
        success: false,
        message: "Intent name, keywords, and responses are required",
      });
    }

    const insertQuery = `
      INSERT INTO chat_intents (
        intent_name,
        description,
        keywords,
        responses,
        is_active,
        priority,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, true, $5, NOW(), NOW())
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      intent_name,
      description,
      keywords,
      responses,
      priority || 0,
    ]);

    try {
      await supabase.from("audit_log").insert({
        table_name: "chat_intents",
        record_id: result.rows[0].intent_id,
        action: "CREATE",
        new_values: result.rows[0],
        changed_by: req.user.email,
        change_reason: "New chat intent created via customization panel",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Audit log error:", auditError);
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Chat intent created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({
      success: false,
      message: "Failed to create chat intent",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

const getQuickActions = async (req, res) => {
  try {
    const query = `
      SELECT 
        action_id,
        action_text,
        response_text,
        is_active,
        sort_order,
        created_at
      FROM chat_quick_actions
      ORDER BY sort_order, action_text
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch quick actions",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateQuickAction = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { actionId } = req.params;
    const { action_text, response_text, is_active, sort_order } = req.body;

    const getOldDataQuery = `
      SELECT * FROM chat_quick_actions WHERE action_id = $1
    `;
    const oldData = await client.query(getOldDataQuery, [actionId]);

    if (oldData.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Quick action not found",
      });
    }

    const updateQuery = `
      UPDATE chat_quick_actions
      SET 
        action_text = COALESCE($1, action_text),
        response_text = COALESCE($2, response_text),
        is_active = COALESCE($3, is_active),
        sort_order = COALESCE($4, sort_order)
      WHERE action_id = $5
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      action_text,
      response_text,
      is_active,
      sort_order,
      actionId,
    ]);

    try {
      await supabase.from("audit_log").insert({
        table_name: "chat_quick_actions",
        record_id: actionId,
        action: "UPDATE",
        old_values: oldData.rows[0],
        new_values: result.rows[0],
        changed_by: req.user.email,
        change_reason: "Quick action updated via customization panel",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Audit log error:", auditError);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Quick action updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({
      success: false,
      message: "Failed to update quick action",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

const createQuickAction = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { action_text, response_text, sort_order } = req.body;

    if (!action_text || !response_text) {
      return res.status(400).json({
        success: false,
        message: "Action text and response text are required",
      });
    }

    const insertQuery = `
      INSERT INTO chat_quick_actions (
        action_text,
        response_text,
        is_active,
        sort_order,
        created_at
      ) VALUES ($1, $2, true, $3, NOW())
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      action_text,
      response_text,
      sort_order || 0,
    ]);

    try {
      await supabase.from("audit_log").insert({
        table_name: "chat_quick_actions",
        record_id: result.rows[0].action_id,
        action: "CREATE",
        new_values: result.rows[0],
        changed_by: req.user.email,
        change_reason: "New quick action created via customization panel",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Audit log error:", auditError);
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Quick action created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({
      success: false,
      message: "Failed to create quick action",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};
// ============================================
// DELETE FUNCTIONS - Add these to customizationController.js
// ============================================

// Services Delete
const deleteService = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { serviceId } = req.params;

    const getOldDataQuery = `
      SELECT * FROM services WHERE service_id = $1
    `;
    const oldData = await client.query(getOldDataQuery, [serviceId]);

    if (oldData.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Instead of hard delete, we'll soft delete by setting is_active to false
    const deleteQuery = `
      UPDATE services
      SET is_active = false, updated_at = NOW()
      WHERE service_id = $1
      RETURNING *
    `;

    const result = await client.query(deleteQuery, [serviceId]);

    try {
      await supabase.from("audit_log").insert({
        table_name: "services",
        record_id: serviceId,
        action: "DELETE",
        old_values: oldData.rows[0],
        changed_by: req.user.email,
        change_reason: "Service deleted via customization panel",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Audit log error:", auditError);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({
      success: false,
      message: "Failed to delete service",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

// Chemicals Delete
const deleteChemical = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { chemicalId } = req.params;

    const getOldDataQuery = `
      SELECT * FROM chemicals WHERE chemical_id = $1
    `;
    const oldData = await client.query(getOldDataQuery, [chemicalId]);

    if (oldData.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Chemical not found",
      });
    }

    // Soft delete
    const deleteQuery = `
      UPDATE chemicals
      SET is_active = false, updated_at = NOW()
      WHERE chemical_id = $1
      RETURNING *
    `;

    const result = await client.query(deleteQuery, [chemicalId]);

    try {
      await supabase.from("audit_log").insert({
        table_name: "chemicals",
        record_id: chemicalId,
        action: "DELETE",
        old_values: oldData.rows[0],
        changed_by: req.user.email,
        change_reason: "Chemical deleted via customization panel",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Audit log error:", auditError);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Chemical deleted successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({
      success: false,
      message: "Failed to delete chemical",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

// Refrigerants Delete
const deleteRefrigerant = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { refrigerantId } = req.params;

    const getOldDataQuery = `
      SELECT * FROM refrigerants WHERE refrigerant_id = $1
    `;
    const oldData = await client.query(getOldDataQuery, [refrigerantId]);

    if (oldData.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Refrigerant not found",
      });
    }

    // Soft delete
    const deleteQuery = `
      UPDATE refrigerants
      SET is_active = false, updated_at = NOW()
      WHERE refrigerant_id = $1
      RETURNING *
    `;

    const result = await client.query(deleteQuery, [refrigerantId]);

    try {
      await supabase.from("audit_log").insert({
        table_name: "refrigerants",
        record_id: refrigerantId,
        action: "DELETE",
        old_values: oldData.rows[0],
        changed_by: req.user.email,
        change_reason: "Refrigerant deleted via customization panel",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Audit log error:", auditError);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Refrigerant deleted successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({
      success: false,
      message: "Failed to delete refrigerant",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

// Chat Intent Delete
const deleteChatIntent = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { intentId } = req.params;

    const getOldDataQuery = `
      SELECT * FROM chat_intents WHERE intent_id = $1
    `;
    const oldData = await client.query(getOldDataQuery, [intentId]);

    if (oldData.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Chat intent not found",
      });
    }

    // Soft delete
    const deleteQuery = `
      UPDATE chat_intents
      SET is_active = false, updated_at = NOW()
      WHERE intent_id = $1
      RETURNING *
    `;

    const result = await client.query(deleteQuery, [intentId]);

    try {
      await supabase.from("audit_log").insert({
        table_name: "chat_intents",
        record_id: intentId,
        action: "DELETE",
        old_values: oldData.rows[0],
        changed_by: req.user.email,
        change_reason: "Chat intent deleted via customization panel",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Audit log error:", auditError);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Chat intent deleted successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({
      success: false,
      message: "Failed to delete chat intent",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

// Quick Action Delete
const deleteQuickAction = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { actionId } = req.params;

    const getOldDataQuery = `
      SELECT * FROM chat_quick_actions WHERE action_id = $1
    `;
    const oldData = await client.query(getOldDataQuery, [actionId]);

    if (oldData.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Quick action not found",
      });
    }

    // Soft delete
    const deleteQuery = `
      UPDATE chat_quick_actions
      SET is_active = false
      WHERE action_id = $1
      RETURNING *
    `;

    const result = await client.query(deleteQuery, [actionId]);

    try {
      await supabase.from("audit_log").insert({
        table_name: "chat_quick_actions",
        record_id: actionId,
        action: "DELETE",
        old_values: oldData.rows[0],
        changed_by: req.user.email,
        change_reason: "Quick action deleted via customization panel",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Audit log error:", auditError);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Quick action deleted successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({
      success: false,
      message: "Failed to delete quick action",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  // Services
  getAllServices,
  getServiceCategories,
  updateService,
  createService,
  deleteService,

  // Chemicals
  getAllChemicals,
  updateChemical,
  createChemical,
  deleteChemical,

  // Refrigerants
  getAllRefrigerants,
  updateRefrigerant,
  createRefrigerant,
  deleteRefrigerant,
  
  // Chatbot
  getChatIntents,
  updateChatIntent,
  createChatIntent,
  deleteChatIntent,
  getQuickActions,
  updateQuickAction,
  createQuickAction,
  deleteQuickAction,
};