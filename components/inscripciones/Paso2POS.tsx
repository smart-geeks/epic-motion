'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Receipt } from 'lucide-react';
import Button from '@/components/ui/Button';
import RadioGroup from '@/components/ui/RadioGroup';
import Input from '@/components/ui/Input';
import { useWizardInscripcion } from '@/stores/wizard-inscripcion.store';
import type { InscripcionPayload } from '@/types/inscripciones';

export default function Paso2POS() {
  const {
    alumna, tutor, infoGeneral,
    grupoSeleccionado, alumnaIdExistente,
    cuotaInscripcion, pago, setDatosPago,
    setResultado, setPaso,
  } = useWizardInscripcion();

  const [procesando, setProcesando] = useState(false);

  const mensualidad = grupoSeleccionado?.tarifa?.precioMensualidad ?? 0;
  const total = cuotaInscripcion + mensualidad;

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 2,
    }).format(n);

  const registrarPago = async () => {
    if (!grupoSeleccionado) {
      toast.error('No hay grupo seleccionado');
      return;
    }

    setProcesando(true);
    try {
      const payload: InscripcionPayload = {
        alumnaId: alumnaIdExistente ?? undefined,
        alumna,
        tutor,
        infoGeneral,
        grupoId: grupoSeleccionado.id,
        pago,
      };

      const res = await fetch('/api/inscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.ok) {
        toast.error(data.error ?? 'Error al registrar la inscripción');
        return;
      }

      setResultado({
        alumnaId: data.alumnaId,
        padreId: data.padreId,
        emailPadre: data.emailPadre,
        passwordTemporal: data.passwordTemporal,
      });
      setPaso(3);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error de conexión');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">

      {/* ── Resumen del cobro ──────────────────────────────────────────── */}
      <div className="rounded-sm border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="px-5 py-3.5 bg-gray-50 dark:bg-white/3 border-b border-gray-200 dark:border-white/8 flex items-center gap-2">
          <Receipt size={15} className="text-epic-gold shrink-0" />
          <span className="font-montserrat font-bold text-xs tracking-[0.15em] uppercase text-epic-black dark:text-white">
            Resumen de cobro
          </span>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Alumna */}
          <div className="flex items-center justify-between">
            <span className="font-inter text-sm text-gray-600 dark:text-epic-silver">Alumna</span>
            <span className="font-inter text-sm font-medium text-epic-black dark:text-white">
              {alumna.nombre} {alumna.apellido}
            </span>
          </div>

          {/* Grupo */}
          <div className="flex items-center justify-between">
            <span className="font-inter text-sm text-gray-600 dark:text-epic-silver">Grupo</span>
            <span className="font-inter text-sm font-medium text-epic-black dark:text-white">
              {grupoSeleccionado?.nombre}
            </span>
          </div>

          <div className="border-t border-gray-100 dark:border-white/8 pt-3 space-y-2">
            {/* Cuota de inscripción */}
            <div className="flex items-center justify-between">
              <span className="font-inter text-sm text-gray-600 dark:text-epic-silver">
                Cuota de inscripción
              </span>
              <span className="font-inter text-sm text-epic-black dark:text-white">
                {fmt(cuotaInscripcion)}
              </span>
            </div>

            {/* Mensualidad */}
            <div className="flex items-center justify-between">
              <span className="font-inter text-sm text-gray-600 dark:text-epic-silver">
                Mensualidad
              </span>
              <span className="font-inter text-sm text-epic-black dark:text-white">
                {fmt(mensualidad)}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 dark:border-white/10 pt-3 flex items-center justify-between">
            <span className="font-montserrat font-bold text-sm text-epic-black dark:text-white uppercase tracking-wide">
              Total a cobrar
            </span>
            <span className="font-montserrat font-bold text-xl text-epic-gold">
              {fmt(total)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Método de pago ────────────────────────────────────────────── */}
      <div className="rounded-sm border border-gray-200 dark:border-white/10 p-5 space-y-4">
        <RadioGroup
          name="metodoPago"
          label="Método de pago"
          opciones={[
            { value: 'EFECTIVO', label: 'Efectivo' },
            { value: 'TRANSFERENCIA', label: 'Transferencia' },
            { value: 'TARJETA', label: 'Tarjeta' },
          ]}
          valor={pago.metodoPago}
          onChange={(v) => setDatosPago({ metodoPago: v as 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' })}
        />

        {pago.metodoPago === 'TRANSFERENCIA' && (
          <div className="space-y-3 pt-2">
            <Input
              label="Número de referencia"
              value={pago.referencia}
              onChange={(e) => setDatosPago({ referencia: e.target.value })}
              placeholder="Ej. 1234567890"
              hint="Ingresa el número de referencia o folio de la transferencia"
            />
            <div className="p-3 rounded-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30">
              <p className="font-inter text-xs text-amber-700 dark:text-amber-400">
                El pago quedará como <strong>pendiente de confirmación</strong> hasta que se verifique la transferencia.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Botones de acción ─────────────────────────────────────────── */}
      <div className="flex gap-3">
        <Button
          variante="secondary"
          tamano="lg"
          onClick={() => setPaso(1)}
          disabled={procesando}
        >
          <ArrowLeft size={15} />
          Regresar
        </Button>
        <Button
          tamano="lg"
          fullWidth
          loading={procesando}
          onClick={registrarPago}
        >
          {procesando ? 'Registrando...' : 'Registrar Pago'}
        </Button>
      </div>
    </div>
  );
}
