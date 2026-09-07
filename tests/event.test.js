const request = require("supertest");
const app = require("../src/app");
const { User, Student, Faculty, Department, Event, EventRegistration } = require("../models");

// Bu dosya INTEGRATION testtir: gerçek (test) veritabanına bağlanır.

describe("Event Flow (integration)", () => {
  let adminToken;
  let facultyToken;
  let studentToken;
  let department;
  let facultyRecord;

  beforeAll(async () => {
    // Admin
    const adminEmail = "event.admin@example.com";
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Etkinlik Admin",
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

    // Faculty
    const facultyEmail = "event.faculty@example.com";
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Etkinlik Hocası",
      email: facultyEmail,
      password: "Test1234!"
    });
    await User.update(
      { isVerified: true, role: "Faculty" },
      { where: { email: facultyEmail } }
    );
    const facultyLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: facultyEmail, password: "Test1234!" });
    facultyToken = facultyLogin.body.accessToken;
    const facultyUserRecord = await User.findOne({ where: { email: facultyEmail } });

    department = await Department.create({
      name: "Etkinlik Test Bölümü",
      code: "EVT-TEST",
      facultyName: "Mühendislik Fakültesi",
      isActive: true
    });

    facultyRecord = await Faculty.create({
      userId: facultyUserRecord.id,
      departmentId: department.id,
      employeeNumber: "EVT-EMP-001",
      title: "Dr. Öğr. Üyesi",
      specialization: "Etkinlik Yönetimi",
      office: "D-Blok 1"
    });

    // Student
    const studentEmail = "event.student@example.com";
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Etkinlik Öğrenci",
      email: studentEmail,
      password: "Test1234!"
    });
    await User.update({ isVerified: true }, { where: { email: studentEmail } });
    const studentLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: studentEmail, password: "Test1234!" });
    studentToken = studentLogin.body.accessToken;
    const studentUserRecord = await User.findOne({ where: { email: studentEmail } });

    await Student.create({
      userId: studentUserRecord.id,
      departmentId: department.id,
      studentNumber: "EVT-STU-1",
      classYear: 1,
      gpa: 0
    });
  });

  test("POST /api/v1/events - öğrenci etkinlik oluşturamaz (403)", async () => {
    const res = await request(app)
      .post("/api/v1/events")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        title: "İzinsiz Etkinlik",
        eventDate: "2026-11-01",
        location: "Kampüs",
        capacity: 10
      });

    expect(res.statusCode).toBe(403);
  });

  test("POST /api/v1/events - zorunlu alanlar eksikse 400 döner", async () => {
    const res = await request(app)
      .post("/api/v1/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Eksik Etkinlik" });

    expect(res.statusCode).toBe(400);
  });

  let publicEvent;
  test("POST /api/v1/events - Faculty kendi organizerId'siyle etkinlik oluşturabilir", async () => {
    const res = await request(app)
      .post("/api/v1/events")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        title: "Bahar Şenliği",
        description: "Yıllık şenlik",
        eventDate: "2026-05-01",
        location: "Kampüs Meydanı",
        capacity: 2
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.event.organizerId).toBe(facultyRecord.id);
    publicEvent = res.body.event;
  });

  test("GET /api/v1/events - tokensız erişim reddedilir", async () => {
    const res = await request(app).get("/api/v1/events");
    expect(res.statusCode).toBe(401);
  });

  test("GET /api/v1/events - giriş yapan herkes listeyi görebilir", async () => {
    const res = await request(app)
      .get("/api/v1/events")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.events.length).toBeGreaterThanOrEqual(1);
  });

  test("GET /api/v1/events/:id - var olmayan etkinlik 400 döner", async () => {
    const res = await request(app)
      .get("/api/v1/events/999999")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(400);
  });

  let registrationId;
  test("POST /api/v1/events/registrations - öğrenci etkinliğe kayıt olur", async () => {
    const res = await request(app)
      .post("/api/v1/events/registrations")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ eventId: publicEvent.id });

    expect(res.statusCode).toBe(201);
    expect(res.body.registration.status).toBe("Registered");
    registrationId = res.body.registration.id;
  });

  test("POST /api/v1/events/registrations - aynı etkinliğe tekrar kayıt olunamaz", async () => {
    const res = await request(app)
      .post("/api/v1/events/registrations")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ eventId: publicEvent.id });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/zaten kayıtlısınız/);
  });

  test("POST /api/v1/events/registrations - kontenjan dolunca yeni kayıt reddedilir", async () => {
    // publicEvent capacity=2, zaten 1 kayıt var; 2 öğrenci daha ekleyip kontenjanı dolduralım
    const makeStudentAndRegister = async (email, num) => {
      await request(app).post("/api/v1/auth/register").send({
        fullName: `Kontenjan ${num}`,
        email,
        password: "Test1234!"
      });
      await User.update({ isVerified: true }, { where: { email } });
      const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email, password: "Test1234!" });
      const userRecord = await User.findOne({ where: { email } });
      await Student.create({
        userId: userRecord.id,
        departmentId: department.id,
        studentNumber: `EVT-STU-${num}`,
        classYear: 1,
        gpa: 0
      });
      return request(app)
        .post("/api/v1/events/registrations")
        .set("Authorization", `Bearer ${login.body.accessToken}`)
        .send({ eventId: publicEvent.id });
    };

    // capacity=2, birinci öğrenci zaten kayıtlı -> bu kayıt kontenjanı doldurur (2/2)
    const secondRes = await makeStudentAndRegister("event.capacity2@example.com", 2);
    expect(secondRes.statusCode).toBe(201);

    // üçüncü öğrenci -> kontenjan dolu, reddedilmeli
    const thirdRes = await makeStudentAndRegister("event.capacity3@example.com", 3);
    expect(thirdRes.statusCode).toBe(400);
    expect(thirdRes.body.message).toMatch(/kontenjanı dolu/);
  });

  test("GET /api/v1/events/my-registrations - öğrenci sadece kendi kayıtlarını görür", async () => {
    const res = await request(app)
      .get("/api/v1/events/my-registrations")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.registrations).toHaveLength(1);
    expect(res.body.registrations[0].event).toBeDefined();
  });

  test("POST /api/v1/events/registrations/:id/qr - kayıt sahibi QR üretebilir", async () => {
    const res = await request(app)
      .post(`/api/v1/events/registrations/${registrationId}/qr`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.qrCode).toMatch(/^data:image\/png;base64,/);
  });

  test("POST /api/v1/events/registrations/:id/qr - başkasının kaydı için QR üretilemez", async () => {
    const otherEmail = "event.other@example.com";
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Başka Öğrenci",
      email: otherEmail,
      password: "Test1234!"
    });
    await User.update({ isVerified: true }, { where: { email: otherEmail } });
    const otherLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: otherEmail, password: "Test1234!" });
    const otherUser = await User.findOne({ where: { email: otherEmail } });
    await Student.create({
      userId: otherUser.id,
      departmentId: department.id,
      studentNumber: "EVT-STU-OTHER",
      classYear: 1,
      gpa: 0
    });

    const res = await request(app)
      .post(`/api/v1/events/registrations/${registrationId}/qr`)
      .set("Authorization", `Bearer ${otherLogin.body.accessToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Kayıt bulunamadı/);
  });
});