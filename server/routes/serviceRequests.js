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
  if (req.user.userType !== 'client') {
    return res.status(403).json({
      success: false,
      message: 'Customer access required'
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

// Authenticated specific routes (no parameters)
router.get('/my-requests', requireCustomer, serviceRequestController.getCustomerRequests);
router.get('/staff-list', requireAdminOrStaff, serviceRequestController.getStaffList);

// Generic routes (before parameterized routes to avoid conflicts)
router.get('/', requireAdminOrStaff, serviceRequestController.getAllRequests);
router.post('/', requireCustomer, serviceRequestController.createServiceRequest);

// Quotation routes
router.put('/quotations/:quotationId/respond', requireCustomer, serviceRequestController.respondToQuotation);

// ✅ ADDED: Customer approval route - MUST be before generic /:requestId routes
router.put('/:requestId/approve', requireCustomer, serviceRequestController.approveServiceRequest);

// Parameterized routes - specific paths before generic
router.get('/:requestId/details', serviceRequestController.getRequestDetails);
router.post('/:requestId/add-services', requireAdminOrStaff, serviceRequestController.addServicesToRequest);
router.post('/:requestId/add-chemicals', requireAdminOrStaff, serviceRequestController.addChemicalsToRequest);
router.post('/:requestId/add-refrigerants', requireAdminOrStaff, serviceRequestController.addRefrigerantsToRequest);
router.delete('/:requestId/remove-chemicals', requireAdminOrStaff, serviceRequestController.removeChemicalsFromRequest);
router.delete('/:requestId/remove-refrigerants', requireAdminOrStaff, serviceRequestController.removeRefrigerantsFromRequest);
router.post('/:requestId/create-quotation', requireAdminOrStaff, serviceRequestController.createQuotation);
router.put('/:requestId/update', requireAdminOrStaff, serviceRequestController.updateServiceRequest);
router.post('/:requestId/warranty', requireAdminOrStaff, serviceRequestController.setServiceWarranty);

// Routes with multiple parameters - MUST be last
router.put('/:requestId/items/:itemId/warranty', requireAdminOrStaff, serviceRequestController.updateIndividualServiceWarranty);

module.exports = router;