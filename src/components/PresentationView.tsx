'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SavedPlay } from '../app/page';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  Layers,
  Video
} from 'lucide-react';

const PITCH_WIDTH = 1200;
const PITCH_HEIGHT = 800;
const MARGIN = 50;
const PLAY_WIDTH = PITCH_WIDTH - 2 * MARGIN;
const PLAY_HEIGHT = PITCH_HEIGHT - 2 * MARGIN;
const centerY = PITCH_HEIGHT / 2;

const PLAYER_RADIUS = 22;
const BALL_RADIUS = 12;

const hexToRgba = (hex: string, alpha: number) => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface PresentationViewProps {
  plays: SavedPlay[];
  initialPlayId?: string | null;
  onClose?: () => void;
}

export default function PresentationView({ plays, initialPlayId, onClose }: PresentationViewProps) {
  const [activePlayIndex, setActivePlayIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Set active play index from initial play ID if provided
  useEffect(() => {
    if (initialPlayId && plays.length > 0) {
      const idx = plays.findIndex(p => p.id === initialPlayId);
      if (idx !== -1) {
        setActivePlayIndex(idx);
      }
    }
  }, [initialPlayId, plays]);

  const activePlay = plays[activePlayIndex];

  // Draw Field on canvas
  const drawPitch = (ctx: CanvasRenderingContext2D, pitchType: 'full' | 'half') => {
    ctx.fillStyle = '#111622';
    ctx.fillRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);

    if (pitchType === 'full') {
      const stripesCount = 15;
      const stripeWidth = PLAY_WIDTH / stripesCount;
      for (let i = 0; i < stripesCount; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#1b2d1c' : '#233924';
        ctx.fillRect(MARGIN + i * stripeWidth, MARGIN, stripeWidth, PLAY_HEIGHT);
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'miter';

      ctx.strokeRect(MARGIN, MARGIN, PLAY_WIDTH, PLAY_HEIGHT);

      ctx.beginPath();
      ctx.moveTo(PITCH_WIDTH / 2, MARGIN);
      ctx.lineTo(PITCH_WIDTH / 2, PITCH_HEIGHT - MARGIN);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(PITCH_WIDTH / 2, centerY, 90, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(PITCH_WIDTH / 2, centerY, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeRect(MARGIN, centerY - 200, 165, 400);
      ctx.strokeRect(PITCH_WIDTH - MARGIN - 165, centerY - 200, 165, 400);

      ctx.strokeRect(MARGIN, centerY - 90, 55, 180);
      ctx.strokeRect(PITCH_WIDTH - MARGIN - 55, centerY - 90, 55, 180);

      ctx.beginPath(); ctx.arc(MARGIN + 120, centerY, 5, 0, 2 * Math.PI); ctx.fill();
      ctx.beginPath(); ctx.arc(PITCH_WIDTH - MARGIN - 120, centerY, 5, 0, 2 * Math.PI); ctx.fill();

      const arcAngle = Math.acos(55 / 90);
      ctx.beginPath(); ctx.arc(MARGIN + 120, centerY, 90, -arcAngle, arcAngle); ctx.stroke();
      ctx.beginPath(); ctx.arc(PITCH_WIDTH - MARGIN - 120, centerY, 90, Math.PI - arcAngle, Math.PI + arcAngle); ctx.stroke();

      ctx.beginPath(); ctx.arc(MARGIN, MARGIN, 15, 0, 0.5 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(MARGIN, PITCH_HEIGHT - MARGIN, 15, 1.5 * Math.PI, 2 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(PITCH_WIDTH - MARGIN, MARGIN, 15, 0.5 * Math.PI, Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(PITCH_WIDTH - MARGIN, PITCH_HEIGHT - MARGIN, 15, Math.PI, 1.5 * Math.PI); ctx.stroke();

      // Goals
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(MARGIN - 30, centerY - 38, 30, 76);
      ctx.strokeRect(PITCH_WIDTH - MARGIN, centerY - 38, 30, 76);

      // Nets
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = MARGIN - 30; x <= MARGIN; x += 10) { ctx.moveTo(x, centerY - 38); ctx.lineTo(x, centerY + 38); }
      for (let y = centerY - 38; y <= centerY + 38; y += 10) { ctx.moveTo(MARGIN - 30, y); ctx.lineTo(MARGIN, y); }
      for (let x = PITCH_WIDTH - MARGIN; x <= PITCH_WIDTH - MARGIN + 30; x += 10) { ctx.moveTo(x, centerY - 38); ctx.lineTo(x, centerY + 38); }
      for (let y = centerY - 38; y <= centerY + 38; y += 10) { ctx.moveTo(PITCH_WIDTH - MARGIN, y); ctx.lineTo(PITCH_WIDTH - MARGIN + 30, y); }
      ctx.stroke();
    } else {
      const stripesCount = 8;
      const stripeWidth = PLAY_WIDTH / stripesCount;
      for (let i = 0; i < stripesCount; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#1b2d1c' : '#233924';
        ctx.fillRect(MARGIN + i * stripeWidth, MARGIN, stripeWidth, PLAY_HEIGHT);
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'miter';

      ctx.strokeRect(MARGIN, MARGIN, PLAY_WIDTH, PLAY_HEIGHT);
      ctx.strokeRect(MARGIN, centerY - 280, 330, 560);
      ctx.strokeRect(MARGIN, centerY - 120, 110, 240);

      ctx.beginPath(); ctx.arc(MARGIN + 240, centerY, 5, 0, 2 * Math.PI); ctx.fill();
      const arcAngle = Math.acos(90 / 180);
      ctx.beginPath(); ctx.arc(MARGIN + 240, centerY, 180, -arcAngle, arcAngle); ctx.stroke();

      ctx.beginPath(); ctx.arc(PITCH_WIDTH - MARGIN, centerY, 180, 0.5 * Math.PI, 1.5 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(PITCH_WIDTH - MARGIN, centerY, 5, 0, 2 * Math.PI); ctx.fill();

      ctx.beginPath(); ctx.arc(MARGIN, MARGIN, 25, 0, 0.5 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(MARGIN, PITCH_HEIGHT - MARGIN, 25, 1.5 * Math.PI, 2 * Math.PI); ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(MARGIN - 40, centerY - 50, 40, 100);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = MARGIN - 40; x <= MARGIN; x += 10) { ctx.moveTo(x, centerY - 50); ctx.lineTo(x, centerY + 50); }
      for (let y = centerY - 50; y <= centerY + 50; y += 10) { ctx.moveTo(MARGIN - 40, y); ctx.lineTo(MARGIN, y); }
      ctx.stroke();
    }
  };

  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activePlay) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Apply zoom & pan translation
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomScale, zoomScale);

    // 1. Pitch
    drawPitch(ctx, activePlay.pitchType || 'full');

    // 2. Drawings
    (activePlay.drawings || []).forEach(item => {
      ctx.strokeStyle = item.color;
      ctx.fillStyle = item.color;
      if (item.type !== 'text') {
        ctx.lineWidth = item.thickness;
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (item.type === 'freehand') {
        ctx.beginPath();
        item.points.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      } else if (item.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(item.start.x, item.start.y);
        ctx.lineTo(item.end.x, item.end.y);
        ctx.stroke();
      } else if (item.type === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(item.start.x, item.start.y);
        ctx.lineTo(item.end.x, item.end.y);
        ctx.stroke();

        const start = item.start;
        const end = item.end;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 5) {
          const angle = Math.atan2(dy, dx);
          const arrowLength = 16 + item.thickness;
          ctx.beginPath();
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - arrowLength * Math.cos(angle - Math.PI / 6),
            end.y - arrowLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            end.x - arrowLength * Math.cos(angle + Math.PI / 6),
            end.y - arrowLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
        }
      } else if (item.type === 'circle') {
        ctx.beginPath();
        ctx.arc(item.center.x, item.center.y, item.radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (item.type === 'zone') {
        ctx.fillStyle = hexToRgba(item.color, 0.25);
        const w = item.end.x - item.start.x;
        const h = item.end.y - item.start.y;
        ctx.fillRect(item.start.x, item.start.y, w, h);
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(item.start.x, item.start.y, w, h);
      } else if (item.type === 'text') {
        ctx.fillStyle = item.color;
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.text, item.position.x, item.position.y);
      }
    });

    // 3. Equipment (conos, porterías, hoops, poles)
    (activePlay.equipment || []).forEach(item => {
      if (item.type === 'cone') {
        ctx.fillStyle = '#f97316'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(item.x, item.y - 14); ctx.lineTo(item.x - 12, item.y + 12); ctx.lineTo(item.x + 12, item.y + 12); ctx.closePath();
        ctx.fill(); ctx.stroke();
      } else if (item.type === 'goal') {
        ctx.fillStyle = 'rgba(100, 116, 139, 0.4)'; ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.rect(item.x - 18, item.y - 12, 36, 24); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; ctx.lineWidth = 1.0; ctx.beginPath();
        ctx.moveTo(item.x - 6, item.y - 12); ctx.lineTo(item.x - 6, item.y + 12); ctx.moveTo(item.x + 6, item.y - 12); ctx.lineTo(item.x + 6, item.y + 12); ctx.stroke();
      } else if (item.type === 'pole') {
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(item.x, item.y + 18); ctx.lineTo(item.x, item.y - 18); ctx.stroke();
        ctx.fillStyle = '#eab308';
        ctx.beginPath(); ctx.moveTo(item.x, item.y - 18); ctx.lineTo(item.x + 12, item.y - 13); ctx.lineTo(item.x, item.y - 8); ctx.closePath(); ctx.fill();
      } else if (item.type === 'hoop') {
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.arc(item.x, item.y, 16, 0, 2 * Math.PI); ctx.stroke();
      }
    });

    // 4. Players
    (activePlay.players || []).forEach(pl => {
      ctx.beginPath();
      ctx.arc(pl.x, pl.y, PLAYER_RADIUS, 0, 2 * Math.PI);

      if (pl.isGK) {
        ctx.fillStyle = '#fbbf24'; ctx.fill(); ctx.strokeStyle = '#1e2937'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#1e2937';
      } else {
        if (pl.colorTag) {
          ctx.fillStyle =
            pl.colorTag === 'blue'
              ? '#2563eb'
              : pl.colorTag === 'red'
              ? '#dc2626'
              : pl.colorTag === 'green'
              ? '#10b981'
              : '#f97316';
        } else {
          ctx.fillStyle = pl.team === 'home' ? '#2563eb' : '#dc2626';
        }
        ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#ffffff';
      }

      ctx.font = 'bold 16px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(pl.number.toString(), pl.x, pl.y);
    });

    // 5. Ball
    const ball = activePlay.ball;
    if (ball) {
      ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, 2 * Math.PI); ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = '#1e2937'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.fillStyle = '#1e2937';
      const rPent = 4;
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const px = ball.x + rPent * Math.cos(angle); const py = ball.y + rPent * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.strokeStyle = '#1e2937'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const px1 = ball.x + rPent * Math.cos(angle); const py1 = ball.y + rPent * Math.sin(angle);
        const px2 = ball.x + BALL_RADIUS * Math.cos(angle); const py2 = ball.y + BALL_RADIUS * Math.sin(angle);
        ctx.moveTo(px1, py1); ctx.lineTo(px2, py2);
      }
      ctx.stroke();
    }

    // 6. Laser Pointer (drawn inside zoom context with responsive scale)
    if (laserPos) {
      ctx.beginPath();
      ctx.arc(laserPos.x, laserPos.y, 8 / zoomScale, 0, 2 * Math.PI);
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.fill();
      
      // Laser core
      ctx.beginPath();
      ctx.arc(laserPos.x, laserPos.y, 3 / zoomScale, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Reset shadows
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }, [activePlay, zoomScale, panOffset, laserPos]);

  useEffect(() => {
    drawAll();
  }, [drawAll]);

  // Zoom with scroll wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomStep = 0.15;
    const isZoomingIn = e.deltaY < 0;
    const newScale = Math.max(1.0, Math.min(3.5, isZoomingIn ? zoomScale + zoomStep : zoomScale - zoomStep));

    if (newScale !== zoomScale) {
      // Pan offset correction so zoom centers on cursor
      const scaleChange = newScale / zoomScale;
      const newPanX = mouseX - (mouseX - panOffset.x) * scaleChange;
      const newPanY = mouseY - (mouseY - panOffset.y) * scaleChange;

      setZoomScale(newScale);
      setPanOffset(newScale === 1.0 ? { x: 0, y: 0 } : { x: newPanX, y: newPanY });
    }
  };

  // Dragging to Pan (Click and hold)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Laser position coordinates relative to canvas pixels (and zoom translation)
    const lx = (clientX * scaleX - panOffset.x) / zoomScale;
    const ly = (clientY * scaleY - panOffset.y) / zoomScale;
    setLaserPos({ x: lx, y: ly });

    if (isDragging && zoomScale > 1.0) {
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;

      // Restrict panning box
      const maxPanWidth = (zoomScale - 1) * canvas.width;
      const maxPanHeight = (zoomScale - 1) * canvas.height;
      
      setPanOffset({
        x: Math.max(-maxPanWidth, Math.min(0, newX)),
        y: Math.max(-maxPanHeight, Math.min(0, newY))
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  const handlePointerLeave = () => {
    setLaserPos(null);
    setIsDragging(false);
  };

  // Navigations
  const handlePrevPlay = () => {
    if (plays.length === 0) return;
    setActivePlayIndex(prev => (prev === 0 ? plays.length - 1 : prev - 1));
    resetZoom();
  };

  const handleNextPlay = () => {
    if (plays.length === 0) return;
    setActivePlayIndex(prev => (prev === plays.length - 1 ? 0 : prev + 1));
    resetZoom();
  };

  const resetZoom = () => {
    setZoomScale(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  if (plays.length === 0) {
    return (
      <div className="empty-presentation glassmorphic flex-center flex-col gap-4">
        <p className="text-muted">No tienes jugadas guardadas en tu biblioteca para presentar.</p>
        {onClose && (
          <button onClick={onClose} className="action-btn">
            Volver al Panel
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="presentation-container">
      {/* LEFT DRAWER CAROUSEL */}
      <div className="pres-carousel glassmorphic">
        <h3 className="carousel-title">Lista de Jugadas</h3>
        <div className="carousel-list">
          {plays.map((play, idx) => (
            <div
              key={play.id}
              onClick={() => {
                setActivePlayIndex(idx);
                resetZoom();
              }}
              className={`carousel-item ${idx === activePlayIndex ? 'active' : ''}`}
            >
              <div className="carousel-thumbnail">
                {play.thumbnail ? (
                  <img src={play.thumbnail} alt={play.name} className="carousel-thumbnail-img" />
                ) : (
                  <div className="carousel-placeholder-icon">⚽</div>
                )}
              </div>
              <div className="carousel-info">
                <span className="carousel-name">{play.name}</span>
                <span className={`badge badge-sm ${play.category === 'Táctica' ? 'badge-blue' : play.category === 'Balón parado' ? 'badge-yellow' : 'badge-orange'}`}>
                  {play.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER STAGE */}
      <div className="pres-stage">
        {/* Canvas Display */}
        <div className="canvas-wrapper pres-canvas-wrapper glassmorphic">
          <canvas
            ref={canvasRef}
            width={PITCH_WIDTH}
            height={PITCH_HEIGHT}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            className="pitch-canvas presentation-canvas"
          />
        </div>

        {/* BOTTOM CONTROLLER BAR */}
        <div className="pres-navbar glassmorphic">
          {/* Active play descriptions */}
          <div className="pres-meta">
            <h2 className="pres-name">{activePlay.name}</h2>
            <div className="flex-center gap-2">
              <span className={`badge ${activePlay.category === 'Táctica' ? 'badge-blue' : activePlay.category === 'Balón parado' ? 'badge-yellow' : 'badge-orange'}`}>
                {activePlay.category}
              </span>
              {activePlay.pitchType && (
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {activePlay.pitchType === 'full' ? 'Campo Completo' : 'Medio Campo'}
                </span>
              )}
            </div>
          </div>

          {/* Navigation and zoom reset */}
          <div className="pres-controls">
            <button onClick={handlePrevPlay} className="tool-btn" title="Anterior Jugada">
              <ChevronLeft size={20} />
            </button>
            <span className="pres-pagination text-muted">
              {activePlayIndex + 1} / {plays.length}
            </span>
            <button onClick={handleNextPlay} className="tool-btn" title="Siguiente Jugada">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="pres-zoom-panel">
            {zoomScale > 1.0 && (
              <button onClick={resetZoom} className="action-btn flex-center gap-1 danger-border text-red" title="Resetear Zoom">
                <RotateCcw size={14} />
                <span>Restablecer</span>
              </button>
            )}
            <span className="text-muted text-sm select-none">
              Zoom: {Math.round(zoomScale * 100)}%
            </span>
            {onClose && (
              <button onClick={onClose} className="action-btn flex-center gap-1" title="Cerrar Presentación">
                <Minimize2 size={16} />
                <span>Salir</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
