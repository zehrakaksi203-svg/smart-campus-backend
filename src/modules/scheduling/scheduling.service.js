'use strict';

const { CourseSection, Classroom, Enrollment, Student, Faculty, Course } = require('../../../models');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  { startTime: '09:00:00', endTime: '10:30:00' },
  { startTime: '10:45:00', endTime: '12:15:00' },
  { startTime: '13:00:00', endTime: '14:30:00' },
  { startTime: '14:45:00', endTime: '16:15:00' },
  { startTime: '16:30:00', endTime: '18:00:00' }
];

function buildSlots() {
  const slots = [];

  for (const day of DAYS) {
    for (const timeSlot of TIME_SLOTS) {
      slots.push({
        dayOfWeek: day,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime
      });
    }
  }

  return slots;
}

function slotKey(slot) {
  return `${slot.dayOfWeek}_${slot.startTime}`;
}

function classroomLabel(classroom) {
  return `${classroom.building} - ${classroom.roomNumber}`;
}

// Backtracking CSP: her section'a bir (slot, classroom) çifti ata
function backtrack(sections, index, classrooms, slots, assignment, facultyBusy, classroomBusy) {
  if (index === sections.length) {
    return assignment;
  }

  const section = sections[index];

  const suitableClassrooms = classrooms.filter(
    (c) => c.capacity >= section.capacity
  );

  for (const slot of slots) {
    const key = slotKey(slot);

    // Aynı öğretim üyesi bu slotta meşgul mü?
    if (facultyBusy[section.facultyId]?.has(key)) {
      continue;
    }

    for (const classroom of suitableClassrooms) {
      const classroomKey = `${classroom.id}_${key}`;

      // Bu sınıf bu slotta meşgul mü?
      if (classroomBusy.has(classroomKey)) {
        continue;
      }

      // Ata
      assignment[section.id] = {
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        classroom: classroomLabel(classroom)
      };

      if (!facultyBusy[section.facultyId]) {
        facultyBusy[section.facultyId] = new Set();
      }
      facultyBusy[section.facultyId].add(key);
      classroomBusy.add(classroomKey);

      const result = backtrack(
        sections,
        index + 1,
        classrooms,
        slots,
        assignment,
        facultyBusy,
        classroomBusy
      );

      if (result) {
        return result;
      }

      // Geri al (backtrack)
      delete assignment[section.id];
      facultyBusy[section.facultyId].delete(key);
      classroomBusy.delete(classroomKey);
    }
  }

  return null;
}
async function generateSchedule(semester, departmentId) {
  const where = { semester, isActive: true };

  const include = [];
  if (departmentId) {
    include.push({
      model: Course,
      as: 'course',
      where: { departmentId },
      attributes: []
    });
  }

  const sections = await CourseSection.findAll({
    where,
    include,
    order: [['capacity', 'DESC']]
  });

  if (sections.length === 0) {
    throw new Error('Bu dönem/bölüm için ders şubesi bulunamadı.');
  }

  // ... (geri kalanı aynı)
}
async function getSchedule(semester, departmentId) {
  const where = semester ? { semester, isActive: true } : { isActive: true };

  const courseInclude = { model: Course, as: 'course' };
  if (departmentId) {
    courseInclude.where = { departmentId };
  }

  const sections = await CourseSection.findAll({
    where,
    include: [
      courseInclude,
      { model: Faculty, as: 'faculty' }
    ],
    order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']]
  });

  return sections;
}


async function generateSchedule(semester) {
  const sections = await CourseSection.findAll({
    where: { semester, isActive: true },
    order: [['capacity', 'DESC']]
  });

  if (sections.length === 0) {
    throw new Error('Bu dönem için ders şubesi bulunamadı.');
  }

  const classrooms = await Classroom.findAll();

  if (classrooms.length === 0) {
    throw new Error('Sistemde tanımlı sınıf bulunamadı.');
  }

  const slots = buildSlots();

  const assignment = backtrack(
    sections,
    0,
    classrooms,
    slots,
    {},
    {},
    new Set()
  );

  if (!assignment) {
    throw new Error(
      'Çakışmasız bir program oluşturulamadı. Sınıf/zaman kapasitesi yetersiz olabilir.'
    );
  }

  // Sonuçları veritabanına yaz
  for (const section of sections) {
    const result = assignment[section.id];

    await section.update({
      dayOfWeek: result.dayOfWeek,
      startTime: result.startTime,
      endTime: result.endTime,
      classroom: result.classroom
    });
  }

  return {
    semester,
    scheduledCount: sections.length,
    sections: sections.map((s) => ({
      id: s.id,
      sectionCode: s.sectionCode,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      classroom: s.classroom
    }))
  };
}

