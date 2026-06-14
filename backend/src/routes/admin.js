const express = require('express');
const router = express.Router();
const { getUsers, updateUser, createClinic, getClinics, assignDoctorToClinic, assignAssistant, getAnalytics } = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/users', authenticate, authorize('admin', 'super_admin'), getUsers);
router.patch('/users/:id', authenticate, authorize('admin', 'super_admin'), updateUser);
router.post('/clinics', authenticate, authorize('admin', 'super_admin'), createClinic);
router.get('/clinics', authenticate, authorize('admin', 'super_admin'), getClinics);
router.post('/assign-doctor', authenticate, authorize('admin', 'super_admin'), assignDoctorToClinic);
router.post('/assign-assistant', authenticate, authorize('admin', 'super_admin'), assignAssistant);
router.get('/analytics', authenticate, authorize('admin', 'super_admin'), getAnalytics);

module.exports = router;
