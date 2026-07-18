const request = require("supertest");
const app = require("../src/app");
const { User } = require("../models");

describe("User Management API", () => {
  const student = {
    fullName: "Öğrenci Kullanıcı",
    email: "student@example.com",
    password: "Test1234!",
    role: "Student",
  };

  const admin = {
    fullName: "Admin Kullanıcı",
    email: "admin@example.com",
    password: "Test1234!",
    role: "Admin",
  };

  let studentToken;
  let adminToken;

  beforeAll(async () => {
    await request(app).post("/api/v1/auth/register").send(student);
    await request(app).post("/api/v1/auth/register").send(admin);

    await User.update(
      { isVerified: true },
      { where: { email: [student.email, admin.email] } }
    );

    const studentLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: student.email, password: student.password });
    studentToken = studentLogin.body.accessToken;

    const adminLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: admin.email, password: admin.password });
    adminToken = adminLogin.body.accessToken;
  });

  test("GET /api/users/me - giriş yapan kullanıcının bilgisini döner", async () => {
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(student.email);
  });

  test("PUT /api/users/me - kullanıcı kendi bilgisini günceller", async () => {
    const res = await request(app)
      .put("/api/v1/users/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ fullName: "Güncellenmiş İsim" });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.fullName).toBe("Güncellenmiş İsim");
  });

  test("GET /api/users - tokensız erişim reddedilir", async () => {
    const res = await request(app).get("/api/v1/users");
    expect(res.statusCode).toBe(401);
  });

  test("GET /api/users - Admin olmayan kullanıcı erişemez", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(403);
  });

  test("GET /api/users - Admin kullanıcı listesini sayfalı şekilde görür", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ page: 1, limit: 10 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("users");
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThanOrEqual(2);
  });

  test("GET /api/users - role filtresi doğru çalışır", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ role: "Admin" });

    expect(res.statusCode).toBe(200);
    expect(
      res.body.users.every((u) => u.role === "Admin")
    ).toBe(true);
  });
});
