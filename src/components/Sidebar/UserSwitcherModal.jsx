import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { X, Check, ShieldCheck, Sparkles, User } from 'lucide-react';

export default function UserSwitcherModal({ isOpen, onClose }) {
  const { allUsers, currentUser, switchUser } = useSocket();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Switch Active Account</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Test real-time messaging between multiple identities</p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
          {allUsers.map((user) => {
            const isSelected = user.id === currentUser;
            return (
              <div
                key={user.id}
                onClick={() => {
                  switchUser(user.id);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-input)',
                  border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
                    {user.isBot && (
                      <span style={{ fontSize: '10px', background: 'var(--accent-glow)', color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                        BOT
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.bio}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {user.phone}
                  </div>
                </div>

                {isSelected ? (
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={16} />
                  </div>
                ) : (
                  <button className="icon-btn" style={{ fontSize: '12px', width: 'auto', padding: '4px 10px', borderRadius: 'var(--radius-sm)' }}>
                    Switch
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '14px 20px', background: 'var(--bg-input)', borderTop: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="var(--accent-primary)" />
          <span>Tip: Open another browser tab or Incognito window to chat between two users in real-time!</span>
        </div>
      </div>
    </div>
  );
}
