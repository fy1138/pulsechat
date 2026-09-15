import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { PhoneOff, Mic, MicOff, Video, VideoOff, PhoneCall, Volume2, Shield, Monitor, Sparkles } from 'lucide-react';

export default function CallModal() {
  const {
    callState,
    localStream,
    remoteStream,
    endCall,
    answerCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    activeChat
  } = useSocket();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Bind local camera stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState?.isVideo]);

  // Bind remote stream to remote video and audio elements
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState?.connected]);

  // Call timer
  useEffect(() => {
    let interval = null;
    if (callState?.connected) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState?.connected]);

  if (!callState) return null;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const partner = callState.isIncoming
    ? callState.caller
    : (activeChat?.recipient || { name: 'Contact' });

  const handleMuteToggle = () => {
    const muted = toggleMute();
    setIsMuted(muted);
  };

  const handleVideoToggle = () => {
    const off = toggleVideo();
    setIsVideoOff(off);
  };

  const handleScreenToggle = async () => {
    const sharing = await toggleScreenShare();
    setIsSharingScreen(sharing);
  };

  return (
    <div className="call-modal-overlay">
      {/* Remote Audio Output (Always active for hearing the other person) */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Video Stage for Video Calls */}
      {callState.isVideo && (
        <div className="call-video-stage">
          {/* Remote Video Feed (fills screen) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="call-remote-video"
          />

          {/* Local Camera Floating PIP */}
          {localStream && !isVideoOff && (
            <div className="call-local-pip" title="Your Camera Feed">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="call-local-video"
              />
            </div>
          )}
        </div>
      )}

      {/* Top Header Pill */}
      <div className="call-header-glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
          <Shield size={13} color="#10b981" />
          <span>E2E Encrypted {callState.isVideo ? 'Video' : 'Voice'} Call</span>
          {callState.connected && (
            <span style={{ marginLeft: '4px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '10px', fontWeight: 700 }}>HD</span>
          )}
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '2px 0 0', color: '#fff' }}>{partner?.name || 'Pulse Contact'}</h2>

        <div style={{ fontSize: '13.5px', color: callState.connected ? '#38bdf8' : '#e2e8f0', fontWeight: 600 }}>
          {callState.connected
            ? `Connected • ${formatTimer(callDuration)}`
            : callState.isIncoming
            ? 'Incoming Call...'
            : 'Calling...'}
        </div>
      </div>

      {/* Center Avatar & Spectrum (for Voice Call or Before Video Connects) */}
      {(!callState.isVideo || (!remoteStream && !callState.connected)) && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10 }}>
          <div className="call-avatar-pulse">
            <div className="call-pulse-ring" />
            <div className="call-pulse-ring" style={{ animationDelay: '0.6s' }} />
            {partner?.avatar ? (
              <img
                src={partner.avatar}
                alt={partner.name}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid #38bdf8', position: 'relative', zIndex: 2 }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284c7, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  fontWeight: 700,
                  position: 'relative',
                  zIndex: 2
                }}
              >
                {partner?.name?.charAt(0) || 'P'}
              </div>
            )}
          </div>

          {/* Animated Voice Spectrum Frequency Bars */}
          {callState.connected && !callState.isVideo && (
            <div className="call-audio-visualizer">
              {[12, 24, 38, 55, 78, 95, 68, 82, 50, 65, 34, 18, 42, 60, 25].map((h, idx) => (
                <div
                  key={idx}
                  className="call-audio-bar"
                  style={{
                    animationDelay: `${(idx * 0.08).toFixed(2)}s`,
                    height: `${h}%`
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Control Buttons Bar */}
      <div className="call-controls-glass">
        {callState.isIncoming && !callState.connected ? (
          <>
            <button className="call-btn end" onClick={endCall} title="Decline Call">
              <PhoneOff size={24} />
            </button>
            <button className="call-btn answer" onClick={answerCall} title="Accept Call">
              <PhoneCall size={24} />
            </button>
          </>
        ) : (
          <>
            {/* Mic Toggle */}
            <button
              className={`call-btn tool ${isMuted ? 'active' : ''}`}
              onClick={handleMuteToggle}
              title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              {isMuted ? <MicOff size={22} color="#ef4444" /> : <Mic size={22} />}
            </button>

            {/* Video Camera Toggle */}
            {callState.isVideo && (
              <button
                className={`call-btn tool ${isVideoOff ? 'active' : ''}`}
                onClick={handleVideoToggle}
                title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isVideoOff ? <VideoOff size={22} color="#ef4444" /> : <Video size={22} />}
              </button>
            )}

            {/* Screen Share Toggle */}
            {callState.isVideo && (
              <button
                className={`call-btn tool ${isSharingScreen ? 'active' : ''}`}
                onClick={handleScreenToggle}
                title={isSharingScreen ? 'Stop Screen Share' : 'Share Screen'}
              >
                <Monitor size={22} color={isSharingScreen ? '#38bdf8' : '#fff'} />
              </button>
            )}

            {/* End Call */}
            <button className="call-btn end" onClick={endCall} title="End Call">
              <PhoneOff size={24} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
