'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Trash2 } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────
const PITCH_W = 1200;
const PITCH_H = 800;
const MARGIN  = 50;
const PLAY_W  = PITCH_W - 2 * MARGIN;
const PLAY_H  = PITCH_H - 2 * MARGIN;
const CY      = PITCH_H / 2;

const BALL_R   = 14;
const TOKEN_R  = 28; // px in canvas coords – bigger for fingers

// ─── Types ──────────────────────────────────────────────────────────────────
interface VPlayer {
  id: string;
  team: 'home' | 'away';
  number: number;
  isGK: boolean;
  docked: boolean;
  x: number;
  y: number;
}

interface Ball { x: number; y: number; }

interface Props {
  onClose: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function buildPlayers(): VPlayer[] {
  const home: VPlayer[] = Array.from({ length: 11 }, (_, i) => ({
    id: `h${i + 1}`, team: 'home', number: i + 1,
    isGK: i === 0, docked: true, x: 0, y: 0
  }));
  const away: VPlayer[] = Array.from({ length: 11 }, (_, i) => ({
    id: `a${i + 1}`, team: 'away', number: i + 1,
    isGK: i === 0, docked: true, x: 0, y: 0
  }));
  return [...home, ...away];
}

function playerColor(p: VPlayer) {
  if (p.isGK)          return p.team === 'home' ? '#fbbf24' : '#fb923c';
  if (p.team === 'home') return '#2563eb';
  return '#dc2626';
}

// ─── Canvas drawing ──────────────────────────────────────────────────────────
function drawPitchOnCtx(ctx: CanvasRenderingContext2D) {
  // dark background
  ctx.fillStyle = '#111622';
  ctx.fillRect(0, 0, PITCH_W, PITCH_H);

  // green stripes
  const n = 15;
  const sw = PLAY_W / n;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1b2d1c' : '#233924';
    ctx.fillRect(MARGIN + i * sw, MARGIN, sw, PLAY_H);
  }

  // white lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth   = 4;
  ctx.lineCap     = 'round';

  // boundary
  ctx.strokeRect(MARGIN, MARGIN, PLAY_W, PLAY_H);

  // halfway line
  ctx.beginPath();
  ctx.moveTo(PITCH_W / 2, MARGIN);
  ctx.lineTo(PITCH_W / 2, PITCH_H - MARGIN);
  ctx.stroke();

  // centre circle
  ctx.beginPath();
  ctx.arc(PITCH_W / 2, CY, 90, 0, 2 * Math.PI);
  ctx.stroke();

  // centre dot
  ctx.beginPath();
  ctx.fillStyle = '#ffffff';
  ctx.arc(PITCH_W / 2, CY, 5, 0, 2 * Math.PI);
  ctx.fill();

  // penalty areas
  ctx.strokeRect(MARGIN,               CY - 200, 165, 400);
  ctx.strokeRect(PITCH_W - MARGIN - 165, CY - 200, 165, 400);

  // 6-yard boxes
  ctx.strokeRect(MARGIN,               CY - 90, 55, 180);
  ctx.strokeRect(PITCH_W - MARGIN - 55, CY - 90, 55, 180);

  // penalty spots
  ctx.beginPath(); ctx.fillStyle = '#ffffff';
  ctx.arc(MARGIN + 120, CY, 5, 0, 2 * Math.PI); ctx.fill();
  ctx.beginPath();
  ctx.arc(PITCH_W - MARGIN - 120, CY, 5, 0, 2 * Math.PI); ctx.fill();

  // D arcs
  const arcAngle = Math.acos(55 / 90);
  ctx.beginPath();
  ctx.arc(MARGIN + 120, CY, 90, -arcAngle, arcAngle);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(PITCH_W - MARGIN - 120, CY, 90, Math.PI - arcAngle, Math.PI + arcAngle);
  ctx.stroke();

