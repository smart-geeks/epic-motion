// ─────────────────────────────────────────────────────────────────────────────
// Constantes globales de la academia — fuente única de verdad para el frontend
// Cambiar aquí propaga el valor a todos los componentes que lo usan.
// ─────────────────────────────────────────────────────────────────────────────

export const WHATSAPP_CONTACTO = '528712044277';

export const WA_CTA_URL = `https://wa.me/${WHATSAPP_CONTACTO}?text=${encodeURIComponent(
  'Hola Epic Motion, quiero agendar una clase de prueba'
)}`;

export const BENEFICIOS_ACADEMIA = [
  'Instructores certificados con formación internacional',
  'Instalaciones de primer nivel con piso profesional',
  'Metodología probada y adaptada a cada edad',
  'Grupos reducidos para atención personalizada',
  'Presentaciones regulares en escenario real',
  'Ambiente seguro, disciplinado y motivador',
] as const;
