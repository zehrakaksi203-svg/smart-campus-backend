const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const {
  createAttendance,
  getAllAttendances,
  getAttendanceById,
  updateAttendance,
  deleteAttendance
} = require("./attendance.controller");

router.post("/", auth, role("Admin", "Faculty"), createAttendance);

router.get("/", auth, getAllAttendances);

router.get("/:id", auth, getAttendanceById);

router.put("/:id", auth, role("Admin", "Faculty"), updateAttendance);

router.delete("/:id", auth, role("Admin"), deleteAttendance);

module.exports = router;
