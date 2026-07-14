const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const role = require("../middleware/role");

const {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam
} = require("../controllers/examController");

// Yeni sınav oluştur (Admin ve Faculty)
router.post("/", auth, role("Admin", "Faculty"), createExam);

// Tüm sınavları getir (Giriş yapan herkes)
router.get("/", auth, getAllExams);

// ID ile sınav getir (Giriş yapan herkes)
router.get("/:id", auth, getExamById);

// Sınav güncelle (Admin ve Faculty)
router.put("/:id", auth, role("Admin", "Faculty"), updateExam);

// Sınav sil (Sadece Admin)
router.delete("/:id", auth, role("Admin"), deleteExam);

module.exports = router;