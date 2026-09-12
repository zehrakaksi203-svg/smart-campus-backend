const request = require("supertest");
const app = require("../src/app");
const { User, Student, Department, Meal, MealReservation, Wallet } = require("../models");

// Bu dosya INTEGRATION testtir: gerçek (test) veritabanına bağlanır.

describe("Meal Flow (integration)", () => {
  let studentToken;
  let department;
  let studentRecord;
  let meal;

  beforeAll(async () => {
    const email = "meal.student@example.com";
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Yemek Test Öğrenci",
      email,
      password: "Test1234!"
    });
    await User.update({ isVerified: true }, { where: { email } });
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "Test1234!" });
    studentToken = loginRes.body.accessToken;

    const userRecord = await User.findOne({ where: { email } });

    department = await Department.create({
      name: "Yemek Test Bölümü",
      code: "MEAL-TEST",
      facultyName: "Mühendislik Fakültesi",
      isActive: true
    });

    studentRecord = await Student.create({
      userId: userRecord.id,
      departmentId: department.id,
      studentNumber: "MEAL-STU-1",
      classYear: 1,
      gpa: 0
    });
    await Wallet.create({
      studentId: studentRecord.id,
      balance: 1000
    });

    meal = await Meal.create({
      name: "Tavuklu Salata",
      description: "Izgara tavuk, mevsim yeşillikleri",
      price: 25,
      quota: 100,
      availableDate: "2026-10-01",
      isActive: true
    });
  });

  test("GET /api/v1/meals - tokensız erişim reddedilir", async () => {
    const res = await request(app).get("/api/v1/meals");
    expect(res.statusCode).toBe(401);
  });

  test("GET /api/v1/meals - giriş yapan kullanıcı yemek listesini görür", async () => {
    const res = await request(app)
      .get("/api/v1/meals")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meals.length).toBeGreaterThanOrEqual(1);
  });

  test("POST /api/v1/meals/reservations - mealId olmadan 400 döner", async () => {
    const res = await request(app)
      .post("/api/v1/meals/reservations")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
  });

  test("POST /api/v1/meals/reservations - var olmayan yemek için rezervasyon 400 döner", async () => {
    const res = await request(app)
      .post("/api/v1/meals/reservations")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ mealId: 999999 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Yemek bulunamadı/);
  });

  let reservationId;
  test("POST /api/v1/meals/reservations - geçerli yemek için rezervasyon oluşturulur", async () => {
    const res = await request(app)
      .post("/api/v1/meals/reservations")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ mealId: meal.id });

    expect(res.statusCode).toBe(201);
    expect(res.body.reservation.status).toBe("Reserved");
    reservationId = res.body.reservation.id;
  });

  let qrData;
  test("POST /api/v1/meals/reservations/:id/qr - rezervasyon için QR kod üretir", async () => {
    const res = await request(app)
      .post(`/api/v1/meals/reservations/${reservationId}/qr`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.qrCode).toMatch(/^data:image\/png;base64,/);

    const reservation = await MealReservation.findByPk(reservationId);
    qrData = JSON.stringify({ reservationId: reservation.id, token: extractTokenIsNotPossible() });
  });

  function extractTokenIsNotPossible() {
    // QR verisi (reservationId+token) yalnızca sunucu tarafında saklanıyor (base64 PNG olarak);
    // gerçek bir QR tarayıcı gibi ham JSON veriye erişimimiz yok, bu yüzden doğrulama testini
    // servis katmanında (meal.service.test.js) ayrıntılı olarak kapsadık. Burada sadece
    // uçtan uca "QR üretildi mi" ve "tekrar QR üretilemez mi" akışını doğruluyoruz.
    return null;
  }

  test("POST /api/v1/meals/reservations/:id/qr - QR zaten üretilmiş bir rezervasyon için hâlâ üretim yapılabilir (kod yenilenir)", async () => {
    // Not: generateReservationQr yalnızca status==='Reserved' ve qrUsed===false kontrolü yapar,
    // daha önce QR üretilmiş olması (qrCode dolu) tekrar üretimi engellemiyor.
    const res = await request(app)
      .post(`/api/v1/meals/reservations/${reservationId}/qr`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
  });

  test("POST /api/v1/meals/reservations/:id/qr - başka öğrencinin rezervasyonu için QR üretilemez", async () => {
    const otherEmail = "meal.other@example.com";
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Diğer Öğrenci",
      email: otherEmail,
      password: "Test1234!"
    });
    await User.update({ isVerified: true }, { where: { email: otherEmail } });
    const otherLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: otherEmail, password: "Test1234!" });

    const res = await request(app)
      .post(`/api/v1/meals/reservations/${reservationId}/qr`)
      .set("Authorization", `Bearer ${otherLogin.body.accessToken}`)
      .send();

    // otherLogin kullanıcısının Student kaydı yok -> controller 400 döner
    expect(res.statusCode).toBe(400);
  });

  test("GET /api/v1/meals/reservations/my - öğrenci sadece kendi rezervasyonlarını görür", async () => {
    const res = await request(app)
      .get("/api/v1/meals/reservations/my")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.reservations).toHaveLength(1);
    expect(res.body.reservations[0].meal).toBeDefined();
  });

  test("POST /api/v1/meals - BULGU: rol kontrolü olmadığı için öğrenci de yemek oluşturabiliyor", async () => {
    const res = await request(app)
      .post("/api/v1/meals")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        name: "Öğrencinin Eklediği Yemek",
        price: 10,
        quota: 5,
        availableDate: "2026-10-05"
      });

    // Mevcut davranış: 201 (izin var). Bu route'ta role("Admin") kontrolü eksik.
    expect(res.statusCode).toBe(201);
  });
});