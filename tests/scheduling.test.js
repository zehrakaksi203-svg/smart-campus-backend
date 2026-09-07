const request = require("supertest");
const app = require("../src/app");
const {
  User,
  Faculty,
  Department,
  Course,
  CourseSection,
  Classroom
} = require("../models");

// Bu dosya INTEGRATION testtir: gerçek (test) veritabanına bağlanır.

describe("Scheduling Flow (integration)", () => {
  let adminToken;
  let studentToken;
  let department;
  let facultyRecord;
  let course;

  beforeAll(async () => {
    const adminEmail = "scheduling.admin@example.com";
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Program Admin",
      email: adminEmail,
      password: "Test1234!"
    });
    await User.update(
      { isVerified: true, role: "Admin" },
      { where: { email: adminEmail } }
    );
    const adminLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password: "Test1234!" });
    adminToken = adminLogin.body.accessToken;

    const studentEmail = "scheduling.student@example.com";
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Program Öğrenci",
      email: studentEmail,
      password: "Test1234!"
    });
    await User.update({ isVerified: true }, { where: { email: studentEmail } });
    const studentLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: studentEmail, password: "Test1234!" });
    studentToken = studentLogin.body.accessToken;

    const facultyEmail = "scheduling.faculty@example.com";
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Program Hocası",
      email: facultyEmail,
      password: "Test1234!"
    });
    await User.update(
      { isVerified: true, role: "Faculty" },
      { where: { email: facultyEmail } }
    );
    const facultyUserRecord = await User.findOne({ where: { email: facultyEmail } });

    department = await Department.create({
      name: "Program Test Bölümü",
      code: "SCH-TEST",
      facultyName: "Mühendislik Fakültesi",
      isActive: true
    });

    facultyRecord = await Faculty.create({
      userId: facultyUserRecord.id,
      departmentId: department.id,
      employeeNumber: "SCH-EMP-001",
      title: "Dr. Öğr. Üyesi",
      specialization: "Yazılım",
      office: "E-Blok 1"
    });

    course = await Course.create({
      departmentId: department.id,
      facultyId: facultyRecord.id,
      courseCode: "SCH101",
      courseName: "Program Test Dersi",
      credit: 3,
      semester: "Güz",
      year: 2026,
      status: "Active"
    });

    await Classroom.create({
      building: "E Blok",
      roomNumber: "201",
      capacity: 40,
      latitude: 39.9,
      longitude: 32.8
    });

    // 3 şube, aynı öğretim üyesi, aynı dönem - çakışmasız şekilde farklı slotlara atanmalı
    // (dayOfWeek/startTime/endTime NOT NULL - generateSchedule tarafından zaten üzerine yazılacak
    // yer tutucu değerlerle oluşturuyoruz)
    for (let i = 1; i <= 3; i++) {
      await CourseSection.create({
        courseId: course.id,
        facultyId: facultyRecord.id,
        sectionCode: `SCH101-${i}`,
        semester: "Güz",
        capacity: 30,
        enrolledCount: 0,
        classroom: "TBD",
        dayOfWeek: "Pazartesi",
        startTime: "00:00",
        endTime: "00:00",
        isActive: true
      });
    }
  });

  test("POST /api/v1/scheduling/generate - öğrenci program oluşturamaz (403)", async () => {
    const res = await request(app)
      .post("/api/v1/scheduling/generate")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ semester: "Güz" });

    expect(res.statusCode).toBe(403);
  });

  test("POST /api/v1/scheduling/generate - semester eksikse 400 döner", async () => {
    const res = await request(app)
      .post("/api/v1/scheduling/generate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
  });

  test("POST /api/v1/scheduling/generate - o dönem için hiç şube yoksa anlamlı hata döner", async () => {
    const res = await request(app)
      .post("/api/v1/scheduling/generate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ semester: "Bahar" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/ders şubesi bulunamadı/);
  });

  test("POST /api/v1/scheduling/generate - Admin başarıyla program oluşturur, aynı hocanın şubeleri çakışmaz", async () => {
    const res = await request(app)
      .post("/api/v1/scheduling/generate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ semester: "Güz" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.scheduledCount).toBe(3);

    const sections = await CourseSection.findAll({ where: { courseId: course.id } });
    const slots = sections.map((s) => `${s.dayOfWeek}_${s.startTime}`);
    const uniqueSlots = new Set(slots);

    // Aynı öğretim üyesinin 3 şubesi 3 farklı (gün, saat) slotuna atanmış olmalı
    expect(uniqueSlots.size).toBe(3);
    sections.forEach((s) => {
      expect(s.classroom).toBe("E Blok - 201");
    });
  });

  test("GET /api/v1/scheduling - tokensız erişim reddedilir", async () => {
    const res = await request(app).get("/api/v1/scheduling?semester=Güz");
    expect(res.statusCode).toBe(401);
  });

  test("GET /api/v1/scheduling - öğrenci de dahil, giriş yapan herkes programı görebilir", async () => {
    const res = await request(app)
      .get("/api/v1/scheduling")
      .query({ semester: "Güz" })
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.sections).toHaveLength(3);
  });
});