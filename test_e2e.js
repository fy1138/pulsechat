import { io } from 'socket.io-client';
import assert from 'assert';

async function runTests() {
  console.log('🧪 Starting PulseChat Comprehensive Automated Tests (Auth + Advanced Features)...\n');

  // Test 1: User Registration
  const testUserHandle = `@testuser_${Date.now()}`;
  const registerRes = await fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Jordan Miller',
      handle: testUserHandle,
      phone: `+1 (555) ${Math.floor(100 + Math.random() * 899)}-${Date.now().toString().slice(-4)}`,
      password: 'securePassword456',
      bio: 'Fullstack security enthusiast ⚡'
    })
  });
  const regData = await registerRes.json();
  assert(regData.success, 'Registration must return success');
  assert(regData.user.handle === testUserHandle, 'User handle must match');
  assert(regData.user.safetyNumber && regData.user.safetyNumber.split(' ').length === 12, '60-digit safety number must be generated');
  console.log('✅ Test 1 Passed: Account Registration successful for', regData.user.name, `(${regData.user.handle})`);

  // Test 2: User Login
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUserHandle,
      password: 'securePassword456'
    })
  });
  const loginData = await loginRes.json();
  assert(loginData.success, 'Login must succeed');
  assert(loginData.token, 'Auth token must be returned');
  console.log('✅ Test 2 Passed: Account Login authenticated with token:', loginData.token.substring(0, 24) + '...');

  // Test 3: Profile Update
  const updateRes = await fetch('http://localhost:3001/api/auth/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: regData.user.id,
      bio: 'Updated bio: Building encrypted real-time web apps! 🚀'
    })
  });
  const updateData = await updateRes.json();
  assert(updateData.success && updateData.user.bio.includes('Updated bio'), 'Bio should update');
  console.log('✅ Test 3 Passed: User Profile update succeeded');

  // Test 4: Socket.IO Clients Connect
  const socketAlex = io('http://localhost:3001', { transports: ['websocket'] });
  const socketElena = io('http://localhost:3001', { transports: ['websocket'] });

  await new Promise((resolve) => {
    let connectedCount = 0;
    const checkBoth = () => {
      connectedCount++;
      if (connectedCount === 2) resolve();
    };
    socketAlex.on('connect', () => {
      socketAlex.emit('user:join', 'user_alex');
      socketAlex.emit('chat:join', 'chat_elena');
      checkBoth();
    });
    socketElena.on('connect', () => {
      socketElena.emit('user:join', 'user_elena');
      socketElena.emit('chat:join', 'chat_elena');
      checkBoth();
    });
  });
  console.log('✅ Test 4 Passed: Both Socket.IO clients connected (Alex & Elena)');
  await new Promise((r) => setTimeout(r, 400));

  // Test 5: Real-time Message Send from Alex to Elena
  const testMessage = {
    chatId: 'chat_elena',
    senderId: 'user_alex',
    content: 'Initial message for edit & delete verification',
    type: 'text',
    timestamp: new Date().toISOString()
  };

  const receivedPromise = new Promise((resolve) => {
    socketElena.on('message:new', (msg) => {
      if (msg.content === testMessage.content) {
        resolve(msg);
      }
    });
  });

  socketAlex.emit('message:send', testMessage);
  const receivedMsg = await receivedPromise;
  assert(receivedMsg.content === testMessage.content, 'Elena should receive message');
  console.log('✅ Test 5 Passed: Real-time message delivered across sockets');

  // Test 6: Message Editing
  const editRes = await fetch(`http://localhost:3001/api/messages/${receivedMsg.id}/edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user_alex',
      content: 'Edited content: encryption handshake verified! 🔐',
      chatId: 'chat_elena'
    })
  });
  const editData = await editRes.json();
  assert(editData.success && editData.message.isEdited, 'Message should have isEdited flag');
  console.log('✅ Test 6 Passed: Message successfully edited with editedAt timestamp');

  // Test 7: Star Message & Query Starred Messages
  const starRes = await fetch(`http://localhost:3001/api/messages/${receivedMsg.id}/star`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'user_alex' })
  });
  const starData = await starRes.json();
  assert(starData.success, 'Star toggle should succeed');

  const starredListRes = await fetch('http://localhost:3001/api/messages/starred?userId=user_alex');
  const starredList = await starredListRes.json();
  assert(starredList.some((m) => m.id === receivedMsg.id), 'Message must appear in starred messages list');
  console.log('✅ Test 7 Passed: Starred message bookmarked and queried via /api/messages/starred');

  // Test 8: Interactive Poll Creation & Voting
  const pollMessage = {
    chatId: 'chat_group_pulse',
    senderId: 'user_alex',
    type: 'poll',
    content: '📊 Poll: Favorite real-time feature?',
    poll: {
      question: 'Favorite real-time feature?',
      options: [
        { text: 'E2EE Safety Numbers', voterIds: [] },
        { text: 'Voice Notes with Waveform', voterIds: [] },
        { text: 'Interactive Polls', voterIds: [] }
      ],
      multipleAnswers: false,
      totalVotes: 0
    },
    timestamp: new Date().toISOString()
  };

  const pollReceivedPromise = new Promise((resolve) => {
    socketElena.emit('chat:join', 'chat_group_pulse');
    socketElena.on('message:new', (msg) => {
      if (msg.type === 'poll' && msg.poll.question === pollMessage.poll.question) {
        resolve(msg);
      }
    });
  });

  socketAlex.emit('message:send', pollMessage);
  const receivedPoll = await pollReceivedPromise;
  assert(receivedPoll.type === 'poll', 'Received message must be poll');

  // Cast vote on poll option 0
  const voteRes = await fetch(`http://localhost:3001/api/polls/${receivedPoll.id}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      optionIndex: 0,
      userId: 'user_elena',
      chatId: 'chat_group_pulse'
    })
  });
  const voteData = await voteRes.json();
  assert(voteData.success && voteData.message.poll.totalVotes === 1, 'Poll should tally votes');
  assert(voteData.message.poll.options[0].voterIds.includes('user_elena'), 'Option 0 should include voter user_elena');
  console.log('✅ Test 8 Passed: Interactive group poll created and vote tallied in real-time');

  // Test 9: Message Deletion
  const deleteRes = await fetch(`http://localhost:3001/api/messages/${receivedMsg.id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user_alex',
      chatId: 'chat_elena'
    })
  });
  const deleteData = await deleteRes.json();
  assert(deleteData.success && deleteData.message.isDeleted, 'Message should be marked deleted');
  assert(deleteData.message.content === 'This message was deleted', 'Content should be replaced');
  console.log('✅ Test 9 Passed: Message deleted for everyone with redacted content');

  // Test 10: Bot Auto-responder
  socketAlex.emit('chat:join', 'chat_bot');
  const botReplyPromise = new Promise((resolve) => {
    socketAlex.on('message:new', (msg) => {
      if (msg.senderId === 'user_bot' && msg.chatId === 'chat_bot') {
        resolve(msg);
      }
    });
  });

  socketAlex.emit('message:send', {
    chatId: 'chat_bot',
    senderId: 'user_alex',
    content: 'Hello Nova! Can you verify our poll and auth features?',
    type: 'text',
    timestamp: new Date().toISOString()
  });

  const botReply = await botReplyPromise;
  assert(botReply.senderId === 'user_bot', 'Nova AI bot should reply automatically');
  console.log('✅ Test 10 Passed: Nova AI Assistant auto-responded:', botReply.content);

  socketAlex.disconnect();
  socketElena.disconnect();
  console.log('\n🎉 ALL 10 AUTHENTICATION & ADVANCED MESSAGING TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
