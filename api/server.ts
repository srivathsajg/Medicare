/**
 * local server entry file, for local development
 */
import app from './app.js';
import { Server } from 'socket.io';
import Message from './models/Message.js';
import jwt from 'jsonwebtoken';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3005;

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    (socket as any).user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

const connectedUsers = new Map<string, string>(); // userId -> socketId

io.on('connection', (socket) => {
  const userId = (socket as any).user.id;
  connectedUsers.set(userId, socket.id);

  socket.on('sendMessage', async (data) => {
    try {
      const { receiverId, text } = data;
      const message = await Message.create({
        senderId: userId,
        receiverId,
        text
      });

      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiveMessage', message);
      }
      
      // Send back to sender for confirmation
      socket.emit('messageSent', message);
    } catch (err) {
      console.error('Socket message error:', err);
    }
  });

  socket.on('disconnect', () => {
    connectedUsers.delete(userId);
  });
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;