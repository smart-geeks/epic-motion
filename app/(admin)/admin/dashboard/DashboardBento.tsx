'use client';

import { motion } from 'framer-motion';
import {
  Users, CalendarCheck, CreditCard, UserCheck,
  TrendingUp, Activity, Zap,
} from 'lucide-react';

interface Props {
  nombre: string;
}

const LIQUID_SPRING = { type: 'spring', mass: 0.4, damping: 20, stiffness: 110 } as const;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: LIQUID_SPRING },
};

/* ── Datos placeholder ────────────────────────────────────────────────── */

const METRICS = [
  {
    label:    'Total alumnas',
    valor:    '—',
    sub:      'En todos los grupos',
    icon:     Users,
    iconBg:   'bg-blue-500/10',
    iconClr:  'text-blue-400',
    accent:   'rgba(59,130,246,0.08)',
    glow:     '0 0 30px rgba(59,130,246,0.10)',
    col:      'col-span-1',
  },
  {
    label:    'Clases hoy',
    valor:    '—',
    sub:      'Programadas',
    icon:     CalendarCheck,
    iconBg:   'bg-epic-gold/10',
    iconClr:  'text-epic-gold',
    accent:   'rgba(201,162,39,0.08)',
    glow:     '0 0 30px rgba(201,162,39,0.12)',
    col:      'col-span-1',
  },
  {
    label:    'Pagos pendientes',
    valor:    '—',
    sub:      'Por liquidar',
    icon:     CreditCard,
    iconBg:   'bg-red-500/10',
    iconClr:  'text-red-400',
    accent:   'rgba(239,68,68,0.08)',
    glow:     '0 0 30px rgba(239,68,68,0.10)',
    col:      'col-span-1',
  },
  {
    label:    'Maestros activos',
    valor:    '—',
    sub:      'En plantilla',
    icon:     UserCheck,
    iconBg:   'bg-green-500/10',
    iconClr:  'text-green-400',
    accent:   'rgba(34,197,94,0.08)',
    glow:     '0 0 30px rgba(34,197,94,0.10)',
    col:      'col-span-1',
  },
];

/* ── Componente de tarjeta métrica ───────────────────────────────────── */

function MetricCard({
  label, valor, sub, icon: Icon, iconBg, iconClr,
}: (typeof METRICS)[number]) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.025, transition: { type: 'spring', mass: 0.3, damping: 16, stiffness: 140 } }}
      className="glass-card rounded-3xl p-5 flex items-center gap-4 cursor-default"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={20} className={iconClr} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-montserrat font-bold text-white tracking-[-0.03em] leading-none">
          {valor}
        </p>
        <p className="text-xs font-inter text-white/40 mt-1 tracking-[0.01em]">{label}</p>
        <p className="text-[10px] font-inter text-white/25 mt-0.5 tracking-[0.02em] uppercase">{sub}</p>
      </div>
    </motion.div>
  );
}

/* ── Placeholder de panel grande ─────────────────────────────────────── */

function BigPanel({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <motion.div
      variants={cardVariants}
      className="glass-card rounded-3xl p-6 flex flex-col justify-between min-h-[160px]"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center">
          <Icon size={15} className="text-white/50" />
        </div>
        <p className="font-montserrat font-bold text-xs tracking-[0.12em] uppercase text-white/50">{title}</p>
      </div>
      <p className="font-inter text-sm text-white/25 tracking-[0.01em] mt-4">{sub}</p>
    </motion.div>
  );
}

/* ── Dashboard principal ──────────────────────────────────────────────── */

export default function DashboardBento({ nombre }: Props) {
  return (
    <div>
      {/* Encabezado */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LIQUID_SPRING}
      >
        <p className="font-inter text-xs tracking-[0.18em] uppercase text-white/30 mb-1">
          Panel de control
        </p>
        <h1 className="text-2xl font-montserrat font-bold text-white tracking-[-0.02em]">
          Resumen del día
        </h1>
        <p className="mt-1 text-sm font-inter text-white/40 tracking-[-0.01em]">
          Bienvenida, <span className="text-epic-gold/80">{nombre}</span>.
        </p>
      </motion.div>

      {/* ── Bento Grid ─────────────────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {METRICS.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </motion.div>

      {/* Fila inferior — 3 paneles */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <BigPanel
          icon={TrendingUp}
          title="Actividad reciente"
          sub="El historial de actividad se mostrará aquí en la siguiente fase."
        />
        <BigPanel
          icon={Activity}
          title="Asistencia hoy"
          sub="El resumen de asistencia del día aparecerá cuando se complete el módulo."
        />
        <BigPanel
          icon={Zap}
          title="Acciones rápidas"
          sub="Atajos a las operaciones más frecuentes estarán disponibles pronto."
        />
      </motion.div>
    </div>
  );
}
