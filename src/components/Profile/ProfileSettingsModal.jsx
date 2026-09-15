import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { X, User, Phone, Shield, LogOut, Check, Camera, UserX, Unlock } from 'lucide-react';
import AvatarUploadModal from '../Common/AvatarUploadModal';

export default function ProfileSettingsModal({ isOpen, onClose, onOpenAuth }) {
  const { currentUser: authUser, updateProfile, logout } = useAuth();
  const { currentUser: socketUserId, allUsers, blockedUsers, unblockUser } = useSocket();

  const activeUser = authUser || allUsers.find((u) => u.id === socketUserId) || {};

  const [name, setName] = useState(activeUser.name || '');
  const [bio, setBio] = useState(activeUser.bio || '');
  const [phone, setPhone] = useState(activeUser.phone || '');
  const [avatar, setAvatar] = useState(activeUser.avatar || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({ name, bio, phone, avatar });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      console.warn('Save profile error', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoutClick = () => {
    logout();
    onClose();
    onOpenAuth();
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Profile & Settings</h3>
            <button className="icon-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Avatar Section with Camera Edit Trigger */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '8px' }}>
              <div
                onClick={() => setIsAvatarModalOpen(true)}
                className="avatar-wrapper"
                style={{ width: '84px', height: '84px', marginBottom: '8px', cursor: 'pointer', position: 'relative' }}
                title="Change profile picture"
              >
                {avatar ? (
                  <img src={avatar} alt={name} className="avatar-img" />
                ) : (
                  <div className="avatar-placeholder" style={{ fontSize: '30px' }}>{name.charAt(0) || 'U'}</div>
                )}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--bg-card)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <Camera size={14} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--accent-primary)',
                  cursor: 'pointer'
                }}
              >
                Change Photo (Upload or Camera)
              </button>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{activeUser.handle}</div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>DISPLAY NAME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', marginTop: '4px', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>PHONE</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', marginTop: '4px', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>BIO</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                style={{ width: '100%', marginTop: '4px', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
              />
            </div>

            {/* Signal Safety Number */}
            <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--accent-green)' }}>
                <Shield size={14} />
                <span>YOUR SIGNAL SAFETY NUMBER</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', wordBreak: 'break-all' }}>
                {activeUser.safetyNumber || 'Verified Cryptographic Identity'}
              </div>
            </div>

            {/* Blocked Contacts Section */}
            <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                <UserX size={14} color="var(--accent-danger)" />
                <span>BLOCKED CONTACTS ({blockedUsers.length})</span>
              </div>

              {blockedUsers.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px 0' }}>
                  No blocked contacts
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {blockedUsers.map((bUser) => (
                    <div
                      key={bUser.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="avatar-wrapper" style={{ width: '28px', height: '28px' }}>
                          {bUser.avatar ? (
                            <img src={bUser.avatar} alt={bUser.name} className="avatar-img" />
                          ) : (
                            <div className="avatar-placeholder" style={{ fontSize: '12px' }}>{bUser.name.charAt(0)}</div>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {bUser.name}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => unblockUser(bUser.id)}
                        style={{
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: 'var(--accent-green)',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Unlock size={12} />
                        <span>Unblock</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                type="submit"
                className="icon-btn primary"
                style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '13.5px', fontWeight: 600 }}
                disabled={isSaving}
              >
                {isSaved ? 'Changes Saved ✓' : isSaving ? 'Saving...' : 'Save Profile'}
              </button>
              <button
                type="button"
                onClick={handleLogoutClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: 'var(--accent-danger)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSelectAvatar={(url) => setAvatar(url)}
        currentAvatar={avatar}
        title="Profile Photo"
      />
    </>
  );
}
