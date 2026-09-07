const request = require("supertest");
const app = require("../src/app");
const {
  User,
  Student,
  Faculty,
  Department,
  Course,
  CourseSection,
  CoursePrerequisite,
  Enrollment
} = require("../models");

// Bu dosya INTEGRATION testtir: gerçek (test) veritabanına bağlanır.
// tests/setup.js her test dosyası için veritabanını sıfırdan kurar (sequelize.sync({force:true})).

describe("Enrollment Flow (integration)", () => {
  const studentUser = {
    fullName: "Enrollment Test Öğrenci",
    email: "enrollment.student@example.com",
    password: "Test1234!"
  };

  const adminUser = {
    fullName: "Enrollment Test Admin",
    email: "enrollment.admin@example.com",
    password: "Test1234!"
  };

  let studentToken;
  let adminToken;
  let studentRecord;
  let department;
  let facultyRecord;

  // Sabitler: dersler ve şubeler
  let courseIntro; // önkoşulu olmayan ders (CS101)
  let courseAdvanced; // önkoşulu courseIntro olan ders (CS201)
  let courseElective; // kontenjan testi için, ilişkisiz üçüncü ders (CS301)
  let sectionIntro; // Pazartesi 09:00-11:00
  let sectionIntroAlt; // Salı 09:00-11:00 (courseIntro'nun başka bir şubesi, çakışmaz)
  let sectionAdvanced; // Çarşamba 09:00-11:00
  let sectionConflicting; // Çarşamba 10:00-12:00 (sectionAdvanced ile çakışır)
  let sectionFull; // Cuma 09:00-11:00, capacity=1, enrolledCount=1 (baştan dolu)

  let introEnrollmentId;

  beforeAll(async () => {
    // --- Kullanıcılar ---
    await request(app).post("/api/v1/auth/register").send(studentUser);
    await request(app).post("/api/v1/auth/register").send(adminUser);

    await User.update({ isVerified: true }, { where: { email: studentUser.email } });
    await User.update(
      { isVerified: true, role: "Admin" },
      { where: { email: adminUser.email } }
    );

    const studentLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: studentUser.email, password: studentUser.password });
    studentToken = studentLogin.body.accessToken;

    const adminLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: adminUser.email, password: adminUser.password });
    adminToken = adminLogin.body.accessToken;

    const studentUserRecord = await User.findOne({ where: { email: studentUser.email } });

    // --- Bölüm, öğretim üyesi, öğrenci profili (fixture, doğrudan model ile) ---
    department = await Department.create({
      name: "Bilgisayar Mühendisliği",
      code: "CENG-ENR-TEST",
      facultyName: "Mühendislik Fakültesi",
      isActive: true
    });

    const facultyUser = await User.create({
      fullName: "Test Hoca",
      email: "enrollment.faculty@example.com",
      password: "x",
      role: "Faculty",
      isVerified: true
    });

    facultyRecord = await Faculty.create({
      userId: facultyUser.id,
      departmentId: department.id,
      employeeNumber: "ENR-EMP-001",
      title: "Dr. Öğr. Üyesi",
      specialization: "Yazılım",
      office: "B-Blok 101"
    });

    studentRecord = await Student.create({
      userId: studentUserRecord.id,
      departmentId: department.id,
      studentNumber: "ENR-STU-001",
      classYear: 1,
      gpa: 0
    });

    // --- Dersler ---
    courseIntro = await Course.create({
      departmentId: department.id,
      facultyId: facultyRecord.id,
      courseCode: "CS101-ENR",
      courseName: "Programlamaya Giriş",
      credit: 4,
      semester: "Güz",
      year: 2026,
      status: "Active"
    });

    courseAdvanced = await Course.create({
      departmentId: department.id,
      facultyId: facultyRecord.id,
      courseCode: "CS201-ENR",
      courseName: "İleri Programlama",
      credit: 4,
      semester: "Güz",
      year: 2026,
      status: "Active"
    });

    courseElective = await Course.create({
      departmentId: department.id,
      facultyId: facultyRecord.id,
      courseCode: "CS301-ENR",
      courseName: "Seçmeli Ders",
      credit: 3,
      semester: "Güz",
      year: 2026,
      status: "Active"
    });

    await CoursePrerequisite.create({
      courseId: courseAdvanced.id,
      prerequisiteCourseId: courseIntro.id
    });

    // --- Şubeler ---
    sectionIntro = await CourseSection.create({
      courseId: courseIntro.id,
      facultyId: facultyRecord.id,
      sectionCode: "CS101-ENR-1",
      semester: "Güz",
      capacity: 5,
      enrolledCount: 0,
      classroom: "B-101",
      dayOfWeek: "Pazartesi",
      startTime: "09:00",
      endTime: "11:00",
      isActive: true
    });

    sectionIntroAlt = await CourseSection.create({
      courseId: courseIntro.id,
      facultyId: facultyRecord.id,
      sectionCode: "CS101-ENR-ALT",
      semester: "Güz",
      capacity: 5,
      enrolledCount: 0,
      classroom: "B-105",
      dayOfWeek: "Salı",
      startTime: "09:00",
      endTime: "11:00",
      isActive: true
    });

    sectionAdvanced = await CourseSection.create({
      courseId: courseAdvanced.id,
      facultyId: facultyRecord.id,
      sectionCode: "CS201-ENR-1",
      semester: "Güz",
      capacity: 5,
      enrolledCount: 0,
      classroom: "B-102",
      dayOfWeek: "Çarşamba",
      startTime: "09:00",
      endTime: "11:00",
      isActive: true
    });

    sectionConflicting = await CourseSection.create({
      courseId: courseIntro.id,
      facultyId: facultyRecord.id,
      sectionCode: "CS101-ENR-2",
      semester: "Güz",
      capacity: 5,
      enrolledCount: 0,
      classroom: "B-103",
      dayOfWeek: "Çarşamba",
      startTime: "10:00",
      endTime: "12:00",
      isActive: true
    });

    sectionFull = await CourseSection.create({
      courseId: courseElective.id,
      facultyId: facultyRecord.id,
      sectionCode: "CS301-ENR-1",
      semester: "Güz",
      capacity: 1,
      enrolledCount: 1, // baştan dolu
      classroom: "B-104",
      dayOfWeek: "Cuma",
      startTime: "09:00",
      endTime: "11:00",
      isActive: true
    });
  });

  test("POST /api/v1/enrollments - önkoşulu olmayan derse başarıyla kayıt olunur", async () => {
    const res = await request(app)
      .post("/api/v1/enrollments")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        sectionId: sectionIntro.id,
        semester: "Güz",
        academicYear: "2026-2027"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.enrollment).toHaveProperty("id");
    introEnrollmentId = res.body.enrollment.id;

    const updatedSection = await CourseSection.findByPk(sectionIntro.id);
    expect(updatedSection.enrolledCount).toBe(1);
  });

  test("POST /api/v1/enrollments - aynı derse (başka şubeden) tekrar kayıt olmak reddedilir", async () => {
    const res = await request(app)
      .post("/api/v1/enrollments")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        sectionId: sectionIntroAlt.id,
        semester: "Güz",
        academicYear: "2026-2027"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/zaten kayıtlısınız/);
  });

  test("POST /api/v1/enrollments - önkoşul tamamlanmadan ileri derse kayıt reddedilir", async () => {
    const res = await request(app)
      .post("/api/v1/enrollments")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        sectionId: sectionAdvanced.id,
        semester: "Güz",
        academicYear: "2026-2027"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Önkoşul/);
  });

  test("POST /api/v1/enrollments - önkoşul dersi kalan (FF) notla tamamlanmışsa yine reddedilir", async () => {
    await Enrollment.update(
      { letterGrade: "FF" },
      { where: { id: introEnrollmentId } }
    );

    const res = await request(app)
      .post("/api/v1/enrollments")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        sectionId: sectionAdvanced.id,
        semester: "Güz",
        academicYear: "2026-2027"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Önkoşul/);
  });

  test("POST /api/v1/enrollments - önkoşul dersi geçer (BA) notla tamamlanınca ileri derse kayıt başarılı olur", async () => {
    await Enrollment.update(
      { letterGrade: "BA" },
      { where: { id: introEnrollmentId } }
    );

    const res = await request(app)
      .post("/api/v1/enrollments")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        sectionId: sectionAdvanced.id,
        semester: "Güz",
        academicYear: "2026-2027"
      });

    expect(res.statusCode).toBe(201);
  });

  test("POST /api/v1/enrollments - mevcut programla saat çakışan şubeye kayıt reddedilir", async () => {
    const res = await request(app)
      .post("/api/v1/enrollments")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        sectionId: sectionConflicting.id,
        semester: "Güz",
        academicYear: "2026-2027"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/çakışma/);
  });

  test("POST /api/v1/enrollments - kontenjanı dolu şubeye kayıt reddedilir", async () => {
    const res = await request(app)
      .post("/api/v1/enrollments")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        sectionId: sectionFull.id,
        semester: "Güz",
        academicYear: "2026-2027"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/kontenjanı dolu/);
  });

  test("GET /api/v1/enrollments/my-courses - öğrenci sadece kendi aktif kayıtlarını görür", async () => {
    const res = await request(app)
      .get("/api/v1/enrollments/my-courses")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // sectionIntro + sectionAdvanced kayıtları (sectionConflicting ve sectionFull reddedildi)
    expect(res.body).toHaveLength(2);
  });

  test("GET /api/v1/enrollments/students/:sectionId - tokensız erişim reddedilir", async () => {
    const res = await request(app).get(
      `/api/v1/enrollments/students/${sectionIntro.id}`
    );

    expect(res.statusCode).toBe(401);
  });

  test("GET /api/v1/enrollments/students/:sectionId - öğrenci erişemez (403)", async () => {
    const res = await request(app)
      .get(`/api/v1/enrollments/students/${sectionIntro.id}`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(403);
  });

  test("GET /api/v1/enrollments/students/:sectionId - Admin bir şubeye kayıtlı öğrencileri görür", async () => {
    const res = await request(app)
      .get(`/api/v1/enrollments/students/${sectionIntro.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test("GET /api/v1/enrollments - öğrenci tüm kayıtları listeleyemez (403), Admin listeleyebilir", async () => {
    const studentRes = await request(app)
      .get("/api/v1/enrollments")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(studentRes.statusCode).toBe(403);

    const adminRes = await request(app)
      .get("/api/v1/enrollments")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminRes.statusCode).toBe(200);
    expect(Array.isArray(adminRes.body)).toBe(true);
  });

  test("DELETE /api/v1/enrollments/:id - dersten çekilince şube kontenjanı düşer", async () => {
    const res = await request(app)
      .delete(`/api/v1/enrollments/${introEnrollmentId}`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);

    const updatedSection = await CourseSection.findByPk(sectionIntro.id);
    expect(updatedSection.enrolledCount).toBe(0);

    const deletedEnrollment = await Enrollment.findByPk(introEnrollmentId);
    expect(deletedEnrollment).toBeNull();
  });

  test("DELETE /api/v1/enrollments/:id - var olmayan kayıt 404 döner", async () => {
    const res = await request(app)
      .delete("/api/v1/enrollments/999999")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(404);
  });
});