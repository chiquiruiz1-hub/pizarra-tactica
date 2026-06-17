'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Video,
  Plus,
  Compass,
  FileDown,
  Monitor,
  EyeOff,
  Type,
  Maximize,
  Grid,
  RefreshCw,
  Tablet
} from 'lucide-react';

const PITCH_WIDTH = 1200;
const PITCH_HEIGHT = 800;
const MARGIN = 50;
const PLAY_WIDTH = PITCH_WIDTH - 2 * MARGIN;
const PLAY_HEIGHT = PITCH_HEIGHT - 2 * MARGIN;
const centerY = PITCH_HEIGHT / 2;

const PLAYER_RADIUS = 22;
const BALL_RADIUS = 12;

export type Position = { x: number; y: number };

export type Player = {
  id: string;
  team: 'home' | 'away';
  number: number;
  name: string;
  isGK: boolean;
  x: number;
  y: number;
  docked: boolean;
  colorTag?: 'blue' | 'red' | 'yellow' | 'green' | 'orange' | 'purple' | 'white' | 'black';
};

export type EquipmentItem = {
  id: string;
  type: 'cone' | 'goal' | 'pole' | 'hoop';
  x: number;
  y: number;
};

export type Drawing =
  | { type: 'freehand'; color: string; thickness: number; points: Position[] }
  | { type: 'line'; color: string; thickness: number; start: Position; end: Position }
  | { type: 'arrow'; color: string; thickness: number; start: Position; end: Position }
  | { type: 'circle'; color: string; thickness: number; center: Position; radius: number }
  | { type: 'zone'; color: string; thickness: number; start: Position; end: Position }
  | { type: 'text'; color: string; text: string; position: Position };

type Frame = {
  timestamp: number;
  players: { id: string; x: number; y: number; colorTag?: string; docked: boolean; name: string }[];
  ball: Position;
  equipment?: EquipmentItem[];
};

// Formations (0 to 100 pitch percentages)
const homeFormations: Record<string, Position[]> = {
  '4-3-3': [
    { x: 5, y: 50 },
    { x: 22, y: 15 }, { x: 20, y: 38 }, { x: 20, y: 62 }, { x: 22, y: 85 },
    { x: 38, y: 30 }, { x: 32, y: 50 }, { x: 38, y: 70 },
    { x: 48, y: 15 }, { x: 48, y: 50 }, { x: 48, y: 85 }
  ],
  '4-4-2': [
    { x: 5, y: 50 },
    { x: 22, y: 15 }, { x: 20, y: 38 }, { x: 20, y: 62 }, { x: 22, y: 85 },
    { x: 38, y: 15 }, { x: 38, y: 38 }, { x: 38, y: 62 }, { x: 38, y: 85 },
    { x: 48, y: 33 }, { x: 48, y: 67 }
  ],
  '4-2-3-1': [
    { x: 5, y: 50 },
    { x: 22, y: 15 }, { x: 20, y: 38 }, { x: 20, y: 62 }, { x: 22, y: 85 },
    { x: 32, y: 35 }, { x: 32, y: 65 },
    { x: 42, y: 20 }, { x: 40, y: 50 }, { x: 42, y: 80 },
    { x: 48, y: 50 }
  ],
  '3-5-2': [
    { x: 5, y: 50 },
    { x: 20, y: 28 }, { x: 20, y: 50 }, { x: 20, y: 72 },
    { x: 36, y: 15 }, { x: 34, y: 35 }, { x: 32, y: 50 }, { x: 34, y: 65 }, { x: 36, y: 85 },
    { x: 48, y: 33 }, { x: 48, y: 67 }
  ],
  '5-3-2': [
    { x: 5, y: 50 },
    { x: 22, y: 15 }, { x: 20, y: 32 }, { x: 18, y: 50 }, { x: 20, y: 68 }, { x: 22, y: 85 },
    { x: 36, y: 28 }, { x: 34, y: 50 }, { x: 36, y: 72 },
    { x: 48, y: 33 }, { x: 48, y: 67 }
  ]
};

const awayFormations: Record<string, Position[]> = {
  '4-3-3': [
    { x: 95, y: 50 },
    { x: 78, y: 85 }, { x: 80, y: 62 }, { x: 80, y: 38 }, { x: 78, y: 15 },
    { x: 62, y: 70 }, { x: 68, y: 50 }, { x: 62, y: 30 },
    { x: 52, y: 85 }, { x: 52, y: 50 }, { x: 52, y: 15 }
  ],
  '4-4-2': [
    { x: 95, y: 50 },
    { x: 78, y: 85 }, { x: 80, y: 62 }, { x: 80, y: 38 }, { x: 78, y: 15 },
    { x: 62, y: 85 }, { x: 62, y: 62 }, { x: 62, y: 38 }, { x: 62, y: 15 },
    { x: 52, y: 67 }, { x: 52, y: 33 }
  ],
  '4-2-3-1': [
    { x: 95, y: 50 },
    { x: 78, y: 85 }, { x: 80, y: 62 }, { x: 80, y: 38 }, { x: 78, y: 15 },
    { x: 68, y: 65 }, { x: 68, y: 35 },
    { x: 58, y: 80 }, { x: 60, y: 50 }, { x: 58, y: 20 },
    { x: 52, y: 50 }
  ],
  '3-5-2': [
    { x: 95, y: 50 },
    { x: 80, y: 72 }, { x: 80, y: 50 }, { x: 80, y: 28 },
    { x: 64, y: 85 }, { x: 66, y: 65 }, { x: 68, y: 50 }, { x: 66, y: 35 }, { x: 64, y: 15 },
    { x: 52, y: 67 }, { x: 52, y: 33 }
  ],
  '5-3-2': [
    { x: 95, y: 50 },
    { x: 78, y: 85 }, { x: 80, y: 68 }, { x: 82, y: 50 }, { x: 80, y: 32 }, { x: 78, y: 15 },
    { x: 64, y: 72 }, { x: 66, y: 50 }, { x: 64, y: 28 },
    { x: 52, y: 67 }, { x: 52, y: 33 }
  ]
};

const defaultPlayerNames: Record<string, string> = {
  home_1: 'Portero (L)', home_2: 'Def. Izquierdo', home_3: 'Central Izq.', home_4: 'Central Der.', home_5: 'Def. Derecho',
  home_6: 'Medio Centro', home_7: 'Interior Izq.', home_8: 'Interior Der.', home_9: 'Extremo Izq.', home_10: 'Delantero Centro', home_11: 'Extremo Der.',
  away_1: 'Portero (V)', away_2: 'Def. Izquierdo', away_3: 'Central Izq.', away_4: 'Central Der.', away_5: 'Def. Derecho',
  away_6: 'Medio Centro', away_7: 'Interior Izq.', away_8: 'Interior Der.', away_9: 'Extremo Izq.', away_10: 'Delantero Centro', away_11: 'Extremo Der.'
};

const pctToCanvas = (xPct: number, yPct: number) => {
  return {
    x: MARGIN + (xPct / 100) * PLAY_WIDTH,
    y: MARGIN + (yPct / 100) * PLAY_HEIGHT
  };
};

const hexToRgba = (hex: string, alpha: number) => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatProgressTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

interface TacticalCanvasProps {
  mode: 'tactica' | 'parado' | 'entrenamiento' | 'videos';
  onSave?: (name: string, data: { players: Player[]; ball: Position; drawings: Drawing[]; pitchType: 'full' | 'half'; equipment: EquipmentItem[]; thumbnail: string; backgroundImage?: string; trackingKeyframes?: { playerId: string; timestamp: number; x: number; y: number }[]; jsonTrackingData?: any }) => void;
  initialPlayData?: {
    players: Player[];
    ball: Position;
    drawings: Drawing[];
    pitchType: 'full' | 'half';
    equipment: EquipmentItem[];
    backgroundImage?: string;
    trackingKeyframes?: { playerId: string; timestamp: number; x: number; y: number }[];
    jsonTrackingData?: any;
  } | null;
  backgroundImage?: string;
  onClearBackground?: () => void;
  trackingKeyframes?: { playerId: string; timestamp: number; x: number; y: number }[];
  jsonTrackingData?: {
    fps: number;
    duration: number;
    frames: { t: number; players: { x: number; y: number }[] }[];
  } | null;
  onClearJsonTracking?: () => void;
  videoCurrentTime?: number;
  videoIsPlaying?: boolean;
  onPlayStateChange?: (playing: boolean) => void;
  hasVideo?: boolean;
  onSeekVideo?: (time: number) => void;
  onOpenVestuario?: () => void;
}

