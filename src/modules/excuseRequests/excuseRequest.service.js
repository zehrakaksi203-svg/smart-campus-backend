const { 
  ExcuseRequest, 
  AttendanceRecord, 
  AttendanceSession, 
  Student, 
  User, 
  CourseSection, 
  Course 
} = require("../../../models");
const notificationService = require("../notifications/notification.service");

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// 1. Mazeret Talebi Oluşturma (Student)
const createExcuseRequest = async (userId, data) => {
  const { sessionId, reason, documentUrl } = data;

  if (!sessionId || !reason) {
    throw createError(400, "Oturum ID (sessionId) ve mazeret açıklaması (reason) zorunludur.");
  }

  const student = await Student.findOne({ where: { userId } });
  if (!student) {
    throw createError(403, "Bu işlem için geçerli öğrenci profili bulunamadı.");
  }

  const session = await AttendanceSession.findByPk(sessionId);
  if (!session) {
    throw createError(404, "İlgili yoklama oturumu bulunamadı.");
  }

  const existingRequest = await ExcuseRequest.findOne({
    where: { studentId: student.id, sessionId, status: "Pending" }
  });

  if (existingRequest) {
    throw createError(400, "Bu oturum için zaten değerlendirme bekleyen bir mazeret talebiniz bulunmaktadır.");
  }

  const excuseRequest = await ExcuseRequest.create({
    studentId: student.id,
    sessionId,
    reason,
    documentUrl: documentUrl || null,
    status: "Pending"
  });

  return { message: "Mazeret talebiniz başarıyla iletildi.", excuseRequest };
};

// 2. Tüm Mazeret Taleplerini Listeleme (Faculty / Admin)
const getAllExcuseRequests = async () => {
  return await ExcuseRequest.findAll({
    include: [
      {
        model: Student,
        as: "student",
        include: [{ model: User, as: "user", attributes: ["fullName", "email"] }]
      },
      {
        model: AttendanceSession,
        as: "session",
        include: [
          {
            model: CourseSection,
            as: "section",
            include: [{ model: Course, as: "course", attributes: ["code", "name"] }]
          }
        ]
      }
    ],
    order: [["createdAt", "DESC"]]
  });
};

// 3. Öğrencinin Kendi Mazeret Talepleri (Student)
const getMyExcuseRequests = async (userId) => {
  const student = await Student.findOne({ where: { userId } });
  if (!student) {
    throw createError(403, "Öğrenci profili bulunamadı.");
  }

  return await ExcuseRequest.findAll({
    where: { studentId: student.id },
    include: [
      {
        model: AttendanceSession,
        as: "session",
        include: [
          {
            model: CourseSection,
            as: "section",
            include: [{ model: Course, as: "course", attributes: ["code", "name"] }]
          }
        ]
      }
    ],
    order: [["createdAt", "DESC"]]
  });
};

// 4. Detay Getirme
const getExcuseRequestById = async (id) => {
  const excuseRequest = await ExcuseRequest.findByPk(id, {
    include: [
      {
        model: Student,
        as: "student",
        include: [{ model: User, as: "user", attributes: ["fullName", "email"] }]
      },
      {
        model: AttendanceSession,
        as: "session"
      }
    ]
  });

  if (!excuseRequest) {
    throw createError(404, "Mazeret talebi bulunamadı.");
  }

  return excuseRequest;
};

// 5. Onaylama (Faculty / Admin)
const approveExcuseRequest = async (id, reviewerId, notes) => {
  const excuse = await ExcuseRequest.findByPk(id);
  if (!excuse) {
    throw createError(404, "Mazeret talebi bulunamadı.");
  }

  if (excuse.status !== "Pending") {
    throw createError(400, `Bu talep zaten '${excuse.status}' olarak sonuçlandırılmıştır.`);
  }

  excuse.status = "Approved";
  excuse.reviewedBy = reviewerId;
  excuse.reviewedAt = new Date();
  excuse.notes = notes || "Mazeret kabul edildi.";
  await excuse.save();

  let attendanceRecord = await AttendanceRecord.findOne({
    where: { sessionId: excuse.sessionId, studentId: excuse.studentId }
  });

  if (attendanceRecord) {
    attendanceRecord.isFlagged = false;
    attendanceRecord.flagReason = "Mazeret kabul edildi.";
    await attendanceRecord.save();
  } else {
    await AttendanceRecord.create({
      sessionId: excuse.sessionId,
      studentId: excuse.studentId,
      checkInTime: new Date(),
      isFlagged: false,
      flagReason: "Mazeret Onaylı Katılım"
    });
  }

  const approvedStudent = await Student.findByPk(excuse.studentId);
  if (approvedStudent) {
    await notificationService.createNotification({
      userId: approvedStudent.userId,
      title: "Mazeret Talebi Onaylandı",
      message: excuse.notes,
      type: "excuse_request",
      relatedEntityType: "ExcuseRequest",
      relatedEntityId: excuse.id
    });
  }

  return { message: "Mazeret talebi onaylandı ve yoklama kaydı güncellendi.", excuse };
};

// 6. Reddetme (Faculty / Admin)
const rejectExcuseRequest = async (id, reviewerId, notes) => {
  const excuse = await ExcuseRequest.findByPk(id);
  if (!excuse) {
    throw createError(404, "Mazeret talebi bulunamadı.");
  }

  if (excuse.status !== "Pending") {
    throw createError(400, `Bu talep zaten '${excuse.status}' olarak sonuçlandırılmıştır.`);
  }

  excuse.status = "Rejected";
  excuse.reviewedBy = reviewerId;
  excuse.reviewedAt = new Date();
  excuse.notes = notes || "Mazeret belgesi yetersiz görüldü.";
  await excuse.save();

  const rejectedStudent = await Student.findByPk(excuse.studentId);
  if (rejectedStudent) {
    await notificationService.createNotification({
      userId: rejectedStudent.userId,
      title: "Mazeret Talebi Reddedildi",
      message: excuse.notes,
      type: "excuse_request",
      relatedEntityType: "ExcuseRequest",
      relatedEntityId: excuse.id
    });
  }

  return { message: "Mazeret talebi reddedildi.", excuse };
};

module.exports = {
  createExcuseRequest,
  getAllExcuseRequests,
  getMyExcuseRequests,
  getExcuseRequestById,
  approveExcuseRequest,
  rejectExcuseRequest
};