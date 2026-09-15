import React from 'react';
import { X, Check, Image as ImageIcon } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const WALLPAPERS = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean chat background with subtle theme colors',
    style: { background: 'var(--bg-chat)' }
  },
  {
    id: 'doodle',
    name: 'WhatsApp Doodle',
    description: 'Iconic messaging doodles with subtle translucency',
    className: 'wallpaper-doodle',
    style: {
      backgroundColor: 'var(--bg-chat)',
      backgroundImage: `radial-gradient(var(--border-subtle) 1.5px, transparent 1.5px)`,
      backgroundSize: '24px 24px'
    }
  },
  {
    id: 'emerald',
    name: 'Deep Emerald',
    description: 'Luxurious WhatsApp dark green forest tone',
    style: {
      background: 'linear-gradient(145deg, #06231c 0%, #031410 100%)'
    }
  },
  {
    id: 'midnight',
    name: 'Midnight Slate',
    description: 'Minimalist high-contrast dark OLED slate',
    style: {
      background: '#0a0d14'
    }
  },
  {
    id: 'cyber',
    name: 'Cyber Violet',
    description: 'Vibrant neon purple and deep indigo glow',
    style: {
      background: 'linear-gradient(135deg, #130924 0%, #200d3d 100%)'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset Radiance',
    description: 'Warm dusk gradient with orange & amber hues',
    style: {
      background: 'linear-gradient(140deg, #2a0808 0%, #3d1400 100%)'
    }
  }
];

export default function WallpaperModal({ isOpen, onClose }) {
  const { currentWallpaper, setWallpaper } = useSocket();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '460px', width: '100%', padding: 0, overflow: 'hidden' }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            <ImageIcon size={18} color="var(--accent-primary)" />
            <span>Chat Wallpaper</span>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Choose a wallpaper background for your conversations.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {WALLPAPERS.map((wp) => {
              const isSelected = (currentWallpaper || 'default') === wp.id;
              return (
                <div
                  key={wp.id}
                  onClick={() => setWallpaper(wp.id)}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div
                    style={{
                      height: '80px',
                      width: '100%',
                      ...wp.style,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px'
                    }}
                  >
                    <div
                      style={{
                        padding: '6px 10px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.12)',
                        backdropFilter: 'blur(4px)',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      Sample bubble
                    </div>
                  </div>

                  <div style={{ padding: '8px 10px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{wp.name}</span>
                    {isSelected && <Check size={14} color="var(--accent-primary)" strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-card)' }}>
          <button className="icon-btn primary" onClick={onClose} style={{ width: 'auto', padding: '8px 20px', borderRadius: 'var(--radius-md)', fontSize: '13.5px', fontWeight: 600 }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
