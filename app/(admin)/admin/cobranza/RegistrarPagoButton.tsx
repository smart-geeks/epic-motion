'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, X } from 'lucide-react';

interface RegistrarPagoButtonProps {
  cargoId:   string;
  alumnaId:  string;
  padreId:   string;
  monto:     number;
  concepto:  string;
  alumna:    string;
}

export function RegistrarPagoButton({
  cargoId, alumnaId, padreId, monto, concepto, alumna,
}: RegistrarPagoButtonProps) {
  const router   = useRouter();
  const [abierto,   setAbierto]   = useState(false);
  const [cargando,  setCargando]  = useState(false);
  const [exito,     setExito]     = useState(false);

  const montoStr = new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN',
  }).format(monto);

  async function confirmar() {
    setCargando(true);
    try {
      const res = await fetch('/api/pagos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumnaId,
          padreId,
          importe:      monto,
          concepto,
          tipo:         'MENSUALIDAD',
          aplicaciones: [{ cargoId, montoAplicado: monto }],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al registrar');

      setExito(true);
      setTimeout(() => {
        setAbierto(false);
        setExito(false);
        router.refresh();
      }, 1200);

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al registrar el pago');
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        title="Registrar pago en efectivo"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-inter font-medium
                   bg-epic-gold hover:bg-yellow-500 active:bg-yellow-600 text-black
                   transition-colors"
      >
        <CheckCircle2 size={13} />
        Pagar
      </button>

      {/* Modal */}
      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4
                     bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setAbierto(false); }}
        >
          <div className="w-full max-w-sm dark:bg-epic-gray bg-white rounded-2xl
                          border dark:border-white/10 border-gray-200 shadow-2xl p-6">

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-base font-montserrat font-bold dark:text-white text-gray-900">
                Registrar pago
              </h2>
              <button
                onClick={() => setAbierto(false)}
                className="dark:text-white/30 text-gray-400 hover:dark:text-white hover:text-gray-700
                           transition-colors -mt-0.5"
              >
                <X size={18} />
              </button>
            </div>

            {/* Detalle del cargo */}
            <div className="dark:bg-white/5 bg-gray-50 rounded-xl px-4 py-3 mb-5 space-y-1.5">
              <Row label="Alumna"  value={alumna}   />
              <Row label="Concepto" value={concepto} />
              <Row
                label="Monto"
                value={montoStr}
                valueClass="font-bold text-epic-gold"
              />
              <Row label="Método"  value="Efectivo" />
            </div>

            {/* Confirmación */}
            {exito ? (
              <div className="flex items-center justify-center gap-2 py-2 text-green-400">
                <CheckCircle2 size={18} />
                <span className="text-sm font-inter font-medium">Pago registrado</span>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setAbierto(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-inter
                             dark:bg-white/5 bg-gray-100 dark:text-white/70 text-gray-600
                             hover:dark:bg-white/10 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmar}
                  disabled={cargando}
                  className="flex-1 inline-flex items-center justify-center gap-2
                             px-4 py-2.5 rounded-xl text-sm font-inter font-semibold
                             bg-epic-gold hover:bg-yellow-500 text-black
                             transition-colors disabled:opacity-50"
                >
                  {cargando
                    ? <Loader2 size={14} className="animate-spin" />
                    : <CheckCircle2 size={14} />
                  }
                  Confirmar pago
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Row({
  label, value, valueClass = 'dark:text-white text-gray-900',
}: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-inter dark:text-white/40 text-gray-400">{label}</span>
      <span className={`text-xs font-inter font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
