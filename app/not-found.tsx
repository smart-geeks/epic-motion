import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-epic-black flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Número 404 estilizado */}
        <div className="relative mb-8">
          <span className="text-[120px] font-montserrat font-black leading-none bg-gradient-to-b from-white/20 to-white/[0.03] bg-clip-text text-transparent select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-epic-gold/10 border border-epic-gold/20 flex items-center justify-center">
              <Search className="w-7 h-7 text-epic-gold" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-montserrat font-bold text-white mb-3 tracking-tight">
          Página no encontrada
        </h1>

        <p className="text-sm text-white/50 mb-8 font-inter max-w-sm mx-auto">
          La página que buscas no existe o fue movida a otra ubicación.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-inter font-medium
            bg-epic-gold/10 text-epic-gold border border-epic-gold/20
            hover:bg-epic-gold/20 transition-all duration-200"
        >
          <ArrowLeft size={14} />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