  // corner arcs
  ctx.beginPath(); ctx.arc(MARGIN, MARGIN, 15, 0, 0.5 * Math.PI);               ctx.stroke();
  ctx.beginPath(); ctx.arc(MARGIN, PITCH_H - MARGIN, 15, 1.5 * Math.PI, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(PITCH_W - MARGIN, MARGIN, 15, 0.5 * Math.PI, Math.PI);     ctx.stroke();
  ctx.beginPath(); ctx.arc(PITCH_W - MARGIN, PITCH_H - MARGIN, 15, Math.PI, 1.5 * Math.PI); ctx.stroke();

  // goals
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(MARGIN - 30, CY - 38, 30, 76);
  ctx.strokeRect(PITCH_W - MARGIN, CY - 38, 30, 76);
}

function drawTokenOnCtx(ctx: CanvasRenderingContext2D, p: VPlayer) {
  const col = playerColor(p);
  ctx.beginPath();
  ctx.arc(p.x, p.y, TOKEN_R, 0, 2 * Math.PI);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 18px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(p.number.toString(), p.x, p.y);
}

function drawBallOnCtx(ctx: CanvasRenderingContext2D, ball: Ball) {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_R, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#1e2937';
  ctx.lineWidth = 2;
  ctx.stroke();

  // pentagon decoration
  ctx.fillStyle = '#1e2937';
  ctx.beginPath();
  const rp = 5;
  for (let i = 0; i < 5; i++) {
    const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const bx = ball.x + rp * Math.cos(a);
    const by = ball.y + rp * Math.sin(a);
    if (i === 0) ctx.moveTo(bx, by); else ctx.lineTo(bx, by);
  }
  ctx.closePath();
  ctx.fill();
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function VestuarioMode({ onClose }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);

  const [players, setPlayers]   = useState<VPlayer[]>(buildPlayers);
  const [ball, setBall]         = useState<Ball>({ x: PITCH_W / 2, y: PITCH_H / 2 });
  const [ballDocked, setBallDocked] = useState(true);

  // drag state stored in refs to avoid stale closures in pointer handlers
  const dragging = useRef<{ type: 'player' | 'ball'; id?: string } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fullscreen request ───────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (el && document.fullscreenEnabled) {
      el.requestFullscreen().catch(() => {/* ignore if denied */});
    }
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // ── Canvas scale helper ──────────────────────────────────────────────────
  const canvasScale = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { sx: 1, sy: 1, rect: null };
    const rect = canvas.getBoundingClientRect();
    return {
      sx: canvas.width / rect.width,
      sy: canvas.height / rect.height,
      rect
    };
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, PITCH_W, PITCH_H);
    drawPitchOnCtx(ctx);

    players.forEach(p => {
      if (!p.docked) drawTokenOnCtx(ctx, p);
    });

