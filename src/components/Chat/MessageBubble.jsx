import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import {
  Check,
  CheckCheck,
  Play,
  Pause,
  FileText,
  Download,
  Reply,
  Pin,
  Star,
  Forward,
  Edit2,
  Trash2,
  MapPin,
  BarChart2,
  Type,
  X,
  Sparkles
} from 'lucide-react';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function MessageBubble({ message, isGroup, onReply, onForward, onJumpToMessage }) {
  const { currentUser, allUsers, toggleReaction, togglePin, toggleStar, editMessage, deleteMessage, votePoll } = useSocket();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playbackProgress, setPlaybackProgress] = useState(0); // 0 to 100
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');

  // Voice note transcription state
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState(null);

  const isMine = message.senderId === currentUser;
  const sender = allUsers.find((u) => u.id === message.senderId);
  const isStarred = message.starredBy && message.starredBy.includes(currentUser);

  // Real audio note playback (HTML5 Audio + Web Audio Speech Synth fallback)
  const audioInstanceRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    const handlePauseOther = (e) => {
      if (e.detail?.messageId !== message.id) {
        if (audioInstanceRef.current) {
          audioInstanceRef.current.pause();
        }
        if (synthRef.current) {
          synthRef.current.stop();
          synthRef.current = null;
        }
        setIsPlayingAudio(false);
      }
    };
    window.addEventListener('pulse:pause-audios', handlePauseOther);
    return () => {
      window.removeEventListener('pulse:pause-audios', handlePauseOther);
      if (audioInstanceRef.current) {
        audioInstanceRef.current.pause();
        audioInstanceRef.current = null;
      }
      if (synthRef.current) {
        synthRef.current.stop();
        synthRef.current = null;
      }
    };
  }, [message.id]);

  const togglePlayAudio = () => {
    if (isPlayingAudio) {
      if (audioInstanceRef.current) {
        audioInstanceRef.current.pause();
      }
      if (synthRef.current) {
        synthRef.current.stop();
        synthRef.current = null;
      }
      setIsPlayingAudio(false);
      return;
    }

    // Pause all other playing voice notes
    window.dispatchEvent(new CustomEvent('pulse:pause-audios', { detail: { messageId: message.id } }));

    // If message has recorded audio
    if (message.mediaUrl && (message.mediaUrl.startsWith('data:audio') || message.mediaUrl.startsWith('http') || message.mediaUrl.startsWith('/uploads'))) {
      if (!audioInstanceRef.current || audioInstanceRef.current.src !== message.mediaUrl) {
        const audio = new Audio(message.mediaUrl);
        audioInstanceRef.current = audio;

        audio.ontimeupdate = () => {
          if (audio.duration && !isNaN(audio.duration)) {
            setPlaybackProgress((audio.currentTime / audio.duration) * 100);
          }
        };

        audio.onended = () => {
          setIsPlayingAudio(false);
          setPlaybackProgress(0);
        };

        audio.onerror = () => {
          console.warn('HTML Audio playback error, using synthesizer');
          playSynthesizedAudio();
        };
      }

      audioInstanceRef.current.playbackRate = playbackSpeed;
      audioInstanceRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch((err) => {
        console.warn('Audio play() failed, falling back to synth', err);
        playSynthesizedAudio();
      });
    } else {
      playSynthesizedAudio();
    }
  };

  const playSynthesizedAudio = () => {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtxClass) {
      setIsPlayingAudio(false);
      return;
    }

    const audioCtx = new AudioCtxClass();
    const duration = message.audioDuration || 6;
    const now = audioCtx.currentTime;

    const notes = [261.63, 329.63, 392.00, 523.25, 440.00, 392.00, 349.23, 329.63, 261.63];
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'triangle';
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(2.5, now);

    const noteDuration = (duration / notes.length) / playbackSpeed;
    notes.forEach((freq, i) => {
      osc.frequency.setValueAtTime(freq, now + i * noteDuration);
    });

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / playbackSpeed);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + duration / playbackSpeed);

    const startTime = Date.now();
    const effectiveDurationMs = (duration * 1000) / playbackSpeed;
    const synthTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / effectiveDurationMs) * 100);
      setPlaybackProgress(pct);
      if (pct >= 100) {
        clearInterval(synthTimer);
        setIsPlayingAudio(false);
        setPlaybackProgress(0);
        synthRef.current = null;
      }
    }, 40);

    synthRef.current = {
      stop: () => {
        clearInterval(synthTimer);
        try {
          osc.stop();
          audioCtx.close();
        } catch (e) {}
      }
    };

    setIsPlayingAudio(true);
  };

  const handleSeekWaveform = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.min(100, Math.max(0, (clickX / rect.width) * 100));
    setPlaybackProgress(pct);
    if (audioInstanceRef.current && audioInstanceRef.current.duration && !isNaN(audioInstanceRef.current.duration)) {
      audioInstanceRef.current.currentTime = (pct / 100) * audioInstanceRef.current.duration;
    }
  };

  const cycleSpeed = (e) => {
    e.stopPropagation();
    const speeds = [1, 1.5, 2];
    const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(next);
    if (audioInstanceRef.current) {
      audioInstanceRef.current.playbackRate = next;
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Simulated Voice Note AI Transcription
  const handleTranscribe = () => {
    if (transcription) {
      setTranscription(null);
      return;
    }
    setIsTranscribing(true);
    setTimeout(() => {
      setIsTranscribing(false);
      const mockTranscripts = [
        "\"Hey! Let's make sure the audio recording and PWA install prompts are tested before our release.\"",
        "\"The WebSocket latency is super low and message deliveries are instant!\"",
        "\"I reviewed the Signal E2EE safety numbers and mutual verification passed.\"",
        "\"Here is the voice update on the team sync, sounds crisp!\""
      ];
      setTranscription(mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]);
    }, 700);
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    editMessage(message.id, editContent.trim());
    setIsEditing(false);
  };

  const waveform = message.audioWaveform || [25, 40, 65, 80, 50, 95, 70, 45, 85, 60, 35, 75, 90, 55, 30, 60];

  // If deleted message
  if (message.isDeleted) {
    return (
      <div className={`message-row ${isMine ? 'out' : 'in'}`} id={`msg-${message.id}`}>
        <div className="message-bubble" style={{ fontStyle: 'italic', opacity: 0.65, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Trash2 size={13} />
          <span>This message was deleted</span>
          <span style={{ fontSize: '10px', marginLeft: '6px' }}>{formatTime(message.timestamp)}</span>
        </div>
      </div>
    );
  }

  // If transparent sticker
  if (message.type === 'sticker') {
    return (
      <div className={`message-row ${isMine ? 'out' : 'in'}`} id={`msg-${message.id}`}>
        <div style={{ position: 'relative' }}>
          <img src={message.stickerUrl || message.mediaUrl} alt="Sticker" style={{ width: '130px', height: '130px', objectFit: 'contain' }} />
          <div className="message-meta" style={{ marginTop: '2px', textAlign: isMine ? 'right' : 'left' }}>
            <span>{formatTime(message.timestamp)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`message-row ${isMine ? 'out' : 'in'}`} id={`msg-${message.id}`}>
        {/* Hover Action Bar */}
        <div className="message-actions-hover">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              className="mini-reaction-btn"
              onClick={() => toggleReaction(message.id, emoji)}
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
          <button className="mini-reaction-btn" onClick={() => onReply(message)} title="Reply">
            <Reply size={14} />
          </button>
          <button className="mini-reaction-btn" onClick={() => onForward(message)} title="Forward">
            <Forward size={14} />
          </button>
          <button className="mini-reaction-btn" onClick={() => toggleStar(message.id)} title={isStarred ? 'Unstar' : 'Star'}>
            <Star size={14} color={isStarred ? '#eab308' : 'currentColor'} fill={isStarred ? '#eab308' : 'none'} />
          </button>
          <button className="mini-reaction-btn" onClick={() => togglePin(message.id)} title="Pin message">
            <Pin size={14} />
          </button>
          {isMine && message.type === 'text' && (
            <button className="mini-reaction-btn" onClick={() => setIsEditing(true)} title="Edit message">
              <Edit2 size={13} />
            </button>
          )}
          {isMine && (
            <button className="mini-reaction-btn" onClick={() => deleteMessage(message.id)} title="Delete for everyone" style={{ color: 'var(--accent-danger)' }}>
              <Trash2 size={13} />
            </button>
          )}
        </div>

        <div className="message-bubble">
          {/* Forwarded Header */}
          {message.forwardedFrom && (
            <div style={{ fontSize: '11px', color: isMine ? 'rgba(255,255,255,0.85)' : 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
              <Forward size={12} />
              <span>Forwarded from {message.forwardedFrom}</span>
            </div>
          )}

          {/* Group Sender Name */}
          {isGroup && !isMine && (
            <div className="message-sender-name">
              {sender ? sender.name : 'Participant'}
            </div>
          )}

          {/* Quoted Reply Card */}
          {message.replyTo && (
            <div className="reply-quote-card" onClick={() => onJumpToMessage(message.replyTo.id)}>
              <div className="reply-quote-sender">{message.replyTo.senderName || 'Original message'}</div>
              <div className="reply-quote-text">{message.replyTo.content}</div>
            </div>
          )}

          {/* Media: Image */}
          {message.type === 'image' && message.mediaUrl && (
            <div>
              <img
                src={message.mediaUrl}
                alt="Attachment"
                className="message-media-img"
                onClick={() => setIsLightboxOpen(true)}
              />
              {message.content && <p className="message-text" style={{ marginTop: '6px' }}>{message.content}</p>}
            </div>
          )}

          {/* Media: File / Document */}
          {message.type === 'file' && (
            <a href={message.mediaUrl || '#'} download={message.mediaName || 'document'} className="message-file-card">
              <div className="message-file-icon">
                <FileText size={20} />
              </div>
              <div className="message-file-meta">
                <span className="message-file-name">{message.mediaName || 'Document.pdf'}</span>
                <span className="message-file-size">{message.mediaSize || '1.2 MB'}</span>
              </div>
              <Download size={16} style={{ marginLeft: 'auto', opacity: 0.7 }} />
            </a>
          )}

          {/* Media: Voice Note */}
          {message.type === 'audio' && (
            <div>
              {message.content && <p className="message-text" style={{ marginBottom: '6px' }}>{message.content}</p>}
              <div className="voice-note-player">
                <button className="voice-play-btn" onClick={togglePlayAudio}>
                  {isPlayingAudio ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
                </button>

                <div className="voice-waveform" onClick={handleSeekWaveform}>
                  {waveform.map((height, idx) => {
                    const isPlayed = (idx / waveform.length) * 100 <= playbackProgress;
                    return (
                      <div key={idx} className={`waveform-bar ${isPlayed ? 'played' : ''}`} style={{ height: `${height}%` }} />
                    );
                  })}
                </div>

                <button className="voice-speed-badge" onClick={cycleSpeed}>
                  {playbackSpeed}x
                </button>

                {/* AI Transcription button (Telegram-style A icon) */}
                <button
                  className="voice-speed-badge"
                  onClick={handleTranscribe}
                  title="Transcribe Voice Note with AI"
                  style={{ display: 'flex', alignItems: 'center', gap: '2px', background: transcription ? 'var(--accent-glow)' : undefined }}
                >
                  <Type size={11} />
                  <span>{isTranscribing ? '...' : 'A'}</span>
                </button>

                <span style={{ fontSize: '11px', opacity: 0.8, minWidth: '28px', textAlign: 'right' }}>
                  {formatDuration((message.audioDuration || 10) * (1 - playbackProgress / 100))}
                </span>
              </div>

              {/* Transcription Text Accordion */}
              {transcription && (
                <div style={{ marginTop: '6px', padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.12)', fontSize: '12px', fontStyle: 'italic', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <Sparkles size={13} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{transcription}</span>
                </div>
              )}
            </div>
          )}

          {/* Interactive Poll Card */}
          {message.type === 'poll' && message.poll && (
            <div style={{ minWidth: '240px', padding: '4px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <BarChart2 size={16} color="var(--accent-primary)" />
                <span style={{ fontWeight: 700, fontSize: '14.5px' }}>{message.poll.question}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {message.poll.options.map((option, idx) => {
                  const voterCount = option.voterIds?.length || 0;
                  const total = message.poll.totalVotes || 0;
                  const percent = total > 0 ? Math.round((voterCount / total) * 100) : 0;
                  const hasVoted = option.voterIds?.includes(currentUser);

                  return (
                    <div
                      key={idx}
                      onClick={() => votePoll(message.id, idx)}
                      style={{
                        position: 'relative',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(0,0,0,0.08)',
                        border: hasVoted ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      {/* Percentage background bar */}
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${percent}%`,
                          background: hasVoted ? 'var(--accent-glow)' : 'rgba(255,255,255,0.08)',
                          transition: 'width 0.3s ease',
                          zIndex: 0
                        }}
                      />
                      <span style={{ position: 'relative', zIndex: 1, fontSize: '13px', fontWeight: hasVoted ? 700 : 500 }}>
                        {option.text}
                      </span>
                      <span style={{ position: 'relative', zIndex: 1, fontSize: '12px', fontWeight: 600, opacity: 0.85 }}>
                        {percent}% ({voterCount})
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '6px', textAlign: 'right' }}>
                {message.poll.totalVotes} vote{message.poll.totalVotes === 1 ? '' : 's'} • {message.poll.multipleAnswers ? 'Multiple choice' : 'Single choice'}
              </div>
            </div>
          )}

          {/* Live Location Card */}
          {message.type === 'location' && message.location && (
            <div style={{ minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <MapPin size={18} color="var(--accent-danger)" />
                <span style={{ fontWeight: 700, fontSize: '14px' }}>{message.location.name || 'Live Location'}</span>
              </div>
              <div style={{ height: '100px', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, #1e293b, #0f172a)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontSize: '12px', gap: '4px', border: '1px solid var(--border-subtle)' }}>
                <MapPin size={28} className="animate-bounce" />
                <span>{message.location.latitude?.toFixed(4)}, {message.location.longitude?.toFixed(4)}</span>
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                Live for {message.location.duration || '15 minutes'}
              </div>
            </div>
          )}

          {/* Standard Text or Inline Edit */}
          {message.type === 'text' && !isEditing && (
            <p className="message-text">{message.content}</p>
          )}

          {isEditing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '220px' }}>
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-primary)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                <button className="icon-btn" style={{ fontSize: '11px', width: 'auto', padding: '2px 8px' }} onClick={() => setIsEditing(false)}>Cancel</button>
                <button className="icon-btn primary" style={{ fontSize: '11px', width: 'auto', padding: '2px 10px' }} onClick={handleSaveEdit}>Save</button>
              </div>
            </div>
          )}

          {/* Timestamp, Edited Tag, Star, and Ticks */}
          <div className="message-meta">
            {message.isEdited && (
              <span style={{ fontStyle: 'italic', fontSize: '10px', opacity: 0.8 }} title={`Edited at ${formatTime(message.editedAt)}`}>
                edited
              </span>
            )}
            {isStarred && <Star size={11} color="#eab308" fill="#eab308" />}
            <span>{formatTime(message.timestamp)}</span>
            {isMine && (
              <span>
                {message.status === 'read' ? (
                  <CheckCheck size={14} className="tick-icon read" title="Read" />
                ) : message.status === 'delivered' ? (
                  <CheckCheck size={14} className="tick-icon" title="Delivered" />
                ) : (
                  <Check size={14} className="tick-icon" title="Sent" />
                )}
              </span>
            )}
          </div>

          {/* Reactions Pill Display */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="message-reactions">
              {Object.entries(message.reactions).map(([emoji, userIds]) => {
                if (!userIds || userIds.length === 0) return null;
                const hasReacted = userIds.includes(currentUser);
                return (
                  <button
                    key={emoji}
                    className={`reaction-pill ${hasReacted ? 'user-reacted' : ''}`}
                    onClick={() => toggleReaction(message.id, emoji)}
                    title={`Reacted by: ${userIds.map((id) => allUsers.find((u) => u.id === id)?.name || id).join(', ')}`}
                  >
                    <span>{emoji}</span>
                    <span style={{ fontWeight: 600, fontSize: '11px' }}>{userIds.length}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox for Photo */}
      {isLightboxOpen && (
        <div className="modal-backdrop" onClick={() => setIsLightboxOpen(false)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <button className="icon-btn" style={{ position: 'absolute', top: '-42px', right: 0, color: 'white' }} onClick={() => setIsLightboxOpen(false)}>
              <X size={20} />
            </button>
            <img src={message.mediaUrl} alt="Enlarged" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 'var(--radius-md)', objectFit: 'contain' }} />
          </div>
        </div>
      )}
    </>
  );
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
