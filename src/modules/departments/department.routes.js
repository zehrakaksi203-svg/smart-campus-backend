const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
} = require("./department.controller");

router.post("/", auth, role("Admin"), createDepartment);

router.get("/", auth, getAllDepartments);

router.get("/:id", auth, getDepartmentById);

router.put("/:id", auth, role("Admin"), updateDepartment);

router.delete("/:id", auth, role("Admin"), deleteDepartment);

module.exports = router;
