const notificationService = require('./notification.service');

async function getMyNotifications(req, res, next) {
  try {
    const { page, limit, type, isRead } = req.query;

    const result = await notificationService.getMyNotifications(req.user.id, {
      page,
      limit,
      type,
      isRead
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    res.json(notification);
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const result = await notificationService.deleteNotification(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function sendBulkNotification(req, res, next) {
  try {
    const { studentIds, title, message, type } = req.body;
    const result = await notificationService.sendBulkNotification({
      studentIds,
      title,
      message,
      type
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendBulkNotification
};