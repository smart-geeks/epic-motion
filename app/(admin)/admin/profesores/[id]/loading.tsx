import { Loader2 } from 'lucide-react';

export default function ProfesorDetailLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-epic-gold/20 blur-xl rounded-full" />
        <div className="relative w-16 h-16 glass-card rounded-2xl flex items-center justify-center border-white/10">
          <Loader2 className="w-8 h-8 text-epic-gold animate-spin" />
        </div>
      </div>
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-montserrat font-bold text-white tracking-wide">
          Cargando Perfil...
        </h2>
        <p className="text-sm font-inter text-white/40">
          Obteniendo datos y métricas del profesor
        </p>
      </div>
    </div>
  );
}
