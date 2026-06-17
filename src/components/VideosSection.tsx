'use client';

import React, { useState, useEffect, useRef } from 'react';
import TacticalCanvas from './TacticalCanvas';
import { Play, Pause, Camera, Tv, AlertCircle, RefreshCw } from 'lucide-react';

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
  const [canvasBg, setCanvasBg] = useState<string | undefined>(undefined);
  const [captureNotice, setCaptureNotice] = useState<string | null>(null);

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
    }
  }, [initialPlayData]);

  // Load trigger
  const handleLoadVideo = () => {
    const parsed = parseVideoUrl(videoUrl);
    setLoadedUrl(parsed.url);
    setVideoType(parsed.type);
    setIsPlaying(false);
    setPlaySpeed(1);
    setCaptureNotice(null);
    
    // Clear canvas background if we load a new video
    if (!initialPlayData || initialPlayData.videoUrl !== videoUrl) {
      setCanvasBg(undefined);
    }
  };

  // Capture frame handler
  const handleCaptureFrame = () => {
    if (videoType === 'mp4') {
      const video = videoRef.current;
      if (!video) return;

      try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 1200;
        tempCanvas.height = 800;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
          const dataUrl = tempCanvas.toDataURL('image/png');
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

  // Wrapper for TacticalCanvas save trigger
  const handleSavePlay = (name: string, playData: any) => {
    if (onSave) {
      onSave(name, {
        ...playData,
        videoUrl: videoUrl.trim() // Link the video URL to the play object
      });
    }
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
                <div className="mp4-player-container">
                  <video
                    ref={videoRef}
                    src={loadedUrl}
                    crossOrigin="anonymous"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="mp4-video-element"
                  />
                  
                  {/* Custom Controls for MP4 */}
                  <div className="mp4-controls-overlay">
                    <button onClick={togglePlayPause} className="mp4-ctrl-btn">
                      {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    </button>

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
                <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Pega una URL y haz clic en Cargar para comenzar el análisis.</p>
              </div>
            </div>
          )}
        </div>

        {/* Capture Control Panel */}
        {loadedUrl && (
          <div className="capture-control-bar">
            <button
              onClick={handleCaptureFrame}
              className={`action-btn capture-btn ${videoType !== 'mp4' ? 'disabled-btn' : ''}`}
              title="Capturar imagen del vídeo como fondo de pizarra"
            >
              <Camera size={18} />
              <span>Capturar Fotograma</span>
            </button>
            {videoType !== 'mp4' && (
              <span className="text-muted text-xs font-semibold">
                *(Captura de fotogramas solo compatible con MP4)
              </span>
            )}
            {canvasBg && (
              <button
                onClick={() => setCanvasBg(undefined)}
                className="action-btn text-muted border-dashed"
                style={{ fontSize: '0.75rem', height: 32 }}
              >
                <RefreshCw size={12} /> Quitar Fondo
              </button>
            )}
          </div>
        )}

        {captureNotice && (
          <div className={`capture-alert-banner flex-center gap-2 ${captureNotice.startsWith('Error') ? 'error-bg' : captureNotice.startsWith('Aviso') ? 'warning-bg' : 'success-bg'}`}>
            <AlertCircle size={16} />
            <span>{captureNotice}</span>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: CANVAS */}
      <div className="videos-canvas-column">
        <TacticalCanvas
          mode="videos"
          onSave={handleSavePlay}
          backgroundImage={canvasBg}
          initialPlayData={initialPlayData}
        />
      </div>
    </div>
  );
}
