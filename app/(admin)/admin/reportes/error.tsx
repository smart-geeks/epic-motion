'use client';

import { useEffect } from 'react';

export default function ReportesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Reportes Error:', error);
  }, [error]);

  return (
    <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
      <h2 className="text-xl font-bold text-red-400 mb-2">¡Algo salió mal!</h2>
      <p className="text-white/70 mb-4">{error.message}</p>
      <pre className="text-xs text-white/50 overflow-auto max-h-[300px] mb-4">
        {error.stack}
      </pre>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
