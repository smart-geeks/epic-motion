'use client';

import React from 'react';

interface TicketPagoProps {
  alumna: { nombre: string; apellido: string };
  grupoNombre: string;
  disciplinas: Array<{ nombre: string; horaTexto: string }>;
  cuotaInscripcion: number;
  precioMensualidad: number;
  pago: { metodoPago: string; montoAjustado: number | null; motivoAjuste: string };
  tutorNombre: string;
  cicloEscolar: string;
  alumnaId: string;
}

const METODO: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  TARJETA: 'Tarjeta',
};

export default function TicketPago({
  alumna, grupoNombre, disciplinas, cuotaInscripcion, precioMensualidad,
  pago, tutorNombre, cicloEscolar, alumnaId,
}: TicketPagoProps) {
  const folio = 'EM-' + alumnaId.slice(-5).toUpperCase();
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const hora = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });

  const totalOriginal = cuotaInscripcion + precioMensualidad;
  const totalFinal = pago.montoAjustado ?? totalOriginal;
  const descuento = pago.montoAjustado !== null ? totalOriginal - totalFinal : 0;

  const fmt = (n: number) =>
    n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });

  const wrap: React.CSSProperties = {
    width: '300px',
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: '11px',
    lineHeight: '1.5',
    color: '#000',
    backgroundColor: '#fff',
    padding: '16px 14px',
    boxSizing: 'border-box',
  };

  const center: React.CSSProperties = { textAlign: 'center', marginBottom: '10px' };
  const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', margin: '1px 0' };
  const rowBold: React.CSSProperties = { ...row, fontWeight: 700, fontSize: '13px', marginTop: '2px' };
  const small: React.CSSProperties = { fontSize: '9px', color: '#444', marginTop: '1px' };
  const div: React.CSSProperties = { borderTop: '1px dashed #000', margin: '6px 0' };
  const divSolid: React.CSSProperties = { borderTop: '2px solid #000', margin: '6px 0' };
  const section: React.CSSProperties = { margin: '4px 0' };

  return (
    <div style={wrap}>
      {/* ── Encabezado ─────────────────────────────────── */}
      <div style={center}>
        <div style={{
          fontSize: '22px',
          fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}>
          <span style={{ fontWeight: 900 }}>EPIC</span>
          <span style={{ fontWeight: 300 }}> MOTION</span>
        </div>
        <div style={{ fontSize: '9px', letterSpacing: '0.18em', marginTop: '2px' }}>HIGH PERFORMANCE</div>
        <div style={{ fontSize: '9px', letterSpacing: '0.18em' }}>DANCE STUDIO</div>
      </div>

      <div style={divSolid} />

      {/* ── Folio y fecha ──────────────────────────────── */}
      <div style={section}>
        <div style={row}><span>FOLIO:</span><span>{folio}</span></div>
        <div style={row}><span>FECHA:</span><span>{fecha} {hora}</span></div>
      </div>

      <div style={divSolid} />

      <div style={{ ...section, textAlign: 'center', fontSize: '10px' }}>
        CICLO: {cicloEscolar}
      </div>

      <div style={divSolid} />

      {/* ── Datos ──────────────────────────────────────── */}
      <div style={section}>
        <div style={row}><span>ALUMNA:</span><span style={{ textAlign: 'right', maxWidth: '160px' }}>{alumna.nombre} {alumna.apellido}</span></div>
        <div style={row}><span>GRUPO:</span><span>{grupoNombre}</span></div>
        <div style={row}><span>TUTOR:</span><span style={{ textAlign: 'right', maxWidth: '160px' }}>{tutorNombre || '—'}</span></div>
      </div>

      <div style={divSolid} />

      {/* ── Conceptos ──────────────────────────────────── */}
      <div style={section}>
        <div style={row}><span>Inscripcion</span><span>{fmt(cuotaInscripcion)}</span></div>
        <div style={row}><span>Mensualidad</span><span>{fmt(precioMensualidad)}</span></div>
      </div>

      {descuento !== 0 && (
        <>
          <div style={div} />
          <div style={section}>
            <div style={{ ...row, color: descuento > 0 ? '#555' : '#000' }}>
              <span>Descuento</span>
              <span>-{fmt(Math.abs(descuento))}</span>
            </div>
            {pago.motivoAjuste && (
              <div style={{ ...small, wordBreak: 'break-word' }}>
                Motivo: {pago.motivoAjuste}
              </div>
            )}
          </div>
        </>
      )}

      <div style={divSolid} />

      <div style={rowBold}><span>TOTAL COBRADO</span><span>{fmt(totalFinal)}</span></div>
      <div style={{ ...section, fontSize: '10px' }}>Metodo: {METODO[pago.metodoPago] ?? pago.metodoPago}</div>

      <div style={divSolid} />

      {/* ── Disciplinas ────────────────────────────────── */}
      {disciplinas.length > 0 && (
        <div style={section}>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>CLASES INSCRITAS:</div>
          {disciplinas.map((d, i) => (
            <div key={i} style={{ marginBottom: '2px' }}>
              <span>• {d.nombre}</span>
              {d.horaTexto && (
                <div style={{ ...small, paddingLeft: '8px' }}>{d.horaTexto}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={divSolid} />

      {/* ── Firma ──────────────────────────────────────── */}
      <div style={{ marginTop: '14px', fontSize: '10px' }}>
        <div>Recibe conforme: _______________</div>
      </div>
    </div>
  );
}
