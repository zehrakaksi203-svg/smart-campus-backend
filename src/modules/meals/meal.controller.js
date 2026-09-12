'use strict';
const { Student } = require('../../../models');
const {
  generateReservationQr,
  validateReservationQr,
  createReservation,
  createMeal,
  getAllMeals,
  getMyReservations,
  cancelReservation
} = require('./meal.service');
  

  const createMealController = async (req, res) => {
    try {
      const {
        name,
        description,
        price,
        quota,
        availableDate,
        isActive
      } = req.body;
  
      if (!name || price === undefined || quota === undefined || !availableDate) {
        return res.status(400).json({
          success: false,
          message: 'name, price, quota ve availableDate alanları zorunludur.'
        });
      }
  
      const meal = await createMeal({
        name,
        description,
        price,
        quota,
        availableDate,
        isActive
      });
  
      return res.status(201).json({
        success: true,
        message: 'Yemek başarıyla oluşturuldu.',
        meal
      });
    } catch (error) {
      console.error('Yemek oluşturma hatası:', error);
  
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };


  const createMealReservation = async (req, res) => {
    try {
      const { mealId } = req.body;
  
      if (!mealId) {
        return res.status(400).json({
          success: false,
          message: 'mealId gerekli.'
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
          message: 'Giriş yapan kullanıcıya ait öğrenci kaydı bulunamadı.'
        });
      }
  
      const reservation = await createReservation({
        studentId: student.id,
        mealId
      });
  
      res.status(201).json({
        success: true,
        message: 'Yemek rezervasyonu oluşturuldu.',
        reservation
      });
  
    } catch (error) {
      console.error('Rezervasyon oluşturma hatası:', error);
  
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  
  const generateQr = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Login olan kullanıcının Student kaydını bul
      const student = await Student.findOne({
        where: {
          userId: req.user.id
        }
      });
  
      if (!student) {
        return res.status(400).json({
          success: false,
          message: 'Giriş yapan kullanıcıya ait öğrenci kaydı bulunamadı.'
        });
      }
  
      const result = await generateReservationQr(
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

    const result = await validateReservationQr(qrData);

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

const getAllMealsController = async (req, res) => {
  try {
    const meals = await getAllMeals();

    return res.status(200).json({
      success: true,
      meals
    });
  } catch (error) {
    console.error('Yemek listeleme hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getMyReservationsController = async (req, res) => {
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

    const reservations = await getMyReservations(student.id);

    return res.status(200).json({
      success: true,
      reservations
    });
  } catch (error) {
    console.error('Rezervasyonlarım listeleme hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
const cancelReservationController = async (req, res) => {
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

    const reservation = await cancelReservation(id, student.id);

    return res.status(200).json({
      success: true,
      message: 'Rezervasyon iptal edildi, ücret cüzdana iade edildi.',
      reservation
    });
  } catch (error) {
    console.error('Rezervasyon iptal hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  generateQr,
  validateQr,
  createMealReservation,
  createMealController,
  getAllMealsController,
  getMyReservationsController,
  cancelReservationController
};