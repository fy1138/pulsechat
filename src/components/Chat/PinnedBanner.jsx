import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Pin, X } from 'lucide-react';

export default function PinnedBanner({ onJumpToMessage }) {
  const { activeChat, messages, togglePin } = useSocket();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!activeChat || !activeChat.pinnedMessageIds || activeChat.pinnedMessageIds.length === 0) {
    return null;
  }

  const pinnedIds = activeChat.pinnedMessageIds;
  const safeIndex = currentIndex % pinnedIds.length;
  const currentPinnedId = pinnedIds[safeIndex];
  const pinnedMessage = messages.find((m) => m.id === currentPinnedId);

  if (!pinnedMessage) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % pinnedIds.length);
  };

  return (
    <div className="pinned-banner">
      <div
        className="pinned-banner-content"
        onClick={() => onJumpToMessage(currentPinnedId)}
      >
        <div className="pinned-bar-line" />
        <Pin size={14} color="var(--accent-primary)" />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pinned-banner-text">
              Pinned Message {pinnedIds.length > 1 ? `(${safeIndex + 1}/${pinnedIds.length})` : ''}
            </span>
          </div>
          <div className="pinned-banner-body">
            {pinnedMessage.type === 'audio'
              ? '🎙️ Voice note'
              : pinnedMessage.type === 'image'
              ? '📷 Photo'
              : pinnedMessage.content}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {pinnedIds.length > 1 && (
          <button
            className="icon-btn"
            style={{ width: '28px', height: '28px', fontSize: '11px', fontWeight: 700 }}
            onClick={handleNext}
            title="Next pinned message"
          >
            Next
          </button>
        )}
        <button
          className="icon-btn"
          style={{ width: '28px', height: '28px' }}
          onClick={(e) => {
            e.stopPropagation();
            togglePin(currentPinnedId);
          }}
          title="Unpin message"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
