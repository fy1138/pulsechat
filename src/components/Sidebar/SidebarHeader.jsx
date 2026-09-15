import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Sun, Moon, Plus, ArrowLeftRight, Download, Star, Settings, LogIn } from 'lucide-react';
import UserSwitcherModal from './UserSwitcherModal';
import NewChatModal from './NewChatModal';
import AuthModal from '../Auth/AuthModal';
import ProfileSettingsModal from '../Profile/ProfileSettingsModal';
import StarredMessagesModal from '../Chat/StarredMessagesModal';

export default function SidebarHeader({ onInstallClick, canInstall }) {
  const { allUsers, currentUser } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const { currentUser: authUser } = useAuth();

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isStarredOpen, setIsStarredOpen] = useState(false);

  const activeUser = authUser || allUsers.find((u) => u.id === currentUser) || {
    name: 'Alex Rivers',
    status: 'online'
  };

  return (
    <>
      <header className="sidebar-header">
        <button
          className="profile-trigger"
          onClick={() => setIsSwitcherOpen(true)}
          title="Switch active user profile"
        >
          <div className="avatar-wrapper">
            {activeUser.avatar ? (
              <img src={activeUser.avatar} alt={activeUser.name} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">{activeUser.name?.charAt(0) || 'U'}</div>
            )}
            <span className={`presence-badge ${activeUser.status || 'online'}`} />
          </div>

          <div className="profile-info">
            <span className="profile-name">
              {activeUser.name}
              <ArrowLeftRight size={12} color="var(--accent-primary)" />
            </span>
            <span className="profile-status">{activeUser.handle || 'Tap to switch profile'}</span>
          </div>
        </button>

        <div className="header-actions">
          {canInstall && (
            <button
              className="icon-btn"
              onClick={onInstallClick}
              title="Install PulseChat PWA"
              style={{ color: 'var(--accent-primary)' }}
            >
              <Download size={18} />
            </button>
          )}

          <button
            className="icon-btn"
            onClick={() => setIsStarredOpen(true)}
            title="Starred Messages"
          >
            <Star size={18} />
          </button>

          <button
            className="icon-btn"
            onClick={() => setIsProfileOpen(true)}
            title="Profile & Account Settings"
          >
            <Settings size={18} />
          </button>

          <button
            className="icon-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            className="icon-btn primary"
            onClick={() => setIsNewChatOpen(true)}
            title="New Conversation or Group"
          >
            <Plus size={18} />
          </button>
        </div>
      </header>

      <UserSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
      />

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <ProfileSettingsModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <StarredMessagesModal
        isOpen={isStarredOpen}
        onClose={() => setIsStarredOpen(false)}
      />
    </>
  );
}
