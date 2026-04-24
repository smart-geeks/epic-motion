'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error Boundary]', error);
  }, [error]);

  return (
    <html>
      <body className="bg-epic-black min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 text-center shadow-2xl">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            Error inesperado
          </h2>

          <p className="text-sm text-white/50 mb-6">
            Ha ocurrido un error en la aplicación. Por favor intenta de nuevo.
          </p>

          {error.digest && (
            <p className="text-xs text-white/25 font-mono mb-4">
              Ref: {error.digest}
            </p>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                bg-amber-500/10 text-amber-400 border border-amber-500/20
                hover:bg-amber-500/20 transition-all duration-200"
            >
              <RotateCcw size={14} />
              Reintentar
            </button>

            <Link
              href="/"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                text-white/60 border border-white/10
                hover:text-white hover:border-white/20 transition-all duration-200"
            >
              <Home size={14} />
              Inicio
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
