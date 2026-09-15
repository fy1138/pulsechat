import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Download, WifiOff, X, Sparkles, Smartphone } from 'lucide-react';

export default function PWAInstallPrompt({ installPromptEvent, onClearPrompt }) {
  const { isOffline } = useSocket();
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  // Check if iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  return (
    <>
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="pwa-banner" style={{ borderLeft: '4px solid var(--accent-danger)' }}>
          <WifiOff size={16} color="var(--accent-danger)" />
          <span>You are currently offline. Messages will send automatically when reconnected.</span>
        </div>
      )}

      {/* PWA Install Banner */}
      {!isStandalone && installPromptEvent && (
        <div className="pwa-banner" style={{ bottom: '16px', top: 'auto' }}>
          <Smartphone size={18} color="var(--accent-primary)" />
          <span>Install PulseChat for a faster, native app experience</span>
          <button
            className="icon-btn primary"
            style={{ width: 'auto', padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 600 }}
            onClick={async () => {
              if (installPromptEvent) {
                installPromptEvent.prompt();
                const choice = await installPromptEvent.userChoice;
                if (choice.outcome === 'accepted') {
                  onClearPrompt();
                }
              }
            }}
          >
            Install
          </button>
          <button className="icon-btn" style={{ width: '22px', height: '22px' }} onClick={onClearPrompt}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* iOS Safari Help Modal */}
      {showIOSHelp && (
        <div className="modal-backdrop" onClick={() => setShowIOSHelp(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Install on iPhone / iPad</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              1. Tap the <strong>Share</strong> button (box with upward arrow) in Safari.<br />
              2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
              3. Open PulseChat directly from your home screen like a native app!
            </p>
            <button
              className="icon-btn primary"
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)' }}
              onClick={() => setShowIOSHelp(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
