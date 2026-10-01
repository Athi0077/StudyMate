const Notification = require("../models/Notification");
const { getIo } = require("../utils/socket");

const createNotification = async ({
  recipientId,
  senderId,
  type,
  title,
  message,
  relatedId,
  relatedModel
}) => {
  try {
    const notification = await Notification.create({
      recipientId,
      senderId,
      type,
      title,
      message,
      relatedId,
      relatedModel
    });

    const io = getIo();
    io.to(`user:${recipientId}`).emit("notification:new", notification);

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

module.exports = { createNotification };
