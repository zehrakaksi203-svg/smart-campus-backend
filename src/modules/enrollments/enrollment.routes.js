const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const {
  createEnrollment,
  getAllEnrollments,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment
} = require("./enrollment.controller");

router.post("/", auth, role("Admin", "Student"), createEnrollment);

router.get("/", auth, getAllEnrollments);

router.get("/:id", auth, getEnrollmentById);

router.put("/:id", auth, role("Admin"), updateEnrollment);

router.delete("/:id", auth, role("Admin"), deleteEnrollment);

module.exports = router;
