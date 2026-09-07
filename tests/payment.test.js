const request = require("supertest");
const app = require("../src/app");
const { User, Student, Department, Payment } = require("../models");

// Bu dosya INTEGRATION testtir: gerçek (test) veritabanına bağlanır.
// NOT: /checkout-session endpoint'i gerçek Stripe API'sine ağ isteği attığı için
// (sandbox ağ erişimi kısıtlı) burada test edilmiyor - o akış payment.service.test.js'te
// Stripe mocklanarak zaten kapsanıyor.

describe("Payment Flow (integration)", () => {
  let adminToken;
  let studentTokenA;
  let studentTokenB;
  let studentARecord;
  let department;

  beforeAll(async () => {
    const adminEmail = "payment.admin@example.com";
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Ödeme Admin",
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

    department = await Department.create({
      name: "Ödeme Test Bölümü",
      code: "PAY-TEST",
      facultyName: "Mühendislik Fakültesi",
      isActive: true
    });

    const makeStudent = async (email, num) => {
      await request(app).post("/api/v1/auth/register").send({
        fullName: `Ödeme Öğrenci ${num}`,
        email,
        password: "Test1234!"
      });
      await User.update({ isVerified: true }, { where: { email } });
      const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email, password: "Test1234!" });
      const userRecord = await User.findOne({ where: { email } });
      const student = await Student.create({
        userId: userRecord.id,
        departmentId: department.id,
        studentNumber: `PAY-STU-${num}`,
        classYear: 1,
        gpa: 0
      });
      return { token: login.body.accessToken, student };
    };

    const a = await makeStudent("payment.a@example.com", "A");
    studentTokenA = a.token;
    studentARecord = a.student;

    const b = await makeStudent("payment.b@example.com", "B");
    studentTokenB = b.token;
  });

  let ownPaymentId;
  test("POST /api/v1/payments - öğrenci kendi adına ödeme kaydı oluşturur (studentId gövdede verilse bile kendi id'sine zorlanır)", async () => {
    const res = await request(app)
      .post("/api/v1/payments")
      .set("Authorization", `Bearer ${studentTokenA}`)
      .send({ studentId: 999999, type: "Tuition", amount: 1500 });

    expect(res.statusCode).toBe(201);
    expect(res.body.studentId).toBe(studentARecord.id);
    expect(res.body.status).toBe("Pending");
    ownPaymentId = res.body.id;
  });

  test("POST /api/v1/payments - zorunlu alanlar eksikse 400 döner", async () => {
    const res = await request(app)
      .post("/api/v1/payments")
      .set("Authorization", `Bearer ${studentTokenA}`)
      .send({ type: "Tuition" });

    expect(res.statusCode).toBe(400);
  });

  test("POST /api/v1/payments/:id/pay - başka öğrencinin ödemesi gerçekleştirilemez (403)", async () => {
    const res = await request(app)
      .post(`/api/v1/payments/${ownPaymentId}/pay`)
      .set("Authorization", `Bearer ${studentTokenB}`);

    expect(res.statusCode).toBe(403);
  });

  test("POST /api/v1/payments/:id/pay - sahibi ödemeyi tamamlar", async () => {
    const res = await request(app)
      .post(`/api/v1/payments/${ownPaymentId}/pay`)
      .set("Authorization", `Bearer ${studentTokenA}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("Completed");

    const updated = await Payment.findByPk(ownPaymentId);
    expect(updated.paidAt).not.toBeNull();
  });

  test("POST /api/v1/payments/:id/pay - zaten tamamlanmış ödeme tekrar ödenemez (400)", async () => {
    const res = await request(app)
      .post(`/api/v1/payments/${ownPaymentId}/pay`)
      .set("Authorization", `Bearer ${studentTokenA}`);

    expect(res.statusCode).toBe(400);
  });

  test("GET /api/v1/payments/my - öğrenci sadece kendi ödemelerini görür", async () => {
    const res = await request(app)
      .get("/api/v1/payments/my")
      .set("Authorization", `Bearer ${studentTokenA}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(ownPaymentId);
  });

  test("GET /api/v1/payments - öğrenci tüm ödemeleri listeleyemez (403), Admin listeleyebilir", async () => {
    const studentRes = await request(app)
      .get("/api/v1/payments")
      .set("Authorization", `Bearer ${studentTokenA}`);
    expect(studentRes.statusCode).toBe(403);

    const adminRes = await request(app)
      .get("/api/v1/payments")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminRes.statusCode).toBe(200);
    expect(Array.isArray(adminRes.body)).toBe(true);
    expect(adminRes.body.length).toBeGreaterThanOrEqual(1);
  });

  test("POST /api/v1/payments - Admin başka bir öğrenci için ödeme oluşturabilir", async () => {
    const res = await request(app)
      .post("/api/v1/payments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ studentId: studentARecord.id, type: "Meal", amount: 50 });

    expect(res.statusCode).toBe(201);
    expect(res.body.studentId).toBe(studentARecord.id);
  });

  test("GET /api/v1/payments/my - tokensız erişim reddedilir", async () => {
    const res = await request(app).get("/api/v1/payments/my");
    expect(res.statusCode).toBe(401);
  });
});