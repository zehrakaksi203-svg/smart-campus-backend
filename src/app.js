const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const sequelize = require("./config/database");

dotenv.config();

const app = express();

// =========================
// Module Routes
// =========================

const authRoutes = require("./modules/auth/auth.routes");

const userRoutes = require("./modules/users/user.routes");
const studentRoutes = require("./modules/users/user.routes").studentRouter;
const facultyRoutes = require("./modules/users/user.routes").facultyRouter;

const departmentRoutes = require("./modules/departments/department.routes");
const courseRoutes = require("./modules/courses/course.routes");
const enrollmentRoutes = require("./modules/enrollments/enrollment.routes");
const gradeRoutes = require("./modules/grades/grade.routes");
const attendanceRoutes = require("./modules/attendance/attendance.routes");
const examRoutes = require("./modules/exams/exam.routes");
const announcementRoutes = require("./modules/announcements/announcement.routes");

// =========================
// Middleware
// =========================

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =========================
// API Routes
// =========================

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/faculties", facultyRoutes);

app.use("/api/departments", departmentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/attendances", attendanceRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/announcements", announcementRoutes);

// =========================
// Home
// =========================

app.get("/", (req, res) => {
  res.send("Smart Campus Backend API is running!");
});

const PORT = process.env.PORT || 3000;

// =========================
// Database Connection
// =========================

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