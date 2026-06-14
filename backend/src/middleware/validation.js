const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

const validateRegister = [
  body('full_name').trim().notEmpty().withMessage('Full name is required').isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  body('role').isIn(['patient', 'doctor']).withMessage('Role must be patient or doctor'),
  handleValidationErrors
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const validateAppointment = [
  body('doctor_id').notEmpty().withMessage('Doctor ID is required'),
  body('appointment_date').isDate().withMessage('Valid appointment date is required'),
  body('appointment_time').notEmpty().withMessage('Appointment time is required'),
  body('reason').optional().isLength({ max: 500 }),
  handleValidationErrors
];

const validatePayment = [
  body('appointment_id').notEmpty().withMessage('Appointment ID is required'),
  body('amount').isNumeric().withMessage('Valid amount is required'),
  body('screenshot_url').notEmpty().withMessage('Payment screenshot is required'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateAppointment,
  validatePayment,
  handleValidationErrors
};
