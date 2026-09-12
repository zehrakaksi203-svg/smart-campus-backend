'use strict';
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');
const {
  User,
  Course,
  Enrollment,
  Event,
  MealReservation,
  Meal,
  AttendanceSession,
  AttendanceRecord,
  RefreshToken,
  Student,
  Department,
  Grade,
  CourseSection,
  sequelize,
  EventRegistration
} = require('../../../models');

const AT_RISK_GPA_THRESHOLD = 2.0;
const TOP_STUDENTS_LIMIT = 10;

const CRITICAL_ABSENCE_RATE_THRESHOLD = 70; // bu yüzdenin altı "kritik"
const LOW_ATTENDANCE_COURSE_THRESHOLD = 75; // bu yüzdenin altı "düşük katılımlı"

const ALL_LETTER_GRADES = [
  'AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FD', 'FF'
];

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

async function getDashboardStats() {
  const { start, end } = getTodayRange();

  const totalUsers = await User.count();

  // "Aktif kullanıcı" için ayrı bir son-giriş alanı olmadığından,
  // bugün oluşturulan RefreshToken sayısı login proxy'si olarak kullanılıyor.
  const activeUsersTodayRaw = await RefreshToken.findAll({
    attributes: [
      [sequelize.fn('DISTINCT', sequelize.col('userId')), 'userId']
    ],
    where: {
      createdAt: {
        [Op.between]: [start, end]
      }
    },
    raw: true
  });
  const activeUsersToday = activeUsersTodayRaw.length;

  const totalCourses = await Course.count();

  const totalEnrollments = await Enrollment.count({
    where: { status: 'Active' }
  });

  // Katılım oranı: tüm session'lardaki gerçekleşen check-in sayısı /
  // o session'ların bağlı olduğu section'lardaki aktif kayıt sayıları toplamı
  const sessions = await AttendanceSession.findAll({
    attributes: ['id', 'sectionId']
  });

  let totalExpected = 0;
  let totalCheckIns = 0;

  if (sessions.length > 0) {
    const sectionIds = sessions.map((s) => s.sectionId);

    const enrollmentCounts = await Enrollment.findAll({
      attributes: [
        'sectionId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        sectionId: { [Op.in]: sectionIds },
        status: 'Active'
      },
      group: ['sectionId'],
      raw: true
    });

    const enrollmentCountBySection = {};
    enrollmentCounts.forEach((row) => {
      enrollmentCountBySection[row.sectionId] = Number(row.count);
    });

    sessions.forEach((session) => {
      totalExpected += enrollmentCountBySection[session.sectionId] || 0;
    });

    totalCheckIns = await AttendanceRecord.count({
      where: {
        sessionId: { [Op.in]: sessions.map((s) => s.id) }
      }
    });
  }

  const attendanceRate =
    totalExpected > 0
      ? Number(((totalCheckIns / totalExpected) * 100).toFixed(2))
      : 0;

  const mealReservationsToday = await MealReservation.count({
    where: {
      reservationDate: {
        [Op.between]: [start, end]
      }
    }
  });

  const upcomingEvents = await Event.count({
    where: {
      eventDate: { [Op.gte]: new Date() },
      status: 'Scheduled'
    }
  });

  return {
    totalUsers,
    activeUsersToday,
    totalCourses,
    totalEnrollments,
    attendanceRate,
    mealReservationsToday,
    upcomingEvents,
    systemHealth: 'healthy'
  };
}

