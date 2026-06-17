'use client';

import React, { useState, useEffect } from 'react';
import TacticalCanvas, { Player, Position, Drawing, EquipmentItem } from './TacticalCanvas';
import { Shield, Plus, Trash2, Calendar, FileText, Check, Save } from 'lucide-react';

interface ScoutingPlay {
  id: string;
  rivalName: string;
  formation: string;
  strengths: string;
  weaknesses: string;
  crest: string | null;
  date: string;
  canvasState: {
    players: Player[];
    ball: Position;
    drawings: Drawing[];
    pitchType: 'full' | 'half';
    equipment: EquipmentItem[];
  };
}

export default function ScoutingSection() {
  const [scouts, setScouts] = useState<ScoutingPlay[]>([]);
  const [activeScoutId, setActiveScoutId] = useState<string | null>(null);

  // Form states
  const [rivalName, setRivalName] = useState('');
  const [formation, setFormation] = useState('4-4-2');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [crest, setCrest] = useState<string | null>(null);

  // Active play state for the canvas
  const [canvasState, setCanvasState] = useState<any>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load scouting records on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pizarrapro_scouting');
      if (saved) {
        const parsed: ScoutingPlay[] = JSON.parse(saved);
        setScouts(parsed);
        if (parsed.length > 0) {
          loadScout(parsed[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load scouting records', e);
    }
  }, []);

  const loadScout = (scout: ScoutingPlay) => {
    setActiveScoutId(scout.id);
    setRivalName(scout.rivalName);
    setFormation(scout.formation);
    setStrengths(scout.strengths);
    setWeaknesses(scout.weaknesses);
    setCrest(scout.crest);
    setCanvasState(scout.canvasState);
  };

  const handleCreateNewScout = () => {
    setActiveScoutId(null);
    setRivalName('');
    setFormation('4-4-2');
    setStrengths('');
    setWeaknesses('');
    setCrest(null);
    setCanvasState(null); // Resets canvas to default
  };

  const handleCrestUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCrest(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteScout = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar este informe de scouting?')) {
      const updated = scouts.filter(s => s.id !== id);
      setScouts(updated);
      localStorage.setItem('pizarrapro_scouting', JSON.stringify(updated));
      if (activeScoutId === id) {
        if (updated.length > 0) {
          loadScout(updated[0]);
        } else {
          handleCreateNewScout();
        }
      }
    }
  };

  const handleSaveScouting = (canvasData: any) => {
    const name = rivalName.trim() || 'Rival Desconocido';
    const activeCanvasData = {
      players: canvasData.players,
      ball: canvasData.ball,
      drawings: canvasData.drawings,
      pitchType: canvasData.pitchType || 'full',
      equipment: canvasData.equipment || []
    };

    const newScout: ScoutingPlay = {
      id: activeScoutId || `scout_${Date.now()}`,
      rivalName: name,
      formation,
      strengths,
      weaknesses,
      crest,
      date: new Date().toISOString(),
      canvasState: activeCanvasData
    };

    let updated: ScoutingPlay[];
    if (activeScoutId) {
      updated = scouts.map(s => (s.id === activeScoutId ? newScout : s));
    } else {
      updated = [newScout, ...scouts];
      setActiveScoutId(newScout.id);
    }

    setScouts(updated);
    localStorage.setItem('pizarrapro_scouting', JSON.stringify(updated));
    
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="scouting-split-container">
      {/* 1. LEFT COLUMN: SCOUT REPORTS LIST & FORMS */}
      <div className="scouting-sidebar-column">
        {/* Reports Navigation */}
        <div className="scouting-panel glassmorphic padding-panel flex-col gap-4">
          <div className="flex-center justify-between">
            <h3 className="section-title flex-center gap-2">
              <Shield size={18} className="text-yellow" /> Informes Scouting
            </h3>
            <button onClick={handleCreateNewScout} className="action-btn flex-center gap-1 primary-btn small-btn">
              <Plus size={14} />
              <span>Nuevo</span>
            </button>
          </div>

          <div className="scout-reports-list">
            {scouts.length === 0 ? (
              <p className="text-muted text-xs text-center py-4">No hay informes. Crea uno nuevo.</p>
            ) : (
              scouts.map(scout => (
                <div
                  key={scout.id}
                  onClick={() => loadScout(scout)}
                  className={`scout-report-item ${scout.id === activeScoutId ? 'active' : ''}`}
                >
                  <div className="scout-report-crest">
                    {scout.crest ? (
                      <img src={scout.crest} alt="Rival Crest" className="scout-crest-img" />
                    ) : (
                      <Shield size={16} className="text-muted" />
                    )}
                  </div>
                  <div className="scout-report-info">
                    <span className="scout-report-name">{scout.rivalName}</span>
                    <span className="scout-report-formation text-muted">{scout.formation}</span>
                  </div>
                  <button onClick={e => handleDeleteScout(scout.id, e)} className="scout-report-delete-btn" title="Eliminar Informe">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rival Meta Form */}
        <div className="scouting-panel glassmorphic padding-panel flex-col gap-4">
          <h3 className="section-title">Datos del Rival</h3>
          
          <div className="form-group">
            <label className="select-label">Nombre del Club Rival</label>
            <input
              type="text"
              value={rivalName}
              onChange={e => setRivalName(e.target.value)}
              placeholder="Ej: Manchester City"
              className="modal-input"
            />
          </div>

          <div className="form-row gap-4">
            <div className="form-group flex-1">
              <label className="select-label">Alineación Habitual</label>
              <input
                type="text"
                value={formation}
                onChange={e => setFormation(e.target.value)}
                placeholder="Ej: 4-3-3"
                className="modal-input"
              />
            </div>
            
            <div className="form-group flex-1">
              <label className="select-label">Escudo del Club</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleCrestUpload}
                className="file-input-custom"
                id="crest-uploader"
              />
              <label htmlFor="crest-uploader" className="file-input-label flex-center">
                Subir Escudo
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="select-label text-green">Fortalezas</label>
            <textarea
              value={strengths}
              onChange={e => setStrengths(e.target.value)}
              placeholder="Ej: Presión alta, juego por bandas..."
              className="modal-input textarea-custom text-green-border"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="select-label text-red">Debilidades</label>
            <textarea
              value={weaknesses}
              onChange={e => setWeaknesses(e.target.value)}
              placeholder="Ej: Transición defensiva lenta..."
              className="modal-input textarea-custom text-red-border"
              rows={3}
            />
          </div>

          {savedSuccess && (
            <div className="capture-alert-banner success-bg flex-center gap-2">
              <Check size={16} />
              <span>Informe Guardado con Éxito</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. RIGHT COLUMN: RIVAL CANVAS BOARD */}
      <div className="scouting-canvas-column flex-col gap-4">
        <div className="scouting-canvas-header flex-center justify-between">
          <div className="flex-col">
            <h3 className="section-title">Esquema Táctico del Rival</h3>
            <span className="text-muted text-xs">Dibuja la alineación y el comportamiento del rival en este tablero aislado.</span>
          </div>
          <button
            onClick={() => {
              // Trigger save on TacticalCanvas by executing save natively.
              // Since TacticalCanvas exposes a save button internally, we can trigger the save modal there,
              // but we want to save directly to the scouting report.
              // To do this, we pass handleSaveScouting to TacticalCanvas's onSave prop,
              // and the coach clicks the TacticalCanvas's default "Guardar" button!
              // This is a seamless integration!
            }}
            className="action-btn primary-btn flex-center gap-2"
            title="Guardar Scouting Completo"
            style={{ pointerEvents: 'none', opacity: 0.7 }}
          >
            <Save size={16} />
            <span>Guardar Scouting</span>
          </button>
        </div>

        <div className="scouting-canvas-wrapper">
          <TacticalCanvas
            mode="tactica"
            onSave={handleSaveScouting}
            initialPlayData={canvasState}
          />
        </div>
      </div>
    </div>
  );
}
