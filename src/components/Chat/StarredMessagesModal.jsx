import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { X, Star, ArrowRight, FileText, Image, Mic } from 'lucide-react';

export default function StarredMessagesModal({ isOpen, onClose }) {
  const { currentUser, setActiveChatId, toggleStar, chats } = useSocket();
  const [starredMessages, setStarredMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      setLoading(true);
      fetch(`/api/messages/starred?userId=${currentUser}`)
        .then((res) => res.json())
        .then((data) => setStarredMessages(data))
        .catch(console.warn)
        .finally(() => setLoading(false));
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleJump = (msg) => {
    setActiveChatId(msg.chatId);
    onClose();
  };

  const handleUnstar = (msgId) => {
    toggleStar(msgId);
    setStarredMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={18} color="#eab308" fill="#eab308" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Starred Messages</h3>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '14px 16px', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading starred messages...</div>
          ) : starredMessages.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Star size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <div style={{ fontSize: '14px', fontWeight: 600 }}>No Starred Messages</div>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Hover any message bubble and tap the star icon to bookmark it here.</p>
            </div>
          ) : (
            starredMessages.map((msg) => {
              const chat = chats.find((c) => c.id === msg.chatId);
              return (
                <div
                  key={msg.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {chat ? chat.name : 'Conversation'}
                    </span>
                    <button
                      className="icon-btn"
                      style={{ width: '22px', height: '22px' }}
                      onClick={() => handleUnstar(msg.id)}
                      title="Unstar message"
                    >
                      <Star size={14} color="#eab308" fill="#eab308" />
                    </button>
                  </div>

                  <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {msg.type === 'image' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)' }}>
                        <Image size={15} /> <span>Photo attachment</span>
                      </div>
                    )}
                    {msg.type === 'audio' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)' }}>
                        <Mic size={15} /> <span>Voice note ({msg.audioDuration || 10}s)</span>
                      </div>
                    )}
                    {msg.type === 'file' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-green)' }}>
                        <FileText size={15} /> <span>{msg.mediaName || 'Document'}</span>
                      </div>
                    )}
                    {msg.content}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(msg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => handleJump(msg)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Go to chat</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
