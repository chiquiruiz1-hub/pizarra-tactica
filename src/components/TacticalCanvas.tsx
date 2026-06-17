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
  FileDown
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
  isGK: boolean;
  x: number;
  y: number;
  colorTag?: 'blue' | 'red' | 'green' | 'orange';
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
  | { type: 'circle'; color: string; thickness: number; center: Position; radius: number };

type Frame = {
  timestamp: number;
  players: { id: string; x: number; y: number; colorTag?: string }[];
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
    { x: 5, y: 50 }, // GK
    { x: 22, y: 15 }, { x: 20, y: 32 }, { x: 18, y: 50 }, { x: 20, y: 68 }, { x: 22, y: 85 }, // DEF
    { x: 36, y: 28 }, { x: 34, y: 50 }, { x: 36, y: 72 }, // MID
    { x: 48, y: 33 }, { x: 48, y: 67 } // FW
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
    { x: 95, y: 50 }, // GK
    { x: 78, y: 85 }, { x: 80, y: 68 }, { x: 82, y: 50 }, { x: 80, y: 32 }, { x: 78, y: 15 }, // DEF
    { x: 64, y: 72 }, { x: 66, y: 50 }, { x: 64, y: 28 }, // MID
    { x: 52, y: 67 }, { x: 52, y: 33 } // FW
  ]
};

// Convert percentage coordinates to canvas points
const pctToCanvas = (pctX: number, pctY: number): Position => {
  return {
    x: MARGIN + (pctX / 100) * PLAY_WIDTH,
    y: MARGIN + (pctY / 100) * PLAY_HEIGHT
  };
};

interface TacticalCanvasProps {
  mode: 'tactica' | 'parado' | 'entrenamiento';
  onSave?: (name: string, data: { players: Player[]; ball: Position; drawings: Drawing[]; pitchType: 'full' | 'half'; equipment: EquipmentItem[]; thumbnail: string }) => void;
  initialPlayData?: {
    players: Player[];
    ball: Position;
    drawings: Drawing[];
    pitchType: 'full' | 'half';
    equipment: EquipmentItem[];
  } | null;
}

