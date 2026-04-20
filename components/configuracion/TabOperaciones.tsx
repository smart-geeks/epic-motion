'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, ArrowRightLeft, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { accionEjecutarPromocion } from '@/lib/actions/promociones';
import type { AccionPromocionResult } from '@/lib/actions/promociones';

type EstadoPromocion = 'idle' | 'confirmando' | 'procesando';

export default function TabOperaciones() {
  const [estado, setEstado] = useState<EstadoPromocion>('idle');
  const [resultado, setResultado] = useState<AccionPromocionResult | null>(null);

  const solicitarConfirmacion = () => {
    setResultado(null);
    setEstado('confirmando');
  };

  const cancelar = () => setEstado('idle');

  const ejecutar = async () => {
    setEstado('procesando');
    const toastId = toast.loading('Ejecutando promoción de ciclo…');

    try {
      const res = await accionEjecutarPromocion();
      setResultado(res);
      setEstado('idle');

      if (res.errores.length > 0) {
        toast.warning(res.mensaje, { id: toastId, duration: 6000 });
      } else if (res.promovidas === 0) {
        toast.info(res.mensaje, { id: toastId });
      } else {
        toast.success(res.mensaje, { id: toastId });
      }
    } catch (e) {
      setEstado('idle');
      toast.error(e instanceof Error ? e.message : 'Error al ejecutar la promoción', {
        id: toastId,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ── Encabezado de sección ────────────────────────────────────────────── */}
      <div>
        <h2 className="font-montserrat font-bold text-sm tracking-[0.15em] uppercase dark:text-white text-gray-900">
          Operaciones de Ciclo
        </h2>
        <p className="mt-1 font-inter text-sm dark:text-epic-silver text-gray-500">
          Acciones masivas que afectan toda la base de alumnas. Úsalas al cerrar o iniciar un ciclo escolar.
        </p>
      </div>

      {/* ── Card de promoción ─────────────────────────────────────────────────── */}
      <div className="rounded-sm border dark:border-white/10 border-gray-200 overflow-hidden">
        {/* Cabecera */}
        <div className="px-5 py-4 dark:bg-white/3 bg-gray-50 border-b dark:border-white/8 border-gray-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-epic-gold/10 flex items-center justify-center shrink-0">
            <ArrowRightLeft size={15} className="text-epic-gold" />
          </div>
          <div>
            <p className="font-montserrat font-bold text-sm dark:text-white text-gray-900">
              Promoción de Ciclo
            </p>
            <p className="font-inter text-xs dark:text-epic-silver text-gray-500 mt-0.5">
              Mueve a todas las alumnas al grupo siguiente configurado en su grupo actual.
            </p>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="px-5 py-4 space-y-4">
          {/* Descripción */}
          <ul className="space-y-1.5">
            {[
              'Actualiza el grupo de inscripción de cada alumna al grupo siguiente.',
              'Recalcula el monto de mensualidad según la tarifa del nuevo grupo.',
              'Solo afecta alumnas cuyo grupo actual tenga un "Grupo siguiente" configurado.',
              'El cargo PENDIENTE más reciente se actualiza con el nuevo monto.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <ChevronRight size={13} className="text-epic-gold mt-0.5 shrink-0" />
                <span className="font-inter text-xs dark:text-white/70 text-gray-600">{item}</span>
              </li>
            ))}
          </ul>

          {/* Zona de confirmación */}
          {estado === 'confirmando' ? (
            <div className="rounded-sm border border-amber-400/30 bg-amber-50 dark:bg-amber-900/15 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-montserrat font-bold text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                    Acción irreversible
                  </p>
                  <p className="mt-1 font-inter text-xs text-amber-700 dark:text-amber-300">
                    Esta operación moverá a <strong>todas</strong> las alumnas al grupo siguiente.
                    No se puede deshacer automáticamente. Asegúrate de haber respaldado el ciclo
                    actual antes de continuar.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variante="secondary" tamano="sm" onClick={cancelar}>
                  Cancelar
                </Button>
                <Button tamano="sm" onClick={ejecutar}>
                  Sí, ejecutar promoción
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variante="secondary"
              tamano="sm"
              loading={estado === 'procesando'}
              onClick={solicitarConfirmacion}
              disabled={estado === 'procesando'}
            >
              <ArrowRightLeft size={14} />
              {estado === 'procesando' ? 'Procesando…' : 'Ejecutar Promoción de Ciclo'}
            </Button>
          )}

          {/* Resultado */}
          {resultado && estado === 'idle' && (
            <div className="rounded-sm border dark:border-white/8 border-gray-200 p-4 space-y-3">
              <p className="font-montserrat font-bold text-xs uppercase tracking-wide dark:text-white text-gray-800">
                Resultado de la última ejecución
              </p>

              <div className="grid grid-cols-3 gap-3">
                <Stat label="Promovidas" value={resultado.promovidas} color="green" />
                <Stat label="Sin grupo siguiente" value={resultado.sinGrupoSiguiente} color="amber" />
                <Stat label="Errores" value={resultado.errores.length} color="red" />
              </div>

              {resultado.errores.length > 0 && (
                <div className="space-y-1 pt-1">
                  <p className="font-inter text-xs dark:text-white/50 text-gray-500">Detalle de errores:</p>
                  {resultado.errores.map((e) => (
                    <div key={e.alumnaId} className="flex items-start gap-1.5">
                      <XCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                      <span className="font-inter text-xs dark:text-white/60 text-gray-600">
                        <span className="font-mono">{e.alumnaId.slice(0, 8)}…</span> — {e.detalle}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {resultado.errores.length === 0 && resultado.promovidas > 0 && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-green-400" />
                  <span className="font-inter text-xs text-green-600 dark:text-green-400">
                    Promoción completada sin errores.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: 'green' | 'amber' | 'red' }) {
  const colorMap = {
    green: 'text-green-500 dark:text-green-400',
    amber: 'text-amber-500 dark:text-amber-400',
    red:   'text-red-500 dark:text-red-400',
  };
  return (
    <div className="rounded-sm border dark:border-white/8 border-gray-200 px-3 py-2 text-center">
      <p className={`font-montserrat font-bold text-xl ${colorMap[color]}`}>{value}</p>
      <p className="font-inter text-xs dark:text-white/50 text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
