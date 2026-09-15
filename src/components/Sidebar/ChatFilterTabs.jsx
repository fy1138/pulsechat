import React from 'react';

export default function ChatFilterTabs({ activeFilter, onFilterChange }) {
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'direct', label: 'Direct' },
    { id: 'groups', label: 'Groups' },
    { id: 'unread', label: 'Unread' }
  ];

  return (
    <div className="filter-tabs">
      {filters.map((f) => (
        <button
          key={f.id}
          className={`filter-tab ${activeFilter === f.id ? 'active' : ''}`}
          onClick={() => onFilterChange(f.id)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
