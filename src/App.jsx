import React, { useState, useEffect } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar/Sidebar';
import ChatArea from './components/Chat/ChatArea';
import CallModal from './components/Chat/CallModal';
import PWAInstallPrompt from './components/PWA/PWAInstallPrompt';
import AuthModal from './components/Auth/AuthModal';
import { Shield } from 'lucide-react';

function MainApp() {
  const { activeChatId } = useSocket();
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleTriggerInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } else {
      alert('To install PulseChat:\n- On Chrome/Edge: click the Install icon in the browser address bar.\n- On iOS: tap Share -> Add to Home Screen.');
    }
  };

  return (
    <div className={`app-layout ${activeChatId ? 'chat-open' : ''}`}>
      <Sidebar
        onInstallClick={handleTriggerInstall}
        canInstall={!!installPrompt}
      />
      <ChatArea />
      <CallModal />
      <PWAInstallPrompt
        installPromptEvent={installPrompt}
        onClearPrompt={() => setInstallPrompt(null)}
      />
    </div>
  );
}

function AppContent() {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-app, #0f172a)',
          color: 'var(--text-primary, #f8fafc)',
          gap: '16px'
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(14, 165, 233, 0.4)',
            animation: 'pulse 1.8s infinite'
          }}
        >
          <Shield size={28} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px', margin: 0 }}>PulseChat</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>Connecting to encrypted network...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthModal isOpen={true} isMandatory={true} />;
  }

  return (
    <SocketProvider>
      <MainApp />
    </SocketProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
