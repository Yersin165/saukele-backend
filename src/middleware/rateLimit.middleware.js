const rateLimit = require('express-rate-limit');

const authLimiter = process.env.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 60 * 1000,
      max: 5,
      message: { message: 'Too many attempts, please try again after a minute' }
    });

module.exports = { authLimiter };