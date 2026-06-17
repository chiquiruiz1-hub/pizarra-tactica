'use client';

import React, { useEffect, useState } from 'react';
import { PlayCategory, SavedPlay } from '../app/page';
import {
  Layers,
  Compass,
  Video,
  FolderOpen,
  Monitor,
  Plus,
  Play,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';

interface DashboardHomeProps {
  onNavigate: (section: string) => void;
  onEditPlay: (play: SavedPlay) => void;
}

export default function DashboardHome({ onNavigate, onEditPlay }: DashboardHomeProps) {
  const [stats, setStats] = useState({ tactica: 0, parado: 0, entrenamiento: 0, total: 0 });
  const [recentPlays, setRecentPlays] = useState<SavedPlay[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pizarrapro_plays');
      if (saved) {
        const plays: SavedPlay[] = JSON.parse(saved);
        const tCount = plays.filter(p => p.category === 'Táctica').length;
        const pCount = plays.filter(p => p.category === 'Balón parado').length;
        const eCount = plays.filter(p => p.category === 'Entrenamiento').length;
        setStats({
          tactica: tCount,
          parado: pCount,
          entrenamiento: eCount,
          total: plays.length
        });

        // Sorted by date descending, take top 4
        const sorted = [...plays].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentPlays(sorted.slice(0, 4));
      }
    } catch (e) {
      console.error('Failed to load stats/recent plays', e);
    }
  }, []);

  return (
    <div className="dashboard-grid">
      {/* LEFT COLUMN: Shortcuts and Stats */}
      <div className="dashboard-column gap-6">
        {/* Welcome Card */}
        <div className="welcome-card glassmorphic">
          <div className="welcome-content">
            <h2 className="welcome-title font-gradient">Bienvenido a PizarraPro</h2>
            <p className="welcome-text text-muted">
              La plataforma táctica definitiva para entrenadores y preparadores. Diseña tácticas, ensaya balón parado y crea sesiones de entrenamiento.
            </p>
          </div>
          <div className="welcome-action">
            <button onClick={() => onNavigate('tactica')} className="action-btn primary-btn flex-center">
              Nueva Táctica <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="dashboard-row gap-4">
          <div className="stat-card glassmorphic" onClick={() => onNavigate('biblioteca')}>
            <div className="stat-header">
              <span className="stat-icon-wrapper blue-bg">
                <Layers size={18} className="text-blue" />
              </span>
              <span className="stat-label">Tácticas</span>
            </div>
            <div className="stat-value">{stats.tactica}</div>
          </div>

          <div className="stat-card glassmorphic" onClick={() => onNavigate('biblioteca')}>
            <div className="stat-header">
              <span className="stat-icon-wrapper yellow-bg">
                <Compass size={18} className="text-yellow" />
              </span>
              <span className="stat-label">Balón Parado</span>
            </div>
            <div className="stat-value">{stats.parado}</div>
          </div>

          <div className="stat-card glassmorphic" onClick={() => onNavigate('biblioteca')}>
            <div className="stat-header">
              <span className="stat-icon-wrapper orange-bg">
                <Video size={18} className="text-orange" />
              </span>
              <span className="stat-label">Entrenamiento</span>
            </div>
            <div className="stat-value">{stats.entrenamiento}</div>
          </div>
        </div>

        {/* Quick Shortcuts */}
        <div className="shortcuts-panel glassmorphic">
          <h3 className="section-title">Accesos Directos</h3>
          <div className="shortcuts-grid">
            <button onClick={() => onNavigate('tactica')} className="shortcut-item">
              <span className="shortcut-icon blue-bg">
                <Layers size={20} className="text-blue" />
              </span>
              <span className="shortcut-name">Pizarra Táctica</span>
            </button>

            <button onClick={() => onNavigate('parado')} className="shortcut-item">
              <span className="shortcut-icon yellow-bg">
                <Compass size={20} className="text-yellow" />
              </span>
              <span className="shortcut-name">Balón Parado</span>
            </button>

            <button onClick={() => onNavigate('entrenamiento')} className="shortcut-item">
              <span className="shortcut-icon orange-bg">
                <Video size={20} className="text-orange" />
              </span>
              <span className="shortcut-name">Sesión de Entrenamiento</span>
            </button>

            <button onClick={() => onNavigate('biblioteca')} className="shortcut-item">
              <span className="shortcut-icon green-bg">
                <FolderOpen size={20} className="text-green" />
              </span>
              <span className="shortcut-name">Biblioteca</span>
            </button>

            <button onClick={() => onNavigate('presentacion')} className="shortcut-item">
              <span className="shortcut-icon red-bg">
                <Monitor size={20} className="text-red" />
              </span>
              <span className="shortcut-name">Modo Presentación</span>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Recent Plays */}
      <div className="dashboard-column gap-6">
        <div className="recent-plays-panel glassmorphic">
          <div className="panel-header">
            <h3 className="section-title flex-center gap-2">
              <Clock size={18} className="text-muted" /> Últimas Jugadas
            </h3>
            <button onClick={() => onNavigate('biblioteca')} className="text-btn">
              Ver biblioteca
            </button>
          </div>

          <div className="recent-plays-list">
            {recentPlays.length === 0 ? (
              <div className="empty-recent-state">
                <p className="text-muted">No tienes jugadas guardadas.</p>
                <button onClick={() => onNavigate('tactica')} className="action-btn text-muted mt-2 border-dashed">
                  Crear mi primera táctica
                </button>
              </div>
            ) : (
              recentPlays.map(play => (
                <div key={play.id} className="recent-play-card" onClick={() => onEditPlay(play)}>
                  <div className="play-preview">
                    {play.thumbnail ? (
                      <img src={play.thumbnail} alt={play.name} className="play-thumbnail-img" />
                    ) : (
                      <div className="play-thumbnail-placeholder">
                        ⚽
                      </div>
                    )}
                  </div>
                  <div className="play-details">
                    <h4 className="play-card-name">{play.name}</h4>
                    <div className="play-card-meta">
                      <span className={`badge ${play.category === 'Táctica' ? 'badge-blue' : play.category === 'Balón parado' ? 'badge-yellow' : 'badge-orange'}`}>
                        {play.category}
                      </span>
                      <span className="play-card-date">
                        {new Date(play.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                  <button className="recent-play-edit-btn" title="Cargar Jugada">
                    <Play size={14} fill="currentColor" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Small stats helper */}
        <div className="stats-indicator-card glassmorphic flex-center gap-4">
          <TrendingUp size={24} className="text-green" />
          <div className="flex-col">
            <span className="indicator-number font-gradient">{stats.total} jugadas</span>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Guardadas localmente en este navegador</span>
          </div>
        </div>
      </div>
    </div>
  );
}
