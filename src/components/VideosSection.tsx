'use client';

import React, { useState, useEffect, useRef } from 'react';
import TacticalCanvas from './TacticalCanvas';
import { Play, Pause, Camera, Tv, AlertCircle, RefreshCw, Upload } from 'lucide-react';

interface VideosSectionProps {
  onSave?: (name: string, data: any) => void;
  initialPlayData?: any;
}

export default function VideosSection({ onSave, initialPlayData }: VideosSectionProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [loadedUrl, setLoadedUrl] = useState('');
  const [videoType, setVideoType] = useState<'youtube' | 'veo' | 'mp4' | 'unknown'>('unknown');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [canvasBg, setCanvasBg] = useState<string | null>(null);
  const [captureNotice, setCaptureNotice] = useState<string | null>(null);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);

  // Rotoscopy State
  const [isRotoscopyActive, setIsRotoscopyActive]   = useState(false);
  const [trackingKeyframes, setTrackingKeyframes]   = useState<{ playerId: string; timestamp: number; x: number; y: number }[]>([]);
  const [currentTime, setCurrentTime]               = useState(0);
  const [duration, setDuration]                     = useState(0);

  // Active player selection (keyboard-driven flow)
  const [activeRotoscopyPlayerId, setActiveRotoscopyPlayerId] = useState<string | null>(null);
  const [flashKey, setFlashKey]                     = useState(0);   // incremented to trigger CSS flash
  const [showNoPlayerTooltip, setShowNoPlayerTooltip] = useState(false);

  // JSON Tracking State
  const [jsonTrackingData, setJsonTrackingData] = useState<{
    fps: number;
    duration: number;
    frames: { t: number; players: { x: number; y: number }[] }[];
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Helper to parse video URLs
  const parseVideoUrl = (url: string) => {
    let cleanUrl = url.trim();
    if (!cleanUrl) return { type: 'unknown' as const, url: '' };

    // 1. YouTube check
    if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = cleanUrl.match(regExp);
      if (match && match[2].length === 11) {
        return { type: 'youtube' as const, url: `https://www.youtube.com/embed/${match[2]}?enablejsapi=1` };
      }
    }

    // 2. Veo check
    if (cleanUrl.includes('veo.co')) {
      const match = cleanUrl.match(/video\/([a-zA-Z0-9\-]+)/);
      if (match) {
        return { type: 'veo' as const, url: `https://player.veo.co/video/${match[1]}/embed` };
      }
      if (cleanUrl.includes('/embed')) {
        return { type: 'veo' as const, url: cleanUrl };
      }
    }

    // 3. Direct Video URLs
    if (
      cleanUrl.endsWith('.mp4') ||
      cleanUrl.endsWith('.webm') ||
      cleanUrl.endsWith('.ogg') ||
      cleanUrl.includes('.mp4?') ||
      cleanUrl.includes('mp4') ||
      cleanUrl.includes('webm')
    ) {
      return { type: 'mp4' as const, url: cleanUrl };
    }

    return { type: 'unknown' as const, url: cleanUrl };
  };

  // Load play data if we're editing
  useEffect(() => {
    if (initialPlayData && initialPlayData.videoUrl) {
      setVideoUrl(initialPlayData.videoUrl);
      const parsed = parseVideoUrl(initialPlayData.videoUrl);
      setLoadedUrl(parsed.url);
      setVideoType(parsed.type);
      if (initialPlayData.backgroundImage) {
        setCanvasBg(initialPlayData.backgroundImage);
      }
      if (initialPlayData.trackingKeyframes) {
        setTrackingKeyframes(initialPlayData.trackingKeyframes);
      }
      if (initialPlayData.jsonTrackingData) {
        setJsonTrackingData(initialPlayData.jsonTrackingData);
      }
    }
  }, [initialPlayData]);

  // Clean up Object URL on localVideoUrl state change or component unmount
  useEffect(() => {
    return () => {
      if (localVideoUrl) {
        URL.revokeObjectURL(localVideoUrl);
      }
    };
  }, [localVideoUrl]);

  // ── Global keyboard shortcuts for rotoscopy player selection ───────────
  useEffect(() => {
    if (!isRotoscopyActive) return;

    // QWERTY row → away_1 … away_9 (alternative to Shift+number)
    const QWERTY_AWAY: Record<string, string> = {
      q: 'away_1', w: 'away_2', e: 'away_3', t: 'away_4',
      y: 'away_5', u: 'away_6', i: 'away_7', o: 'away_8', p: 'away_9'
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Never steal input from text fields
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Escape → deselect
      if (e.key === 'Escape') {
        setActiveRotoscopyPlayerId(null);
        return;
      }

      // Digit 1-9 (no shift) → home_1 … home_9
      if (!e.shiftKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        setActiveRotoscopyPlayerId(`home_${e.key}`);
        setFlashKey(k => k + 1);
        return;
      }
      // Digit 0 (no shift) → home_10
      if (!e.shiftKey && e.key === '0') {
        e.preventDefault();
        setActiveRotoscopyPlayerId('home_10');
        setFlashKey(k => k + 1);
        return;
      }
      // Shift+1-9 → away_1 … away_9
      if (e.shiftKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        setActiveRotoscopyPlayerId(`away_${e.key}`);
        setFlashKey(k => k + 1);
        return;
      }
      // Shift+0 → away_10
      if (e.shiftKey && e.key === '0') {
        e.preventDefault();
        setActiveRotoscopyPlayerId('away_10');
        setFlashKey(k => k + 1);
        return;
      }
      // QWERTY row letters → away players
      const lk = e.key.toLowerCase();
      if (!e.shiftKey && QWERTY_AWAY[lk]) {
        e.preventDefault();
        setActiveRotoscopyPlayerId(QWERTY_AWAY[lk]);
        setFlashKey(k => k + 1);
        return;
      }
      // 'r' alone (outside QWERTY mapping above — note 'r' is skipped intentionally)
      if (!e.shiftKey && lk === 'r') {
        e.preventDefault();
        setActiveRotoscopyPlayerId('referee');
        setFlashKey(k => k + 1);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRotoscopyActive]);

  // Reset active player when rotoscopy is deactivated
  useEffect(() => {
    if (!isRotoscopyActive) setActiveRotoscopyPlayerId(null);
  }, [isRotoscopyActive]);

  // Load trigger
  const handleLoadVideo = () => {
    // Revoke local Object URL if we are loading an external video url
    if (localVideoUrl) {
      URL.revokeObjectURL(localVideoUrl);
      setLocalVideoUrl(null);
    }

    const parsed = parseVideoUrl(videoUrl);
    setLoadedUrl(parsed.url);
    setVideoType(parsed.type);
    setIsPlaying(false);
    setPlaySpeed(1);
    setCaptureNotice(null);
    setTrackingKeyframes([]);
    setIsRotoscopyActive(false);
    setJsonTrackingData(null);
    
    // Clear canvas background if we load a new video
    if (!initialPlayData || initialPlayData.videoUrl !== videoUrl) {
      setCanvasBg(null);
    }
  };

  // Local Video Upload trigger
  const handleLocalVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke previous URL if any
    if (localVideoUrl) {
      URL.revokeObjectURL(localVideoUrl);
    }

    const url = URL.createObjectURL(file);
    setLocalVideoUrl(url);
    setLoadedUrl(url);
    setVideoType('mp4');
    setVideoUrl(file.name); // Display file name
    setIsPlaying(false);
    setPlaySpeed(1);
    setCaptureNotice(null);
    setCanvasBg(null);
    setTrackingKeyframes([]);
    setIsRotoscopyActive(false);
    setJsonTrackingData(null);
  };

  // Capture frame handler
  const handleCaptureFrame = () => {
    if (videoType === 'mp4') {
      const video = videoRef.current;
      if (!video) return;

      try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.85);
          setCanvasBg(dataUrl);
          setCaptureNotice('¡Fotograma capturado con éxito como fondo!');
          setTimeout(() => setCaptureNotice(null), 3000);
        }
      } catch (e) {
        console.error('Failed to capture frame due to CORS/security', e);
        setCaptureNotice('Error: No se pudo capturar el fotograma por políticas de seguridad del navegador (CORS).');
      }
    } else {
      setCaptureNotice('Aviso: La captura de fotogramas solo está disponible para videos MP4 directos debido a restricciones CORS de YouTube/Veo.');
      setTimeout(() => setCaptureNotice(null), 5000);
    }
  };

  // MP4 Play/Pause
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  // MP4 Speed select
  const handleSpeedChange = (speed: number) => {
    setPlaySpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Skip 1 frame back (1/30s at 30fps)
  const handlePrevFrame = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
    video.currentTime = Math.max(0, video.currentTime - 1 / 30);
    setCurrentTime(video.currentTime);
  };

  // Skip 1 frame forward (1/30s at 30fps)
  const handleNextFrame = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
    video.currentTime = Math.min(video.duration || 100, video.currentTime + 1 / 30);
    setCurrentTime(video.currentTime);
  };

  // ── Overlay click: direct keyframe registration (no popup) ──────────────
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRotoscopyActive || isPlaying) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeRotoscopyPlayerId) {
      // Register keyframe immediately — no popup needed
      const newKf = { playerId: activeRotoscopyPlayerId, timestamp: currentTime, x, y };
      setTrackingKeyframes(prev => {
        const filtered = prev.filter(k =>
          !(k.playerId === activeRotoscopyPlayerId && Math.abs(k.timestamp - currentTime) < 0.1)
        );
        return [...filtered, newKf].sort((a, b) => a.timestamp - b.timestamp);
      });
      // Trigger flash feedback
      setFlashKey(k => k + 1);
    } else {
      // No player selected — show tooltip hint
      setShowNoPlayerTooltip(true);
      setTimeout(() => setShowNoPlayerTooltip(false), 2200);
    }
  };

  // Quick-select from panel buttons (preserves backward compat for mouse-only users)
  const handleSelectPlayer = (playerId: string) => {
    setActiveRotoscopyPlayerId(playerId);
    setFlashKey(k => k + 1);
  };

  // Import JSON tracking file handler
  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data && typeof data === 'object' && Array.isArray(data.frames)) {
          setJsonTrackingData(data);
          setCaptureNotice('¡JSON de tracking importado con éxito!');
          setTimeout(() => setCaptureNotice(null), 3000);
        } else {
          setCaptureNotice('Error: El formato de JSON no contiene la estructura de frames correcta.');
          setTimeout(() => setCaptureNotice(null), 5000);
        }
      } catch (err) {
        console.error('Error parsing JSON', err);
        setCaptureNotice('Error: No se pudo parsear el archivo JSON.');
        setTimeout(() => setCaptureNotice(null), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearJsonTracking = () => {
    setJsonTrackingData(null);
  };

  // Whiteboard Play button synchronization
  const handleWhiteboardPlayChange = (playing: boolean) => {
    const video = videoRef.current;
    if (video && videoType === 'mp4') {
      if (playing) {
        video.play().catch(() => {});
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(playing);
    }
  };

  const handleSeekVideo = (time: number) => {
    const video = videoRef.current;
    if (video && videoType === 'mp4') {
      video.currentTime = time;
    }
    setCurrentTime(time);
  };

  // Wrapper for TacticalCanvas save trigger
  const handleSavePlay = (name: string, playData: any) => {
    if (onSave) {
      onSave(name, {
        ...playData,
        videoUrl: videoUrl.trim(), // Link the video URL to the play object
        trackingKeyframes, // Save tracking keyframes
        jsonTrackingData // Save imported json tracking
      });
    }
  };

  // Helper to format time into MM:SS.ms
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00.00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="videos-split-container">
      {/* LEFT COLUMN: PLAYER */}
      <div className="videos-player-column glassmorphic">
        <div className="video-input-panel">
          <span className="select-label">URL del Vídeo (YouTube, Veo o MP4 Directo)</span>
          <div className="video-input-group">
            <input
              type="text"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="Pegar enlace de YouTube, Veo o archivo MP4..."
              className="video-input-field"
            />
            <button onClick={handleLoadVideo} className="action-btn primary-btn flex-center gap-1">
              <Tv size={16} />
              <span>Cargar</span>
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="file"
              accept="video/mp4"
              id="video-upload"
              className="hidden"
              onChange={handleLocalVideoUpload}
            />
            <label
              htmlFor="video-upload"
              className="action-btn secondary-btn flex-center gap-1 cursor-pointer"
              style={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 500,
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                transition: 'var(--transition-smooth)'
              }}
            >
              <Upload size={16} />
              <span>Subir vídeo MP4</span>
            </label>

            {/* Import JSON Button */}
            <input
              type="file"
              accept=".json"
              id="json-import"
              className="hidden"
              onChange={handleJsonImport}
            />
            <label
              htmlFor="json-import"
              className="action-btn secondary-btn flex-center gap-1 cursor-pointer"
              style={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 500,
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                transition: 'var(--transition-smooth)'
              }}
            >
              <Upload size={16} style={{ color: 'var(--accent-yellow)' }} />
              <span>Importar tracking JSON</span>
            </label>
          </div>

          {/* JSON Loaded metadata & controls */}
          {jsonTrackingData && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.85rem', color: '#e2e8f0' }}>
              <span style={{ fontWeight: 500 }}>
                {jsonTrackingData.frames[0]?.players.length || 0} jugadores detectados · {jsonTrackingData.duration} segundos
              </span>
              <button
                onClick={handleClearJsonTracking}
                className="action-btn danger-border text-red"
                style={{ fontSize: '0.75rem', height: 28, padding: '0 0.5rem' }}
              >
                Limpiar tracking
              </button>
            </div>
          )}
        </div>

        {/* Player viewport */}
        <div className="video-player-wrapper">
          {loadedUrl ? (
            <>
              {videoType === 'youtube' && (
                <iframe
                  src={loadedUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="embed-player-frame"
                />
              )}
              {videoType === 'veo' && (
                <iframe
                  src={loadedUrl}
                  title="Veo video player"
                  frameBorder="0"
                  allowFullScreen
                  className="embed-player-frame"
                />
              )}
              {videoType === 'mp4' && (
                <div className="mp4-player-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <video
                    ref={videoRef}
                    src={loadedUrl}
                    crossOrigin="anonymous"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onDurationChange={(e) => setDuration(e.currentTarget.duration)}
                    className="mp4-video-element"
                    style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
                  />

                  {/* Rotoscopy Tracking Overlay */}
                  {isRotoscopyActive && (
                    <div
                      onClick={isPlaying ? undefined : handleOverlayClick}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 20,
                        cursor: isPlaying ? 'default' : 'crosshair',
                        backgroundColor: isPlaying ? 'transparent' : 'rgba(0, 0, 0, 0.15)',
                        pointerEvents: isPlaying ? 'none' : 'auto'
                      }}
                    >
                      {/* Guide Dots (Keyframes) */}
                      {trackingKeyframes.map((kf, idx) => {
                        const isHome = kf.playerId.startsWith('home');
                        const isRef = kf.playerId === 'referee';
                        const color = isRef ? '#10b981' : isHome ? '#3b82f6' : '#ef4444';
                        const num = isRef ? 'R' : kf.playerId.split('_')[1];
                        
                        // Check if keyframe is close to current video play time (within 0.8s)
                        const isClose = Math.abs(kf.timestamp - currentTime) < 0.8;
                        
                        return (
                          <div
                            key={idx}
                            style={{
                              position: 'absolute',
                              left: `${kf.x}%`,
                              top: `${kf.y}%`,
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: color,
                              border: '2px solid white',
                              transform: 'translate(-50%, -50%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              opacity: isClose ? 1.0 : 0.25,
                              boxShadow: isClose ? '0 0 0 4px rgba(255, 255, 255, 0.4)' : 'none',
                              transition: 'opacity 0.2s',
                              pointerEvents: 'none'
                            }}
                          >
                            {num}
                          </div>
                        );
                      })}

                      {/* ── "No player selected" tooltip ─────────────────── */}
                      {showNoPlayerTooltip && (
                        <div style={{
                          position: 'absolute', top: '50%', left: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: 'rgba(10,14,26,0.92)',
                          border: '1px solid rgba(251,191,36,0.5)',
                          borderRadius: 10, padding: '0.65rem 1.1rem',
                          textAlign: 'center', pointerEvents: 'none',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.6)', zIndex: 35
                        }}>
                          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24', margin: 0 }}>⚡ Sin jugador activo</p>
                          <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
                            Pulsa <strong style={{ color: '#f8fafc' }}>1–9</strong> (Local) · <strong style={{ color: '#f8fafc' }}>Shift+1–9</strong> (Visit.)<br/>
                            o selecciona una ficha en el panel inferior.
                          </p>
                        </div>
                      )}

                      {/* ── Crosshair target hint on active player ────────── */}
                      {activeRotoscopyPlayerId && (
                        <div style={{
                          position: 'absolute', top: 8, right: 8,
                          background: (() => {
                            const id = activeRotoscopyPlayerId;
                            return id === 'referee' ? 'rgba(16,185,129,0.85)'
                              : id.startsWith('home') ? 'rgba(37,99,235,0.85)'
                              : 'rgba(220,38,38,0.85)';
                          })(),
                          borderRadius: 8, padding: '0.25rem 0.6rem',
                          fontSize: '0.72rem', fontWeight: 700, color: '#fff',
                          pointerEvents: 'none', zIndex: 35,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                          animation: `kfFlash${flashKey % 2} 0.35s ease-out`
                        }}>
                          🎯 {activeRotoscopyPlayerId === 'referee' ? 'Árbitro'
                            : activeRotoscopyPlayerId.startsWith('home')
                              ? `Local ${activeRotoscopyPlayerId.split('_')[1]}`
                              : `Visit. ${activeRotoscopyPlayerId.split('_')[1]}`
                          } · clic para marcar
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Custom Controls for MP4 */}
                  <div className="mp4-controls-overlay" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem 1rem' }}>
                    {/* Time Slider */}
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        step={0.01}
                        value={currentTime}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setCurrentTime(val);
                          if (videoRef.current) {
                            videoRef.current.currentTime = val;
                          }
                        }}
                        style={{
                          flex: 1,
                          height: '4px',
                          borderRadius: '2px',
                          background: 'rgba(255,255,255,0.2)',
                          accentColor: 'var(--accent-color)',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', minWidth: '70px', textAlign: 'right' }}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    {/* Buttons Row */}
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button onClick={togglePlayPause} className="mp4-ctrl-btn">
                          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                        </button>
                        
                        {/* Frame-by-Frame Controls */}
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            onClick={handlePrevFrame}
                            className="mp4-speed-btn"
                            title="Retroceder 1 fotograma (30fps)"
                            style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
                          >
                            <span>&lt; Frame</span>
                          </button>
                          <button
                            onClick={handleNextFrame}
                            className="mp4-speed-btn"
                            title="Avanzar 1 fotograma (30fps)"
                            style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
                          >
                            <span>Frame &gt;</span>
                          </button>
                        </div>
                      </div>

                      <div className="mp4-speeds">
                        {[0.5, 1, 1.5, 2].map(speed => (
                          <button
                            key={speed}
                            onClick={() => handleSpeedChange(speed)}
                            className={`mp4-speed-btn ${playSpeed === speed ? 'active' : ''}`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {videoType === 'unknown' && (
                <div className="unknown-video-placeholder text-muted flex-center flex-col gap-2">
                  <AlertCircle size={32} />
                  <p>Formato de vídeo no reconocido automáticamente.</p>
                  <p style={{ fontSize: '0.75rem' }}>Intentando cargar mediante iframe directo...</p>
                  <iframe src={loadedUrl} className="embed-player-frame" frameBorder="0" allowFullScreen />
                </div>
              )}
            </>
          ) : (
            <div className="empty-player-state text-muted flex-center flex-col gap-4">
              <Tv size={48} className="text-secondary" />
              <div className="text-center">
                <p style={{ fontWeight: 600 }}>No hay ningún vídeo cargado</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Pega una URL o sube un archivo MP4 para comenzar el análisis.</p>
              </div>
            </div>
          )}
        </div>

        {/* Capture Control Panel */}
        {loadedUrl && (
          <div className="capture-control-bar" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={handleCaptureFrame}
              className={`action-btn capture-btn ${videoType !== 'mp4' ? 'disabled-btn' : ''}`}
              title="Capturar imagen del vídeo como fondo de pizarra"
            >
              <Camera size={18} />
              <span>Capturar Fotograma</span>
            </button>
            
            {videoType === 'mp4' && (
              <button
                onClick={() => setIsRotoscopyActive(!isRotoscopyActive)}
                className={`action-btn ${isRotoscopyActive ? 'primary-btn' : 'secondary-btn'}`}
                style={{
                  backgroundColor: isRotoscopyActive ? 'var(--accent-blue)' : undefined,
                  borderColor: isRotoscopyActive ? 'var(--accent-blue)' : undefined,
                }}
                title="Activar/Desactivar el calco táctico de trayectorias"
              >
                <Tv size={18} />
                <span>{isRotoscopyActive ? 'Desactivar Rotoscopia' : 'Activar Modo Rotoscopia'}</span>
              </button>
            )}

            {/* ── Active Player Quick-Selector (shown when Rotoscopy is ON) ─ */}
            {isRotoscopyActive && (
              <div style={{
                marginLeft: '0.25rem',
                background: 'rgba(9,13,22,0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '0.6rem 0.85rem',
                display: 'flex', flexDirection: 'column', gap: '0.45rem',
                minWidth: 280, flexShrink: 0
              }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🎯 Ficha Activa
                  </span>
                  {activeRotoscopyPlayerId ? (
                    <span
                      key={flashKey}
                      style={{
                        fontSize: '0.75rem', fontWeight: 700,
                        color: activeRotoscopyPlayerId === 'referee' ? '#10b981'
                          : activeRotoscopyPlayerId.startsWith('home') ? '#60a5fa' : '#f87171',
                        background: activeRotoscopyPlayerId === 'referee' ? 'rgba(16,185,129,0.15)'
                          : activeRotoscopyPlayerId.startsWith('home') ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                        border: `1px solid ${activeRotoscopyPlayerId === 'referee' ? 'rgba(16,185,129,0.4)' : activeRotoscopyPlayerId.startsWith('home') ? 'rgba(59,130,246,0.4)' : 'rgba(239,68,68,0.4)'}`,
                        borderRadius: 6, padding: '0.15rem 0.5rem'
                      }}>
                      {activeRotoscopyPlayerId === 'referee' ? '🟢 Árbitro'
                        : activeRotoscopyPlayerId.startsWith('home')
                          ? `🔵 Local ${activeRotoscopyPlayerId.split('_')[1]}`
                          : `🔴 Visit. ${activeRotoscopyPlayerId.split('_')[1]}`
                      }
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>Ninguna — pulsa un número</span>
                  )}
                  {activeRotoscopyPlayerId && (
                    <button onClick={() => setActiveRotoscopyPlayerId(null)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.75rem', padding: '0 0.25rem' }}
                      title="Deseleccionar (Escape)">
                      ✕
                    </button>
                  )}
                </div>

                {/* Home row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.6rem', color: '#60a5fa', fontWeight: 700, minWidth: 28 }}>LOC</span>
                  {Array.from({ length: 11 }, (_, i) => i + 1).map(n => (
                    <button key={`h${n}`} onClick={() => handleSelectPlayer(`home_${n}`)}
                      title={`Local ${n} (tecla ${n <= 9 ? n : '0'})`}
                      style={{
                        width: 24, height: 24, borderRadius: '50%', fontSize: '0.68rem', fontWeight: 700,
                        background: activeRotoscopyPlayerId === `home_${n}` ? '#2563eb' : 'rgba(37,99,235,0.18)',
                        border: activeRotoscopyPlayerId === `home_${n}` ? '2px solid #60a5fa' : '1px solid rgba(59,130,246,0.3)',
                        color: '#fff', cursor: 'pointer', transition: 'all 0.15s'
                      }}>{n}</button>
                  ))}
                </div>

                {/* Away row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.6rem', color: '#f87171', fontWeight: 700, minWidth: 28 }}>VIS</span>
                  {Array.from({ length: 11 }, (_, i) => i + 1).map(n => (
                    <button key={`a${n}`} onClick={() => handleSelectPlayer(`away_${n}`)}
                      title={`Visitante ${n} (Shift+${n <= 9 ? n : '0'})`}
                      style={{
                        width: 24, height: 24, borderRadius: '50%', fontSize: '0.68rem', fontWeight: 700,
                        background: activeRotoscopyPlayerId === `away_${n}` ? '#dc2626' : 'rgba(220,38,38,0.18)',
                        border: activeRotoscopyPlayerId === `away_${n}` ? '2px solid #f87171' : '1px solid rgba(239,68,68,0.3)',
                        color: '#fff', cursor: 'pointer', transition: 'all 0.15s'
                      }}>{n}</button>
                  ))}
                  <button onClick={() => handleSelectPlayer('referee')}
                    style={{
                      padding: '0 6px', height: 24, borderRadius: 6, fontSize: '0.6rem', fontWeight: 700,
                      background: activeRotoscopyPlayerId === 'referee' ? '#10b981' : 'rgba(16,185,129,0.18)',
                      border: activeRotoscopyPlayerId === 'referee' ? '2px solid #34d399' : '1px solid rgba(16,185,129,0.3)',
                      color: '#fff', cursor: 'pointer', transition: 'all 0.15s'
                    }}>ARB</button>
                </div>

                {/* Keyboard legend */}
                <p style={{ fontSize: '0.62rem', color: '#475569', margin: 0, lineHeight: 1.4 }}>
                  ⌨ <strong style={{ color: '#64748b' }}>1–9</strong> Local &nbsp;·&nbsp;
                  <strong style={{ color: '#64748b' }}>Shift+1–9</strong> Visitante &nbsp;·&nbsp;
                  <strong style={{ color: '#64748b' }}>R</strong> Árbitro &nbsp;·&nbsp;
                  <strong style={{ color: '#64748b' }}>Esc</strong> Deseleccionar
                </p>
              </div>
            )}

            {videoType !== 'mp4' && (
              <span className="text-muted text-xs font-semibold">
                *(Controles avanzados y captura solo compatibles con MP4)
              </span>
            )}

            {canvasBg && (
              <button
                onClick={() => setCanvasBg(null)}
                className="action-btn text-muted border-dashed"
                style={{ fontSize: '0.75rem', height: 32 }}
              >
                <RefreshCw size={12} /> Quitar Fondo
              </button>
            )}

            {trackingKeyframes.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('¿Quieres limpiar todos los puntos de tracking registrados?')) {
                    setTrackingKeyframes([]);
                  }
                }}
                className="action-btn danger-border text-red"
                style={{ fontSize: '0.75rem', height: 32 }}
              >
                Limpiar Tracking ({trackingKeyframes.length})
              </button>
            )}
          </div>
        )}

        {/* ── Keyframe Summary Panel ─────────────────────────────────── */}
        {isRotoscopyActive && trackingKeyframes.length > 0 && (() => {
          // Group keyframes by player
          const byPlayer: Record<string, typeof trackingKeyframes> = {};
          trackingKeyframes.forEach(kf => {
            if (!byPlayer[kf.playerId]) byPlayer[kf.playerId] = [];
            byPlayer[kf.playerId].push(kf);
          });

          const playerEntries = Object.entries(byPlayer).sort(([a], [b]) => {
            // home first, sorted numerically, then away, then referee
            const teamA = a.startsWith('home') ? 0 : a === 'referee' ? 2 : 1;
            const teamB = b.startsWith('home') ? 0 : b === 'referee' ? 2 : 1;
            if (teamA !== teamB) return teamA - teamB;
            return parseInt(a.split('_')[1] || '0') - parseInt(b.split('_')[1] || '0');
          });

          return (
            <div style={{
              marginTop: '0.75rem',
              background: 'rgba(9, 13, 22, 0.85)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  📍 Keyframes de Rotoscopia — {trackingKeyframes.length} total
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {playerEntries.length} jugadores calçados
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {playerEntries.map(([playerId, kfs]) => {
                  const isHome = playerId.startsWith('home');
                  const isRef  = playerId === 'referee';
                  const col    = isRef ? '#10b981' : isHome ? '#3b82f6' : '#ef4444';
                  const bg     = isRef ? 'rgba(16,185,129,0.12)' : isHome ? 'rgba(59,130,246,0.12)' : 'rgba(239,68,68,0.12)';
                  const num    = isRef ? 'R' : playerId.split('_')[1];
                  const label  = isRef ? 'Árbitro' : `${isHome ? 'Local' : 'Visit.'} ${num}`;
                  const minT   = Math.min(...kfs.map(k => k.timestamp)).toFixed(1);
                  const maxT   = Math.max(...kfs.map(k => k.timestamp)).toFixed(1);
                  return (
                    <div key={playerId} style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      background: bg, border: `1px solid ${col}40`,
                      borderRadius: '6px', padding: '0.2rem 0.5rem',
                      fontSize: '0.72rem', color: '#e2e8f0'
                    }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: col, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 10, flexShrink: 0 }}>
                        {num}
                      </span>
                      <span style={{ fontWeight: 600 }}>{label}</span>
                      <span style={{ color: col, fontWeight: 700 }}>{kfs.length} KF</span>
                      <span style={{ color: '#64748b' }}>[{minT}s → {maxT}s]</span>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: '0.7rem', color: '#475569', margin: 0 }}>
                ▶ Pulsa <strong style={{ color: '#e2e8f0' }}>Play Tracking</strong> en la pizarra de la derecha para reproducir la animación LERP.
              </p>
            </div>
          );
        })()}


        {captureNotice && (
          <div className={`capture-alert-banner flex-center gap-2 ${captureNotice.startsWith('Error') ? 'error-bg' : captureNotice.startsWith('Aviso') ? 'warning-bg' : 'success-bg'}`}>
            <AlertCircle size={16} />
            <span>{captureNotice}</span>
          </div>
        )}

        {/* Instructions Card */}
        <div 
          className="instructions-card" 
          style={{
            backgroundColor: '#090d16',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginTop: '1rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}
        >
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--accent-color)' }}>💡</span> Instrucciones de Uso
          </h3>
          <ol className="list-decimal pl-5 text-sm space-y-1 text-gray-300">
            <li>Sube un vídeo MP4 o pega una URL.</li>
            <li>Reproduce y pausa en el momento que quieres analizar.</li>
            <li>Pulsa &quot;Capturar Fotograma&quot;.</li>
            <li>Coloca las fichas sobre los jugadores que ves en el fondo.</li>
            <li>Guarda la jugada en tu Biblioteca.</li>
          </ol>
        </div>
      </div>

      {/* RIGHT COLUMN: CANVAS */}
      <div className="videos-canvas-column">
        <TacticalCanvas
          mode="videos"
          onSave={handleSavePlay}
          backgroundImage={canvasBg || undefined}
          onClearBackground={() => setCanvasBg(null)}
          initialPlayData={initialPlayData}
          trackingKeyframes={trackingKeyframes}
          jsonTrackingData={jsonTrackingData}
          onClearJsonTracking={handleClearJsonTracking}
          videoCurrentTime={currentTime}
          videoIsPlaying={isPlaying}
          onPlayStateChange={handleWhiteboardPlayChange}
          hasVideo={!!loadedUrl}
          onSeekVideo={handleSeekVideo}
        />
      </div>
    </div>
  );
}
