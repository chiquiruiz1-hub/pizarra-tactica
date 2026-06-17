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
  BarChart2,
  FileDown
} from 'lucide-react';

interface DashboardHomeProps {
  onNavigate: (section: string) => void;
  onEditPlay: (play: SavedPlay) => void;
}

export default function DashboardHome({ onNavigate, onEditPlay }: DashboardHomeProps) {
  const [stats, setStats] = useState({ tactica: 0, parado: 0, entrenamiento: 0, total: 0 });
  const [recentPlays, setRecentPlays] = useState<SavedPlay[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadGuide = async () => {
    setIsGeneratingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const container = document.createElement('div');
      container.className = 'manual-pdf-container';
      container.innerHTML = `
        <style>
          .manual-pdf-container {
            position: absolute;
            top: -10000px;
            left: -10000px;
            width: 794px;
            z-index: -9999;
          }
          .manual-page {
            width: 794px;
            height: 1122px;
            box-sizing: border-box;
            padding: 50px;
            background-color: #0b0f19;
            color: #cbd5e1;
            font-family: 'Inter', -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
          }
          .manual-page.cover-page {
            background-color: #070a13;
            justify-content: space-between;
            align-items: center;
            padding: 80px 50px;
          }
          .pitch-bg-pdf {
            position: absolute;
            top: 25%;
            left: 10%;
            width: 80%;
            height: 45%;
            border: 2px solid rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            pointer-events: none;
          }
          .pitch-line-pdf {
            position: absolute;
            background-color: rgba(255, 255, 255, 0.03);
          }
          .pitch-center-line-pdf {
            top: 0;
            left: 50%;
            width: 2px;
            height: 100%;
          }
          .pitch-center-circle-pdf {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 120px;
            height: 120px;
            border: 2px solid rgba(255, 255, 255, 0.03);
            border-radius: 50%;
            transform: translate(-50%, -50%);
          }
          .pitch-box-left-pdf {
            position: absolute;
            top: 25%;
            left: 0;
            width: 15%;
            height: 50%;
            border: 2px solid rgba(255, 255, 255, 0.03);
            border-left: none;
          }
          .pitch-box-right-pdf {
            position: absolute;
            top: 25%;
            right: 0;
            width: 15%;
            height: 50%;
            border: 2px solid rgba(255, 255, 255, 0.03);
            border-right: none;
          }
          .manual-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding-bottom: 10px;
            font-size: 9px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            width: 100%;
          }
          .manual-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            padding-top: 10px;
            font-size: 9px;
            color: #64748b;
            letter-spacing: 0.05em;
            width: 100%;
          }
          .manual-content {
            flex: 1;
            padding: 25px 0;
            display: flex;
            flex-direction: column;
            gap: 15px;
            width: 100%;
          }
          .section-title-pdf {
            font-size: 18px;
            color: #10b981;
            font-weight: 800;
            border-left: 4px solid #10b981;
            padding-left: 12px;
            margin-top: 5px;
            margin-bottom: 10px;
            letter-spacing: -0.01em;
            text-transform: uppercase;
          }
          .card-pdf {
            background-color: rgba(30, 41, 59, 0.35);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 8px;
            padding: 12px 15px;
          }
          .card-title-pdf {
            font-size: 12px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 5px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .card-text-pdf {
            font-size: 11px;
            color: #94a3b8;
            line-height: 1.5;
            margin: 0;
          }
          .callout-pdf {
            border-left: 4px solid #3b82f6;
            background-color: rgba(59, 130, 246, 0.06);
            border-radius: 0 8px 8px 0;
            padding: 10px 12px;
            font-size: 11px;
            line-height: 1.5;
            color: #93c5fd;
          }
          .callout-pdf.warning {
            border-left-color: #eab308;
            background-color: rgba(234, 179, 8, 0.06);
            color: #fef08a;
          }
          .table-pdf {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
          }
          .table-pdf th {
            background-color: rgba(30, 41, 59, 0.7);
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            padding: 6px 10px;
            text-align: left;
            border-bottom: 2px solid rgba(255, 255, 255, 0.08);
          }
          .table-pdf td {
            padding: 6px 10px;
            font-size: 10.5px;
            color: #cbd5e1;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          }
          .table-pdf tr:nth-child(even) {
            background-color: rgba(30, 41, 59, 0.15);
          }
          .badge-pdf {
            background-color: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
        </style>

        <!-- PÁGINA 1: PORTADA EDITORIAL -->
        <div class="manual-page cover-page" id="page-1">
          <div class="pitch-bg-pdf">
            <div class="pitch-line-pdf pitch-center-line-pdf"></div>
            <div class="pitch-center-circle-pdf"></div>
            <div class="pitch-box-left-pdf"></div>
            <div class="pitch-box-right-pdf"></div>
          </div>
          
          <div style="text-align: center; margin-top: 40px; z-index: 10;">
            <div style="font-size: 14px; font-weight: 800; color: #10b981; letter-spacing: 0.25em; text-transform: uppercase; margin-bottom: 15px;">
              PIZARRA<span style="color: #ffffff;">PRO</span> TECNOLOGÍA
            </div>
            <div style="width: 40px; height: 3px; background-color: #10b981; margin: 0 auto;"></div>
          </div>

          <div style="text-align: center; max-width: 600px; z-index: 10; margin-top: -40px;">
            <h1 style="font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: -0.02em; line-height: 1.2; margin: 0 0 15px 0;">
              MANUAL DE OPERACIONES<br/>Y GUÍA TÁCTICA
            </h1>
            <p style="font-size: 15px; color: #94a3b8; line-height: 1.5; font-weight: 400; margin: 0 auto; max-width: 480px;">
              Plataforma de Análisis de Rendimiento Técnico, Rotoscopia de Vídeo y Scouting de Élite
            </p>
          </div>

          <div style="text-align: center; z-index: 10; margin-bottom: 20px; width: 100%;">
            <div style="display: inline-flex; align-items: center; gap: 8px; background-color: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); padding: 6px 14px; border-radius: 9999px; margin-bottom: 25px;">
              <span style="width: 6px; height: 6px; background-color: #10b981; border-radius: 50%;"></span>
              <span style="font-size: 10px; font-weight: 700; color: #34d399; letter-spacing: 0.1em; text-transform: uppercase;">
                Documento de Formación Oficial
              </span>
            </div>
            
            <div style="font-size: 12px; color: #cbd5e1; font-weight: 600; margin-bottom: 4px;">
              Versión 2.5.0 (Edición 2026)
            </div>
            <div style="font-size: 10px; color: #64748b; font-weight: 500;">
              Exclusivo para Cuerpos Técnicos y Analistas de Rendimiento
            </div>
          </div>
        </div>

        <!-- PÁGINA 2: SECCIÓN 1 Y SECCIÓN 2 -->
        <div class="manual-page" id="page-2">
          <div class="manual-header">
            <span>PizarraPro v2.5.0 Manual</span>
            <span>01 / El Dashboard y Motor Gráfico</span>
          </div>

          <div class="manual-content">
            <h2 class="section-title-pdf">1. El Dashboard y Accesos Rápidos</h2>
            
            <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin: 0 0 10px 0;">
              El Dashboard principal actúa como el centro neurálgico del analista deportivo, ofreciendo una jerarquía visual optimizada y accesos directos estructurados para optimizar el flujo de trabajo bajo presión temporal.
            </p>

            <div class="grid-2">
              <div class="card-pdf">
                <div class="card-title-pdf">📊 Contadores de Rendimiento</div>
                <p class="card-text-pdf">
                  Visualización instantánea de las jugadas guardadas en tu biblioteca local, clasificadas automáticamente en tres categorías fundamentales: Táctica, Balón Parado y Entrenamiento.
                </p>
              </div>
              <div class="card-pdf">
                <div class="card-title-pdf">⚡ Atajos Rápidos</div>
                <p class="card-text-pdf">
                  Botones de redirección modular que cargan el canvas táctico preconfigurado para el tipo de ejercicio seleccionado, reduciendo la fricción al iniciar el análisis.
                </p>
              </div>
            </div>

            <h2 class="section-title-pdf" style="margin-top: 15px;">2. El Motor Gráfico Dinámico</h2>
            
            <div class="card-pdf">
              <div class="card-title-pdf">📈 Interpolación de Trayectorias LERP</div>
              <p class="card-text-pdf">
                El canvas táctico cuenta con un bucle matemático de refresco en alta resolución. Al reproducir una jugada grabada, calcula la posición exacta de cada ficha y balón aplicando <strong>Interpolación Lineal (LERP)</strong> a 60 FPS entre fotogramas clave. Esto asegura transiciones de movimiento fluidas y biológicamente verosímiles en pantalla.
              </p>
            </div>

            <div class="grid-2">
              <div class="card-pdf">
                <div class="card-title-pdf">⏱️ Ventana de consolidación</div>
                <p class="card-text-pdf">
                  Todos los dibujos añadidos en modo dinámico se revelan progresivamente mediante LERP durante un período estricto de <strong>1.5 segundos</strong> desde su instante de creación.
                </p>
              </div>
              <div class="card-pdf">
                <div class="card-title-pdf">↩️ Historial Ctrl+Z</div>
                <p class="card-text-pdf">
                  Gestión del estado de dibujo con histórico en cola. Puedes deshacer cualquier trazo, flecha, texto o zona de manera secuencial presionando la combinación de teclas <strong>Ctrl + Z</strong>.
                </p>
              </div>
            </div>

            <div class="callout-pdf">
              💡 <strong>Consejo de análisis:</strong> Al dibujar en estado pausado, el trazo se asocia automáticamente a la marca temporal actual de la línea de tiempo, permitiendo revelar anotaciones justo en el segundo exacto del suceso.
            </div>
          </div>

          <div class="manual-footer">
            <span>PizarraPro Manual Oficial · Confidencial Staff Técnico</span>
            <span>Página 2</span>
          </div>
        </div>

        <!-- PÁGINA 3: SECCIÓN 3 (ATADOS DE TECLADO Y ROTOSCOPIA) -->
        <div class="manual-page" id="page-3">
          <div class="manual-header">
            <span>PizarraPro v2.5.0 Manual</span>
            <span>02 / Rotoscopia y Atajos Rápidos</span>
          </div>

          <div class="manual-content">
            <h2 class="section-title-pdf">3. Rotoscopia Táctica por Teclado</h2>
            
            <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin: 0 0 10px 0;">
              La rotoscopia táctica asistida permite calcar los movimientos reales de un archivo de vídeo MP4 local sobre el terreno táctico. Para acelerar el proceso de marcado secuencial de fotogramas, se ha diseñado un sistema de <strong>Ficha Activa</strong> controlable por teclado.
            </p>

            <div class="callout-pdf warning" style="margin-bottom: 12px;">
              ⚠️ <strong>Flujo de Trabajo:</strong> Activa el Modo Rotoscopia, pausa el vídeo en el frame clave, designa un jugador con el teclado y haz clic directamente en el vídeo. La ficha se colocará allí y el sistema registrará su marca de tiempo automáticamente.
            </div>

            <div class="card-pdf" style="padding: 10px 15px;">
              <div class="card-title-pdf">⌨️ Tabla de Asignación y Atajos de Teclado</div>
              <table class="table-pdf">
                <thead>
                  <tr>
                    <th>Atajo de Teclado</th>
                    <th>Ficha Asignada</th>
                    <th>Color de Token</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>1</code> al <code>9</code></td>
                    <td>Jugadores Locales (1 al 9)</td>
                    <td><span style="color: #3b82f6; font-weight: 700;">Azul</span></td>
                  </tr>
                  <tr>
                    <td><code>Q</code> al <code>P</code> (Fila QWERTY)</td>
                    <td>Jugadores Visitantes (1 al 10)</td>
                    <td><span style="color: #ef4444; font-weight: 700;">Rojo</span></td>
                  </tr>
                  <tr>
                    <td><code>Shift + 1</code> al <code>9</code></td>
                    <td>Jugadores Visitantes Alternativo (1 al 9)</td>
                    <td><span style="color: #ef4444; font-weight: 700;">Rojo</span></td>
                  </tr>
                  <tr>
                    <td><code>R</code> o <code>0</code></td>
                    <td>Árbitro de Campo (ÁRB)</td>
                    <td><span style="color: #10b981; font-weight: 700;">Verde</span></td>
                  </tr>
                  <tr>
                    <td><code>Esc</code></td>
                    <td>Desactivar / Limpiar Ficha Seleccionada</td>
                    <td>-</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="card-pdf" style="margin-top: 5px;">
              <div class="card-title-pdf">🎥 Navegación de Precisión Temporal</div>
              <p class="card-text-pdf">
                Al pausar el vídeo, puedes realizar saltos finos de fotograma a fotograma utilizando los controles de navegación temporal de la barra táctica. Los botones <strong>&lt; Frame</strong> y <strong>Frame &gt;</strong> realizan saltos exactos de <strong>1/30 de segundo (33.3ms)</strong> por clic, permitiendo seguir los apoyos y desmarques con precisión sub-milisegundo.
              </p>
            </div>
          </div>

          <div class="manual-footer">
            <span>PizarraPro Manual Oficial · Confidencial Staff Técnico</span>
            <span>Página 3</span>
          </div>
        </div>

        <!-- PÁGINA 4: SECCIÓN 4 (MULTICAPA Y TIMELINE PINS) -->
        <div class="manual-page" id="page-4">
          <div class="manual-header">
            <span>PizarraPro v2.5.0 Manual</span>
            <span>03 / Línea de Tiempo y Hitos</span>
          </div>

          <div class="manual-content">
            <h2 class="section-title-pdf">4. Línea de Tiempo Multicapa y Pins</h2>
            
            <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin: 0 0 10px 0;">
              El análisis táctico avanzado requiere segregar estructuras estáticas de desplazamientos dinámicos y notas explicativas. Para ello, PizarraPro introduce la arquitectura de capas y los hitos de restauración inmediata.
            </p>

            <div class="grid-2">
              <div class="card-pdf">
                <div class="card-title-pdf">📁 Toggles de Capas Tácticas</div>
                <p class="card-text-pdf" style="margin-bottom: 8px;">
                  Tres filtros independientes accesibles desde la barra de herramientas del canvas táctico:
                </p>
                <ul style="font-size: 10px; color: #94a3b8; padding-left: 15px; margin: 0; line-height: 1.4;">
                  <li><strong>EST (Estructura)</strong>: Dibuja o esconde trazos libres, líneas de enlace y círculos tácticos.</li>
                  <li><strong>MOV (Movimiento)</strong>: Controla las flechas dinámicas de trayectoria.</li>
                  <li><strong>ANOT (Anotaciones)</strong>: Muestra u oculta los textos en el campo y las zonas sombreadas.</li>
                </ul>
              </div>
              
              <div class="card-pdf">
                <div class="card-title-pdf">📍 Hitos Cronológicos (Pins)</div>
                <p class="card-text-pdf">
                  Puntos clave en la línea de tiempo que congelan y almacenan el estado exacto de la pizarra (coordenadas de jugadores, balón, equipamiento y dibujos). Al hacer clic en un hito, la pizarra se restaura a ese instante exacto para analizar variantes sobre una misma jugada.
                </p>
              </div>
            </div>

            <div class="card-pdf" style="margin-top: 5px;">
              <div class="card-title-pdf">🔔 Control de la Sincronía del Pulso (Sonar Ping)</div>
              <p class="card-text-pdf">
                Cuando una flecha de movimiento alcanza su longitud máxima dibujada a lo largo del tiempo de reproducción, el motor gráfico ejecuta automáticamente una animación de <strong>Sonar Ping (onda expansiva doble)</strong> en su punta. Esta animación se prolonga durante 1.0 segundos y sirve para marcar visualmente el fin de una trayectoria de desmarque o el punto exacto donde debe ocurrir una recepción de pase o pase clave.
              </p>
            </div>

            <div class="callout-pdf">
              💡 <strong>Consejo de maquetación:</strong> Los hitos se guardan en el archivo exportado y se sincronizan con localStorage de manera que al recargar la jugada, puedes navegar rápidamente a través de los hitos definidos por el analista.
            </div>
          </div>

          <div class="manual-footer">
            <span>PizarraPro Manual Oficial · Confidencial Staff Técnico</span>
            <span>Página 4</span>
          </div>
        </div>

        <!-- PÁGINA 5: SECCIÓN 5 Y CIERRE -->
        <div class="manual-page" id="page-5">
          <div class="manual-header">
            <span>PizarraPro v2.5.0 Manual</span>
            <span>04 / Scouting y Cierre Técnico</span>
          </div>

          <div class="manual-content">
            <h2 class="section-title-pdf">5. Inteligencia de Scouting de Rivales</h2>
            
            <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin: 0 0 10px 0;">
              El módulo de rivales incorpora las capacidades de scouting de élite en una ficha técnica completa que consolida la información estructural y analítica para facilitar la lectura del cuerpo técnico.
            </p>

            <div class="grid-2">
              <div class="card-pdf">
                <div class="card-title-pdf">📋 Ficha de Fortalezas y Debilidades</div>
                <p class="card-text-pdf">
                  Estructuración en bloques simétricos coloreados (verde/rojo) para evaluar de forma rápida los aspectos críticos de la salida de balón, repliegue y transición defensiva del oponente.
                </p>
              </div>
              <div class="card-pdf">
                <div class="card-title-pdf">🎖️ Gestor de Jugadores Clave</div>
                <p class="card-text-pdf">
                  Registro detallado de los futbolistas determinantes del equipo rival, incluyendo dorsal, rol de juego e indicaciones específicas para los emparejamientos individuales del partido.
                </p>
              </div>
            </div>

            <div class="card-pdf" style="margin-top: 5px;">
              <div class="card-title-pdf">📄 Generación Dinámica de Dossiers PDF A4</div>
              <p class="card-text-pdf">
                El motor de exportación toma el estado analítico de la ficha del rival, su logotipo cargado en base64 y la pizarra táctica aislada para estructurar un documento PDF A4 de múltiples páginas con paginación inteligente, garantizando que el dossier esté limpio y libre de saltos de línea antiestéticos.
              </p>
            </div>

            <div style="border-top: 1px dashed rgba(255,255,255,0.15); margin-top: 20px; padding-top: 20px; text-align: center;">
              <div style="font-size: 10px; font-weight: 800; color: #ef4444; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 5px;">
                AVISO DE CONFIDENCIALIDAD
              </div>
              <p style="font-size: 9px; color: #64748b; line-height: 1.4; max-width: 480px; margin: 0 auto;">
                Este documento es propiedad intelectual del cuerpo técnico. Su distribución a terceros está estrictamente prohibida y sancionada bajo el reglamento interno del club.
              </p>
            </div>
          </div>

          <div class="manual-footer">
            <span>PizarraPro Manual Oficial · Confidencial Staff Técnico</span>
            <span>Página 5</span>
          </div>
        </div>
      `;

      document.body.appendChild(container);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [794, 1122]
      });

      const pageIds = ['page-1', 'page-2', 'page-3', 'page-4', 'page-5'];
      for (let i = 0; i < pageIds.length; i++) {
        const el = document.getElementById(pageIds[i]);
        if (el) {
          if (i > 0) pdf.addPage([794, 1122]);
          const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#0b0f19'
          });
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(imgData, 'JPEG', 0, 0, 794, 1122);
        }
      }

      pdf.save('PizarraPro_Manual_v2.5.0.pdf');
      document.body.removeChild(container);
    } catch (e) {
      console.error('Failed to generate user guide PDF:', e);
      alert('Error al generar el PDF. Consulta los detalles en consola.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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
          <div className="welcome-action" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* ① Improvement 4 — heavier, semibold button */}
            <button
              onClick={() => onNavigate('tactica')}
              className="action-btn primary-btn flex-center"
              style={{ fontWeight: 600, paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', gap: '0.4rem' }}
            >
              Nueva Táctica <ArrowRight size={15} />
            </button>
            <button
              onClick={handleDownloadGuide}
              className="action-btn flex-center"
              disabled={isGeneratingPdf}
              style={{
                fontWeight: 600,
                paddingLeft: '1rem',
                paddingRight: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                gap: '0.4rem',
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(100, 116, 139, 0.4)',
                color: '#cbd5e1',
                borderRadius: '8px',
                cursor: isGeneratingPdf ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: isGeneratingPdf ? 0.7 : 1
              }}
              title="Descargar Guía de Producto (PDF)"
            >
              <FileDown size={15} />
              {isGeneratingPdf ? 'Generando...' : 'Descargar Guía (PDF)'}
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
