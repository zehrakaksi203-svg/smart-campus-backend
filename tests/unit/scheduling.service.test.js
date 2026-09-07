// Bu dosya UNIT testtir: gerçek veritabanına bağlanmaz.

jest.mock("../../models", () => ({
    CourseSection: {
      findAll: jest.fn()
    },
    Classroom: {
      findAll: jest.fn()
    },
    Course: {},
    Faculty: {}
  }));
  
  const { CourseSection, Classroom } = require("../../models");
  
  const {
    generateSchedule,
    getSchedule,
    backtrack,
    buildSlots
  } = require("../../src/modules/scheduling/scheduling.service");
  
  const makeSection = (overrides = {}) => ({
    id: 1,
    sectionCode: "TEST-1",
    facultyId: 1,
    capacity: 30,
    update: jest.fn().mockResolvedValue(),
    ...overrides
  });
  
  describe("SchedulingService (unit)", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    describe("buildSlots", () => {
      test("5 gün x 5 zaman dilimi = 25 slot üretir", () => {
        const slots = buildSlots();
        expect(slots).toHaveLength(25);
      });
  
      test("her slot dayOfWeek/startTime/endTime içerir", () => {
        const slots = buildSlots();
        expect(slots[0]).toEqual(
          expect.objectContaining({
            dayOfWeek: expect.any(String),
            startTime: expect.any(String),
            endTime: expect.any(String)
          })
        );
      });
    });
  
    describe("backtrack (doğrudan)", () => {
      const slots = [
        { dayOfWeek: "Monday", startTime: "09:00:00", endTime: "10:30:00" },
        { dayOfWeek: "Monday", startTime: "10:45:00", endTime: "12:15:00" }
      ];
      const classrooms = [{ id: 1, building: "A", roomNumber: "101", capacity: 30 }];
  
      test("tek section, uygun sınıf ve boş slotlarla başarıyla atanır", () => {
        const sections = [makeSection({ id: 1 })];
  
        const result = backtrack(sections, 0, classrooms, slots, {}, {}, new Set());
  
        expect(result[1]).toMatchObject({
          dayOfWeek: "Monday",
          startTime: "09:00:00",
          classroom: "A - 101"
        });
      });
  
      test("aynı öğretim üyesinin iki dersi aynı slota atanamaz, farklı slot bulunur", () => {
        const sections = [
          makeSection({ id: 1, facultyId: 7 }),
          makeSection({ id: 2, facultyId: 7 })
        ];
  
        const result = backtrack(sections, 0, classrooms, slots, {}, {}, new Set());
  
        expect(result[1].startTime).not.toBe(result[2].startTime);
      });
  
      test("kapasitesi yetersiz sınıflar elenir; hiç uygun sınıf yoksa null döner", () => {
        const sections = [makeSection({ id: 1, capacity: 100 })];
        const smallClassrooms = [{ id: 1, building: "A", roomNumber: "101", capacity: 30 }];
  
        const result = backtrack(sections, 0, smallClassrooms, slots, {}, {}, new Set());
  
        expect(result).toBeNull();
      });
  
      test("uygun boş slot kalmayınca (tüm slotlar dolu) null döner", () => {
        const singleSlot = [{ dayOfWeek: "Monday", startTime: "09:00:00", endTime: "10:30:00" }];
        const sections = [
          makeSection({ id: 1, facultyId: 1 }),
          makeSection({ id: 2, facultyId: 2 }) // farklı hoca ama aynı tek sınıf+slot -> ikincisi için yer kalmaz
        ];
  
        const result = backtrack(sections, 0, classrooms, singleSlot, {}, {}, new Set());
  
        expect(result).toBeNull();
      });
    });
  
    describe("generateSchedule", () => {
      test("o dönem için hiç section yoksa hata fırlatır", async () => {
        CourseSection.findAll.mockResolvedValue([]);
  
        await expect(generateSchedule("Güz")).rejects.toThrow(
          "Bu dönem için ders şubesi bulunamadı."
        );
      });
  
      test("sistemde hiç sınıf tanımlı değilse hata fırlatır", async () => {
        CourseSection.findAll.mockResolvedValue([makeSection()]);
        Classroom.findAll.mockResolvedValue([]);
  
        await expect(generateSchedule("Güz")).rejects.toThrow(
          "Sistemde tanımlı sınıf bulunamadı."
        );
      });
  
      test("çözüm bulunamazsa (kapasite yetersiz) anlamlı hata fırlatır", async () => {
        CourseSection.findAll.mockResolvedValue([makeSection({ capacity: 500 })]);
        Classroom.findAll.mockResolvedValue([
          { id: 1, building: "A", roomNumber: "101", capacity: 30 }
        ]);
  
        await expect(generateSchedule("Güz")).rejects.toThrow(
          "Çakışmasız bir program oluşturulamadı"
        );
      });
  
      test("başarılı durumda tüm section'lar güncellenir ve özet döner", async () => {
        const section = makeSection({ id: 1, sectionCode: "CENG101-1" });
        CourseSection.findAll.mockResolvedValue([section]);
        Classroom.findAll.mockResolvedValue([
          { id: 1, building: "B", roomNumber: "101", capacity: 40 }
        ]);
  
        const result = await generateSchedule("Güz");
  
        expect(section.update).toHaveBeenCalledWith(
          expect.objectContaining({
            dayOfWeek: expect.any(String),
            startTime: expect.any(String),
            endTime: expect.any(String),
            classroom: "B - 101"
          })
        );
        expect(result).toMatchObject({ semester: "Güz", scheduledCount: 1 });
        expect(result.sections).toHaveLength(1);
      });
  
      test("yalnızca ilgili dönemin aktif section'larını sorgular", async () => {
        CourseSection.findAll.mockResolvedValue([makeSection()]);
        Classroom.findAll.mockResolvedValue([
          { id: 1, building: "A", roomNumber: "101", capacity: 40 }
        ]);
  
        await generateSchedule("Bahar");
  
        expect(CourseSection.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ where: { semester: "Bahar", isActive: true } })
        );
      });
    });
  
    describe("getSchedule", () => {
      test("semester verilirse where'e eklenir", async () => {
        CourseSection.findAll.mockResolvedValue([]);
  
        await getSchedule("Güz");
  
        expect(CourseSection.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ where: { semester: "Güz", isActive: true } })
        );
      });
  
      test("semester verilmezse sadece isActive filtrelenir", async () => {
        CourseSection.findAll.mockResolvedValue([]);
  
        await getSchedule();
  
        expect(CourseSection.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ where: { isActive: true } })
        );
      });
    });
  });