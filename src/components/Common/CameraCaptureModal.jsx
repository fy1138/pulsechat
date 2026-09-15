import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

export default function CameraCaptureModal({ isOpen, onClose, onCapturePhoto }) {
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen && !capturedPhoto) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedPhoto, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser or environment.');
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('getUserMedia error:', err);
      setCameraError(err.message || 'Unable to access camera. Please allow camera permissions or upload an image file.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleFlipCamera = (e) => {
    e.stopPropagation();
    stopCamera();
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;

    // Trigger shutter flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;

    const size = Math.min(video.videoWidth || 480, video.videoHeight || 480);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    // Center crop square
    const startX = ((video.videoWidth || 480) - size) / 2;
    const startY = ((video.videoHeight || 480) - size) / 2;

    // If front camera, mirror horizontally
    if (facingMode === 'user') {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    stopCamera();
    setCapturedPhoto(dataUrl);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onCapturePhoto(capturedPhoto);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div
        className="modal-card camera-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '420px', width: '100%', padding: 0, overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            <Camera size={18} color="var(--accent-primary)" />
            <span>Take Photo</span>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder or Captured Preview */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {isFlashing && (
            <div style={{ position: 'absolute', inset: 0, backgroundColor: '#fff', zIndex: 10, animation: 'flash 0.2s ease-out' }} />
          )}

          {!capturedPhoto ? (
            cameraError ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#ff6b6b' }}>
                <AlertCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.8 }} />
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Camera Inaccessible</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                  {cameraError}
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                  }}
                />
                {/* Circular Framing Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    border: '2px dashed rgba(255,255,255,0.5)',
                    borderRadius: '50%',
                    margin: '18px'
                  }}
                />
                {/* Flip camera button */}
                <button
                  onClick={handleFlipCamera}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Flip camera"
                >
                  <RefreshCw size={16} />
                </button>
              </>
            )
          ) : (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <img
                src={capturedPhoto}
                alt="Captured"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  border: '2px solid var(--accent-primary)',
                  borderRadius: '50%',
                  margin: '18px'
                }}
              />
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'var(--bg-card)' }}>
          {!capturedPhoto ? (
            <button
              onClick={handleTakeSnapshot}
              disabled={!!cameraError}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '4px solid var(--accent-primary)',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: cameraError ? 'not-allowed' : 'pointer',
                opacity: cameraError ? 0.4 : 1,
                transition: 'transform 0.1s ease',
                padding: '4px'
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                className="icon-btn"
                onClick={handleRetake}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '13.5px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <RefreshCw size={16} />
                <span>Retake</span>
              </button>
              <button
                className="icon-btn primary"
                onClick={handleConfirm}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '13.5px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Check size={16} />
                <span>Use Photo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
