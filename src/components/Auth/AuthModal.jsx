import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Lock, User, AtSign, Phone, Mail, Sparkles, X, Shield, ArrowRight, Camera, Check } from 'lucide-react';
import AvatarUploadModal from '../Common/AvatarUploadModal';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
];

export default function AuthModal({ isOpen, onClose, isMandatory = false }) {
  const { login, register, authError, setAuthError } = useAuth();
  
  let socketContext = null;
  try {
    socketContext = useSocket();
  } catch (e) {
    // Rendered outside SocketProvider
  }

  const [tab, setTab] = useState('login'); // 'login' | 'register'

  // Login form state
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regHandle, setRegHandle] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('password123');
  const [regBio, setRegBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginId.trim()) {
      setAuthError('Please enter your email, phone, or username');
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await login(loginId.trim(), loginPassword);
      socketContext?.switchUser?.(user.id);
      socketContext?.refreshChats?.();
      onClose?.();
    } catch (err) {
      console.warn('Login failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (identifier) => {
    setLoginId(identifier);
    setLoginPassword('password123');
    setIsSubmitting(true);
    try {
      const user = await login(identifier, 'password123');
      socketContext?.switchUser?.(user.id);
      socketContext?.refreshChats?.();
      onClose?.();
    } catch (err) {
      console.warn('Quick login failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regHandle.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword) {
      setAuthError('All required fields (Name, Username, Email, Phone, Password) must be completed');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setAuthError('Please enter a valid email address (e.g. name@example.com)');
      return;
    }

    if (regPhone.trim().length < 6) {
      setAuthError('Please enter a valid phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await register({
        name: regName.trim(),
        handle: regHandle.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        avatar: selectedAvatar,
        bio: regBio.trim()
      });
      socketContext?.switchUser?.(user.id);
      socketContext?.refreshChats?.();
      onClose?.();
    } catch (err) {
      console.warn('Register failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={isMandatory ? undefined : onClose}
      style={{
        zIndex: 9999,
        background: isMandatory ? 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.99))' : undefined,
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(56, 189, 248, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 'var(--radius-lg, 16px)',
          overflow: 'hidden'
        }}
      >
        {/* Header Branding */}
        <div style={{ padding: '24px 24px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--accent-primary), #0284c7)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)'
              }}
            >
              <Shield size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', margin: 0 }}>PulseChat</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>End-to-End Encrypted Messenger</p>
            </div>
          </div>
          {!isMandatory && onClose && (
            <button className="icon-btn" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-input)' }}>
          <button
            type="button"
            onClick={() => { setTab('login'); setAuthError(''); }}
            style={{
              flex: 1,
              padding: '14px',
              border: 'none',
              background: tab === 'login' ? 'var(--bg-card)' : 'transparent',
              color: tab === 'login' ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: tab === 'login' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setAuthError(''); }}
            style={{
              flex: 1,
              padding: '14px',
              border: 'none',
              background: tab === 'register' ? 'var(--bg-card)' : 'transparent',
              color: tab === 'register' ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: tab === 'register' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {authError && (
          <div style={{ margin: '14px 20px 0', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--accent-danger)', fontSize: '13px' }}>
            {authError}
          </div>
        )}

        {/* Sign In Form */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Email, Phone, or Username
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <AtSign size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="alex@pulsechat.io or @alexrivers"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '14px' }}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Password
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <Lock size={16} color="var(--text-muted)" />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '14px' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="icon-btn primary"
              disabled={isSubmitting || !loginId}
              style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: 700, marginTop: '6px' }}
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In to PulseChat'}
            </button>

            {/* Quick Demo Sign In row */}
            <div style={{ marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={13} color="var(--accent-primary)" />
                <span>1-Click Demo Profiles (For Instant Testing)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { name: 'Alex Rivers', id: 'alex@pulsechat.io', handle: '@alexrivers' },
                  { name: 'Elena Rostova', id: 'elena@pulsechat.io', handle: '@elena_dev' },
                  { name: 'Sarah Chen', id: 'sarah@pulsechat.io', handle: '@sarahchen' },
                  { name: 'Marcus Vance', id: 'marcus@pulsechat.io', handle: '@marcus_v' }
                ].map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => handleQuickDemoLogin(demo.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div>
                      <div>{demo.name.split(' ')[0]}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{demo.handle}</div>
                    </div>
                    <ArrowRight size={13} color="var(--accent-primary)" />
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* Create Account Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '520px', overflowY: 'auto' }}>
            {/* Avatar Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '4px' }}>
              <div
                onClick={() => setIsAvatarModalOpen(true)}
                className="avatar-wrapper"
                style={{ width: '74px', height: '74px', cursor: 'pointer', position: 'relative', border: '2px dashed var(--accent-primary)', marginBottom: '6px' }}
                title="Upload or Take Photo with Camera"
              >
                {selectedAvatar ? (
                  <img src={selectedAvatar} alt="Profile" className="avatar-img" />
                ) : (
                  <div className="avatar-placeholder" style={{ fontSize: '24px' }}>U</div>
                )}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--bg-card)'
                  }}
                >
                  <Camera size={12} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                style={{ background: 'none', border: 'none', fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer' }}
              >
                Upload Photo or Take with Camera
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                {AVATAR_PRESETS.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="Preset"
                    onClick={() => setSelectedAvatar(url)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      border: selectedAvatar === url ? '2px solid var(--accent-primary)' : '1px solid transparent',
                      transform: selectedAvatar === url ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.15s ease'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Full Name <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <User size={15} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="e.g. Jordan Miller"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '13.5px' }}
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Username / Handle <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <AtSign size={15} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="jordan_dev"
                  value={regHandle}
                  onChange={(e) => setRegHandle(e.target.value)}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '13.5px' }}
                  required
                />
              </div>
            </div>

            {/* Email (REQUIRED) */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Email Address <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <Mail size={15} color="var(--text-muted)" />
                <input
                  type="email"
                  placeholder="jordan@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '13.5px' }}
                  required
                />
              </div>
            </div>

            {/* Phone (REQUIRED) */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Phone Number <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <Phone size={15} color="var(--text-muted)" />
                <input
                  type="tel"
                  placeholder="+1 (555) 012-3456"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '13.5px' }}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Password <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <Lock size={15} color="var(--text-muted)" />
                <input
                  type="password"
                  placeholder="Create a strong password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '13.5px' }}
                  required
                />
              </div>
            </div>

            {/* Bio (Optional) */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                About / Bio (Optional)
              </label>
              <input
                type="text"
                placeholder="Software engineer & cyclist 🚲"
                value={regBio}
                onChange={(e) => setRegBio(e.target.value)}
                style={{ width: '100%', marginTop: '4px', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '13.5px', outline: 'none' }}
              />
            </div>

            <button
              type="submit"
              className="icon-btn primary"
              disabled={isSubmitting || !regName || !regHandle || !regEmail || !regPhone}
              style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: 700, marginTop: '8px' }}
            >
              {isSubmitting ? 'Creating Account...' : 'Complete Registration & Start Chatting'}
            </button>
          </form>
        )}
      </div>

      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSelectAvatar={(url) => setSelectedAvatar(url)}
        currentAvatar={selectedAvatar}
        title="Choose Profile Picture"
      />
    </div>
  );
}
