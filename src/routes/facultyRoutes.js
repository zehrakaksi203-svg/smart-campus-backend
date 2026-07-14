const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const role = require("../middleware/role");

const {
  createFaculty,
  getAllFaculties,
  getFacultyById,
  updateFaculty,
  deleteFaculty
} = require("../controllers/facultyController");

// Yeni öğretim üyesi oluştur (Sadece Admin)
router.post("/", auth, role("Admin"), createFaculty);

// Tüm öğretim üyelerini getir (Giriş yapan herkes)
router.get("/", auth, getAllFaculties);

// ID ile öğretim üyesi getir (Giriş yapan herkes)
router.get("/:id", auth, getFacultyById);

// Güncelle (Sadece Admin)
router.put("/:id", auth, role("Admin"), updateFaculty);

// Sil (Sadece Admin)
router.delete("/:id", auth, role("Admin"), deleteFaculty);

module.exports = router;