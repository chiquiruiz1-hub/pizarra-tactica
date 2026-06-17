'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MousePointer,
  ArrowUpRight,
  Edit2,
  Slash,
  Trash2,
  Play,
  Square,
  RotateCcw,
  Download,
  Share2,
  Check,
  Video
} from 'lucide-react';

// Pitch coordinate dimensions
const PITCH_WIDTH = 1200;
const PITCH_HEIGHT = 800;
const MARGIN = 50;
const PLAY_WIDTH = PITCH_WIDTH - 2 * MARGIN;
const PLAY_HEIGHT = PITCH_HEIGHT - 2 * MARGIN;

// Player/Ball dimensions
const PLAYER_RADIUS = 22;
const BALL_RADIUS = 12;

type Position = { x: number; y: number };

type Player = {
  id: string;
  team: 'home' | 'away';
  number: number;
  isGK: boolean;
  x: number;
  y: number;
};

type Drawing =
  | { type: 'freehand'; color: string; points: Position[] }
  | { type: 'line'; color: string; start: Position; end: Position }
  | { type: 'arrow'; color: string; start: Position; end: Position };

type Frame = {
  timestamp: number;
  players: { id: string; x: number; y: number }[];
  ball: Position;
};

// Formation percentages (0 to 100 on playing pitch)
const homeFormations: Record<string, Position[]> = {
  '4-3-3': [
    { x: 5, y: 50 }, // GK
    { x: 22, y: 15 }, { x: 20, y: 38 }, { x: 20, y: 62 }, { x: 22, y: 85 }, // DEF
    { x: 38, y: 30 }, { x: 32, y: 50 }, { x: 38, y: 70 }, // MID
    { x: 48, y: 15 }, { x: 48, y: 50 }, { x: 48, y: 85 }  // FW
  ],
  '4-4-2': [
    { x: 5, y: 50 }, // GK
    { x: 22, y: 15 }, { x: 20, y: 38 }, { x: 20, y: 62 }, { x: 22, y: 85 }, // DEF
    { x: 38, y: 15 }, { x: 38, y: 38 }, { x: 38, y: 62 }, { x: 38, y: 85 }, // MID
    { x: 48, y: 33 }, { x: 48, y: 67 }  // FW
  ],
  '4-2-3-1': [
    { x: 5, y: 50 }, // GK
    { x: 22, y: 15 }, { x: 20, y: 38 }, { x: 20, y: 62 }, { x: 22, y: 85 }, // DEF
    { x: 32, y: 35 }, { x: 32, y: 65 }, // DM
    { x: 42, y: 20 }, { x: 40, y: 50 }, { x: 42, y: 80 }, // AM
    { x: 48, y: 50 }  // FW
  ],
  '3-5-2': [
    { x: 5, y: 50 }, // GK
    { x: 20, y: 28 }, { x: 20, y: 50 }, { x: 20, y: 72 }, // DEF
    { x: 36, y: 15 }, { x: 34, y: 35 }, { x: 32, y: 50 }, { x: 34, y: 65 }, { x: 36, y: 85 }, // MID
    { x: 48, y: 33 }, { x: 48, y: 67 }  // FW
  ]
};

const awayFormations: Record<string, Position[]> = {
  '4-3-3': [
    { x: 95, y: 50 }, // GK
    { x: 78, y: 85 }, { x: 80, y: 62 }, { x: 80, y: 38 }, { x: 78, y: 15 }, // DEF
    { x: 62, y: 70 }, { x: 68, y: 50 }, { x: 62, y: 30 }, // MID
    { x: 52, y: 85 }, { x: 52, y: 50 }, { x: 52, y: 15 }  // FW
  ],
  '4-4-2': [
    { x: 95, y: 50 }, // GK
    { x: 78, y: 85 }, { x: 80, y: 62 }, { x: 80, y: 38 }, { x: 78, y: 15 }, // DEF
    { x: 62, y: 85 }, { x: 62, y: 62 }, { x: 62, y: 38 }, { x: 62, y: 15 }, // MID
    { x: 52, y: 67 }, { x: 52, y: 33 }  // FW
  ],
  '4-2-3-1': [
    { x: 95, y: 50 }, // GK
    { x: 78, y: 85 }, { x: 80, y: 62 }, { x: 80, y: 38 }, { x: 78, y: 15 }, // DEF
    { x: 68, y: 65 }, { x: 68, y: 35 }, // DM
    { x: 58, y: 80 }, { x: 60, y: 50 }, { x: 58, y: 20 }, // AM
    { x: 52, y: 50 }  // FW
  ],
  '3-5-2': [
    { x: 95, y: 50 }, // GK
    { x: 80, y: 72 }, { x: 80, y: 50 }, { x: 80, y: 28 }, // DEF
    { x: 64, y: 85 }, { x: 66, y: 65 }, { x: 68, y: 50 }, { x: 66, y: 35 }, { x: 64, y: 15 }, // MID
    { x: 52, y: 67 }, { x: 52, y: 33 }  // FW
  ]
};

