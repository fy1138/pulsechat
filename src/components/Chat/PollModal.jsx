import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { X, Plus, Trash2, BarChart2 } from 'lucide-react';

export default function PollModal({ isOpen, onClose }) {
  const { sendMessage } = useSocket();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multipleAnswers, setMultipleAnswers] = useState(false);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (val, index) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validOptions = options.map((opt) => opt.trim()).filter(Boolean);
    if (!question.trim() || validOptions.length < 2) return;

    const pollData = {
      question: question.trim(),
      options: validOptions.map((text) => ({ text, voterIds: [] })),
      multipleAnswers,
      totalVotes: 0
    };

    sendMessage({
      type: 'poll',
      poll: pollData,
      content: `📊 Poll: ${question.trim()}`
    });

    onClose();
    setQuestion('');
    setOptions(['', '']);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Create Poll</h3>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>QUESTION</label>
            <input
              type="text"
              placeholder="Ask a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              style={{ width: '100%', marginTop: '4px', padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>POLL OPTIONS</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              {options.map((opt, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(e.target.value, idx)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '13.5px', outline: 'none' }}
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ width: '32px', height: '32px', color: 'var(--accent-danger)' }}
                      onClick={() => handleRemoveOption(idx)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 6 && (
              <button
                type="button"
                onClick={handleAddOption}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '8px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>Add Option</span>
              </button>
            )}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={multipleAnswers}
              onChange={(e) => setMultipleAnswers(e.target.checked)}
            />
            <span>Allow multiple answers</span>
          </label>

          <button
            type="submit"
            className="icon-btn primary"
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: 700, marginTop: '8px' }}
            disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
          >
            Create & Send Poll
          </button>
        </form>
      </div>
    </div>
  );
}
