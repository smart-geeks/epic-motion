'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, CalendarCheck, CreditCard, UserCheck,
  TrendingUp, Activity, Zap, AlertCircle, Clock, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { notificarRetraso } from '@/lib/actions/staff-actions';
import { useState } from 'react';

import BotonNuevaInscripcion from '@/components/inscripciones/BotonNuevaInscripcion';

interface Metrics {
  totalAlumnas: number;
  clasesHoy: number;
  pagosPendientes: number;
  maestrosActivos: number;
  asistenciasHoy: number;
  clasesRetrasadas: {
    id: string;
    clase: string;
    maestro: string;
    horaInicio: string;
  }[];
}

interface Props {
  nombre: string;
  datosInscripcion: {
    grupos: any[];
    cuotaInscripcion: number;
    cicloEscolar: string;
  };
  metrics: Metrics;
}

const LIQUID_SPRING = { type: 'spring', mass: 0.4, damping: 20, stiffness: 110 } as const;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 15, scale: 0.98 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: LIQUID_SPRING },
};

/* ── Componentes internos ────────────────────────────────────────────── */

function MetricCard({
  label, valor, sub, icon: Icon, iconBg, iconClr,
}: {
  label: string;
  valor: string | number;
  sub: string;
  icon: any;
  iconBg: string;
  iconClr: string;
}) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.02, transition: { type: 'spring', mass: 0.3, damping: 16, stiffness: 140 } }}
      className="glass-card rounded-[2rem] p-5 flex items-center gap-4 cursor-default relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg} relative z-10`}>
        <Icon size={20} className={iconClr} />
      </div>
      <div className="min-w-0 relative z-10">
        <p className="text-2xl font-montserrat font-extrabold text-white tracking-tight leading-none">
          {valor}
        </p>
        <p className="text-[11px] font-montserrat font-bold text-white/40 mt-1 tracking-wider uppercase">{label}</p>
        <p className="text-[10px] font-inter text-white/20 mt-0.5 tracking-[-0.01em]">{sub}</p>
      </div>
    </motion.div>
  );
}

function AlertItem({ id, clase, maestro, horaInicio }: { id: string, clase: string, maestro: string, horaInicio: string }) {
  const [loading, setLoading] = useState(false);

  const handleNotify = async () => {
    setLoading(true);
    const result = await notificarRetraso(id, maestro);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error('Error al enviar notificación');
    }
    setLoading(false);
  };

  return (
    <div className="bg-black/20 rounded-2xl p-3 border border-white/5 flex items-center justify-between group">
      <div className="min-w-0">
        <p className="text-xs font-bold text-white truncate">{clase}</p>
        <p className="text-[10px] text-white/40 truncate">{maestro} • {horaInicio}</p>
      </div>
      <button 
        onClick={handleNotify}
        disabled={loading}
        className="text-[10px] font-bold text-epic-gold hover:text-white transition-colors bg-epic-gold/10 hover:bg-epic-gold/20 px-3 py-1.5 rounded-lg shrink-0 disabled:opacity-50 min-w-[80px]"
      >
        {loading ? '...' : 'Notificar'}
      </button>
    </div>
  );
}

/* ── Dashboard principal ──────────────────────────────────────────────── */

