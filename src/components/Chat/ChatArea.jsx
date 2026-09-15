import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import ChatHeader from './ChatHeader';
import PinnedBanner from './PinnedBanner';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ContactInfoDrawer from './ContactInfoDrawer';
import ForwardModal from './ForwardModal';
import { WALLPAPERS } from './WallpaperModal';
import { ShieldCheck, MessageSquare, Search, X, UserX, Unlock } from 'lucide-react';

export default function ChatArea() {
  const { activeChat, setActiveChatId, currentWallpaper, isBlocked, unblockUser } = useSocket();
  const [replyingTo, setReplyingTo] = useState(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [inChatSearch, setInChatSearch] = useState('');
  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);

  if (!activeChat) {
    return (
      <main className="chat-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ maxWidth: '360px', padding: '24px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--accent-glow)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <MessageSquare size={36} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>PulseChat Messenger</h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
            Select a conversation or start a new encrypted chat to begin messaging with end-to-end privacy.
          </p>
          <div style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--accent-green)', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 14px', borderRadius: 'var(--radius-full)' }}>
            <ShieldCheck size={14} />
            <span>Signal-Grade End-to-End Encryption</span>
          </div>
        </div>
      </main>
    );
  }

  const handleJumpToMessage = (messageId) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('message-highlight');
      setTimeout(() => el.classList.remove('message-highlight'), 1800);
    }
  };

  const activeWallpaperObj = WALLPAPERS.find((w) => w.id === currentWallpaper) || WALLPAPERS[0];
  const isRecipientBlocked = activeChat.recipient ? isBlocked(activeChat.recipient.id) : false;

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', position: 'relative', overflow: 'hidden' }}>
      <main
        className={`chat-area ${activeWallpaperObj.className || ''}`}
        style={{ ...activeWallpaperObj.style, position: 'relative' }}
      >
        <ChatHeader
          onBack={() => setActiveChatId(null)}
          onToggleInfo={() => setIsInfoOpen(!isInfoOpen)}
          onToggleSearch={() => {
            setIsSearchOpen(!isSearchOpen);
            if (isSearchOpen) setInChatSearch('');
          }}
        />

        {/* Collapsible in-chat search bar */}
        {isSearchOpen && (
          <div
            style={{
              padding: '8px 16px',
              background: 'var(--bg-card)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search in this conversation..."
              value={inChatSearch}
              onChange={(e) => setInChatSearch(e.target.value)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                fontSize: '13.5px',
                color: 'var(--text-primary)'
              }}
              autoFocus
            />
            <button
              className="icon-btn"
              style={{ width: '24px', height: '24px' }}
              onClick={() => {
                setIsSearchOpen(false);
                setInChatSearch('');
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <PinnedBanner onJumpToMessage={handleJumpToMessage} />

        <MessageList
          onReply={(msg) => setReplyingTo(msg)}
          onForward={(msg) => {
            setMessageToForward(msg);
            setIsForwardOpen(true);
          }}
          searchQuery={inChatSearch}
        />

        {/* If recipient is blocked, render blocked banner instead of input */}
        {isRecipientBlocked ? (
          <div
            style={{
              padding: '16px 20px',
              background: 'var(--bg-card)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              color: 'var(--text-secondary)',
              fontSize: '13.5px'
            }}
          >
            <UserX size={18} color="var(--accent-danger)" />
            <span>You have blocked this contact. You cannot send messages.</span>
            <button
              onClick={() => unblockUser(activeChat.recipient.id)}
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--accent-green)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Unlock size={14} />
              <span>Unblock</span>
            </button>
          </div>
        ) : (
          <MessageInput
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
        )}
      </main>

      {/* Slide-out Contact / Group Info Drawer */}
      <ContactInfoDrawer
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />

      {/* Forward Message Modal */}
      <ForwardModal
        isOpen={isForwardOpen}
        onClose={() => {
          setIsForwardOpen(false);
          setMessageToForward(null);
        }}
        messageToForward={messageToForward}
      />
    </div>
  );
}
