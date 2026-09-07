// Bu dosya UNIT testtir: gerçek veritabanına bağlanmaz.

jest.mock("../../models", () => ({
  AttendanceSession: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  },
  AttendanceRecord: {
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn()
  },
  CourseSection: {
    findByPk: jest.fn()
  },
  Classroom: {
    findAll: jest.fn()
  },
  Faculty: {
    findOne: jest.fn()
  },
  Student: {
    findOne: jest.fn()
  },
  Enrollment: {
    findAll: jest.fn()
  }
}));

const {
  AttendanceSession,
  AttendanceRecord,
  CourseSection,
  Classroom,
  Faculty,
  Student,
  Enrollment
} = require("../../models");

const {
  haversineDistanceMeters,
  isFromCampusNetwork,
  findClassroomByCode,
  checkVelocityAnomaly,
  createSession,
  closeSession,
  refreshQrCode,
  checkIn,
  checkInWithQr,
  getReport,
  getMyAttendance
} = require("../../src/modules/attendanceSessions/attendanceSession.service");

describe("AttendanceSessionService (unit)", () => {
  const originalCampusPrefix = process.env.CAMPUS_IP_PREFIX;

  afterEach(() => {
    jest.clearAllMocks();
    process.env.CAMPUS_IP_PREFIX = originalCampusPrefix;
  });

  describe("haversineDistanceMeters", () => {
    test("aynı koordinatlar için mesafe 0'dır", () => {
      const distance = haversineDistanceMeters(40.0, 29.0, 40.0, 29.0);
      expect(distance).toBe(0);
    });

    test("bilinen iki koordinat arasındaki mesafeyi doğru hesaplar", () => {
      const distance = haversineDistanceMeters(41.0082, 28.9784, 39.9334, 32.8597);
      expect(distance).toBeGreaterThan(340000);
      expect(distance).toBeLessThan(360000);
    });

    test("çok yakın iki koordinat için küçük bir mesafe döner (metre mertebesinde)", () => {
      const distance = haversineDistanceMeters(40.0, 29.0, 40.00009, 29.0);
      expect(distance).toBeGreaterThan(5);
      expect(distance).toBeLessThan(15);
    });
  });

  describe("isFromCampusNetwork", () => {
    test("CAMPUS_IP_PREFIX tanımlı değilse her zaman true döner (kontrolü atlar)", () => {
      delete process.env.CAMPUS_IP_PREFIX;
      expect(isFromCampusNetwork("8.8.8.8")).toBe(true);
      expect(isFromCampusNetwork(undefined)).toBe(true);
    });

    test("prefiks tanımlıyken IP yoksa false döner", () => {
      process.env.CAMPUS_IP_PREFIX = "192.168.1.";
      expect(isFromCampusNetwork(undefined)).toBe(false);
    });

    test("prefiks ile eşleşen IP true döner", () => {
      process.env.CAMPUS_IP_PREFIX = "192.168.1.";
      expect(isFromCampusNetwork("192.168.1.42")).toBe(true);
    });

    test("prefiks ile eşleşmeyen IP false döner", () => {
      process.env.CAMPUS_IP_PREFIX = "192.168.1.";
      expect(isFromCampusNetwork("10.0.0.5")).toBe(false);
    });

    test("IPv6-mapped IPv4 adresini normalize ederek kontrol eder", () => {
      process.env.CAMPUS_IP_PREFIX = "192.168.1.";
      expect(isFromCampusNetwork("::ffff:192.168.1.42")).toBe(true);
    });
  });

  describe("findClassroomByCode", () => {
    test("kod verilmezse null döner (DB'ye gitmez)", async () => {
      const result = await findClassroomByCode(null);
      expect(result).toBeNull();
      expect(Classroom.findAll).not.toHaveBeenCalled();
    });

    test("'-' içermeyen kod için null döner", async () => {
      const result = await findClassroomByCode("B101");
      expect(result).toBeNull();
    });

    test("bina ve oda numarası eşleşen sınıfı bulur", async () => {
      Classroom.findAll.mockResolvedValue([
        { building: "A Blok", roomNumber: "205", latitude: 1, longitude: 2 },
        { building: "B Blok", roomNumber: "101", latitude: 39.9, longitude: 32.8 }
      ]);

      const result = await findClassroomByCode("B-101");

      expect(result).toMatchObject({ roomNumber: "101" });
    });

    test("eşleşme yoksa null döner", async () => {
      Classroom.findAll.mockResolvedValue([
        { building: "A Blok", roomNumber: "205", latitude: 1, longitude: 2 }
      ]);

      const result = await findClassroomByCode("Z-999");

      expect(result).toBeNull();
    });
  });

  describe("checkVelocityAnomaly", () => {
    test("öğrencinin önceki kaydı yoksa null döner", async () => {
      AttendanceRecord.findOne.mockResolvedValue(null);

      const result = await checkVelocityAnomaly(1, 40.0, 29.0, new Date());

      expect(result).toBeNull();
    });

    test("makul bir hızda (yakın konum, yeterli süre) anomali bulmaz", async () => {
      const past = new Date(Date.now() - 60 * 60 * 1000);
      AttendanceRecord.findOne.mockResolvedValue({
        latitude: 40.0,
        longitude: 29.0,
        checkInTime: past
      });

      const result = await checkVelocityAnomaly(1, 40.009, 29.0, new Date());

      expect(result).toBeNull();
    });

    test("fiziksel olarak imkansız hız tespit edilirse sebep metni döner", async () => {
      const past = new Date(Date.now() - 60 * 1000);
      AttendanceRecord.findOne.mockResolvedValue({
        latitude: 40.0,
        longitude: 29.0,
        checkInTime: past
      });

      const result = await checkVelocityAnomaly(1, 39.9334, 32.8597, new Date());

      expect(result).toEqual(expect.stringContaining("imkansız hız"));
    });
  });

  describe("createSession", () => {
    const baseData = {
      sectionId: 5,
      date: "2026-10-01",
      startTime: "09:00",
      endTime: "11:00"
    };

    test("kullanıcının Faculty kaydı yoksa 403 fırlatır", async () => {
      Faculty.findOne.mockResolvedValue(null);

      await expect(createSession(1, baseData)).rejects.toMatchObject({ status: 403 });
    });

    test("section bulunamazsa 404 fırlatır", async () => {
      Faculty.findOne.mockResolvedValue({ id: 10 });
      CourseSection.findByPk.mockResolvedValue(null);

      await expect(createSession(1, baseData)).rejects.toMatchObject({ status: 404 });
    });

    test("manuel koordinat verilirse otomatik eşleştirme denenmez", async () => {
      Faculty.findOne.mockResolvedValue({ id: 10 });
      CourseSection.findByPk.mockResolvedValue({ id: 5, classroom: "B-101" });
      AttendanceSession.create.mockResolvedValue({ id: 1, qrCode: "abc" });

      await createSession(1, { ...baseData, latitude: 39.9, longitude: 32.8 });

      expect(Classroom.findAll).not.toHaveBeenCalled();
      expect(AttendanceSession.create).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: 39.9, longitude: 32.8, geofenceRadius: 30 })
      );
    });

    test("koordinat verilmezse sınıf koduna göre otomatik eşleşme yapar", async () => {
      Faculty.findOne.mockResolvedValue({ id: 10 });
      CourseSection.findByPk.mockResolvedValue({ id: 5, classroom: "B-101" });
      Classroom.findAll.mockResolvedValue([
        { building: "B Blok", roomNumber: "101", latitude: 39.95, longitude: 32.85 }
      ]);
      AttendanceSession.create.mockResolvedValue({ id: 1, qrCode: "abc" });

      const result = await createSession(1, baseData);

      expect(AttendanceSession.create).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: 39.95, longitude: 32.85 })
      );
      expect(result.message).toMatch(/otomatik bulundu/);
    });

    test("koordinat verilmez ve eşleşme de bulunamazsa 400 fırlatır", async () => {
      Faculty.findOne.mockResolvedValue({ id: 10 });
      CourseSection.findByPk.mockResolvedValue({ id: 5, classroom: "Z-999" });
      Classroom.findAll.mockResolvedValue([]);

      await expect(createSession(1, baseData)).rejects.toMatchObject({ status: 400 });
      expect(AttendanceSession.create).not.toHaveBeenCalled();
    });

    test("geofenceRadius verilmezse varsayılan 30 kullanılır", async () => {
      Faculty.findOne.mockResolvedValue({ id: 10 });
      CourseSection.findByPk.mockResolvedValue({ id: 5, classroom: "B-101" });
      AttendanceSession.create.mockResolvedValue({ id: 1 });

      await createSession(1, { ...baseData, latitude: 1, longitude: 2 });

      expect(AttendanceSession.create).toHaveBeenCalledWith(
        expect.objectContaining({ geofenceRadius: 30 })
      );
    });
  });

  describe("closeSession", () => {
    test("Faculty kaydı yoksa 403 fırlatır", async () => {
      Faculty.findOne.mockResolvedValue(null);

      await expect(closeSession(1, 5)).rejects.toMatchObject({ status: 403 });
    });

    test("oturum yoksa 404 fırlatır", async () => {
      Faculty.findOne.mockResolvedValue({ id: 10 });
      AttendanceSession.findByPk.mockResolvedValue(null);

      await expect(closeSession(1, 5)).rejects.toMatchObject({ status: 404 });
    });

    test("başka bir öğretim üyesinin oturumu kapatılmak istenirse 403 fırlatır", async () => {
      Faculty.findOne.mockResolvedValue({ id: 10 });
      AttendanceSession.findByPk.mockResolvedValue({ id: 5, facultyId: 99, update: jest.fn() });

      await expect(closeSession(1, 5)).rejects.toMatchObject({ status: 403 });
    });

    test("sahibi olduğu oturumu başarıyla kapatır", async () => {
      const update = jest.fn().mockResolvedValue();
      Faculty.findOne.mockResolvedValue({ id: 10 });
      AttendanceSession.findByPk.mockResolvedValue({ id: 5, facultyId: 10, update });

      await closeSession(1, 5);

      expect(update).toHaveBeenCalledWith({ status: "Closed" });
    });
  });

  describe("refreshQrCode", () => {
    test("kapalı oturumun QR kodu yenilenemez", async () => {
      Faculty.findOne.mockResolvedValue({ id: 10 });
      AttendanceSession.findByPk.mockResolvedValue({ id: 5, facultyId: 10, status: "Closed", update: jest.fn() });

      await expect(refreshQrCode(1, 5)).rejects.toMatchObject({ status: 400 });
    });

    test("açık oturumun QR kodu yenilenir ve eskisinden farklıdır", async () => {
      const update = jest.fn().mockResolvedValue();
      Faculty.findOne.mockResolvedValue({ id: 10 });
      AttendanceSession.findByPk.mockResolvedValue({
        id: 5,
        facultyId: 10,
        status: "Open",
        qrCode: "eski-kod",
        update
      });

      const result = await refreshQrCode(1, 5);

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ qrCode: expect.any(String) })
      );
      expect(result.qrCode).not.toBe("eski-kod");
    });
  });

  describe("checkIn (GPS ile yoklama)", () => {
    const okBody = { latitude: 39.9, longitude: 32.8, accuracy: 5 };

    beforeEach(() => {
      delete process.env.CAMPUS_IP_PREFIX;
    });

    test("kampüs ağı dışından gelen istek reddedilir", async () => {
      process.env.CAMPUS_IP_PREFIX = "192.168.1.";

      await expect(
        checkIn(1, 5, okBody, "10.0.0.5")
      ).rejects.toMatchObject({ status: 403 });

      expect(Student.findOne).not.toHaveBeenCalled();
    });

    test("Student kaydı yoksa 403 fırlatır", async () => {
      Student.findOne.mockResolvedValue(null);

      await expect(checkIn(1, 5, okBody, "1.2.3.4")).rejects.toMatchObject({ status: 403 });
    });

    test("oturum bulunamazsa 404 fırlatır", async () => {
      Student.findOne.mockResolvedValue({ id: 1 });
      AttendanceSession.findByPk.mockResolvedValue(null);

      await expect(checkIn(1, 5, okBody, "1.2.3.4")).rejects.toMatchObject({ status: 404 });
    });

    test("oturum kapalıysa 400 fırlatır", async () => {
      Student.findOne.mockResolvedValue({ id: 1 });
      AttendanceSession.findByPk.mockResolvedValue({ id: 5, status: "Closed" });

      await expect(checkIn(1, 5, okBody, "1.2.3.4")).rejects.toMatchObject({ status: 400 });
    });

    test("aynı oturuma tekrar yoklama verilemez", async () => {
      Student.findOne.mockResolvedValue({ id: 1 });
      AttendanceSession.findByPk.mockResolvedValue({ id: 5, status: "Open" });
      AttendanceRecord.findOne.mockResolvedValueOnce({ id: 99 });

      await expect(checkIn(1, 5, okBody, "1.2.3.4")).rejects.toMatchObject({ status: 400 });
      expect(AttendanceRecord.create).not.toHaveBeenCalled();
    });

    test("geofence içindeyse ve hız anomalisi yoksa flagged olmadan kaydedilir", async () => {
      Student.findOne.mockResolvedValue({ id: 1 });
      AttendanceSession.findByPk.mockResolvedValue({
        id: 5,
        status: "Open",
        latitude: 39.9,
        longitude: 32.8,
        geofenceRadius: 30
      });
      AttendanceRecord.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      AttendanceRecord.create.mockResolvedValue({ id: 1, isFlagged: false });

      const result = await checkIn(1, 5, okBody, "1.2.3.4");

      expect(AttendanceRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({ isFlagged: false, flagReason: null })
      );
      expect(result.message).toMatch(/başarıyla verildi/);
    });

    test("geofence dışındaysa (mesafe aşımı) flagged olarak kaydedilir ama reddedilmez", async () => {
      Student.findOne.mockResolvedValue({ id: 1 });
      AttendanceSession.findByPk.mockResolvedValue({
        id: 5,
        status: "Open",
        latitude: 39.9,
        longitude: 32.8,
        geofenceRadius: 15
      });
      AttendanceRecord.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      AttendanceRecord.create.mockResolvedValue({ id: 1, isFlagged: true });

      const farBody = { latitude: 39.909, longitude: 32.8, accuracy: 5 };
      const result = await checkIn(1, 5, farBody, "1.2.3.4");

      expect(AttendanceRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({ isFlagged: true })
      );
      expect(result.message).toMatch(/şüpheli/);
    });

    test("hız anomalisi tespit edilirse flagged olarak kaydedilir", async () => {
      Student.findOne.mockResolvedValue({ id: 1 });
      AttendanceSession.findByPk.mockResolvedValue({
        id: 5,
        status: "Open",
        latitude: 39.9,
        longitude: 32.8,
        geofenceRadius: 30
      });
      AttendanceRecord.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          latitude: 0,
          longitude: 0,
          checkInTime: new Date(Date.now() - 60 * 1000)
        });
      AttendanceRecord.create.mockResolvedValue({ id: 1, isFlagged: true });

      const result = await checkIn(1, 5, okBody, "1.2.3.4");

      expect(AttendanceRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({ isFlagged: true })
      );
      expect(result.message).toMatch(/şüpheli/);
    });
  });

  describe("checkInWithQr", () => {
    beforeEach(() => {
      delete process.env.CAMPUS_IP_PREFIX;
    });

    test("geçersiz QR kod için 404 fırlatır", async () => {
      AttendanceSession.findOne.mockResolvedValue(null);

      await expect(
        checkInWithQr(1, "gecersiz-kod", { latitude: 1, longitude: 2 }, "1.2.3.4")
      ).rejects.toMatchObject({ status: 404 });
    });

    test("geçerli QR kod bulunursa normal check-in akışına devreder", async () => {
      Student.findOne.mockResolvedValue({ id: 1 });
      AttendanceSession.findOne.mockResolvedValue({ id: 5, qrCode: "gecerli-kod" });
      AttendanceSession.findByPk.mockResolvedValue({
        id: 5,
        status: "Open",
        latitude: 39.9,
        longitude: 32.8,
        geofenceRadius: 30
      });
      AttendanceRecord.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      AttendanceRecord.create.mockResolvedValue({ id: 1, isFlagged: false });

      const result = await checkInWithQr(
        1,
        "gecerli-kod",
        { latitude: 39.9, longitude: 32.8 },
        "1.2.3.4"
      );

      expect(result.message).toMatch(/başarıyla verildi/);
    });
  });

  describe("getReport", () => {
    test("section bulunamazsa 404 fırlatır", async () => {
      CourseSection.findByPk.mockResolvedValue(null);

      await expect(getReport(5)).rejects.toMatchObject({ status: 404 });
    });

    test("flagged kayıtları oturumlar arasından doğru şekilde toplar", async () => {
      CourseSection.findByPk.mockResolvedValue({ id: 5 });
      AttendanceSession.findAll.mockResolvedValue([
        {
          id: 1,
          records: [
            { id: 1, isFlagged: true },
            { id: 2, isFlagged: false }
          ]
        },
        {
          id: 2,
          records: [{ id: 3, isFlagged: true }]
        }
      ]);

      const report = await getReport(5);

      expect(report.totalSessions).toBe(2);
      expect(report.flaggedRecords).toHaveLength(2);
    });
  });

  describe("getMyAttendance", () => {
    test("Student kaydı yoksa 403 fırlatır", async () => {
      Student.findOne.mockResolvedValue(null);

      await expect(getMyAttendance(1)).rejects.toMatchObject({ status: 403 });
    });

    test("devamsızlık oranına göre doğru durum etiketini hesaplar (OK/Warning/Critical)", async () => {
      Student.findOne.mockResolvedValue({ id: 1 });
      Enrollment.findAll.mockResolvedValue([
        { courseId: 100, course: { courseName: "Kritik Ders" } },
        { courseId: 200, course: { courseName: "Uyarı Ders" } },
        { courseId: 300, course: { courseName: "Sorunsuz Ders" } }
      ]);

      AttendanceSession.findAll
        .mockResolvedValueOnce(Array.from({ length: 10 }, (_, i) => ({ id: i + 1 })))
        .mockResolvedValueOnce(Array.from({ length: 10 }, (_, i) => ({ id: i + 11 })))
        .mockResolvedValueOnce(Array.from({ length: 10 }, (_, i) => ({ id: i + 21 })));

      AttendanceRecord.findAll
        .mockResolvedValueOnce(Array.from({ length: 6 }, (_, i) => ({ id: i })))
        .mockResolvedValueOnce(Array.from({ length: 8 }, (_, i) => ({ id: i })))
        .mockResolvedValueOnce(Array.from({ length: 10 }, (_, i) => ({ id: i })));

      const result = await getMyAttendance(1);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ courseId: 100, status: "Critical" });
      expect(result[1]).toMatchObject({ courseId: 200, status: "Warning" });
      expect(result[2]).toMatchObject({ courseId: 300, status: "OK" });
    });

    test("hiç oturum açılmamış ders için devam oranı %100 (OK) kabul edilir", async () => {
      Student.findOne.mockResolvedValue({ id: 1 });
      Enrollment.findAll.mockResolvedValue([{ courseId: 100, course: { courseName: "Yeni Ders" } }]);
      AttendanceSession.findAll.mockResolvedValueOnce([]);
      AttendanceRecord.findAll.mockResolvedValueOnce([]);

      const result = await getMyAttendance(1);

      expect(result[0]).toMatchObject({
        totalSessions: 0,
        attendanceRate: 100,
        status: "OK"
      });
    });
  });
});