export default function DashboardBento({ nombre, datosInscripcion, metrics }: Props) {
  const displayMetrics = [
    {
      label:    'Alumnas',
      valor:    metrics.totalAlumnas,
      sub:      'Estatus: Activas',
      icon:     Users,
      iconBg:   'bg-blue-500/10',
      iconClr:  'text-blue-400',
    },
    {
      label:    'Clases Hoy',
      valor:    metrics.clasesHoy,
      sub:      'En calendario',
      icon:     CalendarCheck,
      iconBg:   'bg-epic-gold/10',
      iconClr:  'text-epic-gold',
    },
    {
      label:    'Pendientes',
      valor:    metrics.pagosPendientes,
      sub:      'Cargos por liquidar',
      icon:     CreditCard,
      iconBg:   'bg-red-500/10',
      iconClr:  'text-red-400',
    },
    {
      label:    'Staff',
      valor:    metrics.maestrosActivos,
      sub:      'Profesores activos',
      icon:     UserCheck,
      iconBg:   'bg-green-500/10',
      iconClr:  'text-green-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado Adaptativo */}
      <motion.div
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LIQUID_SPRING}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-epic-gold/30 hidden sm:block" />
            <p className="font-montserrat font-bold text-[10px] tracking-[0.25em] uppercase text-white/30">
              Centro de Mando
            </p>
          </div>
          <h1 className="text-3xl font-montserrat font-extrabold text-white tracking-tight">
            Resumen de <span className="text-epic-gold">Operación</span>
          </h1>
          <p className="text-sm font-inter text-white/40">
            Hola de nuevo, <span className="text-white/70 font-medium">{nombre}</span>. Esto pasa hoy en la academia.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
            <BotonNuevaInscripcion 
              gruposIniciales={datosInscripcion.grupos} 
              cuotaInicial={datosInscripcion.cuotaInscripcion} 
              cicloInicial={datosInscripcion.cicloEscolar} 
            />
        </div>
      </motion.div>

      {/* ── Alertas de Check-in ─────────────────────── */}
      <AnimatePresence>
        {metrics.clasesRetrasadas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card border-red-500/20 bg-red-500/5 rounded-[2rem] p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <AlertCircle size={80} className="text-red-500" />
              </div>
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                  <AlertCircle size={18} className="text-red-500" />
                </div>
                <div>
                  <h3 className="font-montserrat font-bold text-white text-sm">Alerta de Puntualidad</h3>
                  <p className="text-[11px] text-red-400 font-medium">Clases sin check-in registrado</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
                {metrics.clasesRetrasadas.map(a => (
                  <AlertItem key={a.id} {...a} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Métricas Principales (Grid Adaptativo) ────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {displayMetrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </motion.div>

      {/* ── Paneles Secundarios ────────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Asistencia en Tiempo Real */}
        <motion.div variants={cardVariants} className="glass-card rounded-[2.5rem] p-7 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                 <CheckCircle2 size={20} className="text-green-400" />
              </div>
              <div>
                <h3 className="font-montserrat font-bold text-white tracking-tight">Actividad de Hoy</h3>
                <p className="text-xs text-white/30 truncate">Flujo de alumnas por sesión</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-montserrat font-extrabold text-white">{metrics.asistenciasHoy}</p>
              <p className="text-[10px] font-bold text-green-400 tracking-wider">REGISTROS</p>
            </div>
          </div>
          
          <div className="h-32 bg-white/[0.02] rounded-3xl border border-dashed border-white/5 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Activity size={24} className="text-white/10" />
              <p className="text-[11px] font-medium text-white/20 uppercase tracking-widest">
                Monitoreo en Vivo
              </p>
            </div>
          </div>
        </motion.div>

        {/* Acciones Rápidas / Estado del Sistema */}
        <motion.div variants={cardVariants} className="glass-card rounded-[2.5rem] p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                 <Zap size={20} className="text-epic-gold" />
              </div>
              <h3 className="font-montserrat font-bold text-white tracking-tight">Estatus</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between group">
                <span className="text-sm text-white/40 group-hover:text-white/60 transition-colors">Ciclo Escolar</span>
                <span className="text-xs font-bold text-white bg-white/5 px-3 py-1 rounded-full">{datosInscripcion.cicloEscolar}</span>
              </div>
              <div className="flex items-center justify-between group">
                <span className="text-sm text-white/40 group-hover:text-white/60 transition-colors">Próximo Corte</span>
                <span className="text-xs font-bold text-epic-gold">01 May</span>
              </div>
              <div className="flex items-center justify-between group">
                <span className="text-sm text-white/40 group-hover:text-white/60 transition-colors">Estado del Cron</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-green-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Activo
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-white/5">
            <button className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white/70 text-xs font-bold rounded-2xl transition-all tracking-wider uppercase">
              Ver Reportes Full
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
