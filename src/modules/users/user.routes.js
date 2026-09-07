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
 *     summary: Giriş yapan kullanıcının bilgilerini getir
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcı bilgileri
 *       401:
 *         description: Yetkisiz erişim
 *
 *   put:
 *     tags:
 *       - Users
 *     summary: Giriş yapan kullanıcının bilgilerini güncelle
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Zehra Nur Kakşi"
 *               email:
 *                 type: string
 *                 example: "zehrakaksi203@gmail.com"
 *     responses:
 *       200:
 *         description: Kullanıcı güncellendi
 *       401:
 *         description: Yetkisiz erişim
 */
userRouter.get("/me", auth, getMe);
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
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
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
 *     summary: Kullanıcı listesi (Admin ve Faculty)
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
 *         description: Sadece Admin ve Faculty erişebilir
 */
userRouter.get("/", auth, role("Admin", "Faculty"), getAllUsers);

const studentRouter = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Students
 *     description: Student API
 */

/**
 * @swagger
 * /api/v1/students:
 *   post:
 *     summary: Yeni öğrenci kaydı oluştur (sadece Admin)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - departmentId
 *               - studentNumber
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: Role Student ile önceden kayıt olmuş kullanıcının id'si
 *                 example: 2
 *               departmentId:
 *                 type: integer
 *                 example: 1
 *               studentNumber:
 *                 type: string
 *                 example: "2026001"
 *               classYear:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Öğrenci oluşturuldu
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Sadece Admin erişebilir
 */
studentRouter.post("/", auth, role("Admin"), createStudent);

/**
 * @swagger
 * /api/v1/students:
 *   get:
 *     summary: Tüm öğrencileri listele
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Öğrenci listesi
 *       401:
 *         description: Yetkisiz erişim
 */
studentRouter.get("/", auth, getAllStudents);

/**
 * @swagger
 * /api/v1/students/{id}:
 *   get:
 *     summary: ID'ye göre öğrenci getir
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Öğrenci bilgisi
 *       404:
 *         description: Öğrenci bulunamadı
 */
studentRouter.get("/:id", auth, getStudentById);

/**
 * @swagger
 * /api/v1/students/{id}:
 *   put:
 *     summary: Öğrenciyi güncelle (sadece Admin)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               departmentId:
 *                 type: integer
 *               studentNumber:
 *                 type: string
 *               classYear:
 *                 type: integer
 *               gpa:
 *                 type: number
 *               status:
 *                 type: string
 *                 example: Active
 *     responses:
 *       200:
 *         description: Öğrenci güncellendi
 *       404:
 *         description: Öğrenci bulunamadı
 *       403:
 *         description: Sadece Admin erişebilir
 */
studentRouter.put("/:id", auth, role("Admin"), updateStudent);

/**
 * @swagger
 * /api/v1/students/{id}:
 *   delete:
 *     summary: Öğrenciyi sil (sadece Admin)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Öğrenci silindi
 *       404:
 *         description: Öğrenci bulunamadı
 *       403:
 *         description: Sadece Admin erişebilir
 */
studentRouter.delete("/:id", auth, role("Admin"), deleteStudent);

const facultyRouter = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Faculties
 *     description: Faculty API
 */

/**
 * @swagger
 * /api/v1/faculties:
 *   post:
 *     summary: Yeni öğretim üyesi kaydı oluştur (sadece Admin)
 *     tags: [Faculties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - departmentId
 *               - employeeNumber
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: Role Faculty ile önceden kayıt olmuş kullanıcının id'si
 *                 example: 3
 *               departmentId:
 *                 type: integer
 *                 example: 1
 *               employeeNumber:
 *                 type: string
 *                 example: "F2026001"
 *               title:
 *                 type: string
 *                 example: "Dr. Öğr. Üyesi"
 *               specialization:
 *                 type: string
 *                 example: "Yazılım Mühendisliği"
 *               office:
 *                 type: string
 *                 example: "B-204"
 *     responses:
 *       201:
 *         description: Öğretim üyesi oluşturuldu
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Sadece Admin erişebilir
 */
facultyRouter.post("/", auth, role("Admin"), createFaculty);

/**
 * @swagger
 * /api/v1/faculties:
 *   get:
 *     summary: Tüm öğretim üyelerini listele
 *     tags: [Faculties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Öğretim üyesi listesi
 *       401:
 *         description: Yetkisiz erişim
 */
facultyRouter.get("/", auth, getAllFaculties);

/**
 * @swagger
 * /api/v1/faculties/{id}:
 *   get:
 *     summary: ID'ye göre öğretim üyesi getir
 *     tags: [Faculties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Öğretim üyesi bilgisi
 *       404:
 *         description: Öğretim üyesi bulunamadı
 */
facultyRouter.get("/:id", auth, getFacultyById);

/**
 * @swagger
 * /api/v1/faculties/{id}:
 *   put:
 *     summary: Öğretim üyesini güncelle (sadece Admin)
 *     tags: [Faculties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               departmentId:
 *                 type: integer
 *               employeeNumber:
 *                 type: string
 *               title:
 *                 type: string
 *               specialization:
 *                 type: string
 *               office:
 *                 type: string
 *               status:
 *                 type: string
 *                 example: Active
 *     responses:
 *       200:
 *         description: Öğretim üyesi güncellendi
 *       404:
 *         description: Öğretim üyesi bulunamadı
 *       403:
 *         description: Sadece Admin erişebilir
 */
facultyRouter.put("/:id", auth, role("Admin"), updateFaculty);

/**
 * @swagger
 * /api/v1/faculties/{id}:
 *   delete:
 *     summary: Öğretim üyesini sil (sadece Admin)
 *     tags: [Faculties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Öğretim üyesi silindi
 *       404:
 *         description: Öğretim üyesi bulunamadı
 *       403:
 *         description: Sadece Admin erişebilir
 */
facultyRouter.delete("/:id", auth, role("Admin"), deleteFaculty);

module.exports = userRouter;
module.exports.studentRouter = studentRouter;
module.exports.facultyRouter = facultyRouter;