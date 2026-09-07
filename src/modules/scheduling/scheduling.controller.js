'use strict';

const {
  generateSchedule,
  getSchedule
} = require('./scheduling.service');

const generateScheduleController = async (req, res) => {
  try {
    const { semester } = req.body;

    if (!semester) {
      return res.status(400).json({
        success: false,
        message: 'semester alanı zorunludur.'
      });
    }

    const result = await generateSchedule(semester);

    return res.status(200).json({
      success: true,
      message: 'Program başarıyla oluşturuldu.',
      data: result
    });
  } catch (error) {
    console.error('Program oluşturma hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getScheduleController = async (req, res) => {
  try {
    const { semester } = req.query;

    const sections = await getSchedule(semester);

    return res.status(200).json({
      success: true,
      sections
    });
  } catch (error) {
    console.error('Program görüntüleme hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  generateScheduleController,
  getScheduleController
};