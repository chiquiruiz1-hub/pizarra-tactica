'use client';

import React, { useState, useEffect } from 'react';
import DashboardHome from '../components/DashboardHome';
import TacticalCanvas, { Player, Position, Drawing, EquipmentItem } from '../components/TacticalCanvas';
import LibraryView from '../components/LibraryView';
import PresentationView from '../components/PresentationView';
import VideosSection from '../components/VideosSection';
import ScoutingSection from '../components/ScoutingSection';
import {
  Home,
  Layers,
  Compass,
  Video,
  FolderOpen,
  Monitor,
  Menu,
  X,
  Zap,
  Tv,
  Shield
} from 'lucide-react';

export type PlayCategory = 'Táctica' | 'Balón parado' | 'Entrenamiento';

export interface SavedPlay {
  id: string;
  name: string;
  category: PlayCategory;
  date: string;
  players: Player[];
  ball: Position;
  drawings: Drawing[];
  pitchType: 'full' | 'half';
  equipment: EquipmentItem[];
  thumbnail: string;
  videoUrl?: string;
  backgroundImage?: string;
  trackingKeyframes?: { playerId: string; timestamp: number; x: number; y: number }[];
}

export default function PizarraProApp() {
  const [activeSection, setActiveSection] = useState<string>('inicio');
  const [plays, setPlays] = useState<SavedPlay[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initial play data passed to editor when editing or loading a shared URL state
  const [editorInitialData, setEditorInitialData] = useState<{
    players: Player[];
    ball: Position;
    drawings: Drawing[];
    pitchType: 'full' | 'half';
    equipment: EquipmentItem[];
    backgroundImage?: string;
    videoUrl?: string;
    trackingKeyframes?: { playerId: string; timestamp: number; x: number; y: number }[];
  } | null>(null);

  // Active play ID for presentation mode
  const [presInitialPlayId, setPresInitialPlayId] = useState<string | null>(null);

  // Load from localStorage on mount and parse shared state URL if present
  useEffect(() => {
    // 1. Local Storage
    try {
      const saved = localStorage.getItem('pizarrapro_plays');
      if (saved) {
        setPlays(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load plays from localStorage', e);
    }

    // 2. Shared state URL query
    const params = new URLSearchParams(window.location.search);
    const stateCode = params.get('state');
    const secParam = params.get('sec');

    if (stateCode) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(stateCode)));
        
        // Map compact drawing items back to full structures if needed
        const decodedDrawings = (decoded.drawings || []).map((dr: any) => {
          if (dr.t === 'f') {
            return { type: 'freehand', color: dr.c, thickness: dr.th, points: dr.pts.map((pt: any) => ({ x: pt[0], y: pt[1] })) };
          } else if (dr.t === 'c') {
            return { type: 'circle', color: dr.c, thickness: dr.th, center: { x: dr.cx, y: dr.cy }, radius: dr.r };
          } else if (dr.t === 't') {
            return { type: 'text', color: dr.c, text: dr.txt, position: { x: dr.px, y: dr.py } };
          } else if (dr.t === 'z') {
            return { type: 'zone', color: dr.c, thickness: dr.th, start: { x: dr.sx, y: dr.sy }, end: { x: dr.ex, y: dr.ey } };
          } else {
            return {
              type: dr.t === 'a' ? 'arrow' : 'line',
              color: dr.c,
              thickness: dr.th,
              start: { x: dr.sx, y: dr.sy },
              end: { x: dr.ex, y: dr.ey }
            };
          }
        });

        const loadedPlay = {
          players: decoded.players || [],
          ball: decoded.ball || { x: 600, y: 400 },
          drawings: decodedDrawings,
          pitchType: decoded.pitchType || 'full',
          equipment: decoded.equipment || [],
          backgroundImage: decoded.backgroundImage || '',
          videoUrl: decoded.videoUrl || '',
          trackingKeyframes: decoded.trackingKeyframes || []
        };

        setEditorInitialData(loadedPlay);
        
        // Navigate to appropriate section
        if (secParam === 'tactica' || secParam === 'parado' || secParam === 'entrenamiento' || secParam === 'videos' || secParam === 'rivales') {
          setActiveSection(secParam);
        } else {
          setActiveSection('tactica');
        }

        // Clean query params so refresh starts clean
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch (e) {
        console.error('Failed to decode shared URL state', e);
      }
    }
  }, []);

  // Save play to localStorage
  const handleSavePlay = (name: string, canvasData: any) => {
    let category: PlayCategory = 'Táctica';
    if (activeSection === 'parado') category = 'Balón parado';
    else if (activeSection === 'entrenamiento') category = 'Entrenamiento';

    const newPlay: SavedPlay = {
      id: `play_${Date.now()}`,
      name,
      category,
      date: new Date().toISOString(),
      players: canvasData.players,
      ball: canvasData.ball,
      drawings: canvasData.drawings,
      pitchType: canvasData.pitchType,
      equipment: canvasData.equipment,
      thumbnail: canvasData.thumbnail,
      videoUrl: canvasData.videoUrl,
      backgroundImage: canvasData.backgroundImage,
      trackingKeyframes: canvasData.trackingKeyframes
    };

    const updated = [newPlay, ...plays];
    setPlays(updated);
    localStorage.setItem('pizarrapro_plays', JSON.stringify(updated));

    // Redirect to Library
    setActiveSection('biblioteca');
  };

  // Delete play from localStorage
  const handleDeletePlay = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta jugada de tu biblioteca?')) {
      const updated = plays.filter(p => p.id !== id);
      setPlays(updated);
      localStorage.setItem('pizarrapro_plays', JSON.stringify(updated));
    }
  };

  // Load play to edit
  const handleEditPlay = (play: SavedPlay) => {
    setEditorInitialData({
      players: play.players,
      ball: play.ball,
      drawings: play.drawings,
      pitchType: play.pitchType,
      equipment: play.equipment || [],
      backgroundImage: play.backgroundImage,
      videoUrl: play.videoUrl,
      trackingKeyframes: play.trackingKeyframes || []
    });

    // Determine destination tab
    if (play.videoUrl) {
      setActiveSection('videos');
    } else if (play.category === 'Táctica') {
      setActiveSection('tactica');
    } else if (play.category === 'Balón parado') {
      setActiveSection('parado');
    } else {
      setActiveSection('entrenamiento');
    }
  };

  // Trigger quick load inside presentation mode
  const handleNavigateToPresentation = (playId?: string) => {
    if (playId) {
      setPresInitialPlayId(playId);
    } else {
      setPresInitialPlayId(null);
    }
    setActiveSection('presentacion');
  };

  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'tactica', label: 'Pizarra Táctica', icon: Layers },
    { id: 'parado', label: 'Balón Parado', icon: Compass },
    { id: 'entrenamiento', label: 'Entrenamiento', icon: Video },
    { id: 'videos', label: 'Vídeos', icon: Tv },
    { id: 'rivales', label: 'Rivales', icon: Shield },
    { id: 'biblioteca', label: 'Biblioteca', icon: FolderOpen },
    { id: 'presentacion', label: 'Presentación', icon: Monitor }
  ];

  return (
    <div className="app-container">
      {/* SIDEBAR NAVIGATION */}
      <aside className={`sidebar glassmorphic ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Zap size={22} className="text-green" />
          <span className="brand-name font-gradient">PizarraPro</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => {
            const IconComponent = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                  // Clear editor data when switching tabs (unless going into edit flow)
                  if (item.id === 'tactica' || item.id === 'parado' || item.id === 'entrenamiento' || item.id === 'videos' || item.id === 'rivales') {
                    setEditorInitialData(null);
                  }
                }}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <IconComponent size={20} />
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer text-muted">
          <span>v2.1.0 • PizarraPro</span>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="mobile-header glassmorphic">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mobile-menu-btn">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span className="mobile-brand-title font-gradient">PizarraPro</span>
        <div style={{ width: 24 }} /> {/* balance layout */}
      </header>

      {/* MAIN VIEWPORT */}
      <div className="main-viewport">
        {activeSection === 'inicio' && (
          <div className="view-content fade-in">
            <h1 className="viewport-title font-gradient">Resumen General</h1>
            <DashboardHome
              onNavigate={setActiveSection}
              onEditPlay={handleEditPlay}
            />
          </div>
        )}

        {activeSection === 'tactica' && (
          <div className="view-content fade-in">
            <h1 className="viewport-title font-gradient">Pizarra Táctica</h1>
            <TacticalCanvas
              mode="tactica"
              onSave={handleSavePlay}
              initialPlayData={editorInitialData}
            />
          </div>
        )}

        {activeSection === 'parado' && (
          <div className="view-content fade-in">
            <h1 className="viewport-title font-gradient">Balón Parado</h1>
            <TacticalCanvas
              mode="parado"
              onSave={handleSavePlay}
              initialPlayData={editorInitialData}
            />
          </div>
        )}

        {activeSection === 'entrenamiento' && (
          <div className="view-content fade-in">
            <h1 className="viewport-title font-gradient">Sesiones de Entrenamiento</h1>
            <TacticalCanvas
              mode="entrenamiento"
              onSave={handleSavePlay}
              initialPlayData={editorInitialData}
            />
          </div>
        )}

        {activeSection === 'videos' && (
          <div className="view-content fade-in">
            <h1 className="viewport-title font-gradient">Análisis de Vídeo</h1>
            <VideosSection
              onSave={handleSavePlay}
              initialPlayData={editorInitialData}
            />
          </div>
        )}

        {activeSection === 'rivales' && (
          <div className="view-content fade-in">
            <h1 className="viewport-title font-gradient">Scouting de Rivales</h1>
            <ScoutingSection />
          </div>
        )}

        {activeSection === 'biblioteca' && (
          <div className="view-content fade-in">
            <h1 className="viewport-title font-gradient">Biblioteca de Jugadas</h1>
            <LibraryView
              plays={plays}
              onEditPlay={handleEditPlay}
              onDeletePlay={handleDeletePlay}
            />
          </div>
        )}

        {activeSection === 'presentacion' && (
          <div className="view-content fullscreen-content fade-in">
            <PresentationView
              plays={plays}
              initialPlayId={presInitialPlayId}
              onClose={() => setActiveSection('inicio')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
