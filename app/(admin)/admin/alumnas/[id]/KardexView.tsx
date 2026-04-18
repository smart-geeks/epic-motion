'use client';

import { useState } from 'react';
import { AlertTriangle, BookOpen, TrendingUp, User, FileText, PlusCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

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

// ─── Semáforo de estatus ──────────────────────────────────────────────────────

function Semaforo({ estatus, tieneDeuda }: { estatus: EstatusAlumna; tieneDeuda: boolean }) {
  if (estatus === 'INACTIVA') {
    return (
      <span className="flex items-center gap-1.5 font-inter text-xs font-semibold text-red-400 uppercase tracking-widest">
        <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
        Baja
      </span>
    );
  }
  if (estatus === 'PRUEBA') {
    return (
      <span className="flex items-center gap-1.5 font-inter text-xs font-semibold text-blue-400 uppercase tracking-widest">
        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
        En prueba
      </span>
    );
  }
  if (tieneDeuda) {
    return (
      <span className="flex items-center gap-1.5 font-inter text-xs font-semibold text-amber-400 uppercase tracking-widest">
        <AlertTriangle size={12} className="shrink-0" />
        Alerta — deuda
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 font-inter text-xs font-semibold text-emerald-400 uppercase tracking-widest">
      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
      Activa
    </span>
  );
}

// ─── Badge de estado de cargo ─────────────────────────────────────────────────

function CargoBadge({ estado }: { estado: EstadoCargo }) {
  const map: Record<EstadoCargo, string> = {
    PAGADO: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    PENDIENTE: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
    VENCIDO: 'bg-red-500/15 text-red-400 border border-red-500/25',
    CANCELADO: 'bg-white/10 text-white/40 border border-white/10',
  };
  const labels: Record<EstadoCargo, string> = {
    PAGADO: 'Pagado', PENDIENTE: 'Pendiente', VENCIDO: 'Vencido', CANCELADO: 'Cancelado',
  };
  return (
    <span className={`font-inter text-xs font-semibold px-2 py-0.5 rounded-full ${map[estado]}`}>
      {labels[estado]}
    </span>
  );
}

// ─── Badge de asistencia ──────────────────────────────────────────────────────

function AsistenciaBadge({ estado }: { estado: EstadoAsistencia }) {
  const map: Record<EstadoAsistencia, string> = {
    PRESENTE: 'bg-emerald-500/15 text-emerald-400',
    TARDE: 'bg-amber-500/15 text-amber-400',
    AUSENTE: 'bg-red-500/15 text-red-400',
  };
  const labels: Record<EstadoAsistencia, string> = {
    PRESENTE: 'Presente', TARDE: 'Tarde', AUSENTE: 'Ausente',
  };
  return (
    <span className={`font-inter text-xs font-semibold px-2 py-0.5 rounded-full ${map[estado]}`}>
      {labels[estado]}
    </span>
  );
}

// ─── Campo de detalle ─────────────────────────────────────────────────────────

function Campo({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-inter text-[10px] font-medium uppercase tracking-widest text-white/40">{label}</span>
      <span className="font-inter text-sm text-white">{value || '—'}</span>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'info' | 'finanzas' | 'desempeno';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'info', label: 'Información', icon: <User size={14} /> },
  { id: 'finanzas', label: 'Finanzas', icon: <BookOpen size={14} /> },
  { id: 'desempeno', label: 'Desempeño', icon: <TrendingUp size={14} /> },
];

// ─── Componente principal ─────────────────────────────────────────────────────

export default function KardexView({ data }: { data: KardexData }) {
  const [tab, setTab] = useState<Tab>('info');
  const { alumna, totalVencido, porcentajeAsistenciaMes, cargos, asistencias } = data;
  const tieneDeuda = totalVencido > 0;
  const iniciales = `${alumna.nombre[0]}${alumna.apellido[0]}`.toUpperCase();
  const edad = calcularEdad(alumna.fechaNacimiento);

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="rounded-sm border border-white/10 bg-black/40 overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">

          {/* Avatar */}
          {alumna.foto ? (
            <img
              src={alumna.foto}
              alt={`${alumna.nombre} ${alumna.apellido}`}
              className="w-20 h-20 rounded-full object-cover border-2 border-epic-gold/40 shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-epic-gold/15 border-2 border-epic-gold/40 flex items-center justify-center shrink-0">
              <span className="font-montserrat font-bold text-2xl text-epic-gold">{iniciales}</span>
            </div>
          )}

          {/* Info principal */}
          <div className="flex-1 min-w-0 space-y-1">
            <h1 className="font-montserrat font-bold text-2xl text-white tracking-wide leading-tight">
              {alumna.nombre} {alumna.apellido}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {alumna.grupo && (
                <span className="font-inter text-sm text-epic-silver">{alumna.grupo}</span>
              )}
              <span className="font-inter text-xs text-white/40">{edad} años</span>
              <Semaforo estatus={alumna.estatus} tieneDeuda={tieneDeuda} />
            </div>
          </div>

          {/* Total vencido */}
          {tieneDeuda && (
            <div className="shrink-0 text-right">
              <p className="font-inter text-[10px] uppercase tracking-widest text-red-400/70 mb-0.5">Total vencido</p>
              <p className="font-montserrat font-bold text-2xl text-red-400">{fmt(totalVencido)}</p>
            </div>
          )}
        </div>

        {/* Tabs nav */}
        <div className="border-t border-white/8 flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                'flex-1 flex items-center justify-center gap-2 py-3 font-inter text-sm font-medium transition-colors',
                tab === t.id
                  ? 'text-epic-gold border-b-2 border-epic-gold'
                  : 'text-white/40 hover:text-white/70 border-b-2 border-transparent',
              ].join(' ')}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Información ────────────────────────────────────────────── */}
      {tab === 'info' && (
        <div className="space-y-4">

          {/* Datos de la alumna */}
          <section className="rounded-sm border border-white/10 bg-black/40 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/8">
              <span className="font-montserrat font-bold text-xs tracking-[0.15em] uppercase text-white">
                Datos de la alumna
              </span>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
              <Campo label="Nombre completo" value={`${alumna.nombre} ${alumna.apellido}`} />
              <Campo label="Fecha de nacimiento" value={fmtFecha(alumna.fechaNacimiento)} />
              <Campo label="Edad" value={`${edad} años`} />
              <Campo label="Canal preferido" value={alumna.canalContacto} />
              <Campo label="Institución educativa" value={alumna.enfermedadLesion} />
              <Campo label="Grupo inscrito" value={alumna.grupo} />
            </div>
          </section>

          {/* Datos del tutor */}
          <section className="rounded-sm border border-white/10 bg-black/40 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/8">
              <span className="font-montserrat font-bold text-xs tracking-[0.15em] uppercase text-white">
                Padre / Madre / Tutor
              </span>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
              <Campo label="Tutor principal" value={`${alumna.padre.nombre} ${alumna.padre.apellido}`} />
              <Campo label="Email" value={alumna.padre.email} />
              <Campo label="Celular" value={alumna.padre.telefono} />
              <Campo label="Tel. trabajo" value={alumna.padre.telefonoTrabajo} />
              {alumna.padre.nombreConyuge && (
                <>
                  <Campo label="Cónyuge" value={alumna.padre.nombreConyuge} />
                  <Campo label="Cel. cónyuge" value={alumna.padre.celularConyuge} />
                  <Campo label="Email cónyuge" value={alumna.padre.emailConyuge} />
                  <Campo label="Tel. trabajo cónyuge" value={alumna.padre.telefonoTrabajoConyuge} />
                </>
              )}
            </div>
          </section>

          {/* Salud / academia anterior */}
          {(alumna.enfermedadLesion || alumna.otraAcademia) && (
            <section className="rounded-sm border border-amber-500/25 bg-amber-500/5 overflow-hidden">
              <div className="px-5 py-3 border-b border-amber-500/15 flex items-center gap-2">
                <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                <span className="font-montserrat font-bold text-xs tracking-[0.15em] uppercase text-amber-400">
                  Notas del expediente
                </span>
              </div>
              <div className="p-5 space-y-3">
                {alumna.enfermedadLesion && (
                  <div>
                    <p className="font-inter text-[10px] uppercase tracking-widest text-amber-400/70 mb-1">Enfermedad / Lesión</p>
                    <p className="font-inter text-sm text-white">{alumna.enfermedadLesion}</p>
                  </div>
                )}
                {alumna.otraAcademia && (
                  <div>
                    <p className="font-inter text-[10px] uppercase tracking-widest text-white/40 mb-1">Academia anterior</p>
                    <p className="font-inter text-sm text-white">{alumna.otraAcademia}</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Tab: Finanzas ────────────────────────────────────────────────── */}
      {tab === 'finanzas' && (
        <div className="space-y-4">

          {/* Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(['PENDIENTE', 'VENCIDO', 'PAGADO'] as EstadoCargo[]).map((estado) => {
              const items = cargos.filter((c) => c.estado === estado);
              const total = items.reduce((s, c) => s + c.monto, 0);
              const colors: Record<string, string> = {
                PENDIENTE: 'border-amber-500/20 text-amber-400',
                VENCIDO: 'border-red-500/20 text-red-400',
                PAGADO: 'border-emerald-500/20 text-emerald-400',
              };
              const labels: Record<string, string> = { PENDIENTE: 'Por cobrar', VENCIDO: 'Vencido', PAGADO: 'Cobrado' };
              return (
                <div key={estado} className={`rounded-sm border bg-black/40 px-4 py-3 ${colors[estado]}`}>
                  <p className="font-inter text-[10px] uppercase tracking-widest opacity-60 mb-1">{labels[estado]}</p>
                  <p className="font-montserrat font-bold text-xl">{fmt(total)}</p>
                  <p className="font-inter text-xs opacity-50 mt-0.5">{items.length} cargo{items.length !== 1 ? 's' : ''}</p>
                </div>
              );
            })}
          </div>

          {/* Tabla de cargos */}
          <section className="rounded-sm border border-white/10 bg-black/40 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/8">
              <span className="font-montserrat font-bold text-xs tracking-[0.15em] uppercase text-white">
                Historial de cargos
              </span>
            </div>
            {cargos.length === 0 ? (
              <p className="font-inter text-sm text-white/30 p-5 text-center">Sin cargos registrados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="text-left px-5 py-2.5 font-inter text-[10px] font-medium uppercase tracking-widest text-white/40">Concepto</th>
                      <th className="text-right px-5 py-2.5 font-inter text-[10px] font-medium uppercase tracking-widest text-white/40">Monto</th>
                      <th className="text-left px-5 py-2.5 font-inter text-[10px] font-medium uppercase tracking-widest text-white/40">Vencimiento</th>
                      <th className="text-left px-5 py-2.5 font-inter text-[10px] font-medium uppercase tracking-widest text-white/40">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {cargos.map((c) => (
                      <tr key={c.id} className="hover:bg-white/3 transition-colors">
                        <td className="px-5 py-3 font-inter text-sm text-white">{c.concepto}</td>
                        <td className="px-5 py-3 font-inter text-sm text-right font-medium text-white tabular-nums">{fmt(c.monto)}</td>
                        <td className="px-5 py-3 font-inter text-sm text-epic-silver">{fmtFecha(c.fechaVencimiento)}</td>
                        <td className="px-5 py-3"><CargoBadge estado={c.estado} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── Tab: Desempeño y Asistencia ──────────────────────────────────── */}
      {tab === 'desempeno' && (
        <div className="space-y-4">

          {/* Porcentaje de asistencia del mes */}
          <section className="rounded-sm border border-white/10 bg-black/40 p-5">
            <p className="font-inter text-[10px] uppercase tracking-widest text-white/40 mb-3">
              Asistencia — mes actual
            </p>
            {porcentajeAsistenciaMes === null ? (
              <p className="font-inter text-sm text-white/30">Sin registros este mes</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-end gap-3">
                  <span className="font-montserrat font-bold text-4xl text-epic-gold">{porcentajeAsistenciaMes}%</span>
                  <span className="font-inter text-sm text-white/40 mb-1">de asistencia</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-epic-gold transition-all"
                    style={{ width: `${porcentajeAsistenciaMes}%` }}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Últimas 10 asistencias */}
          <section className="rounded-sm border border-white/10 bg-black/40 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/8">
              <span className="font-montserrat font-bold text-xs tracking-[0.15em] uppercase text-white">
                Últimas 10 asistencias
              </span>
            </div>
            {asistencias.length === 0 ? (
              <p className="font-inter text-sm text-white/30 p-5 text-center">Sin asistencias registradas</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="text-left px-5 py-2.5 font-inter text-[10px] font-medium uppercase tracking-widest text-white/40">Fecha</th>
                      <th className="text-left px-5 py-2.5 font-inter text-[10px] font-medium uppercase tracking-widest text-white/40">Clase</th>
                      <th className="text-left px-5 py-2.5 font-inter text-[10px] font-medium uppercase tracking-widest text-white/40">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {asistencias.map((a) => (
                      <tr key={a.id} className="hover:bg-white/3 transition-colors">
                        <td className="px-5 py-3 font-inter text-sm text-epic-silver">{fmtFecha(a.fecha)}</td>
                        <td className="px-5 py-3 font-inter text-sm text-white">{a.clase}</td>
                        <td className="px-5 py-3"><AsistenciaBadge estado={a.estado} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Muro de seguimiento */}
          <section className="rounded-sm border border-white/10 bg-black/40 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={13} className="text-epic-gold" />
                <span className="font-montserrat font-bold text-xs tracking-[0.15em] uppercase text-white">
                  Seguimiento — bitácora
                </span>
              </div>
              <Button variante="secondary" tamano="sm">
                <PlusCircle size={13} />
                Agregar nota directiva
              </Button>
            </div>

            <div className="divide-y divide-white/5">
              {asistencias.filter((a) => a.observacion).length === 0 ? (
                <p className="font-inter text-sm text-white/30 p-5 text-center">
                  Sin observaciones de comportamiento registradas
                </p>
              ) : (
                asistencias
                  .filter((a) => a.observacion)
                  .map((a) => (
                    <div key={a.id} className="px-5 py-4 space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-inter text-xs text-white/40">{fmtFecha(a.fecha)}</span>
                        <span className="font-inter text-xs text-epic-silver">{a.clase}</span>
                        <AsistenciaBadge estado={a.estado} />
                      </div>
                      <p className="font-inter text-sm text-white/80 leading-relaxed">{a.observacion}</p>
                    </div>
                  ))
              )}
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
