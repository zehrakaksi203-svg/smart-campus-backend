const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const {
  createGrade,
  getAllGrades,
  getGradeById,
  updateGrade,
  deleteGrade
} = require("./grade.controller");

router.post("/", auth, role("Admin", "Faculty"), createGrade);

router.get("/", auth, getAllGrades);

router.get("/:id", auth, getGradeById);

router.put("/:id", auth, role("Admin", "Faculty"), updateGrade);

router.delete("/:id", auth, role("Admin"), deleteGrade);

module.exports = router;
