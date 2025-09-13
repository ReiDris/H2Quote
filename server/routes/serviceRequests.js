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

router.post('/', requireCustomer, serviceRequestController.createServiceRequest);
router.get('/my-requests', requireCustomer, serviceRequestController.getCustomerRequests);
router.get('/:requestId/details', serviceRequestController.getRequestDetails); // Can be accessed by customer or admin
router.put('/quotations/:quotationId/respond', requireCustomer, serviceRequestController.respondToQuotation);

router.get('/', requireAdminOrStaff, serviceRequestController.getAllRequests);
router.post('/:requestId/add-services', requireAdminOrStaff, serviceRequestController.addServicesToRequest);
router.post('/:requestId/create-quotation', requireAdminOrStaff, serviceRequestController.createQuotation);
router.get('/chemicals/catalog', requireAdminOrStaff, serviceRequestController.getChemicalsCatalog);

module.exports = router;