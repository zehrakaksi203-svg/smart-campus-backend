const express = require("express");

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const upload = require("../../middleware/multer");

const {
  getMe,
  updateMe,
  uploadProfilePicture,
  getAllUsers,
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

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User API
 */

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Giriş yapan kullanıcı bilgileri
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcı bilgileri
 *       401:
 *         description: Yetkisiz erişim
 */
userRouter.get("/me", auth, getMe);

/**
 * @swagger
 * /api/v1/users/me:
 *   put:
 *     tags:
 *       - Users
 *     summary: Giriş yapan kullanıcı bilgilerini güncelle
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcı güncellendi
 *       401:
 *         description: Yetkisiz erişim
 */
userRouter.put("/me", auth, updateMe);

/**
 * @swagger
 * /api/v1/users/me/profile-picture:
 *   post:
 *     tags:
 *       - Users
 *     summary: Profil fotoğrafı yükle
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil fotoğrafı yüklendi
 */
userRouter.post(
  "/me/profile-picture",
  auth,
  upload.single("profilePicture"),
  uploadProfilePicture
);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Kullanıcı listesi (sadece Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Sayfa numarası (varsayılan 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Sayfa başına kayıt (varsayılan 10)
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [Student, Faculty, Admin]
 *         description: Role göre filtrele
 *       - in: query
 *         name: department
 *         schema:
 *           type: integer
 *         description: Departman ID'sine göre filtrele
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: İsim veya email içinde ara
 *     responses:
 *       200:
 *         description: Kullanıcı listesi
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Sadece Admin erişebilir
 */
userRouter.get("/", auth, role("Admin"), getAllUsers);

const studentRouter = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Students
 *     description: Student API
 */

studentRouter.post("/", auth, role("Admin"), createStudent);
studentRouter.get("/", auth, getAllStudents);
studentRouter.get("/:id", auth, getStudentById);
studentRouter.put("/:id", auth, role("Admin"), updateStudent);
studentRouter.delete("/:id", auth, role("Admin"), deleteStudent);

const facultyRouter = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Faculties
 *     description: Faculty API
 */

facultyRouter.post("/", auth, role("Admin"), createFaculty);
facultyRouter.get("/", auth, getAllFaculties);
facultyRouter.get("/:id", auth, getFacultyById);
facultyRouter.put("/:id", auth, role("Admin"), updateFaculty);
facultyRouter.delete("/:id", auth, role("Admin"), deleteFaculty);

module.exports = userRouter;
module.exports.studentRouter = studentRouter;
module.exports.facultyRouter = facultyRouter;