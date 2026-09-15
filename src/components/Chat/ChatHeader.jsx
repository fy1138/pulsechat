import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { ChevronLeft, ShieldCheck, Phone, Video, Search, MoreVertical, Clock, Image as ImageIcon, UserX, Unlock, Info } from 'lucide-react';
import SafetyNumberModal from './SafetyNumberModal';
import WallpaperModal from './WallpaperModal';

export default function ChatHeader({ onBack, onToggleInfo, onToggleSearch }) {
  const { activeChat, userPresence, activeChatTyping, startCall, allUsers, isBlocked, blockUser, unblockUser } = useSocket();
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!activeChat) return null;

  const recipient = activeChat.recipient;
  const isRecipientBlocked = recipient ? isBlocked(recipient.id) : false;
  const isOnline = recipient ? userPresence[recipient.id]?.status === 'online' : false;
  const isTyping = activeChatTyping.length > 0;

  // Typing user names for group
  const typingUserNames = activeChatTyping.map((id) => {
    const u = allUsers.find((user) => user.id === id);
    return u ? u.name.split(' ')[0] : 'Someone';
  });

  const getSubtitle = () => {
    if (isRecipientBlocked) {
      return 'Contact is blocked';
    }
    if (isTyping) {
      return `${typingUserNames.join(', ')} is typing...`;
    }
    if (activeChat.isGroup) {
      return `${activeChat.participants.length} members • encrypted`;
    }
    if (activeChat.isSavedMessages) {
      return 'Cloud storage notes';
    }
    if (recipient?.isBot) {
      return 'AI Bot • Always Available';
    }
    if (isOnline) {
      return 'Online';
    }
    return recipient?.lastSeen ? `Last seen recently` : 'Offline';
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
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="chat-header" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {/* Mobile Back Button */}
          <button
            className="icon-btn mobile-back-btn"
            onClick={onBack}
            title="Back to conversations"
            style={{ marginRight: '-4px' }}
          >
            <ChevronLeft size={22} />
          </button>

          {/* Contact / Group Info Trigger */}
          <div className="chat-header-info" onClick={onToggleInfo}>
            <div className="avatar-wrapper" style={{ width: '40px', height: '40px' }}>
              {activeChat.avatar ? (
                <img src={activeChat.avatar} alt={activeChat.name} className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  {activeChat.isSavedMessages ? '📌' : activeChat.name.charAt(0)}
                </div>
              )}
              {!activeChat.isGroup && !activeChat.isSavedMessages && (
                <span className={`presence-badge ${isOnline ? 'online' : 'offline'}`} />
              )}
            </div>

            <div className="chat-header-text">
              <div className="chat-header-title">
                <span>{activeChat.name}</span>
                {activeChat.disappearingTimer && (
                  <span title="Disappearing messages enabled" style={{ display: 'inline-flex', color: 'var(--text-muted)' }}>
                    <Clock size={13} />
                  </span>
                )}
                {isRecipientBlocked && (
                  <span style={{ fontSize: '10.5px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    BLOCKED
                  </span>
                )}
              </div>
              <div className={`chat-header-subtitle ${isTyping ? 'typing' : ''} ${isRecipientBlocked ? 'blocked' : ''}`}>
                {getSubtitle()}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="header-actions">
          {activeChat.isEncrypted && !activeChat.isSavedMessages && (
            <button
              className="e2ee-shield-tag"
              onClick={() => setIsSafetyModalOpen(true)}
              title="View End-to-End Encryption Safety Number"
            >
              <ShieldCheck size={13} />
              <span>E2EE</span>
            </button>
          )}

          {!activeChat.isSavedMessages && !isRecipientBlocked && (
            <>
              <button
                className="icon-btn"
                onClick={() => startCall(false)}
                title="Start Audio Call"
              >
                <Phone size={18} />
              </button>

              <button
                className="icon-btn"
                onClick={() => startCall(true)}
                title="Start Video Call"
              >
                <Video size={18} />
              </button>
            </>
          )}

          <button
            className="icon-btn"
            onClick={onToggleSearch}
            title="Search in conversation"
          >
            <Search size={18} />
          </button>

          <div style={{ position: 'relative' }}>
            <button
              className="icon-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title="More options"
            >
              <MoreVertical size={18} />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  padding: '6px',
                  zIndex: 50,
                  minWidth: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
              >
                <button
                  className="dropdown-item"
                  onClick={() => {
                    onToggleInfo();
                    setIsMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Info size={16} color="var(--text-muted)" />
                  <span>{activeChat.isGroup ? 'Group Information' : 'Contact Details'}</span>
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => {
                    setIsWallpaperModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <ImageIcon size={16} color="var(--accent-primary)" />
                  <span>Change Wallpaper</span>
                </button>

                {recipient && !recipient.isBot && !activeChat.isGroup && (
                  <button
                    className="dropdown-item"
                    onClick={handleToggleBlock}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      color: isRecipientBlocked ? 'var(--accent-green)' : 'var(--accent-danger)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {isRecipientBlocked ? (
                      <>
                        <Unlock size={16} />
                        <span>Unblock Contact</span>
                      </>
                    ) : (
                      <>
                        <UserX size={16} />
                        <span>Block Contact</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <SafetyNumberModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        contact={recipient}
      />

      <WallpaperModal
        isOpen={isWallpaperModalOpen}
        onClose={() => setIsWallpaperModalOpen(false)}
      />
    </>
  );
}
