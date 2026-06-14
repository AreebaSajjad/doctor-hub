const express = require('express');
const router = express.Router();
const { getDoctors, getDoctorById, updateDoctorProfile, getMyPatients } = require('../controllers/doctorController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', getDoctors);
router.get('/my-patients', authenticate, authorize('doctor'), getMyPatients);
router.get('/:id', getDoctorById);
router.put('/profile', authenticate, authorize('doctor'), updateDoctorProfile);

module.exports = router;
