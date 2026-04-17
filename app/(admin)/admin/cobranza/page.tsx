import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import { AlertCircle, Clock, CalendarDays, CheckCircle2 } from 'lucide-react';
import { WhatsAppButton } from './WhatsAppButton';
import { RegistrarPagoButton } from './RegistrarPagoButton';

// ─────────────────────────────────────────────────────────────────────────────
// Tipo inline del cargo con sus relaciones
// ─────────────────────────────────────────────────────────────────────────────

interface CargoRow {
  id:               string;
  alumnaId:         string;
  padreId:          string;
  montoFinal:       { toNumber(): number } | number;
  fechaVencimiento: Date;
  alumna:   { nombre: string; apellido: string };
  concepto: { nombre: string };
  padre:    { nombre: string; apellido: string; telefono: string | null };
  grupo:    { nombre: string } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatMXN(valor: number | { toNumber(): number }) {
  const n = typeof valor === 'number' ? valor : valor.toNumber();
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

function formatFecha(fecha: Date) {
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function esMismoDia(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

function addDias(base: Date, dias: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return d;
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente de fila (desktop table row + mobile card)
// ─────────────────────────────────────────────────────────────────────────────

function FilaCargo({ cargo, accentClass }: { cargo: CargoRow; accentClass: string }) {
  const monto = typeof cargo.montoFinal === 'number'
    ? cargo.montoFinal
    : cargo.montoFinal.toNumber();

  return (
    <>
      {/* Desktop */}
      <tr className="hidden sm:table-row hover:dark:bg-white/[0.03] hover:bg-gray-50 transition-colors">
        <td className="px-5 py-3 dark:text-white text-gray-900 font-medium text-sm whitespace-nowrap">
          {cargo.alumna.nombre} {cargo.alumna.apellido}
          {cargo.grupo && (
            <span className="ml-2 text-xs dark:text-white/30 text-gray-400 font-normal">
              {cargo.grupo.nombre}
            </span>
          )}
        </td>
        <td className="px-5 py-3 dark:text-epic-silver text-gray-600 text-sm">
          {cargo.concepto.nombre}
        </td>
        <td className={`px-5 py-3 font-semibold text-sm tabular-nums ${accentClass}`}>
          {formatMXN(monto)}
        </td>
        <td className="px-5 py-3 dark:text-epic-silver text-gray-500 text-sm whitespace-nowrap">
          {formatFecha(cargo.fechaVencimiento)}
        </td>
        <td className="px-5 py-3 dark:text-epic-silver text-gray-500 text-sm">
          <span className="block">{cargo.padre.nombre} {cargo.padre.apellido}</span>
          {cargo.padre.telefono && (
            <span className="text-xs dark:text-white/30 text-gray-400">{cargo.padre.telefono}</span>
          )}
        </td>
        <td className="px-5 py-3">
          <div className="flex items-center gap-2">
            <RegistrarPagoButton
              cargoId={cargo.id}
              alumnaId={cargo.alumnaId}
              padreId={cargo.padreId}
              monto={monto}
              concepto={cargo.concepto.nombre}
              alumna={`${cargo.alumna.nombre} ${cargo.alumna.apellido}`}
            />
            <WhatsAppButton cargoId={cargo.id} />
          </div>
        </td>
      </tr>

      {/* Móvil */}
      <div className="sm:hidden dark:bg-epic-gray bg-white rounded-2xl border dark:border-white/5 border-gray-200 shadow-sm px-4 py-3.5 mb-2.5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="font-inter font-medium dark:text-white text-gray-900 text-sm">
              {cargo.alumna.nombre} {cargo.alumna.apellido}
            </p>
            <p className="font-inter text-xs dark:text-epic-silver text-gray-500 mt-0.5">
              {cargo.concepto.nombre}
              {cargo.grupo && ` · ${cargo.grupo.nombre}`}
            </p>
          </div>
          <span className={`font-montserrat font-bold text-base tabular-nums ${accentClass}`}>
            {formatMXN(monto)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t dark:border-white/5 border-gray-100">
          <p className="text-xs font-inter dark:text-white/30 text-gray-400">
            {cargo.padre.nombre} {cargo.padre.apellido}
            {cargo.padre.telefono && ` · ${cargo.padre.telefono}`}
          </p>
          <div className="flex items-center gap-2">
            <RegistrarPagoButton
              cargoId={cargo.id}
              alumnaId={cargo.alumnaId}
              padreId={cargo.padreId}
              monto={monto}
              concepto={cargo.concepto.nombre}
              alumna={`${cargo.alumna.nombre} ${cargo.alumna.apellido}`}
            />
            <WhatsAppButton cargoId={cargo.id} />
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Segmento de urgencia
// ─────────────────────────────────────────────────────────────────────────────

type Urgencia = 'vencido' | 'hoy' | 'manana' | 'en2' | 'en3';

const URGENCIA_CONFIG: Record<Urgencia, {
  icono: React.ElementType;
  titulo: string;
  borde: string;
  encabezado: string;
  accentClass: string;
}> = {
  vencido: {
    icono: AlertCircle,
    titulo: 'Vencidos',
    borde: 'border-red-500/40',
    encabezado: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
    accentClass: 'text-red-600 dark:text-red-400',
  },
  hoy: {
    icono: Clock,
    titulo: 'Vence hoy',
    borde: 'border-orange-500/40',
    encabezado: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
    accentClass: 'text-orange-600 dark:text-orange-400',
  },
  manana: {
    icono: CalendarDays,
    titulo: 'Vence mañana',
    borde: 'border-yellow-500/30',
    encabezado: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
    accentClass: 'text-yellow-600 dark:text-yellow-500',
  },
  en2: {
    icono: CalendarDays,
    titulo: 'Vence en 2 días',
    borde: 'border-blue-500/20',
    encabezado: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    accentClass: 'text-blue-600 dark:text-blue-400',
  },
  en3: {
    icono: CalendarDays,
    titulo: 'Vence en 3 días',
    borde: 'dark:border-white/5 border-gray-200',
    encabezado: 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-epic-silver',
    accentClass: 'dark:text-white text-gray-900',
  },
};

function SegmentoCargos({ tipo, cargos }: { tipo: Urgencia; cargos: CargoRow[] }) {
  if (cargos.length === 0) return null;

  const { icono: Icono, titulo, borde, encabezado, accentClass } = URGENCIA_CONFIG[tipo];

  return (
    <section className={`rounded-2xl border ${borde} overflow-hidden mb-4`}>
      {/* Encabezado del segmento */}
      <div className={`flex items-center gap-2 px-5 py-2.5 ${encabezado}`}>
        <Icono size={14} />
        <span className="text-xs font-inter font-semibold uppercase tracking-wide">
          {titulo}
        </span>
        <span className="ml-1 text-xs opacity-60">({cargos.length})</span>
      </div>

      {/* Tabla — desktop */}
      <div className="hidden sm:block dark:bg-epic-gray bg-white overflow-x-auto">
        <table className="w-full text-sm font-inter">
          <tbody className="divide-y dark:divide-white/5 divide-gray-50">
            {cargos.map((c) => (
              <FilaCargo key={c.id} cargo={c} accentClass={accentClass} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards — móvil */}
      <div className="sm:hidden dark:bg-epic-gray bg-white p-3">
        {cargos.map((c) => (
          <FilaCargo key={c.id} cargo={c} accentClass={accentClass} />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────

export default async function CobranzaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  // Ventana de urgencia: todos los vencidos + los que vencen en ≤ 3 días
  const en3Fin = new Date();
  en3Fin.setDate(en3Fin.getDate() + 3);
  en3Fin.setHours(23, 59, 59, 999);

  const [urgentes, resumen] = await Promise.all([
    withRLS(session, (tx) =>
      tx.cargo.findMany({
        where: {
          estado: { in: ['PENDIENTE', 'VENCIDO'] },
          fechaVencimiento: { lte: en3Fin },
        },
        select: {
          id:               true,
          alumnaId:         true,
          padreId:          true,
          montoFinal:       true,
          fechaVencimiento: true,
          alumna:   { select: { nombre: true, apellido: true } },
          concepto: { select: { nombre: true } },
          padre:    { select: { nombre: true, apellido: true, telefono: true } },
          grupo:    { select: { nombre: true } },
        },
        orderBy: { fechaVencimiento: 'asc' },
      }),
    ),
    withRLS(session, (tx) =>
      tx.cargo.aggregate({
        where: { estado: { in: ['PENDIENTE', 'VENCIDO'] } },
        _sum:   { montoFinal: true },
        _count: { id: true },
      }),
    ),
  ]);

  // ── Buckets por urgencia ─────────────────────────────────────────────────
  const hoy     = new Date();
  const manana  = addDias(hoy, 1);
  const en2dias = addDias(hoy, 2);
  const en3dias = addDias(hoy, 3);
  const hoyInicio = new Date(hoy); hoyInicio.setHours(0, 0, 0, 0);

  const vencidos = (urgentes as CargoRow[]).filter(
    (c) => new Date(c.fechaVencimiento) < hoyInicio,
  );
  const hoyList  = (urgentes as CargoRow[]).filter((c) => esMismoDia(new Date(c.fechaVencimiento), hoy));
  const en1List  = (urgentes as CargoRow[]).filter((c) => esMismoDia(new Date(c.fechaVencimiento), manana));
  const en2List  = (urgentes as CargoRow[]).filter((c) => esMismoDia(new Date(c.fechaVencimiento), en2dias));
  const en3List  = (urgentes as CargoRow[]).filter((c) => esMismoDia(new Date(c.fechaVencimiento), en3dias));

  const totalGlobal    = (resumen as { _sum?: { montoFinal?: unknown }; _count?: { id?: number } })._sum?.montoFinal;
  const totalNum       = totalGlobal
    ? typeof totalGlobal === 'number'
      ? totalGlobal
      : (totalGlobal as { toNumber(): number }).toNumber()
    : 0;
  const cargosGlobales = (resumen as { _count?: { id?: number } })._count?.id ?? 0;
  const cargosUrgentes = vencidos.length + hoyList.length;

  return (
    <div>
      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-montserrat font-bold dark:text-white text-gray-900 tracking-[0.03em]">
          Cobranza
        </h1>
        <p className="mt-1 text-sm font-inter dark:text-epic-silver text-gray-500">
          Dashboard · Vencidos y próximos 3 días
        </p>
      </div>

      {/* ── Estadísticas globales ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          titulo="Total por cobrar"
          valor={formatMXN(totalNum)}
          sub={`${cargosGlobales} cargos en total`}
        />
        <StatCard
          titulo="Requieren acción"
          valor={String(cargosUrgentes)}
          sub="vencidos + vence hoy"
          acento="text-red-600 dark:text-red-400"
          borde="dark:border-red-500/20 border-red-200"
        />
        <StatCard
          titulo="Próximos 3 días"
          valor={String(en1List.length + en2List.length + en3List.length)}
          sub="por vencer pronto"
        />
        <StatCard
          titulo="En pantalla"
          valor={String(urgentes.length)}
          sub={`de ${cargosGlobales} totales`}
        />
      </div>

      {/* ── Sin cargos urgentes ─────────────────────────────────────────── */}
      {urgentes.length === 0 && (
        <div className="dark:bg-epic-gray bg-white rounded-2xl border dark:border-white/5 border-gray-200 p-12 text-center shadow-sm">
          <CheckCircle2 size={36} className="mx-auto mb-3 text-green-400 dark:text-green-500" />
          <p className="text-sm font-inter dark:text-epic-silver text-gray-400">
            No hay cargos vencidos ni que venzan en los próximos 3 días.
          </p>
          {cargosGlobales > 0 && (
            <p className="text-xs font-inter dark:text-white/30 text-gray-400 mt-1.5">
              Hay {cargosGlobales} cargos pendientes con vencimiento a más de 3 días.
            </p>
          )}
        </div>
      )}

      {/* ── Segmentos por urgencia ───────────────────────────────────────── */}
      {urgentes.length > 0 && (
        <>
          <SegmentoCargos tipo="vencido"  cargos={vencidos} />
          <SegmentoCargos tipo="hoy"      cargos={hoyList}  />
          <SegmentoCargos tipo="manana"   cargos={en1List}  />
          <SegmentoCargos tipo="en2"      cargos={en2List}  />
          <SegmentoCargos tipo="en3"      cargos={en3List}  />

          {cargosGlobales > urgentes.length && (
            <p className="mt-4 text-xs font-inter dark:text-white/30 text-gray-400 text-center">
              +{cargosGlobales - urgentes.length} cargos pendientes con vencimiento en más de 3 días
              no se muestran en este dashboard.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatCard — tarjeta de métrica reutilizable
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  titulo, valor, sub, acento, borde,
}: {
  titulo: string;
  valor:  string;
  sub:    string;
  acento?: string;
  borde?:  string;
}) {
  return (
    <div className={`dark:bg-epic-gray bg-white rounded-2xl border shadow-sm px-5 py-4 ${borde ?? 'dark:border-white/5 border-gray-200'}`}>
      <p className="text-xs font-inter dark:text-epic-silver text-gray-500 uppercase tracking-wide mb-1">
        {titulo}
      </p>
      <p className={`text-lg font-montserrat font-bold tabular-nums ${acento ?? 'dark:text-white text-gray-900'}`}>
        {valor}
      </p>
      <p className="text-xs dark:text-white/30 text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
