const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    // Authorization header'ını al
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Token bulunamadı."
      });
    }

    // Bearer token'ı ayır
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Geçersiz token."
      });
    }

    // Token doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kullanıcı bilgisini isteğe ekle
    req.user = decoded;

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Token geçersiz."
    });
  }
};

module.exports = auth;