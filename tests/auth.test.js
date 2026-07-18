const request = require("supertest");
const app = require("../src/app");
const { User } = require("../models");

describe("Auth API", () => {
  const testUser = {
    fullName: "Test Kullanıcı",
    email: "test@example.com",
    password: "Test1234!",
    role: "Student",
  };

  let accessToken;
  let refreshToken;

  test("POST /api/auth/register - eksik alanlarla kayıt reddedilir", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(400);
  });

  test("POST /api/auth/register - zayıf şifre reddedilir", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...testUser, password: "12345678" });

    expect(res.statusCode).toBe(400);
  });

  test("POST /api/auth/register - yeni kullanıcı oluşturur", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(testUser);

    expect(res.statusCode).toBe(201);
  });

  test("POST /api/auth/register - aynı email ile tekrar kayıt reddedilir", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(testUser);

    expect(res.statusCode).toBe(400);
  });

  test("GET /api/auth/verify-email - geçersiz token reddedilir", async () => {
    const res = await request(app)
      .get("/api/v1/auth/verify-email")
      .query({ token: "gecersiz-token" });

    expect(res.statusCode).toBe(400);
  });

  test("POST /api/auth/login - doğrulanmamış kullanıcı ile giriş engellenir", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(403);
  });

  test("POST /api/auth/login - yanlış şifre reddedilir", async () => {
    await User.update(
      { isVerified: true },
      { where: { email: testUser.email } }
    );

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: testUser.email, password: "YanlisSifre1!" });

    expect(res.statusCode).toBe(401);
  });

  test("POST /api/auth/login - var olmayan kullanıcı reddedilir", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "yok@example.com", password: "Test1234!" });

    expect(res.statusCode).toBe(404);
  });

  test("POST /api/auth/login - doğrulanmış kullanıcı başarıyla giriş yapar", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");

    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  test("GET /api/users/me - tokensız erişim reddedilir", async () => {
    const res = await request(app).get("/api/v1/users/me");
    expect(res.statusCode).toBe(401);
  });

  test("GET /api/users/me - geçerli token ile kullanıcı bilgisi döner", async () => {
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(testUser.email);
  });

  test("POST /api/auth/refresh - geçerli refresh token ile yeni access token üretir", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
  });

  test("POST /api/auth/refresh - geçersiz refresh token reddedilir", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: "gecersiz-refresh-token" });

    expect(res.statusCode).toBe(403);
  });

  test("POST /api/auth/logout - başarıyla çıkış yapar", async () => {
    const res = await request(app)
      .post("/api/v1/auth/logout")
      .send({ refreshToken });

    expect(res.statusCode).toBe(200);
  });
});
