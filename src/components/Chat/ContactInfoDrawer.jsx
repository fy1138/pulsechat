import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { X, ShieldCheck, Clock, Bell, Image, FileText, Lock, Check, UserX, Unlock, Camera, UserPlus, Trash2, Shield, LogOut } from 'lucide-react';
import SafetyNumberModal from './SafetyNumberModal';
import AvatarUploadModal from '../Common/AvatarUploadModal';

export default function ContactInfoDrawer({ isOpen, onClose }) {
  const {
    activeChat,
    messages,
    allUsers,
    currentUser,
    isBlocked,
    blockUser,
    unblockUser,
    updateGroup,
    addGroupParticipant,
    removeGroupParticipant
  } = useSocket();

  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('media'); // 'media' | 'files' | 'members'

  if (!isOpen || !activeChat) return null;

  const recipient = activeChat.recipient;
  const isGroup = activeChat.isGroup;
  const isRecipientBlocked = recipient ? isBlocked(recipient.id) : false;
  const isCurrentUserAdmin = isGroup ? (activeChat.admins?.includes(currentUser) || activeChat.participants?.[0] === currentUser) : false;

  // Filter media from conversation
  const sharedImages = messages.filter((m) => m.type === 'image' && m.mediaUrl);
  const sharedFiles = messages.filter((m) => m.type === 'file');

  const handleSetDisappearing = async (seconds) => {
    try {
      await fetch(`/api/chats/${activeChat.id}/disappearing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seconds })
      });
    } catch (e) {
      console.warn('Failed to set disappearing timer', e);
    }
  };

  const handleToggleBlock = async () => {
    if (!recipient) return;
    if (isRecipientBlocked) {
      await unblockUser(recipient.id);
    } else {
      if (window.confirm(`Are you sure you want to block ${recipient.name}? Blocked contacts cannot send you messages or call you.`)) {
        await blockUser(recipient.id);
      }
    }
  };

  const handleGroupAvatarChange = async (newAvatarUrl) => {
    await updateGroup(activeChat.id, { avatar: newAvatarUrl });
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Remove this member from the group?')) {
      await removeGroupParticipant(activeChat.id, userId);
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      await removeGroupParticipant(activeChat.id, currentUser);
      onClose();
    }
  };

  const groupParticipants = isGroup
    ? (activeChat.participants || []).map((pId) => allUsers.find((u) => u.id === pId) || { id: pId, name: 'Member' })
    : [];

  const nonMemberUsers = allUsers.filter(
    (u) => !activeChat.participants?.includes(u.id) && u.id !== currentUser
  );

  return (
    <>
      <div
        style={{
          width: '320px',
          height: '100%',
          backgroundColor: 'var(--bg-sidebar)',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 25,
          boxShadow: 'var(--shadow-md)',
          overflowY: 'auto'
        }}
      >
        {/* Drawer Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {isGroup ? 'Group Information' : 'Contact Details'}
          </h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Profile / Group Info Section */}
        <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
          <div
            className="avatar-wrapper"
            style={{ width: '84px', height: '84px', marginBottom: '12px', position: 'relative', cursor: isGroup ? 'pointer' : 'default' }}
            onClick={() => isGroup && setIsAvatarModalOpen(true)}
            title={isGroup ? 'Change group photo' : undefined}
          >
            {activeChat.avatar ? (
              <img src={activeChat.avatar} alt={activeChat.name} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder" style={{ fontSize: '32px' }}>
                {activeChat.isSavedMessages ? '📌' : activeChat.name.charAt(0)}
              </div>
            )}
            {isGroup && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--bg-sidebar)'
                }}
              >
                <Camera size={13} />
              </div>
            )}
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{activeChat.name}</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {recipient?.handle || (isGroup ? `${activeChat.participants?.length} members` : '')}
          </div>

          {activeChat.description && (
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
              {activeChat.description}
            </p>
          )}

          {recipient?.phone && (
            <div style={{ fontSize: '13px', color: 'var(--accent-primary)', marginTop: '4px', fontWeight: 600 }}>
              {recipient.phone}
            </div>
          )}

          {recipient?.bio && (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
              {recipient.bio}
            </p>
          )}
        </div>

        {/* Security & Verification Section */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Privacy & Encryption
          </div>

          {!isGroup && !activeChat.isSavedMessages && (
            <button
              onClick={() => setIsSafetyOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: 'rgba(16, 185, 129, 0.08)',
                color: 'var(--accent-green)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <ShieldCheck size={20} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 600 }}>End-to-End Encrypted</div>
                <div style={{ fontSize: '11px', opacity: 0.85 }}>Tap to verify 60-digit Safety Number</div>
              </div>
            </button>
          )}

          {/* Disappearing Messages Setting */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
              <Clock size={16} color="var(--accent-primary)" />
              <span>Disappearing Messages</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
              {[
                { label: 'Off', sec: null },
                { label: '24h', sec: 86400 },
                { label: '7d', sec: 604800 },
                { label: '30d', sec: 2592000 }
              ].map((opt) => {
                const isActive = activeChat.disappearingTimer === opt.sec;
                return (
                  <button
                    key={opt.label}
                    onClick={() => handleSetDisappearing(opt.sec)}
                    style={{
                      padding: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      background: isActive ? 'var(--accent-glow)' : 'transparent',
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Group Participants Section */}
        {isGroup && (
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Group Members ({groupParticipants.length})
              </div>
              {isCurrentUserAdmin && (
                <button
                  onClick={() => setIsAddMemberOpen(!isAddMemberOpen)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <UserPlus size={14} />
                  <span>Add</span>
                </button>
              )}
            </div>

            {/* Add Member Dropdown */}
            {isAddMemberOpen && (
              <div style={{ marginBottom: '12px', padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>SELECT CONTACT TO ADD</div>
                {nonMemberUsers.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>All contacts are already in this group</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                    {nonMemberUsers.map((u) => (
                      <div
                        key={u.id}
                        onClick={async () => {
                          await addGroupParticipant(activeChat.id, u.id);
                          setIsAddMemberOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          background: 'var(--bg-card)'
                        }}
                      >
                        <div className="avatar-wrapper" style={{ width: '24px', height: '24px' }}>
                          <img src={u.avatar} alt={u.name} className="avatar-img" />
                        </div>
                        <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 500 }}>{u.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Member List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {groupParticipants.map((member) => {
                const isAdmin = activeChat.admins?.includes(member.id) || activeChat.participants?.[0] === member.id;
                const isMe = member.id === currentUser;
                return (
                  <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="avatar-wrapper" style={{ width: '32px', height: '32px' }}>
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="avatar-img" />
                        ) : (
                          <div className="avatar-placeholder" style={{ fontSize: '12px' }}>{member.name?.charAt(0)}</div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {member.name} {isMe && '(You)'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{member.bio || member.handle}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isAdmin && (
                        <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-green)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          Admin
                        </span>
                      )}
                      {isCurrentUserAdmin && !isMe && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '4px' }}
                          title="Remove from group"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Shared Media & Files Tabs */}
        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '12px' }}>
            <button
              onClick={() => setActiveTab('media')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '13px',
                fontWeight: activeTab === 'media' ? 700 : 500,
                color: activeTab === 'media' ? 'var(--accent-primary)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              Media ({sharedImages.length})
            </button>
            <button
              onClick={() => setActiveTab('files')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '13px',
                fontWeight: activeTab === 'files' ? 700 : 500,
                color: activeTab === 'files' ? 'var(--accent-primary)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              Files ({sharedFiles.length})
            </button>
          </div>

          {activeTab === 'media' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {sharedImages.map((img) => (
                <img
                  key={img.id}
                  src={img.mediaUrl}
                  alt="Shared media"
                  style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                />
              ))}
              {sharedImages.length === 0 && (
                <div style={{ gridColumn: 'span 3', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '20px 0' }}>
                  No shared photos yet
                </div>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sharedFiles.map((file) => (
                <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                  <FileText size={16} color="var(--accent-green)" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.mediaName || 'Document'}
                  </span>
                </div>
              ))}
              {sharedFiles.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '20px 0' }}>
                  No shared files yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons at Bottom */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recipient && !recipient.isBot && !isGroup && (
            <button
              onClick={handleToggleBlock}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: isRecipientBlocked ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                background: isRecipientBlocked ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                color: isRecipientBlocked ? 'var(--accent-green)' : 'var(--accent-danger)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isRecipientBlocked ? (
                <>
                  <Unlock size={16} />
                  <span>Unblock {recipient.name.split(' ')[0]}</span>
                </>
              ) : (
                <>
                  <UserX size={16} />
                  <span>Block {recipient.name.split(' ')[0]}</span>
                </>
              )}
            </button>
          )}

          {isGroup && (
            <button
              onClick={handleLeaveGroup}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.08)',
                color: 'var(--accent-danger)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <LogOut size={16} />
              <span>Leave Group</span>
            </button>
          )}
        </div>
      </div>

      <SafetyNumberModal
        isOpen={isSafetyOpen}
        onClose={() => setIsSafetyOpen(false)}
        contact={recipient}
      />

      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSelectAvatar={handleGroupAvatarChange}
        currentAvatar={activeChat.avatar}
        title="Change Group Icon"
      />
    </>
  );
}
