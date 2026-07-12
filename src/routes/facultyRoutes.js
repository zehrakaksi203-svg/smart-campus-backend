const express = require("express");
const router = express.Router();

const {
  createFaculty,
  getAllFaculties,
  getFacultyById,
  updateFaculty,
  deleteFaculty
} = require("../controllers/facultyController");

router.post("/", createFaculty);
router.get("/", getAllFaculties);
router.get("/:id", getFacultyById);
router.put("/:id", updateFaculty);
router.delete("/:id", deleteFaculty);

module.exports = router;