'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Check, ChevronDown, Loader2, X } from 'lucide-react';
import type { CursoEspecialData, ProfesorData } from '@/types/configuracion';
import { updateCursoEspecial } from '@/lib/actions/config-grupos';
import { TIPOS_CURSO_ESPECIAL } from '@/lib/constants';

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
const DIA_LABEL: Record<string, string> = { L: 'Lu', M: 'Ma', X: 'Mi', J: 'Ju', V: 'Vi', S: 'Sá', D: 'Do' };

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

export interface EditCursoEspecialModalProps {
  curso: CursoEspecialData;
  profesores: ProfesorData[];
  onClose: () => void;
  onSaved: () => void;
}

export default function EditCursoEspecialModal({ curso, profesores, onClose, onSaved }: EditCursoEspecialModalProps) {
  const [form, setForm] = useState({
    nombre: curso.nombre,
    tipo: curso.tipo as 'VACACIONES' | 'CURSO_VERANO',
    descripcion: curso.descripcion ?? '',
    fechaInicio: toDateInput(curso.fechaInicio),
    fechaFin: toDateInput(curso.fechaFin),
    cupo: curso.cupo,
    precio: curso.precio,
    activo: curso.activo,
    diasSemana: curso.diasSemana as ('L' | 'M' | 'X' | 'J' | 'V' | 'S' | 'D')[],
    horaInicio: curso.horaInicio,
    duracionMinutos: curso.duracionMinutos,
    profesorId: curso.profesorId ?? '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  function toggleDia(dia: typeof DIAS[number]) {
    setForm((p) => ({
      ...p,
      diasSemana: p.diasSemana.includes(dia)
        ? p.diasSemana.filter((d) => d !== dia)
        : [...p.diasSemana, dia],
    }));
  }

  async function handleGuardar() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (form.diasSemana.length === 0) { setError('Selecciona al menos un día.'); return; }
    setGuardando(true);
    setError('');
    const res = await updateCursoEspecial({
      id: curso.id,
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      descripcion: form.descripcion.trim() || null,
      fechaInicio: form.fechaInicio,
      fechaFin: form.fechaFin,
      cupo: form.cupo,
      precio: form.precio,
      activo: form.activo,
      diasSemana: form.diasSemana,
      horaInicio: form.horaInicio,
      duracionMinutos: form.duracionMinutos,
      profesorId: form.profesorId || null,
    });
    setGuardando(false);
    if (!res.ok) {
      const msg = res.error ?? 'Error al guardar.';
      setError(msg);
      toast.error(msg);
      return;
    }
    toast.success('Curso actualizado correctamente.');
    onSaved();
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-lg dark:bg-[#1a1a1a] bg-white rounded-2xl border dark:border-white/8 border-gray-200 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-white/8 border-gray-100">
          <div>
            <h3 className="font-montserrat font-bold text-base dark:text-white text-gray-900">Editar curso especial</h3>
            <p className="font-inter text-xs dark:text-epic-silver text-gray-500 mt-0.5">{curso.nombre}</p>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="dark:text-white/40 text-gray-400 hover:dark:text-white hover:text-gray-900 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">

          {/* Nombre */}
          <div>
            <label htmlFor="ce-nombre" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Nombre</label>
            <input
              id="ce-nombre"
              title="Nombre del curso"
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
            />
          </div>

          {/* Tipo */}
          <div>
            <label htmlFor="ce-tipo" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Tipo</label>
            <div className="relative">
              <select
                id="ce-tipo"
                title="Tipo de curso"
                value={form.tipo}
                onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as 'VACACIONES' | 'CURSO_VERANO' }))}
                className="w-full appearance-none px-3 py-2.5 pr-8 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
              >
                {TIPOS_CURSO_ESPECIAL.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ce-fecha-ini" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Fecha inicio</label>
              <input
                id="ce-fecha-ini"
                type="date"
                title="Fecha de inicio"
                value={form.fechaInicio}
                onChange={(e) => setForm((p) => ({ ...p, fechaInicio: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="ce-fecha-fin" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Fecha fin</label>
              <input
                id="ce-fecha-fin"
                type="date"
                title="Fecha de fin"
                value={form.fechaFin}
                onChange={(e) => setForm((p) => ({ ...p, fechaFin: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
              />
            </div>
          </div>

          {/* Cupo + Precio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ce-cupo" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Cupo máx.</label>
              <input
                id="ce-cupo"
                type="number" min={1} max={500}
                title="Cupo máximo"
                value={form.cupo}
                onChange={(e) => setForm((p) => ({ ...p, cupo: +e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="ce-precio" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Precio (MXN)</label>
              <input
                id="ce-precio"
                type="number" min={0} step={50}
                title="Precio del curso"
                value={form.precio}
                onChange={(e) => setForm((p) => ({ ...p, precio: +e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
              />
            </div>
          </div>

          {/* Días de la semana */}
          <div>
            <label className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-2 tracking-wide uppercase">Días de la semana</label>
            <div className="flex gap-2 flex-wrap">
              {DIAS.map((dia) => {
                const activo = form.diasSemana.includes(dia);
                return (
                  <button
                    key={dia}
                    type="button"
                    title={dia}
                    onClick={() => toggleDia(dia)}
                    className={[
                      'w-9 h-9 rounded-lg text-xs font-inter font-medium transition-colors',
                      activo
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'dark:bg-white/5 bg-gray-100 dark:text-white/40 text-gray-500 border dark:border-white/8 border-gray-200 hover:border-cyan-500/30',
                    ].join(' ')}
                  >
                    {DIA_LABEL[dia]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hora + Duración */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ce-hora" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Hora inicio</label>
              <input
                id="ce-hora"
                type="time"
                title="Hora de inicio"
                value={form.horaInicio}
                onChange={(e) => setForm((p) => ({ ...p, horaInicio: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="ce-duracion" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Duración (min)</label>
              <input
                id="ce-duracion"
                type="number" min={15} max={480} step={15}
                title="Duración en minutos"
                value={form.duracionMinutos}
                onChange={(e) => setForm((p) => ({ ...p, duracionMinutos: +e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
              />
            </div>
          </div>

          {/* Profesor */}
          <div>
            <label htmlFor="ce-profesor" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Profesor asignado</label>
            <div className="relative">
              <select
                id="ce-profesor"
                title="Profesor asignado"
                value={form.profesorId}
                onChange={(e) => setForm((p) => ({ ...p, profesorId: e.target.value }))}
                className="w-full appearance-none px-3 py-2.5 pr-8 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
              >
                <option value="">— Sin asignar —</option>
                {profesores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Estado activo */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-inter text-xs font-medium dark:text-epic-silver text-gray-600 uppercase tracking-wide">Estado del curso</p>
              <p className="font-inter text-xs dark:text-white/40 text-gray-500 mt-0.5">
                {form.activo ? 'Activo — inscripciones abiertas' : 'Pendiente — inscripciones cerradas'}
              </p>
            </div>
            <button
              type="button"
              title={form.activo ? 'Activo — clic para cerrar inscripciones' : 'Pendiente — clic para abrir inscripciones'}
              onClick={() => setForm((p) => ({ ...p, activo: !p.activo }))}
              className={[
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
                form.activo ? 'bg-cyan-500' : 'dark:bg-white/15 bg-gray-300',
              ].join(' ')}
            >
              <span
                className={[
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200',
                  form.activo ? 'translate-x-5' : 'translate-x-0',
                ].join(' ')}
              />
            </button>
          </div>

          {/* Notas internas */}
          <div>
            <label htmlFor="ce-descripcion" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Notas internas</label>
            <textarea
              id="ce-descripcion"
              value={form.descripcion}
              onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
              placeholder="Detalles de operación, requisitos, notas..."
              rows={3}
              title="Notas internas del curso"
              className="w-full px-3 py-2.5 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors resize-none placeholder:dark:text-white/20 placeholder:text-gray-400"
            />
          </div>

          {error && <p className="font-inter text-xs text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t dark:border-white/8 border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-inter dark:text-white/60 text-gray-500 hover:dark:text-white hover:text-gray-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-inter font-medium bg-cyan-500 text-white hover:bg-cyan-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {guardando ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
