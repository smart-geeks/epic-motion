'use client';

import { useState, useCallback } from 'react';
import { Search, UserCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import RadioGroup from '@/components/ui/RadioGroup';
import Checkbox from '@/components/ui/Checkbox';
import ArmadorClases from '@/components/inscripciones/ArmadorClases';
import { useWizardInscripcion } from '@/stores/wizard-inscripcion.store';
import type { GrupoCard, AlumnaBusqueda } from '@/types/inscripciones';
import { CANALES_CONTACTO } from '@/lib/constants';

interface Paso1DatosProps {
  grupos: GrupoCard[];
  cuotaInscripcion: number;
  cicloEscolar: string;
}

// ── Calcula edad a partir de ISO string ────────────────────────────────────
function calcularEdad(fechaISO: string): number | null {
  if (!fechaISO) return null;
  const hoy = new Date();
  const nac = new Date(fechaISO);
  if (isNaN(nac.getTime())) return null;
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

export default function Paso1Datos({ grupos, cicloEscolar }: Paso1DatosProps) {
  const {
    alumna, setDatosAlumna,
    tutor, setDatosTutor,
    infoGeneral, setInfoGeneral,
    grupoSeleccionadoId, setGrupoSeleccionado,
    esReinscripcion, alumnaIdExistente,
    cargarAlumnaExistente, cancelarReinscripcion,
    setPaso,
  } = useWizardInscripcion();

  const [busqueda, setBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<AlumnaBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  // ── Búsqueda de alumna existente ─────────────────────────────────────────
  const buscarAlumna = useCallback(async () => {
    if (busqueda.trim().length < 2) {
      toast.error('Ingresa al menos 2 caracteres para buscar');
      return;
    }
    setBuscando(true);
    try {
      const res = await fetch(`/api/inscripciones/buscar?q=${encodeURIComponent(busqueda)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResultadosBusqueda(data);
      if (data.length === 0) toast('Sin resultados', { description: 'No se encontró ninguna alumna con ese nombre.' });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al buscar');
    } finally {
      setBuscando(false);
    }
  }, [busqueda]);

  const seleccionarAlumnaExistente = (a: AlumnaBusqueda) => {
    const edad = calcularEdad(a.fechaNacimiento);
    cargarAlumnaExistente(
      a.id,
      {
        nombre: a.nombre,
        apellido: a.apellido,
        fechaNacimiento: a.fechaNacimiento.split('T')[0],
        institucionEducativa: '',
      },
      {
        nombreMadre: a.padre.nombre + ' ' + a.padre.apellido,
        celularMadre: a.padre.telefono ?? '',
        emailMadre: a.padre.email,
        telefonoTrabajoMadre: '',
        nombrePadre: '',
        celularPadre: '',
        emailPadre: '',
        telefonoTrabajoPadre: '',
        domicilio: '',
      }
    );
    setResultadosBusqueda([]);
    setBusqueda('');
    toast.success(`Reinscripción de ${a.nombre} ${a.apellido}`, {
      description: `Estatus anterior: ${a.estatus}${edad ? ` · ${edad} años` : ''}`,
    });
  };

  // ── Validación del paso ───────────────────────────────────────────────────
  const validar = () => {
    const e: Record<string, string> = {};
    if (!alumna.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (!alumna.apellido.trim()) e.apellido = 'El apellido es obligatorio';
    if (!alumna.fechaNacimiento) e.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
    if (!grupoSeleccionadoId) e.grupo = 'Selecciona un grupo';
    if (!tutor.nombreMadre && !tutor.nombrePadre) e.tutor = 'Ingresa el nombre de al menos un tutor';
    if (!tutor.emailMadre && !tutor.emailPadre) {
      e.email = 'Se requiere al menos un correo de contacto (madre o padre)';
    }
    if (!infoGeneral.aceptaTerminos) {
      e.aceptaTerminos = 'El tutor debe aceptar los términos y condiciones';
    }
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const avanzar = () => {
    if (validar()) setPaso(2);
  };

  const edad = calcularEdad(alumna.fechaNacimiento);

  return (
    <div className="space-y-8">

      {/* ── Búsqueda de reinscripción ─────────────────────────────────── */}
      <div className="p-4 rounded-sm bg-transparent dark:bg-black/40 border border-gray-200 dark:border-white/10">
        <p className="font-inter text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-epic-silver mb-3">
          ¿Es reinscripción?
        </p>

        {esReinscripcion && alumnaIdExistente ? (
          <div className="flex items-center justify-between gap-3 p-3 rounded-sm bg-epic-gold/10 border border-epic-gold/30">
            <div className="flex items-center gap-2">
              <UserCheck size={16} className="text-epic-gold shrink-0" />
              <span className="font-inter text-sm font-medium text-epic-black dark:text-white">
                Reinscripción: {alumna.nombre} {alumna.apellido}
              </span>
            </div>
            <button
              type="button"
              onClick={cancelarReinscripcion}
              className="text-gray-400 dark:text-white/30 hover:text-epic-black dark:hover:text-white"
              title="Cancelar reinscripción"
              aria-label="Cancelar reinscripción"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarAlumna()}
              placeholder="Buscar alumna por nombre..."
              className="flex-1 font-inter text-sm px-3.5 py-2.5 bg-transparent dark:bg-black/40 border border-gray-200 dark:border-white/20 text-epic-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:outline-none focus:border-epic-gold focus:ring-1 focus:ring-epic-gold/40 rounded-sm transition-colors"
            />
            <Button
              type="button"
              variante="secondary"
              tamano="md"
              loading={buscando}
              onClick={buscarAlumna}
            >
              <Search size={15} />
            </Button>
          </div>
        )}

        {/* Resultados de búsqueda */}
        {resultadosBusqueda.length > 0 && (
          <ul className="mt-2 border border-gray-200 dark:border-white/10 rounded-sm overflow-hidden">
            {resultadosBusqueda.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => seleccionarAlumnaExistente(a)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-inter text-sm font-medium text-epic-black dark:text-white">
                      {a.nombre} {a.apellido}
                    </p>
                    <p className="font-inter text-xs text-gray-400 dark:text-white/30">
                      Tutor: {a.padre.nombre} {a.padre.apellido} · {a.padre.email}
                    </p>
                  </div>
                  <span
                    className={[
                      'font-inter text-xs px-2 py-0.5 rounded-full',
                      a.estatus === 'ACTIVA'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-epic-silver',
                    ].join(' ')}
                  >
                    {a.estatus}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Sección: ALUMNA/O ─────────────────────────────────────────── */}
      <section>
        <h3 className="font-montserrat font-bold text-xs tracking-[0.18em] uppercase text-epic-black dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-white/8">
          Alumna/o
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombre"
            required
            value={alumna.nombre}
            onChange={(e) => setDatosAlumna({ nombre: e.target.value })}
            error={errores.nombre}
            placeholder="Nombre(s)"
          />
          <Input
            label="Apellido"
            required
            value={alumna.apellido}
            onChange={(e) => setDatosAlumna({ apellido: e.target.value })}
            error={errores.apellido}
            placeholder="Apellido(s)"
          />
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                label="Fecha de nacimiento"
                type="date"
                required
                value={alumna.fechaNacimiento}
                onChange={(e) => setDatosAlumna({ fechaNacimiento: e.target.value })}
                error={errores.fechaNacimiento}
              />
            </div>
            {edad !== null && (
              <div className="mb-0 pb-2.5">
                <span className="font-inter text-sm font-semibold text-epic-gold">
                  {edad} años
                </span>
              </div>
            )}
          </div>
          <Input
            label="Institución educativa"
            value={alumna.institucionEducativa}
            onChange={(e) => setDatosAlumna({ institucionEducativa: e.target.value })}
            placeholder="Colegio o escuela"
            className="sm:col-span-2"
          />
        </div>
      </section>

      {/* ── Sección: DISCIPLINA / GRUPO ──────────────────────────────── */}
      <section>
        <h3 className="font-montserrat font-bold text-xs tracking-[0.18em] uppercase text-epic-black dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-white/8">
          Disciplina / Grupo
        </h3>
        <ArmadorClases
          grupos={grupos}
          fechaNacimiento={alumna.fechaNacimiento}
          grupoSeleccionadoId={grupoSeleccionadoId}
          onSelect={setGrupoSeleccionado}
          cicloEscolar={cicloEscolar}
          error={errores.grupo}
        />
      </section>

      {/* ── Sección: PADRE / MADRE / TUTOR ───────────────────────────── */}
      <section>
        <h3 className="font-montserrat font-bold text-xs tracking-[0.18em] uppercase text-epic-black dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-white/8">
          Padre, Madre o Tutor
        </h3>
        {errores.tutor && (
          <p className="font-inter text-xs text-red-500 dark:text-red-400 mb-3">{errores.tutor}</p>
        )}
        <div className="grid grid-cols-1 gap-6">
          {/* Madre */}
          <div>
            <p className="font-inter text-xs font-semibold text-gray-500 dark:text-epic-silver mb-3">Madre</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre completo"
                value={tutor.nombreMadre}
                onChange={(e) => setDatosTutor({ nombreMadre: e.target.value })}
                placeholder="Nombre de la madre"
                className="sm:col-span-2"
              />
              <Input
                label="Celular"
                type="tel"
                value={tutor.celularMadre}
                onChange={(e) => setDatosTutor({ celularMadre: e.target.value })}
                placeholder="(871) 000-0000"
              />
              <Input
                label="Email"
                type="email"
                value={tutor.emailMadre}
                onChange={(e) => setDatosTutor({ emailMadre: e.target.value })}
                error={errores.email}
                placeholder="correo@ejemplo.com"
              />
              <Input
                label="Teléfono trabajo"
                type="tel"
                value={tutor.telefonoTrabajoMadre}
                onChange={(e) => setDatosTutor({ telefonoTrabajoMadre: e.target.value })}
                placeholder="(871) 000-0000"
              />
              <Input
                label="Domicilio"
                value={tutor.domicilio}
                onChange={(e) => setDatosTutor({ domicilio: e.target.value })}
                placeholder="Calle, colonia, ciudad"
                className="sm:col-span-2"
              />
            </div>
          </div>

          {/* Padre */}
          <div>
            <p className="font-inter text-xs font-semibold text-gray-500 dark:text-epic-silver mb-3">Padre</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre completo"
                value={tutor.nombrePadre}
                onChange={(e) => setDatosTutor({ nombrePadre: e.target.value })}
                placeholder="Nombre del padre"
                className="sm:col-span-2"
              />
              <Input
                label="Celular"
                type="tel"
                value={tutor.celularPadre}
                onChange={(e) => setDatosTutor({ celularPadre: e.target.value })}
                placeholder="(871) 000-0000"
              />
              <Input
                label="Email"
                type="email"
                value={tutor.emailPadre}
                onChange={(e) => setDatosTutor({ emailPadre: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
              <Input
                label="Teléfono trabajo"
                type="tel"
                value={tutor.telefonoTrabajoPadre}
                onChange={(e) => setDatosTutor({ telefonoTrabajoPadre: e.target.value })}
                placeholder="(871) 000-0000"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Sección: INFORMACIÓN GENERAL ─────────────────────────────── */}
      <section>
        <h3 className="font-montserrat font-bold text-xs tracking-[0.18em] uppercase text-epic-black dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-white/8">
          Información General
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Otra academia */}
          <div className="space-y-2">
            <RadioGroup
              name="otraAcademia"
              label="¿Ha estado en otra academia?"
              opciones={[
                { value: 'si', label: 'Sí' },
                { value: 'no', label: 'No' },
              ]}
              valor={infoGeneral.otraAcademia ? 'si' : 'no'}
              onChange={(v) => setInfoGeneral({ otraAcademia: v === 'si', nombreOtraAcademia: '' })}
            />
            {infoGeneral.otraAcademia && (
              <Input
                label="Nombre de la academia"
                value={infoGeneral.nombreOtraAcademia}
                onChange={(e) => setInfoGeneral({ nombreOtraAcademia: e.target.value })}
                placeholder="Nombre de la academia anterior"
              />
            )}
          </div>

          {/* Enfermedad o lesión */}
          <div className="space-y-2">
            <RadioGroup
              name="enfermedad"
              label="¿Sufre alguna enfermedad o lesión?"
              opciones={[
                { value: 'si', label: 'Sí' },
                { value: 'no', label: 'No' },
              ]}
              valor={infoGeneral.tieneEnfermedad ? 'si' : 'no'}
              onChange={(v) => setInfoGeneral({ tieneEnfermedad: v === 'si', descripcionEnfermedad: '' })}
            />
            {infoGeneral.tieneEnfermedad && (
              <Input
                label="Descripción"
                value={infoGeneral.descripcionEnfermedad}
                onChange={(e) => setInfoGeneral({ descripcionEnfermedad: e.target.value })}
                placeholder="Información importante"
              />
            )}
          </div>

          {/* Canal de contacto */}
          <div className="sm:col-span-2">
            <RadioGroup
              name="canalContacto"
              label="¿Cómo prefiere que nos comuniquemos?"
              opciones={CANALES_CONTACTO}
              valor={infoGeneral.canalContacto}
              onChange={(v) =>
                setInfoGeneral({ canalContacto: v as 'WHATSAPP' | 'EMAIL' | 'TELEFONO' })
              }
            />
          </div>

          {/* Términos y condiciones */}
          <div className="sm:col-span-2 pt-2">
            <Checkbox
              id="aceptaTerminos"
              checked={infoGeneral.aceptaTerminos}
              onChange={(v) => setInfoGeneral({ aceptaTerminos: v })}
              error={errores.aceptaTerminos}
              label="El padre/tutor acepta los términos y condiciones de la academia."
            />
          </div>
        </div>
      </section>

      {/* ── Botón siguiente ───────────────────────────────────────────── */}
      <div className="flex justify-end pt-2">
        <Button tamano="lg" onClick={avanzar} fullWidth>
          Siguiente →
        </Button>
      </div>
    </div>
  );
}
