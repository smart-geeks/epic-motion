'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Admin Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="relative max-w-md w-full">
        {/* Fondo glass */}
        <div className="absolute inset-0 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] shadow-2xl" />
        
        <div className="relative p-8 text-center">
          {/* Icono animado */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          <h2 className="text-xl font-montserrat font-bold text-white mb-2 tracking-tight">
            Algo salió mal
          </h2>
          
          <p className="text-sm text-white/50 mb-2 font-inter">
            Ocurrió un error inesperado al cargar esta sección.
          </p>

          {error.digest && (
            <p className="text-xs text-white/25 font-mono mb-6">
              Ref: {error.digest}
            </p>
          )}

          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-left">
              <p className="text-xs font-mono text-red-300/70 break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-inter font-medium
                bg-epic-gold/10 text-epic-gold border border-epic-gold/20
                hover:bg-epic-gold/20 transition-all duration-200"
            >
              <RotateCcw size={14} />
              Reintentar
            </button>
            
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-inter font-medium
                text-white/60 border border-white/10
                hover:text-white hover:border-white/20 transition-all duration-200"
            >
              <Home size={14} />
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
