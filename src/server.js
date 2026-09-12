console.log("SERVER:", __filename);
const http = require("http");
const app = require("./app");
const sequelize = require("./config/database");
const { initSocket } = require("./socket");

const PORT = 3001;

const httpServer = http.createServer(app);

sequelize
  .authenticate()
  .then(() => {
    console.log("✅ PostgreSQL bağlantısı başarılı.");

    initSocket(httpServer);
    console.log("🔌 Socket.io başlatıldı.");

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server ${PORT} portunda çalışıyor.`);
      console.log(`📘 Swagger UI: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    console.error("❌ Veritabanı bağlantı hatası:", err.message);
  });