'use client';

import { create } from 'zustand';
import type {
  EstadoWizard,
  DatosAlumnaWizard,
  DatosTutorWizard,
  DatosInfoGeneralWizard,
  GrupoCard,
  DatosPagoWizard,
  ResultadoInscripcion,
} from '@/types/inscripciones';

// ─────────────────────────────────────────────────────────────────────────────
// Valores iniciales por sección
// ─────────────────────────────────────────────────────────────────────────────

const alumnaVacia: DatosAlumnaWizard = {
  nombre: '',
  apellido: '',
  fechaNacimiento: '',
  domicilio: '',
  institucionEducativa: '',
  celular: '',
  emailAlumna: '',
};

const tutorVacio: DatosTutorWizard = {
  nombreMadre: '',
  celularMadre: '',
  emailMadre: '',
  telefonoTrabajoMadre: '',
  nombrePadre: '',
  celularPadre: '',
  emailPadre: '',
  telefonoTrabajoPadre: '',
};

const infoGeneralVacia: DatosInfoGeneralWizard = {
  otraAcademia: false,
  nombreOtraAcademia: '',
  tieneEnfermedad: false,
  descripcionEnfermedad: '',
  canalContacto: 'WHATSAPP',
  aceptaTerminos: false,
};

const pagoVacio: DatosPagoWizard = {
  metodoPago: 'EFECTIVO',
  referencia: '',
  comprobanteUrl: null,
};

const estadoInicial: EstadoWizard = {
  paso: 1,
  esReinscripcion: false,
  alumnaIdExistente: null,
  alumna: alumnaVacia,
  tutor: tutorVacio,
  infoGeneral: infoGeneralVacia,
  grupoSeleccionadoId: null,
  grupoSeleccionado: null,
  cuotaInscripcion: 0,
  pago: pagoVacio,
  resultado: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Acciones del store
// ─────────────────────────────────────────────────────────────────────────────

interface AccionesWizard {
  setPaso: (paso: 1 | 2 | 3) => void;
  setDatosAlumna: (datos: Partial<DatosAlumnaWizard>) => void;
  setDatosTutor: (datos: Partial<DatosTutorWizard>) => void;
  setInfoGeneral: (datos: Partial<DatosInfoGeneralWizard>) => void;
  setGrupoSeleccionado: (grupo: GrupoCard | null) => void;
  setCuotaInscripcion: (cuota: number) => void;
  setDatosPago: (datos: Partial<DatosPagoWizard>) => void;
  setResultado: (resultado: ResultadoInscripcion) => void;
  // Para reinscripción: pre-llena el formulario con datos de la alumna existente
  cargarAlumnaExistente: (
    alumnaId: string,
    datosAlumna: DatosAlumnaWizard,
    datosTutor: DatosTutorWizard
  ) => void;
  // Limpia el modo reinscripción y vuelve a formulario vacío
  cancelarReinscripcion: () => void;
  // Reinicia el wizard completo
  resetWizard: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useWizardInscripcion = create<EstadoWizard & AccionesWizard>()(
  (set) => ({
    ...estadoInicial,

    setPaso: (paso) => set({ paso }),

    setDatosAlumna: (datos) =>
      set((s) => ({ alumna: { ...s.alumna, ...datos } })),

    setDatosTutor: (datos) =>
      set((s) => ({ tutor: { ...s.tutor, ...datos } })),

    setInfoGeneral: (datos) =>
      set((s) => ({ infoGeneral: { ...s.infoGeneral, ...datos } })),

    setGrupoSeleccionado: (grupo) =>
      set({ grupoSeleccionado: grupo, grupoSeleccionadoId: grupo?.id ?? null }),

    setCuotaInscripcion: (cuota) => set({ cuotaInscripcion: cuota }),

    setDatosPago: (datos) =>
      set((s) => ({ pago: { ...s.pago, ...datos } })),

    setResultado: (resultado) => set({ resultado }),

    cargarAlumnaExistente: (alumnaId, datosAlumna, datosTutor) =>
      set({
        esReinscripcion: true,
        alumnaIdExistente: alumnaId,
        alumna: datosAlumna,
        tutor: datosTutor,
        // Reiniciar sección de grupo y pago para que el admin los seleccione
        grupoSeleccionadoId: null,
        grupoSeleccionado: null,
        pago: pagoVacio,
        resultado: null,
      }),

    cancelarReinscripcion: () =>
      set({
        esReinscripcion: false,
        alumnaIdExistente: null,
        alumna: alumnaVacia,
        tutor: tutorVacio,
      }),

    resetWizard: () => set(estadoInicial),
  })
);
