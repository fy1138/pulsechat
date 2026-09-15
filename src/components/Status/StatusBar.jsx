import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import StatusViewerModal from './StatusViewerModal';
import StatusCreatorModal from './StatusCreatorModal';

export default function StatusBar() {
  const { currentUser, allUsers, stories } = useSocket();
  const [selectedUserStories, setSelectedUserStories] = useState(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  const activeUser = allUsers.find((u) => u.id === currentUser) || { name: 'You' };

  // Group stories by userId
  const storiesByUser = {};
  stories.forEach((s) => {
    if (!storiesByUser[s.userId]) storiesByUser[s.userId] = [];
    storiesByUser[s.userId].push(s);
  });

  const myStories = storiesByUser[currentUser] || [];

  // Contacts with stories (excluding current user)
  const contactStoryEntries = Object.entries(storiesByUser).filter(([uId]) => uId !== currentUser);

  const handleOpenMyStatus = () => {
    if (myStories.length > 0) {
      setSelectedUserStories(myStories);
    } else {
      setIsCreatorOpen(true);
    }
  };

  const handleOpenContactStories = (userStories) => {
    setSelectedUserStories(userStories);
  };

  return (
    <>
      <div
        className="status-bar-container"
        style={{
          padding: '10px 16px 8px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          alignItems: 'center'
        }}
      >
        {/* My Status */}
        <div
          onClick={handleOpenMyStatus}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            flexShrink: 0
          }}
          title="Add or view status"
        >
          <div
            style={{
              position: 'relative',
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              padding: '2px',
              background: myStories.length > 0 ? 'var(--gradient-primary)' : 'transparent',
              border: myStories.length === 0 ? '2px dashed var(--border-medium)' : 'none'
            }}
          >
            <div
              className="avatar-wrapper"
              style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}
            >
              {activeUser.avatar ? (
                <img src={activeUser.avatar} alt="You" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">{activeUser.name?.charAt(0) || 'U'}</div>
              )}
            </div>

            {/* Plus Badge */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsCreatorOpen(true);
              }}
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary)',
                border: '2px solid var(--bg-sidebar)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Plus size={11} strokeWidth={3} />
            </div>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginTop: '4px',
              maxWidth: '56px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            My Status
          </span>
        </div>

        {/* Contacts with Stories */}
        {contactStoryEntries.map(([uId, uStories]) => {
          const user = allUsers.find((u) => u.id === uId) || uStories[0]?.user || { name: 'Contact' };
          return (
            <div
              key={uId}
              onClick={() => handleOpenContactStories(uStories)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
              title={`View ${user.name}'s status`}
            >
              <div
                style={{
                  position: 'relative',
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  padding: '2.5px',
                  background: 'linear-gradient(135deg, #10b981, #06b6d4, #6366f1)',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                }}
              >
                <div
                  className="avatar-wrapper"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '2px solid var(--bg-sidebar)'
                  }}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="avatar-img" />
                  ) : (
                    <div className="avatar-placeholder">{user.name?.charAt(0) || 'C'}</div>
                  )}
                </div>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginTop: '4px',
                  maxWidth: '56px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {user.name.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      <StatusViewerModal
        isOpen={!!selectedUserStories}
        onClose={() => setSelectedUserStories(null)}
        userStories={selectedUserStories || []}
      />

      <StatusCreatorModal
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
      />
    </>
  );
}
