import React, { useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import MessageBubble from './MessageBubble';
import { Clock } from 'lucide-react';

function getDateLabel(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return 'Today';
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function MessageList({ onReply, onForward, searchQuery }) {
  const { messages, activeChat } = useSocket();
  const bottomRef = useRef(null);
  const listContainerRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleJumpToMessage = (messageId) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('message-highlight');
      setTimeout(() => el.classList.remove('message-highlight'), 1800);
    }
  };

  // Group messages by calendar date
  let lastDateLabel = null;

  const filteredMessages = messages.filter((m) => {
    if (!searchQuery) return true;
    return m.content?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="message-list" ref={listContainerRef}>
      {filteredMessages.map((message) => {
        const dateLabel = getDateLabel(message.timestamp);
        const showDateSeparator = dateLabel !== lastDateLabel;
        lastDateLabel = dateLabel;

        if (message.type === 'system') {
          return (
            <React.Fragment key={message.id}>
              {showDateSeparator && <div className="date-separator">{dateLabel}</div>}
              <div className="system-message-bubble">
                <Clock size={14} color="var(--accent-primary)" />
                <span>{message.content}</span>
              </div>
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={message.id}>
            {showDateSeparator && <div className="date-separator">{dateLabel}</div>}
            <MessageBubble
              message={message}
              isGroup={activeChat?.isGroup}
              onReply={onReply}
              onForward={onForward}
              onJumpToMessage={handleJumpToMessage}
            />
          </React.Fragment>
        );
      })}
      <div ref={bottomRef} style={{ height: '4px' }} />
    </div>
  );
}
