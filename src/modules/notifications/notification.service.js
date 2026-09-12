const { Op } = require('sequelize');
const { Notification, Student } = require('../../../models');
const { emitToUser } = require('../../socket');

async function createNotification({ userId, title, message, type, relatedEntityType = null, relatedEntityId = null }) {
  const notification = await Notification.create({
    userId,
    title,
    message,
    type,
    relatedEntityType,
    relatedEntityId
  });

  // Real-time bildirim yayını — kullanıcı o an bağlıysa anında iletilir
  emitToUser(userId, 'notification:new', notification);

  return notification;
}

async function getMyNotifications(userId, { page = 1, limit = 20, type, isRead } = {}) {
  const where = { userId };

  if (type) {
    where.type = type;
  }

  if (isRead !== undefined) {
    where.isRead = isRead === 'true' || isRead === true;
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 20);
  const offset = (pageNum - 1) * limitNum;

  const { rows, count } = await Notification.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: limitNum,
    offset
  });

  return {
    notifications: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil(count / limitNum)
    }
  };
}

async function getUnreadCount(userId) {
  const count = await Notification.count({
    where: { userId, isRead: false }
  });
  return count;
}

async function markAsRead(notificationId, userId) {
  const notification = await Notification.findOne({
    where: { id: notificationId, userId }
  });
  if (!notification) {
    const err = new Error('Bildirim bulunamadı');
    err.statusCode = 404;
    throw err;
  }
  notification.isRead = true;
  await notification.save();
  return notification;
}

async function markAllAsRead(userId) {
  await Notification.update(
    { isRead: true },
    { where: { userId, isRead: false } }
  );
  return { message: 'Tüm bildirimler okundu olarak işaretlendi' };
}

async function deleteNotification(notificationId, userId) {
  const notification = await Notification.findOne({
    where: { id: notificationId, userId }
  });

  if (!notification) {
    const err = new Error('Bildirim bulunamadı');
    err.statusCode = 404;
    throw err;
  }

  await notification.destroy();

  return { message: 'Bildirim silindi.' };
}

async function sendBulkNotification({ studentIds, title, message, type = 'General' }) {
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    const err = new Error('Öğrenci listesi boş olamaz');
    err.statusCode = 400;
    throw err;
  }

  const students = await Student.findAll({
    where: { id: studentIds }
  });

  if (students.length === 0) {
    const err = new Error('Belirtilen öğrenciler bulunamadı');
    err.statusCode = 404;
    throw err;
  }

  const notifications = await Promise.all(
    students.map((student) =>
      createNotification({
        userId: student.userId,
        title,
        message,
        type
      })
    )
  );

  return {
    message: `${notifications.length} öğrenciye bildirim gönderildi.`,
    count: notifications.length
  };
}

module.exports = {
  createNotification,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendBulkNotification
};