// Convert percentage coordinates to canvas points
const pctToCanvas = (pctX: number, pctY: number): Position => {
  return {
    x: MARGIN + (pctX / 100) * PLAY_WIDTH,
    y: MARGIN + (pctY / 100) * PLAY_HEIGHT
  };
};

// Compact serialization for URL sharing
const serializeState = (players: Player[], ball: Position, drawings: Drawing[]) => {
  const p = players.map(pl => [pl.id, Math.round(pl.x), Math.round(pl.y)]);
  const b = [Math.round(ball.x), Math.round(ball.y)];
  const d = drawings.map(dr => {
    if (dr.type === 'freehand') {
      return ['f', dr.color, dr.points.map(pt => [Math.round(pt.x), Math.round(pt.y)])];
    } else {
      return [
        dr.type === 'arrow' ? 'a' : 'l',
        dr.color,
        Math.round(dr.start.x),
        Math.round(dr.start.y),
        Math.round(dr.end.x),
        Math.round(dr.end.y)
      ];
    }
  });
  const data = { p, b, d };
  return btoa(JSON.stringify(data));
};

const deserializeState = (code: string) => {
  try {
    const decoded = JSON.parse(atob(code));
    const players: Player[] = decoded.p.map(([id, x, y]: any) => {
      const team = id.startsWith('home') ? 'home' : 'away';
      const number = parseInt(id.split('_')[1]);
      const isGK = number === 1;
      return { id, team, number, isGK, x, y };
    });
    const ball: Position = { x: decoded.b[0], y: decoded.b[1] };
    const drawings: Drawing[] = decoded.d.map((dr: any) => {
      const type = dr[0] === 'f' ? 'freehand' : dr[0] === 'a' ? 'arrow' : 'line';
      const color = dr[1];
      if (type === 'freehand') {
        return { type, color, points: dr[2].map(([x, y]: any) => ({ x, y })) };
      } else {
        return { type, color, start: { x: dr[2], y: dr[3] }, end: { x: dr[4], y: dr[5] } };
      }
    });
    return { players, ball, drawings };
  } catch (e) {
    console.error('Failed to parse board state from URL', e);
    return null;
  }
};

