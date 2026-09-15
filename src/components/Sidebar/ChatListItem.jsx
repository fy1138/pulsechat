import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { ShieldCheck, Pin, Mic, Image, FileText, Check, CheckCheck } from 'lucide-react';

function formatTimestamp(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();

  // If same day
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // If yesterday
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  // Otherwise formatted date
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ChatListItem({ chat, isActive, onClick }) {
  const { currentUser, userPresence, activeChatTyping } = useSocket();

  const recipient = chat.recipient;
  const isOnline = recipient ? userPresence[recipient.id]?.status === 'online' : false;
  const isTyping = (chat.isGroup ? false : activeChatTyping.length > 0) || false;
  const unread = chat.unreadCount?.[currentUser] || 0;
  const lastMsg = chat.lastMessage;
  const hasPins = chat.pinnedMessageIds && chat.pinnedMessageIds.length > 0;

  // Render Last message snippet
  const renderMessageSnippet = () => {
    if (isTyping) {
      return (
        <span className="typing-indicator-text">
          <span>typing</span>
          <span className="dot-anim">...</span>
        </span>
      );
    }
    if (!lastMsg) {
      return <span>No messages yet</span>;
    }

    const isMine = lastMsg.senderId === currentUser;

    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {isMine && (
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {lastMsg.status === 'read' ? (
              <CheckCheck size={14} className="tick-icon read" />
            ) : lastMsg.status === 'delivered' ? (
              <CheckCheck size={14} className="tick-icon" />
            ) : (
              <Check size={14} className="tick-icon" />
            )}
          </span>
        )}

        {lastMsg.type === 'audio' && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <Mic size={13} /> Voice note
          </span>
        )}

        {lastMsg.type === 'image' && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <Image size={13} /> Photo
          </span>
        )}

        {lastMsg.type === 'file' && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <FileText size={13} /> Document
          </span>
        )}

        {lastMsg.type === 'text' && (
          <span>{lastMsg.content}</span>
        )}
      </span>
    );
  };

  return (
    <button
      className={`chat-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
      id={`chat-item-${chat.id}`}
    >
      <div className="avatar-wrapper">
        {chat.avatar ? (
          <img src={chat.avatar} alt={chat.name} className="avatar-img" />
        ) : (
          <div className="avatar-placeholder">
            {chat.isSavedMessages ? '📌' : chat.name.charAt(0)}
          </div>
        )}
        {!chat.isGroup && !chat.isSavedMessages && (
          <span className={`presence-badge ${isOnline ? 'online' : 'offline'}`} />
        )}
      </div>

      <div className="chat-item-content">
        <div className="chat-item-top">
          <span className="chat-item-name">
            {chat.name}
            {chat.isEncrypted && (
              <span className="lock-badge" title="End-to-End Encrypted">
                <ShieldCheck size={13} />
              </span>
            )}
          </span>
          <span className="chat-item-time">
            {formatTimestamp(lastMsg?.timestamp || chat.updatedAt)}
          </span>
        </div>

        <div className="chat-item-bottom">
          <div className="chat-item-preview">
            {renderMessageSnippet()}
          </div>

          <div className="chat-item-meta">
            {hasPins && <Pin size={13} className="pin-icon" />}
            {unread > 0 && <span className="unread-badge">{unread}</span>}
          </div>
        </div>
      </div>
    </button>
  );
}
