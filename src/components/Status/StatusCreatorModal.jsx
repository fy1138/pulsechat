import React, { useState, useRef } from 'react';
import { X, Type, Image as ImageIcon, Camera, Check, Palette } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import CameraCaptureModal from '../Common/CameraCaptureModal';

const GRADIENTS = [
  'linear-gradient(135deg, #059669, #10b981)', // WhatsApp Emerald
  'linear-gradient(135deg, #4f46e5, #7c3aed)', // Telegram Violet
  'linear-gradient(135deg, #f97316, #ef4444)', // Sunset Orange
  'linear-gradient(135deg, #06b6d4, #3b82f6)', // Ocean Blue
  'linear-gradient(135deg, #ec4899, #8b5cf6)', // Magenta Neon
  'linear-gradient(135deg, #1e293b, #0f172a)'  // Midnight Dark
];

export default function StatusCreatorModal({ isOpen, onClose }) {
  const { currentUser, addStory } = useSocket();
  const [statusType, setStatusType] = useState('text'); // 'text' | 'photo'
  const [textContent, setTextContent] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoUrl(event.target.result);
      setStatusType('photo');
    };
    reader.readAsDataURL(file);
  };

  const handleCameraPhoto = (dataUrl) => {
    setPhotoUrl(dataUrl);
    setStatusType('photo');
    setIsCameraOpen(false);
  };

  const handlePublish = async () => {
    if (statusType === 'text' && !textContent.trim()) return;
    if (statusType === 'photo' && !photoUrl) return;

    setIsSubmitting(true);
    try {
      if (statusType === 'text') {
        await addStory({
          type: 'text',
          text: textContent.trim(),
          background: selectedGradient
        });
      } else {
        await addStory({
          type: 'photo',
          mediaUrl: photoUrl,
          caption: caption.trim()
        });
      }
      onClose();
    } catch (err) {
      console.warn('Publish story error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
        <div
          className="modal-card"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '440px', width: '100%', padding: 0, overflow: 'hidden' }}
        >
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>New Status Update</h3>
            <button className="icon-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-input)' }}>
            <button
              onClick={() => setStatusType('text')}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '13px',
                fontWeight: statusType === 'text' ? 700 : 500,
                color: statusType === 'text' ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                borderBottom: statusType === 'text' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Type size={15} />
              <span>Text Status</span>
            </button>

            <button
              onClick={() => setStatusType('photo')}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '13px',
                fontWeight: statusType === 'photo' ? 700 : 500,
                color: statusType === 'photo' ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                borderBottom: statusType === 'photo' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <ImageIcon size={15} />
              <span>Photo Status</span>
            </button>
          </div>

          {/* Content Area */}
          <div style={{ padding: '20px' }}>
            {statusType === 'text' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Live Preview Card */}
                <div
                  style={{
                    height: '200px',
                    borderRadius: 'var(--radius-lg)',
                    background: selectedGradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    position: 'relative'
                  }}
                >
                  <textarea
                    placeholder="Type a status update..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    maxLength={180}
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '18px',
                      fontWeight: 700,
                      textAlign: 'center',
                      outline: 'none',
                      resize: 'none',
                      lineHeight: 1.4,
                      textShadow: '0 1px 4px rgba(0,0,0,0.3)'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '12px',
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.7)'
                    }}
                  >
                    {textContent.length}/180
                  </div>
                </div>

                {/* Color Gradient Palette */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Palette size={14} />
                    <span>SELECT BACKGROUND</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {GRADIENTS.map((grad, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedGradient(grad)}
                        style={{
                          flex: 1,
                          height: '32px',
                          borderRadius: 'var(--radius-sm)',
                          background: grad,
                          border: selectedGradient === grad ? '2px solid #fff' : '2px solid transparent',
                          boxShadow: selectedGradient === grad ? '0 0 0 2px var(--accent-primary)' : 'none',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />

                {photoUrl ? (
                  <div style={{ position: 'relative', height: '220px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <img src={photoUrl} alt="Status photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      className="icon-btn"
                      onClick={() => setPhotoUrl('')}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="icon-btn"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        flex: 1,
                        padding: '24px 16px',
                        border: '2px dashed var(--border-medium)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'var(--bg-hover)'
                      }}
                    >
                      <ImageIcon size={28} color="var(--accent-primary)" />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>Upload Image</span>
                    </button>

                    <button
                      className="icon-btn"
                      onClick={() => setIsCameraOpen(true)}
                      style={{
                        flex: 1,
                        padding: '24px 16px',
                        border: '2px dashed var(--border-medium)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'var(--bg-hover)'
                      }}
                    >
                      <Camera size={28} color="var(--accent-primary)" />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>Take Photo</span>
                    </button>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>ADD A CAPTION</label>
                  <input
                    type="text"
                    placeholder="Add a caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    style={{
                      width: '100%',
                      marginTop: '4px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
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
              onClick={handlePublish}
              disabled={isSubmitting || (statusType === 'text' ? !textContent.trim() : !photoUrl)}
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
              <span>Post Status</span>
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
