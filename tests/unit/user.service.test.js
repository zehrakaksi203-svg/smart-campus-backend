// Bu dosya UNIT testtir: gerçek veritabanına bağlanmaz.
// Sequelize modelleri jest.mock ile taklit edilir, sadece
// user.service.js içindeki iş mantığı izole şekilde test edilir.

jest.mock("../../models", () => ({
    User: {
      findByPk: jest.fn(),
      findAndCountAll: jest.fn()
    },
    Student: {
      findAll: jest.fn()
    },
    Faculty: {
      findAll: jest.fn()
    },
    Department: {}
  }));
  
  const { User, Student, Faculty } = require("../../models");
  const userService = require("../../src/modules/users/user.service");
  
  describe("user.service (unit)", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    describe("getMe", () => {
      test("kullanıcı bulunduğunda şifre hariç kullanıcıyı döner", async () => {
        const fakeUser = { id: 1, fullName: "Test", email: "t@test.com" };
        User.findByPk.mockResolvedValue(fakeUser);
  
        const result = await userService.getMe(1);
  
        expect(User.findByPk).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            attributes: { exclude: ["password"] }
          })
        );
        expect(result).toEqual(fakeUser);
      });
  
      test("kullanıcı bulunamazsa 404 fırlatır", async () => {
        User.findByPk.mockResolvedValue(null);
  
        await expect(userService.getMe(999)).rejects.toEqual({
          status: 404,
          message: "Kullanıcı bulunamadı."
        });
      });
    });
  
    describe("updateMe", () => {
      test("verilen alanları günceller ve kaydeder", async () => {
        const fakeUser = {
          id: 1,
          fullName: "Eski İsim",
          email: "eski@test.com",
          role: "Student",
          save: jest.fn().mockResolvedValue(true)
        };
        User.findByPk.mockResolvedValue(fakeUser);
  
        const result = await userService.updateMe(1, {
          fullName: "Yeni İsim"
        });
  
        expect(fakeUser.fullName).toBe("Yeni İsim");
        expect(fakeUser.save).toHaveBeenCalled();
        expect(result.user.fullName).toBe("Yeni İsim");
      });
  
      test("kullanıcı yoksa 404 fırlatır", async () => {
        User.findByPk.mockResolvedValue(null);
  
        await expect(
          userService.updateMe(999, { fullName: "X" })
        ).rejects.toEqual({
          status: 404,
          message: "Kullanıcı bulunamadı."
        });
      });
    });
  
    describe("getAllUsers", () => {
      test("varsayılan sayfalama ile kullanıcıları döner", async () => {
        User.findAndCountAll.mockResolvedValue({
          count: 2,
          rows: [{ id: 1 }, { id: 2 }]
        });
  
        const result = await userService.getAllUsers({});
  
        expect(result.total).toBe(2);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
        expect(result.totalPages).toBe(1);
        expect(result.users).toHaveLength(2);
      });
  
      test("role filtresini where koşuluna ekler", async () => {
        User.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
  
        await userService.getAllUsers({ role: "Admin" });
  
        const callArgs = User.findAndCountAll.mock.calls[0][0];
        expect(callArgs.where.role).toBe("Admin");
      });
  
      test("department verildiğinde student ve faculty userId'lerini birleştirir", async () => {
        Student.findAll.mockResolvedValue([{ userId: 5 }]);
        Faculty.findAll.mockResolvedValue([{ userId: 8 }]);
        User.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
  
        await userService.getAllUsers({ department: 2 });
  
        expect(Student.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ where: { departmentId: 2 } })
        );
        expect(Faculty.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ where: { departmentId: 2 } })
        );
  
        const callArgs = User.findAndCountAll.mock.calls[0][0];
        expect(callArgs.where.id[Object.getOwnPropertySymbols(callArgs.where.id)[0]]).toEqual(
          expect.arrayContaining([5, 8])
        );
      });
  
      test("sayfa ve limit değerlerini sayıya çevirip offset hesaplar", async () => {
        User.findAndCountAll.mockResolvedValue({ count: 25, rows: [] });
  
        const result = await userService.getAllUsers({ page: "3", limit: "5" });
  
        const callArgs = User.findAndCountAll.mock.calls[0][0];
        expect(callArgs.limit).toBe(5);
        expect(callArgs.offset).toBe(10); // (3-1) * 5
        expect(result.totalPages).toBe(5); // 25 / 5
      });
    });
  });