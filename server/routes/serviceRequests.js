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
 
  if (!req.user || req.user.userType !== 'client') {
    return res.status(403).json({
      success: false,
      message: 'Customer access required',
    });
  }
  next();
};

router.get('/services/catalog', serviceRequestController.getServicesCatalog);
router.get('/chemicals/catalog', serviceRequestController.getChemicalsCatalog);
router.get('/refrigerants/catalog', serviceRequestController.getRefrigerantsCatalog);

router.use(authenticateToken);

// 🔍 DEBUG - Log all incoming requests
router.use((req, res, next) => {
  console.log('📥 SERVICE REQUEST ROUTE:', req.method, req.path);
  console.log('📥 Full URL:', req.originalUrl);
  console.log('📥 User:', req.user?.email);
  next();
});

router.get('/my-requests', requireCustomer, serviceRequestController.getCustomerRequests);
router.get('/staff-list', requireAdminOrStaff, serviceRequestController.getStaffList);

router.get('/', requireAdminOrStaff, serviceRequestController.getAllRequests);
router.post('/', requireCustomer, serviceRequestController.createServiceRequest);

router.put('/quotations/:quotationId/respond', requireCustomer, serviceRequestController.respondToQuotation);

router.post('/:requestId/approve', requireCustomer, serviceRequestController.approveServiceRequest);
router.post('/:requestId/add-services', requireAdminOrStaff, serviceRequestController.addServicesToRequest);
router.post('/:requestId/add-chemicals', requireAdminOrStaff, serviceRequestController.addChemicalsToRequest);
router.post('/:requestId/add-refrigerants', requireAdminOrStaff, serviceRequestController.addRefrigerantsToRequest);
router.delete('/:requestId/remove-chemicals', requireAdminOrStaff, serviceRequestController.removeChemicalsFromRequest);
router.delete('/:requestId/remove-refrigerants', requireAdminOrStaff, serviceRequestController.removeRefrigerantsFromRequest);
router.post('/:requestId/create-quotation', requireAdminOrStaff, serviceRequestController.createQuotation);
router.put('/:requestId/update', requireAdminOrStaff, serviceRequestController.updateServiceRequest);
router.post('/:requestId/warranty', requireAdminOrStaff, serviceRequestController.setServiceWarranty);

router.get('/:requestId/details', serviceRequestController.getRequestDetails);

router.put('/:requestId/items/:itemId/warranty', requireAdminOrStaff, serviceRequestController.updateIndividualServiceWarranty);

module.exports = router;