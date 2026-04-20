// ─────────────────────────────────────────────────────────────────────────────
// Constantes globales de la academia — fuente única de verdad para el frontend
// Cambiar aquí propaga el valor a todos los componentes que lo usan.
// ─────────────────────────────────────────────────────────────────────────────

import { CategoriaGrupo, MetodoPago, TipoCursoEspecial, TipoTierGrupo } from '@/app/generated/prisma/enums';

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

// Métodos de pago — espeja el enum Prisma MetodoPago
export const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: MetodoPago.EFECTIVO,      label: 'Efectivo' },
  { value: MetodoPago.TRANSFERENCIA, label: 'Transferencia' },
  { value: MetodoPago.TARJETA,       label: 'Tarjeta' },
];

// Canales de contacto — espeja los valores del schema (campo String, no enum Prisma)
export const CANALES_CONTACTO: { value: 'WHATSAPP' | 'EMAIL' | 'TELEFONO'; label: string }[] = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL',    label: 'Email' },
  { value: 'TELEFONO', label: 'Teléfono' },
];

// Tipos de curso especial — espeja el enum Prisma TipoCursoEspecial
export const TIPOS_CURSO_ESPECIAL: { value: TipoCursoEspecial; label: string }[] = [
  { value: TipoCursoEspecial.VACACIONES,   label: 'Vacaciones' },
  { value: TipoCursoEspecial.CURSO_VERANO, label: 'Curso de Verano' },
];

// Duraciones de clase disponibles para configurar disciplinas
export const DURACION_OPTIONS: { value: number; label: string }[] = [
  { value: 45,  label: '45 min' },
  { value: 60,  label: '60 min' },
  { value: 90,  label: '90 min' },
  { value: 120, label: '2 horas' },
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
