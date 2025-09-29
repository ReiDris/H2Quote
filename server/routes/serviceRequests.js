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

router.get('/services/catalog', serviceRequestController.getServicesCatalog);
router.get('/chemicals/catalog', serviceRequestController.getChemicalsCatalog);
router.get('/refrigerants/catalog', serviceRequestController.getRefrigerantsCatalog);
router.get('/my-requests', requireCustomer, serviceRequestController.getCustomerRequests);

router.post('/:requestId/add-chemical', requireAdminOrStaff, serviceRequestController.addChemicalToRequest);
router.post('/:requestId/add-refrigerant', requireAdminOrStaff, serviceRequestController.addRefrigerantToRequest);
router.delete('/:requestId/items/:itemId', requireAdminOrStaff, serviceRequestController.removeItemFromRequest);
router.put('/:requestId/items/:itemId/quantity', requireAdminOrStaff, serviceRequestController.updateItemQuantity);

router.get('/:requestId/details', serviceRequestController.getRequestDetails);
router.post('/:requestId/add-services', requireAdminOrStaff, serviceRequestController.addServicesToRequest);
router.post('/:requestId/create-quotation', requireAdminOrStaff, serviceRequestController.createQuotation);
router.put('/quotations/:quotationId/respond', requireCustomer, serviceRequestController.respondToQuotation);

router.get('/', requireAdminOrStaff, serviceRequestController.getAllRequests);
router.post('/', requireCustomer, serviceRequestController.createServiceRequest);

module.exports = router;