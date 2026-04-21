'use client';

import { 
  CircleDollarSign, 
  CreditCard, 
  Receipt, 
  Settings2, 
  Tags,
  BadgePercent
} from 'lucide-react';
import ConfigCard from '@/components/ui/ConfigCard';

const FINANCIAL_MODULES = [
  {
    title: 'Catálogo de Tarifas',
    desc: 'Mensualidades, inscripciones, y uniformes por niveles.',
    icon: Tags,
    color: 'text-green-400',
    bg: 'bg-green-500/10'
  },
  {
    title: 'Métodos de Pago',
    desc: 'Configura terminales, transferencias y pagos en línea.',
    icon: CreditCard,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10'
  },
  {
    title: 'Reglas de Descuento',
    desc: 'Descuentos por hermanos, pronto pago y becas.',
    icon: BadgePercent,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10'
  },
  {
    title: 'Facturación Global',
    desc: 'Configuración de datos fiscales y serie de recibos.',
    icon: Receipt,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10'
  },
  {
    title: 'Día de Corte',
    desc: 'Define el día global para generación de cargos.',
    icon: Settings2,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10'
  }
];

export default function TabTarifas() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FINANCIAL_MODULES.map((mod) => (
          <ConfigCard key={mod.title} interactive>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-2xl ${mod.bg} flex items-center justify-center shrink-0`}>
                <mod.icon size={22} className={mod.color} />
              </div>
              <h3 className="font-montserrat font-bold text-white tracking-tight">
                {mod.title}
              </h3>
            </div>
            <p className="text-sm font-inter text-white/40 leading-relaxed ps-1">
              {mod.desc}
            </p>
          </ConfigCard>
        ))}
      </div>
    </div>
  );
}
