const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const role = require("../middleware/role");

const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent
} = require("../controllers/studentController");

// Yeni öğrenci oluştur (Sadece Admin)
router.post("/", auth, role("Admin"), createStudent);

// Tüm öğrencileri getir (Giriş yapan herkes)
router.get("/", auth, getAllStudents);

// ID ile öğrenci getir (Giriş yapan herkes)
router.get("/:id", auth, getStudentById);

// Öğrenci güncelle (Sadece Admin)
router.put("/:id", auth, role("Admin"), updateStudent);

// Öğrenci sil (Sadece Admin)
router.delete("/:id", auth, role("Admin"), deleteStudent);

module.exports = router;