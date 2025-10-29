const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const serviceRequestController = require('../controllers/serviceRequestController');

const requireAdminOrStaff = (req, res, next) => {
  if (!['admin', 'staff'].includes(req.user.userType)) {
    return res.status(403).json({
      success: false,
      message: 'Admin or staff access required'
    });
  }
  next();
};

const requireCustomer = (req, res, next) => {
  // Log to debug
  console.log('User object:', req.user);
  console.log('User type:', req.user.userType);
  
  if (!req.user || req.user.userType !== 'client') {
    return res.status(403).json({
      success: false,
      message: 'Customer access required',
      debug: { userType: req.user?.userType } // Remove this after debugging
    });
  }
  next();
};

// PUBLIC routes - MUST be FIRST (before authenticateToken)
router.get('/services/catalog', serviceRequestController.getServicesCatalog);
router.get('/chemicals/catalog', serviceRequestController.getChemicalsCatalog);
router.get('/refrigerants/catalog', serviceRequestController.getRefrigerantsCatalog);

// Apply authentication to all routes below
router.use(authenticateToken);

// 🔍 DEBUG - Log all incoming requests
router.use((req, res, next) => {
  console.log('📥 SERVICE REQUEST ROUTE:', req.method, req.path);
  console.log('📥 Full URL:', req.originalUrl);
  console.log('📥 User:', req.user?.email);
  next();
});

// Authenticated specific routes (no parameters)
router.get('/my-requests', requireCustomer, serviceRequestController.getCustomerRequests);
router.get('/staff-list', requireAdminOrStaff, serviceRequestController.getStaffList);

// Generic routes (before parameterized routes to avoid conflicts)
router.get('/', requireAdminOrStaff, serviceRequestController.getAllRequests);
router.post('/', requireCustomer, serviceRequestController.createServiceRequest);

// Quotation routes
router.put('/quotations/:quotationId/respond', requireCustomer, serviceRequestController.respondToQuotation);

// ✅ FIXED: Specific parameterized routes BEFORE generic ones
// Change from PUT to POST temporarily
router.post('/:requestId/approve', requireCustomer, serviceRequestController.approveServiceRequest);
router.post('/:requestId/add-services', requireAdminOrStaff, serviceRequestController.addServicesToRequest);
router.post('/:requestId/add-chemicals', requireAdminOrStaff, serviceRequestController.addChemicalsToRequest);
router.post('/:requestId/add-refrigerants', requireAdminOrStaff, serviceRequestController.addRefrigerantsToRequest);
router.delete('/:requestId/remove-chemicals', requireAdminOrStaff, serviceRequestController.removeChemicalsFromRequest);
router.delete('/:requestId/remove-refrigerants', requireAdminOrStaff, serviceRequestController.removeRefrigerantsFromRequest);
router.post('/:requestId/create-quotation', requireAdminOrStaff, serviceRequestController.createQuotation);
router.put('/:requestId/update', requireAdminOrStaff, serviceRequestController.updateServiceRequest);
router.post('/:requestId/warranty', requireAdminOrStaff, serviceRequestController.setServiceWarranty);

// Generic parameterized route - AFTER specific ones
router.get('/:requestId/details', serviceRequestController.getRequestDetails);

// Routes with multiple parameters - MUST be last
router.put('/:requestId/items/:itemId/warranty', requireAdminOrStaff, serviceRequestController.updateIndividualServiceWarranty);

module.exports = router;