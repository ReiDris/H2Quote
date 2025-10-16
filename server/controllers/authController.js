const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const pool = require("../config/database");
const fs = require("fs");
const path = require("path");
const { sendUserWelcomeEmail, sendAdminNotificationEmail, sendPasswordResetEmail } = require('../emailServices/emailService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const signup = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const {
      companyName,
      customerName,
      email,
      contactNo,
      password,
      confirmPassword,
    } = req.body;

    if (
      !companyName ||
      !customerName ||
      !email ||
      !contactNo ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!req.file || !req.file.path) {
      return res.status(400).json({
        success: false,
        message: "Verification document is required",
      });
    }

    console.log('Verification file uploaded to Supabase at:', req.file.path);

    const existingUserQuery = "SELECT user_id FROM users WHERE email = $1";
    const existingUsers = await client.query(existingUserQuery, [email]);

    if (existingUsers.rows.length > 0) {
      // File is already uploaded to Supabase, no cleanup needed
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // File is already uploaded to Supabase by the middleware
    const filePath = req.file.path; // This is the Supabase storage path (e.g., "verification/123456-filename.jpg")

    let companyId;
    const existingCompanyQuery =
      "SELECT company_id FROM companies WHERE company_name = $1";
    const existingCompanies = await client.query(existingCompanyQuery, [
      companyName,
    ]);

    if (existingCompanies.rows.length > 0) {
      companyId = existingCompanies.rows[0].company_id;
    } else {
      const insertCompanyQuery = `
        INSERT INTO companies 
        (company_name, phone, email, status, created_at, updated_at) 
        VALUES ($1, $2, $3, 'Inactive', NOW(), NOW())
        RETURNING company_id
      `;
      const companyResult = await client.query(insertCompanyQuery, [
        companyName,
        contactNo,
        email,
      ]);
      companyId = companyResult.rows[0].company_id;
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const verificationToken =
      Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

    const nameParts = customerName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";

    const insertUserQuery = `
      INSERT INTO users 
      (company_id, first_name, last_name, email, phone, user_type, password_hash, 
       is_primary_contact, status, verification_token, verification_file_path, 
       verification_file_original_name, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, 'client', $6, true, 'Inactive', $7, $8, $9, NOW(), NOW())
      RETURNING user_id
    `;

    const userResult = await client.query(insertUserQuery, [
      companyId,
      firstName,
      lastName,
      email,
      contactNo,
      hashedPassword,
      verificationToken,
      filePath,  // Store Supabase Storage path (verification/filename.jpg)
      req.file.originalname,
    ]);

    const userId = userResult.rows[0].user_id;

    try {
      await sendUserWelcomeEmail(customerName, companyName, email, contactNo);
      await sendAdminNotificationEmail(customerName, companyName, email, contactNo);
    } catch (emailError) {
      console.error('Failed to send emails:', emailError);
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Your account has been created successfully!\n\nYour account is currently pending admin verification.\n\nYou will receive an email notification once approved.",
      data: {
        userId: userId,
        companyName: companyName,
        email: email,
        status: "Pending Verification",
        verificationFile: {
          originalName: req.file.originalname,
          size: req.file.size,
          uploadedAt: new Date(),
        },
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const { data: userResults, error: userError } = await supabase.rpc(
      "get_user_with_company",
      { user_email: email }
    );

    if (userError || !userResults || userResults.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = userResults[0];

    if (user.user_status === "Inactive") {
      let message = "Your account is pending verification.";

      if (user.user_type === "client") {
        message =
          "Your account is pending admin verification. Please wait for approval or contact support.";
      }

      return res.status(403).json({
        success: false,
        message: message,
        accountStatus: "Inactive",
        userType: user.user_type,
      });
    }

    if (user.user_status === "Suspended") {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Please contact support.",
        accountStatus: "Suspended",
      });
    }

    if (user.user_type === "client" && user.company_status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your company account is not active. Please contact support.",
        accountStatus: user.company_status,
      });
    }

    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("user_id", user.user_id);

    if (updateError) {
      console.error("Failed to update last login:", updateError);
    }

    const tokenPayload = {
      userId: user.user_id,
      email: user.email,
      userType: user.user_type,
      companyId: user.company_id,
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    let role;
    switch (user.user_type) {
      case "admin":
        role = "admin";
        break;
      case "staff":
        role = "staff";
        break;
      case "client":
        role = "customer"; 
        break;
      default:
        role = "customer";
    }

    const userData = {
      id: user.user_id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`.trim(),
      firstName: user.first_name,
      lastName: user.last_name,
      userType: user.user_type,
      role: role, 
      department: user.department,
      companyId: user.company_id,
      companyName: user.company_name,
      isPrimaryContact: user.is_primary_contact,
      permissions: user.permissions,
      lastLogin: user.last_login,
    };

    try {
      await supabase.from("audit_log").insert({
        table_name: "users",
        record_id: user.user_id,
        action: "UPDATE",
        new_values: { last_login: new Date().toISOString() },
        changed_by: user.email,
        change_reason: "User login",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Failed to log audit entry:", auditError);
    }

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token: token,
        user: userData,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const { data: userResults, error } = await supabase.rpc(
      "get_user_with_company",
      { user_email: req.user.email }
    );

    if (error || !userResults || userResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResults[0];

    let role;
    switch (user.user_type) {
      case "admin":
        role = "admin";
        break;
      case "staff":
        role = "staff";
        break;
      case "client":
        role = "customer";
        break;
      default:
        role = "customer";
    }

    const userData = {
      id: user.user_id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`.trim(),
      firstName: user.first_name,
      lastName: user.last_name,
      userType: user.user_type,
      role: role,
      department: user.department,
      companyId: user.company_id,
      companyName: user.company_name,
      isPrimaryContact: user.is_primary_contact,
      permissions: user.permissions,
      status: user.user_status,
    };

    res.json({
      success: true,
      data: { user: userData },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user information",
    });
  }
};

