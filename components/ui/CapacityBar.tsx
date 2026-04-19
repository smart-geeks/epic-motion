interface CapacityBarProps {
  inscritos: number;
  cupo: number;
}

export default function CapacityBar({ inscritos, cupo }: CapacityBarProps) {
  const pct = cupo > 0 ? Math.min((inscritos / cupo) * 100, 100) : 0;
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-green-500';
  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="font-inter text-xs dark:text-white/40 text-gray-500">
        {inscritos} / {cupo} alumnas
      </p>
    </div>
  );
}
