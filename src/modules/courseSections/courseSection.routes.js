const express = require("express");

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const validate = require("../../middleware/validate");

const {
  courseSectionSchema
} = require("./courseSection.validation");

const {
  createCourseSection,
  getAllCourseSections,
  getCourseSectionById,
  updateCourseSection,
  deleteCourseSection
} = require("./courseSection.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Course Sections
 *   description: Course Section API
 */

/**
 * @swagger
 * /api/course-sections:
 *   post:
 *     summary: Yeni ders şubesi oluştur
 *     tags: [Course Sections]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/",
  auth,
  role("Admin"),
  validate(courseSectionSchema),
  createCourseSection
);

/**
 * @swagger
 * /api/course-sections:
 *   get:
 *     summary: Tüm ders şubelerini listele
 *     tags: [Course Sections]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", auth, getAllCourseSections);

/**
 * @swagger
 * /api/course-sections/{id}:
 *   get:
 *     summary: Ders şubesi getir
 *     tags: [Course Sections]
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", auth, getCourseSectionById);

/**
 * @swagger
 * /api/course-sections/{id}:
 *   put:
 *     summary: Ders şubesini güncelle
 *     tags: [Course Sections]
 *     security:
 *       - bearerAuth: []
 */
router.put("/:id", auth, role("Admin"), updateCourseSection);

/**
 * @swagger
 * /api/course-sections/{id}:
 *   delete:
 *     summary: Ders şubesini sil
 *     tags: [Course Sections]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:id", auth, role("Admin"), deleteCourseSection);

module.exports = router;