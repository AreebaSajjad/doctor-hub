const express = require('express');
const router = express.Router();
const { getMedicalHistory, addMedicalHistory, addPrescription, getPrescriptions } = require('../controllers/historyController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getMedicalHistory);
router.post('/', authenticate, authorize('doctor'), addMedicalHistory);
router.post('/prescriptions', authenticate, authorize('doctor'), addPrescription);
router.get('/prescriptions', authenticate, getPrescriptions);

module.exports = router;