    if (!ballDocked) drawBallOnCtx(ctx, ball);
  }, [players, ball, ballDocked]);

  useEffect(() => { render(); }, [render]);

  // ── Hit-test helpers ─────────────────────────────────────────────────────
  function hitPlayer(cx: number, cy: number): VPlayer | null {
    for (let i = players.length - 1; i >= 0; i--) {
      const p = players[i];
      if (p.docked) continue;
      if (Math.hypot(cx - p.x, cy - p.y) <= TOKEN_R + 10) return p;
    }
    return null;
  }

  function hitBall(cx: number, cy: number): boolean {
    if (ballDocked) return false;
    return Math.hypot(cx - ball.x, cy - ball.y) <= BALL_R + 10;
  }

  // ── Pointer handlers on canvas ───────────────────────────────────────────
  function clientToCanvas(clientX: number, clientY: number) {
    const { sx, sy, rect } = canvasScale();
    if (!rect) return { cx: 0, cy: 0 };
    return { cx: (clientX - rect.left) * sx, cy: (clientY - rect.top) * sy };
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const { cx, cy } = clientToCanvas(e.clientX, e.clientY);

    // long-press: dock player back
    const hit = hitPlayer(cx, cy);
    const hitB = hitBall(cx, cy);

    longPressTimer.current = setTimeout(() => {
      if (hit) {
        setPlayers(prev => prev.map(p => p.id === hit.id ? { ...p, docked: true, x: 0, y: 0 } : p));
        dragging.current = null;
      }
    }, 800);

    if (hit) {
      dragging.current = { type: 'player', id: hit.id };
    } else if (hitB) {
      dragging.current = { type: 'ball' };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return;
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    const { cx, cy } = clientToCanvas(e.clientX, e.clientY);
    if (dragging.current.type === 'player' && dragging.current.id) {
      const id = dragging.current.id;
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, x: cx, y: cy, docked: false } : p));
    } else if (dragging.current.type === 'ball') {
      setBall({ x: cx, y: cy });
      setBallDocked(false);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    dragging.current = null;
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { cx, cy } = clientToCanvas(e.clientX, e.clientY);
    const hit = hitPlayer(cx, cy);
    if (hit) {
      setPlayers(prev => prev.map(p => p.id === hit.id ? { ...p, docked: true, x: 0, y: 0 } : p));
    }
  };

  // ── Dock-token drag from bench ───────────────────────────────────────────
  function handleDockTokenPointerDown(e: React.PointerEvent<HTMLDivElement>, id: string) {
    e.stopPropagation();
  }

  function handleDockTokenDragStart(e: React.DragEvent<HTMLDivElement>, id: string) {
    e.dataTransfer.setData('vestuario_player_id', id);
  }

  function handleBallDockDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData('vestuario_ball', '1');
  }

  function handleCanvasDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const pid = e.dataTransfer.getData('vestuario_player_id');
    const isBall = e.dataTransfer.getData('vestuario_ball');
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * sx;
    const cy = (e.clientY - rect.top) * sy;

    if (pid) {
      setPlayers(prev => prev.map(p => p.id === pid ? { ...p, docked: false, x: cx, y: cy } : p));
    } else if (isBall) {
      setBall({ x: cx, y: cy });
      setBallDocked(false);
    }
  }

  // ── Clear all ────────────────────────────────────────────────────────────
  const handleClear = () => {
    setPlayers(buildPlayers());
    setBallDocked(true);
    setBall({ x: PITCH_W / 2, y: PITCH_H / 2 });
  };

  // ── Derived lists ────────────────────────────────────────────────────────
  const dockedHome = players.filter(p => p.team === 'home' && p.docked);
  const dockedAway = players.filter(p => p.team === 'away' && p.docked);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#0a0f1a',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        userSelect: 'none'
      }}
    >
      {/* ── Canvas area ─────────────────────────────────────────────── */}
      <div
        style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 8px 0' }}
        onDragOver={e => e.preventDefault()}
        onDrop={handleCanvasDrop}
      >
        <canvas
          ref={canvasRef}
          width={PITCH_W}
          height={PITCH_H}
          style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.7)', touchAction: 'none', display: 'block' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onContextMenu={handleContextMenu}
        />
      </div>

      {/* ── Bottom bench bar ────────────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          background: 'rgba(11, 17, 32, 0.88)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          gap: 12,
          minHeight: 90,
          flexShrink: 0
        }}
      >
        {/* Home docked tokens */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1, justifyContent: 'flex-start', alignItems: 'center' }}>
          {dockedHome.map(p => (
            <DockToken key={p.id} player={p} onDragStart={handleDockTokenDragStart} />
          ))}
        </div>

        {/* Centre controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Ball dock */}
          {ballDocked && (
            <div
              draggable
              onDragStart={handleBallDockDragStart}
              title="Arrastra el balón al campo"
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: '#fff', border: '2px solid #1e2937',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'grab', fontSize: 22, boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
              }}
            >
              ⚽
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleClear}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(239,68,68,0.15)', color: '#f87171',
                border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10,
                padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif'
              }}
            >
              <Trash2 size={14} />
              Limpiar
            </button>
            <button
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.08)', color: '#f8fafc',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10,
                padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif'
              }}
            >
              <X size={14} />
              Salir
            </button>
          </div>
        </div>

        {/* Away docked tokens */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
          {dockedAway.map(p => (
            <DockToken key={p.id} player={p} onDragStart={handleDockTokenDragStart} />
          ))}
        </div>
      </div>

      {/* ── Hint label ─────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
        <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em' }}>
          Arrastra fichas al campo · Mantén pulsado o clic derecho para devolver al banquillo
        </span>
      </div>
    </div>
  );
}

// ── Dock Token sub-component ────────────────────────────────────────────────
function DockToken({ player, onDragStart }: { player: VPlayer; onDragStart: (e: React.DragEvent<HTMLDivElement>, id: string) => void }) {
  const col      = playerColor(player);
  const textCol  = player.isGK ? '#1e2937' : '#fff';

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, player.id)}
      title={`Jugador ${player.number}`}
      style={{
        width: 50, height: 50, borderRadius: '50%',
        background: col, border: '2px solid #ffffff33',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: textCol, fontWeight: 700, fontSize: 16,
        fontFamily: 'Inter, sans-serif',
        cursor: 'grab', flexShrink: 0,
        boxShadow: '0 3px 10px rgba(0,0,0,0.5)',
        touchAction: 'none'
      }}
    >
      {player.number}
    </div>
  );
}
