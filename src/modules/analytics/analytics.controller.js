
'use strict';

const {
  getDashboardStats,
  getAcademicPerformance,
  getAttendanceAnalytics,
  getMealUsageAnalytics,
  getEventAnalytics,
  generateExport
} = require('./analytics.service');

const getDashboardController = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok.'
      });
    }

    const stats = await getDashboardStats();

    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Dashboard istatistik hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getAcademicPerformanceController = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok.'
      });
    }

    const performance = await getAcademicPerformance();

    return res.status(200).json({
      success: true,
      performance
    });
  } catch (error) {
    console.error('Akademik performans istatistik hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getAttendanceAnalyticsController = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok.'
      });
    }

    const analytics = await getAttendanceAnalytics();

    return res.status(200).json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Yoklama analitik hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getMealUsageAnalyticsController = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok.'
      });
    }

    const analytics = await getMealUsageAnalytics();

    return res.status(200).json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Yemek kullanım analitik hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getEventAnalyticsController = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok.'
      });
    }

    const analytics = await getEventAnalytics();

    return res.status(200).json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Etkinlik analitik hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ANALYTICS EXPORT
const exportAnalyticsController = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok.'
      });
    }

    const { type } = req.params;

    const format = (req.query.format || 'excel').toLowerCase();

    const allowedTypes = ['academic', 'attendance', 'meal', 'event'];
    const allowedFormats = ['excel', 'pdf', 'csv'];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message:
          'Geçersiz rapor tipi. Geçerli tipler: academic, attendance, meal, event.'
      });
    }

    if (!allowedFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        message:
          'Geçersiz format. Geçerli formatlar: excel, pdf, csv.'
      });
    }

    const result = await generateExport(type, format);

    res.setHeader('Content-Type', result.contentType);

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="analytics-${type}.${result.extension}"`
    );

    return res.status(200).send(result.buffer);
  } catch (error) {
    console.error('Analytics export hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getDashboardController,
  getAcademicPerformanceController,
  getAttendanceAnalyticsController,
  getMealUsageAnalyticsController,
  getEventAnalyticsController,
  exportAnalyticsController
};

