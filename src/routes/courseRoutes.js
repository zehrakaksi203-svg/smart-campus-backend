const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const role = require("../middleware/role");

const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse
} = require("../controllers/courseController");

// Yeni ders oluştur (Admin ve Faculty)
router.post("/", auth, role("Admin", "Faculty"), createCourse);

// Tüm dersleri getir (Giriş yapan herkes)
router.get("/", auth, getAllCourses);

// ID ile ders getir (Giriş yapan herkes)
router.get("/:id", auth, getCourseById);

// Ders güncelle (Admin ve Faculty)
router.put("/:id", auth, role("Admin", "Faculty"), updateCourse);

// Ders sil (Sadece Admin)
router.delete("/:id", auth, role("Admin"), deleteCourse);

module.exports = router;