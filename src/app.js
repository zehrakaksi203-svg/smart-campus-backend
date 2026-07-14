const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const attendanceRoutes = require("./routes/attendanceRoutes");
const sequelize = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const studentRoutes = require("./routes/studentRoutes");
const facultyRoutes = require("./routes/facultyRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const gradeRoutes = require("./routes/gradeRoutes");
const examRoutes = require("./routes/examRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
dotenv.config();

const app = express();

// JSON body desteği
app.use(express.json());

// Yüklenen dosyaları erişilebilir yap
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/faculties", facultyRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/attendances", attendanceRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/announcements", announcementRoutes);
// Ana sayfa
app.get("/", (req, res) => {
  res.send("Smart Campus Backend API is running!");
});

const PORT = process.env.PORT || 3000;

// Veritabanı bağlantısı
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