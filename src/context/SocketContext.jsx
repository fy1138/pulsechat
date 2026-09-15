import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { soundEngine } from '../utils/audio';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('pulse_user_id');
    return saved || 'user_alex';
  });

  const [allUsers, setAllUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingMap, setTypingMap] = useState({}); // { [chatId]: Set<userId> }
  const [userPresence, setUserPresence] = useState({}); // { [userId]: { status, lastSeen } }
  const [isConnected, setIsConnected] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [callState, setCallState] = useState(null); // { callId, chatId, isVideo, caller, isIncoming, connected }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [stories, setStories] = useState([]);
  const [currentWallpaper, setCurrentWallpaper] = useState(() => localStorage.getItem('pulse_wallpaper') || 'default');
  
  const socketRef = useRef(null);
  const offlineQueueRef = useRef([]);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  // Load Users
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
        const presence = {};
        data.forEach(u => {
          presence[u.id] = { status: u.status, lastSeen: u.lastSeen };
        });
        setUserPresence(presence);
      }
    } catch (e) {
      console.warn('Failed to fetch users', e);
    }
  }, []);

  // Load Blocked Users
  const fetchBlockedUsers = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/users/${userId}/blocked`);
      if (res.ok) {
        const data = await res.json();
        setBlockedUsers(data);
      }
    } catch (e) {
      console.warn('Failed to fetch blocked users', e);
    }
  }, []);

  // Load Stories / Status Updates
  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch('/api/stories');
      if (res.ok) {
        const data = await res.json();
        setStories(data);
      }
    } catch (e) {
      console.warn('Failed to fetch stories', e);
    }
  }, []);

  // Load Chats for Current User
  const fetchChats = useCallback(async (userId) => {
    try {
      const res = await fetch(`/api/chats?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setChats(data);
        // Default select first chat on wide screens if none selected
        if (!activeChatId && data.length > 0 && window.innerWidth > 768) {
          setActiveChatId(data[0].id);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch chats', e);
    }
  }, [activeChatId]);

  // Load Messages for Active Chat
  const fetchMessages = useCallback(async (chatId) => {
    if (!chatId) {
      setMessages([]);
      return;
    }
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.warn('Failed to fetch messages', e);
    }
  }, []);

  // Switch User Profile
  const switchUser = useCallback((newUserId) => {
    localStorage.setItem('pulse_user_id', newUserId);
    setCurrentUser(newUserId);
    if (socketRef.current) {
      socketRef.current.emit('user:join', newUserId);
    }
    fetchChats(newUserId);
    fetchBlockedUsers(newUserId);
  }, [fetchChats, fetchBlockedUsers]);

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Flush offline queue
      if (offlineQueueRef.current.length > 0 && socketRef.current && isConnected) {
        offlineQueueRef.current.forEach((msg) => {
          socketRef.current.emit('message:send', msg);
        });
        offlineQueueRef.current = [];
      }
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isConnected]);

  // Initialize Socket.IO connection
  useEffect(() => {
    fetchUsers();
    fetchChats(currentUser);
    fetchBlockedUsers(currentUser);
    fetchStories();

    const socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('user:join', currentUser);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Stories listeners
    socket.on('story:new', (newStory) => {
      setStories((prev) => [newStory, ...prev.filter((s) => s.id !== newStory.id)]);
    });

    socket.on('story:deleted', ({ storyId }) => {
      setStories((prev) => prev.filter((s) => s.id !== storyId));
    });

    // Block updates
    socket.on('user:blocked_updated', ({ userId, blockedUsers: list }) => {
      if (userId === currentUser) {
        setBlockedUsers(list);
      }
    });

    // Group & Chat updates
    socket.on('chat:group_updated', (updatedChat) => {
      setChats((prev) => prev.map((c) => (c.id === updatedChat.id ? { ...c, ...updatedChat } : c)));
    });

    socket.on('chat:new', (newChat) => {
      setChats((prev) => {
        const exists = prev.some((c) => c.id === newChat.id);
        return exists ? prev : [newChat, ...prev];
      });
    });

    socket.on('message:error', ({ error }) => {
      console.warn('Socket message error:', error);
    });

    socket.on('call:blocked', ({ error }) => {
      soundEngine.stopRingtone();
      teardownCall();
      alert(error);
    });

    socket.on('call:incoming', ({ callId, chatId, caller, recipientId, isVideo }) => {
      if (caller?.id === currentUser) return;
      if (recipientId === 'all' || recipientId === currentUser) {
        soundEngine.startRingtone();
        setCallState({
          callId,
          chatId,
          caller,
          recipientId,
          isVideo,
          isIncoming: true,
          connected: false
        });
      }
    });

    socket.on('call:answered', async ({ chatId, callerId, answererId }) => {
      soundEngine.stopRingtone();
      setCallState((prev) => (prev ? { ...prev, connected: true, startTime: Date.now() } : null));

      if (peerConnectionRef.current && currentUser === callerId) {
        try {
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          socket.emit('call:signal', {
            chatId,
            from: currentUser,
            to: answererId,
            type: 'offer',
            sdp: offer
          });
        } catch (err) {
          console.warn('Error creating WebRTC offer', err);
        }
      }
    });

    socket.on('call:signaled', async (data) => {
      if (data.from === currentUser) return;
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        if (data.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('call:signal', {
            chatId: data.chatId,
            from: currentUser,
            to: data.from,
            type: 'answer',
            sdp: answer
          });
        } else if (data.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        } else if (data.type === 'candidate' && data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.warn('Error handling WebRTC signal', err);
      }
    });

    socket.on('call:ended', () => {
      teardownCall();
    });

    // Real-time message receiver
    socket.on('message:new', (newMsg) => {
      setMessages((prev) => {
        // If message already exists (from optimistic send)
        const exists = prev.some((m) => m.id === newMsg.id);
        if (exists) {
          return prev.map((m) => (m.id === newMsg.id ? newMsg : m));
        }
        if (newMsg.chatId === activeChatId) {
          if (newMsg.senderId !== currentUser) {
            soundEngine.playReceived();
          }
          return [...prev, newMsg];
        }
        return prev;
      });

      // Update last message in chat list
      setChats((prevChats) => {
        return prevChats.map((c) => {
          if (c.id === newMsg.chatId) {
            const isCurrentChat = c.id === activeChatId;
            const updatedUnread = isCurrentChat ? 0 : ((c.unreadCount?.[currentUser] || 0) + 1);
            return {
              ...c,
              lastMessage: newMsg,
              updatedAt: newMsg.timestamp,
              unreadCount: {
                ...(c.unreadCount || {}),
                [currentUser]: updatedUnread
              }
            };
          }
          return c;
        }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    });

    // Reaction updates
    socket.on('message:reaction_updated', ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
      );
    });

    // Pinned updates
    socket.on('chat:pinned_updated', ({ chatId, pinnedMessageIds }) => {
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, pinnedMessageIds } : c))
      );
    });

    // Disappearing timer update
    socket.on('chat:disappearing_updated', ({ chatId, disappearingTimer }) => {
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, disappearingTimer } : c))
      );
    });

    // Read receipts
    socket.on('chat:read', ({ chatId, userId }) => {
      if (chatId === activeChatId) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId === currentUser ? { ...m, status: 'read' } : m))
        );
      }
      setChats((prev) =>
        prev.map((c) => {
          if (c.id === chatId && c.unreadCount) {
            return {
              ...c,
              unreadCount: {
                ...c.unreadCount,
                [userId]: 0
              }
            };
          }
          return c;
        })
      );
    });

    // Typing indicators
    socket.on('typing:status', ({ chatId, userId, isTyping }) => {
      if (userId === currentUser) return;
      setTypingMap((prev) => {
        const currentSet = new Set(prev[chatId] || []);
        if (isTyping) {
          currentSet.add(userId);
        } else {
          currentSet.delete(userId);
        }
        return { ...prev, [chatId]: Array.from(currentSet) };
      });
    });

    // User presence updates
    socket.on('user:presence', ({ userId, status, lastSeen }) => {
      setUserPresence((prev) => ({
        ...prev,
        [userId]: { status, lastSeen }
      }));
    });

    // Message Edited
    socket.on('message:edited', ({ messageId, content, isEdited, editedAt }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, content, isEdited, editedAt } : m))
      );
    });

    // Message Deleted
    socket.on('message:deleted', ({ messageId, isDeleted, content }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, isDeleted, content, mediaUrl: null, audioWaveform: null, audioDuration: null, reactions: {} }
            : m
        )
      );
    });

    // Poll Updated
    socket.on('poll:updated', ({ messageId, poll }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, poll } : m))
      );
    });

    // User Profile Updated
    socket.on('user:updated', (updatedUser) => {
      setAllUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
      );
    });

    // Incoming Call listener
    socket.on('call:incoming', ({ callId, chatId, caller, recipientId, isVideo }) => {
      if (recipientId === currentUser || (recipientId === 'all' && caller.id !== currentUser)) {
        soundEngine.startRingtone();
        setCallState({
          callId,
          chatId,
          isVideo,
          caller,
          isIncoming: true,
          connected: false
        });
      }
    });

    socket.on('call:ended', () => {
      soundEngine.stopRingtone();
      soundEngine.playCallEnd();
      setCallState(null);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser, activeChatId, fetchUsers, fetchChats]);

  // When activeChatId changes, join room and fetch messages
  useEffect(() => {
    if (activeChatId) {
      if (socketRef.current) {
        socketRef.current.emit('chat:join', activeChatId);
      }
      fetchMessages(activeChatId);

      // Mark as read immediately
      fetch(`/api/chats/${activeChatId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser })
      }).catch(console.warn);

      // Update unread in local state
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? { ...c, unreadCount: { ...(c.unreadCount || {}), [currentUser]: 0 } }
            : c
        )
      );
    }
  }, [activeChatId, currentUser, fetchMessages]);

  // Send Message
  const sendMessage = useCallback(({ content, type = 'text', mediaUrl, mediaName, mediaSize, audioDuration, audioWaveform, replyTo, poll, location, stickerUrl, forwardedFrom, chatId }) => {
    const targetChatId = chatId || activeChatId;
    if (!targetChatId) return;

    const tempId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newMsg = {
      id: tempId,
      chatId: targetChatId,
      senderId: currentUser,
      content: content || '',
      type,
      mediaUrl,
      mediaName,
      mediaSize,
      audioDuration,
      audioWaveform,
      replyTo,
      poll,
      location,
      stickerUrl,
      forwardedFrom,
      timestamp: new Date().toISOString(),
      status: isConnected ? 'delivered' : 'pending',
      reactions: {},
      starredBy: []
    };

    // Optimistic UI update if sending to currently active chat
    if (targetChatId === activeChatId) {
      setMessages((prev) => [...prev, newMsg]);
    }
    soundEngine.playSent();

    // Update chat last message
    setChats((prev) =>
      prev.map((c) =>
        c.id === targetChatId
          ? { ...c, lastMessage: newMsg, updatedAt: newMsg.timestamp }
          : c
      ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    );

    if (isConnected && socketRef.current) {
      socketRef.current.emit('message:send', newMsg);
    } else {
      offlineQueueRef.current.push(newMsg);
    }
    return newMsg;
  }, [activeChatId, currentUser, isConnected]);

  // Edit Message
  const editMessage = useCallback((messageId, newContent) => {
    if (!activeChatId) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, content: newContent, isEdited: true, editedAt: new Date().toISOString() } : m))
    );
    if (socketRef.current) {
      socketRef.current.emit('message:edit', {
        chatId: activeChatId,
        messageId,
        userId: currentUser,
        content: newContent
      });
    }
  }, [activeChatId, currentUser]);

  // Delete Message for Everyone
  const deleteMessage = useCallback((messageId) => {
    if (!activeChatId) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, isDeleted: true, content: 'This message was deleted', mediaUrl: null, audioWaveform: null, audioDuration: null, reactions: {} }
          : m
      )
    );
    if (socketRef.current) {
      socketRef.current.emit('message:delete', {
        chatId: activeChatId,
        messageId,
        userId: currentUser
      });
    }
  }, [activeChatId, currentUser]);

  // Toggle Star
  const toggleStar = useCallback(async (messageId) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId) {
          const starredBy = m.starredBy || [];
          const idx = starredBy.indexOf(currentUser);
          const updated = idx >= 0
            ? starredBy.filter((id) => id !== currentUser)
            : [...starredBy, currentUser];
          return { ...m, starredBy: updated };
        }
        return m;
      })
    );
    try {
      await fetch(`/api/messages/${messageId}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser })
      });
    } catch (e) {
      console.warn('Failed to star message', e);
    }
  }, [currentUser]);

  // Vote on Poll
  const votePoll = useCallback((messageId, optionIndex) => {
    if (!activeChatId) return;
    if (socketRef.current) {
      socketRef.current.emit('poll:vote', {
        chatId: activeChatId,
        messageId,
        optionIndex,
        userId: currentUser
      });
    }
  }, [activeChatId, currentUser]);

  // Forward message to one or more chats
  const forwardMessage = useCallback((originalMessage, targetChatIds) => {
    const sender = allUsers.find((u) => u.id === originalMessage.senderId);
    targetChatIds.forEach((chatId) => {
      sendMessage({
        chatId,
        content: originalMessage.content,
        type: originalMessage.type,
        mediaUrl: originalMessage.mediaUrl,
        mediaName: originalMessage.mediaName,
        mediaSize: originalMessage.mediaSize,
        audioDuration: originalMessage.audioDuration,
        audioWaveform: originalMessage.audioWaveform,
        poll: originalMessage.poll,
        location: originalMessage.location,
        stickerUrl: originalMessage.stickerUrl,
        forwardedFrom: sender ? sender.name : 'Unknown User'
      });
    });
  }, [allUsers, sendMessage]);

  // Toggle Reaction
  const toggleReaction = useCallback((messageId, emoji) => {
    if (!activeChatId) return;
    if (socketRef.current) {
      socketRef.current.emit('message:react', {
        chatId: activeChatId,
        messageId,
        emoji,
        userId: currentUser
      });
    }
  }, [activeChatId, currentUser]);

  // Toggle Pin
  const togglePin = useCallback(async (messageId) => {
    if (!activeChatId) return;
    try {
      const res = await fetch(`/api/chats/${activeChatId}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId })
      });
      if (res.ok) {
        const data = await res.json();
        setChats((prev) =>
          prev.map((c) => (c.id === activeChatId ? { ...c, pinnedMessageIds: data.pinnedMessageIds } : c))
        );
      }
    } catch (e) {
      console.warn('Failed to toggle pin', e);
    }
  }, [activeChatId]);

  // Typing Start / Stop
  const typingTimeoutRef = useRef(null);
  const handleTyping = useCallback(() => {
    if (!activeChatId || !socketRef.current) return;
    socketRef.current.emit('typing:start', { chatId: activeChatId, userId: currentUser });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('typing:stop', { chatId: activeChatId, userId: currentUser });
    }, 2000);
  }, [activeChatId, currentUser]);

  // Call Handlers
  // Teardown WebRTC Call & Streams
  const teardownCall = useCallback(() => {
    soundEngine.stopRingtone();
    soundEngine.playCallEnd();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallState(null);
  }, []);

  // WebRTC Call Handlers
  const startCall = useCallback(async (isVideo = false) => {
    if (!activeChatId) return;
    const currentChat = chats.find((c) => c.id === activeChatId);
    const caller = allUsers.find((u) => u.id === currentUser);
    const recipientId = currentChat?.isGroup ? 'all' : currentChat?.recipient?.id;

    if (recipientId && blockedUsers.some((u) => u.id === recipientId)) {
      alert('Cannot start call: Contact is blocked.');
      return;
    }

    const callId = `call_${Date.now()}`;
    soundEngine.startRingtone();

    // 1. Capture local camera/microphone media
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false
      });
    } catch (err) {
      console.warn('getUserMedia failed, trying audio only', err);
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        console.warn('Microphone permission denied', e);
      }
    }

    localStreamRef.current = stream;
    setLocalStream(stream);

    // 2. Setup RTCPeerConnection with STUN
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    peerConnectionRef.current = pc;

    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    const remote = new MediaStream();
    remoteStreamRef.current = remote;
    setRemoteStream(remote);

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        remote.addTrack(event.track);
        setRemoteStream(new MediaStream(remote.getTracks()));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('call:signal', {
          chatId: activeChatId,
          from: currentUser,
          to: recipientId,
          type: 'candidate',
          candidate: event.candidate
        });
      }
    };

    setCallState({
      callId,
      chatId: activeChatId,
      isVideo,
      caller,
      recipientId,
      isIncoming: false,
      connected: false
    });

    if (socketRef.current) {
      socketRef.current.emit('call:initiate', {
        chatId: activeChatId,
        caller,
        recipientId,
        isVideo
      });
    }

    // Auto loopback / echo test if calling Nova AI bot or solo testing
    if (recipientId === 'user_bot' || currentChat?.recipient?.isBot) {
      setTimeout(() => {
        soundEngine.stopRingtone();
        setCallState((prev) => (prev ? { ...prev, connected: true, startTime: Date.now() } : null));
      }, 2200);
    }
  }, [activeChatId, chats, allUsers, currentUser, blockedUsers]);

  const answerCall = useCallback(async () => {
    soundEngine.stopRingtone();
    if (!callState) return;

    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callState.isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false
      });
    } catch (err) {
      console.warn('Answer call media error, trying audio only', err);
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {}
    }

    localStreamRef.current = stream;
    setLocalStream(stream);

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    peerConnectionRef.current = pc;

    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    const remote = new MediaStream();
    remoteStreamRef.current = remote;
    setRemoteStream(remote);

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        remote.addTrack(event.track);
        setRemoteStream(new MediaStream(remote.getTracks()));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('call:signal', {
          chatId: callState.chatId,
          from: currentUser,
          to: callState.caller.id,
          type: 'candidate',
          candidate: event.candidate
        });
      }
    };

    setCallState((prev) => (prev ? { ...prev, isIncoming: false, connected: true, startTime: Date.now() } : null));

    if (socketRef.current) {
      socketRef.current.emit('call:answer', {
        chatId: callState.chatId,
        callerId: callState.caller.id,
        answererId: currentUser
      });
    }
  }, [callState, currentUser]);

  const endCall = useCallback(() => {
    if (socketRef.current && callState) {
      socketRef.current.emit('call:end', { callId: callState.callId, chatId: callState.chatId });
    }
    teardownCall();
  }, [callState, teardownCall]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled;
      }
    }
    return false;
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled;
      }
    }
    return false;
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!peerConnectionRef.current) return false;
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = displayStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender) {
        sender.replaceTrack(screenTrack);
      }
      screenTrack.onended = () => {
        if (localStreamRef.current) {
          const camTrack = localStreamRef.current.getVideoTracks()[0];
          if (camTrack && sender) {
            sender.replaceTrack(camTrack);
          }
        }
      };
      return true;
    } catch (err) {
      console.warn('Screen share cancelled', err);
      return false;
    }
  }, []);

  // Block & Unblock handlers
  const blockUser = useCallback(async (targetUserId) => {
    try {
      const res = await fetch(`/api/users/${currentUser}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedUsers(data.blockedUsers);
      }
    } catch (e) {
      console.warn('Block user failed', e);
    }
  }, [currentUser]);

  const unblockUser = useCallback(async (targetUserId) => {
    try {
      const res = await fetch(`/api/users/${currentUser}/unblock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedUsers(data.blockedUsers);
      }
    } catch (e) {
      console.warn('Unblock user failed', e);
    }
  }, [currentUser]);

  const isBlocked = useCallback((targetUserId) => {
    return blockedUsers.some((u) => u.id === targetUserId);
  }, [blockedUsers]);

  // Stories handlers
  const addStory = useCallback(async (storyData) => {
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser, ...storyData })
      });
      if (res.ok) {
        const data = await res.json();
        setStories((prev) => [data.story, ...prev.filter((s) => s.id !== data.story.id)]);
        return data.story;
      }
    } catch (e) {
      console.warn('Failed to add story', e);
    }
  }, [currentUser]);

  const deleteStory = useCallback(async (storyId) => {
    try {
      const res = await fetch(`/api/stories/${storyId}`, { method: 'DELETE' });
      if (res.ok) {
        setStories((prev) => prev.filter((s) => s.id !== storyId));
      }
    } catch (e) {
      console.warn('Failed to delete story', e);
    }
  }, []);

  // Wallpaper handler
  const setWallpaper = useCallback((wallpaperId) => {
    setCurrentWallpaper(wallpaperId);
    localStorage.setItem('pulse_wallpaper', wallpaperId);
  }, []);

  // Group Management handlers
  const updateGroup = useCallback(async (chatId, updates) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/group`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, ...data.chat } : c)));
        return data.chat;
      }
    } catch (e) {
      console.warn('Failed to update group', e);
    }
  }, []);

  const addGroupParticipant = useCallback(async (chatId, userId) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/group/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'add' })
      });
      if (res.ok) {
        const data = await res.json();
        setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, ...data.chat } : c)));
      }
    } catch (e) {
      console.warn('Failed to add group participant', e);
    }
  }, []);

  const removeGroupParticipant = useCallback(async (chatId, userId) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/group/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'remove' })
      });
      if (res.ok) {
        const data = await res.json();
        setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, ...data.chat } : c)));
      }
    } catch (e) {
      console.warn('Failed to remove group participant', e);
    }
  }, []);

  const createChat = useCallback(async (chat) => {
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat })
      });
      if (res.ok) {
        const data = await res.json();
        setChats((prev) => [data.chat, ...prev.filter((c) => c.id !== data.chat.id)]);
        setActiveChatId(data.chat.id);
        return data.chat;
      }
    } catch (e) {
      console.warn('Failed to create chat', e);
    }
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const activeChatTyping = activeChatId ? (typingMap[activeChatId] || []) : [];

  return (
    <SocketContext.Provider
      value={{
        currentUser,
        switchUser,
        allUsers,
        chats,
        activeChatId,
        setActiveChatId,
        activeChat,
        messages,
        sendMessage,
        editMessage,
        deleteMessage,
        toggleStar,
        votePoll,
        forwardMessage,
        toggleReaction,
        togglePin,
        handleTyping,
        activeChatTyping,
        userPresence,
        isConnected,
        isOffline,
        callState,
        localStream,
        remoteStream,
        startCall,
        answerCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
        blockedUsers,
        blockUser,
        unblockUser,
        isBlocked,
        stories,
        addStory,
        deleteStory,
        currentWallpaper,
        setWallpaper,
        updateGroup,
        addGroupParticipant,
        removeGroupParticipant,
        createChat,
        refreshChats: () => fetchChats(currentUser)
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
