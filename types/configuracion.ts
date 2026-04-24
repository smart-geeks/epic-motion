// Tipos de dominio para el módulo de configuración.
// Fuente única de verdad — no repetir en rutas API, actions ni componentes.

// ─── Entidades de lectura (DTOs que viajan al cliente) ─────────────────────

export interface GrupoConfigData {
  id: string;
  nombre: string;
  categoria: string;
  esCompetitivo: boolean;
  tier: string;
  edadMin: number;
  edadMax: number;
  cupo: number;
  inscritos: number;
  activo: boolean;
  descripcion: string | null;
  idGrupoSiguiente: string | null;
  grupoSiguienteNombre: string | null;
  profesorId: string | null;
  profesorNombre: string | null;
  salonId: string | null;
  salonNombre: string | null;
  disciplinas: { id: string; nombre: string; color: string | null; horaTexto: string }[];
  tarifa: { precioMensualidad: number } | null;
}

export interface HorarioAlumna {
  disciplinaId: string;
  nombre: string;
  color: string | null;
  dias: string[];
  horaTexto: string;
}

export interface AlumnaConfigData {
  id: string;
  nombre: string;
  apellido: string;
  foto: string | null;
  fechaNacimiento: string;
  estatus: string;
  invitadaCompetencia: boolean;
  grupoActual: { id: string; nombre: string } | null;
  cargosPendientes: number;
  cargosVencidos: number;
  montoDeuda: number;
  padreId: string;
  padre: { nombre: string; apellido: string; telefono: string | null; email: string };
  horarios: HorarioAlumna[];
}

export interface CursoEspecialData {
  id: string;
  nombre: string;
  tipo: 'VACACIONES' | 'CURSO_VERANO';
  descripcion: string | null;
  fechaInicio: string;
  fechaFin: string;
  cupo: number;
  inscritas: number;
  precio: number;
  activo: boolean;
  diasSemana: string[];
  horaInicio: string;
  duracionMinutos: number;
  profesorId: string | null;
  profesorNombre: string | null;
}

export interface DisciplinaConfigData {
  id: string;
  nombre: string;
  color: string | null;
}

export interface ProfesorData {
  id: string;
  nombre: string;
  apellido: string;
}

// ─── Tipos de resultado de mutaciones ─────────────────────────────────────

export interface ResumenGrupoCreado {
  nombre: string;
  tier: string;
  numDisciplinas: number;
  precioMensualidad: number;
  activo: boolean;
}

export type ReasignacionResult =
  | { ok: true }
  | { ok: false; error: string }
  | { ok: false; error: 'FUERA_DE_RANGO'; edadAlumna: number; edadMin: number; edadMax: number };

// ─── Inputs de mutaciones (validados con Zod en la capa de actions) ────────

export interface UpdateGrupoInput {
  id: string;
  nombre: string;
  cupo: number;
  edadMin: number;
  edadMax: number;
  tier: string;
  idGrupoSiguiente: string | null;
  activo: boolean;
  descripcion: string | null;
  profesorId: string | null;
  salonId: string | null;
}

export interface DisciplinaRowInput {
  disciplinaId: string;
  dias: string[];
  horaInicio: string;
  duracionMinutos: number;
}

export interface CrearGrupoInput {
  nombre: string;
  categoria: string;
  edadMin: number;
  edadMax: number;
  cupo: number;
  disciplinas: DisciplinaRowInput[];
  precioMensualidad: number;
  activo: boolean;
  profesorId?: string | null;
  salonId?: string | null;
  descripcion?: string | null;
}

export interface DatosClonacion {
  id: string;
  nombre: string;
  categoria: string;
  edadMin: number;
  edadMax: number;
  cupo: number;
  activo: boolean;
  descripcion: string | null;
  profesorId: string | null;
  salonId: string | null;
  precioMensualidad: number | null;
  disciplinas: {
    disciplinaId: string;
    dias: string[];
    horaInicio: string;
    duracionMinutos: number;
    horaTexto: string;
  }[];
}

export interface UpdateCursoEspecialInput {
  id: string;
  nombre: string;
  tipo: 'VACACIONES' | 'CURSO_VERANO';
  descripcion: string | null;
  fechaInicio: string;
  fechaFin: string;
  cupo: number;
  precio: number;
  activo: boolean;
  diasSemana: ('L' | 'M' | 'X' | 'J' | 'V' | 'S' | 'D')[];
  horaInicio: string;
  duracionMinutos: number;
  profesorId: string | null;
}
export interface SalonData { id: string; nombre: string; }
