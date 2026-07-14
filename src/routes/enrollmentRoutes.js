const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const role = require("../middleware/role");

const {
  createEnrollment,
  getAllEnrollments,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment
} = require("../controllers/enrollmentController");

// Yeni ders kaydı (Admin ve Student)
router.post("/", auth, role("Admin", "Student"), createEnrollment);

// Tüm kayıtları getir (Giriş yapan herkes)
router.get("/", auth, getAllEnrollments);

// ID ile kayıt getir (Giriş yapan herkes)
router.get("/:id", auth, getEnrollmentById);

// Güncelle (Sadece Admin)
router.put("/:id", auth, role("Admin"), updateEnrollment);

// Sil (Sadece Admin)
router.delete("/:id", auth, role("Admin"), deleteEnrollment);

module.exports = router;