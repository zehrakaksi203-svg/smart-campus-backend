const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const errorHandler = require("./middleware/errorHandler");

dotenv.config();

const app = express();

// =========================
// Swagger Configuration
// =========================
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Smart Campus API",
      version: "1.0.0",
      description: "Smart Campus Backend API Documentation"
    },
    servers: [
      {
        url: "http://localhost:3000"
      }
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },

    security: [
      {
        bearerAuth: []
      }
    ]
  },

  apis: ["./src/modules/**/*.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// =========================
// Middlewares
// =========================

app.use(express.json());

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// =========================
// Routes
// =========================

const authRoutes = require("./modules/auth/auth.routes");
const courseSectionRoutes = require("./modules/courseSections/courseSection.routes");
const userRoutes = require("./modules/users/user.routes");
const studentRoutes =
  require("./modules/users/user.routes").studentRouter;
const facultyRoutes =
  require("./modules/users/user.routes").facultyRouter;

const departmentRoutes = require("./modules/departments/department.routes");
const courseRoutes = require("./modules/courses/course.routes");
const enrollmentRoutes = require("./modules/enrollments/enrollment.routes");
const gradeRoutes = require("./modules/grades/grade.routes");
const attendanceRoutes = require("./modules/attendance/attendance.routes");
const examRoutes = require("./modules/exams/exam.routes");
const announcementRoutes = require("./modules/announcements/announcement.routes");

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/faculties", facultyRoutes);

app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/enrollments", enrollmentRoutes);
app.use("/api/v1/grades", gradeRoutes);
app.use("/api/v1/attendances", attendanceRoutes);
app.use("/api/v1/exams", examRoutes);
app.use("/api/v1/announcements", announcementRoutes);
app.use("/api/course-sections", courseSectionRoutes);
// =========================
// Home
// =========================

app.get("/", (req, res) => {
  res.send("Smart Campus Backend API is running!");
});

// =========================
// Global Error Handler
// =========================

app.use(errorHandler);

module.exports = app;