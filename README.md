# H2Quote: Service Request System with Prompt-Based Chatbot

A comprehensive web-based service request management system developed for TRISHKAYE Enterprises & Allied Services, implementing ITIL 4 framework principles for efficient service delivery and client communication.

---

## 📋 Project Information

**Course:** Bachelor of Science in Information Systems  
**Institution:** University of Santo Tomas - College of Information and Computing Sciences  
**Department:** Information Systems  
**Academic Year:** 2024-2025, Second Semester  
**Submission Date:** May 2025

### Development Team
- **Casquejo, Joulet I.**
- **Dris, Reinier Dominic C.**
- **Maniquis, Jairus L.**
- **Sardenia, Ruby Kate R.**

**Capstone Adviser:** Asst. Prof. Mildred C. Duran, MBA

---

## 🎯 Project Overview

H2Quote is a service request management system designed to streamline TRISHKAYE Enterprises' business processes by:
- Automating service request submission and tracking
- Providing 24/7 client support through a prompt-based chatbot
- Managing quotations and payment schedules
- Tracking service warranties and completion status
- Facilitating communication between clients and staff

### Key Problems Addressed
1. **After-hours inquiry delays** - Clients can now get instant responses anytime
2. **Manual request tracking** - Automated system for managing multiple service requests
3. **Payment tracking inefficiencies** - Automated billing reminders and payment status monitoring
4. **Quote generation delays** - Streamlined quotation creation and approval workflow

---

## 🏗️ Technology Stack

### Frontend
- **Framework:** React.js 18.x
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **Icons:** Lucide React, React Icons
- **State Management:** React Hooks (useState, useEffect, useContext)

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer
- **Email Service:** Nodemailer

### Database
- **Primary Database:** PostgreSQL
- **Cloud Service:** Supabase
- **ORM/Query:** Node-postgres (pg)

### Development Tools
- **Version Control:** Git & GitHub
- **Code Editor:** Visual Studio Code
- **API Testing:** Postman
- **Package Manager:** npm

---

## 👥 User Roles & Access Levels

### 1. Administrator
- Full system access and configuration
- User account verification and management
- Service request assignment to staff
- Price approval and discount application
- Activity log monitoring
- System-wide reporting

### 2. Staff
- View and manage assigned service requests
- Update service status and progress
- Create and send quotations
- Communicate with clients via messaging
- Update payment statuses

### 3. Client (Customer)
- Submit service requests with specific requirements
- Track request status in real-time
- Approve or reject quotations
- View payment schedules and history
- Access 24/7 chatbot assistance
- Message staff regarding service requests

---

## ✨ Key Features

### Service Request Management
- Multi-item request creation (services, chemicals, refrigerants)
- Automated cost calculation with discount application
- Status tracking through service lifecycle
- Staff assignment and workload distribution
- Estimated duration and timeline management

### Quotation System
- Dynamic quotation generation based on request items
- Tax and discount calculations
- Payment terms configuration (Full/Down payment)
- Client approval workflow
- Quotation validity tracking

### Billing & Payment Tracking
- Flexible payment terms (Full, 50%-50%, 20%-80%)
- Automated payment reminders
- Payment phase tracking (Down Payment, Completion Balance)
- Payment status monitoring (Pending, Partial, Paid, Overdue)
- Payment deadline management

### Warranty Management
- Service-specific warranty periods (default: 6 months)
- Warranty start and end date tracking
- Warranty status monitoring (Valid, Expired, Pending)
- Individual service warranty configuration

### Communication System
- Internal messaging between clients and staff
- Request-specific message threading
- Email notifications for important updates
- Unread message indicators
- Reply tracking and conversation history

### Prompt-Based Chatbot
- 24/7 availability for client inquiries
- Pre-programmed responses for common questions
- Service catalog navigation assistance
- Basic request information provision
- Seamless escalation to human staff via messaging

### Activity Logging & Audit Trail
- Comprehensive action tracking for all users
- Date and time-stamped activities
- User identification and role tracking
- Exportable activity reports (CSV)
- Search and filter capabilities

---
### Audit & Logging
- **audit_log** - System activity tracking
- **request_status_history** - Request status changes

See `updated_h2quote_schema.txt` for complete schema details.
