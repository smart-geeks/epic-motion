// ─────────────────────────────────────────────────────────────────────────────
// Tipos compartidos del wizard de inscripción
// Usados por: componentes cliente, store Zustand, API routes, server action
// ─────────────────────────────────────────────────────────────────────────────

// ---------------------------------------------------------------------------
// Paso 1 — Datos
// ---------------------------------------------------------------------------

export interface DatosAlumnaWizard {
  nombre: string;
  apellido: string;
  fechaNacimiento: string; // ISO string "YYYY-MM-DD"; convertir a Date en el server
  institucionEducativa: string;
}

export interface DatosTutorWizard {
  // Madre
  nombreMadre: string;
  celularMadre: string;
  emailMadre: string;
  telefonoTrabajoMadre: string;
  // Padre
  nombrePadre: string;
  celularPadre: string;
  emailPadre: string;
  telefonoTrabajoPadre: string;
  domicilio: string;
}

export interface DatosInfoGeneralWizard {
  otraAcademia: boolean;
  nombreOtraAcademia: string;
  tieneEnfermedad: boolean;
  descripcionEnfermedad: string;
  canalContacto: 'WHATSAPP' | 'EMAIL' | 'TELEFONO';
  aceptaTerminos: boolean;
}

// ---------------------------------------------------------------------------
// Grupos — respuesta de GET /api/grupos
// ---------------------------------------------------------------------------

export interface DisciplinaCard {
  id: string;
  nombre: string;
  color: string | null;
  horaTexto: string; // "Lun y Mié 17:00–18:00" — horario específico de esta disciplina en el grupo
}

export interface GrupoCard {
  id: string;
  nombre: string;
  categoria: string; // 'EPIC_TOTZ' | 'HAPPY_FEET' | 'EPIC_ONE' | 'TEEN' | 'COMPETICION'
  esCompetitivo: boolean;
  tier: string; // 'BASE' | 'T1' | 'T2' | 'T3' | 'T4' | 'FULL'
  edadMin: number;
  edadMax: number;
  horasPorSemana: number;
  dias: string[];
  horaInicio: string;
  duracionMinutos: number;
  cupo: number;
  inscritos: number;
  disciplinas: DisciplinaCard[];
  tarifa: {
    id: string;
    precioMensualidad: number;
    precioPreseason: number | null;
  } | null;
}

// Respuesta de GET /api/grupos
export interface GruposAPIResponse {
  grupos: GrupoCard[];
  cicloEscolar: string;
}

// ---------------------------------------------------------------------------
// Paso 2 — Pago
// ---------------------------------------------------------------------------

export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA';

export interface DatosPagoWizard {
  metodoPago: MetodoPago;
  referencia: string;
  comprobanteUrl: string | null;
  montoAjustado: number | null; // null = sin ajuste (usar precio calculado)
  motivoAjuste: string;          // obligatorio si montoAjustado !== null
}

// ---------------------------------------------------------------------------
// Estado completo del wizard (Zustand store)
// ---------------------------------------------------------------------------

export interface ResultadoInscripcion {
  alumnaId: string;
  padreId: string;
  emailPadre: string;
  passwordTemporal: string; // solo disponible una vez; vacío en reinscripción
}

export interface EstadoWizard {
  paso: 1 | 2 | 3;
  esReinscripcion: boolean;
  alumnaIdExistente: string | null;
  alumna: DatosAlumnaWizard;
  tutor: DatosTutorWizard;
  infoGeneral: DatosInfoGeneralWizard;
  grupoSeleccionadoId: string | null;
  grupoSeleccionado: GrupoCard | null;
  cuotaInscripcion: number;
  cicloEscolar: string;
  pago: DatosPagoWizard;
  resultado: ResultadoInscripcion | null;
  pdfUrl: string | null;
}

// ---------------------------------------------------------------------------
// Payload del POST /api/inscripciones
// ---------------------------------------------------------------------------

export interface InscripcionPayload {
  alumnaId?: string; // presente solo en reinscripción
  alumna: DatosAlumnaWizard;
  tutor: DatosTutorWizard;
  infoGeneral: DatosInfoGeneralWizard;
  grupoId: string;
  pago: DatosPagoWizard;
}

// Respuesta del POST /api/inscripciones
export type InscripcionAPIResponse =
  | { ok: true; alumnaId: string; padreId: string; emailPadre: string; passwordTemporal: string }
  | { ok: false; error: string; campos?: Record<string, string[]> };

// ---------------------------------------------------------------------------
// Búsqueda de alumnas (reinscripción) — respuesta de GET /api/inscripciones/buscar
// ---------------------------------------------------------------------------

export interface AlumnaBusqueda {
  id: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string; // ISO
  estatus: string;
  padre: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
  };
}
