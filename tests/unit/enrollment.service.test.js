// Bu dosya UNIT testtir: gerçek veritabanına bağlanmaz.
// Sequelize modelleri ve bağımlı servisler (prerequisite, scheduleConflict) jest.mock ile taklit edilir.

const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn()
  };
  
  jest.mock("../../models", () => ({
    Enrollment: {
      findOne: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn()
    },
    Student: {
      findOne: jest.fn()
    },
    Course: {
      findByPk: jest.fn()
    },
    CourseSection: {
      findByPk: jest.fn()
    },
    User: {},
    Department: {},
    Faculty: {},
    sequelize: {
      transaction: jest.fn()
    }
  }));
  
  jest.mock("../../src/services/prerequisite.service", () => ({
    checkPrerequisites: jest.fn()
  }));
  
  jest.mock("../../src/services/scheduleConflict.service", () => ({
    hasScheduleConflict: jest.fn()
  }));
  
  const {
    Enrollment,
    Student,
    Course,
    CourseSection,
    sequelize
  } = require("../../models");
  const { checkPrerequisites } = require("../../src/services/prerequisite.service");
  const { hasScheduleConflict } = require("../../src/services/scheduleConflict.service");
  
  const {
    createEnrollment,
    deleteEnrollment,
    getMyEnrollments,
    updateEnrollment
  } = require("../../src/modules/enrollments/enrollment.service");
  
  describe("EnrollmentService (unit)", () => {
    beforeEach(() => {
      sequelize.transaction.mockResolvedValue(mockTransaction);
    });
  
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    describe("createEnrollment", () => {
      const baseData = {
        userId: 1,
        sectionId: 10,
        semester: "Güz",
        academicYear: "2026-2027"
      };
  
      test("öğrenci bulunamazsa 404 fırlatır ve transaction rollback edilir", async () => {
        Student.findOne.mockResolvedValue(null);
  
        await expect(createEnrollment(baseData)).rejects.toMatchObject({ status: 404 });
  
        expect(mockTransaction.rollback).toHaveBeenCalled();
        expect(mockTransaction.commit).not.toHaveBeenCalled();
      });
  
      test("section bulunamazsa 404 fırlatır", async () => {
        Student.findOne.mockResolvedValue({ id: 1 });
        CourseSection.findByPk.mockResolvedValue(null);
  
        await expect(createEnrollment(baseData)).rejects.toMatchObject({ status: 404 });
      });
  
      test("section'a bağlı ders bulunamazsa 404 fırlatır", async () => {
        Student.findOne.mockResolvedValue({ id: 1 });
        CourseSection.findByPk.mockResolvedValue({ id: 10, courseId: 99, capacity: 30, enrolledCount: 0 });
        Course.findByPk.mockResolvedValue(null);
  
        await expect(createEnrollment(baseData)).rejects.toMatchObject({ status: 404 });
      });
  
      test("önkoşul sağlanmamışsa checkPrerequisites'in fırlattığı hata yukarı taşınır", async () => {
        Student.findOne.mockResolvedValue({ id: 1 });
        CourseSection.findByPk.mockResolvedValue({ id: 10, courseId: 5, capacity: 30, enrolledCount: 0 });
        Course.findByPk.mockResolvedValue({ id: 5 });
        checkPrerequisites.mockRejectedValue({ status: 400, message: "Önkoşul eksik" });
  
        await expect(createEnrollment(baseData)).rejects.toMatchObject({ status: 400 });
  
        // Önkoşul kontrolünden sonraki adımlara (çakışma, kapasite) hiç gidilmemeli
        expect(hasScheduleConflict).not.toHaveBeenCalled();
      });
  
      test("saat çakışması varsa hasScheduleConflict'in fırlattığı hata yukarı taşınır", async () => {
        Student.findOne.mockResolvedValue({ id: 1 });
        CourseSection.findByPk.mockResolvedValue({ id: 10, courseId: 5, capacity: 30, enrolledCount: 0 });
        Course.findByPk.mockResolvedValue({ id: 5 });
        checkPrerequisites.mockResolvedValue();
        hasScheduleConflict.mockRejectedValue({ status: 400, message: "Çakışma var" });
  
        await expect(createEnrollment(baseData)).rejects.toMatchObject({ status: 400 });
      });
  
      test("öğrenci aynı derse zaten aktif kayıtlıysa 400 fırlatır", async () => {
        Student.findOne.mockResolvedValue({ id: 1 });
        CourseSection.findByPk.mockResolvedValue({ id: 10, courseId: 5, capacity: 30, enrolledCount: 0 });
        Course.findByPk.mockResolvedValue({ id: 5 });
        checkPrerequisites.mockResolvedValue();
        hasScheduleConflict.mockResolvedValue();
        Enrollment.findOne.mockResolvedValueOnce({ id: 77 }); // existingCourseEnrollment
  
        await expect(createEnrollment(baseData)).rejects.toMatchObject({
          status: 400,
          message: expect.stringContaining("zaten kayıtlısınız")
        });
  
        expect(Enrollment.create).not.toHaveBeenCalled();
      });
  
      test("öğrenci aynı section'a zaten aktif kayıtlıysa 400 fırlatır", async () => {
        Student.findOne.mockResolvedValue({ id: 1 });
        CourseSection.findByPk.mockResolvedValue({ id: 10, courseId: 5, capacity: 30, enrolledCount: 0 });
        Course.findByPk.mockResolvedValue({ id: 5 });
        checkPrerequisites.mockResolvedValue();
        hasScheduleConflict.mockResolvedValue();
        Enrollment.findOne
          .mockResolvedValueOnce(null) // aynı derse kayıt yok
          .mockResolvedValueOnce({ id: 88 }); // aynı section'a kayıt var
  
        await expect(createEnrollment(baseData)).rejects.toMatchObject({
          status: 400,
          message: expect.stringContaining("section'a zaten kayıtlısınız")
        });
      });
  
      test("kontenjan doluysa 400 fırlatır", async () => {
        Student.findOne.mockResolvedValue({ id: 1 });
        CourseSection.findByPk.mockResolvedValue({ id: 10, courseId: 5, capacity: 2, enrolledCount: 2 });
        Course.findByPk.mockResolvedValue({ id: 5 });
        checkPrerequisites.mockResolvedValue();
        hasScheduleConflict.mockResolvedValue();
        Enrollment.findOne.mockResolvedValue(null);
  
        await expect(createEnrollment(baseData)).rejects.toMatchObject({
          status: 400,
          message: expect.stringContaining("kontenjanı dolu")
        });
  
        expect(Enrollment.create).not.toHaveBeenCalled();
      });
  
      test("tüm kontroller geçilirse kayıt oluşturur, kontenjanı artırır ve commit eder", async () => {
        const sectionUpdate = jest.fn().mockResolvedValue();
        const section = { id: 10, courseId: 5, capacity: 30, enrolledCount: 3, update: sectionUpdate };
  
        Student.findOne.mockResolvedValue({ id: 1 });
        CourseSection.findByPk.mockResolvedValue(section);
        Course.findByPk.mockResolvedValue({ id: 5 });
        checkPrerequisites.mockResolvedValue();
        hasScheduleConflict.mockResolvedValue();
        Enrollment.findOne.mockResolvedValue(null);
        Enrollment.create.mockResolvedValue({ id: 123, studentId: 1, courseId: 5, sectionId: 10 });
  
        const result = await createEnrollment(baseData);
  
        expect(Enrollment.create).toHaveBeenCalledWith(
          expect.objectContaining({
            studentId: 1,
            courseId: 5,
            sectionId: 10,
            status: "Active"
          }),
          expect.anything()
        );
        expect(sectionUpdate).toHaveBeenCalledWith(
          { enrolledCount: 4 },
          expect.anything()
        );
        expect(mockTransaction.commit).toHaveBeenCalled();
        expect(mockTransaction.rollback).not.toHaveBeenCalled();
        expect(result.enrollment).toMatchObject({ id: 123 });
      });
    });
  
    describe("deleteEnrollment", () => {
      test("kayıt yoksa 404 fırlatır ve rollback edilir", async () => {
        Enrollment.findByPk.mockResolvedValue(null);
  
        await expect(deleteEnrollment(1)).rejects.toMatchObject({ status: 404 });
        expect(mockTransaction.rollback).toHaveBeenCalled();
      });
  
      test("kayıt silinince section kontenjanı düşürülür ve commit edilir", async () => {
        const destroy = jest.fn().mockResolvedValue();
        const enrollment = { id: 1, sectionId: 10, destroy };
        const sectionUpdate = jest.fn().mockResolvedValue();
  
        Enrollment.findByPk.mockResolvedValue(enrollment);
        CourseSection.findByPk.mockResolvedValue({ id: 10, enrolledCount: 5, update: sectionUpdate });
  
        await deleteEnrollment(1);
  
        expect(sectionUpdate).toHaveBeenCalledWith({ enrolledCount: 4 }, expect.anything());
        expect(destroy).toHaveBeenCalled();
        expect(mockTransaction.commit).toHaveBeenCalled();
      });
  
      test("section'ın kontenjanı zaten 0 ise negatife düşürmez", async () => {
        const destroy = jest.fn().mockResolvedValue();
        const enrollment = { id: 1, sectionId: 10, destroy };
        const sectionUpdate = jest.fn().mockResolvedValue();
  
        Enrollment.findByPk.mockResolvedValue(enrollment);
        CourseSection.findByPk.mockResolvedValue({ id: 10, enrolledCount: 0, update: sectionUpdate });
  
        await deleteEnrollment(1);
  
        expect(sectionUpdate).not.toHaveBeenCalled();
        expect(destroy).toHaveBeenCalled();
      });
    });
  
    describe("getMyEnrollments", () => {
      test("öğrenci profili yoksa 404 fırlatır", async () => {
        Student.findOne.mockResolvedValue(null);
  
        await expect(getMyEnrollments(1)).rejects.toMatchObject({ status: 404 });
      });
  
      test("öğrencinin sadece aktif kayıtlarını döner", async () => {
        Student.findOne.mockResolvedValue({ id: 7 });
        Enrollment.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
  
        const result = await getMyEnrollments(1);
  
        expect(Enrollment.findAll).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { studentId: 7, status: "Active" }
          })
        );
        expect(result).toHaveLength(2);
      });
    });
  
    describe("updateEnrollment", () => {
      test("kayıt yoksa 404 fırlatır", async () => {
        Enrollment.findByPk.mockResolvedValue(null);
  
        await expect(updateEnrollment(1, { status: "Dropped" })).rejects.toMatchObject({ status: 404 });
      });
  
      test("kayıt varsa günceller", async () => {
        const update = jest.fn().mockResolvedValue();
        Enrollment.findByPk.mockResolvedValue({ id: 1, update });
  
        const result = await updateEnrollment(1, { status: "Dropped" });
  
        expect(update).toHaveBeenCalledWith({ status: "Dropped" });
        expect(result.message).toBeDefined();
      });
    });
  });