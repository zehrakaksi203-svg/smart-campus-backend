'use strict';

const { CourseSection, Classroom } = require('../../../models');

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

module.exports = {
  generateSchedule,
  getSchedule,
  backtrack,
  buildSlots
};