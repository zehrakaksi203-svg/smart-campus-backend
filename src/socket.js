'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
        origin: '*'
      }
  });

  // JWT authentication middleware — bağlantı kurulmadan önce token doğrulanır
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Token bulunamadı.'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Geçersiz token.'));
    }
  });

  io.on('connection', (socket) => {
    console.log(
      `🔌 Socket bağlandı: userId=${socket.userId}, role=${socket.userRole}`
    );

    // Kullanıcıya özel oda — bildirimleri sadece bu kullanıcıya yayınlamak için
    socket.join(`user_${socket.userId}`);

    // Faculty rolündeki kullanıcılar, real-time yoklama güncellemeleri için
    // genel bir "faculty" odasına da katılır
    if (socket.userRole === 'Faculty') {
      socket.join('faculty');
    }

    socket.on('disconnect', () => {
      console.log(`🔌 Socket ayrıldı: userId=${socket.userId}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io henüz başlatılmadı.');
  }
  return io;
}

function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, payload);
}

function emitToFaculty(event, payload) {
  if (!io) return;
  io.to('faculty').emit(event, payload);
}

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToFaculty
};