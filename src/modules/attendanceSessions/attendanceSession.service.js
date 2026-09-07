const crypto = require("crypto");
const {
    AttendanceSession,
    AttendanceRecord,
    CourseSection,
    Classroom,
    Faculty,
    Student,
    Enrollment
  } = require("../../../models");


  const isFromCampusNetwork = (clientIp) => {
    const prefix = process.env.CAMPUS_IP_PREFIX;
  
    if (!prefix) return true; // Prefiks tanımlı değilse kontrolü atla (geliştirme kolaylığı)
  
    if (!clientIp) return false;
  
    // IPv6-mapped IPv4 adreslerini normalize et (örn. ::ffff:192.168.1.5)
    const normalizedIp = clientIp.replace("::ffff:", "");
  
    return normalizedIp.startsWith(prefix);
  };


  
  // İki GPS koordinatı arasındaki mesafeyi metre cinsinden hesaplar (Haversine formülü).
  const haversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371000; // Dünya yarıçapı (metre)
  
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
  
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return R * c;
  };
     
  // "B-101" gibi bir classroom string'ini bina harfi ve oda no olarak ayrıştırıp
  // Classroom tablosunda eşleşen kaydı bulur. Eşleşme yoksa null döner.
  const findClassroomByCode = async (classroomCode) => {
    if (!classroomCode) return null;

    const parts = classroomCode.split("-");
    if (parts.length < 2) return null;

    const buildingLetter = parts[0].trim();
    const roomNumber = parts.slice(1).join("-").trim();

    const classrooms = await Classroom.findAll();

    const match = classrooms.find((c) => {
      const buildingMatch = c.building
        .trim()
        .toUpperCase()
        .startsWith(buildingLetter.toUpperCase());

      const roomMatch = c.roomNumber.trim() === roomNumber;

      return buildingMatch && roomMatch;
    });

    return match || null;
  };



  const getFacultyByUserId = async (userId) => {
    const faculty = await Faculty.findOne({ where: { userId } });
    if (!faculty) {
      throw { status: 403, message: "Bu işlem için öğretim üyesi kaydınız bulunamadı." };
    }
    return faculty;
  };
  
  const getStudentByUserId = async (userId) => {
    const student = await Student.findOne({ where: { userId } });
    if (!student) {
      throw { status: 403, message: "Bu işlem için öğrenci kaydınız bulunamadı." };
    }
    return student;
  };
  
  const createSession = async (userId, { sectionId, date, startTime, endTime, latitude, longitude, geofenceRadius }) => {
    const faculty = await getFacultyByUserId(userId);

    const section = await CourseSection.findByPk(sectionId);      
    if (!section) {
      throw { status: 404, message: "Section bulunamadÄ±." };
    }

    let sessionLatitude = latitude;
    let sessionLongitude = longitude;
    let classroomAutoMatched = false;

    // Öğretmen manuel koordinat girmediyse, section'ın classroom
    // kodundan (örn. "B-101") Classroom tablosuna otomatik eşleşme dene.
    if (!sessionLatitude || !sessionLongitude) {
      const matchedClassroom = await findClassroomByCode(section.classroom);

      if (matchedClassroom) {
        sessionLatitude = matchedClassroom.latitude;
        sessionLongitude = matchedClassroom.longitude;
        classroomAutoMatched = true;
      } else {
        throw {
          status: 400,
          message: "Bu section için sınıf GPS konumu otomatik bulunamadı. Lütfen konum bilgisini manuel girin."
        };
      }
    }

    const qrCode = crypto.randomBytes(16).toString("hex");        

    const session = await AttendanceSession.create({
      sectionId,
      facultyId: faculty.id,
      date,
      startTime,
      endTime,
      latitude: sessionLatitude,
      longitude: sessionLongitude,
      geofenceRadius: geofenceRadius || 30,
      qrCode,
      status: "Open"
    });

    return {
      message: classroomAutoMatched
        ? "Yoklama oturumu açıldı (sınıf konumu otomatik bulundu)."
        : "Yoklama oturumu açıldı.",
      session
    };
  };
  
  const getSessionById = async (id) => {
    const session = await AttendanceSession.findByPk(id, {
      include: [
        { model: CourseSection, as: "section" },
        { model: Faculty, as: "faculty" }
      ]
    });
  
    if (!session) {
      throw { status: 404, message: "Oturum bulunamadı." };
    }
  
    return session;
  };
  
  const closeSession = async (userId, id) => {
    const faculty = await getFacultyByUserId(userId);
    const session = await AttendanceSession.findByPk(id);
  
    if (!session) {
      throw { status: 404, message: "Oturum bulunamadı." };
    }
  
    if (session.facultyId !== faculty.id) {
      throw { status: 403, message: "Bu oturumu kapatma yetkiniz yok." };
    }
  
    await session.update({ status: "Closed" });
  
    return {
      message: "Oturum kapatıldı.",
      session
    };
  };

  const refreshQrCode = async (userId, id) => {
    const faculty = await getFacultyByUserId(userId);
    const session = await AttendanceSession.findByPk(id);
  
    if (!session) {
      throw { status: 404, message: "Oturum bulunamadı." };
    }
  
    if (session.facultyId !== faculty.id) {
      throw { status: 403, message: "Bu oturumun QR kodunu yenileme yetkiniz yok." };
    }

    if (session.status !== "Open") {
      throw { status: 400, message: "Kapalı oturumun QR kodu yenilenemez." };
    }

    const qrCode = crypto.randomBytes(16).toString("hex");
    await session.update({ qrCode });

    return { qrCode };
  };

  const checkInWithQr = async (userId, qrCode, { latitude, longitude, accuracy }, clientIp) => {
    const session = await AttendanceSession.findOne({ where: { qrCode } });

    if (!session) {
      throw { status: 404, message: "Geçersiz veya süresi dolmuş QR kod." };
    }

    return checkIn(userId, session.id, { latitude, longitude, accuracy }, clientIp);
  };





  
  const getMySessions = async (userId) => {
    const faculty = await getFacultyByUserId(userId);
  
    return AttendanceSession.findAll({
      where: { facultyId: faculty.id },
      include: [{ model: CourseSection, as: "section" }]
    });
  };
  const MAX_PLAUSIBLE_SPEED_KMH = 200;

  const checkVelocityAnomaly = async (studentId, latitude, longitude, now) => {
    const previousRecord = await AttendanceRecord.findOne({
      where: { studentId },
      order: [["checkInTime", "DESC"]]
    });

    if (!previousRecord) return null;

    const distanceMeters = haversineDistanceMeters(
      parseFloat(previousRecord.latitude),
      parseFloat(previousRecord.longitude),
      parseFloat(latitude),
      parseFloat(longitude)
    );

    const hoursElapsed = (now - new Date(previousRecord.checkInTime)) / (1000 * 60 * 60);

    if (hoursElapsed <= 0) return null;

    const speedKmh = (distanceMeters / 1000) / hoursElapsed;

    if (speedKmh > MAX_PLAUSIBLE_SPEED_KMH) {
      return `Önceki konumdan bu yana fiziksel olarak imkansız hız tespit edildi (~${Math.round(speedKmh)} km/s)`;
    }

    return null;
  };

  const checkIn = async (userId, sessionId, { latitude, longitude, accuracy }, clientIp) => {
    if (!isFromCampusNetwork(clientIp)) {
      throw { status: 403, message: "Yoklama sadece kampüs ağına bağlıyken verilebilir." };
    }

    const student = await getStudentByUserId(userId);

    const session = await AttendanceSession.findByPk(sessionId);
    if (!session) {
      throw { status: 404, message: "Oturum bulunamadı." };
    }

    if (session.status !== "Open") {
      throw { status: 400, message: "Bu oturum kapalı, yoklama alınamıyor." };
    }

    const existing = await AttendanceRecord.findOne({
      where: { sessionId, studentId: student.id }
    });
    if (existing) {
      throw { status: 400, message: "Bu oturum için zaten yoklama verdiniz." };
    }

    const now = new Date();

    const distance = haversineDistanceMeters(
      parseFloat(session.latitude),
      parseFloat(session.longitude),
      parseFloat(latitude),
      parseFloat(longitude)
    );

    const accuracyBuffer = accuracy ? Math.min(accuracy, 50) : 5;
    const allowedDistance = session.geofenceRadius + accuracyBuffer;

    const geofenceFlagged = distance > allowedDistance;
    const velocityFlagReason = await checkVelocityAnomaly(student.id, latitude, longitude, now);

    const isFlagged = geofenceFlagged || Boolean(velocityFlagReason);

    let flagReason = null;
    if (geofenceFlagged && velocityFlagReason) {
      flagReason = `Sınıf konumuna uzaklık ${distance.toFixed(1)}m, izin verilen ${allowedDistance}m; ${velocityFlagReason}`;
    } else if (geofenceFlagged) {
      flagReason = `Sınıf konumuna uzaklık ${distance.toFixed(1)}m, izin verilen ${allowedDistance}m`;
    } else if (velocityFlagReason) {
      flagReason = velocityFlagReason;
    }

    const record = await AttendanceRecord.create({
      sessionId,
      studentId: student.id,
      checkInTime: now,
      latitude,
      longitude,
      distanceFromCenter: distance.toFixed(2),
      isFlagged,
      flagReason
    });

    return {
      message: isFlagged
        ? "Yoklama kaydedildi ancak konum şüpheli olarak işaretlendi."
        : "Yoklama başarıyla verildi.",
      record
    };
  };
  
  const getReport = async (sectionId) => {
    const section = await CourseSection.findByPk(sectionId);
    if (!section) {
      throw { status: 404, message: "Section bulunamadı." };
    }
  
    const sessions = await AttendanceSession.findAll({
      where: { sectionId },
      include: [
        {
          model: AttendanceRecord,
          as: "records",
          include: [
            {
              model: Student,
              as: "student",
              include: [{ association: "user" }]
            }
          ]
        }
      ]
    });
  
    const flaggedRecords = sessions.flatMap((s) =>
      s.records.filter((r) => r.isFlagged)
    );
  
    return {
      sectionId,
      totalSessions: sessions.length,
      sessions,
      flaggedRecords
    };
  };
  
  const getMyAttendance = async (userId) => {
    const student = await getStudentByUserId(userId);
  
    const enrollments = await Enrollment.findAll({
      where: { studentId: student.id },
      include: [{ association: "course" }]
    });
  
    const result = [];
  
    for (const enrollment of enrollments) {
      const sessions = await AttendanceSession.findAll({
        include: [
          {
            model: CourseSection,
            as: "section",
            where: { courseId: enrollment.courseId }
          }
        ]
      });
  
      const totalSessions = sessions.length;
  
      const records = await AttendanceRecord.findAll({
        where: {
          studentId: student.id,
          sessionId: sessions.map((s) => s.id)
        }
      });
  
      const attendedSessions = records.length;
      const absentCount = totalSessions - attendedSessions;
      const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 100;
      const absenceRate = 100 - attendanceRate;
  
      let status = "OK";
      if (absenceRate >= 30) {
        status = "Critical";
      } else if (absenceRate >= 20) {
        status = "Warning";
      }
  
      result.push({
        courseId: enrollment.courseId,
        courseName: enrollment.course ? enrollment.course.courseName : null,
        totalSessions,
        attendedSessions,
        absentCount,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        status
      });
    }
  
    return result;
  };
  
  module.exports = {
    haversineDistanceMeters,
    isFromCampusNetwork,
    findClassroomByCode,
    checkVelocityAnomaly,
    createSession,
    getSessionById,
    closeSession,
    getMySessions,
    checkIn,
    checkInWithQr,
    refreshQrCode,
    getReport,
    getMyAttendance
  };