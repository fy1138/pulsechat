import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Send, Pause, Play, Heart } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export default function StatusViewerModal({ isOpen, onClose, userStories, initialIndex = 0 }) {
  const { currentUser, setActiveChatId, sendMessage, allUsers } = useSocket();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  const timerRef = useRef(null);
  const STORY_DURATION_MS = 5000;
  const UPDATE_INTERVAL_MS = 50;

  useEffect(() => {
    setCurrentStoryIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const activeStory = userStories[currentStoryIndex];

  // Auto-advancing timer
  useEffect(() => {
    if (!isOpen || !activeStory || isPaused) return;

    setProgress(0);
    const step = (UPDATE_INTERVAL_MS / STORY_DURATION_MS) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + step;
      });
    }, UPDATE_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, currentStoryIndex, isPaused, activeStory]);

  const handleNextStory = () => {
    if (currentStoryIndex < userStories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeStory) return;

    // Send direct message responding to status
    const targetUserId = activeStory.userId;
    const author = activeStory.user?.name || 'Status';

    // Find or create direct chat
    // Trigger reply message
    setReplyText('');
    onClose();
  };

  if (!isOpen || !activeStory) return null;

  const author = activeStory.user || { name: 'User', avatar: null };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    const diffMin = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60));
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ago`;
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        zIndex: 120,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div
        className="status-viewer-card"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        style={{
          width: '100%',
          maxWidth: '420px',
          height: '92vh',
          maxHeight: '750px',
          borderRadius: 'var(--radius-lg)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0a',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
        }}
      >
        {/* Top Segmented Progress Bars */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '12px 14px',
            display: 'flex',
            gap: '5px',
            zIndex: 20
          }}
        >
          {userStories.map((s, idx) => {
            let barWidth = '0%';
            if (idx < currentStoryIndex) barWidth = '100%';
            else if (idx === currentStoryIndex) barWidth = `${progress}%`;

            return (
              <div
                key={s.id || idx}
                style={{
                  flex: 1,
                  height: '3px',
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: barWidth,
                    backgroundColor: '#fff',
                    transition: idx === currentStoryIndex ? 'width 50ms linear' : 'none'
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Story Header (Author Info & Close) */}
        <div
          style={{
            position: 'absolute',
            top: '22px',
            left: 0,
            right: 0,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 20
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="avatar-wrapper" style={{ width: '38px', height: '38px', border: '2px solid #fff' }}>
              {author.avatar ? (
                <img src={author.avatar} alt={author.name} className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">{author.name?.charAt(0)}</div>
              )}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                {author.name}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                {formatTimeAgo(activeStory.createdAt)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="icon-btn"
              onClick={() => setIsPaused(!isPaused)}
              style={{ color: '#fff', background: 'rgba(0,0,0,0.4)', borderRadius: '50%', width: '32px', height: '32px' }}
            >
              {isPaused ? <Play size={15} /> : <Pause size={15} />}
            </button>
            <button
              className="icon-btn"
              onClick={onClose}
              style={{ color: '#fff', background: 'rgba(0,0,0,0.4)', borderRadius: '50%', width: '32px', height: '32px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Story Body */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {activeStory.type === 'photo' ? (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <img
                src={activeStory.mediaUrl}
                alt="Story content"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {activeStory.caption && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '70px',
                    left: '16px',
                    right: '16px',
                    padding: '12px 16px',
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: '14px',
                    lineHeight: 1.4,
                    textAlign: 'center'
                  }}
                >
                  {activeStory.caption}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: activeStory.background || 'linear-gradient(135deg, #10b981, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 24px',
                color: '#fff',
                fontSize: '22px',
                fontWeight: 700,
                textAlign: 'center',
                lineHeight: 1.4,
                wordBreak: 'break-word',
                textShadow: '0 2px 8px rgba(0,0,0,0.4)'
              }}
            >
              {activeStory.text}
            </div>
          )}

          {/* Left / Right Tap zones */}
          <div
            onClick={handlePrevStory}
            style={{
              position: 'absolute',
              top: '70px',
              bottom: '70px',
              left: 0,
              width: '35%',
              cursor: 'pointer',
              zIndex: 10
            }}
          />
          <div
            onClick={handleNextStory}
            style={{
              position: 'absolute',
              top: '70px',
              bottom: '70px',
              right: 0,
              width: '35%',
              cursor: 'pointer',
              zIndex: 10
            }}
          />
        </div>

        {/* Bottom Reply Bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 16px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 20
          }}
        >
          <form onSubmit={handleSendReply} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder={`Reply to ${author.name}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(10px)',
                color: '#fff',
                fontSize: '13.5px',
                outline: 'none'
              }}
            />
          </form>

          <button
            className="icon-btn"
            onClick={() => setIsLiked(!isLiked)}
            style={{
              color: isLiked ? '#ef4444' : '#fff',
              background: 'rgba(0,0,0,0.4)',
              borderRadius: '50%',
              width: '38px',
              height: '38px'
            }}
          >
            <Heart size={18} fill={isLiked ? '#ef4444' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  );
}
