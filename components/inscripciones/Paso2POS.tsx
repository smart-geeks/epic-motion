'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Check, Pencil, Receipt } from 'lucide-react';
import Button from '@/components/ui/Button';
import RadioGroup from '@/components/ui/RadioGroup';
import Input from '@/components/ui/Input';
import { useWizardInscripcion } from '@/stores/wizard-inscripcion.store';
import type { InscripcionPayload } from '@/types/inscripciones';
import { METODOS_PAGO } from '@/lib/constants';

export default function Paso2POS() {
  const {
    alumna, tutor, infoGeneral,
    grupoSeleccionado, alumnaIdExistente, padreIdExistente,
    cuotaInscripcion, pago, setDatosPago,
    setResultado, setPaso, setPdfUrl,
  } = useWizardInscripcion();

  const [procesando, setProcesando] = useState(false);
  const [editandoMonto, setEditandoMonto] = useState(false);

  const mensualidad = grupoSeleccionado?.tarifa?.precioMensualidad ?? 0;
  const total = cuotaInscripcion + mensualidad;
  const totalFinal = pago.montoAjustado ?? total;

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

    if (pago.montoAjustado !== null && !pago.motivoAjuste.trim()) {
      toast.error('Escribe el motivo del ajuste de precio');
      return;
    }

    setProcesando(true);
    try {
      const payload: InscripcionPayload = {
        alumnaId: alumnaIdExistente ?? undefined,
        padreId: padreIdExistente ?? undefined,
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
        passwordTemporal: data.passwordTemporal ?? '',
      });
      setPaso(3);

      // Generar PDF en background — no bloquea la navegación al paso 3
      fetch('/api/inscripciones/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumnaId: data.alumnaId,
          padreId: data.padreId,
          passwordTemporal: data.passwordTemporal ?? '',
        }),
      })
        .then((r) => r.json())
        .then((pdfData) => { if (pdfData.ok) setPdfUrl(pdfData.pdfUrl); })
        .catch(() => { /* PDF generation failure is non-blocking */ });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error de conexión');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-8">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Resumen del cobro ──────────────────────────────────────────── */}
        <div className="glass-card rounded-[2rem] overflow-hidden bg-white/[0.02] h-fit">
          <div className="px-6 py-5 bg-white/[0.03] border-b border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-epic-gold/20 flex items-center justify-center">
              <Receipt size={16} className="text-epic-gold" />
            </div>
            <span className="font-montserrat font-bold text-[10px] tracking-[0.2em] uppercase text-white/60">
              Resumen de Cobro
            </span>
          </div>

          <div className="p-6 space-y-4">
            {/* Alumna */}
            <div className="flex flex-col">
              <span className="font-inter text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none mb-1.5">Alumna</span>
              <span className="font-montserrat text-sm font-bold text-white truncate">
                {alumna.nombre} {alumna.apellido}
              </span>
            </div>

            {/* Grupo */}
            <div className="flex flex-col">
              <span className="font-inter text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none mb-1.5">Clase / Grupo</span>
              <span className="font-montserrat text-sm font-bold text-epic-gold truncate">
                {grupoSeleccionado?.nombre}
              </span>
            </div>

            <div className="border-t border-white/5 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-inter text-xs text-white/40">Inscripción</span>
                <span className="font-montserrat text-sm font-bold text-white">{fmt(cuotaInscripcion)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-inter text-xs text-white/40">Primera Mensualidad</span>
                <span className="font-montserrat text-sm font-bold text-white">{fmt(mensualidad)}</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-montserrat font-bold text-[10px] tracking-widest text-white/30 uppercase">
                    Total Final
                  </span>
                  {!editandoMonto && (
                    <button
                      type="button"
                      onClick={() => setEditandoMonto(true)}
                      className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-epic-gold transition-all"
                    >
                      <Pencil size={11} />
                    </button>
                  )}
                </div>
              </div>

              {editandoMonto ? (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-epic-gold font-bold">$</span>
                      <input
                        type="number"
                        value={pago.montoAjustado ?? total}
                        onChange={(e) => setDatosPago({ montoAjustado: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-7 pr-4 py-2.5 bg-black/40 border border-epic-gold/30 rounded-xl font-montserrat font-extrabold text-lg text-white focus:outline-none focus:ring-1 focus:ring-epic-gold/40 transition-all"
                        min={0}
                        step={0.01}
                        autoFocus
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditandoMonto(false)}
                      className="w-11 h-11 rounded-xl bg-epic-gold flex items-center justify-center text-epic-black shadow-lg shadow-epic-gold/20 hover:scale-105 transition-transform"
                    >
                      <Check size={20} strokeWidth={3} />
                    </button>
                  </div>
                  <Input
                    label="Motivo del ajuste"
                    value={pago.motivoAjuste}
                    onChange={(e) => setDatosPago({ motivoAjuste: e.target.value })}
                    placeholder="Escriba la razón del cambio..."
                    className="mt-2"
                  />
                </div>
              ) : (
                <div className="mt-1 flex flex-col items-end">
                   <span className="font-montserrat font-extrabold text-3xl text-epic-gold tracking-tight">
                    {fmt(totalFinal)}
                  </span>
                  {pago.montoAjustado !== null && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-white/20 line-through">{fmt(total)}</span>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{pago.motivoAjuste}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Método de pago ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <div className="glass-card rounded-[2rem] p-7 bg-white/[0.02]">
            <RadioGroup
              name="metodoPago"
              label="Forma de Pago"
              opciones={METODOS_PAGO}
              valor={pago.metodoPago}
              onChange={(v) => setDatosPago({ metodoPago: v as 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' })}
            />

            {pago.metodoPago === 'TRANSFERENCIA' && (
              <div className="mt-6 space-y-4 pt-4 border-t border-white/5">
                <Input
                  label="Folio / Referencia"
                  value={pago.referencia}
                  onChange={(e) => setDatosPago({ referencia: e.target.value })}
                  placeholder="Número de comprobante"
                />
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                  <p className="font-inter text-[11px] text-amber-500 leading-relaxed font-medium">
                    * El pago se registrará como <span className="font-bold">Pendiente</span> hasta que administración confirme la recepción.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
             <Button
                tamano="lg"
                fullWidth
                loading={procesando}
                onClick={registrarPago}
                className="py-6 text-base font-extrabold tracking-tighter"
              >
                {procesando ? 'Confirmando...' : 'Finalizar Registro'}
              </Button>
              <button
                type="button"
                onClick={() => setPaso(1)}
                disabled={procesando}
                className="h-12 w-full flex items-center justify-center gap-2 text-white/40 hover:text-white font-montserrat text-[10px] font-black uppercase tracking-[0.2em] transition-all"
              >
                <ArrowLeft size={14} />
                Regresar a Datos
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}