const logout = async (req, res) => {
  try {
    await supabase.from("audit_log").insert({
      table_name: "users",
      record_id: req.user.id,
      action: "UPDATE",
      change_reason: "User logout",
      changed_by: req.user.email,
      ip_address: req.ip || req.connection.remoteAddress,
    });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, first_name, last_name, email, status")
      .eq("email", email)
      .single();

    const successMessage = "If an account exists with this email, a password reset link has been sent.";

    if (error || !user) {
      return res.json({
        success: true,
        message: successMessage,
      });
    }

    if (user.status !== 'Active') {
      return res.json({
        success: true,
        message: successMessage,
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    const { error: updateError } = await supabase
      .from("users")
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString(),
      })
      .eq("user_id", user.user_id);

    if (updateError) {
      console.error('Failed to save reset token:', updateError);
      return res.json({
        success: true,
        message: successMessage,
      });
    }

    const userName = `${user.first_name} ${user.last_name}`.trim();
    try {
      await sendPasswordResetEmail(email, userName, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
     
    }

    res.json({
      success: true,
      message: successMessage,
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process password reset request",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword, confirmPassword } = req.body;

    if (!token || !email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 12 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, email, reset_token, reset_token_expiry, status")
      .eq("email", email)
      .eq("reset_token", token)
      .single();

    if (error || !user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    const now = new Date();
    const tokenExpiry = new Date(user.reset_token_expiry);
    
    if (now > tokenExpiry) {
      return res.status(400).json({
        success: false,
        message: "Reset token has expired. Please request a new password reset.",
      });
    }

    if (user.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: "Account is not active. Please contact support.",
      });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.user_id);

    if (updateError) {
      throw updateError;
    }

    try {
      await supabase.from("audit_log").insert({
        table_name: "users",
        record_id: user.user_id,
        action: "UPDATE",
        new_values: { password_reset: true },
        changed_by: user.email,
        change_reason: "Password reset by user",
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Failed to log password reset:", auditError);
    }

    res.json({
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password. Please try again.",
    });
  }
};

const validateResetToken = async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: "Token and email are required",
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, reset_token_expiry")
      .eq("email", email)
      .eq("reset_token", token)
      .single();

    if (error || !user) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    const now = new Date();
    const tokenExpiry = new Date(user.reset_token_expiry);
    
    if (now > tokenExpiry) {
      return res.status(400).json({
        success: false,
        message: "Reset token has expired",
      });
    }

    res.json({
      success: true,
      message: "Reset token is valid",
    });
  } catch (error) {
    console.error("Validate reset token error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate reset token",
    });
  }
};

module.exports = {
  signup,
  login,
  getCurrentUser,
  logout,
  forgotPassword,
  resetPassword,
  validateResetToken,
};