export default function TacticalBoard() {
  const searchParams = useSearchParams();

  // State declaration
  const [formHome, setFormHome] = useState<string>('4-3-3');
  const [formAway, setFormAway] = useState<string>('4-4-2');
  const [toolMode, setToolMode] = useState<'move' | 'arrow' | 'freehand' | 'line'>('move');
  const [drawingColor, setDrawingColor] = useState<string>('#ffffff');

  // Player and ball positions
  const [players, setPlayers] = useState<Player[]>([]);
  const [ball, setBall] = useState<Position>({ x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2 });

  // Drawings
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [activeDrawing, setActiveDrawing] = useState<Drawing | null>(null);

  // Recording and Playback
  const [isRecording, setIsRecording] = useState(false);
  const [recordingFrames, setRecordingFrames] = useState<Frame[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [initialState, setInitialState] = useState<{
    players: Player[];
    ball: Position;
    drawings: Drawing[];
  } | null>(null);

  // UI Status
  const [shareCopied, setShareCopied] = useState(false);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs for tracking latest positions during recording interval
  const playersRef = useRef(players);
  const ballRef = useRef(ball);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { ballRef.current = ball; }, [ball]);

  // Timers and animations
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playbackAnimRef = useRef<number | null>(null);

  // Default formation generator
  const resetToFormations = useCallback((fH: string, fA: string) => {
    const defaultPlayers: Player[] = [];
    
    // Home team
    const hCoords = homeFormations[fH];
    for (let i = 0; i < 11; i++) {
      const pt = pctToCanvas(hCoords[i].x, hCoords[i].y);
      defaultPlayers.push({
        id: `home_${i + 1}`,
        team: 'home',
        number: i + 1,
        isGK: i === 0,
        x: pt.x,
        y: pt.y
      });
    }

    // Away team
    const aCoords = awayFormations[fA];
    for (let i = 0; i < 11; i++) {
      const pt = pctToCanvas(aCoords[i].x, aCoords[i].y);
      defaultPlayers.push({
        id: `away_${i + 1}`,
        team: 'away',
        number: i + 1,
        isGK: i === 0,
        x: pt.x,
        y: pt.y
      });
    }

    setPlayers(defaultPlayers);
    setBall({ x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2 });
    setDrawings([]);
    setActiveDrawing(null);
    setInitialState({
      players: defaultPlayers,
      ball: { x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2 },
      drawings: []
    });
  }, []);

  // Handle URL states on mount
  useEffect(() => {
    const stateCode = searchParams.get('state');
    if (stateCode) {
      const decoded = deserializeState(stateCode);
      if (decoded) {
        setPlayers(decoded.players);
        setBall(decoded.ball);
        setDrawings(decoded.drawings);
        setInitialState(decoded);
        return;
      }
    }
    resetToFormations(formHome, formAway);
  }, [searchParams, resetToFormations]);

  // Handle formation selection change
  const handleHomeFormationChange = (val: string) => {
    setFormHome(val);
    resetToFormations(val, formAway);
  };

  const handleAwayFormationChange = (val: string) => {
    setFormAway(val);
    resetToFormations(formHome, val);
  };

  // Recording ticks
  useEffect(() => {
    if (isRecording) {
      const startTime = Date.now();
      // Record frame 0
      setRecordingFrames([
        {
          timestamp: 0,
          players: playersRef.current.map(p => ({ id: p.id, x: p.x, y: p.y })),
          ball: { ...ballRef.current }
        }
      ]);

      recordingIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setRecordingFrames(prev => [
          ...prev,
          {
            timestamp: elapsed,
            players: playersRef.current.map(p => ({ id: p.id, x: p.x, y: p.y })),
            ball: { ...ballRef.current }
          }
        ]);
      }, 40); // 25fps sampling
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  // Playback ticks
  useEffect(() => {
    if (isPlaying && recordingFrames.length > 0) {
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const lastFrame = recordingFrames[recordingFrames.length - 1];

        if (elapsed >= lastFrame.timestamp) {
          setIsPlaying(false);
          // Set to final positions
          setPlayers(prev =>
            prev.map(p => {
              const pf = lastFrame.players.find(x => x.id === p.id);
              return pf ? { ...p, x: pf.x, y: pf.y } : p;
            })
          );
          setBall({ ...lastFrame.ball });
        } else {
          // Find adjacent frames
          let f1 = recordingFrames[0];
          let f2 = recordingFrames[recordingFrames.length - 1];

          for (let i = 0; i < recordingFrames.length - 1; i++) {
            if (recordingFrames[i].timestamp <= elapsed && recordingFrames[i + 1].timestamp >= elapsed) {
              f1 = recordingFrames[i];
              f2 = recordingFrames[i + 1];
              break;
            }
          }

          const timeDiff = f2.timestamp - f1.timestamp;
          const ratio = timeDiff === 0 ? 0 : (elapsed - f1.timestamp) / timeDiff;

          // Interpolate player positions
          setPlayers(prev =>
            prev.map(p => {
              const p1 = f1.players.find(x => x.id === p.id);
              const p2 = f2.players.find(x => x.id === p.id);
              if (p1 && p2) {
                return {
                  ...p,
                  x: p1.x + (p2.x - p1.x) * ratio,
                  y: p1.y + (p2.y - p1.y) * ratio
                };
              }
              return p;
            })
          );

          // Interpolate ball position
          setBall({
            x: f1.ball.x + (f2.ball.x - f1.ball.x) * ratio,
            y: f1.ball.y + (f2.ball.y - f1.ball.y) * ratio
          });

          playbackAnimRef.current = requestAnimationFrame(animate);
        }
      };

      playbackAnimRef.current = requestAnimationFrame(animate);
    } else {
      if (playbackAnimRef.current) {
        cancelAnimationFrame(playbackAnimRef.current);
      }
    }

    return () => {
      if (playbackAnimRef.current) {
        cancelAnimationFrame(playbackAnimRef.current);
      }
    };
  }, [isPlaying, recordingFrames]);

  // Dragging state
  const [draggingItem, setDraggingItem] = useState<{
    type: 'player' | 'ball';
    id?: string;
  } | null>(null);

  // Canvas draw operations
  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw Field Background (Stripe pattern)
    ctx.fillStyle = '#1b3d1c'; // Margin area
    ctx.fillRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);

    // Alternate light/dark grass in playing area
    const stripesCount = 15;
    const stripeWidth = PLAY_WIDTH / stripesCount;
    for (let i = 0; i < stripesCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#234927' : '#2a522f';
      ctx.fillRect(MARGIN + i * stripeWidth, MARGIN, stripeWidth, PLAY_HEIGHT);
    }

    // 2. Draw Pitch White Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'miter';

    // Touchlines and Goallines (outer pitch box)
    ctx.strokeRect(MARGIN, MARGIN, PLAY_WIDTH, PLAY_HEIGHT);

    // Center line
    const centerX = PITCH_WIDTH / 2;
    const centerY = PITCH_HEIGHT / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, MARGIN);
    ctx.lineTo(centerX, PITCH_HEIGHT - MARGIN);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 90, 0, 2 * Math.PI);
    ctx.stroke();

    // Center spot
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Penalty Areas (16.5m depth, centered height)
    // Left
    ctx.strokeRect(MARGIN, centerY - 200, 165, 400);
    // Right
    ctx.strokeRect(PITCH_WIDTH - MARGIN - 165, centerY - 200, 165, 400);

    // Goal Areas (5.5m depth, centered height)
    // Left
    ctx.strokeRect(MARGIN, centerY - 90, 55, 180);
    // Right
    ctx.strokeRect(PITCH_WIDTH - MARGIN - 55, centerY - 90, 55, 180);

    // Penalty Spots
    // Left
    ctx.beginPath();
    ctx.arc(MARGIN + 120, centerY, 5, 0, 2 * Math.PI);
    ctx.fill();
    // Right
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH - MARGIN - 120, centerY, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Penalty Arcs
    // Intersections calculated mathematically: acos(depth / radius)
    const arcAngle = Math.acos(55 / 90);
    // Left Arc
    ctx.beginPath();
    ctx.arc(MARGIN + 120, centerY, 90, -arcAngle, arcAngle);
    ctx.stroke();
    // Right Arc
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH - MARGIN - 120, centerY, 90, Math.PI - arcAngle, Math.PI + arcAngle);
    ctx.stroke();

    // Corner Arcs
    // Top-Left
    ctx.beginPath();
    ctx.arc(MARGIN, MARGIN, 15, 0, 0.5 * Math.PI);
    ctx.stroke();
    // Bottom-Left
    ctx.beginPath();
    ctx.arc(MARGIN, PITCH_HEIGHT - MARGIN, 15, 1.5 * Math.PI, 2 * Math.PI);
    ctx.stroke();
    // Top-Right
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH - MARGIN, MARGIN, 15, 0.5 * Math.PI, Math.PI);
    ctx.stroke();
    // Bottom-Right
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH - MARGIN, PITCH_HEIGHT - MARGIN, 15, Math.PI, 1.5 * Math.PI);
    ctx.stroke();

    // Goals (drawn outside boundary)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3;

    // Left Goal
    ctx.strokeRect(MARGIN - 30, centerY - 38, 30, 76);
    // Left Goal Net
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let xOffset = MARGIN - 30; xOffset <= MARGIN; xOffset += 10) {
      ctx.moveTo(xOffset, centerY - 38);
      ctx.lineTo(xOffset, centerY + 38);
    }
    for (let yOffset = centerY - 38; yOffset <= centerY + 38; yOffset += 10) {
      ctx.moveTo(MARGIN - 30, yOffset);
      ctx.lineTo(MARGIN, yOffset);
    }
    ctx.stroke();

    // Right Goal
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.strokeRect(PITCH_WIDTH - MARGIN, centerY - 38, 30, 76);
    // Right Goal Net
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let xOffset = PITCH_WIDTH - MARGIN; xOffset <= PITCH_WIDTH - MARGIN + 30; xOffset += 10) {
      ctx.moveTo(xOffset, centerY - 38);
      ctx.lineTo(xOffset, centerY + 38);
    }
    for (let yOffset = centerY - 38; yOffset <= centerY + 38; yOffset += 10) {
      ctx.moveTo(PITCH_WIDTH - MARGIN, yOffset);
      ctx.lineTo(PITCH_WIDTH - MARGIN + 30, yOffset);
    }
    ctx.stroke();

    // 3. Draw Completed Drawings
    drawings.forEach(drawItem => {
      ctx.strokeStyle = drawItem.color;
      ctx.fillStyle = drawItem.color;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (drawItem.type === 'freehand') {
        ctx.beginPath();
        drawItem.points.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      } else if (drawItem.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(drawItem.start.x, drawItem.start.y);
        ctx.lineTo(drawItem.end.x, drawItem.end.y);
        ctx.stroke();
      } else if (drawItem.type === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(drawItem.start.x, drawItem.start.y);
        ctx.lineTo(drawItem.end.x, drawItem.end.y);
        ctx.stroke();

        // Arrow Head
        const start = drawItem.start;
        const end = drawItem.end;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 5) {
          const angle = Math.atan2(dy, dx);
          const arrowLength = 16;
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
      }
    });

    // 4. Draw Active (In Progress) Drawing
    if (activeDrawing) {
      ctx.strokeStyle = activeDrawing.color;
      ctx.fillStyle = activeDrawing.color;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (activeDrawing.type === 'freehand') {
        ctx.beginPath();
        activeDrawing.points.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      } else if (activeDrawing.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(activeDrawing.start.x, activeDrawing.start.y);
        ctx.lineTo(activeDrawing.end.x, activeDrawing.end.y);
        ctx.stroke();
      } else if (activeDrawing.type === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(activeDrawing.start.x, activeDrawing.start.y);
        ctx.lineTo(activeDrawing.end.x, activeDrawing.end.y);
        ctx.stroke();

        const start = activeDrawing.start;
        const end = activeDrawing.end;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 5) {
          const angle = Math.atan2(dy, dx);
          const arrowLength = 16;
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
      }
    }

    // 5. Draw Players
    players.forEach(pl => {
      // Glow effect if hovered/dragged
      const isSelected = draggingItem?.type === 'player' && draggingItem?.id === pl.id;
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(pl.x, pl.y, PLAYER_RADIUS + 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(pl.x, pl.y, PLAYER_RADIUS, 0, 2 * Math.PI);

      if (pl.isGK) {
        // Goalkeeper styling (yellow)
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.strokeStyle = '#1e2937';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Text
        ctx.fillStyle = '#1e2937';
      } else {
        // Normal players (home = blue, away = red)
        ctx.fillStyle = pl.team === 'home' ? '#2563eb' : '#dc2626';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Text
        ctx.fillStyle = '#ffffff';
      }

      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pl.number.toString(), pl.x, pl.y);
    });

    // 6. Draw Ball
    const isBallSelected = draggingItem?.type === 'ball';
    if (isBallSelected) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS + 4, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#1e2937';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Soccer pentagon pattern
    ctx.beginPath();
    ctx.fillStyle = '#1e2937';
    const rPent = 4;
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const px = ball.x + rPent * Math.cos(angle);
      const py = ball.y + rPent * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Soccer lines to edge
    ctx.beginPath();
    ctx.strokeStyle = '#1e2937';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const px1 = ball.x + rPent * Math.cos(angle);
      const py1 = ball.y + rPent * Math.sin(angle);
      const px2 = ball.x + BALL_RADIUS * Math.cos(angle);
      const py2 = ball.y + BALL_RADIUS * Math.sin(angle);
      ctx.moveTo(px1, py1);
      ctx.lineTo(px2, py2);
    }
    ctx.stroke();
  }, [players, ball, drawings, activeDrawing, draggingItem]);

  // Update canvas drawings
  useEffect(() => {
    drawBoard();
  }, [drawBoard]);

  // Interaction handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || isPlaying) return;

    canvas.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (toolMode === 'move') {
      // Check collision with ball (higher margin for easier touching)
      const distBall = Math.hypot(x - ball.x, y - ball.y);
      if (distBall <= BALL_RADIUS + 12) {
        setDraggingItem({ type: 'ball' });
        return;
      }

      // Check collision with players (from top of stack to bottom)
      for (let i = players.length - 1; i >= 0; i--) {
        const pl = players[i];
        const dist = Math.hypot(x - pl.x, y - pl.y);
        if (dist <= PLAYER_RADIUS + 10) {
          setDraggingItem({ type: 'player', id: pl.id });
          return;
        }
      }
    } else {
      // Drawing actions
      const pt = { x, y };
      if (toolMode === 'freehand') {
        setActiveDrawing({ type: 'freehand', color: drawingColor, points: [pt] });
      } else if (toolMode === 'line') {
        setActiveDrawing({ type: 'line', color: drawingColor, start: pt, end: pt });
      } else if (toolMode === 'arrow') {
        setActiveDrawing({ type: 'arrow', color: drawingColor, start: pt, end: pt });
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || isPlaying) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Constraint coordinates to canvas box
    const cx = Math.max(0, Math.min(canvas.width, x));
    const cy = Math.max(0, Math.min(canvas.height, y));

    if (toolMode === 'move' && draggingItem) {
      if (draggingItem.type === 'ball') {
        setBall({ x: cx, y: cy });
      } else if (draggingItem.type === 'player' && draggingItem.id) {
        setPlayers(prev =>
          prev.map(p => (p.id === draggingItem.id ? { ...p, x: cx, y: cy } : p))
        );
      }
    } else if (activeDrawing) {
      if (activeDrawing.type === 'freehand') {
        setActiveDrawing(prev => {
          if (!prev || prev.type !== 'freehand') return prev;
          return {
            ...prev,
            points: [...prev.points, { x: cx, y: cy }]
          };
        });
      } else if (activeDrawing.type === 'line' || activeDrawing.type === 'arrow') {
        setActiveDrawing(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            end: { x: cx, y: cy }
          };
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }

    if (toolMode === 'move') {
      setDraggingItem(null);
    } else if (activeDrawing) {
      setDrawings(prev => [...prev, activeDrawing]);
      setActiveDrawing(null);
    }
  };

  // Recording triggers
  const handleRecordToggle = () => {
    if (isPlaying) return;

    if (isRecording) {
      setIsRecording(false);
    } else {
      // Clear old and save initial state for playback resets
      setRecordingFrames([]);
      setInitialState({
        players: players.map(p => ({ ...p })),
        ball: { ...ball },
        drawings: drawings.map(d => ({ ...d }))
      });
      setIsRecording(true);
    }
  };

  const handlePlayToggle = () => {
    if (isRecording || recordingFrames.length === 0) return;

    if (isPlaying) {
      setIsPlaying(false);
    } else {
      // Restore initial positions first to play back from the recorded starting point
      if (initialState) {
        setPlayers(initialState.players.map(p => ({ ...p })));
        setBall({ ...initialState.ball });
      }
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    setIsRecording(false);
    setIsPlaying(false);
    
    if (initialState) {
      setPlayers(initialState.players.map(p => ({ ...p })));
      setBall({ ...initialState.ball });
      setDrawings(initialState.drawings.map(d => ({ ...d })));
    } else {
      resetToFormations(formHome, formAway);
    }
  };

  // Export PNG
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Direct download from canvas context
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `pizarra_tactica_${formHome}_vs_${formAway}.png`;
    link.href = dataUrl;
    link.click();
  };

  // State Link Sharing
  const handleShare = () => {
    try {
      const code = serializeState(players, ball, drawings);
      const url = `${window.location.origin}${window.location.pathname}?state=${encodeURIComponent(code)}`;
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy share link', e);
    }
  };

  return (
    <div className="tactical-container">
      {/* 1. TOP TOOLBAR */}
      <div className="toolbar glassmorphic">
        {/* Left Side: Formations */}
        <div className="toolbar-section">
          <div className="select-wrapper">
            <span className="select-label text-blue">Local (Azul)</span>
            <select
              value={formHome}
              onChange={e => handleHomeFormationChange(e.target.value)}
              className="custom-select"
              disabled={isRecording || isPlaying}
            >
              <option value="4-3-3">4-3-3</option>
              <option value="4-4-2">4-4-2</option>
              <option value="4-2-3-1">4-2-3-1</option>
              <option value="3-5-2">3-5-2</option>
            </select>
          </div>

          <div className="select-wrapper">
            <span className="select-label text-red">Visitante (Rojo)</span>
            <select
              value={formAway}
              onChange={e => handleAwayFormationChange(e.target.value)}
              className="custom-select"
              disabled={isRecording || isPlaying}
            >
              <option value="4-3-3">4-3-3</option>
              <option value="4-4-2">4-4-2</option>
              <option value="4-2-3-1">4-2-3-1</option>
              <option value="3-5-2">3-5-2</option>
            </select>
          </div>
        </div>

        {/* Center: Drawing tools */}
        <div className="toolbar-section divider">
          <div className="tool-group">
            <button
              onClick={() => setToolMode('move')}
              className={`tool-btn ${toolMode === 'move' ? 'active' : ''}`}
              title="Mover Fichas"
              disabled={isPlaying}
            >
              <MousePointer size={20} />
            </button>
            <button
              onClick={() => setToolMode('arrow')}
              className={`tool-btn ${toolMode === 'arrow' ? 'active' : ''}`}
              title="Flecha Direccional"
              disabled={isPlaying}
            >
              <ArrowUpRight size={20} />
            </button>
            <button
              onClick={() => setToolMode('freehand')}
              className={`tool-btn ${toolMode === 'freehand' ? 'active' : ''}`}
              title="Dibujo Libre"
              disabled={isPlaying}
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => setToolMode('line')}
              className={`tool-btn ${toolMode === 'line' ? 'active' : ''}`}
              title="Línea Recta"
              disabled={isPlaying}
            >
              <Slash size={18} />
            </button>
          </div>

          {/* Color Palette */}
          {toolMode !== 'move' && (
            <div className="color-palette">
              {['#ffffff', '#fbbf24', '#ef4444', '#3b82f6', '#10b981'].map(color => (
                <button
                  key={color}
                  onClick={() => setDrawingColor(color)}
                  className={`color-btn ${drawingColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={drawingColor}
                onChange={e => setDrawingColor(e.target.value)}
                className="color-picker"
                title="Color personalizado"
              />
            </div>
          )}

          <button
            onClick={() => setDrawings([])}
            className="tool-btn danger"
            title="Limpiar trazos"
            disabled={isPlaying}
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Right Side: Recording & Sharing */}
        <div className="toolbar-section divider">
          <div className="rec-group">
            <button
              onClick={handleRecordToggle}
              className={`rec-btn ${isRecording ? 'recording' : ''}`}
              title={isRecording ? 'Detener Grabación' : 'Grabar Jugada'}
              disabled={isPlaying}
            >
              <Video size={18} className={isRecording ? 'pulse' : ''} />
              <span>{isRecording ? 'Grabando' : 'Grabar'}</span>
            </button>

            <button
              onClick={handlePlayToggle}
              className={`play-btn ${isPlaying ? 'playing' : ''}`}
              title={isPlaying ? 'Pausar Reproducción' : 'Reproducir Grabación'}
              disabled={isRecording || recordingFrames.length === 0}
            >
              <Play size={18} />
              <span>{isPlaying ? 'Parar' : 'Reproducir'}</span>
            </button>

            <button
              onClick={handleReset}
              className="tool-btn text-muted"
              title="Reiniciar a estado inicial"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          <div className="action-group">
            <button onClick={handleExportPNG} className="action-btn" title="Guardar como PNG">
              <Download size={18} />
              <span>PNG</span>
            </button>

            <button
              onClick={handleShare}
              className={`action-btn ${shareCopied ? 'success' : ''}`}
              title="Copiar enlace de táctica"
            >
              {shareCopied ? <Check size={18} /> : <Share2 size={18} />}
              <span>{shareCopied ? '¡Copiado!' : 'Compartir'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. THE CANVAS BOARD */}
      <div className="canvas-wrapper glassmorphic">
        <canvas
          ref={canvasRef}
          width={PITCH_WIDTH}
          height={PITCH_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="pitch-canvas"
        />
      </div>

      {/* 3. HELP INFO */}
      <div className="footer-info text-muted">
        {toolMode === 'move' ? (
          <p>⚽ Modo Mover: Arrastra las fichas de los jugadores (números 1-11) y el balón para diseñar tácticas.</p>
        ) : (
          <p>🖌️ Modo Dibujo: Haz clic y arrastra sobre la pizarra para dibujar trazos o líneas tácticas.</p>
        )}
      </div>
    </div>
  );
}
