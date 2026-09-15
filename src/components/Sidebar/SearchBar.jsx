import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ searchQuery, onSearchChange }) {
  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <Search size={16} />
        <input
          type="text"
          className="search-input"
          placeholder="Search chats, messages, or contacts..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            className="icon-btn"
            style={{ width: '22px', height: '22px' }}
            onClick={() => onSearchChange('')}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
