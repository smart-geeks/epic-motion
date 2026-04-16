'use client';

import { useState } from 'react';
import { Check, Copy, CheckCheck, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useWizardInscripcion } from '@/stores/wizard-inscripcion.store';
import { useRouter } from 'next/navigation';

export default function Paso3Confirmacion() {
  const { resultado, alumna, grupoSeleccionado, esReinscripcion, resetWizard } =
    useWizardInscripcion();
  const router = useRouter();
  const [copiado, setCopiado] = useState(false);

  if (!resultado) return null;

  const copiarCredenciales = async () => {
    const texto = `Email: ${resultado.emailPadre}\nContraseña: ${resultado.passwordTemporal}`;
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    toast.success('Credenciales copiadas al portapapeles');
    setTimeout(() => setCopiado(false), 3000);
  };

  const nueva = () => {
    resetWizard();
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">

      {/* ── Checkmark animado ─────────────────────────────────────────── */}
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-epic-gold/15 border-2 border-epic-gold flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-epic-gold" strokeWidth={2.5} />
        </div>
        <h2 className="font-montserrat font-bold text-lg text-epic-black dark:text-white tracking-wide">
          ¡Inscripción completada!
        </h2>
        <p className="font-inter text-sm text-gray-500 dark:text-epic-silver mt-1">
          {alumna.nombre} {alumna.apellido} ha sido{' '}
          {esReinscripcion ? 'reinscrita' : 'inscrita'} correctamente.
        </p>
      </div>

      {/* ── Resumen ───────────────────────────────────────────────────── */}
      <div className="rounded-sm border border-gray-200 dark:border-white/10 divide-y divide-gray-100 dark:divide-white/8">
        <div className="px-5 py-3 flex items-center justify-between">
          <span className="font-inter text-sm text-gray-500 dark:text-epic-silver">Alumna</span>
          <span className="font-inter text-sm font-medium text-epic-black dark:text-white">
            {alumna.nombre} {alumna.apellido}
          </span>
        </div>
        {grupoSeleccionado && (
          <>
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="font-inter text-sm text-gray-500 dark:text-epic-silver">Grupo</span>
              <span className="font-inter text-sm font-medium text-epic-black dark:text-white">
                {grupoSeleccionado.nombre}
              </span>
            </div>
            {grupoSeleccionado.disciplinas.length > 0 && (
              <div className="px-5 py-3 flex items-start justify-between gap-4">
                <span className="font-inter text-sm text-gray-500 dark:text-epic-silver shrink-0">
                  Disciplinas
                </span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {grupoSeleccionado.disciplinas.map((d) => (
                    <Badge key={d.id} label={d.nombre} color={d.color} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <div className="px-5 py-3 flex items-center justify-between">
          <span className="font-inter text-sm text-gray-500 dark:text-epic-silver">Tipo</span>
          <span className="font-inter text-sm font-medium text-epic-black dark:text-white">
            {esReinscripcion ? 'Reinscripción' : 'Inscripción nueva'}
          </span>
        </div>
      </div>

      {/* ── Credenciales de acceso (solo nueva inscripción) ───────────── */}
      {!esReinscripcion && resultado.passwordTemporal && (
        <div className="rounded-sm border border-epic-gold/30 bg-epic-gold/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <UserPlus size={15} className="text-epic-gold shrink-0" />
            <span className="font-montserrat font-bold text-xs tracking-[0.15em] uppercase text-epic-black dark:text-white">
              Credenciales de acceso del padre/tutor
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-inter text-xs text-gray-500 dark:text-epic-silver">Email</span>
              <span className="font-inter text-sm font-medium text-epic-black dark:text-white">
                {resultado.emailPadre}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-inter text-xs text-gray-500 dark:text-epic-silver">Contraseña</span>
              <span className="font-mono text-sm font-bold text-epic-gold tracking-widest">
                {resultado.passwordTemporal}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={copiarCredenciales}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-sm border border-epic-gold/30 hover:bg-epic-gold/10 transition-colors font-inter text-sm text-epic-gold"
          >
            {copiado ? <CheckCheck size={14} /> : <Copy size={14} />}
            {copiado ? 'Copiado' : 'Copiar credenciales'}
          </button>

          <p className="font-inter text-xs text-amber-600 dark:text-amber-400 text-center">
            Comparte estas credenciales con el padre/tutor ahora.
            <br />
            La contraseña no se volverá a mostrar.
          </p>
        </div>
      )}

      {/* ── Botones de acción ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variante="secondary"
          tamano="lg"
          fullWidth
          onClick={() => router.push('/admin/inscripciones')}
        >
          Ver listado
        </Button>
        <Button tamano="lg" fullWidth onClick={nueva}>
          Nueva inscripción
        </Button>
      </div>
    </div>
  );
}
