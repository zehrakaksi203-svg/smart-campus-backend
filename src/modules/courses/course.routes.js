const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse
} = require("./course.controller");

router.post("/", auth, role("Admin", "Faculty"), createCourse);

router.get("/", auth, getAllCourses);

router.get("/:id", auth, getCourseById);

router.put("/:id", auth, role("Admin", "Faculty"), updateCourse);

router.delete("/:id", auth, role("Admin"), deleteCourse);

module.exports = router;
