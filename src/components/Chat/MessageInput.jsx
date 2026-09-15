import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { soundEngine } from '../../utils/audio';
import {
  Smile,
  Paperclip,
  Mic,
  Send,
  X,
  Trash2,
  Check,
  Image,
  FileText,
  BarChart2,
  MapPin,
  Sparkles
} from 'lucide-react';
import PollModal from './PollModal';

const COMMON_EMOJIS = [
  '😀', '😂', '🥹', '😍', '🥰', '😎', '🤔', '🥳',
  '👍', '👏', '🔥', '✨', '❤️', '🙌', '💯', '🚀',
  '☕', '🎉', '💡', '🔒', '📱', '🎙️', '⚡', '🌟',
  '🎯', '💪', '🤩', '🫡', '🤝', '🍕', '🎮', '🦄'
];

const CURATED_STICKERS = [
  'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif', // Party celebration
  'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', // High five
  'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif', // Thumbs up
  'https://media.giphy.com/media/3o7TKMt1VVNkHV2PaE/giphy.gif', // Mind blown
  'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',     // Wow doge
  'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif'  // Hacker typing
];

const CURATED_GIFS = [
  { title: 'Celebrate', url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' },
  { title: 'Coding', url: 'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif' },
  { title: 'Approved', url: 'https://media.giphy.com/media/10uEX5kfeodYgo/giphy.gif' },
  { title: 'Rocket', url: 'https://media.giphy.com/media/mi6DsSSNKDbUY/giphy.gif' }
];

export default function MessageInput({ replyingTo, onCancelReply }) {
  const { sendMessage, handleTyping, allUsers, activeChat } = useSocket();
  const [text, setText] = useState('');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState('emoji'); // 'emoji' | 'stickers' | 'gifs'
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [liveWaveform, setLiveWaveform] = useState([25, 40, 60, 80, 50, 70, 45, 65, 35, 55, 30, 50]);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const recordTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const recordingStartTimeRef = useRef(0);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [replyingTo]);

  // Clean up recording tracks on unmount
  useEffect(() => {
    return () => {
      cleanupRecordingStreams();
    };
  }, []);

  const cleanupRecordingStreams = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    mediaRecorderRef.current = null;
  };

  const handleSendText = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    let replyData = null;
    if (replyingTo) {
      const sender = allUsers.find((u) => u.id === replyingTo.senderId);
      replyData = {
        id: replyingTo.id,
        senderName: sender ? sender.name : 'Participant',
        content: replyingTo.content || (replyingTo.type === 'audio' ? 'Voice note' : 'Photo')
      };
    }

    sendMessage({
      content: trimmed,
      type: 'text',
      replyTo: replyData
    });

    setText('');
    onCancelReply();
    setShowMediaPicker(false);
    setShowAttachMenu(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    handleTyping();
  };

  const startVoiceRecording = async () => {
    try {
      soundEngine.playRecordStart();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      // Web Audio API live waveform analyzer
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        const audioCtx = new AudioCtxClass();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const sampleWave = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          const sampled = [];
          const step = Math.max(1, Math.floor(dataArray.length / 12));
          for (let i = 0; i < 12; i++) {
            const val = dataArray[i * step] || 0;
            sampled.push(Math.max(15, Math.min(95, Math.round((val / 255) * 80 + 15))));
          }
          setLiveWaveform(sampled);
          animationFrameRef.current = requestAnimationFrame(sampleWave);
        };
        sampleWave();
      }

      // Check supported recording format
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      recordingStartTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone recording error', err);
      alert('Microphone access is required to record voice notes. Please grant microphone permission in your browser.');
    }
  };

  const cancelVoiceRecording = () => {
    cleanupRecordingStreams();
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const stopAndSendVoiceNote = () => {
    if (!mediaRecorderRef.current) {
      cancelVoiceRecording();
      return;
    }

    const recorder = mediaRecorderRef.current;
    const duration = Math.max(1, Math.round((Date.now() - recordingStartTimeRef.current) / 1000));

    recorder.onstop = () => {
      const mimeType = recorder.mimeType || 'audio/webm';
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      cleanupRecordingStreams();

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result;
        const waveform = Array.from({ length: 22 }, () => Math.floor(Math.random() * 70) + 25);

        sendMessage({
          type: 'audio',
          mediaUrl: base64Audio,
          audioDuration: duration,
          audioWaveform: waveform,
          content: ''
        });
        soundEngine.playMessageSent();
      };
      reader.readAsDataURL(blob);
    };

    recorder.stop();
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const handleSendSticker = (stickerUrl) => {
    sendMessage({
      type: 'sticker',
      stickerUrl,
      content: ''
    });
    setShowMediaPicker(false);
  };

  const handleSendLocation = () => {
    // Generate realistic simulated GPS coordinates (e.g. San Francisco downtown)
    const lat = 37.7749 + (Math.random() - 0.5) * 0.01;
    const lng = -122.4194 + (Math.random() - 0.5) * 0.01;

    sendMessage({
      type: 'location',
      location: {
        latitude: lat,
        longitude: lng,
        name: 'Pulse HQ • Market St',
        duration: '15 minutes'
      },
      content: '📍 Live location shared'
    });
    setShowAttachMenu(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        sendMessage({
          type: isImg ? 'image' : 'file',
          mediaUrl: data.url,
          mediaName: data.filename,
          mediaSize: `${(data.size / 1024).toFixed(0)} KB`,
          content: ''
        });
      }
    } catch (err) {
      console.warn('Upload failed, using local preview', err);
      const url = URL.createObjectURL(file);
      sendMessage({
        type: isImg ? 'image' : 'file',
        mediaUrl: url,
        mediaName: file.name,
        mediaSize: `${(file.size / 1024).toFixed(0)} KB`,
        content: ''
      });
    }

    setShowAttachMenu(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <div className="chat-input-bar">
        {/* Replying to banner */}
        {replyingTo && (
          <div className="input-reply-banner">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                Replying to {allUsers.find((u) => u.id === replyingTo.senderId)?.name || 'Participant'}
              </span>
              <span className="input-reply-text">
                {replyingTo.type === 'audio'
                  ? '🎙️ Voice note'
                  : replyingTo.type === 'image'
                  ? '📷 Photo'
                  : replyingTo.content}
              </span>
            </div>
            <button className="icon-btn" style={{ width: '24px', height: '24px' }} onClick={onCancelReply}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Tabbed Emoji, Sticker & GIF Picker */}
        {showMediaPicker && (
          <div
            style={{
              position: 'absolute',
              bottom: '76px',
              left: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              width: '320px',
              zIndex: 50,
              overflow: 'hidden'
            }}
          >
            {/* Picker tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-input)' }}>
              {['emoji', 'stickers', 'gifs'].map((t) => (
                <button
                  key={t}
                  onClick={() => setPickerTab(t)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: 'none',
                    background: pickerTab === t ? 'var(--bg-card)' : 'transparent',
                    color: pickerTab === t ? 'var(--accent-primary)' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Emoji Tab */}
            {pickerTab === 'emoji' && (
              <div style={{ padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                    onClick={() => {
                      setText((prev) => prev + emoji);
                      textareaRef.current?.focus();
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Stickers Tab */}
            {pickerTab === 'stickers' && (
              <div style={{ padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {CURATED_STICKERS.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="Sticker"
                    onClick={() => handleSendSticker(url)}
                    style={{ width: '100%', height: '80px', objectFit: 'contain', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                  />
                ))}
              </div>
            )}

            {/* GIFs Tab */}
            {pickerTab === 'gifs' && (
              <div style={{ padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {CURATED_GIFS.map((gif, i) => (
                  <div
                    key={i}
                    onClick={() => handleSendSticker(gif.url)}
                    style={{ cursor: 'pointer', textAlign: 'center' }}
                  >
                    <img src={gif.url} alt={gif.title} style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{gif.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Attachment Options Menu */}
        {showAttachMenu && (
          <div
            style={{
              position: 'absolute',
              bottom: '76px',
              left: '52px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              zIndex: 50,
              minWidth: '180px'
            }}
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', border: 'none', background: 'none', color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', textAlign: 'left' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Image size={16} color="var(--accent-primary)" />
              <span>Photo / Video</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', border: 'none', background: 'none', color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', textAlign: 'left' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <FileText size={16} color="var(--accent-green)" />
              <span>Document</span>
            </button>

            <button
              onClick={() => {
                setShowAttachMenu(false);
                setIsPollModalOpen(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', border: 'none', background: 'none', color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', textAlign: 'left' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <BarChart2 size={16} color="#eab308" />
              <span>Create Poll</span>
            </button>

            <button
              onClick={handleSendLocation}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', border: 'none', background: 'none', color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', textAlign: 'left' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <MapPin size={16} color="var(--accent-danger)" />
              <span>Share Live Location</span>
            </button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        {/* Controls Row */}
        <div className="input-controls-row">
          {!isRecording ? (
            <>
              <button
                className="icon-btn"
                onClick={() => {
                  setShowMediaPicker(!showMediaPicker);
                  setShowAttachMenu(false);
                }}
                title="Emojis, Stickers, GIFs"
              >
                <Smile size={20} />
              </button>

              <button
                className="icon-btn"
                onClick={() => {
                  setShowAttachMenu(!showAttachMenu);
                  setShowMediaPicker(false);
                }}
                title="Attach media, poll, location"
              >
                <Paperclip size={20} />
              </button>

              <div className="text-input-box">
                <textarea
                  ref={textareaRef}
                  className="chat-textarea"
                  rows={1}
                  placeholder="Message or type @Nova..."
                  value={text}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {text.trim() ? (
                <button
                  className="icon-btn primary"
                  onClick={handleSendText}
                  title="Send Message"
                >
                  <Send size={18} />
                </button>
              ) : (
                <button
                  className="icon-btn"
                  onClick={startVoiceRecording}
                  title="Record Voice Note"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  <Mic size={20} />
                </button>
              )}
            </>
          ) : (
            <div className="recording-active-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="rec-pulse-dot" />
                <span style={{ fontWeight: 600, fontSize: '13.5px' }}>{formatSeconds(recordingSeconds)}</span>

                {/* Real-time live audio waveform visualizer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2.5px', height: '22px', marginLeft: '6px' }}>
                  {liveWaveform.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: '3px',
                        height: `${h}%`,
                        backgroundColor: 'var(--accent-danger, #ef4444)',
                        borderRadius: '2px',
                        transition: 'height 0.08s ease'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="icon-btn"
                  style={{ color: 'var(--accent-danger)' }}
                  onClick={cancelVoiceRecording}
                  title="Cancel recording"
                >
                  <Trash2 size={18} />
                </button>

                <button
                  className="icon-btn primary"
                  style={{ background: 'var(--accent-green, #10b981)' }}
                  onClick={stopAndSendVoiceNote}
                  title="Send voice note"
                >
                  <Check size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <PollModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
      />
    </>
  );
}

function formatSeconds(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
