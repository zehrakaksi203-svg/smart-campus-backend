const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const role = require("../middleware/role");

const {
  createAttendance,
  getAllAttendances,
  getAttendanceById,
  updateAttendance,
  deleteAttendance
} = require("../controllers/attendanceController");

// Yeni yoklama oluştur (Admin ve Faculty)
router.post("/", auth, role("Admin", "Faculty"), createAttendance);

// Tüm yoklamaları getir (Giriş yapan herkes)
router.get("/", auth, getAllAttendances);

// ID ile yoklama getir (Giriş yapan herkes)
router.get("/:id", auth, getAttendanceById);

// Yoklama güncelle (Admin ve Faculty)
router.put("/:id", auth, role("Admin", "Faculty"), updateAttendance);

// Yoklama sil (Sadece Admin)
router.delete("/:id", auth, role("Admin"), deleteAttendance);

module.exports = router;