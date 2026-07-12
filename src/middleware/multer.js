const multer = require("multer");
const path = require("path");

// Dosyanın nereye kaydedileceğini belirle
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads"));
      },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + path.extname(file.originalname);

    cb(null, uniqueName);
  }
});

// Sadece resim dosyalarına izin ver
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;

  const ext = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  const mime = allowedTypes.test(file.mimetype);

  if (ext && mime) {
    return cb(null, true);
  }

  cb(new Error("Sadece resim yükleyebilirsiniz."));
};

const upload = multer({
  storage,
  fileFilter
});

module.exports = upload;