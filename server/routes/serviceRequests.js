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

router.use(authenticateToken);

// Specific routes FIRST (no parameters)
router.get('/services/catalog', serviceRequestController.getServicesCatalog);
router.get('/chemicals/catalog', serviceRequestController.getChemicalsCatalog);
router.get('/refrigerants/catalog', serviceRequestController.getRefrigerantsCatalog);
router.get('/staff-list', requireAdminOrStaff, serviceRequestController.getStaffList); 
router.get('/my-requests', requireCustomer, serviceRequestController.getCustomerRequests);

// Routes with parameters (AFTER all specific routes)
router.get('/:requestId/details', serviceRequestController.getRequestDetails);
router.post('/:requestId/add-services', requireAdminOrStaff, serviceRequestController.addServicesToRequest);
router.post('/:requestId/add-chemicals', requireAdminOrStaff, serviceRequestController.addChemicalsToRequest);
router.delete('/:requestId/remove-chemicals', requireAdminOrStaff, serviceRequestController.removeChemicalsFromRequest);
router.post('/:requestId/add-refrigerants', requireAdminOrStaff, serviceRequestController.addRefrigerantsToRequest);
router.delete('/:requestId/remove-refrigerants', requireAdminOrStaff, serviceRequestController.removeRefrigerantsFromRequest);
router.post('/:requestId/create-quotation', requireAdminOrStaff, serviceRequestController.createQuotation);
router.put('/quotations/:quotationId/respond', requireCustomer, serviceRequestController.respondToQuotation);
router.put('/:requestId/items/:itemId/warranty', requireAdminOrStaff, serviceRequestController.updateItemWarranty);
router.put('/:requestId/update', requireAdminOrStaff, serviceRequestController.updateServiceRequest);
router.put('/:requestId/update', requireAdminOrStaff, serviceRequestController.updateServiceRequest);

// Generic routes LAST
router.get('/', requireAdminOrStaff, serviceRequestController.getAllRequests);
router.post('/', requireCustomer, serviceRequestController.createServiceRequest);

module.exports = router;