export default function TacticalCanvas({
  mode,
  onSave,
  initialPlayData,
  backgroundImage,
  onClearBackground,
  trackingKeyframes,
  jsonTrackingData,
  onClearJsonTracking,
  videoCurrentTime,
  videoIsPlaying,
  onPlayStateChange,
  hasVideo,
  onSeekVideo,
  onOpenVestuario
}: TacticalCanvasProps) {
  // State declaration
  const [pitchType, setPitchType] = useState<'full' | 'half'>('full');
  const [formHome, setFormHome] = useState<string>('4-3-3');
  const [formAway, setFormAway] = useState<string>('4-4-2');
  const [toolMode, setToolMode] = useState<'move' | 'arrow' | 'freehand' | 'line' | 'circle' | 'zone' | 'text'>('move');
  const [drawingColor, setDrawingColor] = useState<string>('#ffffff');
  const [drawingThickness, setDrawingThickness] = useState<number>(4);

  // Player, ball and equipment positions
  const [players, setPlayers] = useState<Player[]>([]);
  const [ball, setBall] = useState<Position>({ x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2 });
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [draggingItem, setDraggingItem] = useState<{ type: 'ball' | 'player' | 'equipment'; id?: string } | null>(null);

  // Editable Player Name States
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Drawings
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [activeDrawing, setActiveDrawing] = useState<Drawing | null>(null);

  // Recording and Playback
  const [isRecording, setIsRecording] = useState(false);
  const [recordingFrames, setRecordingFrames] = useState<Frame[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [canvasWidth, setCanvasWidth] = useState(PITCH_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(PITCH_HEIGHT);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [initialState, setInitialState] = useState<{
    players: Player[];
    ball: Position;
    drawings: Drawing[];
    equipment: EquipmentItem[];
  } | null>(null);

  // Timer HUD States
  const [timerSeries, setTimerSeries] = useState(3);
  const [timerDuration, setTimerDuration] = useState(300); // 5 minutes
  const [currentSerie, setCurrentSerie] = useState(1);
  const [timeLeft, setTimeLeft] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const [exerciseDesc, setExerciseDesc] = useState('');
  const [availablePlayersCount, setAvailablePlayersCount] = useState(11);

  // Presentation Mode States
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // UI Status
  const [shareCopied, setShareCopied] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Local saved plays for keyboard paging
  const [savedPlaysList, setSavedPlaysList] = useState<any[]>([]);
  const [currentPlayIndex, setCurrentPlayIndex] = useState(-1);
  const activePlay = currentPlayIndex >= 0 ? savedPlaysList[currentPlayIndex] : null;

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs for tracking latest positions during recording interval
  const playersRef = useRef(players);
  const ballRef = useRef(ball);
  const equipmentRef = useRef(equipment);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { ballRef.current = ball; }, [ball]);
  useEffect(() => { equipmentRef.current = equipment; }, [equipment]);

  // Timers and animations
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playbackAnimRef = useRef<number | null>(null);
  const prevJsonTrackingRef = useRef<any>(null);
  const playbackTimeRef = useRef(0);
  const canvasTimerTimeRef = useRef<number | null>(null);
  useEffect(() => {
    playbackTimeRef.current = currentPlaybackTime;
  }, [currentPlaybackTime]);

  // Background Image State
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const bgSrc = backgroundImage || (initialPlayData && (initialPlayData as any).backgroundImage);
    if (bgSrc) {
      const img = new Image();
      img.src = bgSrc;
      img.onload = () => setBgImage(img);
    } else {
      setBgImage(null);
    }
  }, [backgroundImage, initialPlayData]);

  // Fetch local library items for paging
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pizarrapro_plays');
      if (saved) {
        setSavedPlaysList(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  // Keyboard navigation for presentation mode & Ctrl+Z Undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ctrl+Z Undo drawing
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        setDrawings(prev => prev.slice(0, -1));
        return;
      }

      // 2. Fullscreen arrow keys pagination
      if (isPresentationMode && savedPlaysList.length > 0) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setCurrentPlayIndex(prev => {
            const nextIdx = prev >= savedPlaysList.length - 1 ? 0 : prev + 1;
            loadSpecificPlay(savedPlaysList[nextIdx]);
            return nextIdx;
          });
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setCurrentPlayIndex(prev => {
            const nextIdx = prev <= 0 ? savedPlaysList.length - 1 : prev - 1;
            loadSpecificPlay(savedPlaysList[nextIdx]);
            return nextIdx;
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresentationMode, savedPlaysList]);

  // Load a play from the paging list
  const loadSpecificPlay = (play: any) => {
    setPlayers(play.players);
    setBall(play.ball);
    setDrawings(play.drawings);
    setPitchType(play.pitchType);
    setEquipment(play.equipment || []);
    setZoomScale(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // Timer useEffect logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (currentSerie < timerSeries) {
              setCurrentSerie(c => c + 1);
              return timerDuration;
            } else {
              setTimerRunning(false);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [timerRunning, timeLeft, currentSerie, timerSeries, timerDuration]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Default formation generator
  const resetToFormations = useCallback((fH: string, fA: string, currentPitch: 'full' | 'half') => {
    const defaultPlayers: Player[] = [];
    
    // 1. Home squad (docked = true by default)
    const hCoords = homeFormations[fH];
    for (let i = 0; i < 11; i++) {
      const pt = pctToCanvas(hCoords[i].x, hCoords[i].y);
      defaultPlayers.push({
        id: `home_${i + 1}`,
        team: 'home',
        number: i + 1,
        name: defaultPlayerNames[`home_${i + 1}`],
        isGK: i === 0,
        x: pt.x,
        y: pt.y,
        docked: true
      });
    }

    // 2. Away squad (docked = true by default)
    const aCoords = awayFormations[fA];
    for (let i = 0; i < 11; i++) {
      const pt = pctToCanvas(aCoords[i].x, aCoords[i].y);
      defaultPlayers.push({
        id: `away_${i + 1}`,
        team: 'away',
        number: i + 1,
        name: defaultPlayerNames[`away_${i + 1}`],
        isGK: i === 0,
        x: pt.x,
        y: pt.y,
        docked: true
      });
    }

    // 3. Special Referee token (docked = true by default)
    defaultPlayers.push({
      id: 'referee',
      team: 'home',
      number: 0,
      name: 'Árbitro',
      isGK: false,
      x: PITCH_WIDTH / 2,
      y: centerY,
      docked: true
    });

    setPlayers(defaultPlayers);
    setEquipment([]);
    setDrawings([]);
    setActiveDrawing(null);
    setSelectedPlayerId(null);
    setBall({ x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2 });
    setInitialState({
      players: defaultPlayers,
      ball: currentPitch === 'full' ? { x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2 } : { x: 600, y: centerY },
      drawings: [],
      equipment: []
    });
  }, []);

  // Handle Initial Play Data / URL sharing / reset
  useEffect(() => {
    if (initialPlayData) {
      setPlayers(initialPlayData.players);
      setBall(initialPlayData.ball);
      setDrawings(initialPlayData.drawings);
      setPitchType(initialPlayData.pitchType);
      setEquipment(initialPlayData.equipment || []);
      setInitialState({
        players: initialPlayData.players.map(p => ({ ...p })),
        ball: { ...initialPlayData.ball },
        drawings: initialPlayData.drawings.map(d => ({ ...d })),
        equipment: (initialPlayData.equipment || []).map(e => ({ ...e }))
      });
    } else {
      resetToFormations(formHome, formAway, pitchType);
    }
  }, [initialPlayData, resetToFormations]);

  // Spawns tokens for JSON tracking data or resets them when cleared
  useEffect(() => {
    if (jsonTrackingData && jsonTrackingData.frames && jsonTrackingData.frames.length > 0) {
      const firstFrame = jsonTrackingData.frames[0];
      const numPlayers = firstFrame.players.length;

      // Map indices to original player details and sort by position X (percentage)
      const mappedPlayers = firstFrame.players.map((p, idx) => ({
        idx,
        xPct: p.x,
        yPct: p.y
      }));

      // Sort by X position
      const sortedByX = [...mappedPlayers].sort((a, b) => a.xPct - b.xPct);

      let homeCount = 0;
      let awayCount = 0;
      const assignment = new Array(numPlayers);

      sortedByX.forEach(p => {
        if (p.xPct < 50) {
          homeCount++;
          assignment[p.idx] = {
            team: 'home' as const,
            colorTag: 'blue' as const,
            number: homeCount,
            name: `Local ${homeCount}`
          };
        } else {
          awayCount++;
          assignment[p.idx] = {
            team: 'away' as const,
            colorTag: 'red' as const,
            number: awayCount,
            name: `Visitante ${awayCount}`
          };
        }
      });

      const trackingPlayers: Player[] = [];
      for (let idx = 0; idx < numPlayers; idx++) {
        const firstFramePlayer = firstFrame.players[idx];
        const assign = assignment[idx];
        trackingPlayers.push({
          id: `track_${idx + 1}`,
          team: assign.team,
          number: assign.number,
          name: assign.name,
          isGK: false,
          x: firstFramePlayer ? (firstFramePlayer.x / 100) * PITCH_WIDTH : PITCH_WIDTH / 2,
          y: firstFramePlayer ? (firstFramePlayer.y / 100) * PITCH_HEIGHT : PITCH_HEIGHT / 2,
          docked: false,
          colorTag: assign.colorTag
        });
      }

      setPlayers(trackingPlayers);
      setBall({ x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2 });
      setEquipment([]);
      setDrawings([]);
      setCurrentPlaybackTime(0);
      setPlaybackSpeed(1);
    } else if (prevJsonTrackingRef.current) {
      resetToFormations(formHome, formAway, pitchType);
      setCurrentPlaybackTime(0);
      setPlaybackSpeed(1);
    }
    prevJsonTrackingRef.current = jsonTrackingData;
  }, [jsonTrackingData, resetToFormations, formHome, formAway, pitchType]);

  const handleHomeFormationChange = (val: string) => {
    setFormHome(val);
    resetToFormations(val, formAway, pitchType);
  };

  const handleAwayFormationChange = (val: string) => {
    setFormAway(val);
    resetToFormations(formHome, val, pitchType);
  };

  const handlePitchTypeToggle = (type: 'full' | 'half') => {
    setPitchType(type);
    resetToFormations(formHome, formAway, type);
  };

  // Preset Sessions mutator
  const applySessionPreset = (preset: string) => {
    setDrawings([]);
    setEquipment([]);
    setSelectedPlayerId(null);

    let newPlayers = players.map(p => ({ ...p, docked: true }));
    let newBall = { x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2 };
    let newEquipment: EquipmentItem[] = [];

    const deploy = (id: string, x: number, y: number) => {
      newPlayers = newPlayers.map(p => p.id === id ? { ...p, x, y, docked: false } : p);
    };

    if (preset === 'rondo_4v1') {
      deploy('home_1', 500, 300);
      deploy('home_2', 500, 500);
      deploy('home_3', 700, 300);
      deploy('home_4', 700, 500);
      deploy('away_2', 600, 400);

      newEquipment = [
        { id: 'c1', type: 'cone', x: 450, y: 250 },
        { id: 'c2', type: 'cone', x: 450, y: 550 },
        { id: 'c3', type: 'cone', x: 750, y: 250 },
        { id: 'c4', type: 'cone', x: 750, y: 550 }
      ];
      newBall = { x: 500, y: 300 };
      setExerciseDesc('Rondo de posesión 4 contra 1. El objetivo es mantener el balón en espacios reducidos superando al defensor central.');
    } else if (preset === 'rondo_6v2') {
      deploy('home_1', 450, 400);
      deploy('home_2', 520, 280);
      deploy('home_3', 680, 280);
      deploy('home_4', 750, 400);
      deploy('home_5', 680, 520);
      deploy('home_6', 520, 520);

      deploy('away_2', 560, 400);
      deploy('away_3', 640, 400);

      newEquipment = [
        { id: 'c1', type: 'cone', x: 400, y: 400 },
        { id: 'c2', type: 'cone', x: 490, y: 220 },
        { id: 'c3', type: 'cone', x: 710, y: 220 },
        { id: 'c4', type: 'cone', x: 800, y: 400 },
        { id: 'c5', type: 'cone', x: 710, y: 580 },
        { id: 'c6', type: 'cone', x: 490, y: 580 }
      ];
      newBall = { x: 450, y: 400 };
      setExerciseDesc('Rondo 6 contra 2. Trabajo de conservación, pases rápidos a un toque y presión intensa de los dos defensores del centro.');
    } else if (preset === 'pressing_alto') {
      deploy('home_1', 100, 400); // GK
      deploy('home_9', 900, 230); // wingers press
      deploy('home_11', 900, 570);
      deploy('home_10', 930, 400); // striker press
      deploy('home_8', 800, 300);
      deploy('home_7', 800, 500);
      deploy('home_6', 730, 400);
      deploy('home_2', 580, 150);
      deploy('home_3', 580, 320);
      deploy('home_4', 580, 480);
      deploy('home_5', 580, 650);

      deploy('away_1', 1130, 400); // GK opponent
      deploy('away_2', 1040, 240); // RCB
      deploy('away_3', 1040, 560); // LCB
      deploy('away_4', 1080, 110); // RB
      deploy('away_5', 1080, 690); // LB
      deploy('away_6', 950, 400); // DM

      newBall = { x: 1040, y: 240 };
      setExerciseDesc('Simulación de presión alta en salida de balón rival. Bloque ofensivo alto para asfixiar la salida del oponente.');
    } else if (preset === 'transicion_rapida') {
      deploy('home_1', 100, 400);
      deploy('home_6', 550, 300); // gets ball
      deploy('home_9', 750, 140); // wingers sprint
      deploy('home_11', 750, 660);
      deploy('home_10', 820, 400); // CF central run
      deploy('home_8', 600, 440);

      deploy('away_1', 1130, 400);
      deploy('away_2', 860, 330);
      deploy('away_3', 860, 470);

      newBall = { x: 550, y: 300 };
      setExerciseDesc('Transición ofensiva rápida (contraataque). Apertura a bandas para desdoblamiento veloz buscando portería contraria.');
    } else if (preset === 'juego_posicion') {
      // Draw grid cones
      newEquipment = [
        { id: 'c1', type: 'cone', x: 300, y: 220 }, { id: 'c2', type: 'cone', x: 600, y: 220 }, { id: 'c3', type: 'cone', x: 900, y: 220 },
        { id: 'c4', type: 'cone', x: 300, y: 580 }, { id: 'c5', type: 'cone', x: 600, y: 580 }, { id: 'c6', type: 'cone', x: 900, y: 580 }
      ];
      // Deploy squad
      newPlayers = newPlayers.map((p, idx) => {
        if (idx < 11) {
          const hC = homeFormations['4-3-3'][idx];
          const pt = pctToCanvas(hC.x, hC.y);
          return { ...p, x: pt.x, y: pt.y, docked: false };
        }
        return p;
      });
      newBall = { x: 600, y: 400 };
      setExerciseDesc('Juego de posición. Creación de líneas de pase en canales interiores y exteriores, respetando la estructura zonal del campo.');
    } else if (preset === 'amplitud') {
      newEquipment = [
        { id: 'c1', type: 'cone', x: 300, y: MARGIN }, { id: 'c2', type: 'cone', x: 600, y: MARGIN }, { id: 'c3', type: 'cone', x: 900, y: MARGIN },
        { id: 'c4', type: 'cone', x: 300, y: PITCH_HEIGHT - MARGIN }, { id: 'c5', type: 'cone', x: 600, y: PITCH_HEIGHT - MARGIN }, { id: 'c6', type: 'cone', x: 900, y: PITCH_HEIGHT - MARGIN }
      ];
      deploy('home_9', 600, 75); // wingers wide
      deploy('home_11', 600, 725);
      deploy('home_10', 850, 400);
      deploy('home_6', 500, 400);

      newBall = { x: 600, y: 75 };
      setExerciseDesc('Juego de amplitud táctica. Obligación de pasar por carriles laterales (delimitados por conos) para estirar defensas cerradas.');
    }

    setPlayers(newPlayers);
    setEquipment(newEquipment);
    setBall(newBall);
    setInitialState({
      players: newPlayers.map(p => ({ ...p })),
      ball: newBall,
      drawings: [],
      equipment: newEquipment
    });
  };

  // Add equipment items (Training mode only)
  const addEquipmentItem = (type: 'cone' | 'goal' | 'pole' | 'hoop') => {
    if (isPlaying) return;
    const newItem: EquipmentItem = {
      id: `${type}_${Date.now()}`,
      type,
      x: PITCH_WIDTH / 2 + (Math.random() - 0.5) * 100,
      y: PITCH_HEIGHT / 2 + (Math.random() - 0.5) * 100
    };
    setEquipment(prev => [...prev, newItem]);
  };

  // Tag color tag label
  const setPlayerColorTag = (tag: any) => {
    if (!selectedPlayerId) return;
    setPlayers(prev =>
      prev.map(p => (p.id === selectedPlayerId ? { ...p, colorTag: tag } : p))
    );
  };

  // HTML5 Drag Start in Docks
  const handleDockDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  // Drop on Canvas
  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCanvasDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const playerId = e.dataTransfer.getData('text/plain');
    if (!playerId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const cx = Math.max(0, Math.min(canvas.width, x));
    const cy = Math.max(0, Math.min(canvas.height, y));

    setPlayers(prev =>
      prev.map(p => (p.id === playerId ? { ...p, x: cx, y: cy, docked: false } : p))
    );
  };

  // Double click name edit in docks
  const startEditPlayerName = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPlayerId(id);
    setEditingName(name);
  };

  const savePlayerName = () => {
    if (editingPlayerId && editingName.trim()) {
      setPlayers(prev =>
        prev.map(p => (p.id === editingPlayerId ? { ...p, name: editingName.trim() } : p))
      );
    }
    setEditingPlayerId(null);
  };

  // Recording ticks
  useEffect(() => {
    if (isRecording) {
      const startTime = Date.now();
      setRecordingFrames([
        {
          timestamp: 0,
          players: playersRef.current.map(p => ({ id: p.id, x: p.x, y: p.y, colorTag: p.colorTag, name: p.name, docked: p.docked })),
          ball: { ...ballRef.current },
          equipment: equipmentRef.current.map(e => ({ ...e }))
        }
      ]);

      recordingIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setRecordingFrames(prev => [
          ...prev,
          {
            timestamp: elapsed,
            players: playersRef.current.map(p => ({ id: p.id, x: p.x, y: p.y, colorTag: p.colorTag, name: p.name, docked: p.docked })),
            ball: { ...ballRef.current },
            equipment: equipmentRef.current.map(e => ({ ...e }))
          }
        ]);
      }, 40);
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
          setPlayers(prev =>
            prev.map(p => {
              const pf = lastFrame.players.find(x => x.id === p.id);
              if (pf) {
                const tagColor = pf.colorTag as any;
                return { ...p, x: pf.x, y: pf.y, colorTag: tagColor, docked: pf.docked, name: pf.name };
              }
              return p;
            })
          );
          setBall({ ...lastFrame.ball });
          if (lastFrame.equipment) {
            setEquipment(lastFrame.equipment.map(e => ({ ...e })));
          }
        } else {
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

          setPlayers(prev =>
            prev.map(p => {
              const p1 = f1.players.find(x => x.id === p.id);
              const p2 = f2.players.find(x => x.id === p.id);
              if (p1 && p2) {
                const tagColor = p2.colorTag as any;
                return {
                  ...p,
                  x: p1.x + (p2.x - p1.x) * ratio,
                  y: p1.y + (p2.y - p1.y) * ratio,
                  colorTag: tagColor,
                  docked: p2.docked,
                  name: p2.name
                };
              }
              return p;
            })
          );

          setBall({
            x: f1.ball.x + (f2.ball.x - f1.ball.x) * ratio,
            y: f1.ball.y + (f2.ball.y - f1.ball.y) * ratio
          });

          if (f1.equipment && f2.equipment) {
            setEquipment(prev =>
              prev.map(e => {
                const e1 = f1.equipment?.find(x => x.id === e.id);
                const e2 = f2.equipment?.find(x => x.id === e.id);
                if (e1 && e2) {
                  return {
                    ...e,
                    x: e1.x + (e2.x - e1.x) * ratio,
                    y: e1.y + (e2.y - e1.y) * ratio
                  };
                }
                return e;
              })
            );
          }

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

  // Tracking Playback ticks (LERP)
  useEffect(() => {
    const hasTracking = trackingKeyframes && trackingKeyframes.length > 0;
    if (isPlaying && hasTracking && recordingFrames.length === 0) {
      // Offset start so animation begins at the first keyframe timestamp, not at t=0
      const minTime = Math.min(...(trackingKeyframes || []).map(k => k.timestamp));
      const maxTime = Math.max(...(trackingKeyframes || []).map(k => k.timestamp));
      const startWallTime = performance.now();

      const animateTracking = () => {
        // Elapsed real-world seconds, scaled by playback speed
        const elapsedSeconds = ((performance.now() - startWallTime) / 1000) * playbackSpeed + minTime;

        if (elapsedSeconds >= maxTime) {
          setIsPlaying(false);
          if (onPlayStateChange) onPlayStateChange(false);
          // Snap to final positions
          setPlayers(prev => prev.map(p => {
            const pKfs = (trackingKeyframes || []).filter(k => k.playerId === p.id);
            if (pKfs.length > 0) {
              const lastKf = pKfs.reduce((prevKf, currentKf) => currentKf.timestamp > prevKf.timestamp ? currentKf : prevKf);
              return {
                ...p,
                x: (lastKf.x / 100) * PITCH_WIDTH,
                y: (lastKf.y / 100) * PITCH_HEIGHT,
                docked: false
              };
            }
            return p;
          }));
        } else {
          // LERP calculations for each player
          setPlayers(prev => prev.map(p => {
            const pKfs = (trackingKeyframes || []).filter(k => k.playerId === p.id).sort((a, b) => a.timestamp - b.timestamp);
            if (pKfs.length === 0) return p;

            if (elapsedSeconds <= pKfs[0].timestamp) {
              return {
                ...p,
                x: (pKfs[0].x / 100) * PITCH_WIDTH,
                y: (pKfs[0].y / 100) * PITCH_HEIGHT,
                docked: false
              };
            }

            if (elapsedSeconds >= pKfs[pKfs.length - 1].timestamp) {
              return {
                ...p,
                x: (pKfs[pKfs.length - 1].x / 100) * PITCH_WIDTH,
                y: (pKfs[pKfs.length - 1].y / 100) * PITCH_HEIGHT,
                docked: false
              };
            }

            // Find surrounding keyframes
            let kA = pKfs[0];
            let kB = pKfs[pKfs.length - 1];
            for (let i = 0; i < pKfs.length - 1; i++) {
              if (pKfs[i].timestamp <= elapsedSeconds && pKfs[i + 1].timestamp >= elapsedSeconds) {
                kA = pKfs[i];
                kB = pKfs[i + 1];
                break;
              }
            }

            // LERP: Pos = A + (B - A) * t
            const timeDiff = kB.timestamp - kA.timestamp;
            const ratio = timeDiff === 0 ? 0 : (elapsedSeconds - kA.timestamp) / timeDiff;
            return {
              ...p,
              x: ((kA.x + (kB.x - kA.x) * ratio) / 100) * PITCH_WIDTH,
              y: ((kA.y + (kB.y - kA.y) * ratio) / 100) * PITCH_HEIGHT,
              docked: false
            };
          }));

          // Seek video in sync
          if (onSeekVideo) onSeekVideo(elapsedSeconds);

          playbackAnimRef.current = requestAnimationFrame(animateTracking);
        }
      };

      playbackAnimRef.current = requestAnimationFrame(animateTracking);
    }

    return () => {
      if (playbackAnimRef.current) {
        cancelAnimationFrame(playbackAnimRef.current);
      }
    };
  }, [isPlaying, trackingKeyframes, recordingFrames, playbackSpeed]);

  // Callback to calculate interpolated player positions from JSON tracking data
  const updatePlayersPositionsAtTime = useCallback((t: number) => {
    if (!jsonTrackingData || !jsonTrackingData.frames || jsonTrackingData.frames.length === 0) return;

    const frames = jsonTrackingData.frames;
    let fA = frames[0];
    let fB = frames[frames.length - 1];
    let isBoundary = false;
    let boundaryPlayerFrame = null;

    if (t <= frames[0].t) {
      isBoundary = true;
      boundaryPlayerFrame = frames[0];
    } else if (t >= frames[frames.length - 1].t) {
      isBoundary = true;
      boundaryPlayerFrame = frames[frames.length - 1];
    } else {
      for (let i = 0; i < frames.length - 1; i++) {
        if (frames[i].t <= t && frames[i + 1].t >= t) {
          fA = frames[i];
          fB = frames[i + 1];
          break;
        }
      }
    }

    setPlayers(prev => prev.map((p) => {
      if (!p.id.startsWith('track_')) return p;

      const originalIdx = parseInt(p.id.replace('track_', ''), 10) - 1;

      if (isBoundary) {
        const plFrame = boundaryPlayerFrame?.players[originalIdx];
        if (!plFrame) return p;
        return { ...p, x: (plFrame.x / 100) * PITCH_WIDTH, y: (plFrame.y / 100) * PITCH_HEIGHT, docked: false };
      }

      const pA = fA.players[originalIdx];
      const pB = fB.players[originalIdx];
      if (!pA || !pB) return p;

      const timeDiff = fB.t - fA.t;
      const ratio = timeDiff === 0 ? 0 : (t - fA.t) / timeDiff;

      return {
        ...p,
        x: ((pA.x + (pB.x - pA.x) * ratio) / 100) * PITCH_WIDTH,
        y: ((pA.y + (pB.y - pA.y) * ratio) / 100) * PITCH_HEIGHT,
        docked: false
      };
    }));
  }, [jsonTrackingData]);

  // JSON Tracking Playback ticks (if no video)
  useEffect(() => {
    const hasJsonTracking = jsonTrackingData && jsonTrackingData.frames && jsonTrackingData.frames.length > 0;
    if (isPlaying && hasJsonTracking && !hasVideo && recordingFrames.length === 0) {
      const startPerf = performance.now();
      const startPlayback = playbackTimeRef.current >= jsonTrackingData.duration ? 0 : playbackTimeRef.current;
      const duration = jsonTrackingData.duration;

      const animateJson = () => {
        const elapsedReal = (performance.now() - startPerf) / 1000;
        let t = startPlayback + elapsedReal * playbackSpeed;

        if (t >= duration) {
          t = duration;
          setCurrentPlaybackTime(duration);
          setIsPlaying(false);
          updatePlayersPositionsAtTime(duration);
        } else {
          setCurrentPlaybackTime(t);
          updatePlayersPositionsAtTime(t);
          playbackAnimRef.current = requestAnimationFrame(animateJson);
        }
      };

      playbackAnimRef.current = requestAnimationFrame(animateJson);
    }

    return () => {
      if (playbackAnimRef.current) {
        cancelAnimationFrame(playbackAnimRef.current);
      }
    };
  }, [isPlaying, jsonTrackingData, hasVideo, recordingFrames, playbackSpeed, updatePlayersPositionsAtTime]);

  // Sync players positions from JSON tracking with the video currentTime
  useEffect(() => {
    if (hasVideo && videoCurrentTime !== undefined) {
      setCurrentPlaybackTime(videoCurrentTime);
      updatePlayersPositionsAtTime(videoCurrentTime);
    }
  }, [hasVideo, videoCurrentTime, updatePlayersPositionsAtTime]);

  // Bidirectional sync for playing/paused state
  useEffect(() => {
    if (videoIsPlaying !== undefined) {
      setIsPlaying(videoIsPlaying);
    }
  }, [videoIsPlaying]);

  // Field Drawing Utility
  const drawPitch = (ctx: CanvasRenderingContext2D) => {
    if (bgImage) {
      ctx.globalAlpha = 0.4;
      ctx.drawImage(bgImage, 0, 0, PITCH_WIDTH, PITCH_HEIGHT);
      ctx.globalAlpha = 1.0;
    } else {
      ctx.fillStyle = '#111622'; // Outside margins
      ctx.fillRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);

      if (pitchType === 'full') {
        const stripesCount = 15;
        const stripeWidth = PLAY_WIDTH / stripesCount;
        for (let i = 0; i < stripesCount; i++) {
          ctx.fillStyle = i % 2 === 0 ? '#1b2d1c' : '#233924';
          ctx.fillRect(MARGIN + i * stripeWidth, MARGIN, stripeWidth, PLAY_HEIGHT);
        }
      } else {
        const stripesCount = 8;
        const stripeWidth = PLAY_WIDTH / stripesCount;
        for (let i = 0; i < stripesCount; i++) {
          ctx.fillStyle = i % 2 === 0 ? '#1b2d1c' : '#233924';
          ctx.fillRect(MARGIN + i * stripeWidth, MARGIN, stripeWidth, PLAY_HEIGHT);
        }
      }
    }

    if (pitchType === 'full') {
      ctx.strokeStyle = '#ffffff';
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
      ctx.fillStyle = '#ffffff';
      ctx.arc(PITCH_WIDTH / 2, centerY, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeRect(MARGIN, centerY - 200, 165, 400);
      ctx.strokeRect(PITCH_WIDTH - MARGIN - 165, centerY - 200, 165, 400);

      ctx.strokeRect(MARGIN, centerY - 90, 55, 180);
      ctx.strokeRect(PITCH_WIDTH - MARGIN - 55, centerY - 90, 55, 180);

      ctx.beginPath();
      ctx.arc(MARGIN + 120, centerY, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(PITCH_WIDTH - MARGIN - 120, centerY, 5, 0, 2 * Math.PI);
      ctx.fill();

      const arcAngle = Math.acos(55 / 90);
      ctx.beginPath();
      ctx.arc(MARGIN + 120, centerY, 90, -arcAngle, arcAngle);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(PITCH_WIDTH - MARGIN - 120, centerY, 90, Math.PI - arcAngle, Math.PI + arcAngle);
      ctx.stroke();

      ctx.beginPath(); ctx.arc(MARGIN, MARGIN, 15, 0, 0.5 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(MARGIN, PITCH_HEIGHT - MARGIN, 15, 1.5 * Math.PI, 2 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(PITCH_WIDTH - MARGIN, MARGIN, 15, 0.5 * Math.PI, Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(PITCH_WIDTH - MARGIN, PITCH_HEIGHT - MARGIN, 15, Math.PI, 1.5 * Math.PI); ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(MARGIN - 30, centerY - 38, 30, 76);
      ctx.strokeRect(PITCH_WIDTH - MARGIN, centerY - 38, 30, 76);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let xOffset = MARGIN - 30; xOffset <= MARGIN; xOffset += 10) {
        ctx.moveTo(xOffset, centerY - 38); ctx.lineTo(xOffset, centerY + 38);
      }
      for (let yOffset = centerY - 38; yOffset <= centerY + 38; yOffset += 10) {
        ctx.moveTo(MARGIN - 30, yOffset); ctx.lineTo(MARGIN, yOffset);
      }
      for (let xOffset = PITCH_WIDTH - MARGIN; xOffset <= PITCH_WIDTH - MARGIN + 30; xOffset += 10) {
        ctx.moveTo(xOffset, centerY - 38); ctx.lineTo(xOffset, centerY + 38);
      }
      for (let yOffset = centerY - 38; yOffset <= centerY + 38; yOffset += 10) {
        ctx.moveTo(PITCH_WIDTH - MARGIN, yOffset); ctx.lineTo(PITCH_WIDTH - MARGIN + 30, yOffset);
      }
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'miter';

      ctx.strokeRect(MARGIN, MARGIN, PLAY_WIDTH, PLAY_HEIGHT);

      ctx.strokeRect(MARGIN, centerY - 280, 330, 560);

      ctx.strokeRect(MARGIN, centerY - 120, 110, 240);

      ctx.beginPath();
      ctx.arc(MARGIN + 240, centerY, 5, 0, 2 * Math.PI);
      ctx.fill();

      const arcAngle = Math.acos(90 / 180);
      ctx.beginPath();
      ctx.arc(MARGIN + 240, centerY, 180, -arcAngle, arcAngle);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(PITCH_WIDTH - MARGIN, centerY, 180, 0.5 * Math.PI, 1.5 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(PITCH_WIDTH - MARGIN, centerY, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.beginPath(); ctx.arc(MARGIN, MARGIN, 25, 0, 0.5 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(MARGIN, PITCH_HEIGHT - MARGIN, 25, 1.5 * Math.PI, 2 * Math.PI); ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(MARGIN - 40, centerY - 50, 40, 100);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let xOffset = MARGIN - 40; xOffset <= MARGIN; xOffset += 10) {
        ctx.moveTo(xOffset, centerY - 50); ctx.lineTo(xOffset, centerY + 50);
      }
      for (let yOffset = centerY - 50; yOffset <= centerY + 50; yOffset += 10) {
        ctx.moveTo(MARGIN - 40, yOffset); ctx.lineTo(MARGIN, yOffset);
      }
      ctx.stroke();
    }
  };

  // Canvas draw operations
  const drawAll = useCallback((
    customPlayers?: Player[],
    customBall?: Position,
    customEquipment?: any[]
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const activePlayers = customPlayers || players;
    const activeBall = customBall || ball;
    const activeEquipment = customEquipment || equipment;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply translation for presentation laser/dragging zoom
    ctx.save();
    if (canvas.width !== PITCH_WIDTH || canvas.height !== PITCH_HEIGHT) {
      ctx.scale(canvas.width / PITCH_WIDTH, canvas.height / PITCH_HEIGHT);
    }
    if (isPresentationMode) {
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoomScale, zoomScale);
    }

    // 1. Draw Field
    drawPitch(ctx);

    // 2. Draw Completed Drawings
    drawings.forEach(item => {
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
        // Draw zone overlays with 25% opacity fill
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

    // 3. Draw Active Drawing
    if (activeDrawing) {
      ctx.strokeStyle = activeDrawing.color;
      ctx.fillStyle = activeDrawing.color;
      if (activeDrawing.type !== 'text') {
        ctx.lineWidth = activeDrawing.thickness;
      }
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
          const arrowLength = 16 + activeDrawing.thickness;
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
      } else if (activeDrawing.type === 'circle') {
        ctx.beginPath();
        ctx.arc(activeDrawing.center.x, activeDrawing.center.y, activeDrawing.radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (activeDrawing.type === 'zone') {
        ctx.fillStyle = hexToRgba(activeDrawing.color, 0.25);
        const w = activeDrawing.end.x - activeDrawing.start.x;
        const h = activeDrawing.end.y - activeDrawing.start.y;
        ctx.fillRect(activeDrawing.start.x, activeDrawing.start.y, w, h);
        ctx.strokeStyle = activeDrawing.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(activeDrawing.start.x, activeDrawing.start.y, w, h);
      }
    }

    // 4. Draw Equipment (cones, small goals, hoops, poles)
    activeEquipment.forEach(item => {
      const isSelected = draggingItem?.type === 'equipment' && draggingItem?.id === item.id;
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(item.x, item.y, 22, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fill();
      }

      if (item.type === 'cone') {
        ctx.fillStyle = '#f97316';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(item.x, item.y - 14);
        ctx.lineTo(item.x - 12, item.y + 12);
        ctx.lineTo(item.x + 12, item.y + 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (item.type === 'goal') {
        ctx.fillStyle = 'rgba(100, 116, 139, 0.4)';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.rect(item.x - 18, item.y - 12, 36, 24);
        ctx.fill();
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(item.x - 6, item.y - 12); ctx.lineTo(item.x - 6, item.y + 12);
        ctx.moveTo(item.x + 6, item.y - 12); ctx.lineTo(item.x + 6, item.y + 12);
        ctx.stroke();
      } else if (item.type === 'pole') {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(item.x, item.y + 18);
        ctx.lineTo(item.x, item.y - 18);
        ctx.stroke();

        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(item.x, item.y - 18);
        ctx.lineTo(item.x + 12, item.y - 13);
        ctx.lineTo(item.x, item.y - 8);
        ctx.closePath();
        ctx.fill();
      } else if (item.type === 'hoop') {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(item.x, item.y, 16, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });

    // 5. Draw Players (only if they are NOT docked!)
    if (isPresentationMode) {
      activePlayers.forEach(pl => {
        if (pl.docked) return; // Hide docked players from the canvas

        const isSelected = draggingItem?.type === 'player' && draggingItem?.id === pl.id;
        const isHighlighted = selectedPlayerId === pl.id;

        if (isSelected || isHighlighted) {
          ctx.beginPath();
          ctx.arc(pl.x, pl.y, PLAYER_RADIUS + 5, 0, 2 * Math.PI);
          ctx.fillStyle = isHighlighted ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.3)';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(pl.x, pl.y, PLAYER_RADIUS, 0, 2 * Math.PI);

        if (pl.id === 'referee') {
          // Special Referee look
          ctx.fillStyle = '#10b981'; // bright green
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 12px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('ÁRB', pl.x, pl.y);
        } else if (pl.isGK) {
          ctx.fillStyle = '#fbbf24';
          ctx.fill();
          ctx.strokeStyle = '#1e2937';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = '#1e2937';
          ctx.font = 'bold 16px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pl.number.toString(), pl.x, pl.y);
        } else {
          if (pl.colorTag) {
            ctx.fillStyle =
              pl.colorTag === 'blue'
                ? '#2563eb'
                : pl.colorTag === 'red'
                ? '#dc2626'
                : pl.colorTag === 'yellow'
                ? '#fbbf24'
                : pl.colorTag === 'green'
                ? '#10b981'
                : pl.colorTag === 'orange'
                ? '#f97316'
                : pl.colorTag === 'purple'
                ? '#8b5cf6'
                : pl.colorTag === 'white'
                ? '#ffffff'
                : '#000000';
          } else {
            ctx.fillStyle = pl.team === 'home' ? '#2563eb' : '#dc2626';
          }
          ctx.fill();
          ctx.strokeStyle = pl.colorTag === 'white' ? '#1e2937' : '#ffffff';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = pl.colorTag === 'white' ? '#1e2937' : '#ffffff';
          ctx.font = 'bold 16px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pl.number.toString(), pl.x, pl.y);
        }
      });
    } else if (isExporting) {
      activePlayers.forEach(pl => {
        if (pl.docked) return;
        
        let color = '#2563eb'; // blue
        if (pl.isGK) {
          color = '#fbbf24'; // yellow
        } else if (pl.team === 'away') {
          color = '#dc2626'; // red
        } else if (pl.id === 'referee') {
          color = '#10b981'; // green for referee
        }
        
        ctx.beginPath();
        ctx.arc(pl.x, pl.y, PLAYER_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const text = pl.id === 'referee' ? 'ÁRB' : pl.number.toString();
        ctx.fillText(text, pl.x, pl.y);
      });
    }

    // 6. Draw Ball
    const isBallSelected = draggingItem?.type === 'ball';
    if (isBallSelected) {
      ctx.beginPath();
      ctx.arc(activeBall.x, activeBall.y, BALL_RADIUS + 4, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(activeBall.x, activeBall.y, BALL_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#1e2937';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = '#1e2937';
    const rPent = 4;
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const px = activeBall.x + rPent * Math.cos(angle);
      const py = activeBall.y + rPent * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = '#1e2937';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const px1 = activeBall.x + rPent * Math.cos(angle);
      const py1 = activeBall.y + rPent * Math.sin(angle);
      const px2 = activeBall.x + BALL_RADIUS * Math.cos(angle);
      const py2 = activeBall.y + BALL_RADIUS * Math.sin(angle);
      ctx.moveTo(px1, py1);
      ctx.lineTo(px2, py2);
    }
    ctx.stroke();

    // 7. Laser Pointer (in presentation mode, drawn outside scale logic for crispness)
    if (isPresentationMode && laserPos) {
      ctx.beginPath();
      ctx.arc(laserPos.x, laserPos.y, 10 / zoomScale, 0, 2 * Math.PI);
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(laserPos.x, laserPos.y, 3 / zoomScale, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.shadowBlur = 0;
    }

    // 8. Draw Timer Overlay (only when exporting)
    if (isExporting && canvasTimerTimeRef.current !== null) {
      const secs = canvasTimerTimeRef.current / 1000;
      const timeStr = formatProgressTime(secs) + '.' + Math.floor((canvasTimerTimeRef.current % 1000) / 100);
      
      ctx.save();
      ctx.font = 'bold 22px monospace';
      ctx.fillStyle = 'rgba(17, 22, 34, 0.85)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      
      const textWidth = ctx.measureText(timeStr).width;
      const padding = 12;
      const boxWidth = textWidth + padding * 2;
      const boxHeight = 28 + padding;
      
      const x = PITCH_WIDTH - boxWidth - 20;
      const y = 20;
      
      ctx.beginPath();
      ctx.rect(x, y, boxWidth, boxHeight);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(timeStr, x + padding, y + boxHeight / 2);
      ctx.restore();
    }

    ctx.restore();
  }, [players, ball, drawings, activeDrawing, draggingItem, selectedPlayerId, pitchType, equipment, isPresentationMode, zoomScale, panOffset, laserPos, isExporting]);

  useEffect(() => {
    drawAll();
  }, [drawAll]);

  // Pointer event listeners
  const handlePointerDown = (e: React.PointerEvent<any>) => {
    const canvas = canvasRef.current;
    if (!canvas || isPlaying) return;

    canvas.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Double click to dock player
    if (toolMode === 'move' && e.detail === 2) {
      for (let i = players.length - 1; i >= 0; i--) {
        const pl = players[i];
        if (pl.docked) continue;
        const dist = Math.hypot(x - pl.x, y - pl.y);
        if (dist <= PLAYER_RADIUS + 10) {
          setPlayers(prev => prev.map(p => p.id === pl.id ? { ...p, x: 0, y: 0, docked: true } : p));
          setSelectedPlayerId(null);
          return;
        }
      }
    }

    if (isPresentationMode) {
      setIsDraggingCanvas(true);
      dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    if (toolMode === 'move') {
      const distBall = Math.hypot(x - ball.x, y - ball.y);
      if (distBall <= BALL_RADIUS + 12) {
        setDraggingItem({ type: 'ball' });
        setSelectedPlayerId(null);
        return;
      }

      for (let i = players.length - 1; i >= 0; i--) {
        const pl = players[i];
        if (pl.docked) continue;
        const dist = Math.hypot(x - pl.x, y - pl.y);
        if (dist <= PLAYER_RADIUS + 10) {
          setDraggingItem({ type: 'player', id: pl.id });
          setSelectedPlayerId(pl.id);
          return;
        }
      }

      if (mode === 'entrenamiento') {
        for (let i = equipment.length - 1; i >= 0; i--) {
          const item = equipment[i];
          const dist = Math.hypot(x - item.x, y - item.y);
          if (dist <= 20) {
            setDraggingItem({ type: 'equipment', id: item.id });
            setSelectedPlayerId(null);
            return;
          }
        }
      }

      setSelectedPlayerId(null);
    } else {
      const pt = { x, y };
      if (toolMode === 'freehand') {
        setActiveDrawing({ type: 'freehand', color: drawingColor, thickness: drawingThickness, points: [pt] });
      } else if (toolMode === 'line') {
        setActiveDrawing({ type: 'line', color: drawingColor, thickness: drawingThickness, start: pt, end: pt });
      } else if (toolMode === 'arrow') {
        setActiveDrawing({ type: 'arrow', color: drawingColor, thickness: drawingThickness, start: pt, end: pt });
      } else if (toolMode === 'circle') {
        setActiveDrawing({ type: 'circle', color: drawingColor, thickness: drawingThickness, center: pt, radius: 0 });
      } else if (toolMode === 'zone') {
        setActiveDrawing({ type: 'zone', color: drawingColor, thickness: drawingThickness, start: pt, end: pt });
      } else if (toolMode === 'text') {
        const textVal = prompt('Introduce el texto a añadir:');
        if (textVal && textVal.trim()) {
          setDrawings(prev => [...prev, { type: 'text', color: drawingColor, text: textVal.trim(), position: pt }]);
        }
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<any>) => {
    const canvas = canvasRef.current;
    if (!canvas || isPlaying) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const cx = Math.max(0, Math.min(canvas.width, x));
    const cy = Math.max(0, Math.min(canvas.height, y));

    if (isPresentationMode) {
      // Map pointer to zoomed pixels
      const lx = (x - panOffset.x) / zoomScale;
      const ly = (y - panOffset.y) / zoomScale;
      setLaserPos({ x: lx, y: ly });

      if (isDraggingCanvas && zoomScale > 1.0) {
        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;
        const maxPanX = (zoomScale - 1) * canvas.width;
        const maxPanY = (zoomScale - 1) * canvas.height;
        setPanOffset({
          x: Math.max(-maxPanX, Math.min(0, newX)),
          y: Math.max(-maxPanY, Math.min(0, newY))
        });
      }
      return;
    }

    if (toolMode === 'move' && draggingItem) {
      if (draggingItem.type === 'ball') {
        setBall({ x: cx, y: cy });
      } else if (draggingItem.type === 'player' && draggingItem.id) {
        setPlayers(prev =>
          prev.map(p => (p.id === draggingItem.id ? { ...p, x: cx, y: cy } : p))
        );
      } else if (draggingItem.type === 'equipment' && draggingItem.id) {
        setEquipment(prev =>
          prev.map(e => (e.id === draggingItem.id ? { ...e, x: cx, y: cy } : e))
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
      } else if (activeDrawing.type === 'line' || activeDrawing.type === 'arrow' || activeDrawing.type === 'zone') {
        setActiveDrawing(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            end: { x: cx, y: cy }
          };
        });
      } else if (activeDrawing.type === 'circle') {
        setActiveDrawing(prev => {
          if (!prev || prev.type !== 'circle') return prev;
          const r = Math.hypot(cx - prev.center.x, cy - prev.center.y);
          return {
            ...prev,
            radius: r
          };
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<any>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }

    if (isPresentationMode) {
      setIsDraggingCanvas(false);
      return;
    }

    if (toolMode === 'move') {
      if (draggingItem && draggingItem.type === 'player' && draggingItem.id) {
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rect.width;
          const x = (e.clientX - rect.left) * scaleX;
          
          // If dropped outside the left/right boundaries of the canvas
          if (x < 0 || x > PITCH_WIDTH) {
            setPlayers(prev =>
              prev.map(p => (p.id === draggingItem.id ? { ...p, x: 0, y: 0, docked: true } : p))
            );
            setSelectedPlayerId(null);
          }
        }
      }
      setDraggingItem(null);
    } else if (activeDrawing) {
      setDrawings(prev => [...prev, activeDrawing]);
      setActiveDrawing(null);
    }
  };

  // Zoom wheel inside presentation mode
  const handleWheelZoom = (e: React.WheelEvent<any>) => {
    if (!isPresentationMode) return;
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
      const scaleChange = newScale / zoomScale;
      const newPanX = mouseX - (mouseX - panOffset.x) * scaleChange;
      const newPanY = mouseY - (mouseY - panOffset.y) * scaleChange;

      setZoomScale(newScale);
      setPanOffset(newScale === 1.0 ? { x: 0, y: 0 } : { x: newPanX, y: newPanY });
    }
  };

  // Recording triggers
  const handleRecordToggle = () => {
    if (isPlaying) return;

    if (isRecording) {
      setIsRecording(false);
    } else {
      // If we have JSON tracking data loaded, let's bake it into recordingFrames!
      if (jsonTrackingData && jsonTrackingData.frames && jsonTrackingData.frames.length > 0) {
        const duration = jsonTrackingData.duration;
        const frames = jsonTrackingData.frames;
        const bakedFrames: Frame[] = [];
        
        // Bake at 40ms intervals (25fps)
        const step = 0.04; // 40ms
        for (let t = 0; t <= duration; t += step) {
          let fA = frames[0];
          let fB = frames[frames.length - 1];
          let isBoundary = false;
          let boundaryPlayerFrame = null;

          if (t <= frames[0].t) {
            isBoundary = true;
            boundaryPlayerFrame = frames[0];
          } else if (t >= frames[frames.length - 1].t) {
            isBoundary = true;
            boundaryPlayerFrame = frames[frames.length - 1];
          } else {
            for (let i = 0; i < frames.length - 1; i++) {
              if (frames[i].t <= t && frames[i + 1].t >= t) {
                fA = frames[i];
                fB = frames[i + 1];
                break;
              }
            }
          }

          const framePlayers = players.map((p) => {
            if (!p.id.startsWith('track_')) {
              return {
                id: p.id,
                team: p.team,
                number: p.number,
                isGK: p.isGK,
                x: p.x,
                y: p.y,
                colorTag: p.colorTag,
                name: p.name,
                docked: p.docked
              };
            }

            const originalIdx = parseInt(p.id.replace('track_', ''), 10) - 1;

            if (isBoundary) {
              const plFrame = boundaryPlayerFrame?.players[originalIdx];
              return {
                id: p.id,
                team: p.team,
                number: p.number,
                isGK: p.isGK,
                x: plFrame ? (plFrame.x / 100) * PITCH_WIDTH : PITCH_WIDTH / 2,
                y: plFrame ? (plFrame.y / 100) * PITCH_HEIGHT : PITCH_HEIGHT / 2,
                docked: false,
                colorTag: p.colorTag,
                name: p.name
              };
            }

            const pA = fA.players[originalIdx];
            const pB = fB.players[originalIdx];
            if (!pA || !pB) {
              return {
                id: p.id,
                team: p.team,
                number: p.number,
                isGK: p.isGK,
                x: p.x,
                y: p.y,
                colorTag: p.colorTag,
                name: p.name,
                docked: p.docked
              };
            }

            const timeDiff = fB.t - fA.t;
            const ratio = timeDiff === 0 ? 0 : (t - fA.t) / timeDiff;

            return {
              id: p.id,
              team: p.team,
              number: p.number,
              isGK: p.isGK,
              x: ((pA.x + (pB.x - pA.x) * ratio) / 100) * PITCH_WIDTH,
              y: ((pA.y + (pB.y - pA.y) * ratio) / 100) * PITCH_HEIGHT,
              docked: false,
              colorTag: p.colorTag,
              name: p.name
            };
          });

          bakedFrames.push({
            timestamp: Math.round(t * 1000),
            players: framePlayers as any,
            ball: { x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2 },
            equipment: []
          });
        }

        setRecordingFrames(bakedFrames);
        setInitialState({
          players: players.map(p => ({ ...p })),
          ball: { ...ball },
          drawings: drawings.map(d => ({ ...d })),
          equipment: equipment.map(e => ({ ...e }))
        });
        
        alert("Movimiento de tracking grabado con éxito. Ahora puedes guardar la jugada.");
      } else {
        setRecordingFrames([]);
        setInitialState({
          players: players.map(p => ({ ...p })),
          ball: { ...ball },
          drawings: drawings.map(d => ({ ...d })),
          equipment: equipment.map(e => ({ ...e }))
        });
        setIsRecording(true);
      }
    }
  };

  const handlePlayToggle = () => {
    if (isRecording) return;
    
    const hasTracking = trackingKeyframes && trackingKeyframes.length > 0;
    const hasJsonTracking = jsonTrackingData && jsonTrackingData.frames && jsonTrackingData.frames.length > 0;
    if (recordingFrames.length === 0 && !hasTracking && !hasJsonTracking) return;

    const newPlaying = !isPlaying;
    setIsPlaying(newPlaying);

    if (onPlayStateChange) {
      onPlayStateChange(newPlaying);
    }

    if (newPlaying) {
      if (recordingFrames.length > 0 && initialState) {
        setPlayers(initialState.players.map(p => ({ ...p })));
        setBall({ ...initialState.ball });
        setEquipment(initialState.equipment.map(e => ({ ...e })));
      } else if (hasTracking || hasJsonTracking) {
        setInitialState({
          players: players.map(p => ({ ...p })),
          ball: { ...ball },
          drawings: drawings.map(d => ({ ...d })),
          equipment: equipment.map(e => ({ ...e }))
        });
        if (hasJsonTracking && jsonTrackingData && playbackTimeRef.current >= jsonTrackingData.duration) {
          setCurrentPlaybackTime(0);
          updatePlayersPositionsAtTime(0);
        }
      }
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!jsonTrackingData) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickRatio = Math.max(0, Math.min(1, clickX / width));
    const seekTime = clickRatio * jsonTrackingData.duration;

    setCurrentPlaybackTime(seekTime);
    updatePlayersPositionsAtTime(seekTime);

    if (hasVideo && onSeekVideo) {
      onSeekVideo(seekTime);
    }

    if (isPlaying) {
      setIsPlaying(false);
      setTimeout(() => {
        setIsPlaying(true);
      }, 0);
    }
  };

  const handleExportVideo = () => {
    if (recordingFrames.length === 0 || isRecording || isPlaying || isExporting) return;
    setToolMode('move');
    setCanvasWidth(1280);
    setCanvasHeight(853);
    setIsExporting(true);
    setExportProgress(0);
  };

  // Start export recording after canvas resize has been applied by React
  useEffect(() => {
    if (isExporting && canvasWidth === 1280) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Capture canvas stream at 30fps
      const stream = canvas.captureStream(30);

      // Setup MediaRecorder
      let options = { mimeType: 'video/webm;codecs=vp9' };
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/webm;codecs=vp8' };
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/webm' };
          }
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pizarrapro_jugada.mp4';
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setExportProgress(0);
        canvasTimerTimeRef.current = null;
        setCanvasWidth(PITCH_WIDTH);
        setCanvasHeight(PITCH_HEIGHT);
      };

      mediaRecorder.start();

      // Playback loop
      const lastFrame = recordingFrames[recordingFrames.length - 1];
      const duration = lastFrame.timestamp;
      const startPerf = performance.now();

      const animateExport = () => {
        const elapsed = performance.now() - startPerf;

        if (elapsed >= duration) {
          canvasTimerTimeRef.current = duration;
          // Apply final frame positions
          const currentFramePlayers = players.map(p => {
            const pf = lastFrame.players.find(x => x.id === p.id);
            if (pf) {
              const tagColor = pf.colorTag as any;
              return { ...p, x: pf.x, y: pf.y, colorTag: tagColor, docked: pf.docked, name: pf.name };
            }
            return p;
          });
          
          const currentFrameBall = { ...lastFrame.ball };
          
          const currentFrameEquipment = lastFrame.equipment
            ? lastFrame.equipment.map(e => ({ ...e }))
            : equipment;

          setPlayers(currentFramePlayers);
          setBall(currentFrameBall);
          if (lastFrame.equipment) {
            setEquipment(currentFrameEquipment);
          }

          // Call drawAll to render the frame's baseline onto the canvas
          drawAll(currentFramePlayers, currentFrameBall, currentFrameEquipment);

          // Draw the player tokens directly on the canvas
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.save();
              if (canvas.width !== PITCH_WIDTH || canvas.height !== PITCH_HEIGHT) {
                ctx.scale(canvas.width / PITCH_WIDTH, canvas.height / PITCH_HEIGHT);
              }
              
              currentFramePlayers.forEach(pl => {
                if (pl.docked) return;
                
                // Color mapping: blue for local, red for visitor, yellow for goalkeeper, green for referee
                let color = '#2563eb'; // blue
                if (pl.isGK) {
                  color = '#fbbf24'; // yellow
                } else if (pl.team === 'away') {
                  color = '#dc2626'; // red
                } else if (pl.id === 'referee') {
                  color = '#10b981'; // green
                }
                
                // Draw circle
                ctx.beginPath();
                ctx.arc(pl.x, pl.y, PLAYER_RADIUS, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();
                
                // Draw border/stroke
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // Draw player number
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 16px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const text = pl.id === 'referee' ? 'ÁRB' : pl.number.toString();
                ctx.fillText(text, pl.x, pl.y);
              });
              
              ctx.restore();
            }
          }
          
          setTimeout(() => {
            mediaRecorder.stop();
          }, 150);
        } else {
          canvasTimerTimeRef.current = elapsed;
          
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

          const currentFramePlayers = players.map(p => {
            const p1 = f1.players.find(x => x.id === p.id);
            const p2 = f2.players.find(x => x.id === p.id);
            if (p1 && p2) {
              const tagColor = p2.colorTag as any;
              return {
                ...p,
                x: p1.x + (p2.x - p1.x) * ratio,
                y: p1.y + (p2.y - p1.y) * ratio,
                colorTag: tagColor,
                docked: p2.docked,
                name: p2.name
              };
            }
            return p;
          });

          const currentFrameBall = {
            x: f1.ball.x + (f2.ball.x - f1.ball.x) * ratio,
            y: f1.ball.y + (f2.ball.y - f1.ball.y) * ratio
          };

          let currentFrameEquipment = equipment;
          if (f1.equipment && f2.equipment) {
            currentFrameEquipment = equipment.map(eq => {
              const eq1 = f1.equipment?.find(x => x.id === eq.id);
              const eq2 = f2.equipment?.find(x => x.id === eq.id);
              if (eq1 && eq2) {
                return {
                  ...eq,
                  x: eq1.x + (eq2.x - eq1.x) * ratio,
                  y: eq1.y + (eq2.y - eq1.y) * ratio
                };
              }
              return eq;
            });
          }

          setPlayers(currentFramePlayers);
          setBall(currentFrameBall);
          if (f1.equipment && f2.equipment) {
            setEquipment(currentFrameEquipment);
          }

          // Call drawAll to render the frame's baseline onto the canvas
          drawAll(currentFramePlayers, currentFrameBall, currentFrameEquipment);

          // Draw the player tokens directly on the canvas
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.save();
              if (canvas.width !== PITCH_WIDTH || canvas.height !== PITCH_HEIGHT) {
                ctx.scale(canvas.width / PITCH_WIDTH, canvas.height / PITCH_HEIGHT);
              }
              
              currentFramePlayers.forEach(pl => {
                if (pl.docked) return;
                
                // Color mapping: blue for local, red for visitor, yellow for goalkeeper, green for referee
                let color = '#2563eb'; // blue
                if (pl.isGK) {
                  color = '#fbbf24'; // yellow
                } else if (pl.team === 'away') {
                  color = '#dc2626'; // red
                } else if (pl.id === 'referee') {
                  color = '#10b981'; // green
                }
                
                // Draw circle
                ctx.beginPath();
                ctx.arc(pl.x, pl.y, PLAYER_RADIUS, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();
                
                // Draw border/stroke
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // Draw player number
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 16px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const text = pl.id === 'referee' ? 'ÁRB' : pl.number.toString();
                ctx.fillText(text, pl.x, pl.y);
              });
              
              ctx.restore();
            }
          }

          const progress = Math.min(100, (elapsed / duration) * 100);
          setExportProgress(Math.round(progress));

          requestAnimationFrame(animateExport);
        }
      };

      requestAnimationFrame(animateExport);
    }
  }, [isExporting, canvasWidth]);

  const handleReset = () => {
    setIsRecording(false);
    setIsPlaying(false);
    
    if (jsonTrackingData) {
      setCurrentPlaybackTime(0);
      updatePlayersPositionsAtTime(0);
    } else if (initialState) {
      setPlayers(initialState.players.map(p => ({ ...p })));
      setBall({ ...initialState.ball });
      setDrawings(initialState.drawings.map(d => ({ ...d })));
      setEquipment(initialState.equipment.map(e => ({ ...e })));
    } else {
      resetToFormations(formHome, formAway, pitchType);
    }
  };

  // Reset docks position
  const handleResetLayout = () => {
    setIsRecording(false);
    setIsPlaying(false);
    setPlayers(prev => prev.map(p => ({ ...p, docked: true })));
    setBall({ x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2 });
    setDrawings([]);
    setEquipment([]);
  };

  const handleRemoveBackground = () => {
    if (onClearBackground) {
      onClearBackground();
    }
    setBgImage(null);
    if (initialPlayData) {
      (initialPlayData as any).backgroundImage = '';
    }
  };

  const hasBgImage = !!(backgroundImage || (initialPlayData && (initialPlayData as any).backgroundImage) || bgImage);

  // Export PNG
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `pizarra_pro_${mode}_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  // State Link Sharing
  const handleShare = () => {
    try {
      const stateObj = {
        players: players.map(pl => ({ id: pl.id, team: pl.team, number: pl.number, isGK: pl.isGK, x: Math.round(pl.x), y: Math.round(pl.y), colorTag: pl.colorTag, name: pl.name, docked: pl.docked })),
        ball: { x: Math.round(ball.x), y: Math.round(ball.y) },
        drawings: drawings.map(dr => {
          if (dr.type === 'freehand') {
            return { t: 'f', c: dr.color, th: dr.thickness, pts: dr.points.map(pt => [Math.round(pt.x), Math.round(pt.y)]) };
          } else if (dr.type === 'circle') {
            return { t: 'c', c: dr.color, th: dr.thickness, cx: Math.round(dr.center.x), cy: Math.round(dr.center.y), r: Math.round(dr.radius) };
          } else if (dr.type === 'zone') {
            return { t: 'z', c: dr.color, th: dr.thickness, sx: Math.round(dr.start.x), sy: Math.round(dr.start.y), ex: Math.round(dr.end.x), ey: Math.round(dr.end.y) };
          } else if (dr.type === 'text') {
            return { t: 'x', c: dr.color, txt: dr.text, px: Math.round(dr.position.x), py: Math.round(dr.position.y) };
          } else {
            return { t: dr.type === 'arrow' ? 'a' : 'l', c: dr.color, th: dr.thickness, sx: Math.round(dr.start.x), sy: Math.round(dr.start.y), ex: Math.round(dr.end.x), ey: Math.round(dr.end.y) };
          }
        }),
        pitchType,
        equipment: equipment.map(e => ({ id: e.id, type: e.type, x: Math.round(e.x), y: Math.round(e.y) }))
      };
      
      const code = btoa(JSON.stringify(stateObj));
      const sectionParam = mode;
      const url = `${window.location.origin}${window.location.pathname}?state=${encodeURIComponent(code)}&sec=${sectionParam}`;
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy share link', e);
    }
  };

  const handleSaveToLibrary = () => {
    if (!saveName.trim()) return;
    if (onSave) {
      const canvas = canvasRef.current;
      const thumbnail = canvas ? canvas.toDataURL('image/png') : '';
      onSave(saveName, {
        players: players.map(p => ({ ...p })),
        ball: { ...ball },
        drawings: drawings.map(d => ({ ...d })),
        pitchType,
        equipment: equipment.map(e => ({ ...e })),
        thumbnail,
        backgroundImage: backgroundImage || (initialPlayData && initialPlayData.backgroundImage) || '',
        trackingKeyframes: trackingKeyframes || [],
        jsonTrackingData: jsonTrackingData || null
      });
      setSaveName('');
      setShowSaveModal(false);
    }
  };

  // Toggle Presentation Fullscreen Mode
  const togglePresentationMode = () => {
    setIsPresentationMode(!isPresentationMode);
    setZoomScale(1.0);
    setPanOffset({ x: 0, y: 0 });
    setLaserPos(null);
  };

  const localHomePlayers = players.filter(p => p.team === 'home' && p.number <= availablePlayersCount && p.id !== 'referee');
  const localAwayPlayers = players.filter(p => p.team === 'away' && p.number <= availablePlayersCount);
  const refereePlayer = players.find(p => p.id === 'referee');

  return (
    <div className={`tactical-editor-viewport ${isPresentationMode ? 'presentation-mode-active' : ''}`}>
      
      {/* 1. TOP TOOLBAR & PRESETS CONTROLS */}
      {!isPresentationMode && (
        <div className="toolbar glassmorphic flex-wrap gap-4">
          
          {/* Formations & Field Types */}
          <div className="toolbar-section">
            {mode === 'entrenamiento' ? (
              <div className="select-wrapper">
                <span className="select-label">Tipo de Campo</span>
                <div className="tool-group">
                  <button onClick={() => handlePitchTypeToggle('full')} className={`tool-btn ${pitchType === 'full' ? 'active' : ''}`}>Completo</button>
                  <button onClick={() => handlePitchTypeToggle('half')} className={`tool-btn ${pitchType === 'half' ? 'active' : ''}`}>Medio Campo</button>
                </div>
              </div>
            ) : (
              <>
                <div className="select-wrapper">
                  <span className="select-label text-blue">Alineación Local</span>
                  <select value={formHome} onChange={e => handleHomeFormationChange(e.target.value)} className="custom-select" disabled={isRecording || isPlaying}>
                    <option value="4-3-3">4-3-3</option>
                    <option value="4-4-2">4-4-2</option>
                    <option value="4-2-3-1">4-2-3-1</option>
                    <option value="3-5-2">3-5-2</option>
                    <option value="5-3-2">5-3-2</option>
                  </select>
                </div>
                {pitchType === 'full' && (
                  <div className="select-wrapper">
                    <span className="select-label text-red">Alineación Visitante</span>
                    <select value={formAway} onChange={e => handleAwayFormationChange(e.target.value)} className="custom-select" disabled={isRecording || isPlaying}>
                      <option value="4-3-3">4-3-3</option>
                      <option value="4-4-2">4-4-2</option>
                      <option value="4-2-3-1">4-2-3-1</option>
                      <option value="3-5-2">3-5-2</option>
                      <option value="5-3-2">5-3-2</option>
                    </select>
                  </div>
                )}
              </>
            )}

            {/* Session Preset Dropdown */}
            {(mode === 'entrenamiento' || mode === 'tactica') && (
              <div className="select-wrapper">
                <span className="select-label">Sesiones Presets</span>
                <select onChange={e => applySessionPreset(e.target.value)} className="custom-select" defaultValue="">
                  <option value="" disabled>-- Cargar Preset --</option>
                  <option value="rondo_4v1">Rondo 4v1</option>
                  <option value="rondo_6v2">Rondo 6v2</option>
                  <option value="pressing_alto">Pressing Alto</option>
                  <option value="transicion_rapida">Transición Rápida</option>
                  <option value="juego_posicion">Juego Posición</option>
                  <option value="amplitud">Amplitud (Sidelines)</option>
                </select>
              </div>
            )}
          </div>

          {/* Drawing Tools */}
          <div className="toolbar-section divider">
            <div className="tool-group">
              <button onClick={() => setToolMode('move')} className={`tool-btn ${toolMode === 'move' ? 'active' : ''}`} title="Mover Fichas"><MousePointer size={18} /></button>
              <button onClick={() => setToolMode('arrow')} className={`tool-btn ${toolMode === 'arrow' ? 'active' : ''}`} title="Flecha"><ArrowUpRight size={18} /></button>
              <button onClick={() => setToolMode('freehand')} className={`tool-btn ${toolMode === 'freehand' ? 'active' : ''}`} title="Lápiz"><Edit2 size={16} /></button>
              <button onClick={() => setToolMode('line')} className={`tool-btn ${toolMode === 'line' ? 'active' : ''}`} title="Línea Recta"><Slash size={16} /></button>
              <button onClick={() => setToolMode('circle')} className={`tool-btn ${toolMode === 'circle' ? 'active' : ''}`} title="Círculo"><Compass size={16} /></button>
              <button onClick={() => setToolMode('zone')} className={`tool-btn ${toolMode === 'zone' ? 'active' : ''}`} title="Dibujar Zonas"><Grid size={16} /></button>
              <button onClick={() => setToolMode('text')} className={`tool-btn ${toolMode === 'text' ? 'active' : ''}`} title="Añadir Texto"><Type size={16} /></button>
            </div>

            {toolMode !== 'move' && (
              <div className="drawing-props-panel">
                <div className="color-palette">
                  {['#ffffff', '#fbbf24', '#ef4444', '#3b82f6', '#10b981'].map(color => (
                    <button key={color} onClick={() => setDrawingColor(color)} className={`color-btn ${drawingColor === color ? 'selected' : ''}`} style={{ backgroundColor: color }} />
                  ))}
                  <input type="color" value={drawingColor} onChange={e => setDrawingColor(e.target.value)} className="color-picker" />
                </div>
                <div className="thickness-control">
                  <input type="range" min="2" max="12" step="2" value={drawingThickness} onChange={e => setDrawingThickness(parseInt(e.target.value))} className="custom-range" />
                  <span className="thickness-indicator">{drawingThickness}px</span>
                </div>
              </div>
            )}
            
            <button onClick={() => setDrawings([])} className="tool-btn danger" title="Limpiar dibujos"><Trash2 size={16} /></button>
          </div>

          {/* Action Tools */}
          <div className="toolbar-section divider">
            <div className="rec-group">
              <button onClick={handleRecordToggle} className={`rec-btn ${isRecording ? 'recording' : ''}`} title="Grabar Jugada" disabled={isPlaying}>
                <Video size={16} className={isRecording ? 'pulse' : ''} />
                <span>{isRecording ? 'Grabando' : 'Grabar'}</span>
              </button>
              <button onClick={handlePlayToggle} className={`play-btn ${isPlaying ? 'playing' : ''}`} disabled={isRecording || (recordingFrames.length === 0 && (!trackingKeyframes || trackingKeyframes.length === 0) && (!jsonTrackingData || !jsonTrackingData.frames || jsonTrackingData.frames.length === 0))}>
                <Play size={16} />
                <span>{isPlaying ? 'Parar' : (trackingKeyframes && trackingKeyframes.length > 0) ? 'Play Tracking' : 'Play'}</span>
              </button>
              {(jsonTrackingData || (trackingKeyframes && trackingKeyframes.length > 0)) && (
                <div className="speed-controls" style={{ display: 'inline-flex', gap: '0.25rem', marginLeft: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '0.25rem' }}>Velocidad:</span>
                  {([0.25, 0.5, 1, 2] as const).map(speed => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className="tool-btn"
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        backgroundColor: playbackSpeed === speed ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        color: playbackSpeed === speed ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
              <button onClick={handleReset} className="tool-btn text-muted" title="Restablecer Pizarra"><RotateCcw size={16} /></button>
              <button onClick={handleResetLayout} className="tool-btn danger-border text-red font-semibold" title="Resetear Layout a Docks">Reset Layout</button>
            </div>

            <div className="action-group">
              {hasBgImage && (
                <button
                  onClick={handleRemoveBackground}
                  className="action-btn danger-border text-red font-semibold flex items-center gap-1"
                  title="Quitar fondo de vídeo"
                >
                  <RefreshCw size={16} />
                  <span>Quitar fondo</span>
                </button>
              )}
              <button onClick={handleExportPNG} className="action-btn" title="Descargar PNG"><Download size={16} /><span>PNG</span></button>
              {recordingFrames.length > 0 && (
                <button
                  onClick={handleExportVideo}
                  className="action-btn"
                  title="Exportar como vídeo WebM"
                  disabled={isExporting}
                  style={{
                    opacity: isExporting ? 0.6 : 1,
                    cursor: isExporting ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Video size={16} />
                  <span>{isExporting ? 'Exportando...' : 'Exportar vídeo'}</span>
                </button>
              )}
              <button onClick={handleShare} className={`action-btn ${shareCopied ? 'success' : ''}`} title="Compartir enlace Base64">{shareCopied ? <Check size={16} /> : <Share2 size={16} />}<span>Compartir</span></button>
              {onSave && <button onClick={() => setShowSaveModal(true)} className="action-btn primary-btn"><Plus size={16} /><span>Guardar</span></button>}
              <button onClick={togglePresentationMode} className="action-btn flex-center gap-1 font-semibold" style={{ background: '#7c3aed', color: '#fff', borderColor: '#7c3aed' }}>
                <Monitor size={16} />
                <span>Presentar</span>
              </button>
              {onOpenVestuario && (
                <button onClick={onOpenVestuario} className="action-btn flex-center gap-1 font-semibold" style={{ background: '#0e7490', color: '#fff', borderColor: '#0e7490' }}>
                  <Tablet size={16} />
                  <span>Vestuario</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. SUB BAR FOR PRESETS/TIMER IN TRAINING MODE */}
      {!isPresentationMode && (mode === 'entrenamiento' || selectedPlayerId) && (
        <div className="toolbar sub-toolbar glassmorphic flex-wrap gap-4 mt-2">
          {mode === 'entrenamiento' && (
            <div className="toolbar-section">
              {/* Spawn Tools */}
              <span className="select-label">Accesorios:</span>
              <div className="tool-group">
                <button onClick={() => addEquipmentItem('cone')} className="tool-btn item-spawn-btn orange-border"><span className="cone-dot orange-bg" /> Cono</button>
                <button onClick={() => addEquipmentItem('goal')} className="tool-btn item-spawn-btn grey-border"><span className="goal-dot grey-bg" /> Mini Portería</button>
                <button onClick={() => addEquipmentItem('pole')} className="tool-btn item-spawn-btn red-border"><span className="pole-dot red-bg" /> Pica</button>
                <button onClick={() => addEquipmentItem('hoop')} className="tool-btn item-spawn-btn blue-border"><span className="hoop-dot blue-bg" /> Aro</button>
              </div>

              {/* Dynamic squad count selector */}
              <div className="select-wrapper divider-left pl-4">
                <span className="select-label">Jugadores por Grupo (3-11)</span>
                <input
                  type="number"
                  min="3"
                  max="11"
                  value={availablePlayersCount}
                  onChange={e => setAvailablePlayersCount(Math.max(3, Math.min(11, parseInt(e.target.value) || 11)))}
                  className="modal-input"
                  style={{ width: 60, height: 32, padding: '0.25rem 0.5rem' }}
                />
              </div>

              {/* Countdown timer configuration */}
              <div className="select-wrapper divider-left pl-4 flex-row gap-2 items-end">
                <div className="flex-col">
                  <span className="select-label">Series</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={timerSeries}
                    onChange={e => setTimerSeries(Math.max(1, parseInt(e.target.value) || 1))}
                    className="modal-input"
                    style={{ width: 50, height: 32, padding: '0.25rem' }}
                  />
                </div>
                <div className="flex-col">
                  <span className="select-label">Duración</span>
                  <select
                    value={timerDuration}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setTimerDuration(val);
                      setTimeLeft(val);
                    }}
                    className="custom-select"
                    style={{ height: 32, minWidth: 80 }}
                  >
                    <option value="60">1 Min</option>
                    <option value="180">3 Min</option>
                    <option value="300">5 Min</option>
                    <option value="600">10 Min</option>
                    <option value="900">15 Min</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Expanded color palette tags for players */}
          {selectedPlayerId && (
            <div className="toolbar-section ml-auto">
              <span className="select-label">Color Ficha:</span>
              <div className="tool-group flex-wrap">
                {['blue', 'red', 'yellow', 'green', 'orange', 'purple', 'white', 'black'].map(tagColor => (
                  <button
                    key={tagColor}
                    onClick={() => setPlayerColorTag(tagColor as any)}
                    className="color-tag-btn"
                    style={{
                      backgroundColor:
                        tagColor === 'blue'
                          ? '#2563eb'
                          : tagColor === 'red'
                          ? '#dc2626'
                          : tagColor === 'yellow'
                          ? '#fbbf24'
                          : tagColor === 'green'
                          ? '#10b981'
                          : tagColor === 'orange'
                          ? '#f97316'
                          : tagColor === 'purple'
                          ? '#8b5cf6'
                          : tagColor === 'white'
                          ? '#ffffff'
                          : '#000000',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                    title={tagColor.toUpperCase()}
                  />
                ))}
                <button onClick={() => setPlayerColorTag(undefined)} className="color-tag-btn tag-clear" title="Restablecer" style={{ backgroundColor: '#2d3748' }}>✕</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. THREE-COLUMN EDITOR STAGE */}
      <div className={`tactical-editor-stage ${isPresentationMode ? 'presentation-fullscreen' : ''}`}>
        
        {/* LEFT DOCK: HOME TEAM */}
        {!isPresentationMode && (
          <aside className="dock-sidebar glassmorphic home-dock" style={{ width: '80px', minWidth: '80px', maxWidth: '80px', padding: '0.75rem 0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <h4 className="dock-title text-blue" style={{ fontSize: '0.65rem', textAlign: 'center', width: '100%', wordBreak: 'break-word', marginBottom: '0.5rem', paddingBottom: '0.25rem' }}>Fichas Local</h4>
            <div className="dock-list scrollbar-custom" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100%', overflowY: 'auto' }}>
              {localHomePlayers.filter(p => p.docked).map(p => (
                <div
                  key={p.id}
                  draggable={p.docked}
                  onDragStart={e => handleDockDragStart(e, p.id)}
                  className="dock-item-card"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'grab',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '36px',
                    height: '36px',
                    flexShrink: 0
                  }}
                >
                  <div
                    className="dock-item-token"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      border: '2px solid #ffffff',
                      backgroundColor: p.isGK
                        ? '#fbbf24'
                        : p.colorTag
                        ? p.colorTag === 'blue' ? '#2563eb' : p.colorTag === 'red' ? '#dc2626' : p.colorTag === 'yellow' ? '#fbbf24' : p.colorTag === 'green' ? '#10b981' : p.colorTag === 'orange' ? '#f97316' : p.colorTag === 'purple' ? '#8b5cf6' : p.colorTag === 'white' ? '#ffffff' : '#000000'
                        : '#2563eb',
                      color: p.isGK || p.colorTag === 'white' ? '#1e2937' : '#ffffff',
                      borderColor: p.colorTag === 'white' ? '#1e2937' : '#ffffff'
                    }}
                  >
                    {p.number}
                  </div>
                </div>
              ))}

              {/* Referee Entity at bottom of Home dock */}
              {refereePlayer && refereePlayer.docked && (
                <div
                  draggable={refereePlayer.docked}
                  onDragStart={e => handleDockDragStart(e, refereePlayer.id)}
                  className="dock-item-card referee-card"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'grab',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '36px',
                    height: '36px',
                    flexShrink: 0
                  }}
                >
                  <div
                    className="dock-item-token"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      border: '2px solid #000000',
                      backgroundColor: '#10b981',
                      color: '#000000'
                    }}
                  >
                    ÁRB
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* CENTER COLUMN: CANVAS FIELD & TIMERS */}
        <div className="canvas-viewport-column flex-col items-center" style={{ flex: 1, minWidth: 0 }}>
          
          {/* TIMER HUD OVERLAY */}
          {mode === 'entrenamiento' && !isPresentationMode && (
            <div className="timer-hud glassmorphic flex-center gap-4">
              <div className="hud-badge text-yellow">
                SERIE {currentSerie} / {timerSeries}
              </div>
              <div className="hud-timer font-mono text-xl font-bold">
                {formatTime(timeLeft)}
              </div>
              <div className="hud-actions flex-center gap-2">
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className={`action-btn flex-center p-2 rounded-full ${timerRunning ? 'success' : ''}`}
                  style={{ height: 32, width: 32 }}
                  title={timerRunning ? 'Pausar' : 'Iniciar'}
                >
                  {timerRunning ? <EyeOff size={16} /> : <Play size={16} fill="currentColor" />}
                </button>
                <button
                  onClick={() => {
                    setTimerRunning(false);
                    setTimeLeft(timerDuration);
                  }}
                  className="tool-btn flex-center p-2 rounded-full"
                  style={{ height: 32, width: 32 }}
                  title="Reiniciar Cronómetro"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Description overlay */}
          {mode === 'entrenamiento' && !isPresentationMode && (
            <div className="exercise-desc-wrapper glassmorphic w-full mb-2 p-2">
              <span className="select-label">Descripción del Ejercicio:</span>
              <textarea
                value={exerciseDesc}
                onChange={e => setExerciseDesc(e.target.value)}
                placeholder="Describe los objetivos, repeticiones y reglas del ejercicio..."
                className="exercise-textarea modal-input mt-1"
                rows={2}
              />
            </div>
          )}

          {/* PRESENTATION EXIT BUTTON */}
          {isPresentationMode && (
            <div className="pres-fullscreen-navbar glassmorphic">
              <div className="pres-fullscreen-info flex-col">
                <span className="pres-fullscreen-title">{activePlay ? activePlay.name : 'Modo Presentación'}</span>
                {savedPlaysList.length > 0 && (
                  <span className="text-muted text-xs">Jugada {currentPlayIndex + 1} de {savedPlaysList.length} (Usa flechas Izq/Der para cambiar)</span>
                )}
              </div>
              
              <div className="flex-center gap-4">
                <span className="text-muted text-sm select-none">
                  Zoom: {Math.round(zoomScale * 100)}% (Usa rueda ratón para ampliar)
                </span>
                {zoomScale > 1.0 && (
                  <button
                    onClick={() => {
                      setZoomScale(1.0);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    className="action-btn flex-center gap-1 danger-border text-red small-btn"
                  >
                    Restablecer
                  </button>
                )}
                <button onClick={togglePresentationMode} className="action-btn flex-center gap-1 primary-btn">
                  <Maximize size={16} />
                  <span>Salir</span>
                </button>
              </div>
            </div>
          )}

          {/* Main canvas container */}
          <div className="canvas-wrapper pres-fullscreen-stage glassmorphic w-full" style={{ overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div
              style={{
                position: 'relative',
                maxWidth: '100%',
                width: `${canvasWidth}px`,
                aspectRatio: `${PITCH_WIDTH} / ${PITCH_HEIGHT}`,
                touchAction: 'none'
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheelZoom}
            >
              {/* Video Exporting Progress Overlay */}
              {isExporting && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(11, 15, 26, 0.85)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', maxWidth: '300px', width: '80%' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
                      Exportando vídeo... {exportProgress}%
                    </span>
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${exportProgress}%`,
                          backgroundColor: '#3b82f6',
                          borderRadius: '4px',
                          transition: 'width 0.1s ease-out'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
                      Por favor, no cierres esta pestaña.
                    </span>
                  </div>
                </div>
              )}

              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                onDragOver={handleCanvasDragOver}
                onDrop={handleCanvasDrop}
                className="pitch-canvas"
                style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
              />

              {/* HTML Player Tokens Overlay */}
              {!isPresentationMode && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                  }}
                >
                  {players.filter(pl => !pl.docked).map(pl => {
                    const isGK = pl.isGK;
                    const isReferee = pl.id === 'referee';
                    const bgColor = isReferee
                      ? '#10b981'
                      : isGK
                      ? '#fbbf24'
                      : pl.colorTag
                      ? pl.colorTag === 'blue' ? '#2563eb' : pl.colorTag === 'red' ? '#dc2626' : pl.colorTag === 'yellow' ? '#fbbf24' : pl.colorTag === 'green' ? '#10b981' : pl.colorTag === 'orange' ? '#f97316' : pl.colorTag === 'purple' ? '#8b5cf6' : pl.colorTag === 'white' ? '#ffffff' : '#000000'
                      : pl.team === 'home' ? '#2563eb' : '#dc2626';
                    
                    const textColor = isReferee || isGK || pl.colorTag === 'white' ? '#1e2937' : '#ffffff';
                    const borderColor = pl.colorTag === 'white' ? '#1e2937' : '#ffffff';

                    const isSelected = draggingItem?.type === 'player' && draggingItem?.id === pl.id;
                    const isHighlighted = selectedPlayerId === pl.id;

                    return (
                      <div
                        key={pl.id}
                        className="group"
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setPlayers(prev => prev.map(p => p.id === pl.id ? { ...p, x: 0, y: 0, docked: true } : p));
                          setSelectedPlayerId(null);
                        }}
                        style={{
                          position: 'absolute',
                          left: `${(pl.x / PITCH_WIDTH) * 100}%`,
                          top: `${(pl.y / PITCH_HEIGHT) * 100}%`,
                          width: `${(PLAYER_RADIUS * 2 / PITCH_WIDTH) * 100}%`,
                          aspectRatio: '1',
                          transform: 'translate(-50%, -50%)',
                          zIndex: 30,
                          cursor: 'grab',
                          boxShadow: isHighlighted
                            ? '0 0 0 6px rgba(16, 185, 129, 0.35)'
                            : isSelected
                            ? '0 0 0 6px rgba(255, 255, 255, 0.3)'
                            : 'none',
                          borderRadius: '50%',
                          pointerEvents: 'auto'
                        }}
                      >
                        {/* Token Circle */}
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            backgroundColor: bgColor,
                            border: `2px solid ${borderColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: textColor,
                            fontWeight: 'bold',
                            fontSize: isReferee ? '10px' : '14px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.35)'
                          }}
                        >
                          {isReferee ? 'ÁRB' : pl.number}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {/* Progress Bar (Visible when jsonTrackingData is loaded) */}
          {jsonTrackingData && (
            <div
              className="tracking-progress-bar-container glassmorphic"
              style={{
                width: '100%',
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                zIndex: 10
              }}
            >
              <span style={{ fontSize: '0.8rem', color: '#f8fafc', fontFamily: 'monospace', minWidth: '85px', textAlign: 'center' }}>
                {formatProgressTime(currentPlaybackTime)} / {formatProgressTime(jsonTrackingData.duration)}
              </span>
              <div
                onClick={handleProgressBarClick}
                className="progress-bar-track"
                style={{
                  flex: 1,
                  height: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div
                  className="progress-bar-fill"
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (currentPlaybackTime / jsonTrackingData.duration) * 100)}%`,
                    backgroundColor: 'var(--accent-color, #3b82f6)',
                    borderRadius: '4px',
                    transition: isPlaying ? 'none' : 'width 0.1s ease-out'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT DOCK: AWAY TEAM */}
        {!isPresentationMode && (
          <aside className="dock-sidebar glassmorphic away-dock" style={{ width: '80px', minWidth: '80px', maxWidth: '80px', padding: '0.75rem 0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <h4 className="dock-title text-red" style={{ fontSize: '0.65rem', textAlign: 'center', width: '100%', wordBreak: 'break-word', marginBottom: '0.5rem', paddingBottom: '0.25rem' }}>Fichas Visitante</h4>
            <div className="dock-list scrollbar-custom" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100%', overflowY: 'auto' }}>
              {localAwayPlayers.filter(p => p.docked).map(p => (
                <div
                  key={p.id}
                  draggable={p.docked}
                  onDragStart={e => handleDockDragStart(e, p.id)}
                  className="dock-item-card"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'grab',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '36px',
                    height: '36px',
                    flexShrink: 0
                  }}
                >
                  <div
                    className="dock-item-token"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      border: '2px solid #ffffff',
                      backgroundColor: p.isGK
                        ? '#fbbf24'
                        : p.colorTag
                        ? p.colorTag === 'blue' ? '#2563eb' : p.colorTag === 'red' ? '#dc2626' : p.colorTag === 'yellow' ? '#fbbf24' : p.colorTag === 'green' ? '#10b981' : p.colorTag === 'orange' ? '#f97316' : p.colorTag === 'purple' ? '#8b5cf6' : p.colorTag === 'white' ? '#ffffff' : '#000000'
                        : '#dc2626',
                      color: p.isGK || p.colorTag === 'white' ? '#1e2937' : '#ffffff',
                      borderColor: p.colorTag === 'white' ? '#1e2937' : '#ffffff'
                    }}
                  >
                    {p.number}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* 4. HELP DESCRIPTION */}
      {!isPresentationMode && (
        <div className="footer-info text-muted">
          {toolMode === 'move' ? (
            <p>⚽ Modo Mover: Arrastra fichas al campo · Clic derecho sobre una ficha para devolverla al banquillo</p>
          ) : toolMode === 'zone' ? (
            <p>🟩 Modo Zonas: Arrastra en diagonal en el campo para crear rectángulos semi-transparentes para marcar zonas tácticas (presión, peligro).</p>
          ) : toolMode === 'text' ? (
            <p>🔤 Modo Texto: Haz clic en cualquier lugar del campo para escribir anotaciones directas sobre el terreno.</p>
          ) : (
            <p>🖌️ Modo Dibujo: Arrastra en la pizarra para pintar flechas, círculos o trazos libres. Usa **Ctrl+Z** para deshacer.</p>
          )}
        </div>
      )}

      {/* MODAL: SAVE PLAY */}
      {showSaveModal && (
        <div className="modal-overlay">
          <div className="modal-card glassmorphic">
            <h3 className="modal-title">Guardar Jugada</h3>
            <p className="modal-subtitle">Introduce un nombre descriptivo para guardar esta táctica en tu Biblioteca.</p>
            <input
              type="text"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="Ej: Rondo ofensivo 4v1"
              className="modal-input"
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setShowSaveModal(false)} className="tool-btn">Cancelar</button>
              <button onClick={handleSaveToLibrary} className="action-btn primary-btn" disabled={!saveName.trim()}>Confirmar Guardado</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
