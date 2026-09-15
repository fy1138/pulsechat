import React, { useState, useMemo } from 'react';
import { useSocket } from '../../context/SocketContext';
import SidebarHeader from './SidebarHeader';
import SearchBar from './SearchBar';
import ChatFilterTabs from './ChatFilterTabs';
import StatusBar from '../Status/StatusBar';
import ChatListItem from './ChatListItem';
import { MessageSquareDashed } from 'lucide-react';

export default function Sidebar({ onInstallClick, canInstall }) {
  const { chats, activeChatId, setActiveChatId, currentUser } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      // Category filter
      if (activeFilter === 'direct' && (chat.isGroup || chat.isSavedMessages)) return false;
      if (activeFilter === 'groups' && !chat.isGroup) return false;
      if (activeFilter === 'unread') {
        const unread = chat.unreadCount?.[currentUser] || 0;
        if (unread === 0) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = chat.name?.toLowerCase().includes(query);
        const matchesLastMsg = chat.lastMessage?.content?.toLowerCase().includes(query);
        const matchesParticipant = chat.recipient?.name?.toLowerCase().includes(query);
        return matchesName || matchesLastMsg || matchesParticipant;
      }

      return true;
    });
  }, [chats, activeFilter, searchQuery, currentUser]);

  return (
    <aside className="sidebar">
      <SidebarHeader onInstallClick={onInstallClick} canInstall={canInstall} />
      <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <ChatFilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <StatusBar />

      <div className="chat-list">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isActive={activeChatId === chat.id}
              onClick={() => setActiveChatId(chat.id)}
            />
          ))
        ) : (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <MessageSquareDashed size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <div style={{ fontSize: '14px', fontWeight: 600 }}>No conversations found</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              {searchQuery ? 'Try a different search term' : 'Start a new conversation to begin'}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
