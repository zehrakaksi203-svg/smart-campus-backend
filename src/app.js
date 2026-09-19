console.log("APP:", __filename);
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const classroomRoutes = require("./modules/classrooms/classroom.routes");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const coursePrerequisiteRoutes = require("./modules/coursePrerequisites/coursePrerequisite.routes");
const errorHandler = require("./middleware/errorHandler");
const attendanceSessionRoutes = require("./modules/attendanceSessions/attendanceSession.routes");
const excuseRequestRoutes = require("./modules/excuseRequests/excuseRequest.routes");
const notificationRoutes = require("./modules/notifications/notification.routes");
const mealRoutes = require("./modules/meals/meal.routes");
const eventRoutes = require("./modules/events/event.routes");
const schedulingRoutes = require("./modules/scheduling/scheduling.routes");
const paymentRoutes = require("./modules/payment/payment.routes");
const aiRoutes = require("./modules/ai/ai.routes");
const walletRoutes = require("./modules/wallet/wallet.routes");
const reservationRoutes = require("./modules/reservations/reservation.routes");
const analyticsRoutes = require("./modules/analytics/analytics.routes");
const notificationPreferenceRoutes = require("./modules/notificationsPreference/notification-preference.routes");

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 300,
  message: { message: "Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test"
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 10,
  message: { message: "Çok fazla giriş denemesi yaptınız, lütfen 15 dakika sonra tekrar deneyin." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test"
});

dotenv.config();

const app = express();
console.log("APP.JS YÜKLENDİ");

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
        url: "http://localhost:3001"
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

console.log(
  JSON.stringify(swaggerSpec.paths["/api/v1/users/me"], null, 2)
);

app.use(
  cors({
    origin: (process.env.CORS_ORIGINS || "http://localhost:5173")
      .split(",")
      .map((origin) => origin.trim()),
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use("/api/v1", generalLimiter);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true
  })
);

app.get("/swagger-json", (req, res) => {
  res.json(swaggerSpec);
});



// =========================
// Middlewares
// =========================
const { stripeWebhookController } = require("./modules/payment/payment.controller");

app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookController
);

app.use(express.json({ limit: "10mb" }));

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
const startAbsenceWarningJob = require("./jobs/absenceWarning.job");
const startEventReminderJob = require("./jobs/eventReminder.job");
const startMealReminderJob = require("./jobs/mealReminder.job");
startAbsenceWarningJob();
startEventReminderJob();
startMealReminderJob();

app.use("/api/v1/auth", authLimiter, authRoutes);

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
app.use("/api/v1/classrooms", classroomRoutes);
app.use("/api/v1/course-prerequisites", coursePrerequisiteRoutes);
app.use("/api/v1/attendance/excuse-requests", excuseRequestRoutes);
app.use("/api/v1/attendance", attendanceSessionRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/meals", mealRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/scheduling", schedulingRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/reservations", reservationRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/notifications", notificationPreferenceRoutes);

app.get("/test", (req, res) => {
  console.log(">>> TEST ROUTE ÇALIŞTI");
  res.send("TEST OK");
});
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
