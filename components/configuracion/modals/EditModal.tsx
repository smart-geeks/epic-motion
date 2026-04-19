'use client';

import { useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, X } from 'lucide-react';
import type { GrupoConfigData } from '@/app/api/configuracion/grupos/route';
import type { ProfesorData } from '@/lib/actions/config-grupos';
import { updateGrupoConfig } from '@/lib/actions/config-grupos';
import { TIERS } from '@/lib/constants';

export interface EditModalProps {
  grupo: GrupoConfigData;
  todosGrupos: GrupoConfigData[];
  profesores: ProfesorData[];
  onClose: () => void;
  onSaved: () => void;
}

export default function EditModal({ grupo, todosGrupos, profesores, onClose, onSaved }: EditModalProps) {
  const [form, setForm] = useState({
    nombre: grupo.nombre,
    cupo: grupo.cupo,
    edadMin: grupo.edadMin,
    edadMax: grupo.edadMax,
    tier: grupo.tier,
    idGrupoSiguiente: grupo.idGrupoSiguiente ?? '',
    activo: grupo.activo,
    descripcion: grupo.descripcion ?? '',
    profesorId: grupo.profesorId ?? '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  const otros = todosGrupos.filter((g) => g.id !== grupo.id);

  async function handleGuardar() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (form.edadMin >= form.edadMax) { setError('La edad mínima debe ser menor a la máxima.'); return; }
    setGuardando(true);
    setError('');
    const res = await updateGrupoConfig({
      id: grupo.id,
      nombre: form.nombre.trim(),
      cupo: form.cupo,
      edadMin: form.edadMin,
      edadMax: form.edadMax,
      tier: form.tier,
      idGrupoSiguiente: form.idGrupoSiguiente || null,
      activo: form.activo,
      descripcion: form.descripcion.trim() || null,
      profesorId: form.profesorId || null,
    });
    setGuardando(false);
    if (!res.ok) { setError(res.error ?? 'Error al guardar.'); return; }
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
            <h3 className="font-montserrat font-bold text-base dark:text-white text-gray-900">Editar grupo</h3>
            <p className="font-inter text-xs dark:text-epic-silver text-gray-500 mt-0.5">{grupo.nombre}</p>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="dark:text-white/40 text-gray-400 hover:dark:text-white hover:text-gray-900 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* Nombre */}
          <div>
            <label htmlFor="edit-nombre" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Nombre</label>
            <input
              id="edit-nombre"
              title="Nombre del grupo"
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
            />
          </div>

          {/* Cupo + Tier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-cupo" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Cupo máx.</label>
              <input
                id="edit-cupo"
                type="number" min={1} max={100}
                title="Cupo máximo del grupo"
                value={form.cupo}
                onChange={(e) => setForm((p) => ({ ...p, cupo: +e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="edit-tier" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Tier</label>
              <div className="relative">
                <select
                  id="edit-tier"
                  title="Tier del grupo"
                  value={form.tier}
                  onChange={(e) => setForm((p) => ({ ...p, tier: e.target.value }))}
                  className="w-full appearance-none px-3 py-2.5 pr-8 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
                >
                  {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Rango de edad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-edad-min" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Edad mín.</label>
              <input
                id="edit-edad-min"
                type="number" min={0} max={99}
                title="Edad mínima del grupo"
                value={form.edadMin}
                onChange={(e) => setForm((p) => ({ ...p, edadMin: +e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="edit-edad-max" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">Edad máx.</label>
              <input
                id="edit-edad-max"
                type="number" min={0} max={99}
                title="Edad máxima del grupo"
                value={form.edadMax}
                onChange={(e) => setForm((p) => ({ ...p, edadMax: +e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
              />
            </div>
          </div>

          {/* Grupo siguiente para promoción */}
          <div>
            <label htmlFor="edit-grupo-siguiente" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">
              Grupo siguiente (promoción 1 Jul)
            </label>
            <div className="relative">
              <select
                id="edit-grupo-siguiente"
                title="Grupo al que se promoverán las alumnas el 1 de julio"
                value={form.idGrupoSiguiente}
                onChange={(e) => setForm((p) => ({ ...p, idGrupoSiguiente: e.target.value }))}
                className="w-full appearance-none px-3 py-2.5 pr-8 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors"
              >
                <option value="">— Sin promoción automática —</option>
                {otros.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre} ({g.edadMin}–{g.edadMax} años)
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Profesor asignado */}
          <div>
            <label htmlFor="edit-profesor" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">
              Profesor asignado
            </label>
            <div className="relative">
              <select
                id="edit-profesor"
                title="Profesor asignado al grupo"
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

          {/* Estado activo / inactivo */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-inter text-xs font-medium dark:text-epic-silver text-gray-600 uppercase tracking-wide">Estado del grupo</p>
              <p className="font-inter text-xs dark:text-white/40 text-gray-500 mt-0.5">
                {form.activo ? 'Activo — aparece en inscripciones' : 'Inactivo — oculto en inscripciones'}
              </p>
            </div>
            <button
              type="button"
              title={form.activo ? 'Activo — clic para desactivar' : 'Inactivo — clic para activar'}
              onClick={() => setForm((p) => ({ ...p, activo: !p.activo }))}
              className={[
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
                form.activo ? 'bg-epic-gold' : 'dark:bg-white/15 bg-gray-300',
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
            <label htmlFor="edit-descripcion" className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-1.5 tracking-wide uppercase">
              Notas internas
            </label>
            <textarea
              id="edit-descripcion"
              value={form.descripcion}
              onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
              placeholder="Motivo de creación, notas de operación, etc."
              rows={3}
              title="Notas internas del grupo"
              className="w-full px-3 py-2.5 rounded-lg text-sm font-inter dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-epic-gold/50 transition-colors resize-none placeholder:dark:text-white/20 placeholder:text-gray-400"
            />
          </div>

          {/* Disciplinas (read-only) */}
          {grupo.disciplinas.length > 0 && (
            <div>
              <label className="block font-inter text-xs font-medium dark:text-epic-silver text-gray-600 mb-2 tracking-wide uppercase">
                Disciplinas del grupo
              </label>
              <div className="flex flex-wrap gap-2">
                {grupo.disciplinas.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-epic-gold/8 border border-epic-gold/20">
                    <span className="font-inter text-xs font-medium text-epic-gold">{d.nombre}</span>
                    {d.horaTexto && (
                      <span className="font-inter text-[10px] dark:text-white/30 text-gray-400 border-l border-epic-gold/20 pl-2">{d.horaTexto}</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-1.5 font-inter text-[10px] dark:text-white/25 text-gray-400">
                Para modificar disciplinas ve a Configuración → Grupos → Editor de disciplinas.
              </p>
            </div>
          )}

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
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-inter font-medium bg-epic-gold text-black hover:bg-epic-gold/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {guardando ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
