const express = require("express");
const router = express.Router();

const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse
} = require("../controllers/courseController");

// Yeni ders oluştur
router.post("/", createCourse);

// Tüm dersleri getir
router.get("/", getAllCourses);

// ID ile ders getir
router.get("/:id", getCourseById);

// Ders güncelle
router.put("/:id", updateCourse);

// Ders sil
router.delete("/:id", deleteCourse);

module.exports = router;