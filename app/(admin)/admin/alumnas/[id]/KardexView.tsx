'use client';

import { useState } from 'react';
import { 
  AlertTriangle, 
  BookOpen, 
  TrendingUp, 
  User, 
  FileText, 
  PlusCircle,
  CreditCard,
  MapPin,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type EstadoCargo = 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'CANCELADO';
type EstadoAsistencia = 'PRESENTE' | 'TARDE' | 'AUSENTE';
type EstatusAlumna = 'ACTIVA' | 'INACTIVA' | 'PRUEBA';

interface KardexData {
  alumna: {
    id: string;
    nombre: string;
    apellido: string;
    foto: string | null;
    estatus: EstatusAlumna;
    fechaNacimiento: string;
    otraAcademia: string | null;
    enfermedadLesion: string | null;
    canalContacto: string | null;
    grupo: string | null;
    padre: {
      nombre: string;
      apellido: string;
      email: string;
      telefono: string | null;
      telefonoTrabajo: string | null;
      nombreConyuge: string | null;
      celularConyuge: string | null;
      emailConyuge: string | null;
      telefonoTrabajoConyuge: string | null;
    };
  };
  totalVencido: number;
  porcentajeAsistenciaMes: number | null;
  cargos: { id: string; concepto: string; monto: number; fechaVencimiento: string; estado: EstadoCargo }[];
  asistencias: { id: string; estado: EstadoAsistencia; fecha: string; clase: string; observacion: string | null }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(n);

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

function calcularEdad(fechaISO: string) {
  const hoy = new Date();
  const nac = new Date(fechaISO);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

// ─── Componentes de UI Internos ──────────────────────────────────────────────

function Semaforo({ estatus, tieneDeuda }: { estatus: EstatusAlumna; tieneDeuda: boolean }) {
  if (estatus === 'INACTIVA') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
        Baja
      </span>
    );
  }
  if (estatus === 'PRUEBA') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
        En prueba
      </span>
    );
  }
  if (tieneDeuda) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.1)]">
        <AlertTriangle size={10} className="shrink-0" />
        Alerta de Pago
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 animate-pulse" />
      Alumna Activa
    </span>
  );
}

function CargoBadge({ estado }: { estado: EstadoCargo }) {
  const map: Record<EstadoCargo, string> = {
    PAGADO: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    PENDIENTE: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    VENCIDO: 'bg-red-500/10 text-red-400 border border-red-500/20',
    CANCELADO: 'bg-white/5 text-white/40 border border-white/10',
  };
  const labels: Record<EstadoCargo, string> = {
    PAGADO: 'PAGADO', PENDIENTE: 'PENDIENTE', VENCIDO: 'VENCIDO', CANCELADO: 'CANCELADO',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-widest ${map[estado]}`}>
      {labels[estado]}
    </span>
  );
}

function AsistenciaBadge({ estado }: { estado: EstadoAsistencia }) {
  const map: Record<EstadoAsistencia, string> = {
    PRESENTE: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    TARDE: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    AUSENTE: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };
  const labels: Record<EstadoAsistencia, string> = {
    PRESENTE: 'Presente', TARDE: 'Retardo', AUSENTE: 'Falta',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide ${map[estado]}`}>
      {labels[estado]}
    </span>
  );
}

function InfoItem({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon?: any }) {
  return (
    <div className="flex gap-3 group">
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-epic-gold/10 group-hover:border-epic-gold/20 transition-colors">
          <Icon size={14} className="text-white/20 group-hover:text-epic-gold transition-colors" />
        </div>
      )}
      <div className="min-w-0">
        <p className="font-montserrat font-bold text-[9px] uppercase tracking-[0.15em] text-white/30 mb-0.5">{label}</p>
        <p className="font-inter text-sm text-white/80 font-medium truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

// ─── Tabs Nav ─────────────────────────────────────────────────────────────────

