const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam
} = require("./exam.controller");

router.post("/", auth, role("Admin", "Faculty"), createExam);

router.get("/", auth, getAllExams);

router.get("/:id", auth, getExamById);

router.put("/:id", auth, role("Admin", "Faculty"), updateExam);

router.delete("/:id", auth, role("Admin"), deleteExam);

module.exports = router;
