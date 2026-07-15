module.exports = (err, req, res, next) => {
    console.error(err);
  
    if (err.status) {
      return res.status(err.status).json({
        message: err.message,
      });
    }
  
    return res.status(500).json({
      message: "Sunucuda beklenmeyen bir hata oluştu.",
    });
  };