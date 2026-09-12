// Bu dosya UNIT testtir: gerçek veritabanına bağlanmaz.

jest.mock("../../models", () => ({
    Enrollment: {
      findAll: jest.fn()
    },
    CourseSection: {
      findOne: jest.fn()
    },
  }));
  
  const { Enrollment, CourseSection } = require("../../models");
  const {
    timeToMinutes,
    timeOverlap,
    getStudentSchedule,
    hasScheduleConflict
  } = require("../../src/services/scheduleConflict.service");
  
  describe("ScheduleConflictService (unit)", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    describe("timeToMinutes", () => {
      test("HH:MM formatını doğru dakikaya çevirir", () => {
        expect(timeToMinutes("09:00")).toBe(540);
        expect(timeToMinutes("13:30")).toBe(810);
      });
  
      test("HH:MM:SS formatını da doğru çevirir (saniye yoksayılır)", () => {
        expect(timeToMinutes("09:00:00")).toBe(540);
      });
    });
  
    describe("timeOverlap (saf fonksiyon)", () => {
      test("farklı günlerdeki dersler asla çakışmaz", () => {
        const a = { dayOfWeek: "Pazartesi", startTime: "09:00", endTime: "11:00" };
        const b = { dayOfWeek: "Salı", startTime: "09:00", endTime: "11:00" };
  
        expect(timeOverlap(a, b)).toBe(false);
      });
  
      test("aynı gün, kesişen saat aralıkları çakışır", () => {
        const a = { dayOfWeek: "Pazartesi", startTime: "09:00", endTime: "11:00" };
        const b = { dayOfWeek: "Pazartesi", startTime: "10:00", endTime: "12:00" };
  
        expect(timeOverlap(a, b)).toBe(true);
      });
  
      test("aynı gün, ardışık (bitişik) saatler çakışmaz", () => {
        const a = { dayOfWeek: "Pazartesi", startTime: "09:00", endTime: "11:00" };
        const b = { dayOfWeek: "Pazartesi", startTime: "11:00", endTime: "13:00" };
  
        expect(timeOverlap(a, b)).toBe(false);
      });
  
      test("aynı gün, tamamen ayrı saat aralıkları çakışmaz", () => {
        const a = { dayOfWeek: "Pazartesi", startTime: "09:00", endTime: "10:00" };
        const b = { dayOfWeek: "Pazartesi", startTime: "14:00", endTime: "16:00" };
  
        expect(timeOverlap(a, b)).toBe(false);
      });
  
      test("bir aralık diğerini tamamen kapsıyorsa çakışır", () => {
        const a = { dayOfWeek: "Çarşamba", startTime: "09:00", endTime: "17:00" };
        const b = { dayOfWeek: "Çarşamba", startTime: "10:00", endTime: "11:00" };
  
        expect(timeOverlap(a, b)).toBe(true);
      });
    });
  
    describe("getStudentSchedule", () => {
      test("öğrencinin aktif kayıtlarındaki section'ları döner", async () => {
        Enrollment.findAll.mockResolvedValue([
          { section: { id: 1, dayOfWeek: "Pazartesi" } },
          { section: { id: 2, dayOfWeek: "Salı" } }
        ]);
  
        const result = await getStudentSchedule(1, "Güz", "2026-2027");
  
        expect(Enrollment.findAll).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              studentId: 1,
              semester: "Güz",
              academicYear: "2026-2027",
              status: "Active"
            }
          })
        );
        expect(result).toHaveLength(2);
      });
    });
  
    describe("hasScheduleConflict", () => {
      test("section bulunamazsa 404 fırlatır", async () => {
        CourseSection.findOne.mockResolvedValue(null);
  
        await expect(
          hasScheduleConflict(1, 99, "Güz", "2026-2027")
        ).rejects.toMatchObject({ status: 404 });
      });
  
      test("çakışma yoksa hata fırlatmaz", async () => {
        CourseSection.findOne.mockResolvedValue({
          id: 2,
          dayOfWeek: "Salı",
          startTime: "09:00",
          endTime: "11:00"
        });
        Enrollment.findAll.mockResolvedValue([
          {
            section: {
              id: 1,
              dayOfWeek: "Pazartesi",
              startTime: "09:00",
              endTime: "11:00"
            }
          }
        ]);
  
        await expect(
          hasScheduleConflict(1, 2, "Güz", "2026-2027")
        ).resolves.toBeUndefined();
      });
  
      test("çakışma varsa 400 hatası fırlatır", async () => {
        CourseSection.findOne.mockResolvedValue({
          id: 2,
          dayOfWeek: "Pazartesi",
          startTime: "10:00",
          endTime: "12:00"
        });
        Enrollment.findAll.mockResolvedValue([
          {
            section: {
              id: 1,
              dayOfWeek: "Pazartesi",
              startTime: "09:00",
              endTime: "11:00"
            }
          }
        ]);
  
        await expect(
          hasScheduleConflict(1, 2, "Güz", "2026-2027")
        ).rejects.toMatchObject({ status: 400 });
      });
    });
  });