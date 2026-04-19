import { Check } from 'lucide-react';
import { FMT_MXN } from '@/lib/format';

interface CargoBadgeProps {
  pendientes: number;
  vencidos: number;
  monto: number;
}

export default function CargoBadge({ pendientes, vencidos, monto }: CargoBadgeProps) {
  if (vencidos > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-inter font-medium bg-red-500/10 text-red-400 border border-red-500/20">
        {vencidos} vencido{vencidos !== 1 ? 's' : ''} · {FMT_MXN.format(monto)}
      </span>
    );
  }
  if (pendientes > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-inter font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        {pendientes} pendiente{pendientes !== 1 ? 's' : ''} · {FMT_MXN.format(monto)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-inter font-medium bg-green-500/10 text-green-400 border border-green-500/20">
      <Check size={9} strokeWidth={3} /> Al día
    </span>
  );
}
