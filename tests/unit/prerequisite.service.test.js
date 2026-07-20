// Bu dosya UNIT testtir: gerçek veritabanına bağlanmaz.
// Sequelize modelleri jest.mock ile taklit edilir.

jest.mock("../../models", () => ({
    CoursePrerequisite: {
      findAll: jest.fn()
    },
    Enrollment: {
      findOne: jest.fn()
    },
    CourseSection: {}
  }));
  
  const { CoursePrerequisite, Enrollment } = require("../../models");
  const {
    hasCompletedCourse,
    getDirectPrerequisites,
    checkPrerequisites
  } = require("../../src/services/prerequisite.service");
  
  describe("PrerequisiteService (unit)", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    describe("hasCompletedCourse", () => {
      test("kayıt yoksa false döner", async () => {
        Enrollment.findOne.mockResolvedValue(null);
  
        const result = await hasCompletedCourse(1, 10);
  
        expect(result).toBe(false);
      });
  
      test("kayıt var ama not girilmemişse false döner", async () => {
        Enrollment.findOne.mockResolvedValue({ letterGrade: null });
  
        const result = await hasCompletedCourse(1, 10);
  
        expect(result).toBe(false);
      });
  
      test("kalan bir notla (FF) tamamlanmışsa false döner", async () => {
        Enrollment.findOne.mockResolvedValue({ letterGrade: "FF" });
  
        const result = await hasCompletedCourse(1, 10);
  
        expect(result).toBe(false);
      });
  
      test("geçer bir notla (BA) tamamlanmışsa true döner", async () => {
        Enrollment.findOne.mockResolvedValue({ letterGrade: "BA" });
  
        const result = await hasCompletedCourse(1, 10);
  
        expect(result).toBe(true);
      });
    });
  
    describe("getDirectPrerequisites", () => {
      test("bir dersin doğrudan önkoşul ID listesini döner", async () => {
        CoursePrerequisite.findAll.mockResolvedValue([
          { prerequisiteCourseId: 5 },
          { prerequisiteCourseId: 7 }
        ]);
  
        const result = await getDirectPrerequisites(10);
  
        expect(result).toEqual([5, 7]);
      });
  
      test("önkoşulu yoksa boş dizi döner", async () => {
        CoursePrerequisite.findAll.mockResolvedValue([]);
  
        const result = await getDirectPrerequisites(10);
  
        expect(result).toEqual([]);
      });
    });
  
    describe("checkPrerequisites (recursive senaryolar)", () => {
      test("hiç önkoşul yoksa hata fırlatmaz", async () => {
        CoursePrerequisite.findAll.mockResolvedValue([]);
  
        await expect(checkPrerequisites(10, 1)).resolves.toBeUndefined();
      });
  
      test("tek seviye önkoşul tamamlanmışsa hata fırlatmaz", async () => {
        // Ders 10'un önkoşulu ders 5
        CoursePrerequisite.findAll.mockImplementation(({ where }) => {
          if (where.courseId === 10) return [{ prerequisiteCourseId: 5 }];
          return [];
        });
        Enrollment.findOne.mockResolvedValue({ letterGrade: "BA" });
  
        await expect(checkPrerequisites(10, 1)).resolves.toBeUndefined();
      });
  
      test("tek seviye önkoşul tamamlanmamışsa 400 hatası fırlatır", async () => {
        CoursePrerequisite.findAll.mockImplementation(({ where }) => {
          if (where.courseId === 10) return [{ prerequisiteCourseId: 5 }];
          return [];
        });
        Enrollment.findOne.mockResolvedValue(null);
  
        await expect(checkPrerequisites(10, 1)).rejects.toMatchObject({
          status: 400
        });
      });
  
      test("iki seviye zincir (10 -> 5 -> 2): en alttaki önkoşul eksikse hata fırlatır", async () => {
        // 10'un önkoşulu 5, 5'in önkoşulu 2
        CoursePrerequisite.findAll.mockImplementation(({ where }) => {
          if (where.courseId === 10) return [{ prerequisiteCourseId: 5 }];
          if (where.courseId === 5) return [{ prerequisiteCourseId: 2 }];
          return [];
        });
  
        // Ders 5 tamamlanmış (geçer not), ama ders 2 hiç alınmamış
        Enrollment.findOne
          .mockResolvedValueOnce({ letterGrade: "BA" }) // ders 5 kontrolü
          .mockResolvedValueOnce(null); // ders 2 kontrolü (recursive)
  
        await expect(checkPrerequisites(10, 1)).rejects.toMatchObject({
          status: 400
        });
      });
  
      test("iki seviye zincir tamamen tamamlanmışsa hata fırlatmaz", async () => {
        CoursePrerequisite.findAll.mockImplementation(({ where }) => {
          if (where.courseId === 10) return [{ prerequisiteCourseId: 5 }];
          if (where.courseId === 5) return [{ prerequisiteCourseId: 2 }];
          return [];
        });
  
        Enrollment.findOne.mockResolvedValue({ letterGrade: "BA" });
  
        await expect(checkPrerequisites(10, 1)).resolves.toBeUndefined();
      });
  
      test("döngüsel önkoşul tanımı (A -> B -> A) sonsuz döngüye girmez", async () => {
        // Ders 10'un önkoşulu 5, ders 5'in önkoşulu (hatalı tanımla) tekrar 10
        CoursePrerequisite.findAll.mockImplementation(({ where }) => {
          if (where.courseId === 10) return [{ prerequisiteCourseId: 5 }];
          if (where.courseId === 5) return [{ prerequisiteCourseId: 10 }];
          return [];
        });
  
        Enrollment.findOne.mockResolvedValue({ letterGrade: "BA" });
  
        // "visited" seti sayesinde sonsuz döngüye girmeden tamamlanmalı
        await expect(checkPrerequisites(10, 1)).resolves.toBeUndefined();
      });
    });
  });