async function getAcademicPerformance() {
  // Bölüme göre ortalama GPA
  const gpaByDepartmentRaw = await Student.findAll({
    attributes: [
      'departmentId',
      [sequelize.fn('AVG', sequelize.col('Student.gpa')), 'averageGpa'],
      [sequelize.fn('COUNT', sequelize.col('Student.id')), 'studentCount']
    ],
    include: [
      { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
    ],
    group: ['departmentId', 'department.id', 'department.name', 'department.code'],
    raw: true
  });

  const gpaByDepartment = gpaByDepartmentRaw.map((row) => ({
    departmentId: row.departmentId,
    departmentName: row['department.name'],
    departmentCode: row['department.code'],
    averageGpa: Number(Number(row.averageGpa).toFixed(2)),
    studentCount: Number(row.studentCount)
  }));

  // Harf notu dağılımı (Türk sistemi: AA...FF)
  const totalGradedCount = await Grade.count();

  const letterGradeCountsRaw = await Grade.findAll({
    attributes: [
      'letterGrade',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['letterGrade'],
    raw: true
  });

  const letterGradeCountMap = {};
  letterGradeCountsRaw.forEach((row) => {
    letterGradeCountMap[row.letterGrade] = Number(row.count);
  });

  const gradeDistribution = ALL_LETTER_GRADES.map((letter) => {
    const count = letterGradeCountMap[letter] || 0;

    return {
      letterGrade: letter,
      count,
      percentage:
        totalGradedCount > 0
          ? Number(((count / totalGradedCount) * 100).toFixed(2))
          : 0
    };
  });

  // Pass/fail oranları
  const passCount = await Grade.count({ where: { status: 'Passed' } });
  const failCount = await Grade.count({ where: { status: 'Failed' } });

  const passFailRates = {
    passCount,
    failCount,
    passRate:
      totalGradedCount > 0
        ? Number(((passCount / totalGradedCount) * 100).toFixed(2))
        : 0,
    failRate:
      totalGradedCount > 0
        ? Number(((failCount / totalGradedCount) * 100).toFixed(2))
        : 0
  };

  // En başarılı öğrenciler
  const topStudentsRaw = await Student.findAll({
    attributes: ['id', 'studentNumber', 'classYear', 'gpa'],
    include: [
      { model: User, as: 'user', attributes: ['fullName', 'email'] },
      { model: Department, as: 'department', attributes: ['name'] }
    ],
    order: [['gpa', 'DESC']],
    limit: TOP_STUDENTS_LIMIT
  });

  const topStudents = topStudentsRaw.map((s) => ({
    studentId: s.id,
    studentNumber: s.studentNumber,
    fullName: s.user?.fullName,
    department: s.department?.name,
    classYear: s.classYear,
    gpa: Number(s.gpa)
  }));

  // Riskli öğrenciler (düşük GPA)
  const atRiskStudentsRaw = await Student.findAll({
    attributes: ['id', 'studentNumber', 'classYear', 'gpa'],
    where: {
      gpa: { [Op.lt]: AT_RISK_GPA_THRESHOLD }
    },
    include: [
      { model: User, as: 'user', attributes: ['fullName', 'email'] },
      { model: Department, as: 'department', attributes: ['name'] }
    ],
    order: [['gpa', 'ASC']],
    limit: TOP_STUDENTS_LIMIT
  });

  const atRiskStudents = atRiskStudentsRaw.map((s) => ({
    studentId: s.id,
    studentNumber: s.studentNumber,
    fullName: s.user?.fullName,
    department: s.department?.name,
    classYear: s.classYear,
    gpa: Number(s.gpa)
  }));

  return {
    gpaByDepartment,
    gradeDistribution,
    passFailRates,
    topStudents,
    atRiskStudents
  };
}

async function getAttendanceAnalytics() {
  // Tüm session'ları section ve course bilgisiyle çek
  const sessions = await AttendanceSession.findAll({
    attributes: ['id', 'sectionId', 'date'],
    include: [
      {
        model: CourseSection,
        as: 'section',
        attributes: ['id', 'courseId'],
        include: [
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'courseCode', 'courseName']
          }
        ]
      }
    ]
  });

  const sectionIds = [...new Set(sessions.map((s) => s.sectionId))];

  // Aktif kayıtları section bazında grupla
  const activeEnrollments = await Enrollment.findAll({
    attributes: ['studentId', 'sectionId'],
    where: {
      sectionId: { [Op.in]: sectionIds },
      status: 'Active'
    },
    raw: true
  });

  const studentsBySection = {};
  activeEnrollments.forEach((e) => {
    if (!studentsBySection[e.sectionId]) {
      studentsBySection[e.sectionId] = [];
    }
    studentsBySection[e.sectionId].push(e.studentId);
  });

  // Tüm check-in kayıtlarını çek, hızlı erişim için Set'e koy
  const sessionIds = sessions.map((s) => s.id);

  const allRecords = await AttendanceRecord.findAll({
    attributes: ['sessionId', 'studentId'],
    where: {
      sessionId: { [Op.in]: sessionIds }
    },
    raw: true
  });

  const recordSet = new Set(
    allRecords.map((r) => `${r.sessionId}_${r.studentId}`)
  );

  // Aggregation yapıları
  const courseStats = {}; // courseId -> { courseName, courseCode, expected, checkIns }
  const dateStats = {}; // date -> { expected, checkIns }
  const studentStats = {}; // studentId -> { expected, checkIns }

  sessions.forEach((session) => {
    const courseId = session.section?.courseId;
    const courseName = session.section?.course?.courseName;
    const courseCode = session.section?.course?.courseCode;
    const date = session.date;
    const studentsInSection = studentsBySection[session.sectionId] || [];

    if (courseId) {
      if (!courseStats[courseId]) {
        courseStats[courseId] = {
          courseId,
          courseName,
          courseCode,
          expected: 0,
          checkIns: 0
        };
      }
    }

    if (!dateStats[date]) {
      dateStats[date] = { date, expected: 0, checkIns: 0 };
    }

    studentsInSection.forEach((studentId) => {
      const attended = recordSet.has(`${session.id}_${studentId}`);

      if (courseId) {
        courseStats[courseId].expected += 1;
        if (attended) courseStats[courseId].checkIns += 1;
      }

      dateStats[date].expected += 1;
      if (attended) dateStats[date].checkIns += 1;

      if (!studentStats[studentId]) {
        studentStats[studentId] = { expected: 0, checkIns: 0 };
      }
      studentStats[studentId].expected += 1;
      if (attended) studentStats[studentId].checkIns += 1;
    });
  });

  const rate = (checkIns, expected) =>
    expected > 0 ? Number(((checkIns / expected) * 100).toFixed(2)) : 0;

  const attendanceRateByCourse = Object.values(courseStats).map((c) => ({
    courseId: c.courseId,
    courseCode: c.courseCode,
    courseName: c.courseName,
    expected: c.expected,
    checkIns: c.checkIns,
    attendanceRate: rate(c.checkIns, c.expected)
  }));

  const attendanceTrends = Object.values(dateStats)
    .map((d) => ({
      date: d.date,
      expected: d.expected,
      checkIns: d.checkIns,
      attendanceRate: rate(d.checkIns, d.expected)
    }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  const lowAttendanceCourses = attendanceRateByCourse.filter(
    (c) => c.attendanceRate < LOW_ATTENDANCE_COURSE_THRESHOLD
  );

  // Kritik devamsızlık gösteren öğrenciler
  const criticalStudentIds = Object.keys(studentStats).filter((studentId) => {
    const s = studentStats[studentId];
    return rate(s.checkIns, s.expected) < CRITICAL_ABSENCE_RATE_THRESHOLD;
  });

  let criticalAbsenceStudents = [];

  if (criticalStudentIds.length > 0) {
    const students = await Student.findAll({
      where: { id: { [Op.in]: criticalStudentIds } },
      attributes: ['id', 'studentNumber'],
      include: [{ model: User, as: 'user', attributes: ['fullName'] }]
    });

    criticalAbsenceStudents = students.map((s) => {
      const stat = studentStats[s.id];
      return {
        studentId: s.id,
        studentNumber: s.studentNumber,
        fullName: s.user?.fullName,
        expected: stat.expected,
        checkIns: stat.checkIns,
        attendanceRate: rate(stat.checkIns, stat.expected)
      };
    });

    criticalAbsenceStudents.sort((a, b) => a.attendanceRate - b.attendanceRate);
  }

  return {
    attendanceRateByCourse,
    attendanceTrends,
    lowAttendanceCourses,
    criticalAbsenceStudents
  };
}

async function getMealUsageAnalytics() {
  // İptal edilmemiş (Reserved veya Used vb.) rezervasyonlar üzerinden hesaplama
  const reservations = await MealReservation.findAll({
    attributes: ['id', 'mealId', 'reservationDate', 'status'],
    where: {
      status: { [Op.ne]: 'Cancelled' }
    },
    include: [
      { model: Meal, as: 'meal', attributes: ['id', 'name', 'price'] }
    ]
  });

  const dailyCountsMap = {};
  const hourCountsMap = {};
  const mealCountsMap = {}; // mealId -> { name, count }
  let totalRevenue = 0;

  reservations.forEach((r) => {
    const date = new Date(r.reservationDate);
    const dayKey = date.toISOString().split('T')[0];
    const hourKey = date.getHours();

    dailyCountsMap[dayKey] = (dailyCountsMap[dayKey] || 0) + 1;
    hourCountsMap[hourKey] = (hourCountsMap[hourKey] || 0) + 1;

    if (r.meal) {
      if (!mealCountsMap[r.mealId]) {
        mealCountsMap[r.mealId] = { mealId: r.mealId, name: r.meal.name, count: 0 };
      }
      mealCountsMap[r.mealId].count += 1;

      totalRevenue += Number(r.meal.price);
    }
  });

  const dailyMealCounts = Object.keys(dailyCountsMap)
    .sort()
    .map((date) => ({ date, count: dailyCountsMap[date] }));

  const peakHours = Object.keys(hourCountsMap)
    .map((hour) => ({ hour: Number(hour), count: hourCountsMap[hour] }))
    .sort((a, b) => b.count - a.count);

  const mostPopularMeals = Object.values(mealCountsMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_STUDENTS_LIMIT);

  return {
    dailyMealCounts,
    revenue: Number(totalRevenue.toFixed(2)),
    peakHours,
    mostPopularMeals
  };
}
async function getEventAnalytics() {
    const events = await Event.findAll({
      attributes: ['id', 'title', 'eventDate', 'capacity', 'status']
    });
  
    const eventIds = events.map((e) => e.id);
  
    const registrations = await EventRegistration.findAll({
      attributes: ['id', 'eventId', 'status', 'qrUsed'],
      where: {
        eventId: { [Op.in]: eventIds }
      },
      raw: true
    });
  
    const statsByEvent = {};
    eventIds.forEach((id) => {
      statsByEvent[id] = {
        registeredCount: 0,
        waitlistedCount: 0,
        checkedInCount: 0
      };
    });
  
    registrations.forEach((r) => {
      const stat = statsByEvent[r.eventId];
      if (!stat) return;
  
      if (r.status === 'Registered') {
        stat.registeredCount += 1;
        if (r.qrUsed) stat.checkedInCount += 1;
      } else if (r.status === 'Waitlisted') {
        stat.waitlistedCount += 1;
      }
    });
  
    const eventStats = events.map((event) => {
      const stat = statsByEvent[event.id];
      const totalRegistrations = stat.registeredCount + stat.waitlistedCount;
  
      return {
        eventId: event.id,
        title: event.title,
        eventDate: event.eventDate,
        capacity: event.capacity,
        registeredCount: stat.registeredCount,
        waitlistedCount: stat.waitlistedCount,
        totalRegistrations,
        registrationRate:
          event.capacity > 0
            ? Number(((totalRegistrations / event.capacity) * 100).toFixed(2))
            : 0,
        checkInRate:
          stat.registeredCount > 0
            ? Number(
                ((stat.checkedInCount / stat.registeredCount) * 100).toFixed(2)
              )
            : 0
      };
    });
  
    const mostPopularEvents = [...eventStats]
      .sort((a, b) => b.totalRegistrations - a.totalRegistrations)
      .slice(0, TOP_STUDENTS_LIMIT);
  
    return {
      events: eventStats,
      mostPopularEvents
    };
  }
  function generatePdfBuffer(title, data) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40 });
      const buffers = [];
  
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
  
      doc.fontSize(16).text(title, { align: 'center' });
      doc.moveDown();
  
      if (data.length === 0) {
        doc.fontSize(12).text('Veri bulunamadı.');
      } else {
        const keys = Object.keys(data[0]);
  
        doc.fontSize(10);
        data.forEach((row, idx) => {
          const line = keys.map((k) => `${k}: ${row[k]}`).join('  |  ');
          doc.text(`${idx + 1}. ${line}`);
          doc.moveDown(0.3);
        });
      }
  
      doc.end();
    });
  }
  
  async function generateExport(type, format) {
    let data;
    let title;
  
    switch (type) {
      case 'academic': {
        const performance = await getAcademicPerformance();
        data = performance.gpaByDepartment;
        title = 'Akademik Performans Raporu - Bolume Gore GPA';
        break;
      }
      case 'attendance': {
        const attendance = await getAttendanceAnalytics();
        data = attendance.attendanceRateByCourse;
        title = 'Yoklama Raporu - Derse Gore Katilim Orani';
        break;
      }
      case 'meal': {
        const mealUsage = await getMealUsageAnalytics();
        data = mealUsage.dailyMealCounts;
        title = 'Yemek Kullanim Raporu - Gunluk Sayilar';
        break;
      }
      case 'event': {
        const eventAnalytics = await getEventAnalytics();
        data = eventAnalytics.events;
        title = 'Etkinlik Raporu';
        break;
      }
      default:
        throw new Error(
          'Geçersiz rapor tipi. Geçerli tipler: academic, attendance, meal, event.'
        );
    }
  
    if (!data || data.length === 0) {
      data = [{ message: 'Veri bulunamadı' }];
    }
  
    if (format === 'csv') {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
  
      return {
        buffer: Buffer.from(csv, 'utf-8'),
        contentType: 'text/csv; charset=utf-8',
        extension: 'csv'
      };
    }
  
    if (format === 'pdf') {
      const buffer = await generatePdfBuffer(title, data);
  
      return {
        buffer,
        contentType: 'application/pdf',
        extension: 'pdf'
      };
    }
  
    // Varsayılan: excel
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapor');
  
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
    return {
      buffer,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx'
    };
  }

module.exports = {
  getDashboardStats,
  getAcademicPerformance,
  getAttendanceAnalytics,
  getMealUsageAnalytics,
  getEventAnalytics,
  generateExport
};