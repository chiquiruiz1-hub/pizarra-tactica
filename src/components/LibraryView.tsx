'use client';

import React, { useState } from 'react';
import { SavedPlay } from '../app/page';
import {
  Search,
  Trash2,
  Edit2,
  Download,
  Share2,
  Check,
  Calendar,
  Layers,
  Compass,
  Video
} from 'lucide-react';

interface LibraryViewProps {
  plays: SavedPlay[];
  onEditPlay: (play: SavedPlay) => void;
  onDeletePlay: (id: string) => void;
}

export default function LibraryView({ plays, onEditPlay, onDeletePlay }: LibraryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Táctica' | 'Balón parado' | 'Entrenamiento'>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Serializer for sharing
  const generateShareLink = (play: SavedPlay) => {
    try {
      const stateObj = {
        players: play.players.map(pl => ({ id: pl.id, team: pl.team, number: pl.number, isGK: pl.isGK, x: Math.round(pl.x), y: Math.round(pl.y), colorTag: pl.colorTag })),
        ball: { x: Math.round(play.ball.x), y: Math.round(play.ball.y) },
        drawings: play.drawings.map(dr => {
          if (dr.type === 'freehand') {
            return { t: 'f', c: dr.color, th: dr.thickness, pts: dr.points.map(pt => [Math.round(pt.x), Math.round(pt.y)]) };
          } else if (dr.type === 'circle') {
            return { t: 'c', c: dr.color, th: dr.thickness, cx: Math.round(dr.center.x), cy: Math.round(dr.center.y), r: Math.round(dr.radius) };
          } else {
            return { t: dr.type === 'arrow' ? 'a' : 'l', c: dr.color, th: dr.thickness, sx: Math.round(dr.start.x), sy: Math.round(dr.start.y), ex: Math.round(dr.end.x), ey: Math.round(dr.end.y) };
          }
        }),
        pitchType: play.pitchType,
        equipment: (play.equipment || []).map(e => ({ id: e.id, type: e.type, x: Math.round(e.x), y: Math.round(e.y) }))
      };

      const code = btoa(JSON.stringify(stateObj));
      const sectionParam = play.category === 'Táctica' ? 'tactica' : play.category === 'Balón parado' ? 'parado' : 'entrenamiento';
      const url = `${window.location.origin}${window.location.pathname}?state=${encodeURIComponent(code)}&sec=${sectionParam}`;
      
      navigator.clipboard.writeText(url);
      setCopiedId(play.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error('Failed to share play', e);
    }
  };

  const handleDownloadPNG = (play: SavedPlay) => {
    if (!play.thumbnail) return;
    const link = document.createElement('a');
    link.download = `${play.name}.png`;
    link.href = play.thumbnail;
    link.click();
  };

  const filteredPlays = plays.filter(play => {
    const matchesSearch = play.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || play.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="library-container">
      {/* Search and Filters Header */}
      <div className="library-filters glassmorphic">
        {/* Search */}
        <div className="search-box">
          <Search size={18} className="text-muted" />
          <input
            type="text"
            placeholder="Buscar jugada..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Categories Tabs */}
        <div className="filter-tabs">
          <button
            onClick={() => setCategoryFilter('All')}
            className={`filter-tab-btn ${categoryFilter === 'All' ? 'active' : ''}`}
          >
            Todas
          </button>
          <button
            onClick={() => setCategoryFilter('Táctica')}
            className={`filter-tab-btn ${categoryFilter === 'Táctica' ? 'active' : ''}`}
          >
            Tácticas
          </button>
          <button
            onClick={() => setCategoryFilter('Balón parado')}
            className={`filter-tab-btn ${categoryFilter === 'Balón parado' ? 'active' : ''}`}
          >
            Balón Parado
          </button>
          <button
            onClick={() => setCategoryFilter('Entrenamiento')}
            className={`filter-tab-btn ${categoryFilter === 'Entrenamiento' ? 'active' : ''}`}
          >
            Entrenamiento
          </button>
        </div>
      </div>

      {/* Plays Grid */}
      {filteredPlays.length === 0 ? (
        <div className="empty-library glassmorphic flex-center flex-col">
          <p className="text-muted">No se encontraron jugadas que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className="library-grid">
          {filteredPlays.map(play => (
            <div key={play.id} className="library-card glassmorphic">
              {/* Card Preview */}
              <div className="library-card-preview">
                {play.thumbnail ? (
                  <img src={play.thumbnail} alt={play.name} className="play-thumbnail-img" />
                ) : (
                  <div className="play-thumbnail-placeholder">⚽</div>
                )}
                <div className="category-overlay">
                  <span className={`badge ${play.category === 'Táctica' ? 'badge-blue' : play.category === 'Balón parado' ? 'badge-yellow' : 'badge-orange'}`}>
                    {play.category === 'Táctica' && <Layers size={12} className="inline mr-1" />}
                    {play.category === 'Balón parado' && <Compass size={12} className="inline mr-1" />}
                    {play.category === 'Entrenamiento' && <Video size={12} className="inline mr-1" />}
                    {play.category}
                  </span>
                </div>
              </div>

              {/* Card Description */}
              <div className="library-card-info">
                <h3 className="library-card-title">{play.name}</h3>
                <div className="library-card-date flex-center gap-1">
                  <Calendar size={14} className="text-muted" />
                  <span>{new Date(play.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="library-card-actions">
                <div className="left-actions">
                  <button onClick={() => onEditPlay(play)} className="lib-btn edit-btn" title="Editar Jugada">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => onDeletePlay(play.id)} className="lib-btn delete-btn" title="Eliminar Jugada">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="right-actions">
                  <button onClick={() => handleDownloadPNG(play)} className="lib-btn" title="Descargar PNG">
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => generateShareLink(play)}
                    className={`lib-btn ${copiedId === play.id ? 'success-text' : ''}`}
                    title="Compartir enlace Base64"
                  >
                    {copiedId === play.id ? <Check size={16} className="text-green" /> : <Share2 size={16} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
