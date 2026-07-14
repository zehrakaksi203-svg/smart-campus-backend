const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const role = require("../middleware/role");

const {
  createGrade,
  getAllGrades,
  getGradeById,
  updateGrade,
  deleteGrade
} = require("../controllers/gradeController");

// Yeni not oluştur (Admin ve Faculty)
router.post("/", auth, role("Admin", "Faculty"), createGrade);

// Tüm notları getir (Giriş yapan herkes)
router.get("/", auth, getAllGrades);

// ID ile not getir (Giriş yapan herkes)
router.get("/:id", auth, getGradeById);

// Not güncelle (Admin ve Faculty)
router.put("/:id", auth, role("Admin", "Faculty"), updateGrade);

// Not sil (Sadece Admin)
router.delete("/:id", auth, role("Admin"), deleteGrade);

module.exports = router;