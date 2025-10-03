const Joi = require('joi');

// Input sanitization function
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[;]/g, '') // Remove semicolons
    .substring(0, 100); // Limit length
}

// Login validation schema
const loginSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must be no more than 30 characters long',
      'any.required': 'Username is required'
    }),
  password: Joi.string()
    .min(12)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/)
    .required()
    .messages({
      'string.min': 'Password must be at least 12 characters long',
      'string.max': 'Password must be no more than 128 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  metaMaskAddress: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid MetaMask address format'
    })
});

// Validation middleware
function validateLogin(req, res, next) {
  // Sanitize inputs
  if (req.body.username) {
    req.body.username = sanitizeInput(req.body.username).toLowerCase();
  }
  if (req.body.password) {
    req.body.password = sanitizeInput(req.body.password);
  }
  if (req.body.metaMaskAddress) {
    req.body.metaMaskAddress = sanitizeInput(req.body.metaMaskAddress);
  }

  // Validate with Joi
  const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errorMessages 
    });
  }
  
  // Replace req.body with validated and sanitized data
  req.body = value;
  next();
}

module.exports = {
  validateLogin,
  sanitizeInput
};
