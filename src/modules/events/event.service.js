'use strict';

const QRCode = require('qrcode');
const crypto = require('crypto');

const { Event, EventRegistration } = require('../../../models');

async function createEvent(data) {
  const event = await Event.create({
    title: data.title,
    description: data.description,
    eventDate: data.eventDate,
    location: data.location,
    capacity: data.capacity,
    organizerId: data.organizerId,
    status: data.status ?? 'Scheduled'
  });

  return event;
}

async function getAllEvents() {
  const events = await Event.findAll({
    order: [['eventDate', 'ASC']]
  });

  return events;
}

async function getEventById(eventId) {
  const event = await Event.findByPk(eventId);

  if (!event) {
    throw new Error('Etkinlik bulunamadı.');
  }

  return event;
}

async function registerForEvent({ studentId, eventId }) {
  const event = await Event.findByPk(eventId);

  if (!event) {
    throw new Error('Etkinlik bulunamadı.');
  }

  if (event.status !== 'Scheduled') {
    throw new Error('Bu etkinlik kayıt için uygun değil.');
  }

  const existing = await EventRegistration.findOne({
    where: {
      eventId,
      studentId,
      status: ['Registered', 'Waitlisted']
    }
  });

  if (existing) {
    throw new Error('Bu etkinliğe zaten kayıtlısınız.');
  }

  const currentCount = await EventRegistration.count({
    where: {
      eventId,
      status: 'Registered'
    }
  });

  const isFull = currentCount >= event.capacity;

  const registration = await EventRegistration.create({
    eventId,
    studentId,
    status: isFull ? 'Waitlisted' : 'Registered',
    qrUsed: false
  });

  return registration;
}

async function cancelRegistration(registrationId, studentId) {
  const registration = await EventRegistration.findOne({
    where: {
      id: registrationId,
      studentId
    }
  });

  if (!registration) {
    throw new Error('Kayıt bulunamadı.');
  }

  if (registration.status === 'Cancelled') {
    throw new Error('Bu kayıt zaten iptal edilmiş.');
  }

  const wasRegistered = registration.status === 'Registered';
  const { eventId } = registration;

  await registration.update({
    status: 'Cancelled'
  });

  let promoted = null;

  // Eğer iptal edilen kayıt aktif bir "Registered" kayıtsa, kontenjanda
  // yer açılmış demektir. Sıradaki en eski "Waitlisted" kaydı otomatik
  // olarak "Registered" durumuna terfi ettirilir.
  if (wasRegistered) {
    const nextInLine = await EventRegistration.findOne({
      where: {
        eventId,
        status: 'Waitlisted'
      },
      order: [['createdAt', 'ASC']]
    });

    if (nextInLine) {
      await nextInLine.update({
        status: 'Registered'
      });

      promoted = nextInLine;
    }
  }

  return {
    registration,
    promoted
  };
}

async function getMyRegistrations(studentId) {
  const registrations = await EventRegistration.findAll({
    where: { studentId },
    include: [{ model: Event, as: 'event' }],
    order: [['createdAt', 'DESC']]
  });

  return registrations;
}

async function generateRegistrationQr(registrationId, studentId) {
  const registration = await EventRegistration.findOne({
    where: {
      id: registrationId,
      studentId
    }
  });

  if (!registration) {
    throw new Error('Kayıt bulunamadı.');
  }

  if (registration.status !== 'Registered') {
    throw new Error('Bu kayıt aktif değil.');
  }

  if (registration.qrUsed) {
    throw new Error('Bu kaydın QR kodu daha önce kullanılmış.');
  }

  const token = crypto.randomUUID();

  const qrData = JSON.stringify({
    registrationId: registration.id,
    token
  });
  console.log("========== EVENT QR DATA ==========");
console.log(qrData);
console.log("===================================");

  const qrCode = await QRCode.toDataURL(qrData);

  await registration.update({
    qrCode
  });

  return {
    registrationId: registration.id,
    qrCode
  };
}

async function validateRegistrationQr(qrData) {
  let data;

  try {
    data = JSON.parse(qrData);
  } catch (error) {
    throw new Error('Geçersiz QR kodu.');
  }

  if (!data.registrationId || !data.token) {
    throw new Error('Geçersiz QR verisi.');
  }

  const registration = await EventRegistration.findByPk(
    data.registrationId
  );

  if (!registration) {
    throw new Error('Kayıt bulunamadı.');
  }

  if (registration.status !== 'Registered') {
    throw new Error('Bu kayıt aktif değil.');
  }

  if (registration.qrUsed) {
    throw new Error('Bu QR kod daha önce kullanılmış.');
  }

  if (!registration.qrCode) {
    throw new Error('Bu kayıt için QR kod oluşturulmamış.');
  }

  const expectedQrData = JSON.stringify({
    registrationId: registration.id,
    token: data.token
  });

  const expectedQrCode = await QRCode.toDataURL(expectedQrData);

  if (expectedQrCode !== registration.qrCode) {
    throw new Error('Geçersiz veya değiştirilmiş QR kodu.');
  }

  await registration.update({
    qrUsed: true,
    status: 'Cancelled'
  });

  return {
    success: true,
    registration
  };
}

function formatDateForICal(date) {
  return new Date(date)
    .toISOString()
    .replace(/[-:]/g, '')
    .split('.')[0] + 'Z';
}

function escapeICalText(text) {
  if (!text) return '';

  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

async function generateEventICal(eventId) {
  const event = await Event.findByPk(eventId);

  if (!event) {
    throw new Error('Etkinlik bulunamadı.');
  }

  const startDate = formatDateForICal(event.eventDate);
  const dtstamp = formatDateForICal(new Date());

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SmartCampus//Events//TR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:event-${event.id}@smartcampus`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${startDate}`,
    `SUMMARY:${escapeICalText(event.title)}`,
    `DESCRIPTION:${escapeICalText(event.description)}`,
    `LOCATION:${escapeICalText(event.location)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  return icsLines.join('\r\n');
}

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  generateRegistrationQr,
  validateRegistrationQr,
  generateEventICal
};