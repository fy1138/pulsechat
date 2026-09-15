import React, { useState, useRef } from 'react';
import { X, Upload, Camera, Sparkles, Check, Image as ImageIcon } from 'lucide-react';
import CameraCaptureModal from './CameraCaptureModal';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://api.dicebear.com/7.x/bottts/svg?seed=pulse',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=cyber',
  'https://api.dicebear.com/7.x/bottts/svg?seed=rocket'
];

export default function AvatarUploadModal({ isOpen, onClose, onSelectAvatar, currentAvatar, title = 'Change Picture' }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'camera' | 'presets'
  const [selectedPreview, setSelectedPreview] = useState(currentAvatar || '');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraPhoto = (dataUrl) => {
    setSelectedPreview(dataUrl);
    setIsCameraOpen(false);
  };

  const handleSave = () => {
    if (selectedPreview) {
      onSelectAvatar(selectedPreview);
      onClose();
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 105 }}>
        <div
          className="modal-card"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '440px', width: '100%', padding: 0, overflow: 'hidden' }}
        >
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
            <button className="icon-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {/* Tab Bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-input)' }}>
            <button
              onClick={() => setActiveTab('upload')}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '13px',
                fontWeight: activeTab === 'upload' ? 700 : 500,
                color: activeTab === 'upload' ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'upload' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Upload size={15} />
              <span>Upload</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('camera');
                setIsCameraOpen(true);
              }}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '13px',
                fontWeight: activeTab === 'camera' ? 700 : 500,
                color: activeTab === 'camera' ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'camera' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Camera size={15} />
              <span>Take Photo</span>
            </button>

            <button
              onClick={() => setActiveTab('presets')}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '13px',
                fontWeight: activeTab === 'presets' ? 700 : 500,
                color: activeTab === 'presets' ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'presets' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={15} />
              <span>Presets</span>
            </button>
          </div>

          {/* Content Area */}
          <div style={{ padding: '20px' }}>
            {/* Live Circular Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
              <div
                className="avatar-wrapper"
                style={{
                  width: '96px',
                  height: '96px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  border: '3px solid var(--accent-primary)'
                }}
              >
                {selectedPreview ? (
                  <img src={selectedPreview} alt="Preview" className="avatar-img" />
                ) : (
                  <div className="avatar-placeholder" style={{ fontSize: '36px' }}>
                    <ImageIcon size={36} color="var(--text-muted)" />
                  </div>
                )}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Preview Photo
              </span>
            </div>

            {/* Tab 1: Upload File */}
            {activeTab === 'upload' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border-medium)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'var(--bg-hover)',
                    transition: 'border-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
                >
                  <Upload size={28} color="var(--accent-primary)" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Choose a photo from your device
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Supports JPG, PNG, WebP or GIF (Max 10MB)
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Take Photo */}
            {activeTab === 'camera' && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <button
                  className="icon-btn primary"
                  onClick={() => setIsCameraOpen(true)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '14px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Camera size={18} />
                  <span>Launch Live Camera</span>
                </button>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Capture a photo using your webcam or phone camera
                </div>
              </div>
            )}

            {/* Tab 3: Presets */}
            {activeTab === 'presets' && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
                  CHOOSE A PRESET AVATAR
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                  {PRESET_AVATARS.map((avatar, idx) => {
                    const isSelected = selectedPreview === avatar;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedPreview(avatar)}
                        className="avatar-wrapper"
                        style={{
                          width: '54px',
                          height: '54px',
                          cursor: 'pointer',
                          border: isSelected ? '3px solid var(--accent-primary)' : '2px solid transparent',
                          transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <img src={avatar} alt="Preset" className="avatar-img" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'var(--bg-card)' }}>
            <button className="icon-btn" onClick={onClose} style={{ width: 'auto', padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
              Cancel
            </button>
            <button
              className="icon-btn primary"
              onClick={handleSave}
              disabled={!selectedPreview}
              style={{
                width: 'auto',
                padding: '8px 20px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Check size={16} />
              <span>Apply Photo</span>
            </button>
          </div>
        </div>
      </div>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapturePhoto={handleCameraPhoto}
      />
    </>
  );
}
