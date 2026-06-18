'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Zap, 
  Lock, 
  Key, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Copy, 
  RefreshCw, 
  User, 
  Building, 
  Mail, 
  Calendar, 
  Search,
  ExternalLink
} from 'lucide-react';

interface License {
  id: string;
  club: string;
  email: string;
  clave: string;
  activo: boolean;
  fecha_inicio: string;
  fecha_caducidad: string;
  plan: 'mensual' | 'anual';
  created_at?: string;
}

const DEFAULT_MASTER_KEY = 'pizarrapro-master-key-2026';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [club, setClub] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState<'mensual' | 'anual'>('mensual');
  const [customKey, setCustomKey] = useState('');
  const [fechaCaducidad, setFechaCaducidad] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const masterKey = process.env.NEXT_PUBLIC_ADMIN_MASTER_KEY || DEFAULT_MASTER_KEY;

  // Check if already authenticated in this session
  useEffect(() => {
    const isAuthed = sessionStorage.getItem('pizarrapro_admin_authed');
    if (isAuthed === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch licenses once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchLicenses();
    }
  }, [isAuthenticated]);

  // Automatically calculate default expiry date based on plan
  useEffect(() => {
    const date = new Date();
    if (plan === 'mensual') {
      date.setDate(date.getDate() + 30);
    } else {
      date.setDate(date.getDate() + 365);
    }
    // Format to YYYY-MM-DD for date input
    const formatted = date.toISOString().split('T')[0];
    setFechaCaducidad(formatted);
  }, [plan]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterKeyInput === masterKey) {
      sessionStorage.setItem('pizarrapro_admin_authed', 'true');
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Clave maestra incorrecta. Inténtalo de nuevo.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pizarrapro_admin_authed');
    setIsAuthenticated(false);
    setMasterKeyInput('');
  };

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('licencias')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLicenses(data || []);
    } catch (err) {
      console.error('Error fetching licenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => {
      let str = '';
      for (let i = 0; i < 4; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return str;
    };
    const key = `PRO-${segment()}-${segment()}`;
    setCustomKey(key);
  };

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!club.trim()) return setFormError('Especifica el nombre del club.');
    if (!email.trim()) return setFormError('Especifica el email de contacto.');
    
    let licenseKey = customKey.trim();
    if (!licenseKey) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const segment = () => {
        let str = '';
        for (let i = 0; i < 4; i++) {
          str += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return str;
      };
      licenseKey = `PRO-${segment()}-${segment()}`;
    }

    try {
      const { data, error } = await supabase
        .from('licencias')
        .insert([
          {
            club: club.trim(),
            email: email.trim().toLowerCase(),
            clave: licenseKey,
            plan,
            activo: true,
            fecha_inicio: new Date().toISOString(),
            fecha_caducidad: new Date(fechaCaducidad + 'T23:59:59').toISOString()
          }
        ])
        .select();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Esta clave de licencia ya existe en la base de datos.');
        }
        throw error;
      }

      setFormSuccess(`Licencia creada con éxito para ${club}. Clave: ${licenseKey}`);
      // Clear form except plan
      setClub('');
      setEmail('');
      setCustomKey('');
      fetchLicenses();
    } catch (err: any) {
      setFormError(err.message || 'Error al crear la licencia.');
      console.error(err);
    }
  };

  const toggleLicenseStatus = async (id: string, currentStatus: boolean) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('licencias')
        .update({ activo: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setLicenses(prev => 
        prev.map(lic => lic.id === id ? { ...lic, activo: !currentStatus } : lic)
      );
    } catch (err) {
      console.error('Error toggling license status:', err);
      alert('Error al cambiar el estado de la licencia.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteLicense = async (id: string, clubName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la licencia del club "${clubName}"?`)) {
      return;
    }

    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('licencias')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setLicenses(prev => prev.filter(lic => lic.id !== id));
    } catch (err) {
      console.error('Error deleting license:', err);
      alert('Error al borrar la licencia.');
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Clave copiada: ${text}`);
  };

  // Metrics
  const totalCount = licenses.length;
  const activeCount = licenses.filter(l => l.activo && new Date(l.fecha_caducidad) > new Date()).length;
  const expiredCount = licenses.filter(l => new Date(l.fecha_caducidad) <= new Date()).length;
  const disabledCount = licenses.filter(l => !l.activo).length;

  // Filtered list
  const filteredLicenses = licenses.filter(lic => {
    const query = searchQuery.toLowerCase();
    return (
      lic.club.toLowerCase().includes(query) ||
      lic.email.toLowerCase().includes(query) ||
      lic.clave.toLowerCase().includes(query)
    );
  });

  // Login View
  if (!isAuthenticated) {
    return (
      <div className="license-screen-container">
        <div className="license-card glassmorphic fade-in">
          <div className="brand-logo-wrapper">
            <Zap className="text-green animate-pulse" size={40} />
            <span className="brand-name font-gradient">PizarraPro Admin</span>
          </div>
          
          <h2 className="license-title">Acceso Panel de Control</h2>
          <p className="license-subtitle text-muted">
            Introduce la clave maestra de administrador para gestionar las licencias.
          </p>

          <form onSubmit={handleLogin} className="license-form">
            <div className="input-group-premium">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                placeholder="Clave Maestra"
                value={masterKeyInput}
                onChange={(e) => setMasterKeyInput(e.target.value)}
                className="premium-input"
              />
            </div>

            {authError && (
              <div className="license-error fade-in">
                <X size={16} />
                <span>{authError}</span>
              </div>
            )}

            <button type="submit" className="btn-premium btn-green">
              <span>Entrar al Panel</span>
            </button>
          </form>

          <div className="license-footer">
            <a href="/" className="link-green flex-center gap-1">
              <span>Volver a la App Principal</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Panel View
  return (
    <div className="admin-dashboard-container">
      {/* HEADER */}
      <header className="admin-header glassmorphic">
        <div className="admin-brand">
          <Zap className="text-green" size={24} />
          <h1 className="admin-title font-gradient">PizarraPro Admin</h1>
        </div>
        <div className="admin-header-actions">
          <button onClick={fetchLicenses} className="btn-icon-premium" title="Recargar">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleLogout} className="btn-premium btn-secondary-premium">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="admin-content-grid">
        {/* METRICS */}
        <section className="admin-metrics-row">
          <div className="metric-box glassmorphic">
            <span className="metric-label">Total Licencias</span>
            <span className="metric-value">{totalCount}</span>
          </div>
          <div className="metric-box glassmorphic border-green">
            <span className="metric-label">Activas & Vigentes</span>
            <span className="metric-value text-green">{activeCount}</span>
          </div>
          <div className="metric-box glassmorphic border-red">
            <span className="metric-label">Caducadas</span>
            <span className="metric-value text-red">{expiredCount}</span>
          </div>
          <div className="metric-box glassmorphic border-orange">
            <span className="metric-label">Desactivadas</span>
            <span className="metric-value text-orange">{disabledCount}</span>
          </div>
        </section>

        <div className="admin-main-split">
          {/* CREATE NEW LICENSE FORM */}
          <aside className="admin-sidebar-form glassmorphic">
            <h3 className="section-title-premium">
              <Plus size={18} />
              <span>Nueva Licencia</span>
            </h3>

            <form onSubmit={handleCreateLicense} className="admin-form">
              <div className="admin-input-wrapper">
                <label className="admin-label">Nombre del Club / Entidad</label>
                <div className="input-group-premium">
                  <Building size={16} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Real Madrid, FC Barcelona, etc."
                    value={club}
                    onChange={(e) => setClub(e.target.value)}
                    className="premium-input"
                    required
                  />
                </div>
              </div>

              <div className="admin-input-wrapper">
                <label className="admin-label">Email de Contacto</label>
                <div className="input-group-premium">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    placeholder="entrenador@club.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="premium-input"
                    required
                  />
                </div>
              </div>

              <div className="admin-input-wrapper">
                <label className="admin-label">Plan de Suscripción</label>
                <div className="plan-selector">
                  <button
                    type="button"
                    onClick={() => setPlan('mensual')}
                    className={`plan-btn ${plan === 'mensual' ? 'active' : ''}`}
                  >
                    Mensual
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlan('anual')}
                    className={`plan-btn ${plan === 'anual' ? 'active' : ''}`}
                  >
                    Anual
                  </button>
                </div>
              </div>

              <div className="admin-input-wrapper">
                <label className="admin-label">Fecha de Caducidad</label>
                <div className="input-group-premium">
                  <Calendar size={16} className="input-icon" />
                  <input
                    type="date"
                    value={fechaCaducidad}
                    onChange={(e) => setFechaCaducidad(e.target.value)}
                    className="premium-input"
                    required
                  />
                </div>
              </div>

              <div className="admin-input-wrapper">
                <label className="admin-label">Clave de Licencia (Opcional)</label>
                <div className="input-group-premium-action">
                  <div className="input-group-premium flex-1">
                    <Key size={16} className="input-icon" />
                    <input
                      type="text"
                      placeholder="PRO-XXXX-XXXX (vacío para auto)"
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value.toUpperCase())}
                      className="premium-input"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generateRandomKey}
                    className="btn-premium btn-secondary-premium small-btn"
                  >
                    Generar
                  </button>
                </div>
              </div>

              {formError && (
                <div className="license-error fade-in">
                  <X size={14} />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="license-success fade-in">
                  <Check size={14} />
                  <span>{formSuccess}</span>
                </div>
              )}

              <button type="submit" className="btn-premium btn-green w-100">
                <span>Crear Licencia</span>
              </button>
            </form>
          </aside>

          {/* LICENSES LIST */}
          <main className="admin-licenses-list-wrapper glassmorphic">
            <div className="list-header-premium">
              <h3 className="section-title-premium margin-0">
                <span>Listado de Licencias</span>
              </h3>
              
              {/* SEARCH BAR */}
              <div className="search-bar-premium">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por Club, Email o Clave..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            {loading ? (
              <div className="admin-list-loading">
                <RefreshCw className="animate-spin text-green" size={24} />
                <span>Cargando licencias de la base de datos...</span>
              </div>
            ) : filteredLicenses.length === 0 ? (
              <div className="admin-list-empty text-muted">
                Ninguna licencia coincide con la búsqueda.
              </div>
            ) : (
              <div className="table-responsive-premium">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Club / Entidad</th>
                      <th>Email</th>
                      <th>Clave de Licencia</th>
                      <th>Plan</th>
                      <th>Fecha Vencimiento</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLicenses.map((lic) => {
                      const isExpired = new Date(lic.fecha_caducidad) <= new Date();
                      
                      return (
                        <tr key={lic.id} className={isExpired ? 'row-expired' : ''}>
                          <td className="font-weight-bold">{lic.club}</td>
                          <td>
                            <a href={`mailto:${lic.email}`} className="link-muted flex-center gap-1">
                              <span>{lic.email}</span>
                            </a>
                          </td>
                          <td>
                            <div className="key-display-box">
                              <code>{lic.clave}</code>
                              <button
                                onClick={() => copyToClipboard(lic.clave)}
                                className="copy-btn"
                                title="Copiar Clave"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          </td>
                          <td>
                            <span className={`badge plan-${lic.plan}`}>
                              {lic.plan}
                            </span>
                          </td>
                          <td>
                            <span className={isExpired ? 'text-red font-weight-bold' : ''}>
                              {new Date(lic.fecha_caducidad).toLocaleDateString('es-ES')}
                              {isExpired && ' (Caducado)'}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => toggleLicenseStatus(lic.id, lic.activo)}
                              disabled={actionLoading === lic.id}
                              className={`status-toggle ${lic.activo ? 'status-active' : 'status-inactive'}`}
                              title={lic.activo ? 'Desactivar licencia' : 'Activar licencia'}
                            >
                              {lic.activo ? (
                                <>
                                  <Check size={12} />
                                  <span>Activa</span>
                                </>
                              ) : (
                                <>
                                  <X size={12} />
                                  <span>Inactiva</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td>
                            <button
                              onClick={() => handleDeleteLicense(lic.id, lic.club)}
                              disabled={actionLoading === lic.id}
                              className="delete-action-btn"
                              title="Eliminar Licencia"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
