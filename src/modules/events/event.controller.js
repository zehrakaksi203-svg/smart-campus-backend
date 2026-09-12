'use strict';

const { Student, Faculty } = require('../../../models');

const {
  createEvent,
  getAllEvents,
  getEventById,
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  generateRegistrationQr,
  validateRegistrationQr,
  generateEventICal
} = require('./event.service');

const createEventController = async (req, res) => {
  try {
    const {
      title,
      description,
      eventDate,
      location,
      capacity,
      status
    } = req.body;

    if (!title || !eventDate || !location || capacity === undefined) {
      return res.status(400).json({
        success: false,
        message:
          'title, eventDate, location ve capacity alanları zorunludur.'
      });
    }

    if (Number.isNaN(Number(capacity)) || Number(capacity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'capacity pozitif bir sayı olmalıdır.'
      });
    }

    let organizerId = null;

    // Öğretim üyesi etkinlik oluşturabilir
    if (req.user.role === 'Faculty') {
      const faculty = await Faculty.findOne({
        where: {
          userId: req.user.id
        }
      });

      if (!faculty) {
        return res.status(400).json({
          success: false,
          message:
            'Giriş yapan kullanıcıya ait öğretim üyesi kaydı bulunamadı.'
        });
      }

      organizerId = faculty.id;
    }

    // Admin de etkinlik oluşturabilir
    else if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Etkinlik oluşturma yetkiniz yok.'
      });
    }

    const event = await createEvent({
      title,
      description,
      eventDate,
      location,
      capacity: Number(capacity),
      organizerId,
      status
    });

    return res.status(201).json({
      success: true,
      message: 'Etkinlik başarıyla oluşturuldu.',
      event
    });
  } catch (error) {
    console.error('Etkinlik oluşturma hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getAllEventsController = async (req, res) => {
  try {
    const events = await getAllEvents();

    return res.status(200).json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Etkinlik listeleme hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getEventByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await getEventById(id);

    return res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Etkinlik getirme hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const registerForEventController = async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'eventId gerekli.'
      });
    }

    const student = await Student.findOne({
      where: {
        userId: req.user.id
      }
    });

    if (!student) {
      return res.status(400).json({
        success: false,
        message:
          'Giriş yapan kullanıcıya ait öğrenci kaydı bulunamadı.'
      });
    }

    const registration = await registerForEvent({
      studentId: student.id,
      eventId
    });

    const message =
      registration.status === 'Waitlisted'
        ? 'Etkinlik kontenjanı dolu olduğu için bekleme listesine eklendiniz.'
        : 'Etkinliğe kayıt oluşturuldu.';

    return res.status(201).json({
      success: true,
      message,
      registration
    });
  } catch (error) {
    console.error('Etkinlik kayıt hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const cancelRegistrationController = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findOne({
      where: {
        userId: req.user.id
      }
    });

    if (!student) {
      return res.status(400).json({
        success: false,
        message:
          'Giriş yapan kullanıcıya ait öğrenci kaydı bulunamadı.'
      });
    }

    const result = await cancelRegistration(id, student.id);

    return res.status(200).json({
      success: true,
      message: result.promoted
        ? 'Kayıt iptal edildi. Bekleme listesindeki bir öğrenci otomatik olarak kayıtlı duruma alındı.'
        : 'Kayıt iptal edildi.',
      registration: result.registration,
      promoted: result.promoted
    });
  } catch (error) {
    console.error('Etkinlik kaydı iptal hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getMyRegistrationsController = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: {
        userId: req.user.id
      }
    });

    if (!student) {
      return res.status(400).json({
        success: false,
        message:
          'Giriş yapan kullanıcıya ait öğrenci kaydı bulunamadı.'
      });
    }

    const registrations = await getMyRegistrations(student.id);

    return res.status(200).json({
      success: true,
      registrations
    });
  } catch (error) {
    console.error('Kayıtlarım listeleme hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const generateQr = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findOne({
      where: {
        userId: req.user.id
      }
    });

    if (!student) {
      return res.status(400).json({
        success: false,
        message:
          'Giriş yapan kullanıcıya ait öğrenci kaydı bulunamadı.'
      });
    }

    const result = await generateRegistrationQr(
      id,
      student.id
    );

    return res.status(200).json({
      success: true,
      message: 'QR kod başarıyla oluşturuldu.',
      data: result
    });
  } catch (error) {
    console.error('QR oluşturma hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const validateQr = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'qrData alanı zorunludur.'
      });
    }

    const result = await validateRegistrationQr(qrData);

    return res.status(200).json({
      success: true,
      message: 'QR kod başarıyla doğrulandı.',
      data: result
    });
  } catch (error) {
    console.error('QR doğrulama hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const exportEventICalController = async (req, res) => {
  try {
    const { id } = req.params;

    const icsContent = await generateEventICal(id);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="event-${id}.ics"`
    );

    return res.status(200).send(icsContent);
  } catch (error) {
    console.error('iCal dışa aktarma hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createEventController,
  getAllEventsController,
  getEventByIdController,
  registerForEventController,
  cancelRegistrationController,
  getMyRegistrationsController,
  generateQr,
  validateQr,
  exportEventICalController
};