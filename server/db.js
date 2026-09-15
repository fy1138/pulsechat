import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed data
const initialData = {
  users: [
    {
      id: 'user_alex',
      name: 'Alex Rivers',
      handle: '@alexrivers',
      email: 'alex@pulsechat.io',
      phone: '+1 (555) 019-2834',
      password: 'password123',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Product engineer & open web advocate 🚀',
      status: 'online',
      lastSeen: new Date().toISOString(),
      safetyNumber: '38492 84729 19284 75620 18274 95820 48201 94820 19482 74629 10482 92048'
    },
    {
      id: 'user_elena',
      name: 'Elena Rostova',
      handle: '@elena_dev',
      email: 'elena@pulsechat.io',
      phone: '+1 (555) 438-9102',
      password: 'password123',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      bio: 'Distributed systems & cryptography 🔐',
      status: 'online',
      lastSeen: new Date().toISOString(),
      safetyNumber: '75839 10482 92048 38492 84729 19284 75620 18274 95820 48201 94820 19482'
    },
    {
      id: 'user_sarah',
      name: 'Sarah Chen',
      handle: '@sarahchen',
      email: 'sarah@pulsechat.io',
      phone: '+1 (555) 782-3401',
      password: 'password123',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      bio: 'Design lead @ Pulse. Building intuitive interfaces ✨',
      status: 'online',
      lastSeen: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      safetyNumber: '19482 74629 10482 92048 38492 84729 19284 75620 18274 95820 48201 94820'
    },
    {
      id: 'user_marcus',
      name: 'Marcus Vance',
      handle: '@marcus_v',
      email: 'marcus@pulsechat.io',
      phone: '+1 (555) 304-8592',
      password: 'password123',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Mobile architect. Audio & video streaming geek 🎙️',
      status: 'offline',
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      safetyNumber: '95820 48201 94820 19482 74629 10482 92048 38492 84729 19284 75620 18274'
    },
    {
      id: 'user_bot',
      name: 'Nova AI Assistant',
      handle: '@nova_pulse',
      email: 'nova@pulsechat.io',
      phone: '+1 (555) 000-0000',
      password: 'password123',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      bio: 'PulseChat intelligent copilot. Real-time assistant ready for queries ⚡',
      status: 'online',
      lastSeen: new Date().toISOString(),
      isBot: true,
      safetyNumber: '00000 11111 22222 33333 44444 55555 66666 77777 88888 99999 12345 67890'
    }
  ],
  chats: [
    {
      id: 'chat_group_pulse',
      name: '🚀 Pulse Core Team',
      isGroup: true,
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      description: 'Official core team channel for real-time app architecture, launches & design updates.',
      participants: ['user_alex', 'user_elena', 'user_sarah', 'user_marcus'],
      pinnedMessageIds: ['msg_pinned_1'],
      disappearingTimer: null,
      isEncrypted: true,
      unreadCount: { user_alex: 0, user_elena: 0, user_sarah: 1, user_marcus: 2 },
      updatedAt: new Date().toISOString()
    },
    {
      id: 'chat_elena',
      isGroup: false,
      participants: ['user_alex', 'user_elena'],
      pinnedMessageIds: ['msg_elena_2'],
      disappearingTimer: null,
      isEncrypted: true,
      unreadCount: { user_alex: 0, user_elena: 0 },
      updatedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString()
    },
    {
      id: 'chat_sarah',
      isGroup: false,
      participants: ['user_alex', 'user_sarah'],
      pinnedMessageIds: [],
      disappearingTimer: 86400, // 24 hours
      isEncrypted: true,
      unreadCount: { user_alex: 0, user_sarah: 0 },
      updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      id: 'chat_marcus',
      isGroup: false,
      participants: ['user_alex', 'user_marcus'],
      pinnedMessageIds: [],
      disappearingTimer: null,
      isEncrypted: true,
      unreadCount: { user_alex: 0, user_marcus: 0 },
      updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString()
    },
    {
      id: 'chat_bot',
      isGroup: false,
      participants: ['user_alex', 'user_bot'],
      pinnedMessageIds: [],
      disappearingTimer: null,
      isEncrypted: true,
      unreadCount: { user_alex: 0, user_bot: 0 },
      updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
    },
    {
      id: 'chat_saved_alex',
      isGroup: false,
      isSavedMessages: true,
      ownerId: 'user_alex',
      participants: ['user_alex'],
      pinnedMessageIds: [],
      disappearingTimer: null,
      isEncrypted: true,
      unreadCount: { user_alex: 0 },
      updatedAt: new Date(Date.now() - 1000 * 60 * 500).toISOString()
    }
  ],
  blockedUsers: {},
  stories: [
    {
      id: 'story_elena_1',
      userId: 'user_elena',
      type: 'text',
      text: 'Deploying the new encrypted protocol v2.4 🔐 Zero-knowledge proofs looking solid!',
      background: 'linear-gradient(135deg, #059669, #10b981)',
      caption: 'Protocol Update',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 21).toISOString()
    },
    {
      id: 'story_sarah_1',
      userId: 'user_sarah',
      type: 'photo',
      mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      caption: 'Finalizing the new glassmorphic dark mode tokens ✨ What do you think?',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 19).toISOString()
    },
    {
      id: 'story_marcus_1',
      userId: 'user_marcus',
      type: 'text',
      text: 'Audio stream latency down to 24ms across WebRTC 🎧⚡ Super crisp fidelity!',
      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      caption: 'Audio Lab Testing',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 23).toISOString()
    }
  ],
  messages: [
    // Pulse Core Team Group Messages
    {
      id: 'msg_pinned_1',
      chatId: 'chat_group_pulse',
      senderId: 'user_alex',
      content: '📌 Welcome team! PulseChat v1.0 release candidate is live. Please test real-time presence, voice notes, and PWA installation.',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      status: 'read',
      reactions: { '🔥': ['user_elena', 'user_sarah', 'user_marcus'], '🚀': ['user_alex', 'user_sarah'] }
    },
    {
      id: 'msg_team_2',
      chatId: 'chat_group_pulse',
      senderId: 'user_elena',
      content: 'The end-to-end encryption handshake and WebSocket reconnect latency are under 25ms! Silky smooth.',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      status: 'read',
      reactions: { '👏': ['user_alex', 'user_marcus'] }
    },
    {
      id: 'msg_team_3',
      chatId: 'chat_group_pulse',
      senderId: 'user_sarah',
      content: 'Check out the new dark mode theme contrast and Telegram-style wallpaper doodles. Tested on both iPhone Safari and Android Chrome PWA.',
      type: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      mediaName: 'pulse_mockup_preview.png',
      mediaSize: '1.2 MB',
      timestamp: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
      status: 'read',
      reactions: { '❤️': ['user_alex', 'user_elena'] }
    },
    {
      id: 'msg_team_4',
      chatId: 'chat_group_pulse',
      senderId: 'user_marcus',
      content: 'Recorded a quick audio note reviewing the waveform visualizer:',
      type: 'audio',
      audioDuration: 14,
      audioWaveform: [20, 35, 60, 45, 80, 95, 70, 50, 85, 100, 60, 40, 75, 90, 65, 30, 45, 80, 50, 25],
      timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      status: 'read',
      reactions: { '🎙️': ['user_alex'] }
    },
    {
      id: 'msg_team_5',
      chatId: 'chat_group_pulse',
      senderId: 'user_alex',
      replyTo: {
        id: 'msg_team_4',
        senderName: 'Marcus Vance',
        content: 'Recorded a quick audio note reviewing the waveform visualizer:'
      },
      content: 'Sounds crisp! Web Audio API synthesizer is working seamlessly.',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      status: 'read',
      reactions: {}
    },

    // Elena Direct Chat Messages
    {
      id: 'msg_elena_1',
      chatId: 'chat_elena',
      senderId: 'user_elena',
      content: 'Hey Alex! Did you get a chance to review the Signal Safety Number fingerprint algorithm?',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      status: 'read',
      reactions: { '👍': ['user_alex'] }
    },
    {
      id: 'msg_elena_2',
      chatId: 'chat_elena',
      senderId: 'user_alex',
      content: '📌 Yes, verified! 60-digit numeric block matches perfectly with our mutual keys.',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      status: 'read',
      reactions: { '🔐': ['user_elena'] }
    },
    {
      id: 'msg_elena_3',
      chatId: 'chat_elena',
      senderId: 'user_elena',
      content: 'Awesome. Sending over the updated cryptography specs file:',
      type: 'file',
      mediaName: 'E2EE_Protocol_Specification_v2.pdf',
      mediaSize: '2.4 MB',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      status: 'read',
      reactions: {}
    },
    {
      id: 'msg_elena_4',
      chatId: 'chat_elena',
      senderId: 'user_elena',
      content: 'Here is a quick voice note about the key exchange flow:',
      type: 'audio',
      audioDuration: 9,
      audioWaveform: [30, 50, 70, 90, 85, 60, 40, 65, 80, 95, 75, 55, 35, 60, 80, 40],
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      status: 'read',
      reactions: { '❤️': ['user_alex'] }
    },

    // Sarah Direct Chat (Disappearing messages)
    {
      id: 'msg_sarah_1',
      chatId: 'chat_sarah',
      senderId: 'user_sarah',
      content: 'Notice: You enabled disappearing messages. New messages will disappear from this device 24 hours after they have been seen.',
      type: 'system',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      status: 'read',
      reactions: {}
    },
    {
      id: 'msg_sarah_2',
      chatId: 'chat_sarah',
      senderId: 'user_sarah',
      content: 'Hey Alex, the new bottom navigation sheet on mobile is super responsive. Feels just like WhatsApp on iOS!',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      status: 'read',
      reactions: { '✨': ['user_alex'] }
    },

    // Marcus Direct Chat
    {
      id: 'msg_marcus_1',
      chatId: 'chat_marcus',
      senderId: 'user_marcus',
      content: 'Hey Alex! Check out the glassmorphism backdrop filter on the chat header.',
      type: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
      mediaName: 'header_glass_design.png',
      mediaSize: '840 KB',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      status: 'read',
      reactions: { '🔥': ['user_alex'] }
    },

    // Nova AI Assistant Chat
    {
      id: 'msg_bot_1',
      chatId: 'chat_bot',
      senderId: 'user_bot',
      content: '👋 Hello Alex! I am Nova, your real-time Pulse assistant. You can chat with me, test message formatting, simulate voice notes, or ask any question. Try sending me a message!',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      status: 'read',
      reactions: { '🤖': ['user_alex'] }
    },

    // Saved Messages
    {
      id: 'msg_saved_1',
      chatId: 'chat_saved_alex',
      senderId: 'user_alex',
      content: '🔑 Pulse App Deploy Checklist:\n1. Verify Service Worker caching & PWA install prompt\n2. Test Web Audio notification sounds\n3. Check responsive dual-pane & mobile drill-down\n4. E2EE safety numbers verify',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
      status: 'read',
      reactions: {}
    }
  ]
};

