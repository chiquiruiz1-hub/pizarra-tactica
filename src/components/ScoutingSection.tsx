'use client';

import React, { useState, useEffect } from 'react';
import TacticalCanvas, { Player, Position, Drawing, EquipmentItem } from './TacticalCanvas';
import { Shield, Plus, Trash2, FileText, Check, Save } from 'lucide-react';

export interface KeyPlayer {
  id: string;
  name: string;
  number: number;
  role: string;
  notes: string;
}

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
  keyPlayers?: KeyPlayer[];
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
  
  // Key Players states
  const [keyPlayers, setKeyPlayers] = useState<KeyPlayer[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState('');
  const [newPlayerNotes, setNewPlayerNotes] = useState('');

  // Active play state for the canvas
  const [canvasState, setCanvasState] = useState<any>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

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
    setKeyPlayers(scout.keyPlayers || []);
  };

  const handleCreateNewScout = () => {
    setActiveScoutId(null);
    setRivalName('');
    setFormation('4-4-2');
    setStrengths('');
    setWeaknesses('');
    setCrest(null);
    setCanvasState(null); // Resets canvas to default
    setKeyPlayers([]);
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

  const handleAddKeyPlayer = () => {
    if (!newPlayerName.trim()) return;
    const player: KeyPlayer = {
      id: `kp_${Date.now()}`,
      name: newPlayerName.trim(),
      number: parseInt(newPlayerNumber) || 0,
      role: newPlayerRole.trim() || 'Sin posición',
      notes: newPlayerNotes.trim() || 'Sin notas.'
    };
    setKeyPlayers(prev => [...prev, player]);
    setNewPlayerName('');
    setNewPlayerNumber('');
    setNewPlayerRole('');
    setNewPlayerNotes('');
  };

  const handleDeleteKeyPlayer = (id: string) => {
    setKeyPlayers(prev => prev.filter(p => p.id !== id));
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
      canvasState: activeCanvasData,
      keyPlayers
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

  const handleExportPDF = async () => {
    if (!activeScoutId) return;
    const scout = scouts.find(s => s.id === activeScoutId);
    if (!scout) return;

    setIsExportingPDF(true);

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const canvas = document.querySelector('.scouting-canvas-wrapper canvas') as HTMLCanvasElement;
      const canvasDataUrl = canvas ? canvas.toDataURL('image/png') : null;

      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.background = '#ffffff';
      container.style.color = '#1e293b';
      container.style.padding = '40px';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.boxSizing = 'border-box';
      container.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";

      container.innerHTML = `
        <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${scout.crest ? `<img src="${scout.crest}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 8px;" />` : `<div style="width: 50px; height: 50px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748b; font-weight: bold; font-size: 20px;">🛡️</div>`}
            <div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">${scout.rivalName}</h1>
              <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b; font-weight: 500;">Dossier de Scouting Táctico</p>
            </div>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">PizarraPro Análisis</p>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b; font-weight: 500;">${new Date(scout.date).toLocaleDateString('es-ES')}</p>
          </div>
        </div>

        <div style="margin-bottom: 25px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Formación Habitual</span>
            <h2 style="margin: 2px 0 0 0; font-size: 20px; font-weight: 700; color: #0f172a;">${scout.formation}</h2>
          </div>
          <div style="text-align: right; background: #e2e8f0; color: #334155; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            Confidencial Plantilla
          </div>
        </div>

        ${canvasDataUrl ? `
          <div style="margin-bottom: 30px; text-align: center; break-inside: avoid; page-break-inside: avoid;">
            <h3 style="font-size: 13px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; margin: 0 0 10px 0;">Esquema Táctico</h3>
            <div style="border: 2px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #111622; display: inline-block; width: 100%; box-sizing: border-box;">
              <img src="${canvasDataUrl}" style="width: 100%; display: block;" />
            </div>
          </div>
        ` : ''}

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; break-inside: avoid; page-break-inside: avoid;">
          <div style="background: rgba(16, 185, 129, 0.04); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 12px; padding: 20px; box-sizing: border-box;">
            <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
              🟢 Fortalezas
            </h3>
            <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${scout.strengths || 'No especificadas.'}</p>
          </div>
          
          <div style="background: rgba(239, 68, 68, 0.04); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 12px; padding: 20px; box-sizing: border-box;">
            <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
              🔴 Debilidades
            </h3>
            <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${scout.weaknesses || 'No especificadas.'}</p>
          </div>
        </div>

        ${scout.keyPlayers && scout.keyPlayers.length > 0 ? `
          <div style="margin-bottom: 20px; break-inside: avoid; page-break-inside: avoid;">
            <h3 style="font-size: 13px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Jugadores Clave & Notas de Rendimiento</h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${scout.keyPlayers.map(p => `
                <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; background: #ffffff; break-inside: avoid; page-break-inside: avoid; box-sizing: border-box;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <div>
                      <span style="background: #2563eb; color: #ffffff; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-right: 8px;">DORSAL ${p.number}</span>
                      <strong style="font-size: 14px; color: #0f172a;">${p.name}</strong>
                    </div>
                    <span style="font-size: 12px; color: #64748b; font-weight: 600; background: #f1f5f9; padding: 2px 8px; border-radius: 6px;">${p.role}</span>
                  </div>
                  <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #475569;">${p.notes}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: 500;">
          Generado automáticamente por PizarraPro · Análisis Táctico y de Rendimiento
        </div>
      `;

      document.body.appendChild(container);

      const pdfCanvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(container);

      const imgData = pdfCanvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; 
      const pageHeight = 297; 
      const imgHeight = (pdfCanvas.height * imgWidth) / pdfCanvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`informe_scouting_${scout.rivalName.toLowerCase().replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF', err);
      alert('Error al generar el PDF.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="scouting-split-container">
      <div className="scouting-sidebar-column">
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

        <div className="scouting-panel glassmorphic padding-panel flex-col gap-4">
          <div className="flex-center justify-between">
            <h3 className="section-title">Datos del Rival</h3>
            {activeScoutId && (
              <button
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="action-btn flex-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg border border-neutral-700 transition-all font-semibold px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                title="Descargar Informe en PDF"
              >
                <FileText size={14} />
                <span>{isExportingPDF ? 'Exportando...' : 'Exportar PDF'}</span>
              </button>
            )}
          </div>
          
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

          <div className="form-group flex-col gap-2 mt-2">
            <label className="select-label">Jugadores Clave & Notas</label>
            
            {keyPlayers.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {keyPlayers.map(player => (
                  <div key={player.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(7, 10, 19, 0.4)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                        <span style={{ background: 'var(--accent-color, #3b82f6)', color: '#070a13', fontFamily: 'monospace', padding: '0px 4px', borderRadius: '3px' }}>#{player.number}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal', fontSize: '0.7rem' }}>({player.role})</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', lineHeight: '1.4', wordBreak: 'break-word' }}>{player.notes}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteKeyPlayer(player.id)}
                      className="scout-report-delete-btn"
                      style={{ position: 'relative', right: 0, top: 0, transform: 'none' }}
                      title="Quitar jugador"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', background: 'rgba(7, 10, 19, 0.6)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Nombre del jugador"
                  value={newPlayerName}
                  onChange={e => setNewPlayerName(e.target.value)}
                  className="modal-input"
                  style={{ flex: 1, height: '30px', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                />
                <input
                  type="number"
                  placeholder="Nº"
                  value={newPlayerNumber}
                  onChange={e => setNewPlayerNumber(e.target.value)}
                  className="modal-input"
                  style={{ width: '45px', height: '30px', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Posición / Rol"
                  value={newPlayerRole}
                  onChange={e => setNewPlayerRole(e.target.value)}
                  className="modal-input"
                  style={{ flex: 1, height: '30px', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                />
                <button
                  onClick={handleAddKeyPlayer}
                  className="action-btn flex-center primary-btn"
                  style={{ height: '30px', width: '30px', padding: 0 }}
                  title="Añadir jugador clave"
                >
                  <Plus size={14} />
                </button>
              </div>
              <textarea
                placeholder="Notas tácticas (ej: zurdo, busca encarar, lento al repliegue...)"
                value={newPlayerNotes}
                onChange={e => setNewPlayerNotes(e.target.value)}
                className="modal-input"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', minHeight: '40px' }}
                rows={2}
              />
            </div>
          </div>

          {savedSuccess && (
            <div className="capture-alert-banner success-bg flex-center gap-2">
              <Check size={16} />
              <span>Informe Guardado con Éxito</span>
            </div>
          )}
        </div>
      </div>

      <div className="scouting-canvas-column flex-col gap-4">
        <div className="scouting-canvas-header flex-center justify-between">
          <div className="flex-col">
            <h3 className="section-title">Esquema Táctico del Rival</h3>
            <span className="text-muted text-xs">Dibuja la alineación y el comportamiento del rival en este tablero aislado.</span>
          </div>
          <button
            onClick={() => {
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
