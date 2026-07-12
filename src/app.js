const facultyRoutes = require("./routes/facultyRoutes");
const studentRoutes = require("./routes/studentRoutes");
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const departmentRoutes = require("./routes/departmentRoutes");
const sequelize = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
dotenv.config();

const app = express();
app.use(express.json());

// Yüklenen dosyaları tarayıcıdan erişilebilir yap
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/faculties", facultyRoutes);
app.use("/api/courses", courseRoutes);
app.get("/", (req, res) => {
  res.send("Smart Campus Backend API is running!");
});

const PORT = process.env.PORT || 3000;

sequelize
  .authenticate()
  .then(() => {
    console.log("✅ PostgreSQL bağlantısı başarılı.");

    app.listen(PORT, () => {
      console.log(`🚀 Server ${PORT} portunda çalışıyor.`);
    });
  })
  .catch((err) => {
    console.error("❌ Veritabanı bağlantı hatası:", err.message);
  });