import Image from 'next/image';
import { MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-epic-black border-t border-white/5 py-12 px-4">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-6">
        {/* Logo */}
        <Image
          src="/logo.png"
          alt="Epic Motion"
          width={100}
          height={36}
          className="h-9 w-auto object-contain opacity-80"
        />

        {/* Nombre */}
        <div>
          <p className="font-montserrat font-extrabold text-lg tracking-[0.12em] text-white uppercase">
            Epic Motion
          </p>
          <p className="font-montserrat font-light text-xs tracking-[0.1em] text-epic-silver uppercase mt-1">
            High Performance Dance Studio
          </p>
        </div>

        {/* Slogan */}
        <p className="font-montserrat font-light text-xs tracking-[0.1em] text-epic-gold uppercase">
          Consciente · Constante · Correcto
        </p>

        {/* Ubicación */}
        <div className="flex items-center gap-2 text-epic-silver">
          <MapPin size={14} className="text-epic-gold flex-shrink-0" />
          <span className="font-inter text-xs">Torreón, Coahuila, México</span>
        </div>

        {/* Divider */}
        <div className="w-full max-w-xs h-px bg-white/10" />

        {/* Copyright */}
        <p className="font-inter text-xs text-white/30">
          © 2026 Epic Motion Dance Studio. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