class Database {
  constructor() {
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.blockedUsers) this.data.blockedUsers = {};
        if (!this.data.stories || this.data.stories.length === 0) this.data.stories = initialData.stories;
        if (this.data.users) {
          this.data.users.forEach(u => {
            const seed = initialData.users.find(s => s.id === u.id);
            if (seed) {
              if (!u.email) u.email = seed.email;
              if (!u.password) u.password = seed.password;
            } else {
              if (!u.email) u.email = `${u.handle ? u.handle.replace('@', '') : u.id}@pulsechat.io`;
              if (!u.password) u.password = 'password123';
            }
          });
        }
      } else {
        this.data = initialData;
        this.save();
      }
    } catch (e) {
      console.error('Error loading DB, resetting to initial data', e);
      this.data = initialData;
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving DB', e);
    }
  }

  getUsers() {
    return this.data.users;
  }

  getUser(userId) {
    return this.data.users.find(u => u.id === userId);
  }

  updateUserStatus(userId, status) {
    const user = this.getUser(userId);
    if (user) {
      user.status = status;
      user.lastSeen = new Date().toISOString();
      this.save();
      return user;
    }
    return null;
  }

  getChatsForUser(userId) {
    return this.data.chats.filter(c => {
      if (c.isSavedMessages) return c.ownerId === userId;
      return c.participants.includes(userId);
    }).map(chat => {
      // populate last message
      const chatMessages = this.data.messages.filter(m => m.chatId === chat.id);
      const lastMessage = chatMessages[chatMessages.length - 1] || null;
      return {
        ...chat,
        lastMessage
      };
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  getChat(chatId) {
    return this.data.chats.find(c => c.id === chatId);
  }

  getMessages(chatId) {
    return this.data.messages.filter(m => m.chatId === chatId);
  }

  addMessage(msg) {
    this.data.messages.push(msg);
    const chat = this.getChat(msg.chatId);
    if (chat) {
      chat.updatedAt = msg.timestamp || new Date().toISOString();
      if (!chat.unreadCount) chat.unreadCount = {};
      chat.participants.forEach(pId => {
        if (pId !== msg.senderId) {
          chat.unreadCount[pId] = (chat.unreadCount[pId] || 0) + 1;
        }
      });
    }
    this.save();
    return msg;
  }

  markMessagesRead(chatId, userId) {
    let modified = false;
    this.data.messages.forEach(m => {
      if (m.chatId === chatId && m.senderId !== userId && m.status !== 'read') {
        m.status = 'read';
        modified = true;
      }
    });

    const chat = this.getChat(chatId);
    if (chat && chat.unreadCount && chat.unreadCount[userId]) {
      chat.unreadCount[userId] = 0;
      modified = true;
    }

    if (modified) {
      this.save();
    }
    return true;
  }

  toggleReaction(messageId, emoji, userId) {
    const msg = this.data.messages.find(m => m.id === messageId);
    if (!msg) return null;
    if (!msg.reactions) msg.reactions = {};

    if (!msg.reactions[emoji]) {
      msg.reactions[emoji] = [userId];
    } else {
      const idx = msg.reactions[emoji].indexOf(userId);
      if (idx >= 0) {
        msg.reactions[emoji].splice(idx, 1);
        if (msg.reactions[emoji].length === 0) {
          delete msg.reactions[emoji];
        }
      } else {
        msg.reactions[emoji].push(userId);
      }
    }
    this.save();
    return msg;
  }

  togglePinMessage(chatId, messageId) {
    const chat = this.getChat(chatId);
    if (!chat) return null;
    if (!chat.pinnedMessageIds) chat.pinnedMessageIds = [];

    const idx = chat.pinnedMessageIds.indexOf(messageId);
    if (idx >= 0) {
      chat.pinnedMessageIds.splice(idx, 1);
    } else {
      chat.pinnedMessageIds.push(messageId);
    }
    this.save();
    return chat;
  }

  createChat(chat) {
    this.data.chats.unshift(chat);
    this.save();
    return chat;
  }

  updateChat(chatId, updates) {
    const chat = this.getChat(chatId);
    if (chat) {
      Object.assign(chat, updates);
      this.save();
      return chat;
    }
    return null;
  }

  // Authentication & Profile Management
  registerUser({ name, handle, phone, email, password, avatar, bio }) {
    if (!name || !name.trim()) {
      throw new Error('Full Name is required');
    }
    if (!handle || !handle.trim()) {
      throw new Error('Username is required');
    }
    if (!email || !email.trim()) {
      throw new Error('Email address is required');
    }
    if (!phone || !phone.trim()) {
      throw new Error('Phone number is required');
    }

    const cleanHandle = handle.startsWith('@') ? handle.toLowerCase().trim() : `@${handle.toLowerCase().trim()}`;
    const cleanPhone = phone.trim();
    const cleanEmail = email.toLowerCase().trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('Please enter a valid email address');
    }

    if (cleanPhone.length < 6) {
      throw new Error('Please enter a valid phone number');
    }

    // Check if handle, phone, or email is already taken
    const existing = this.data.users.find(
      u => (u.handle && u.handle.toLowerCase() === cleanHandle) ||
           (u.phone && u.phone === cleanPhone) ||
           (u.email && u.email.toLowerCase() === cleanEmail)
    );
    if (existing) {
      if (existing.email && existing.email.toLowerCase() === cleanEmail) {
        throw new Error('An account with this email address already exists');
      }
      if (existing.phone && existing.phone === cleanPhone) {
        throw new Error('An account with this phone number already exists');
      }
      throw new Error('Username is already registered');
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const blocks = [];
    for (let i = 0; i < 12; i++) {
      blocks.push(Math.floor(10000 + Math.random() * 90000).toString());
    }
    const safetyNumber = blocks.join(' ');

    const defaultAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanHandle}`;

    const newUser = {
      id: userId,
      name: name.trim(),
      handle: cleanHandle,
      email: cleanEmail,
      phone: cleanPhone,
      password: password || 'password123',
      avatar: defaultAvatar,
      bio: bio ? bio.trim() : 'Using PulseChat ⚡',
      status: 'online',
      lastSeen: new Date().toISOString(),
      safetyNumber
    };

    this.data.users.push(newUser);

    // Create personal "Saved Messages" chat for this user
    const savedChat = {
      id: `chat_saved_${userId}`,
      isGroup: false,
      isSavedMessages: true,
      ownerId: userId,
      participants: [userId],
      pinnedMessageIds: [],
      disappearingTimer: null,
      isEncrypted: true,
      unreadCount: { [userId]: 0 },
      updatedAt: new Date().toISOString()
    };
    this.data.chats.push(savedChat);

    // Add new user to Pulse Core Team channel
    const pulseGroup = this.getChat('chat_group_pulse');
    if (pulseGroup && !pulseGroup.participants.includes(userId)) {
      pulseGroup.participants.push(userId);
    }

    // Auto-create direct chat with Nova AI Bot
    const botChat = {
      id: `chat_bot_${userId}`,
      isGroup: false,
      participants: [userId, 'user_bot'],
      pinnedMessageIds: [],
      disappearingTimer: null,
      isEncrypted: true,
      unreadCount: { [userId]: 0 },
      updatedAt: new Date().toISOString()
    };
    this.data.chats.push(botChat);

    this.save();

    const { password: _, ...safeUser } = newUser;
    return safeUser;
  }

  authenticateUser(loginId, password) {
    const rawId = (loginId || '').trim().toLowerCase();
    const withAt = rawId.startsWith('@') ? rawId : `@${rawId}`;
    const withoutAt = rawId.startsWith('@') ? rawId.slice(1) : rawId;

    const user = this.data.users.find(
      u => (u.handle && (u.handle.toLowerCase() === withAt || u.handle.toLowerCase() === withoutAt || u.handle.toLowerCase().replace('@', '') === withoutAt)) ||
           (u.id && u.id.toLowerCase() === rawId) ||
           (u.email && u.email.toLowerCase() === rawId) ||
           (u.phone && u.phone.trim() === (loginId || '').trim())
    );

    if (!user) {
      throw new Error('User not found with this email, phone, or username');
    }

    const expectedPassword = user.password || 'password123';
    if (password && password !== expectedPassword) {
      throw new Error('Incorrect password');
    }

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  updateUserProfile(userId, updates) {
    const user = this.getUser(userId);
    if (!user) return null;

    if (updates.name) user.name = updates.name.trim();
    if (updates.bio !== undefined) user.bio = updates.bio.trim();
    if (updates.phone) user.phone = updates.phone.trim();
    if (updates.avatar) user.avatar = updates.avatar.trim();
    if (updates.handle) {
      const cleanHandle = updates.handle.startsWith('@') ? updates.handle : `@${updates.handle}`;
      user.handle = cleanHandle;
    }

    this.save();
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  // Advanced Messaging Operations
  editMessage(messageId, userId, newContent) {
    const msg = this.data.messages.find(m => m.id === messageId);
    if (!msg) throw new Error('Message not found');
    if (msg.senderId !== userId) throw new Error('Not authorized to edit this message');
    if (msg.isDeleted) throw new Error('Cannot edit a deleted message');

    msg.content = newContent;
    msg.isEdited = true;
    msg.editedAt = new Date().toISOString();
    this.save();
    return msg;
  }

  deleteMessage(messageId, userId) {
    const msg = this.data.messages.find(m => m.id === messageId);
    if (!msg) throw new Error('Message not found');
    if (msg.senderId !== userId) throw new Error('Not authorized to delete this message');

    msg.isDeleted = true;
    msg.content = 'This message was deleted';
    msg.mediaUrl = null;
    msg.audioWaveform = null;
    msg.audioDuration = null;
    msg.type = 'text';
    msg.reactions = {};
    this.save();
    return msg;
  }

  toggleStarMessage(messageId, userId) {
    const msg = this.data.messages.find(m => m.id === messageId);
    if (!msg) throw new Error('Message not found');
    if (!msg.starredBy) msg.starredBy = [];

    const idx = msg.starredBy.indexOf(userId);
    if (idx >= 0) {
      msg.starredBy.splice(idx, 1);
    } else {
      msg.starredBy.push(userId);
    }
    this.save();
    return msg;
  }

  getStarredMessages(userId) {
    return this.data.messages.filter(m => m.starredBy && m.starredBy.includes(userId));
  }

  votePoll(messageId, optionIndex, userId) {
    const msg = this.data.messages.find(m => m.id === messageId);
    if (!msg || msg.type !== 'poll' || !msg.poll) throw new Error('Poll not found');

    const poll = msg.poll;
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      throw new Error('Invalid poll option index');
    }

    const option = poll.options[optionIndex];
    if (!option.voterIds) option.voterIds = [];

    const existingIndex = option.voterIds.indexOf(userId);
    if (existingIndex >= 0) {
      // Retract vote
      option.voterIds.splice(existingIndex, 1);
    } else {
      // If single choice, remove from other options first
      if (!poll.multipleAnswers) {
        poll.options.forEach(opt => {
          if (opt.voterIds) {
            const i = opt.voterIds.indexOf(userId);
            if (i >= 0) opt.voterIds.splice(i, 1);
          }
        });
      }
      option.voterIds.push(userId);
    }

    // Recalculate total votes
    poll.totalVotes = poll.options.reduce((acc, opt) => acc + (opt.voterIds?.length || 0), 0);
    this.save();
    return msg;
  }

  // Blocking & Privacy
  blockUser(userId, targetUserId) {
    if (!this.data.blockedUsers) this.data.blockedUsers = {};
    if (!this.data.blockedUsers[userId]) this.data.blockedUsers[userId] = [];
    if (!this.data.blockedUsers[userId].includes(targetUserId)) {
      this.data.blockedUsers[userId].push(targetUserId);
      this.save();
    }
    return this.getBlockedUsers(userId);
  }

  unblockUser(userId, targetUserId) {
    if (!this.data.blockedUsers || !this.data.blockedUsers[userId]) return [];
    this.data.blockedUsers[userId] = this.data.blockedUsers[userId].filter(id => id !== targetUserId);
    this.save();
    return this.getBlockedUsers(userId);
  }

  getBlockedUsers(userId) {
    if (!this.data.blockedUsers || !this.data.blockedUsers[userId]) return [];
    const blockedIds = this.data.blockedUsers[userId];
    return this.data.users
      .filter(u => blockedIds.includes(u.id))
      .map(({ password, ...u }) => u);
  }

  isBlocked(userA, userB) {
    if (!this.data.blockedUsers) return false;
    const aBlocksB = this.data.blockedUsers[userA]?.includes(userB);
    const bBlocksA = this.data.blockedUsers[userB]?.includes(userA);
    return aBlocksB || bBlocksA;
  }

  // Stories & Status Updates
  addStory(story) {
    if (!this.data.stories) this.data.stories = [];
    const newStory = {
      id: `story_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      ...story
    };
    this.data.stories.unshift(newStory);
    this.save();
    return newStory;
  }

  getStories() {
    if (!this.data.stories) this.data.stories = [];
    const now = new Date().toISOString();
    return this.data.stories.filter(s => s.expiresAt > now);
  }

  deleteStory(storyId) {
    if (!this.data.stories) return false;
    this.data.stories = this.data.stories.filter(s => s.id !== storyId);
    this.save();
    return true;
  }

  // Group Management
  updateGroup(groupId, updates) {
    const chat = this.getChat(groupId);
    if (!chat || !chat.isGroup) throw new Error('Group not found');
    if (updates.name) chat.name = updates.name.trim();
    if (updates.description !== undefined) chat.description = updates.description.trim();
    if (updates.avatar !== undefined) chat.avatar = updates.avatar;
    chat.updatedAt = new Date().toISOString();
    this.save();
    return chat;
  }

  addGroupParticipant(groupId, userId) {
    const chat = this.getChat(groupId);
    if (!chat || !chat.isGroup) throw new Error('Group not found');
    if (!chat.participants.includes(userId)) {
      chat.participants.push(userId);
      chat.updatedAt = new Date().toISOString();
      this.save();
    }
    return chat;
  }

  removeGroupParticipant(groupId, userId) {
    const chat = this.getChat(groupId);
    if (!chat || !chat.isGroup) throw new Error('Group not found');
    chat.participants = chat.participants.filter(id => id !== userId);
    if (chat.admins) {
      chat.admins = chat.admins.filter(id => id !== userId);
    }
    chat.updatedAt = new Date().toISOString();
    this.save();
    return chat;
  }

  setGroupAdmin(groupId, userId, isAdmin) {
    const chat = this.getChat(groupId);
    if (!chat || !chat.isGroup) throw new Error('Group not found');
    if (!chat.admins) chat.admins = [chat.participants[0]];
    if (isAdmin && !chat.admins.includes(userId)) {
      chat.admins.push(userId);
    } else if (!isAdmin) {
      chat.admins = chat.admins.filter(id => id !== userId);
    }
    this.save();
    return chat;
  }
}

export const db = new Database();

