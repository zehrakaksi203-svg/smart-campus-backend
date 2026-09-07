const request = require("supertest");
const app = require("../src/app");
const { User } = require("../models");

describe("User Management API", () => {
  const student = {
    fullName: "Öğrenci Kullanıcı",
    email: "student@example.com",
    password: "Test1234!"
   
  };

  const admin = {
    fullName: "Admin Kullanıcı",
    email: "admin@example.com",
    password: "Test1234!"
    
  };

  let studentToken;
  let adminToken;

  beforeAll(async () => {
    // Register Student
    const studentRegister = await request(app)
      .post("/api/v1/auth/register")
      .send(student);

    console.log("REGISTER STUDENT:", studentRegister.statusCode);
    console.log(studentRegister.body);

    // Register Admin
    const adminRegister = await request(app)
      .post("/api/v1/auth/register")
      .send(admin);

    console.log("REGISTER ADMIN:", adminRegister.statusCode);
    console.log(adminRegister.body);

    // DB'de gerçekten oluşmuş mu?
    const registeredStudent = await User.findOne({
      where: { email: student.email },
    });

    const registeredAdmin = await User.findOne({
      where: { email: admin.email },
    });

    console.log(
      "REGISTERED STUDENT:",
      registeredStudent ? registeredStudent.toJSON() : null
    );

    console.log(
      "REGISTERED ADMIN:",
      registeredAdmin ? registeredAdmin.toJSON() : null
    );

    // Student doğrulansın
await User.update(
  {
    isVerified: true
  },
  {
    where: {
      email: student.email
    }
  }
);

// Admin doğrulansın ve rolü Admin yapılsın
await User.update(
  {
    role: "Admin",
    isVerified: true
  },
  {
    where: {
      email: admin.email
    }
  }
);

    // Student Login
    const studentLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: student.email,
        password: student.password,
      });

    console.log("STUDENT LOGIN:", studentLogin.statusCode);
    console.log(studentLogin.body);

    studentToken = studentLogin.body.accessToken;

    // Admin Login
    const adminLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: admin.email,
        password: admin.password,
      });

    console.log("ADMIN LOGIN:", adminLogin.statusCode);
    console.log(adminLogin.body);

    adminToken = adminLogin.body.accessToken;

    console.log("Student Token:", studentToken);
    console.log("Admin Token:", adminToken);
  });

  test("GET /api/users/me - giriş yapan kullanıcının bilgisini döner", async () => {
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${studentToken}`);

    console.log("ME:", res.statusCode);
    console.log(res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(student.email);
  });

  test("PUT /api/users/me - kullanıcı kendi bilgisini günceller", async () => {
    const res = await request(app)
      .put("/api/v1/users/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        fullName: "Güncellenmiş İsim",
      });

    console.log("UPDATE ME:", res.statusCode);
    console.log(res.body);

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

    console.log("STUDENT LIST:", res.statusCode);
    console.log(res.body);

    expect(res.statusCode).toBe(403);
  });

  test("GET /api/users - Admin kullanıcı listesini sayfalı şekilde görür", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        page: 1,
        limit: 10,
      });

    console.log("ADMIN LIST:", res.statusCode);
    console.log(res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("users");
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  test("GET /api/users - role filtresi doğru çalışır", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        role: "Admin",
      });

    console.log("ROLE FILTER:", res.statusCode);
    console.log(res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.users.every((u) => u.role === "Admin")).toBe(true);
  });
});