const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const role = require("../middleware/role");

const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
} = require("../controllers/departmentController");

// Yeni bölüm oluştur (Sadece Admin)
router.post("/", auth, role("Admin"), createDepartment);

// Tüm bölümleri getir (Giriş yapan herkes)
router.get("/", auth, getAllDepartments);

// ID ile bölüm getir (Giriş yapan herkes)
router.get("/:id", auth, getDepartmentById);

// Bölüm güncelle (Sadece Admin)
router.put("/:id", auth, role("Admin"), updateDepartment);

// Bölüm sil (Sadece Admin)
router.delete("/:id", auth, role("Admin"), deleteDepartment);

module.exports = router;
