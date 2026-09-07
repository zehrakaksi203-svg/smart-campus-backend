const request = require("supertest");
const app = require("../src/app");
const {
  User,
  Student,
  Faculty,
  Department,
  Course,
  CourseSection,
  Classroom,
  AttendanceSession,
  Enrollment
} = require("../models");

// Bu dosya INTEGRATION testtir: gerçek (test) veritabanına bağlanır.
// tests/setup.js her test dosyası için veritabanını sıfırdan kurar (sequelize.sync({force:true})).

describe("Attendance Flow - GPS/QR/Spoofing (integration)", () => {
  const BASE_LAT = 39.9; // sınıfın / oturumun konumu
  const BASE_LON = 32.8;
  const FAR_LAT = 41.0082; // ~400km uzakta (İstanbul civarı)
  const FAR_LON = 28.9784;

  let facultyToken;
  let studentTokens = {}; // { A: token, B: token, C: token, D: token, E: token }
  let department;
  let facultyRecord;
  let course;
  let sectionAuto; // Classroom.classroom string "B-101" ile eşleşir (otomatik GPS testi için)
  let sectionManual; // genel amaçlı, manuel koordinatlı oturumlar için

  const makeStudent = async (email, studentNumber) => {
    await request(app).post("/api/v1/auth/register").send({
      fullName: `Test ${studentNumber}`,
      email,
      password: "Test1234!"
    });
    await User.update({ isVerified: true }, { where: { email } });
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "Test1234!" });
    const userRecord = await User.findOne({ where: { email } });
    await Student.create({
      userId: userRecord.id,
      departmentId: department.id,
      studentNumber,
      classYear: 1,
      gpa: 0
    });
    return loginRes.body.accessToken;
  };

  beforeAll(async () => {
    // --- Faculty kullanıcı ---
    const facultyEmail = "attendance.faculty@example.com";
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Yoklama Hocası",
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
      name: "Yoklama Test Bölümü",
      code: "ATT-TEST",
      facultyName: "Mühendislik Fakültesi",
      isActive: true
    });

    facultyRecord = await Faculty.create({
      userId: facultyUserRecord.id,
      departmentId: department.id,
      employeeNumber: "ATT-EMP-001",
      title: "Dr. Öğr. Üyesi",
      specialization: "Yazılım",
      office: "B-Blok 101"
    });

    course = await Course.create({
      departmentId: department.id,
      facultyId: facultyRecord.id,
      courseCode: "ATT101",
      courseName: "Yoklama Test Dersi",
      credit: 3,
      semester: "Güz",
      year: 2026,
      status: "Active"
    });

    // Classroom auto-match testi için gerçek sınıf kaydı
    await Classroom.create({
      building: "B Blok",
      roomNumber: "101",
      capacity: 40,
      latitude: BASE_LAT,
      longitude: BASE_LON
    });

    sectionAuto = await CourseSection.create({
      courseId: course.id,
      facultyId: facultyRecord.id,
      sectionCode: "ATT101-AUTO",
      semester: "Güz",
      capacity: 30,
      enrolledCount: 0,
      classroom: "B-101", // Classroom tablosundaki B Blok / 101 ile eşleşecek
      dayOfWeek: "Pazartesi",
      startTime: "09:00",
      endTime: "11:00",
      isActive: true
    });

    sectionManual = await CourseSection.create({
      courseId: course.id,
      facultyId: facultyRecord.id,
      sectionCode: "ATT101-MANUAL",
      semester: "Güz",
      capacity: 30,
      enrolledCount: 0,
      classroom: "Z-999", // Classroom tablosunda karşılığı yok, manuel koordinat gerekir
      dayOfWeek: "Salı",
      startTime: "09:00",
      endTime: "11:00",
      isActive: true
    });

    // --- Öğrenciler ---
    studentTokens.A = await makeStudent("attendance.a@example.com", "ATT-STU-A");
    studentTokens.B = await makeStudent("attendance.b@example.com", "ATT-STU-B");
    studentTokens.C = await makeStudent("attendance.c@example.com", "ATT-STU-C");
    studentTokens.D = await makeStudent("attendance.d@example.com", "ATT-STU-D");
    studentTokens.E = await makeStudent("attendance.e@example.com", "ATT-STU-E");

    // getMyAttendance testi Enrollment kaydı üzerinden dersleri bulduğu için
    // Student A'yı derse kaydediyoruz (attendance session'a check-in etmiş olması yetmiyor).
    const studentAUser = await User.findOne({ where: { email: "attendance.a@example.com" } });
    const studentARecord = await Student.findOne({ where: { userId: studentAUser.id } });
    await Enrollment.create({
      studentId: studentARecord.id,
      courseId: course.id,
      sectionId: sectionManual.id,
      semester: "Güz",
      academicYear: "2026-2027",
      status: "Active"
    });
  });

  afterAll(() => {
    delete process.env.CAMPUS_IP_PREFIX;
  });

  test("POST /api/v1/attendance/sessions - öğrenci oturum açamaz (403)", async () => {
    const res = await request(app)
      .post("/api/v1/attendance/sessions")
      .set("Authorization", `Bearer ${studentTokens.A}`)
      .send({
        sectionId: sectionManual.id,
        date: "2026-10-01",
        startTime: "09:00",
        endTime: "11:00",
        latitude: BASE_LAT,
        longitude: BASE_LON
      });

    expect(res.statusCode).toBe(403);
  });

  test("POST /api/v1/attendance/sessions - koordinat verilmezse, section'ın classroom koduna göre GPS otomatik bulunur", async () => {
    const res = await request(app)
      .post("/api/v1/attendance/sessions")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        sectionId: sectionAuto.id,
        date: "2026-10-01",
        startTime: "09:00",
        endTime: "11:00"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/otomatik bulundu/);
    expect(Number(res.body.session.latitude)).toBeCloseTo(BASE_LAT, 3);
    expect(Number(res.body.session.longitude)).toBeCloseTo(BASE_LON, 3);
  });

  let sessionNormal;
  test("POST /api/v1/attendance/sessions - manuel koordinatla oturum açılır", async () => {
    const res = await request(app)
      .post("/api/v1/attendance/sessions")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        sectionId: sectionManual.id,
        date: "2026-10-01",
        startTime: "09:00",
        endTime: "11:00",
        latitude: BASE_LAT,
        longitude: BASE_LON,
        geofenceRadius: 20
      });

    expect(res.statusCode).toBe(201);
    sessionNormal = res.body.session;
  });

  test("POST /api/v1/attendance/sessions/:id/checkin - sınıf konumunda yoklama flagged olmadan kaydedilir", async () => {
    const res = await request(app)
      .post(`/api/v1/attendance/sessions/${sessionNormal.id}/checkin`)
      .set("Authorization", `Bearer ${studentTokens.A}`)
      .send({ latitude: BASE_LAT, longitude: BASE_LON, accuracy: 5 });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/başarıyla verildi/);
    expect(res.body.record.isFlagged).toBe(false);
  });

  test("POST /api/v1/attendance/sessions/:id/checkin - aynı oturuma tekrar yoklama verilemez", async () => {
    const res = await request(app)
      .post(`/api/v1/attendance/sessions/${sessionNormal.id}/checkin`)
      .set("Authorization", `Bearer ${studentTokens.A}`)
      .send({ latitude: BASE_LAT, longitude: BASE_LON });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/zaten yoklama verdiniz/);
  });

  let sessionGeofence;
  test("POST /api/v1/attendance/sessions/:id/checkin - sınıftan çok uzaktan (geofence dışı) yoklama flagged olarak kaydedilir", async () => {
    const createRes = await request(app)
      .post("/api/v1/attendance/sessions")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        sectionId: sectionManual.id,
        date: "2026-10-02",
        startTime: "09:00",
        endTime: "11:00",
        latitude: BASE_LAT,
        longitude: BASE_LON,
        geofenceRadius: 15
      });
    sessionGeofence = createRes.body.session;

    const res = await request(app)
      .post(`/api/v1/attendance/sessions/${sessionGeofence.id}/checkin`)
      .set("Authorization", `Bearer ${studentTokens.B}`)
      .send({ latitude: FAR_LAT, longitude: FAR_LON, accuracy: 5 });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/şüpheli/);
    expect(res.body.record.isFlagged).toBe(true);
    expect(res.body.record.flagReason).toMatch(/uzaklık/);
  });

  test("Hız anomalisi: kısa sürede fiziksel olarak imkansız mesafe kat eden öğrenci flagged olarak işaretlenir (geofence'i geçse bile)", async () => {
    // 1) Öğrenci C, Ankara'daki oturuma normal şekilde yoklama verir (önceki kaydı yok, flagged olmamalı)
    const sessionAnkaraRes = await request(app)
      .post("/api/v1/attendance/sessions")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        sectionId: sectionManual.id,
        date: "2026-10-03",
        startTime: "09:00",
        endTime: "11:00",
        latitude: BASE_LAT,
        longitude: BASE_LON,
        geofenceRadius: 20
      });
    const sessionAnkara = sessionAnkaraRes.body.session;

    const firstCheckin = await request(app)
      .post(`/api/v1/attendance/sessions/${sessionAnkara.id}/checkin`)
      .set("Authorization", `Bearer ${studentTokens.C}`)
      .send({ latitude: BASE_LAT, longitude: BASE_LON });

    expect(firstCheckin.statusCode).toBe(201);
    expect(firstCheckin.body.record.isFlagged).toBe(false);

    // 2) Hemen ardından, aynı öğrenci İstanbul'daki başka bir oturuma (kendi geofence'i içinde) yoklama verir.
    //    Konum kendi oturumunun içinde olsa da, önceki kayda göre birkaç saniyede ~400km kat etmiş görünür -> hız anomalisi.
    const sessionIstanbulRes = await request(app)
      .post("/api/v1/attendance/sessions")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        sectionId: sectionManual.id,
        date: "2026-10-03",
        startTime: "12:00",
        endTime: "14:00",
        latitude: FAR_LAT,
        longitude: FAR_LON,
        geofenceRadius: 20
      });
    const sessionIstanbul = sessionIstanbulRes.body.session;

    const secondCheckin = await request(app)
      .post(`/api/v1/attendance/sessions/${sessionIstanbul.id}/checkin`)
      .set("Authorization", `Bearer ${studentTokens.C}`)
      .send({ latitude: FAR_LAT, longitude: FAR_LON });

    expect(secondCheckin.statusCode).toBe(201);
    expect(secondCheckin.body.record.isFlagged).toBe(true);
    expect(secondCheckin.body.record.flagReason).toMatch(/imkansız hız/);
  });

  test("PUT /sessions/:id/refresh-qr + POST /sessions/checkin-qr/:qrCode - QR ile yoklama akışı", async () => {
    const createRes = await request(app)
      .post("/api/v1/attendance/sessions")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        sectionId: sectionManual.id,
        date: "2026-10-04",
        startTime: "09:00",
        endTime: "11:00",
        latitude: BASE_LAT,
        longitude: BASE_LON,
        geofenceRadius: 20
      });
    const session = createRes.body.session;
    const oldQrCode = session.qrCode;

    const refreshRes = await request(app)
      .put(`/api/v1/attendance/sessions/${session.id}/refresh-qr`)
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(refreshRes.statusCode).toBe(200);
    const newQrCode = refreshRes.body.qrCode;
    expect(newQrCode).not.toBe(oldQrCode);

    // Yeni kodla yoklama başarılı
    const checkinRes = await request(app)
      .post(`/api/v1/attendance/sessions/checkin-qr/${newQrCode}`)
      .set("Authorization", `Bearer ${studentTokens.D}`)
      .send({ latitude: BASE_LAT, longitude: BASE_LON });

    expect(checkinRes.statusCode).toBe(201);

    // Eski (yenilenmiş) kod artık geçersiz
    const oldCodeRes = await request(app)
      .post(`/api/v1/attendance/sessions/checkin-qr/${oldQrCode}`)
      .set("Authorization", `Bearer ${studentTokens.E}`)
      .send({ latitude: BASE_LAT, longitude: BASE_LON });

    expect(oldCodeRes.statusCode).toBe(404);
  });

  test("Kampüs ağı kontrolü: CAMPUS_IP_PREFIX tanımlıyken ağ dışından yoklama reddedilir, eşleşen IP ile kabul edilir", async () => {
    process.env.CAMPUS_IP_PREFIX = "10.0.0.";

    const createRes = await request(app)
      .post("/api/v1/attendance/sessions")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        sectionId: sectionManual.id,
        date: "2026-10-05",
        startTime: "09:00",
        endTime: "11:00",
        latitude: BASE_LAT,
        longitude: BASE_LON,
        geofenceRadius: 20
      });
    const session = createRes.body.session;

    // Kampüs dışı bir IP ile reddedilir (x-forwarded-for eşleşmiyor)
    const rejectedRes = await request(app)
      .post(`/api/v1/attendance/sessions/${session.id}/checkin`)
      .set("Authorization", `Bearer ${studentTokens.E}`)
      .set("x-forwarded-for", "8.8.8.8")
      .send({ latitude: BASE_LAT, longitude: BASE_LON });

    expect(rejectedRes.statusCode).toBe(403);
    expect(rejectedRes.body.message).toMatch(/kampüs ağına bağlıyken/);

    // Kampüs IP'siyle (x-forwarded-for eşleşen) kabul edilir
    const acceptedRes = await request(app)
      .post(`/api/v1/attendance/sessions/${session.id}/checkin`)
      .set("Authorization", `Bearer ${studentTokens.E}`)
      .set("x-forwarded-for", "10.0.0.42")
      .send({ latitude: BASE_LAT, longitude: BASE_LON });

    expect(acceptedRes.statusCode).toBe(201);

    delete process.env.CAMPUS_IP_PREFIX;
  });

  test("GET /api/v1/attendance/report/:sectionId - öğrenci başkasının yoklama raporunu göremez (403)", async () => {
    const res = await request(app)
      .get(`/api/v1/attendance/report/${sectionManual.id}`)
      .set("Authorization", `Bearer ${studentTokens.A}`);

    expect(res.statusCode).toBe(403);
  });

  test("GET /api/v1/attendance/report/:sectionId - flagged kayıtlar rapora yansır", async () => {
    const res = await request(app)
      .get(`/api/v1/attendance/report/${sectionManual.id}`)
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.flaggedRecords.length).toBeGreaterThanOrEqual(2); // B (geofence) + C (velocity)
  });

  test("GET /api/v1/attendance/my-attendance - öğrenci kendi devam istatistiklerini görür", async () => {
    const res = await request(app)
      .get("/api/v1/attendance/my-attendance")
      .set("Authorization", `Bearer ${studentTokens.A}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const courseStat = res.body.find((c) => c.courseId === course.id);
    expect(courseStat).toBeDefined();
    expect(courseStat.attendedSessions).toBeGreaterThanOrEqual(1);
  });

  test("PUT /sessions/:id/close - başka öğretim üyesi oturumu kapatamaz (403)", async () => {
    const otherFacultyEmail = "attendance.other.faculty@example.com";
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Diğer Hoca",
      email: otherFacultyEmail,
      password: "Test1234!"
    });
    await User.update(
      { isVerified: true, role: "Faculty" },
      { where: { email: otherFacultyEmail } }
    );
    const otherLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: otherFacultyEmail, password: "Test1234!" });
    const otherUser = await User.findOne({ where: { email: otherFacultyEmail } });
    await Faculty.create({
      userId: otherUser.id,
      departmentId: department.id,
      employeeNumber: "ATT-EMP-002",
      title: "Öğr. Gör.",
      specialization: "Donanım",
      office: "C-Blok 5"
    });

    const res = await request(app)
      .put(`/api/v1/attendance/sessions/${sessionNormal.id}/close`)
      .set("Authorization", `Bearer ${otherLogin.body.accessToken}`);

    expect(res.statusCode).toBe(403);
  });

  test("PUT /sessions/:id/close - sahibi oturumu başarıyla kapatır", async () => {
    const res = await request(app)
      .put(`/api/v1/attendance/sessions/${sessionNormal.id}/close`)
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(res.statusCode).toBe(200);

    const updated = await AttendanceSession.findByPk(sessionNormal.id);
    expect(updated.status).toBe("Closed");
  });

  test("GET /api/v1/attendance/sessions/my-sessions - tokensız erişim reddedilir", async () => {
    const res = await request(app).get("/api/v1/attendance/sessions/my-sessions");
    expect(res.statusCode).toBe(401);
  });
});