const { Notification, Student } = require('../../../models');

async function createNotification({ userId, title, message, type, relatedEntityType = null, relatedEntityId = null }) {
  return Notification.create({
    userId,
    title,
    message,
    type,
    relatedEntityType,
    relatedEntityId
  });
}

async function getMyNotifications(userId) {
  return Notification.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']]
  });
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
  sendBulkNotification
};