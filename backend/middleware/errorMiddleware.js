const { validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log('=== VALIDATION ERRORS ===');
    console.log(JSON.stringify(errors.array(), null, 2));

    const formattedErrors = {};
    errors.array().forEach((err) => {
      if (!formattedErrors[err.path]) {
        formattedErrors[err.path] = err.msg;
      }
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check the highlighted fields.',
      errors: formattedErrors,
    });
  }

  next();
};

module.exports = { handleValidationErrors };