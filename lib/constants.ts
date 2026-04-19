// ─────────────────────────────────────────────────────────────────────────────
// Constantes globales de la academia — fuente única de verdad para el frontend
// Cambiar aquí propaga el valor a todos los componentes que lo usan.
// ─────────────────────────────────────────────────────────────────────────────

import { CategoriaGrupo, TipoTierGrupo } from '@/app/generated/prisma/enums';

// Tiers ordenados de menor a mayor — espeja el enum Prisma TipoTierGrupo
export const TIERS = Object.values(TipoTierGrupo) as TipoTierGrupo[];

// Categorías con etiqueta de display para <select> y filtros
export const CAT_OPTIONS: { value: CategoriaGrupo; label: string }[] = [
  { value: CategoriaGrupo.EPIC_TOTZ,   label: 'Epic Totz' },
  { value: CategoriaGrupo.HAPPY_FEET,  label: 'Happy Feet' },
  { value: CategoriaGrupo.EPIC_ONE,    label: 'Epic One' },
  { value: CategoriaGrupo.TEEN,        label: 'Teen' },
  { value: CategoriaGrupo.COMPETICION, label: 'Competición' },
];

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
