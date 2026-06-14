const express = require('express');
const router = express.Router();
const { createAppointment, getAppointments, getAppointmentById, cancelAppointment } = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateAppointment } = require('../middleware/validation');

router.post('/', authenticate, authorize('patient'), validateAppointment, createAppointment);
router.get('/', authenticate, getAppointments);
router.get('/:id', authenticate, getAppointmentById);
router.patch('/:id/cancel', authenticate, cancelAppointment);

module.exports = router;
