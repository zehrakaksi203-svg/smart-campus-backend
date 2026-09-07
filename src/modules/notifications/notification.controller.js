const notificationService = require('./notification.service');

async function getMyNotifications(req, res, next) {
  try {
    const notifications = await notificationService.getMyNotifications(req.user.id);
    res.json(notifications);
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
  sendBulkNotification
};