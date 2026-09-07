// Bu dosya UNIT testtir: gerçek veritabanına bağlanmaz.

jest.mock("../../models", () => ({
    ExcuseRequest: {
      findOne: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn()
    },
    AttendanceRecord: {
      findOne: jest.fn(),
      create: jest.fn()
    },
    AttendanceSession: {
      findByPk: jest.fn()
    },
    Student: {
      findOne: jest.fn(),
      findByPk: jest.fn()
    },
    User: {},
    CourseSection: {},
    Course: {}
  }));
  
  jest.mock("../../src/modules/notifications/notification.service", () => ({
    createNotification: jest.fn()
  }));
  
  const {
    ExcuseRequest,
    AttendanceRecord,
    AttendanceSession,
    Student
  } = require("../../models");
  const notificationService = require("../../src/modules/notifications/notification.service");
  const {
    createExcuseRequest,
    approveExcuseRequest,
    rejectExcuseRequest
  } = require("../../src/modules/excuseRequests/excuseRequest.service");
  
  describe("ExcuseRequestService (unit)", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    describe("createExcuseRequest", () => {
      test("sessionId veya reason eksikse 400 fırlatır", async () => {
        await expect(
          createExcuseRequest(1, { sessionId: null, reason: "" })
        ).rejects.toMatchObject({ status: 400 });
      });
  
      test("öğrenci profili yoksa 403 fırlatır", async () => {
        Student.findOne.mockResolvedValue(null);
  
        await expect(
          createExcuseRequest(1, { sessionId: 5, reason: "Hastaydım" })
        ).rejects.toMatchObject({ status: 403 });
      });
  
      test("oturum bulunamazsa 404 fırlatır", async () => {
        Student.findOne.mockResolvedValue({ id: 10 });
        AttendanceSession.findByPk.mockResolvedValue(null);
  
        await expect(
          createExcuseRequest(1, { sessionId: 5, reason: "Hastaydım" })
        ).rejects.toMatchObject({ status: 404 });
      });
  
      test("aynı oturum için bekleyen talep varsa 400 fırlatır", async () => {
        Student.findOne.mockResolvedValue({ id: 10 });
        AttendanceSession.findByPk.mockResolvedValue({ id: 5 });
        ExcuseRequest.findOne.mockResolvedValue({ id: 99, status: "Pending" });
  
        await expect(
          createExcuseRequest(1, { sessionId: 5, reason: "Hastaydım" })
        ).rejects.toMatchObject({ status: 400 });
      });
  
      test("geçerli veriyle mazeret talebi oluşturur", async () => {
        Student.findOne.mockResolvedValue({ id: 10 });
        AttendanceSession.findByPk.mockResolvedValue({ id: 5 });
        ExcuseRequest.findOne.mockResolvedValue(null);
        ExcuseRequest.create.mockResolvedValue({ id: 1, status: "Pending" });
  
        const result = await createExcuseRequest(1, {
          sessionId: 5,
          reason: "Hastaydım"
        });
  
        expect(ExcuseRequest.create).toHaveBeenCalledWith({
          studentId: 10,
          sessionId: 5,
          reason: "Hastaydım",
          documentUrl: null,
          status: "Pending"
        });
        expect(result.excuseRequest.status).toBe("Pending");
      });
    });
  
    describe("approveExcuseRequest", () => {
      test("talep bulunamazsa 404 fırlatır", async () => {
        ExcuseRequest.findByPk.mockResolvedValue(null);
  
        await expect(
          approveExcuseRequest(1, 2, "not")
        ).rejects.toMatchObject({ status: 404 });
      });
  
      test("talep zaten değerlendirilmişse 400 fırlatır", async () => {
        ExcuseRequest.findByPk.mockResolvedValue({ status: "Approved" });
  
        await expect(
          approveExcuseRequest(1, 2, "not")
        ).rejects.toMatchObject({ status: 400 });
      });
  
      test("var olan bir isFlagged kaydı varsa onu günceller, yeni kayıt oluşturmaz", async () => {
        const excuseInstance = {
          id: 1,
          status: "Pending",
          sessionId: 5,
          studentId: 10,
          save: jest.fn().mockResolvedValue(true)
        };
        ExcuseRequest.findByPk.mockResolvedValue(excuseInstance);
  
        const existingRecord = {
          isFlagged: true,
          flagReason: "eski",
          save: jest.fn().mockResolvedValue(true)
        };
        AttendanceRecord.findOne.mockResolvedValue(existingRecord);
        Student.findByPk.mockResolvedValue({ userId: 3 });
  
        await approveExcuseRequest(1, 2, "Kabul edildi");
  
        expect(existingRecord.isFlagged).toBe(false);
        expect(existingRecord.save).toHaveBeenCalled();
        expect(AttendanceRecord.create).not.toHaveBeenCalled();
        expect(notificationService.createNotification).toHaveBeenCalled();
      });
  
      test("hiç kayıt yoksa yeni bir AttendanceRecord oluşturur", async () => {
        const excuseInstance = {
          id: 1,
          status: "Pending",
          sessionId: 5,
          studentId: 10,
          save: jest.fn().mockResolvedValue(true)
        };
        ExcuseRequest.findByPk.mockResolvedValue(excuseInstance);
        AttendanceRecord.findOne.mockResolvedValue(null);
        Student.findByPk.mockResolvedValue({ userId: 3 });
  
        await approveExcuseRequest(1, 2, "Kabul edildi");
  
        expect(AttendanceRecord.create).toHaveBeenCalledWith(
          expect.objectContaining({ sessionId: 5, studentId: 10, isFlagged: false })
        );
      });
    });
  
    describe("rejectExcuseRequest", () => {
      test("talep bulunamazsa 404 fırlatır", async () => {
        ExcuseRequest.findByPk.mockResolvedValue(null);
  
        await expect(
          rejectExcuseRequest(1, 2, "not")
        ).rejects.toMatchObject({ status: 404 });
      });
  
      test("geçerli reddetme talebin durumunu Rejected yapar ve bildirim gönderir", async () => {
        const excuseInstance = {
          id: 1,
          status: "Pending",
          studentId: 10,
          save: jest.fn().mockResolvedValue(true)
        };
        ExcuseRequest.findByPk.mockResolvedValue(excuseInstance);
        Student.findByPk.mockResolvedValue({ userId: 3 });
  
        await rejectExcuseRequest(1, 2, "Belge yetersiz");
  
        expect(excuseInstance.status).toBe("Rejected");
        expect(excuseInstance.notes).toBe("Belge yetersiz");
        expect(notificationService.createNotification).toHaveBeenCalled();
      });
    });
  });