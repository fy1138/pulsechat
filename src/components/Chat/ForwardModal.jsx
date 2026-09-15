import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { X, Forward, Check } from 'lucide-react';

export default function ForwardModal({ isOpen, onClose, messageToForward }) {
  const { chats, forwardMessage, currentUser } = useSocket();
  const [selectedChatIds, setSelectedChatIds] = useState([]);

  if (!isOpen || !messageToForward) return null;

  const toggleSelectChat = (chatId) => {
    setSelectedChatIds((prev) =>
      prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId]
    );
  };

  const handleConfirmForward = () => {
    if (selectedChatIds.length === 0) return;
    forwardMessage(messageToForward, selectedChatIds);
    onClose();
    setSelectedChatIds([]);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Forward size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Forward Message</h3>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '12px 16px', maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {chats.map((chat) => {
            const isSelected = selectedChatIds.includes(chat.id);
            return (
              <div
                key={chat.id}
                onClick={() => toggleSelectChat(chat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--bg-active)' : 'transparent',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  cursor: 'pointer'
                }}
              >
                <div className="avatar-wrapper" style={{ width: '38px', height: '38px' }}>
                  {chat.avatar ? (
                    <img src={chat.avatar} alt={chat.name} className="avatar-img" />
                  ) : (
                    <div className="avatar-placeholder">{chat.name.charAt(0)}</div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {chat.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {chat.isGroup ? `${chat.participants?.length} members` : 'Direct Chat'}
                  </div>
                </div>

                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: isSelected ? 'none' : '2px solid var(--border-medium)',
                    background: isSelected ? 'var(--accent-primary)' : 'transparent',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isSelected && <Check size={14} />}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="icon-btn" style={{ width: 'auto', padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '13px' }} onClick={onClose}>
            Cancel
          </button>
          <button
            className="icon-btn primary"
            style={{ width: 'auto', padding: '8px 18px', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 600 }}
            disabled={selectedChatIds.length === 0}
            onClick={handleConfirmForward}
          >
            Forward to {selectedChatIds.length} Chat{selectedChatIds.length > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
