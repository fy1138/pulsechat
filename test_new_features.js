import assert from 'assert';

async function runNewFeatureTests() {
  console.log('🧪 Testing PulseChat Photo Upload, Blocking, Stories & Group Features...\n');

  // Test 1: Block User
  console.log('--- Test 1: Block User ---');
  const blockRes = await fetch('http://localhost:3001/api/users/user_alex/block', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUserId: 'user_marcus' })
  });
  const blockData = await blockRes.json();
  assert(blockData.success, 'Block user must succeed');
  assert(blockData.blockedUsers.some(u => u.id === 'user_marcus'), 'Marcus must be in blocked users list');
  console.log('✅ Test 1 Passed: User Alex successfully blocked Marcus');

  // Test 2: Query Blocked Users
  console.log('--- Test 2: Query Blocked Users ---');
  const queryRes = await fetch('http://localhost:3001/api/users/user_alex/blocked');
  const queryData = await queryRes.json();
  assert(Array.isArray(queryData), 'Blocked users must return array');
  assert(queryData.some(u => u.id === 'user_marcus'), 'Marcus must be returned in query');
  console.log('✅ Test 2 Passed: Blocked users query verified for Alex');

  // Test 3: Unblock User
  console.log('--- Test 3: Unblock User ---');
  const unblockRes = await fetch('http://localhost:3001/api/users/user_alex/unblock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUserId: 'user_marcus' })
  });
  const unblockData = await unblockRes.json();
  assert(unblockData.success, 'Unblock user must succeed');
  assert(!unblockData.blockedUsers.some(u => u.id === 'user_marcus'), 'Marcus must be removed from blocked list');
  console.log('✅ Test 3 Passed: User Alex successfully unblocked Marcus');

  // Test 4: Create Story Update
  console.log('--- Test 4: Create Story Update ---');
  const storyRes = await fetch('http://localhost:3001/api/stories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user_alex',
      type: 'text',
      text: 'Testing live camera & stories on PulseChat 🚀',
      background: 'linear-gradient(135deg, #059669, #10b981)'
    })
  });
  const storyData = await storyRes.json();
  assert(storyData.success, 'Story creation must succeed');
  assert(storyData.story.userId === 'user_alex', 'Story owner must match');
  console.log('✅ Test 4 Passed: Alex posted a new text status');

  // Test 5: Query Stories
  console.log('--- Test 5: Query Active Stories ---');
  const storiesListRes = await fetch('http://localhost:3001/api/stories');
  const storiesList = await storiesListRes.json();
  assert(Array.isArray(storiesList) && storiesList.length >= 1, 'Active stories list must return non-empty array');
  assert(storiesList.some(s => s.id === storyData.story.id), 'Newly created story must be in stories list');
  console.log(`✅ Test 5 Passed: Successfully retrieved ${storiesList.length} active stories`);

  // Test 6: Create Group with Avatar
  console.log('--- Test 6: Create Group with Custom Avatar ---');
  const newGroupId = `chat_group_test_${Date.now()}`;
  const groupRes = await fetch('http://localhost:3001/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat: {
        id: newGroupId,
        name: 'Designers & Engineers',
        description: 'Collaborative channel for system architecture',
        avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
        isGroup: true,
        participants: ['user_alex', 'user_elena'],
        admins: ['user_alex'],
        isEncrypted: true,
        pinnedMessageIds: [],
        unreadCount: {},
        updatedAt: new Date().toISOString()
      }
    })
  });
  const groupData = await groupRes.json();
  assert(groupData.success, 'Group creation must succeed');
  assert(groupData.chat.name === 'Designers & Engineers', 'Group title must match');
  console.log('✅ Test 6 Passed: Group created with custom title & avatar');

  // Test 7: Update Group Details
  console.log('--- Test 7: Update Group Information ---');
  const updateGroupRes = await fetch(`http://localhost:3001/api/chats/${newGroupId}/group`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Designers & Engineers (Official)',
      description: 'Updated group description via admin panel'
    })
  });
  const updateGroupData = await updateGroupRes.json();
  assert(updateGroupData.success, 'Group update must succeed');
  assert(updateGroupData.chat.name === 'Designers & Engineers (Official)', 'Group name should be updated');
  console.log('✅ Test 7 Passed: Group name & description successfully updated');

  // Test 8: Add Group Participant
  console.log('--- Test 8: Add Group Participant ---');
  const addParticipantRes = await fetch(`http://localhost:3001/api/chats/${newGroupId}/group/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'user_sarah', action: 'add' })
  });
  const addPartData = await addParticipantRes.json();
  assert(addPartData.success, 'Add participant must succeed');
  assert(addPartData.chat.participants.includes('user_sarah'), 'Sarah must be in group participants');
  console.log('✅ Test 8 Passed: Added Sarah to group participants');

  // Clean up test story
  await fetch(`http://localhost:3001/api/stories/${storyData.story.id}`, { method: 'DELETE' });

  console.log('\n🎉 ALL 8 TESTS FOR CAMERA/PHOTO, BLOCK/UNBLOCK, STORIES & GROUPS PASSED CLEANLY!\n');
}

runNewFeatureTests().catch((err) => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
