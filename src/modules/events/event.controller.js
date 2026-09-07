'use strict';
const { Student, Faculty } = require('../../../models');
const {
  createEvent,
  getAllEvents,
  getEventById,
  registerForEvent,
  getMyRegistrations,
  generateRegistrationQr,
  validateRegistrationQr
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
        message: 'title, eventDate, location ve capacity alanları zorunludur.'
      });
    }
    let organizerId = null;

    if (req.user.role === 'Faculty') {
      const faculty = await Faculty.findOne({
        where: { userId: req.user.id }
      });

      if (!faculty) {
        return res.status(400).json({
          success: false,
          message: 'Giriş yapan kullanıcıya ait öğretim üyesi kaydı bulunamadı.'
        });
      }

      organizerId = faculty.id;
    } else if (req.user.role !== 'Admin') {
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
      capacity,
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
      where: { userId: req.user.id }
    });

    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Giriş yapan kullanıcıya ait öğrenci kaydı bulunamadı.'
      });
    }

    const registration = await registerForEvent({
      studentId: student.id,
      eventId
    });

    return res.status(201).json({
      success: true,
      message: 'Etkinliğe kayıt oluşturuldu.',
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

const getMyRegistrationsController = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { userId: req.user.id }
    });

    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Giriş yapan kullanıcıya ait öğrenci kaydı bulunamadı.'
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
      where: { userId: req.user.id }
    });

    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Giriş yapan kullanıcıya ait öğrenci kaydı bulunamadı.'
      });
    }

    const result = await generateRegistrationQr(id, student.id);

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

module.exports = {
  createEventController,
  getAllEventsController,
  getEventByIdController,
  registerForEventController,
  getMyRegistrationsController,
  generateQr,
  validateQr
};