const express = require("express");

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const upload = require("../../middleware/multer");

const {
  getMe,
  updateMe,
  uploadProfilePicture,
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  createFaculty,
  getAllFaculties,
  getFacultyById,
  updateFaculty,
  deleteFaculty
} = require("./user.controller");

const userRouter = express.Router();

userRouter.get("/me", auth, getMe);
userRouter.put("/me", auth, updateMe);
userRouter.post(
  "/me/profile-picture",
  auth,
  upload.single("profilePicture"),
  uploadProfilePicture
);

const studentRouter = express.Router();

studentRouter.post("/", auth, role("Admin"), createStudent);
studentRouter.get("/", auth, getAllStudents);
studentRouter.get("/:id", auth, getStudentById);
studentRouter.put("/:id", auth, role("Admin"), updateStudent);
studentRouter.delete("/:id", auth, role("Admin"), deleteStudent);

const facultyRouter = express.Router();

facultyRouter.post("/", auth, role("Admin"), createFaculty);
facultyRouter.get("/", auth, getAllFaculties);
facultyRouter.get("/:id", auth, getFacultyById);
facultyRouter.put("/:id", auth, role("Admin"), updateFaculty);
facultyRouter.delete("/:id", auth, role("Admin"), deleteFaculty);

module.exports = userRouter;
module.exports.studentRouter = studentRouter;
module.exports.facultyRouter = facultyRouter;
