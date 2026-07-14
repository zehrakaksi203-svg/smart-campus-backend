const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const role = require("../middleware/role");

const {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
} = require("../controllers/announcementController");

// Yeni duyuru oluştur (Admin ve Faculty)
router.post("/", auth, role("Admin", "Faculty"), createAnnouncement);

// Tüm duyuruları getir (Giriş yapan herkes)
router.get("/", auth, getAllAnnouncements);

// ID ile duyuru getir (Giriş yapan herkes)
router.get("/:id", auth, getAnnouncementById);

// Duyuru güncelle (Admin ve Faculty)
router.put("/:id", auth, role("Admin", "Faculty"), updateAnnouncement);

// Duyuru sil (Sadece Admin)
router.delete("/:id", auth, role("Admin"), deleteAnnouncement);

module.exports = router;