async function getSchedule(semester) {
  const where = semester ? { semester, isActive: true } : { isActive: true };

  const sections = await CourseSection.findAll({
    where,
    include: [
      { model: require('../../../models').Course, as: 'course' },
      { model: require('../../../models').Faculty, as: 'faculty' }
    ],
    order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']]
  });

  return sections;
}
// Öğrenci veya öğretim üyesinin kişisel haftalık programını getirir
async function getMySchedule(userId, role) {
  let sections = [];

  if (role === 'Student') {
    const student = await Student.findOne({ where: { userId } });
    if (!student) {
      throw new Error('Öğrenci kaydı bulunamadı.');
    }

    const enrollments = await Enrollment.findAll({
      where: { studentId: student.id, status: 'Active' },
      include: [
        {
          model: CourseSection,
          as: 'section',
          include: [
            { model: Course, as: 'course' },
            { model: Faculty, as: 'faculty' }
          ]
        }
      ]
    });

    sections = enrollments
      .map((e) => e.section)
      .filter((s) => s && s.dayOfWeek);

  } else if (role === 'Faculty') {
    const faculty = await Faculty.findOne({ where: { userId } });
    if (!faculty) {
      throw new Error('Öğretim üyesi kaydı bulunamadı.');
    }

    sections = await CourseSection.findAll({
      where: { facultyId: faculty.id },
      include: [
        { model: Course, as: 'course' },
        { model: Faculty, as: 'faculty' }
      ]
    });

    sections = sections.filter((s) => s.dayOfWeek);

  } else {
    throw new Error('Bu rol için kişisel program desteklenmiyor.');
  }

  return sections;
}

const DAY_TO_ICAL = {
  Monday: 'MO',
  Tuesday: 'TU',
  Wednesday: 'WE',
  Thursday: 'TH',
  Friday: 'FR',
  Saturday: 'SA',
  Sunday: 'SU'
};

// Verilen "HH:mm:ss" ve gün adını, önümüzdeki en yakın o güne denk gelen
// bir Date objesine çevirir (iCal DTSTART için).
function nextDateForDay(dayOfWeek) {
  const dayIndex = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }[dayOfWeek];
  const today = new Date();
  const result = new Date(today);
  const diff = (dayIndex - today.getDay() + 7) % 7;
  result.setDate(today.getDate() + diff);
  return result;
}

function formatIcalDateTime(date, timeStr) {
  const [h, m, s] = timeStr.split(':');
  const d = new Date(date);
  d.setHours(Number(h), Number(m), Number(s || 0), 0);

  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// Kişisel programı .ics (iCalendar) formatında string olarak üretir
async function exportMyScheduleIcal(userId, role) {
  const sections = await getMySchedule(userId, role);

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SmartCampus//Scheduling//TR',
    'CALSCALE:GREGORIAN'
  ];

  for (const section of sections) {
    const eventDate = nextDateForDay(section.dayOfWeek);
    const dtstart = formatIcalDateTime(eventDate, section.startTime);
    const dtend = formatIcalDateTime(eventDate, section.endTime);
    const byday = DAY_TO_ICAL[section.dayOfWeek] || 'MO';

    const summary = section.course
      ? `${section.course.courseCode} - ${section.course.courseName}`
      : `Section #${section.id}`;

    const location = section.classroom || '';
    const instructor = section.faculty?.fullName || '';

    ics.push(
      'BEGIN:VEVENT',
      `UID:section-${section.id}@smartcampus`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${byday}`,
      `SUMMARY:${summary}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${instructor}`,
      'END:VEVENT'
    );
  }

  ics.push('END:VCALENDAR');

  return ics.join('\r\n');
}

module.exports = {
  generateSchedule,
  getSchedule,
  getMySchedule,
  exportMyScheduleIcal,
  backtrack,
  buildSlots
};
