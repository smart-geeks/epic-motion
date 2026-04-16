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
  domicilio: string;
  institucionEducativa: string;
  celular: string;
  emailAlumna: string;
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
}

export interface GrupoCard {
  id: string;
  nombre: string;
  edadMin: number;
  edadMax: number;
  horasPorSemana: number;
  dias: string[];
  horaInicio: string;
  duracionMinutos: number;
  cupo: number;
  inscritos: number; // para calcular disponibilidad en UI
  disciplinas: DisciplinaCard[];
  tarifa: {
    id: string;
    precioMensualidad: number;
    precioPreseason: number;
  } | null;
}

// ---------------------------------------------------------------------------
// Paso 2 — Pago
// ---------------------------------------------------------------------------

export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA';

export interface DatosPagoWizard {
  metodoPago: MetodoPago;
  referencia: string;       // número de referencia para transferencias
  comprobanteUrl: string | null; // URL en Supabase Storage (opcional)
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
  alumnaIdExistente: string | null; // ID para reinscripción
  alumna: DatosAlumnaWizard;
  tutor: DatosTutorWizard;
  infoGeneral: DatosInfoGeneralWizard;
  grupoSeleccionadoId: string | null;
  grupoSeleccionado: GrupoCard | null;
  cuotaInscripcion: number; // de Configuracion.cuota_inscripcion
  pago: DatosPagoWizard;
  resultado: ResultadoInscripcion | null;
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
