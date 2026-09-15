import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Uploads directory
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4().substring(0, 8)}${ext}`);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

// REST Endpoints
app.get('/api/users', (req, res) => {
  res.json(db.getUsers());
});

app.get('/api/chats', (req, res) => {
  const userId = req.query.userId || 'user_alex';
  const chats = db.getChatsForUser(userId);
  const users = db.getUsers();

  const enrichedChats = chats.map(chat => {
    if (chat.isGroup) {
      return chat;
    }
    if (chat.isSavedMessages) {
      return {
        ...chat,
        name: 'Saved Messages',
        avatar: null,
        recipient: {
          id: userId,
          name: 'Saved Messages',
          status: 'online',
          isSaved: true
        }
      };
    }
    const otherParticipantId = chat.participants.find(p => p !== userId) || chat.participants[0];
    const recipient = users.find(u => u.id === otherParticipantId);
    return {
      ...chat,
      name: recipient ? recipient.name : 'Unknown User',
      avatar: recipient ? recipient.avatar : null,
      recipient
    };
  });

  res.json(enrichedChats);
});

app.get('/api/chats/:id/messages', (req, res) => {
  const messages = db.getMessages(req.params.id);
  res.json(messages);
});

app.post('/api/chats/:id/read', (req, res) => {
  const { userId } = req.body;
  db.markMessagesRead(req.params.id, userId);
  io.to(req.params.id).emit('chat:read', { chatId: req.params.id, userId });
  res.json({ success: true });
});

app.post('/api/chats/:id/pin', (req, res) => {
  const { messageId } = req.body;
  const updatedChat = db.togglePinMessage(req.params.id, messageId);
  io.to(req.params.id).emit('chat:pinned_updated', { chatId: req.params.id, pinnedMessageIds: updatedChat.pinnedMessageIds });
  res.json({ success: true, pinnedMessageIds: updatedChat.pinnedMessageIds });
});

app.post('/api/chats/:id/disappearing', (req, res) => {
  const { seconds } = req.body;
  const chat = db.updateChat(req.params.id, { disappearingTimer: seconds });
  io.to(req.params.id).emit('chat:disappearing_updated', { chatId: req.params.id, disappearingTimer: seconds });
  res.json({ success: true, chat });
});

app.post('/api/messages/:id/react', (req, res) => {
  const { emoji, userId, chatId } = req.body;
  const updatedMsg = db.toggleReaction(req.params.id, emoji, userId);
  if (updatedMsg) {
    io.to(chatId).emit('message:reaction_updated', { messageId: req.params.id, reactions: updatedMsg.reactions });
  }
  res.json({ success: true, message: updatedMsg });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
});

// Authentication Endpoints
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, handle, phone, email, password, avatar, bio } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Display Name is required' });
    }
    if (!handle || !handle.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    const user = db.registerUser({ name, handle, phone, email, password, avatar, bio });
    io.emit('user:presence', { userId: user.id, status: 'online', lastSeen: new Date().toISOString() });
    res.status(201).json({
      success: true,
      user,
      token: `pulse_jwt_${user.id}_${Date.now()}`
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, loginId, password } = req.body;
    const identifier = loginId || username;
    if (!identifier) {
      return res.status(400).json({ error: 'Email, phone number, or username is required' });
    }
    const user = db.authenticateUser(identifier, password);
    res.json({
      success: true,
      user,
      token: `pulse_jwt_${user.id}_${Date.now()}`
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  const userId = req.query.userId;
  const user = db.getUser(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

app.put('/api/auth/profile', (req, res) => {
  try {
    const { userId, ...updates } = req.body;
    const updated = db.updateUserProfile(userId, updates);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    io.emit('user:updated', updated);
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Advanced Messaging Endpoints (Edit, Delete, Star, Polls)
app.post('/api/messages/:id/edit', (req, res) => {
  try {
    const { userId, content, chatId } = req.body;
    const updated = db.editMessage(req.params.id, userId, content);
    io.to(chatId).emit('message:edited', {
      messageId: req.params.id,
      content: updated.content,
      isEdited: true,
      editedAt: updated.editedAt
    });
    res.json({ success: true, message: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/messages/:id', (req, res) => {
  try {
    const { userId, chatId } = req.body;
    const deleted = db.deleteMessage(req.params.id, userId);
    io.to(chatId).emit('message:deleted', {
      messageId: req.params.id,
      isDeleted: true,
      content: deleted.content
    });
    res.json({ success: true, message: deleted });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/messages/:id/star', (req, res) => {
  try {
    const { userId } = req.body;
    const msg = db.toggleStarMessage(req.params.id, userId);
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/messages/starred', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  const starred = db.getStarredMessages(userId);
  res.json(starred);
});

app.post('/api/polls/:id/vote', (req, res) => {
  try {
    const { optionIndex, userId, chatId } = req.body;
    const updated = db.votePoll(req.params.id, optionIndex, userId);
    io.to(chatId).emit('poll:updated', {
      messageId: req.params.id,
      poll: updated.poll
    });
    res.json({ success: true, message: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Block & Unblock Endpoints
app.post('/api/users/:id/block', (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId is required' });
    const blockedList = db.blockUser(req.params.id, targetUserId);
    io.emit('user:blocked_updated', { userId: req.params.id, targetUserId, action: 'block', blockedUsers: blockedList });
    res.json({ success: true, blockedUsers: blockedList });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/users/:id/unblock', (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId is required' });
    const blockedList = db.unblockUser(req.params.id, targetUserId);
    io.emit('user:blocked_updated', { userId: req.params.id, targetUserId, action: 'unblock', blockedUsers: blockedList });
    res.json({ success: true, blockedUsers: blockedList });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/users/:id/blocked', (req, res) => {
  const blocked = db.getBlockedUsers(req.params.id);
  res.json(blocked);
});

// Stories / WhatsApp Status Endpoints
app.get('/api/stories', (req, res) => {
  const stories = db.getStories();
  const users = db.getUsers();
  const enriched = stories.map(s => {
    const user = users.find(u => u.id === s.userId);
    return {
      ...s,
      user: user ? { id: user.id, name: user.name, avatar: user.avatar, handle: user.handle } : null
    };
  });
  res.json(enriched);
});

app.post('/api/stories', (req, res) => {
  try {
    const { userId, type, text, background, mediaUrl, caption } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const story = db.addStory({ userId, type, text, background, mediaUrl, caption });
    const user = db.getUser(userId);
    const enriched = {
      ...story,
      user: user ? { id: user.id, name: user.name, avatar: user.avatar, handle: user.handle } : null
    };
    io.emit('story:new', enriched);
    res.status(201).json({ success: true, story: enriched });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/stories/:id', (req, res) => {
  db.deleteStory(req.params.id);
  io.emit('story:deleted', { storyId: req.params.id });
  res.json({ success: true });
});

// Group & Chat Management Endpoints
app.post('/api/chats', (req, res) => {
  try {
    const { chat } = req.body;
    if (!chat || !chat.id) return res.status(400).json({ error: 'Valid chat object required' });
    const existing = db.getChat(chat.id);
    if (existing) return res.json({ success: true, chat: existing });
    const created = db.createChat(chat);
    io.emit('chat:new', created);
    res.status(201).json({ success: true, chat: created });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/chats/:id/group', (req, res) => {
  try {
    const { name, description, avatar } = req.body;
    const updated = db.updateGroup(req.params.id, { name, description, avatar });
    io.to(req.params.id).emit('chat:group_updated', updated);
    io.emit('chat:updated', updated);
    res.json({ success: true, chat: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/chats/:id/group/participants', (req, res) => {
  try {
    const { userId, action } = req.body;
    let updated;
    if (action === 'add') {
      updated = db.addGroupParticipant(req.params.id, userId);
    } else {
      updated = db.removeGroupParticipant(req.params.id, userId);
    }
    io.to(req.params.id).emit('chat:group_updated', updated);
    io.emit('chat:updated', updated);
    res.json({ success: true, chat: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/chats/:id/group/admin', (req, res) => {
  try {
    const { userId, isAdmin } = req.body;
    const updated = db.setGroupAdmin(req.params.id, userId, isAdmin);
    io.to(req.params.id).emit('chat:group_updated', updated);
    io.emit('chat:updated', updated);
    res.json({ success: true, chat: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Bot auto-reply generator
function handleBotReply(chatId, userMessage) {
  const prompt = userMessage.toLowerCase();
  let botReply = '';

  if (prompt.includes('hello') || prompt.includes('hi') || prompt.includes('hey')) {
    botReply = 'Hello there! 👋 I am Nova, your real-time Pulse assistant. How can I help you test out the app today?';
  } else if (prompt.includes('call') || prompt.includes('ring')) {
    botReply = 'You can click the 📞 Phone or 📹 Video camera icons at the top right of this chat to test out audio/video calling simulation!';
  } else if (prompt.includes('e2ee') || prompt.includes('encrypt') || prompt.includes('security') || prompt.includes('privacy')) {
    botReply = '🔒 PulseChat employs Signal-protocol style End-to-End Encryption. Click the lock shield icon in the chat header to view and verify your mutual 60-digit Safety Number!';
  } else if (prompt.includes('voice') || prompt.includes('audio') || prompt.includes('mic')) {
    botReply = '🎙️ Tap or hold the microphone button at the bottom right to record an interactive voice note! You can adjust playback speed from 1x to 1.5x and 2x.';
  } else if (prompt.includes('pwa') || prompt.includes('install') || prompt.includes('mobile')) {
    botReply = '📱 PulseChat is a full Progressive Web App! Click the "Install App" button in the sidebar or install from your browser menu to enjoy native app behavior on desktop and mobile.';
  } else if (prompt.includes('theme') || prompt.includes('dark')) {
    botReply = '🌗 Click the sun/moon toggle in the sidebar header to switch between Dark and Light mode, or let it sync with your system preference!';
  } else {
    const responses = [
      `I received your note: "${userMessage}". The WebSocket latency is 18ms and delivery confirmation was acknowledged! ⚡`,
      `That sounds great! Feel free to test reactions (hover a bubble), quote replies, or send media attachments. 🚀`,
      `Nova Copilot active! Every message in this chat is protected with cryptographic verification and stored locally. 🔐`,
      `Did you try opening another browser tab as "Elena" or "Sarah"? You can watch real-time typing indicators and live read receipts in action! ✨`
    ];
    botReply = responses[Math.floor(Math.random() * responses.length)];
  }

  // Simulate typing indicator
  setTimeout(() => {
    io.to(chatId).emit('typing:status', { chatId, userId: 'user_bot', isTyping: true });
  }, 400);

  setTimeout(() => {
    io.to(chatId).emit('typing:status', { chatId, userId: 'user_bot', isTyping: false });

    const replyMsg = {
      id: `msg_${Date.now()}_${uuidv4().substring(0, 6)}`,
      chatId,
      senderId: 'user_bot',
      content: botReply,
      type: 'text',
      timestamp: new Date().toISOString(),
      status: 'read',
      reactions: {}
    };

    db.addMessage(replyMsg);
    io.to(chatId).emit('message:new', replyMsg);
  }, 1600);
}

// Socket.IO real-time connection mapping
const userSockets = new Map(); // userId -> Set of socket IDs

io.on('connection', (socket) => {
  let currentUserId = null;

  socket.on('user:join', (userId) => {
    currentUserId = userId;
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    db.updateUserStatus(userId, 'online');
    io.emit('user:presence', { userId, status: 'online', lastSeen: new Date().toISOString() });
  });

  socket.on('chat:join', (chatId) => {
    socket.join(chatId);
  });

  socket.on('chat:leave', (chatId) => {
    socket.leave(chatId);
  });

  socket.on('typing:start', ({ chatId, userId }) => {
    socket.to(chatId).emit('typing:status', { chatId, userId, isTyping: true });
  });

  socket.on('typing:stop', ({ chatId, userId }) => {
    socket.to(chatId).emit('typing:status', { chatId, userId, isTyping: false });
  });

  socket.on('message:send', (messageData) => {
    const chat = db.getChat(messageData.chatId);
    if (chat && !chat.isGroup && !chat.isSavedMessages) {
      const otherParticipant = chat.participants.find(p => p !== messageData.senderId);
      if (otherParticipant && db.isBlocked(messageData.senderId, otherParticipant)) {
        socket.emit('message:error', { error: 'Message could not be delivered: Contact is blocked' });
        return;
      }
    }

    const message = {
      id: messageData.id || `msg_${Date.now()}_${uuidv4().substring(0, 6)}`,
      chatId: messageData.chatId,
      senderId: messageData.senderId,
      content: messageData.content || '',
      type: messageData.type || 'text',
      mediaUrl: messageData.mediaUrl || null,
      mediaName: messageData.mediaName || null,
      mediaSize: messageData.mediaSize || null,
      audioDuration: messageData.audioDuration || null,
      audioWaveform: messageData.audioWaveform || null,
      replyTo: messageData.replyTo || null,
      poll: messageData.poll || null,
      location: messageData.location || null,
      stickerUrl: messageData.stickerUrl || null,
      forwardedFrom: messageData.forwardedFrom || null,
      timestamp: messageData.timestamp || new Date().toISOString(),
      status: 'delivered',
      reactions: {},
      starredBy: []
    };

    db.addMessage(message);

    // Broadcast to chat room
    io.to(message.chatId).emit('message:new', message);

    // If recipient is Nova AI Bot, or message mentions bot in group
    if (chat) {
      if (chat.participants.includes('user_bot') && message.senderId !== 'user_bot') {
        handleBotReply(message.chatId, message.content);
      }
    }
  });

  socket.on('message:edit', ({ chatId, messageId, userId, content }) => {
    try {
      const updated = db.editMessage(messageId, userId, content);
      io.to(chatId).emit('message:edited', {
        messageId,
        content: updated.content,
        isEdited: true,
        editedAt: updated.editedAt
      });
    } catch (e) {
      console.warn('Socket message:edit error', e);
    }
  });

  socket.on('message:delete', ({ chatId, messageId, userId }) => {
    try {
      const deleted = db.deleteMessage(messageId, userId);
      io.to(chatId).emit('message:deleted', {
        messageId,
        isDeleted: true,
        content: deleted.content
      });
    } catch (e) {
      console.warn('Socket message:delete error', e);
    }
  });

  socket.on('poll:vote', ({ chatId, messageId, optionIndex, userId }) => {
    try {
      const updated = db.votePoll(messageId, optionIndex, userId);
      io.to(chatId).emit('poll:updated', {
        messageId,
        poll: updated.poll
      });
    } catch (e) {
      console.warn('Socket poll:vote error', e);
    }
  });

  socket.on('message:react', ({ chatId, messageId, emoji, userId }) => {
    const updated = db.toggleReaction(messageId, emoji, userId);
    if (updated) {
      io.to(chatId).emit('message:reaction_updated', { messageId, reactions: updated.reactions });
    }
  });

  socket.on('chat:mark_read', ({ chatId, userId }) => {
    db.markMessagesRead(chatId, userId);
    io.to(chatId).emit('chat:read', { chatId, userId });
  });

  // Voice/Video Call Signaling Simulation
  socket.on('call:initiate', ({ chatId, caller, recipientId, isVideo }) => {
    if (recipientId && caller?.id && db.isBlocked(caller.id, recipientId)) {
      socket.emit('call:blocked', { error: 'Call could not be completed: Contact is blocked' });
      return;
    }

    io.emit('call:incoming', {
      callId: `call_${Date.now()}`,
      chatId,
      caller,
      recipientId,
      isVideo
    });
  });

  socket.on('call:signal', (signalData) => {
    io.emit('call:signaled', signalData);
  });

  socket.on('call:answer', (answerData) => {
    io.emit('call:answered', answerData);
  });

  socket.on('call:end', ({ callId, chatId }) => {
    io.emit('call:ended', { callId, chatId });
  });

  socket.on('disconnect', () => {
    if (currentUserId && userSockets.has(currentUserId)) {
      const socketSet = userSockets.get(currentUserId);
      socketSet.delete(socket.id);
      if (socketSet.size === 0) {
        userSockets.delete(currentUserId);
        db.updateUserStatus(currentUserId, 'offline');
        io.emit('user:presence', { userId: currentUserId, status: 'offline', lastSeen: new Date().toISOString() });
      }
    }
  });
});

// Serve compiled frontend assets in production
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`🚀 PulseChat Server running on http://localhost:${PORT}`);
});
