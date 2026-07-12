const express = require("express");
const router = express.Router();
console.log("Department Routes yüklendi.");
const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
} = require("../controllers/departmentController");

// Yeni bölüm oluştur
router.post("/", createDepartment);

// Tüm bölümleri getir
router.get("/", getAllDepartments);

// ID ile bölüm getir
router.get("/:id", getDepartmentById);

// Bölüm güncelle
router.put("/:id", updateDepartment);

// Bölüm sil
router.delete("/:id", deleteDepartment);

module.exports = router;