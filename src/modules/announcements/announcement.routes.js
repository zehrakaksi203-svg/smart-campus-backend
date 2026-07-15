const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
} = require("./announcement.controller");

router.post("/", auth, role("Admin", "Faculty"), createAnnouncement);

router.get("/", auth, getAllAnnouncements);

router.get("/:id", auth, getAnnouncementById);

router.put("/:id", auth, role("Admin", "Faculty"), updateAnnouncement);

router.delete("/:id", auth, role("Admin"), deleteAnnouncement);

module.exports = router;
