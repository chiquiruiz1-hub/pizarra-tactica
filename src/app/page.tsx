import { Suspense } from 'react';
import TacticalBoard from '@/components/TacticalBoard';

export default function Home() {
  return (
    <>
      <header className="app-header">
        <h1 className="brand-title">
          Pizarra Táctica <span className="brand-dot" />
        </h1>
        <div className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em' }}>
          EDICIÓN PROFESIONAL
        </div>
      </header>
      <main className="app-main">
        <Suspense
          fallback={
            <div className="text-muted" style={{ padding: '3rem', textAlign: 'center', fontWeight: 500 }}>
              Cargando pizarra táctica interactiva...
            </div>
          }
        >
          <TacticalBoard />
        </Suspense>
      </main>
    </>
  );
}
