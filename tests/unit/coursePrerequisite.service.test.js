// Bu dosya UNIT testtir: gerçek veritabanına bağlanmaz.
// Sequelize modelleri jest.mock ile taklit edilir.

jest.mock("../../models", () => ({
    CoursePrerequisite: {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn()
    },
    Course: {
      findByPk: jest.fn()
    }
  }));
  
  const { CoursePrerequisite, Course } = require("../../models");
  const {
    wouldCreateCycle,
    createPrerequisite,
    getPrerequisitesByCourse,
    getPrerequisiteById,
    deletePrerequisite
  } = require("../../src/modules/coursePrerequisites/coursePrerequisite.service");
  
  describe("CoursePrerequisiteService (unit)", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    describe("wouldCreateCycle", () => {
      test("ders kendi kendinin önkoşulu olamaz (courseId === prerequisiteCourseId)", async () => {
        const result = await wouldCreateCycle(10, 10);
        expect(result).toBe(true);
        // Erken dönüş: DB'ye hiç sorgu atılmamalı
        expect(CoursePrerequisite.findAll).not.toHaveBeenCalled();
      });
  
      test("hiçbir zincir yoksa döngü oluşturmaz", async () => {
        CoursePrerequisite.findAll.mockResolvedValue([]);
  
        const result = await wouldCreateCycle(10, 5);
  
        expect(result).toBe(false);
      });
  
      test("doğrudan döngü: 5 zaten 10'un önkoşulu olarak zincirleniyorsa (5 -> 10), 10'u 5'in önkoşulu yapmak döngü oluşturur", async () => {
        // wouldCreateCycle(courseId=10, prerequisiteCourseId=5):
        // 5'ten başlayıp zincir takip edilir; 5'in önkoşulu 10 ise, 10'a ulaşılır -> döngü
        CoursePrerequisite.findAll.mockImplementation(({ where }) => {
          if (where.courseId === 5) return [{ prerequisiteCourseId: 10 }];
          return [];
        });
  
        const result = await wouldCreateCycle(10, 5);
  
        expect(result).toBe(true);
      });
  
      test("dolaylı (2 seviye) döngü tespit edilir: 5 -> 7 -> 10", async () => {
        CoursePrerequisite.findAll.mockImplementation(({ where }) => {
          if (where.courseId === 5) return [{ prerequisiteCourseId: 7 }];
          if (where.courseId === 7) return [{ prerequisiteCourseId: 10 }];
          return [];
        });
  
        const result = await wouldCreateCycle(10, 5);
  
        expect(result).toBe(true);
      });
  
      test("aynı düğüm birden fazla yoldan ziyaret edilse bile sonsuz döngüye girmez", async () => {
        // 5 -> 7, 5 -> 8, 7 -> 8, 8 -> (hiçbir yere) : 8 iki kez kuyruğa girer ama visited seti sayesinde tek işlenir
        CoursePrerequisite.findAll.mockImplementation(({ where }) => {
          if (where.courseId === 5) return [{ prerequisiteCourseId: 7 }, { prerequisiteCourseId: 8 }];
          if (where.courseId === 7) return [{ prerequisiteCourseId: 8 }];
          return [];
        });
  
        const result = await wouldCreateCycle(10, 5);
  
        expect(result).toBe(false);
      });
    });
  
    describe("createPrerequisite", () => {
      test("courseId === prerequisiteCourseId ise 400 fırlatır (DB'ye hiç gitmez)", async () => {
        await expect(
          createPrerequisite({ courseId: 1, prerequisiteCourseId: 1 })
        ).rejects.toMatchObject({ status: 400 });
  
        expect(Course.findByPk).not.toHaveBeenCalled();
      });
  
      test("asıl ders bulunamazsa 404 fırlatır", async () => {
        Course.findByPk.mockResolvedValueOnce(null);
  
        await expect(
          createPrerequisite({ courseId: 1, prerequisiteCourseId: 2 })
        ).rejects.toMatchObject({ status: 404, message: expect.stringContaining("Ders") });
      });
  
      test("önkoşul dersi bulunamazsa 404 fırlatır", async () => {
        Course.findByPk
          .mockResolvedValueOnce({ id: 1 }) // asıl ders var
          .mockResolvedValueOnce(null); // önkoşul dersi yok
  
        await expect(
          createPrerequisite({ courseId: 1, prerequisiteCourseId: 2 })
        ).rejects.toMatchObject({ status: 404, message: expect.stringContaining("Önkoşul") });
      });
  
      test("önkoşul zaten tanımlıysa 400 fırlatır", async () => {
        Course.findByPk
          .mockResolvedValueOnce({ id: 1 })
          .mockResolvedValueOnce({ id: 2 });
        CoursePrerequisite.findOne.mockResolvedValue({ id: 99 });
  
        await expect(
          createPrerequisite({ courseId: 1, prerequisiteCourseId: 2 })
        ).rejects.toMatchObject({ status: 400, message: expect.stringContaining("zaten") });
  
        expect(CoursePrerequisite.create).not.toHaveBeenCalled();
      });
  
      test("döngü oluşturacaksa 400 fırlatır ve kayıt oluşturmaz", async () => {
        Course.findByPk
          .mockResolvedValueOnce({ id: 1 })
          .mockResolvedValueOnce({ id: 2 });
        CoursePrerequisite.findOne.mockResolvedValue(null);
        // 2'nin (dolaylı) önkoşulu 1 ise, 1'i 2'nin önkoşulu yapmak döngü olur
        CoursePrerequisite.findAll.mockImplementation(({ where }) => {
          if (where.courseId === 2) return [{ prerequisiteCourseId: 1 }];
          return [];
        });
  
        await expect(
          createPrerequisite({ courseId: 1, prerequisiteCourseId: 2 })
        ).rejects.toMatchObject({ status: 400, message: expect.stringContaining("döngüsel") });
  
        expect(CoursePrerequisite.create).not.toHaveBeenCalled();
      });
  
      test("geçerli, döngüsüz bir önkoşul başarıyla oluşturulur", async () => {
        Course.findByPk
          .mockResolvedValueOnce({ id: 1 })
          .mockResolvedValueOnce({ id: 2 });
        CoursePrerequisite.findOne.mockResolvedValue(null);
        CoursePrerequisite.findAll.mockResolvedValue([]);
        CoursePrerequisite.create.mockResolvedValue({ id: 5, courseId: 1, prerequisiteCourseId: 2 });
  
        const result = await createPrerequisite({ courseId: 1, prerequisiteCourseId: 2 });
  
        expect(CoursePrerequisite.create).toHaveBeenCalledWith({
          courseId: 1,
          prerequisiteCourseId: 2
        });
        expect(result.prerequisite).toMatchObject({ id: 5 });
      });
    });
  
    describe("getPrerequisitesByCourse", () => {
      test("ders bulunamazsa 404 fırlatır", async () => {
        Course.findByPk.mockResolvedValue(null);
  
        await expect(getPrerequisitesByCourse(999)).rejects.toMatchObject({ status: 404 });
      });
  
      test("ders varsa önkoşul listesini döner", async () => {
        Course.findByPk.mockResolvedValue({ id: 1 });
        CoursePrerequisite.findAll.mockResolvedValue([{ id: 1, prerequisiteCourseId: 2 }]);
  
        const result = await getPrerequisitesByCourse(1);
  
        expect(result).toHaveLength(1);
      });
    });
  
    describe("getPrerequisiteById", () => {
      test("kayıt yoksa 404 fırlatır", async () => {
        CoursePrerequisite.findByPk.mockResolvedValue(null);
  
        await expect(getPrerequisiteById(1)).rejects.toMatchObject({ status: 404 });
      });
    });
  
    describe("deletePrerequisite", () => {
      test("kayıt yoksa 404 fırlatır", async () => {
        CoursePrerequisite.findByPk.mockResolvedValue(null);
  
        await expect(deletePrerequisite(1)).rejects.toMatchObject({ status: 404 });
      });
  
      test("kayıt varsa silinir", async () => {
        const destroy = jest.fn().mockResolvedValue();
        CoursePrerequisite.findByPk.mockResolvedValue({ id: 1, destroy });
  
        const result = await deletePrerequisite(1);
  
        expect(destroy).toHaveBeenCalled();
        expect(result.message).toBeDefined();
      });
    });
  });