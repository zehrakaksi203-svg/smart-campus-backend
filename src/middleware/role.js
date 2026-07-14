const role = (...roles) => {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            message: "Yetkilendirme başarısız."
          });
        }
  
        if (!roles.includes(req.user.role)) {
          return res.status(403).json({
            message: "Bu işlem için yetkiniz bulunmamaktadır."
          });
        }
  
        next();
      } catch (error) {
        return res.status(500).json({
          message: error.message
        });
      }
    };
  };
  
  module.exports = role;