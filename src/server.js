console.log("SERVER:", __filename);
const app = require("./app");
const sequelize = require("./config/database");

const PORT = 3001;




sequelize
  .authenticate()
  .then(() => {
    console.log("✅ PostgreSQL bağlantısı başarılı.");
    app.listen(PORT, () => {
      console.log(`🚀 Server ${PORT} portunda çalışıyor.`);
      console.log(`📘 Swagger UI: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    console.error("❌ Veritabanı bağlantı hatası:", err.message);
  });