'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';

// ─────────────────────────────────────────────────────────────────────────────
// Tipo del payload estructurado.
//
// Diseñado en dos capas:
//   1. UI inmediata: textoGenerado + telefonoPadre → construye el link wa.me
//   2. Webhook n8n (Mes 3+): este mismo objeto se envía como body del HTTP
//      Request en n8n para que el bot lo procese y actualice los flags en BD.
// ─────────────────────────────────────────────────────────────────────────────

export interface RecordadorCobranzaPayload {
  // ── Identificadores (n8n los usa para actualizar notificado3Dias/notificadoHoy)
  cargoId:  string;
  alumnaId: string;
  padreId:  string;

  // ── Contacto
  telefonoPadre: string | null;  // null si el padre no tiene teléfono registrado
  nombrePadre:   string;

  // ── Alumna
  nombreAlumna: string;
  grupoNombre:  string | null;

  // ── Financiero
  concepto:         string;
  montoAtrasado:    number;     // en MXN, número puro (ej. 850)
  diasVencidos:     number;     // 0 = vence hoy o es futuro
  fechaVencimiento: string;     // ISO 8601

  // ── Mensaje listo para copiar / enviar por n8n
  textoGenerado: string;

  // ── Metadatos de trazabilidad para n8n
  _meta: {
    generadoEn: string;   // ISO 8601
    version: '1.0';
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Server Action
//
// Llamada desde el botón WhatsApp en el panel de cobranza.
// Devuelve el payload listo para:
//   · Construir el link wa.me (MVP)
//   · Enviar como body al webhook de n8n (Mes 3+)
// ─────────────────────────────────────────────────────────────────────────────

export async function getRecordadorCobranzaPayload(
  cargoId: string,
): Promise<RecordadorCobranzaPayload> {
  const session = await getServerSession(authOptions);

  const cargo = await withRLS(session, (tx) =>
    tx.cargo.findUniqueOrThrow({
      where: { id: cargoId },
      include: {
        alumna:   { select: { id: true, nombre: true, apellido: true } },
        padre:    { select: { id: true, nombre: true, apellido: true, telefono: true } },
        concepto: { select: { nombre: true } },
        grupo:    { select: { nombre: true } },
      },
    }),
  );

  // ── Cálculo de días vencidos ───────────────────────────────────────────────
  const hoyStart  = new Date(); hoyStart.setHours(0, 0, 0, 0);
  const vencStart = new Date(cargo.fechaVencimiento); vencStart.setHours(0, 0, 0, 0);
  const diasVencidos = Math.max(
    0,
    Math.floor((hoyStart.getTime() - vencStart.getTime()) / 86_400_000),
  );

  const montoAtrasado = (cargo.montoFinal as unknown as { toNumber(): number }).toNumber();
  const nombreAlumna  = `${cargo.alumna.nombre} ${cargo.alumna.apellido}`;
  const montoStr      = new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN',
  }).format(montoAtrasado);

  // ── Texto del mensaje ──────────────────────────────────────────────────────
  // Formato: saludo → nombre → concepto → monto → acción → firma
  const textoGenerado = diasVencidos > 0
    ? `Hola ${cargo.padre.nombre}, te recordamos que el pago de *${cargo.concepto.nombre}* de *${nombreAlumna}* por ${montoStr} lleva *${diasVencidos} día${diasVencidos !== 1 ? 's' : ''} vencido*. Por favor regulariza tu cuenta lo antes posible para evitar contratiempos. ¡Gracias! 🙏 — Epic Motion`
    : `Hola ${cargo.padre.nombre}, te recordamos amablemente que el pago de *${cargo.concepto.nombre}* de *${nombreAlumna}* por ${montoStr} *vence hoy*. Puedes liquidarlo directamente en la academia. ¡Gracias! — Epic Motion`;

  return {
    cargoId:          cargo.id,
    alumnaId:         cargo.alumnaId,
    padreId:          cargo.padreId,
    telefonoPadre:    cargo.padre.telefono ?? null,
    nombrePadre:      `${cargo.padre.nombre} ${cargo.padre.apellido}`,
    nombreAlumna,
    grupoNombre:      cargo.grupo?.nombre ?? null,
    concepto:         cargo.concepto.nombre,
    montoAtrasado,
    diasVencidos,
    fechaVencimiento: cargo.fechaVencimiento.toISOString(),
    textoGenerado,
    _meta: {
      generadoEn: new Date().toISOString(),
      version:    '1.0',
    },
  };
}
