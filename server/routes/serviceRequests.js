// routes/serviceRequests.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const serviceRequestController = require('../controllers/serviceRequestController');

// Middleware to check if user is admin or staff
const requireAdminOrStaff = (req, res, next) => {
  if (!['admin', 'staff'].includes(req.user.userType)) {
    return res.status(403).json({
      success: false,
      message: 'Admin or staff access required'
    });
  }
  next();
};

// Middleware to check if user is customer
const requireCustomer = (req, res, next) => {
  if (req.user.userType !== 'client') {
    return res.status(403).json({
      success: false,
      message: 'Customer access required'
    });
  }
  next();
};

// Apply authentication to all routes
router.use(authenticateToken);

// Public routes (all authenticated users)
router.get('/services/catalog', serviceRequestController.getServicesCatalog);

// Customer routes
router.post('/', requireCustomer, serviceRequestController.createServiceRequest);
router.get('/my-requests', requireCustomer, serviceRequestController.getCustomerRequests);
router.get('/:requestId/details', serviceRequestController.getRequestDetails); // Can be accessed by customer or admin
router.put('/quotations/:quotationId/respond', requireCustomer, serviceRequestController.respondToQuotation);

// Admin/Staff routes
router.get('/', requireAdminOrStaff, serviceRequestController.getAllRequests);
router.post('/:requestId/add-services', requireAdminOrStaff, serviceRequestController.addServicesToRequest);
router.post('/:requestId/create-quotation', requireAdminOrStaff, serviceRequestController.createQuotation);
router.get('/chemicals/catalog', requireAdminOrStaff, serviceRequestController.getChemicalsCatalog);

module.exports = router;