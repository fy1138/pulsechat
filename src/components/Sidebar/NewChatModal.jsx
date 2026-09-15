import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { X, Users, MessageSquare, Plus, Camera, Sparkles } from 'lucide-react';
import AvatarUploadModal from '../Common/AvatarUploadModal';

export default function NewChatModal({ isOpen, onClose }) {
  const { allUsers, currentUser, setActiveChatId, chats, createChat } = useSocket();
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleStartDirectChat = async (user) => {
    // Check if chat already exists
    const existing = chats.find(
      (c) => !c.isGroup && !c.isSavedMessages && c.participants.includes(user.id)
    );
    if (existing) {
      setActiveChatId(existing.id);
      onClose();
    } else {
      // Create new chat
      const newChat = {
        id: `chat_${Date.now()}`,
        isGroup: false,
        participants: [currentUser, user.id],
        isEncrypted: true,
        pinnedMessageIds: [],
        disappearingTimer: null,
        unreadCount: {},
        updatedAt: new Date().toISOString()
      };
      await createChat(newChat);
      setActiveChatId(newChat.id);
      onClose();
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    const newGroupId = `chat_group_${Date.now()}`;
    const newGroup = {
      id: newGroupId,
      name: groupName.trim(),
      description: groupDescription.trim() || 'Group created via PulseChat',
      avatar: groupAvatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      isGroup: true,
      participants: [currentUser, ...selectedUsers],
      admins: [currentUser],
      isEncrypted: true,
      pinnedMessageIds: [],
      unreadCount: {},
      updatedAt: new Date().toISOString()
    };

    await createChat(newGroup);
    setActiveChatId(newGroupId);
    onClose();
  };

  const otherUsers = allUsers.filter((u) => u.id !== currentUser);

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isCreatingGroup ? 'Create New Group' : 'New Conversation'}
            </h3>
            <button className="icon-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {!isCreatingGroup ? (
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => setIsCreatingGroup(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  background: 'var(--accent-glow)',
                  border: '1px dashed var(--accent-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <Users size={18} />
                <span>Create New Group</span>
              </button>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '8px 4px 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Contacts
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '340px', overflowY: 'auto' }}>
                {otherUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleStartDirectChat(user)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div className="avatar-wrapper">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="avatar-img" />
                      ) : (
                        <div className="avatar-placeholder">{user.name.charAt(0)}</div>
                      )}
                      <span className={`presence-badge ${user.status}`} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.bio}</div>
                    </div>
                    <MessageSquare size={16} color="var(--text-muted)" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Group Avatar Picker */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '4px' }}>
                <div
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="avatar-wrapper"
                  style={{ width: '76px', height: '76px', cursor: 'pointer', position: 'relative', border: '2px dashed var(--accent-primary)' }}
                  title="Upload or Take Group Photo"
                >
                  {groupAvatar ? (
                    <img src={groupAvatar} alt="Group Icon" className="avatar-img" />
                  ) : (
                    <div className="avatar-placeholder" style={{ fontSize: '28px' }}>
                      <Users size={32} color="var(--accent-primary)" />
                    </div>
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-primary)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid var(--bg-card)'
                    }}
                  >
                    <Camera size={13} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '12px',
                    color: 'var(--accent-primary)',
                    fontWeight: 600,
                    marginTop: '8px',
                    cursor: 'pointer'
                  }}
                >
                  {groupAvatar ? 'Change Group Photo' : 'Add Group Photo (Upload or Camera)'}
                </button>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>GROUP NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Design Sync, Weekend Trips..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>GROUP DESCRIPTION (OPTIONAL)</label>
                <input
                  type="text"
                  placeholder="What is this group about?"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  SELECT PARTICIPANTS ({selectedUsers.length})
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {otherUsers.map((user) => {
                    const isChecked = selectedUsers.includes(user.id);
                    return (
                      <label
                        key={user.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-md)',
                          background: isChecked ? 'var(--bg-active)' : 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter((id) => id !== user.id));
                            }
                          }}
                        />
                        <div className="avatar-wrapper" style={{ width: '28px', height: '28px' }}>
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="avatar-img" />
                          ) : (
                            <div className="avatar-placeholder" style={{ fontSize: '12px' }}>{user.name.charAt(0)}</div>
                          )}
                        </div>
                        <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{user.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button className="icon-btn" style={{ width: 'auto', padding: '6px 14px', borderRadius: 'var(--radius-md)', fontSize: '13px' }} onClick={() => setIsCreatingGroup(false)}>
                  Back
                </button>
                <button
                  className="icon-btn primary"
                  style={{ width: 'auto', padding: '8px 18px', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 600 }}
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || selectedUsers.length === 0}
                >
                  Create Group
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSelectAvatar={(avatarUrl) => setGroupAvatar(avatarUrl)}
        currentAvatar={groupAvatar}
        title="Group Icon"
      />
    </>
  );
}
