import React, { useState } from 'react';
import { ShieldCheck, X, Check, QrCode, Lock, CheckCircle2 } from 'lucide-react';

export default function SafetyNumberModal({ isOpen, onClose, contact }) {
  const [isVerified, setIsVerified] = useState(false);

  if (!isOpen || !contact) return null;

  const safetyNumber = contact.safetyNumber || '38492 84729 19284 75620 18274 95820 48201 94820 19482 74629 10482 92048';
  const chunks = safetyNumber.split(' ');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={15} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Verify Safety Number</h3>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {/* Signal-style QR Code Visualizer */}
          <div
            style={{
              padding: '16px',
              background: 'white',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="150" height="150" viewBox="0 0 100 100">
              {/* Simulated high-density cryptographic QR matrix */}
              <rect width="100" height="100" fill="#ffffff" />
              {/* Corner squares */}
              <rect x="5" y="5" width="26" height="26" rx="4" fill="#0f172a" />
              <rect x="9" y="9" width="18" height="18" rx="2" fill="#ffffff" />
              <rect x="13" y="13" width="10" height="10" rx="1" fill="#0f172a" />

              <rect x="69" y="5" width="26" height="26" rx="4" fill="#0f172a" />
              <rect x="73" y="9" width="18" height="18" rx="2" fill="#ffffff" />
              <rect x="77" y="13" width="10" height="10" rx="1" fill="#0f172a" />

              <rect x="5" y="69" width="26" height="26" rx="4" fill="#0f172a" />
              <rect x="9" y="73" width="18" height="18" rx="2" fill="#ffffff" />
              <rect x="13" y="77" width="10" height="10" rx="1" fill="#0f172a" />

              {/* Data pattern blocks */}
              <circle cx="50" cy="50" r="6" fill="#0284c7" />
              <rect x="36" y="8" width="5" height="18" fill="#0f172a" />
              <rect x="44" y="12" width="6" height="8" fill="#0f172a" />
              <rect x="54" y="6" width="8" height="16" fill="#0f172a" />
              <rect x="8" y="38" width="16" height="6" fill="#0f172a" />
              <rect x="12" y="48" width="8" height="14" fill="#0f172a" />
              <rect x="72" y="38" width="20" height="7" fill="#0f172a" />
              <rect x="76" y="50" width="16" height="8" fill="#0f172a" />
              <rect x="38" y="72" width="18" height="8" fill="#0f172a" />
              <rect x="60" y="72" width="14" height="20" fill="#0f172a" />
              <rect x="40" y="40" width="8" height="8" fill="#0f172a" />
              <rect x="52" y="36" width="10" height="6" fill="#0f172a" />
              <rect x="36" y="54" width="7" height="10" fill="#0f172a" />
              <rect x="48" y="60" width="8" height="7" fill="#0f172a" />
            </svg>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>SIGNAL CRYPTOGRAPHIC MATRIX</span>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.4 }}>
            Compare the numeric fingerprint below with <strong>{contact.name}</strong> to confirm end-to-end encryption is tamper-proof.
          </p>

          {/* 60-digit number grid */}
          <div className="fingerprint-grid" style={{ width: '100%' }}>
            {chunks.map((group, idx) => (
              <span key={idx} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{group}</span>
            ))}
          </div>

          <button
            className={`icon-btn ${isVerified ? '' : 'primary'}`}
            onClick={() => setIsVerified(!isVerified)}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 600,
              fontSize: '14px',
              backgroundColor: isVerified ? 'rgba(16, 185, 129, 0.15)' : 'var(--accent-primary)',
              color: isVerified ? 'var(--accent-green)' : 'white'
            }}
          >
            {isVerified ? (
              <>
                <CheckCircle2 size={18} />
                <span>Marked as Verified</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Mark as Verified</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
