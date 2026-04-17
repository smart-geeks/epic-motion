'use client';

import { useState } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { getRecordadorCobranzaPayload } from '@/lib/actions/cobranza';

interface WhatsAppButtonProps {
  cargoId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// WhatsAppButton
//
// Llama al server action getRecordadorCobranzaPayload y abre el link wa.me
// con el mensaje prellenado.
//
// El payload que devuelve la acción está estructurado para ser usado también
// como body de un webhook HTTP hacia n8n en la etapa de automatización (Mes 3).
// Cuando llegue ese momento, descomentar el bloque fetch de n8n de abajo.
// ─────────────────────────────────────────────────────────────────────────────

export function WhatsAppButton({ cargoId }: WhatsAppButtonProps) {
  const [cargando, setCargando] = useState(false);

  async function handleClick() {
    setCargando(true);
    try {
      const payload = await getRecordadorCobranzaPayload(cargoId);

      if (!payload.telefonoPadre) {
        alert(`${payload.nombrePadre} no tiene número de teléfono registrado.\nAgrega uno en su perfil antes de enviar el recordatorio.`);
        return;
      }

      // ── Construir link wa.me ───────────────────────────────────────────────
      // Normalizar: remover no-dígitos y agregar lada México si falta
      const digitos = payload.telefonoPadre.replace(/\D/g, '');
      const numero  = digitos.startsWith('52') ? digitos : `52${digitos}`;
      const url     = `https://wa.me/${numero}?text=${encodeURIComponent(payload.textoGenerado)}`;

      window.open(url, '_blank', 'noopener,noreferrer');

      // ── TODO (Mes 3): enviar payload a n8n para envío automático ─────────
      // Descomentar cuando se configure el webhook de n8n:
      //
      // await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL!, {
      //   method:  'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body:    JSON.stringify(payload),
      // });

    } catch (err) {
      console.error('[WhatsAppButton]', err);
      alert('No se pudo generar el mensaje. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={cargando}
      title="Enviar recordatorio por WhatsApp"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-inter font-medium
                 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white
                 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {cargando
        ? <Loader2 size={13} className="animate-spin" />
        : <MessageCircle size={13} />
      }
      WhatsApp
    </button>
  );
}
