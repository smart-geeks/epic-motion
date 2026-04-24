'use client';

import { Download } from 'lucide-react';

export default function BotonExportar() {
  return (
    <button 
      onClick={() => window.print()}
      className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest"
    >
      <Download size={16} />
      Exportar
    </button>
  );
}