type Tab = 'info' | 'finanzas' | 'desempeno';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'info', label: 'EXPEDIENTE', icon: User },
  { id: 'finanzas', label: 'FINANZAS', icon: BookOpen },
  { id: 'desempeno', label: 'DESEMPEÑO', icon: TrendingUp },
];

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function KardexView({ data }: { data: KardexData }) {
  const [tab, setTab] = useState<Tab>('info');
  const { alumna, totalVencido, porcentajeAsistenciaMes, cargos, asistencias } = data;
  const tieneDeuda = totalVencido > 0;
  const iniciales = `${alumna.nombre[0]}${alumna.apellido[0]}`.toUpperCase();
  const edad = calcularEdad(alumna.fechaNacimiento);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* ── Perfil Hero ───────────────────────────────────────────────────── */}
      <div className="glass-card rounded-[2rem] border-white/5 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        {/* Adorno de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-epic-gold/5 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar Premium */}
          <div className="relative group">
            {alumna.foto ? (
              <img
                src={alumna.foto}
                alt={`${alumna.nombre} ${alumna.apellido}`}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] object-cover border-2 border-white/10 group-hover:border-epic-gold/40 transition-all duration-500 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-gradient-to-br from-epic-gold/20 to-epic-gold/5 border border-white/10 group-hover:border-epic-gold/40 flex items-center justify-center transition-all duration-500 shadow-xl">
                <span className="font-montserrat font-bold text-3xl text-epic-gold">{iniciales}</span>
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-black border border-white/10 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
              <span className="text-[10px] font-bold text-white/40">{edad}</span>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-montserrat font-bold text-2xl sm:text-3xl text-white tracking-tight">
                  {alumna.nombre} <span className="text-white/40">{alumna.apellido}</span>
                </h1>
                <Semaforo estatus={alumna.estatus} tieneDeuda={tieneDeuda} />
              </div>
              <p className="font-inter text-sm text-epic-silver/60 flex items-center gap-2">
                <MapPin size={14} className="text-epic-gold/50" />
                {alumna.grupo || 'Sin grupo asignado'}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-1">
              <InfoItem label="Folio ID" value={alumna.id.slice(-6).toUpperCase()} />
              <InfoItem label="Nacimiento" value={fmtFecha(alumna.fechaNacimiento)} />
              <InfoItem label="Inscripción" value={fmtFecha(alumna.fechaNacimiento)} />
            </div>
          </div>

          {/* Quick Stats side block */}
          <div className="w-full sm:w-auto flex sm:flex-col gap-3 shrink-0">
            {tieneDeuda && (
              <div className="flex-1 glass-card bg-red-500/5 border-red-500/20 px-5 py-4 rounded-2xl shadow-inner group">
                <p className="font-montserrat font-bold text-[9px] uppercase tracking-[0.2em] text-red-400/60 mb-0.5">Pendiente</p>
                <p className="font-montserrat font-bold text-xl text-red-400 group-hover:scale-105 transition-transform">{fmt(totalVencido)}</p>
              </div>
            )}
            <div className="flex-1 glass-card bg-epic-gold/5 border-epic-gold/20 px-5 py-4 rounded-2xl shadow-inner group">
              <p className="font-montserrat font-bold text-[9px] uppercase tracking-[0.2em] text-epic-gold/60 mb-0.5">Asistencia</p>
              <p className="font-montserrat font-bold text-xl text-white group-hover:scale-105 transition-transform">{porcentajeAsistenciaMes || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navegación interna ────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl border-white/5 p-1.5 flex gap-1 shadow-lg">
        {TABS.map((t) => {
          const activo = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                'flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl font-montserrat font-bold text-[10px] tracking-[0.15em] transition-all duration-300',
                activo ? 'bg-epic-gold text-black shadow-lg scale-[1.02]' : 'text-white/40 hover:text-white/60 hover:bg-white/[0.02]'
              ].join(' ')}
            >
              <t.icon size={13} strokeWidth={activo ? 3 : 2} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Contenido con Transiciones ──────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-6"
        >
          {/* TAB: INFORMACIÓN */}
          {tab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna Alumna */}
              <div className="glass-card rounded-[2rem] border-white/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <h3 className="font-montserrat font-bold text-xs uppercase tracking-widest text-white/50">Datos Personales</h3>
                  <User size={14} className="text-white/20" />
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-6">
                    <InfoItem label="Canal de Contacto" value={alumna.canalContacto} icon={Phone} />
                    <InfoItem label="Edad Actual" value={`${edad} años`} icon={Calendar} />
                  </div>
                  <InfoItem label="Historial Médico / Lesiones" value={alumna.enfermedadLesion} icon={AlertTriangle} />
                  <InfoItem label="Experiencia Previa" value={alumna.otraAcademia} icon={BookOpen} />
                </div>
              </div>

              {/* Columna Tutor */}
              <div className="glass-card rounded-[2rem] border-white/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <h3 className="font-montserrat font-bold text-xs uppercase tracking-widest text-white/50">Contacto Principal</h3>
                  <Phone size={14} className="text-white/20" />
                </div>
                <div className="p-6 space-y-5">
                  <InfoItem label="Padre / Madre / Tutor" value={`${alumna.padre.nombre} ${alumna.padre.apellido}`} icon={User} />
                  <div className="grid grid-cols-2 gap-6">
                    <InfoItem label="Email de Contacto" value={alumna.padre.email} icon={Mail} />
                    <InfoItem label="Teléfono" value={alumna.padre.telefono} icon={Phone} />
                  </div>
                  {alumna.padre.nombreConyuge && (
                    <div className="pt-4 mt-4 border-t border-white/5 space-y-4">
                      <InfoItem label="Segundo Contacto" value={alumna.padre.nombreConyuge} icon={User} />
                      <div className="grid grid-cols-2 gap-6">
                        <InfoItem label="Email" value={alumna.padre.emailConyuge} icon={Mail} />
                        <InfoItem label="Celular" value={alumna.padre.celularConyuge} icon={Phone} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: FINANZAS */}
          {tab === 'finanzas' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(['PENDIENTE', 'VENCIDO', 'PAGADO'] as EstadoCargo[]).map((estado) => {
                  const items = cargos.filter((c) => c.estado === estado);
                  const total = items.reduce((s, c) => s + c.monto, 0);
                  const styles: Record<string, string> = {
                    PENDIENTE: 'from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-500',
                    VENCIDO: 'from-red-500/10 to-red-500/5 border-red-500/20 text-red-500',
                    PAGADO: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-500',
                  };
                  const labels: Record<string, string> = { PENDIENTE: 'PENDIENTES', VENCIDO: 'VENCIDOS', PAGADO: 'TOTAL PAGADO' };
                  return (
                    <div key={estado} className={`glass-card rounded-2xl border p-5 bg-gradient-to-br shadow-xl ${styles[estado]}`}>
                      <p className="font-montserrat font-bold text-[9px] uppercase tracking-[0.2em] opacity-60 mb-2">{labels[estado]}</p>
                      <div className="flex items-end justify-between">
                        <p className="font-montserrat font-bold text-2xl tracking-tighter">{fmt(total)}</p>
                        <p className="font-inter text-[10px] font-bold opacity-40">{items.length} items</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="glass-card rounded-[2rem] border-white/5 overflow-hidden shadow-2xl">
                <div className="px-8 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <h3 className="font-montserrat font-bold text-xs uppercase tracking-widest text-white/50">Historial de Cargos</h3>
                  <CreditCard size={14} className="text-white/20" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-inter">
                    <thead>
                      <tr className="bg-white/[0.01]">
                        <th className="text-left px-8 py-4 font-bold text-[10px] uppercase tracking-widest text-white/30">Concepto</th>
                        <th className="text-right px-8 py-4 font-bold text-[10px] uppercase tracking-widest text-white/30">Monto</th>
                        <th className="text-left px-8 py-4 font-bold text-[10px] uppercase tracking-widest text-white/30">Vencimiento</th>
                        <th className="text-center px-8 py-4 font-bold text-[10px] uppercase tracking-widest text-white/30">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {cargos.length === 0 ? (
                        <tr><td colSpan={4} className="px-8 py-10 text-center text-white/20 font-medium">Sin movimientos financieros</td></tr>
                      ) : (
                        cargos.map((c) => (
                          <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group text-white/80">
                            <td className="px-8 py-4 font-bold group-hover:text-epic-gold transition-colors">{c.concepto}</td>
                            <td className="px-8 py-4 text-right font-mono">{fmt(c.monto)}</td>
                            <td className="px-8 py-4 text-white/40">{fmtFecha(c.fechaVencimiento)}</td>
                            <td className="px-8 py-4 text-center"><CargoBadge estado={c.estado} /></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DESEMPEÑO */}
          {tab === 'desempeno' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Score de Asistencia */}
                <div className="glass-card rounded-[2rem] border-white/5 p-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                      <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * (porcentajeAsistenciaMes || 0)) / 100} className="text-epic-gold drop-shadow-[0_0_8px_rgba(255,184,3,0.5)] transition-all duration-1000" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-montserrat font-bold text-3xl text-white">{porcentajeAsistenciaMes || 0}%</span>
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Score</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-montserrat font-bold text-sm text-white mb-1">Consistencia en Clase</h4>
                    <p className="text-xs text-white/40 font-inter max-w-[200px]">Basado en el registro de asistencias del mes actual.</p>
                  </div>
                </div>

                {/* Últimos Eventos */}
                <div className="glass-card rounded-[2rem] border-white/5 overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <h3 className="font-montserrat font-bold text-xs uppercase tracking-widest text-white/50">Últimas Asistencias</h3>
                    <Calendar size={14} className="text-white/20" />
                  </div>
                  <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {asistencias.length === 0 ? (
                      <p className="px-6 py-10 text-center text-white/20 text-xs text-white/40">Sin registros</p>
                    ) : (
                      asistencias.map((a) => (
                        <div key={a.id} className="px-6 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                          <div className="min-w-0">
                            <p className="font-inter text-xs font-bold text-white/80 truncate group-hover:text-epic-gold transition-colors">{a.clase}</p>
                            <p className="text-[10px] text-white/30">{fmtFecha(a.fecha)}</p>
                          </div>
                          <AsistenciaBadge estado={a.estado} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Bitácora de Observaciones */}
              <div className="glass-card rounded-[2rem] border-white/5 overflow-hidden">
                <div className="px-8 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-epic-gold/10 flex items-center justify-center">
                      <FileText size={14} className="text-epic-gold" />
                    </div>
                    <h3 className="font-montserrat font-bold text-xs uppercase tracking-widest text-white/50">Bitácora de Seguimiento</h3>
                  </div>
                  <Button variante="secondary" tamano="xs" className="rounded-full px-4 h-8 bg-white/5 border-white/10 hover:bg-epic-gold hover:text-black">
                    <PlusCircle size={14} className="mr-2" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Nueva Nota</span>
                  </Button>
                </div>
                
                <div className="p-8 space-y-6">
                  {asistencias.filter(a => a.observacion).length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <FileText size={40} className="mx-auto text-white/5" />
                      <p className="text-sm font-inter text-white/20 text-white/40">No se han registrado observaciones de comportamiento aún.</p>
                    </div>
                  ) : (
                    asistencias.filter(a => a.observacion).map((a) => (
                      <div key={a.id} className="relative pl-8 pb-8 last:pb-0 group">
                        {/* Timeline line */}
                        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-white/5 group-last:hidden" />
                        <div className="absolute left-0 top-1 w-[22px] h-[22px] rounded-full bg-black border border-epic-gold/30 flex items-center justify-center z-10 group-hover:border-epic-gold transition-colors">
                          <div className="w-2 h-2 rounded-full bg-epic-gold" />
                        </div>
                        
                        <div className="glass-card bg-white/[0.02] rounded-2xl p-5 border-white/5 group-hover:border-white/10 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-montserrat font-bold text-[10px] text-epic-gold uppercase tracking-widest">{a.clase}</h5>
                            <span className="font-inter text-[10px] text-white/30">{fmtFecha(a.fecha)}</span>
                          </div>
                          <p className="font-inter text-sm text-white/70 leading-relaxed italic">
                            "{a.observacion}"
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
