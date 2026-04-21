interface CapacityBarProps {
  inscritos: number;
  cupo: number;
}

export default function CapacityBar({ inscritos, cupo }: CapacityBarProps) {
  const pct = cupo > 0 ? Math.min((inscritos / cupo) * 100, 100) : 0;
  
  // Colores premium con gradiente/glow
  const colorClass = pct >= 90 
    ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' 
    : pct >= 70 
    ? 'bg-epic-gold shadow-[0_0_8px_rgba(255,184,3,0.3)]' 
    : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]';

  return (
    <div className="space-y-1.5 group/cap">
      <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`} 
          style={{ width: `${pct}%` }} 
        />
      </div>
      <div className="flex justify-between items-center px-0.5">
        <p className="font-montserrat font-bold text-[9px] uppercase tracking-widest text-white/20 group-hover/cap:text-white/40 transition-colors">
          Capacidad
        </p>
        <p className="font-inter text-[10px] text-white/40 font-medium">
          <span className="text-white/80 font-bold">{inscritos}</span><span className="text-white/20 mx-1">/</span>{cupo}
        </p>
      </div>
    </div>
  );
}
