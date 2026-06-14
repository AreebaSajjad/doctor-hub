const express = require('express');
const router = express.Router();
const { submitPayment, verifyPayment, getPayments } = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validatePayment } = require('../middleware/validation');

router.post('/', authenticate, authorize('patient'), validatePayment, submitPayment);
router.get('/', authenticate, getPayments);
router.patch('/:id/verify', authenticate, authorize('assistant', 'doctor', 'admin', 'super_admin'), verifyPayment);

module.exports = router;
