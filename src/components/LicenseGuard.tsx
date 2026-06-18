'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Zap, Lock, Mail, Key, Loader2, AlertCircle } from 'lucide-react';

interface LicenseGuardProps {
  children: React.ReactNode;
}

export interface LicenseInfo {
  id: string;
  club: string;
  email: string;
  clave: string;
  activo: boolean;
  fecha_inicio: string;
  fecha_caducidad: string;
  plan: string;
}

export default function LicenseGuard({ children }: LicenseGuardProps) {
  const [loading, setLoading] = useState(true);
  const [isFreePeriod, setIsFreePeriod] = useState(true); // Default to true until checked
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [licenseData, setLicenseData] = useState<LicenseInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [activating, setActivating] = useState(false);

  // Function to verify a license key against Supabase
  const verifyLicense = async (key: string): Promise<{ success: boolean; data?: LicenseInfo; message?: string }> => {
    try {
      const { data, error } = await supabase
        .from('licencias')
        .select('*')
        .eq('clave', key.trim())
        .maybeSingle();

      if (error) {
        console.error('Error querying license:', error);
        return { success: false, message: 'Error al conectar con el servidor de licencias.' };
      }

      if (!data) {
        return { success: false, message: 'La clave de licencia introducida no es válida.' };
      }

      const lic = data as LicenseInfo;

      if (!lic.activo) {
        return { success: false, message: 'Esta licencia ha sido desactivada por el administrador.' };
      }

      const expiryDate = new Date(lic.fecha_caducidad);
      const now = new Date();

      if (expiryDate < now) {
        return { success: false, message: `Esta licencia caducó el ${expiryDate.toLocaleDateString('es-ES')}.` };
      }

      return { success: true, data: lic };
    } catch (err) {
      console.error('Unexpected error verifying license:', err);
      return { success: false, message: 'Error de red. Por favor, verifica tu conexión.' };
    }
  };

  useEffect(() => {
    const checkSavedLicense = async () => {
      // 1. Check if we are still in the free trial period (until Dec 31, 2026 inclusive, i.e., before Jan 1, 2027)
      const freePeriodEnd = new Date('2027-01-01T00:00:00');
      const now = new Date();

      if (now < freePeriodEnd) {
        setIsFreePeriod(true);
        setLoading(false);
        return;
      }

      // Past the free trial period
      setIsFreePeriod(false);

      // 2. Normal license verification flow
      const savedKey = localStorage.getItem('pizarrapro_license_key');
      if (!savedKey) {
        setLoading(false);
        return;
      }

      setLicenseKey(savedKey);
      const res = await verifyLicense(savedKey);
      if (res.success && res.data) {
        setIsValid(true);
        setLicenseData(res.data);
      } else {
        // If there was a saved key, but verification failed (e.g. deactivated or expired)
        setIsValid(false);
        setErrorMsg(res.message || 'Licencia inválida o caducada.');
      }
      setLoading(false);
    };

    checkSavedLicense();
  }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setErrorMsg('Por favor, introduce una clave de licencia.');
      return;
    }

    setActivating(true);
    setErrorMsg(null);

    const res = await verifyLicense(inputValue);

    if (res.success && res.data) {
      localStorage.setItem('pizarrapro_license_key', res.data.clave);
      setLicenseKey(res.data.clave);
      setIsValid(true);
      setLicenseData(res.data);
    } else {
      setErrorMsg(res.message || 'Clave de licencia inválida.');
    }
    setActivating(false);
  };

  const handleLogoutLicense = () => {
    localStorage.removeItem('pizarrapro_license_key');
    setLicenseKey(null);
    setIsValid(false);
    setLicenseData(null);
    setErrorMsg(null);
    setInputValue('');
  };

  if (loading) {
    return (
      <div className="license-screen-container">
        <div className="license-card loading-card glassmorphic">
          <div className="pulse-glow">
            <Zap className="text-green animate-pulse" size={48} />
          </div>
          <h2 className="license-title font-gradient">Verificando Licencia</h2>
          <p className="license-subtitle text-muted">Conectando con el servidor seguro...</p>
          <div className="spinner-wrapper">
            <Loader2 className="spinner text-green" size={32} />
          </div>
        </div>
      </div>
    );
  }

  // If current date is within the free trial period, let everyone access PizarraPro
  if (isFreePeriod) {
    return <>{children}</>;
  }

  // Case 1: No license key has been entered yet (Activation screen)
  if (!licenseKey) {
    return (
      <div className="license-screen-container">
        <div className="license-card glassmorphic fade-in">
          <div className="brand-logo-wrapper">
            <Zap className="text-green" size={40} />
            <span className="brand-name font-gradient">PizarraPro</span>
          </div>
          
          <h2 className="license-title">Activación de Licencia</h2>
          <p className="license-subtitle text-muted">
            Introduce la clave de licencia para activar tu club y comenzar a diseñar tus tácticas.
          </p>

          <form onSubmit={handleActivate} className="license-form">
            <div className="input-group-premium">
              <Key size={18} className="input-icon" />
              <input
                type="text"
                placeholder="PRO-XXXX-XXXX"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                className="premium-input"
                disabled={activating}
              />
            </div>

            {errorMsg && (
              <div className="license-error fade-in">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button type="submit" className="btn-premium btn-green" disabled={activating}>
              {activating ? (
                <>
                  <Loader2 className="spinner" size={18} />
                  <span>Verificando...</span>
                </>
              ) : (
                <span>Activar Licencia</span>
              )}
            </button>
          </form>

          <div className="license-footer text-muted">
            ¿No tienes una licencia? <a href="mailto:chiquiruiz1@gmail.com?subject=Solicitud de Licencia PizarraPro" className="link-green">Contacta con nosotros</a>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: License key found, but it is invalid or expired (Lock screen)
  if (!isValid) {
    return (
      <div className="license-screen-container">
        <div className="license-card lock-card glassmorphic fade-in">
          <div className="lock-icon-wrapper">
            <Lock className="text-red" size={48} />
          </div>
          
          <h2 className="license-title font-gradient">Acceso Bloqueado</h2>
          <p className="license-subtitle">
            {errorMsg || 'Tu licencia ha caducado. Contacta con nosotros para renovar.'}
          </p>

          <div className="license-details-box text-muted">
            <p>Clave: <code>{licenseKey}</code></p>
            <p>Si consideras que esto es un error, por favor contacta con soporte.</p>
          </div>

          <div className="button-group">
            <a 
              href={`mailto:chiquiruiz1@gmail.com?subject=Renovacion de Licencia PizarraPro&body=Hola, mi clave de licencia es ${licenseKey}. Deseo renovar mi suscripción.`}
              className="btn-premium btn-red text-center"
            >
              <Mail size={18} />
              <span>Contactar por Email</span>
            </a>
            
            <button 
              onClick={handleLogoutLicense}
              className="btn-premium btn-secondary-premium"
            >
              Introducir otra clave
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Valid and active license (Main app content)
  return <>{children}</>;
}
