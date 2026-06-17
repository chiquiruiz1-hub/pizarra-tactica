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
  Clock,
  Zap,
  Target,
  BarChart2
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
      {/* ─── LEFT COLUMN ────────────────────────────────────────── */}
      <div className="dashboard-column gap-6">

        {/* Welcome Card — polished banner */}
        <div className="welcome-card glassmorphic">
          <div className="welcome-content">
            <h2 className="welcome-title font-gradient">Bienvenido a PizarraPro</h2>
            <p className="welcome-text text-muted">
              La plataforma táctica definitiva para entrenadores y preparadores. Diseña tácticas, ensaya balón parado y crea sesiones de entrenamiento.
            </p>
          </div>
          <div className="welcome-action">
            {/* ① Improvement 4 — heavier, semibold button */}
            <button
              onClick={() => onNavigate('tactica')}
              className="action-btn primary-btn flex-center"
              style={{ fontWeight: 600, paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', gap: '0.4rem' }}
            >
              Nueva Táctica <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* ─── Stats Grid — Improvement 2 ──────────────────────── */}
        <div className="dashboard-row gap-4">

          {/* Tácticas */}
          <div
            onClick={() => onNavigate('biblioteca')}
            style={{
              flex: 1, cursor: 'pointer', borderRadius: 14,
              padding: '1.1rem 1rem',
              background: 'rgba(30, 41, 59, 0.45)',
              border: '1px solid rgba(59,130,246,0.2)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.5rem',
              transition: 'border-color 0.2s, transform 0.2s, background 0.2s'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(59,130,246,0.55)';
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(30,41,59,0.7)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = '';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(59,130,246,0.2)';
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(30,41,59,0.45)';
            }}
          >
            <div className="stat-header">
              <span className="stat-icon-wrapper blue-bg"><Layers size={18} className="text-blue" /></span>
              <span className="stat-label">Tácticas</span>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1, color: '#f8fafc', letterSpacing: '-0.03em' }}>
              {stats.tactica}
            </div>
          </div>

          {/* Balón Parado */}
          <div
            onClick={() => onNavigate('biblioteca')}
            style={{
              flex: 1, cursor: 'pointer', borderRadius: 14,
              padding: '1.1rem 1rem',
              background: 'rgba(30, 41, 59, 0.45)',
              border: '1px solid rgba(251,191,36,0.2)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.5rem',
              transition: 'border-color 0.2s, transform 0.2s, background 0.2s'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(251,191,36,0.55)';
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(30,41,59,0.7)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = '';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(251,191,36,0.2)';
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(30,41,59,0.45)';
            }}
          >
            <div className="stat-header">
              <span className="stat-icon-wrapper yellow-bg"><Compass size={18} className="text-yellow" /></span>
              <span className="stat-label">Balón Parado</span>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1, color: '#f8fafc', letterSpacing: '-0.03em' }}>
              {stats.parado}
            </div>
          </div>

          {/* Entrenamiento */}
          <div
            onClick={() => onNavigate('biblioteca')}
            style={{
              flex: 1, cursor: 'pointer', borderRadius: 14,
              padding: '1.1rem 1rem',
              background: 'rgba(30, 41, 59, 0.45)',
              border: '1px solid rgba(249,115,22,0.2)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.5rem',
              transition: 'border-color 0.2s, transform 0.2s, background 0.2s'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(249,115,22,0.55)';
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(30,41,59,0.7)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = '';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(249,115,22,0.2)';
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(30,41,59,0.45)';
            }}
          >
            <div className="stat-header">
              <span className="stat-icon-wrapper orange-bg"><Video size={18} className="text-orange" /></span>
              <span className="stat-label">Entrenamiento</span>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1, color: '#f8fafc', letterSpacing: '-0.03em' }}>
              {stats.entrenamiento}
            </div>
          </div>

        </div>

        {/* ─── Quick Shortcuts — Improvement 3 ─────────────────── */}
        <div className="shortcuts-panel glassmorphic">
          <h3 className="section-title">Accesos Directos</h3>
          <div className="shortcuts-grid">

            <button
              onClick={() => onNavigate('tactica')}
              style={{
                background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(59,130,246,0.18)',
                borderRadius: 12, padding: '1.1rem 0.75rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
                cursor: 'pointer', transition: 'all 0.2s ease', color: 'inherit'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(30,41,59,0.7)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(59,130,246,0.5)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(15,23,42,0.4)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(59,130,246,0.18)';
                (e.currentTarget as HTMLButtonElement).style.transform = '';
              }}
            >
              <span className="shortcut-icon blue-bg"><Layers size={20} className="text-blue" /></span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, textAlign: 'center', color: '#cbd5e1' }}>Pizarra Táctica</span>
            </button>

            <button
              onClick={() => onNavigate('parado')}
              style={{
                background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(251,191,36,0.18)',
                borderRadius: 12, padding: '1.1rem 0.75rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
                cursor: 'pointer', transition: 'all 0.2s ease', color: 'inherit'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(30,41,59,0.7)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(251,191,36,0.5)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(15,23,42,0.4)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(251,191,36,0.18)';
                (e.currentTarget as HTMLButtonElement).style.transform = '';
              }}
            >
              <span className="shortcut-icon yellow-bg"><Compass size={20} className="text-yellow" /></span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, textAlign: 'center', color: '#cbd5e1' }}>Balón Parado</span>
            </button>

            <button
              onClick={() => onNavigate('entrenamiento')}
              style={{
                background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(249,115,22,0.18)',
                borderRadius: 12, padding: '1.1rem 0.75rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
                cursor: 'pointer', transition: 'all 0.2s ease', color: 'inherit'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(30,41,59,0.7)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(249,115,22,0.5)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(15,23,42,0.4)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(249,115,22,0.18)';
                (e.currentTarget as HTMLButtonElement).style.transform = '';
              }}
            >
              <span className="shortcut-icon orange-bg"><Video size={20} className="text-orange" /></span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, textAlign: 'center', color: '#cbd5e1' }}>Entrenamiento</span>
            </button>

            <button
              onClick={() => onNavigate('biblioteca')}
              style={{
                background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(16,185,129,0.18)',
                borderRadius: 12, padding: '1.1rem 0.75rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
                cursor: 'pointer', transition: 'all 0.2s ease', color: 'inherit'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(30,41,59,0.7)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.5)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(15,23,42,0.4)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.18)';
                (e.currentTarget as HTMLButtonElement).style.transform = '';
              }}
            >
              <span className="shortcut-icon green-bg"><FolderOpen size={20} className="text-green" /></span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, textAlign: 'center', color: '#cbd5e1' }}>Biblioteca</span>
            </button>

            <button
              onClick={() => onNavigate('presentacion')}
              style={{
                background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(239,68,68,0.18)',
                borderRadius: 12, padding: '1.1rem 0.75rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
                cursor: 'pointer', transition: 'all 0.2s ease', color: 'inherit'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(30,41,59,0.7)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.5)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(15,23,42,0.4)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.18)';
                (e.currentTarget as HTMLButtonElement).style.transform = '';
              }}
            >
              <span className="shortcut-icon red-bg"><Monitor size={20} className="text-red" /></span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, textAlign: 'center', color: '#cbd5e1' }}>Presentación</span>
            </button>

          </div>
        </div>
      </div>

      {/* ─── RIGHT COLUMN: Recent Plays ─────────────────────────── */}
      <div className="dashboard-column gap-6">
        <div className="recent-plays-panel glassmorphic">

          {/* Panel header — Improvement 1: styled "Ver biblioteca" button */}
          <div className="panel-header">
            <h3 className="section-title flex-center gap-2">
              <Clock size={18} className="text-muted" /> Últimas Jugadas
            </h3>
            {/* ① Modern "Ver biblioteca" button */}
            <button
              onClick={() => onNavigate('biblioteca')}
              style={{
                background: 'rgba(30,41,59,0.7)',
                border: '1px solid rgba(100,116,139,0.35)',
                color: '#94a3b8',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '0.35rem 0.75rem',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.02em'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(51,65,85,0.85)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(148,163,184,0.5)';
                (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(30,41,59,0.7)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(100,116,139,0.35)';
                (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
              }}
            >
              Ver biblioteca →
            </button>
          </div>

          <div className="recent-plays-list">
            {recentPlays.length === 0 ? (
              <div className="empty-recent-state">
                <p className="text-muted">No tienes jugadas guardadas.</p>

                {/* ① Modern "Crear mi primera táctica" button */}
                <button
                  onClick={() => onNavigate('tactica')}
                  style={{
                    marginTop: '0.75rem',
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px dashed rgba(16,185,129,0.4)',
                    color: '#34d399',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    padding: '0.5rem 1.25rem',
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.18)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.65)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.1)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.4)';
                  }}
                >
                  <Plus size={14} />
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
                      <div className="play-thumbnail-placeholder">⚽</div>
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

        {/* Small stats indicator */}
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