export default function TacticalCanvas({ mode, onSave, initialPlayData }: TacticalCanvasProps) {
  // State declaration
  const [pitchType, setPitchType] = useState<'full' | 'half'>('full');
  const [formHome, setFormHome] = useState<string>('4-3-3');
  const [formAway, setFormAway] = useState<string>('4-4-2');
  const [toolMode, setToolMode] = useState<'move' | 'arrow' | 'freehand' | 'line' | 'circle'>('move');
  const [drawingColor, setDrawingColor] = useState<string>('#ffffff');
  const [drawingThickness, setDrawingThickness] = useState<number>(4);

  // Player, ball and equipment positions
  const [players, setPlayers] = useState<Player[]>([]);
  const [ball, setBall] = useState<Position>({ x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2 });
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

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
    equipment: EquipmentItem[];
  } | null>(null);

  // UI Status
  const [shareCopied, setShareCopied] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

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

  // Default formation generator
  const resetToFormations = useCallback((fH: string, fA: string, currentPitch: 'full' | 'half') => {
    const defaultPlayers: Player[] = [];
    
    if (currentPitch === 'full') {
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
      setBall({ x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2 });
    } else {
      // Half pitch (focus left goal, players placed on the left side)
      const hCoords = homeFormations[fH];
      for (let i = 0; i < 11; i++) {
        // Map Home team coordinates to scale on the half pitch (midfield line is on the right)
        // Left goal is at x=150, Midfield at x=1150
        const xPct = hCoords[i].x; // 0 to 50
        const xHalf = 150 + (xPct / 50) * 1000;
        const yHalf = MARGIN + (hCoords[i].y / 100) * PLAY_HEIGHT;
        defaultPlayers.push({
          id: `home_${i + 1}`,
          team: 'home',
          number: i + 1,
          isGK: i === 0,
          x: xHalf,
          y: yHalf
        });
      }
      // Put Away team GK and 2 defenders on half pitch too, representing opponent defenders
      defaultPlayers.push({ id: `away_1`, team: 'away', number: 1, isGK: true, x: 190, y: centerY });
      defaultPlayers.push({ id: `away_2`, team: 'away', number: 2, isGK: false, x: 350, y: centerY - 150 });
      defaultPlayers.push({ id: `away_3`, team: 'away', number: 3, isGK: false, x: 350, y: centerY + 150 });
      defaultPlayers.push({ id: `away_4`, team: 'away', number: 4, isGK: false, x: 450, y: centerY });

      setBall({ x: 600, y: centerY });
    }

    setPlayers(defaultPlayers);
    setEquipment([]);
    setDrawings([]);
    setActiveDrawing(null);
    setSelectedPlayerId(null);
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

  // Handle formation selection change
  const handleHomeFormationChange = (val: string) => {
    setFormHome(val);
    resetToFormations(val, formAway, pitchType);
  };

  const handleAwayFormationChange = (val: string) => {
    setFormAway(val);
    resetToFormations(formHome, val, pitchType);
  };

  // Toggle Pitch Type
  const handlePitchTypeToggle = (type: 'full' | 'half') => {
    setPitchType(type);
    resetToFormations(formHome, formAway, type);
  };

  // Set Pieces positioning templates (Balón Parado)
  const applySetPiecePreset = (preset: string) => {
    setIsPlaying(false);
    setIsRecording(false);
    setDrawings([]);
    setEquipment([]);
    setSelectedPlayerId(null);

    const activePlayers = [...players];
    const newBall = { ...ball };

    // Standard positions for set pieces
    if (preset === 'corner_right') {
      newBall.x = 1150;
      newBall.y = 750;

      // Home (attacks right goal)
      const homePositions: Record<number, Position> = {
        1: { x: 150, y: centerY }, // GK
        2: { x: 750, y: 220 }, // DEF back
        3: { x: 750, y: 580 }, // DEF back
        4: { x: 920, y: centerY }, // MID box edge
        5: { x: 980, y: centerY - 150 }, // MID
        6: { x: 1040, y: centerY - 80 }, // FWD box
        7: { x: 1050, y: centerY + 80 }, // FWD box
        8: { x: 1080, y: centerY - 20 }, // FWD box
        9: { x: 1090, y: centerY + 30 }, // FWD box
        10: { x: 1010, y: centerY + 180 }, // FWD box edge
        11: { x: 1140, y: 710 } // Kicker
      };

      // Away (defends right goal)
      const awayPositions: Record<number, Position> = {
        1: { x: 1130, y: centerY }, // GK
        2: { x: 1120, y: centerY - 40 }, // DEF marking
        3: { x: 1120, y: centerY + 40 }, // DEF marking
        4: { x: 1085, y: centerY - 30 }, // DEF
        5: { x: 1095, y: centerY + 25 }, // DEF
        6: { x: 1050, y: centerY - 95 }, // DEF
        7: { x: 1060, y: centerY + 95 }, // DEF
        8: { x: 1025, y: centerY - 145 }, // MID
        9: { x: 1020, y: centerY + 175 }, // MID
        10: { x: 930, y: centerY }, // MID marking edge
        11: { x: 800, y: centerY } // FWD counter
      };

      activePlayers.forEach(p => {
        const coords = p.team === 'home' ? homePositions[p.number] : awayPositions[p.number];
        if (coords) {
          p.x = coords.x;
          p.y = coords.y;
        }
      });
    } else if (preset === 'corner_left') {
      newBall.x = 1150;
      newBall.y = 50;

      // Home (attacks right goal)
      const homePositions: Record<number, Position> = {
        1: { x: 150, y: centerY },
        2: { x: 750, y: 220 },
        3: { x: 750, y: 580 },
        4: { x: 920, y: centerY },
        5: { x: 980, y: centerY + 150 },
        6: { x: 1040, y: centerY + 80 },
        7: { x: 1050, y: centerY - 80 },
        8: { x: 1080, y: centerY + 20 },
        9: { x: 1090, y: centerY - 30 },
        10: { x: 1010, y: centerY - 180 },
        11: { x: 1140, y: 90 } // Kicker
      };

      // Away (defends right goal)
      const awayPositions: Record<number, Position> = {
        1: { x: 1130, y: centerY },
        2: { x: 1120, y: centerY + 40 },
        3: { x: 1120, y: centerY - 40 },
        4: { x: 1085, y: centerY + 30 },
        5: { x: 1095, y: centerY - 25 },
        6: { x: 1050, y: centerY + 95 },
        7: { x: 1060, y: centerY - 95 },
        8: { x: 1025, y: centerY + 145 },
        9: { x: 1020, y: centerY - 175 },
        10: { x: 930, y: centerY },
        11: { x: 800, y: centerY }
      };

      activePlayers.forEach(p => {
        const coords = p.team === 'home' ? homePositions[p.number] : awayPositions[p.number];
        if (coords) {
          p.x = coords.x;
          p.y = coords.y;
        }
      });
    } else if (preset === 'falta_lateral') {
      newBall.x = 900;
      newBall.y = 120;

      // Home (attacks right goal)
      const homePositions: Record<number, Position> = {
        1: { x: 150, y: centerY },
        2: { x: 650, y: 220 },
        3: { x: 650, y: 580 },
        4: { x: 920, y: centerY - 50 },
        5: { x: 930, y: centerY + 50 },
        6: { x: 980, y: centerY - 100 },
        7: { x: 985, y: centerY + 100 },
        8: { x: 1020, y: centerY - 30 },
        9: { x: 1020, y: centerY + 30 },
        10: { x: 880, y: 150 }, // Support
        11: { x: 890, y: 80 } // Kicker
      };

      // Away (defends right goal)
      const awayPositions: Record<number, Position> = {
        1: { x: 1130, y: centerY },
        2: { x: 975, y: 90 }, // Wall 1
        3: { x: 980, y: 125 }, // Wall 2
        4: { x: 940, y: centerY - 60 }, // Def offside line
        5: { x: 945, y: centerY + 65 },
        6: { x: 950, y: centerY - 10 },
        7: { x: 990, y: centerY - 120 },
        8: { x: 995, y: centerY + 120 },
        9: { x: 1010, y: centerY - 45 },
        10: { x: 1010, y: centerY + 45 },
        11: { x: 820, y: 350 }
      };

      activePlayers.forEach(p => {
        const coords = p.team === 'home' ? homePositions[p.number] : awayPositions[p.number];
        if (coords) {
          p.x = coords.x;
          p.y = coords.y;
        }
      });
    } else if (preset === 'falta_frontal') {
      newBall.x = 880;
      newBall.y = centerY;

      // Home (attacks right goal)
      const homePositions: Record<number, Position> = {
        1: { x: 150, y: centerY },
        2: { x: 650, y: 220 },
        3: { x: 650, y: 580 },
        4: { x: 860, y: centerY - 40 }, // decoy
        5: { x: 940, y: centerY - 130 },
        6: { x: 940, y: centerY + 130 },
        7: { x: 990, y: centerY - 60 },
        8: { x: 990, y: centerY + 60 },
        9: { x: 1030, y: centerY - 20 },
        10: { x: 1030, y: centerY + 20 },
        11: { x: 870, y: centerY + 30 } // kicker
      };

      // Away (defends right goal)
      const awayPositions: Record<number, Position> = {
        1: { x: 1130, y: centerY },
        2: { x: 970, y: centerY - 75 }, // Wall
        3: { x: 970, y: centerY - 38 },
        4: { x: 970, y: centerY },
        5: { x: 970, y: centerY + 38 },
        6: { x: 970, y: centerY + 75 },
        7: { x: 950, y: centerY - 150 }, // Def flank
        8: { x: 950, y: centerY + 150 }, // Def flank
        9: { x: 1000, y: centerY - 80 },
        10: { x: 1000, y: centerY + 80 },
        11: { x: 800, y: centerY }
      };

      activePlayers.forEach(p => {
        const coords = p.team === 'home' ? homePositions[p.number] : awayPositions[p.number];
        if (coords) {
          p.x = coords.x;
          p.y = coords.y;
        }
      });
    } else if (preset === 'penalti') {
      newBall.x = 1040;
      newBall.y = centerY;

      // Home (attacks right goal)
      const homePositions: Record<number, Position> = {
        1: { x: 150, y: centerY },
        2: { x: 800, y: 220 },
        3: { x: 800, y: 580 },
        4: { x: 930, y: centerY - 110 },
        5: { x: 930, y: centerY + 110 },
        6: { x: 950, y: centerY - 200 },
        7: { x: 950, y: centerY + 200 },
        8: { x: 910, y: centerY - 60 },
        9: { x: 1010, y: centerY + 20 }, // Kicker
        10: { x: 910, y: centerY + 60 },
        11: { x: 920, y: centerY }
      };

      // Away (defends right goal)
      const awayPositions: Record<number, Position> = {
        1: { x: 1145, y: centerY }, // GK
        2: { x: 940, y: centerY - 130 },
        3: { x: 940, y: centerY + 130 },
        4: { x: 960, y: centerY - 180 },
        5: { x: 960, y: centerY + 180 },
        6: { x: 935, y: centerY - 80 },
        7: { x: 935, y: centerY + 80 },
        8: { x: 925, y: centerY - 30 },
        9: { x: 925, y: centerY + 30 },
        10: { x: 900, y: centerY - 100 },
        11: { x: 900, y: centerY + 100 }
      };

      activePlayers.forEach(p => {
        const coords = p.team === 'home' ? homePositions[p.number] : awayPositions[p.number];
        if (coords) {
          p.x = coords.x;
          p.y = coords.y;
        }
      });
    }

    setPlayers(activePlayers);
    setBall(newBall);
    setInitialState({
      players: activePlayers.map(p => ({ ...p })),
      ball: newBall,
      drawings: [],
      equipment: []
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

  // Label player with color group (Training mode only)
  const setPlayerColorTag = (tag: 'blue' | 'red' | 'green' | 'orange' | undefined) => {
    if (!selectedPlayerId) return;
    setPlayers(prev =>
      prev.map(p => (p.id === selectedPlayerId ? { ...p, colorTag: tag } : p))
    );
  };

  // Recording ticks
  useEffect(() => {
    if (isRecording) {
      const startTime = Date.now();
      setRecordingFrames([
        {
          timestamp: 0,
          players: playersRef.current.map(p => ({ id: p.id, x: p.x, y: p.y, colorTag: p.colorTag })),
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
            players: playersRef.current.map(p => ({ id: p.id, x: p.x, y: p.y, colorTag: p.colorTag })),
            ball: { ...ballRef.current },
            equipment: equipmentRef.current.map(e => ({ ...e }))
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
              if (pf) {
                const tagColor = pf.colorTag as 'blue' | 'red' | 'green' | 'orange' | undefined;
                return { ...p, x: pf.x, y: pf.y, colorTag: tagColor };
              }
              return p;
            })
          );
          setBall({ ...lastFrame.ball });
          if (lastFrame.equipment) {
            setEquipment(lastFrame.equipment.map(e => ({ ...e })));
          }
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
                const tagColor = p2.colorTag as 'blue' | 'red' | 'green' | 'orange' | undefined;
                return {
                  ...p,
                  x: p1.x + (p2.x - p1.x) * ratio,
                  y: p1.y + (p2.y - p1.y) * ratio,
                  colorTag: tagColor
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

          // Interpolate equipment positions
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

  // Dragging state
  const [draggingItem, setDraggingItem] = useState<{
    type: 'player' | 'ball' | 'equipment';
    id?: string;
  } | null>(null);

  // Field Drawing Utility
  const drawPitch = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#111622'; // Outside margins
    ctx.fillRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);

    if (pitchType === 'full') {
      // Grass Stripes
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

      // Pitch Boundary
      ctx.strokeRect(MARGIN, MARGIN, PLAY_WIDTH, PLAY_HEIGHT);

      // Midfield Line
      ctx.beginPath();
      ctx.moveTo(PITCH_WIDTH / 2, MARGIN);
      ctx.lineTo(PITCH_WIDTH / 2, PITCH_HEIGHT - MARGIN);
      ctx.stroke();

      // Center Circle
      ctx.beginPath();
      ctx.arc(PITCH_WIDTH / 2, centerY, 90, 0, 2 * Math.PI);
      ctx.stroke();

      // Center Spot
      ctx.beginPath();
      ctx.fillStyle = '#ffffff';
      ctx.arc(PITCH_WIDTH / 2, centerY, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Penalty Areas
      ctx.strokeRect(MARGIN, centerY - 200, 165, 400);
      ctx.strokeRect(PITCH_WIDTH - MARGIN - 165, centerY - 200, 165, 400);

      // Goal Areas
      ctx.strokeRect(MARGIN, centerY - 90, 55, 180);
      ctx.strokeRect(PITCH_WIDTH - MARGIN - 55, centerY - 90, 55, 180);

      // Penalty Spots
      ctx.beginPath();
      ctx.arc(MARGIN + 120, centerY, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(PITCH_WIDTH - MARGIN - 120, centerY, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Penalty Arcs
      const arcAngle = Math.acos(55 / 90);
      ctx.beginPath();
      ctx.arc(MARGIN + 120, centerY, 90, -arcAngle, arcAngle);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(PITCH_WIDTH - MARGIN - 120, centerY, 90, Math.PI - arcAngle, Math.PI + arcAngle);
      ctx.stroke();

      // Corners
      ctx.beginPath(); ctx.arc(MARGIN, MARGIN, 15, 0, 0.5 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(MARGIN, PITCH_HEIGHT - MARGIN, 15, 1.5 * Math.PI, 2 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(PITCH_WIDTH - MARGIN, MARGIN, 15, 0.5 * Math.PI, Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(PITCH_WIDTH - MARGIN, PITCH_HEIGHT - MARGIN, 15, Math.PI, 1.5 * Math.PI); ctx.stroke();

      // Goals
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(MARGIN - 30, centerY - 38, 30, 76);
      ctx.strokeRect(PITCH_WIDTH - MARGIN, centerY - 38, 30, 76);

      // Goal Nets
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
      // Stretches left-half pitch
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

      // Pitch boundary
      ctx.strokeRect(MARGIN, MARGIN, PLAY_WIDTH, PLAY_HEIGHT);

      // Penalty Area
      ctx.strokeRect(MARGIN, centerY - 280, 330, 560);

      // Goal Area
      ctx.strokeRect(MARGIN, centerY - 120, 110, 240);

      // Penalty Spot
      ctx.beginPath();
      ctx.arc(MARGIN + 240, centerY, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Penalty Arc (centered at spot with radius 180)
      const arcAngle = Math.acos(90 / 180);
      ctx.beginPath();
      ctx.arc(MARGIN + 240, centerY, 180, -arcAngle, arcAngle);
      ctx.stroke();

      // Midfield line circle (centered at x = 1150, radius 180)
      ctx.beginPath();
      ctx.arc(PITCH_WIDTH - MARGIN, centerY, 180, 0.5 * Math.PI, 1.5 * Math.PI);
      ctx.stroke();

      // Midfield spot
      ctx.beginPath();
      ctx.arc(PITCH_WIDTH - MARGIN, centerY, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Corners (left side only)
      ctx.beginPath(); ctx.arc(MARGIN, MARGIN, 25, 0, 0.5 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(MARGIN, PITCH_HEIGHT - MARGIN, 25, 1.5 * Math.PI, 2 * Math.PI); ctx.stroke();

      // Goal
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(MARGIN - 40, centerY - 50, 40, 100);

      // Goal net
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
  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw Field
    drawPitch(ctx);

    // 2. Draw Completed Drawings
    drawings.forEach(item => {
      ctx.strokeStyle = item.color;
      ctx.fillStyle = item.color;
      ctx.lineWidth = item.thickness;
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
      }
    });

    // 3. Draw Active Drawing
    if (activeDrawing) {
      ctx.strokeStyle = activeDrawing.color;
      ctx.fillStyle = activeDrawing.color;
      ctx.lineWidth = activeDrawing.thickness;
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
      }
    }

    // 4. Draw Equipment (cones, small goals, hoops, poles)
    equipment.forEach(item => {
      const isSelected = draggingItem?.type === 'equipment' && draggingItem?.id === item.id;
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(item.x, item.y, 22, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fill();
      }

      if (item.type === 'cone') {
        // Orange Cone
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
        // Small Goal (grey outline facing pitch)
        ctx.fillStyle = 'rgba(100, 116, 139, 0.4)';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.rect(item.x - 18, item.y - 12, 36, 24);
        ctx.fill();
        ctx.stroke();
        
        // Nets inside small goal
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(item.x - 6, item.y - 12); ctx.lineTo(item.x - 6, item.y + 12);
        ctx.moveTo(item.x + 6, item.y - 12); ctx.lineTo(item.x + 6, item.y + 12);
        ctx.moveTo(item.x - 18, item.y - 4); ctx.lineTo(item.x + 18, item.y - 4);
        ctx.moveTo(item.x - 18, item.y + 4); ctx.lineTo(item.x + 18, item.y + 4);
        ctx.stroke();
      } else if (item.type === 'pole') {
        // Pole (Pica) - red pole, yellow flag
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
        // Training Hoop (Aro) - blue hollow circle
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(item.x, item.y, 16, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });

    // 5. Draw Players
    players.forEach(pl => {
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

      if (pl.isGK) {
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.strokeStyle = '#1e2937';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#1e2937';
      } else {
        // Color tags override team colors
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
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
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
  }, [players, ball, drawings, activeDrawing, draggingItem, selectedPlayerId, pitchType, equipment]);

  // Redraw hook
  useEffect(() => {
    drawAll();
  }, [drawAll]);

  // Pointer event listeners
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
      // 1. Collision with ball
      const distBall = Math.hypot(x - ball.x, y - ball.y);
      if (distBall <= BALL_RADIUS + 12) {
        setDraggingItem({ type: 'ball' });
        setSelectedPlayerId(null);
        return;
      }

      // 2. Collision with players
      for (let i = players.length - 1; i >= 0; i--) {
        const pl = players[i];
        const dist = Math.hypot(x - pl.x, y - pl.y);
        if (dist <= PLAYER_RADIUS + 10) {
          setDraggingItem({ type: 'player', id: pl.id });
          setSelectedPlayerId(pl.id);
          return;
        }
      }

      // 3. Collision with equipment (Training mode only)
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

      // Clicking empty space deselects player
      setSelectedPlayerId(null);
    } else {
      // Drawing Mode
      const pt = { x, y };
      if (toolMode === 'freehand') {
        setActiveDrawing({ type: 'freehand', color: drawingColor, thickness: drawingThickness, points: [pt] });
      } else if (toolMode === 'line') {
        setActiveDrawing({ type: 'line', color: drawingColor, thickness: drawingThickness, start: pt, end: pt });
      } else if (toolMode === 'arrow') {
        setActiveDrawing({ type: 'arrow', color: drawingColor, thickness: drawingThickness, start: pt, end: pt });
      } else if (toolMode === 'circle') {
        setActiveDrawing({ type: 'circle', color: drawingColor, thickness: drawingThickness, center: pt, radius: 0 });
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

    // Constraint positions
    const cx = Math.max(0, Math.min(canvas.width, x));
    const cy = Math.max(0, Math.min(canvas.height, y));

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
      } else if (activeDrawing.type === 'line' || activeDrawing.type === 'arrow') {
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
      setRecordingFrames([]);
      setInitialState({
        players: players.map(p => ({ ...p })),
        ball: { ...ball },
        drawings: drawings.map(d => ({ ...d })),
        equipment: equipment.map(e => ({ ...e }))
      });
      setIsRecording(true);
    }
  };

  const handlePlayToggle = () => {
    if (isRecording || recordingFrames.length === 0) return;

    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (initialState) {
        setPlayers(initialState.players.map(p => ({ ...p })));
        setBall({ ...initialState.ball });
        setEquipment(initialState.equipment.map(e => ({ ...e })));
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
      setEquipment(initialState.equipment.map(e => ({ ...e })));
    } else {
      resetToFormations(formHome, formAway, pitchType);
    }
  };

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
      // Create serialized state structure
      const stateObj = {
        players: players.map(pl => ({ id: pl.id, team: pl.team, number: pl.number, isGK: pl.isGK, x: Math.round(pl.x), y: Math.round(pl.y), colorTag: pl.colorTag })),
        ball: { x: Math.round(ball.x), y: Math.round(ball.y) },
        drawings: drawings.map(dr => {
          if (dr.type === 'freehand') {
            return { t: 'f', c: dr.color, th: dr.thickness, pts: dr.points.map(pt => [Math.round(pt.x), Math.round(pt.y)]) };
          } else if (dr.type === 'circle') {
            return { t: 'c', c: dr.color, th: dr.thickness, cx: Math.round(dr.center.x), cy: Math.round(dr.center.y), r: Math.round(dr.radius) };
          } else {
            return { t: dr.type === 'arrow' ? 'a' : 'l', c: dr.color, th: dr.thickness, sx: Math.round(dr.start.x), sy: Math.round(dr.start.y), ex: Math.round(dr.end.x), ey: Math.round(dr.end.y) };
          }
        }),
        pitchType,
        equipment: equipment.map(e => ({ id: e.id, type: e.type, x: Math.round(e.x), y: Math.round(e.y) }))
      };
      
      const code = btoa(JSON.stringify(stateObj));
      const url = `${window.location.origin}${window.location.pathname}?state=${encodeURIComponent(code)}&sec=${mode}`;
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy share link', e);
    }
  };

  // Save to Library Trigger
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
        thumbnail
      });
      setSaveName('');
      setShowSaveModal(false);
    }
  };

  return (
    <div className="tactical-container">
      {/* 1. CONTROL PANELS */}
      <div className="toolbar glassmorphic">
        {/* Formations & Field Types */}
        <div className="toolbar-section">
          {mode === 'entrenamiento' && (
            <div className="select-wrapper">
              <span className="select-label">Tipo de Campo</span>
              <div className="tool-group">
                <button
                  onClick={() => handlePitchTypeToggle('full')}
                  className={`tool-btn ${pitchType === 'full' ? 'active' : ''}`}
                >
                  Completo
                </button>
                <button
                  onClick={() => handlePitchTypeToggle('half')}
                  className={`tool-btn ${pitchType === 'half' ? 'active' : ''}`}
                >
                  Medio Campo
                </button>
              </div>
            </div>
          )}

          {mode !== 'entrenamiento' && (
            <>
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
                  <option value="5-3-2">5-3-2</option>
                </select>
              </div>

              {pitchType === 'full' && (
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
                    <option value="5-3-2">5-3-2</option>
                  </select>
                </div>
              )}
            </>
          )}

          {/* Set Pieces Specific Buttons */}
          {mode === 'parado' && (
            <div className="select-wrapper">
              <span className="select-label">Jugadas Predefinidas</span>
              <div className="tool-group flex-wrap">
                <button onClick={() => applySetPiecePreset('corner_right')} className="tool-btn small-btn" title="Córner Derecho">Córner Der.</button>
                <button onClick={() => applySetPiecePreset('corner_left')} className="tool-btn small-btn" title="Córner Izquierdo">Córner Izq.</button>
                <button onClick={() => applySetPiecePreset('falta_lateral')} className="tool-btn small-btn" title="Falta Lateral">Falta Lat.</button>
                <button onClick={() => applySetPiecePreset('falta_frontal')} className="tool-btn small-btn" title="Falta Frontal">Falta Front.</button>
                <button onClick={() => applySetPiecePreset('penalti')} className="tool-btn small-btn" title="Penalti">Penalti</button>
              </div>
            </div>
          )}
        </div>

        {/* Drawing Tools */}
        <div className="toolbar-section divider">
          <div className="tool-group">
            <button
              onClick={() => setToolMode('move')}
              className={`tool-btn ${toolMode === 'move' ? 'active' : ''}`}
              title="Mover"
              disabled={isPlaying}
            >
              <MousePointer size={18} />
            </button>
            <button
              onClick={() => setToolMode('arrow')}
              className={`tool-btn ${toolMode === 'arrow' ? 'active' : ''}`}
              title="Flecha"
              disabled={isPlaying}
            >
              <ArrowUpRight size={18} />
            </button>
            <button
              onClick={() => setToolMode('freehand')}
              className={`tool-btn ${toolMode === 'freehand' ? 'active' : ''}`}
              title="Lápiz"
              disabled={isPlaying}
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => setToolMode('line')}
              className={`tool-btn ${toolMode === 'line' ? 'active' : ''}`}
              title="Línea Recta"
              disabled={isPlaying}
            >
              <Slash size={16} />
            </button>
            <button
              onClick={() => setToolMode('circle')}
              className={`tool-btn ${toolMode === 'circle' ? 'active' : ''}`}
              title="Círculo"
              disabled={isPlaying}
            >
              <Compass size={16} />
            </button>
          </div>

          {/* Color & Size select */}
          {toolMode !== 'move' && (
            <div className="drawing-props-panel">
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
                />
              </div>

              <div className="thickness-control">
                <input
                  type="range"
                  min="2"
                  max="12"
                  step="2"
                  value={drawingThickness}
                  onChange={e => setDrawingThickness(parseInt(e.target.value))}
                  className="custom-range"
                  title={`Grosor: ${drawingThickness}px`}
                />
                <span className="thickness-indicator">{drawingThickness}px</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setDrawings([])}
            className="tool-btn danger"
            title="Limpiar dibujos"
            disabled={isPlaying}
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Rec, Reset, PNG, Save & Share */}
        <div className="toolbar-section divider">
          <div className="rec-group">
            <button
              onClick={handleRecordToggle}
              className={`rec-btn ${isRecording ? 'recording' : ''}`}
              title={isRecording ? 'Parar' : 'Grabar'}
              disabled={isPlaying}
            >
              <Video size={16} className={isRecording ? 'pulse' : ''} />
              <span>{isRecording ? 'Grabando' : 'Grabar'}</span>
            </button>

            <button
              onClick={handlePlayToggle}
              className={`play-btn ${isPlaying ? 'playing' : ''}`}
              disabled={isRecording || recordingFrames.length === 0}
            >
              <Play size={16} />
              <span>{isPlaying ? 'Parar' : 'Play'}</span>
            </button>

            <button
              onClick={handleReset}
              className="tool-btn text-muted"
              title="Restablecer posiciones"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <div className="action-group">
            <button onClick={handleExportPNG} className="action-btn" title="Descargar PNG">
              <Download size={16} />
              <span>PNG</span>
            </button>

            <button
              onClick={handleShare}
              className={`action-btn ${shareCopied ? 'success' : ''}`}
              title="Copiar enlace Base64"
            >
              {shareCopied ? <Check size={16} /> : <Share2 size={16} />}
              <span>{shareCopied ? '¡Enlace!' : 'Compartir'}</span>
            </button>

            {onSave && (
              <button
                onClick={() => setShowSaveModal(true)}
                className="action-btn primary-btn"
                title="Guardar en Biblioteca"
              >
                <Plus size={16} />
                <span>Guardar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. SUB BAR FOR TRAINING ELEMENTS & COLOR TAGGING */}
      {(mode === 'entrenamiento' || selectedPlayerId) && (
        <div className="toolbar sub-toolbar glassmorphic">
          {mode === 'entrenamiento' && (
            <div className="toolbar-section">
              <span className="select-label">Accesorios de Entrenamiento:</span>
              <div className="tool-group">
                <button onClick={() => addEquipmentItem('cone')} className="tool-btn item-spawn-btn orange-border">
                  <span className="cone-dot orange-bg" /> Cono
                </button>
                <button onClick={() => addEquipmentItem('goal')} className="tool-btn item-spawn-btn grey-border">
                  <span className="goal-dot grey-bg" /> Mini Portería
                </button>
                <button onClick={() => addEquipmentItem('pole')} className="tool-btn item-spawn-btn red-border">
                  <span className="pole-dot red-bg" /> Pica
                </button>
                <button onClick={() => addEquipmentItem('hoop')} className="tool-btn item-spawn-btn blue-border">
                  <span className="hoop-dot blue-bg" /> Aro
                </button>
              </div>
            </div>
          )}

          {selectedPlayerId && (
            <div className="toolbar-section ml-auto">
              <span className="select-label">Etiquetar Jugador Seleccionado:</span>
              <div className="tool-group">
                <button onClick={() => setPlayerColorTag('blue')} className="color-tag-btn tag-blue" title="Grupo Azul" />
                <button onClick={() => setPlayerColorTag('red')} className="color-tag-btn tag-red" title="Grupo Rojo" />
                <button onClick={() => setPlayerColorTag('green')} className="color-tag-btn tag-green" title="Grupo Verde" />
                <button onClick={() => setPlayerColorTag('orange')} className="color-tag-btn tag-orange" title="Grupo Naranja" />
                <button onClick={() => setPlayerColorTag(undefined)} className="color-tag-btn tag-clear" title="Quitar Etiqueta" style={{ backgroundColor: '#2d3748' }}>✕</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. CANVAS WRAPPER */}
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

      {/* 4. MODAL: SAVE TO LIBRARY */}
      {showSaveModal && (
        <div className="modal-overlay">
          <div className="modal-card glassmorphic">
            <h3 className="modal-title">Guardar Jugada</h3>
            <p className="modal-subtitle">Introduce un nombre descriptivo para guardar esta táctica en tu Biblioteca.</p>
            <input
              type="text"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="Ej: Salida de presión 4-3-3"
              className="modal-input"
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setShowSaveModal(false)} className="tool-btn">
                Cancelar
              </button>
              <button
                onClick={handleSaveToLibrary}
                className="action-btn primary-btn"
                disabled={!saveName.trim()}
              >
                Confirmar Guardado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
