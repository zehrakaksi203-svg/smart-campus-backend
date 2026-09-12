const logger = require('../config/logger');

module.exports = (err, req, res, next) => {
  logger.error(
    `${req.method} ${req.originalUrl} - ${err.message}${err.stack ? '\n' + err.stack : ''}`
  );

  if (err.status) {
    return res.status(err.status).json({
      message: err.message,
    });
  }

  return res.status(500).json({
    message: "Sunucuda beklenmeyen bir hata oluştu.",
  });
};