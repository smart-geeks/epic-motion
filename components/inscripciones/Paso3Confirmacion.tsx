'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { CheckCheck, Copy, MessageCircle, Printer, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useWizardInscripcion } from '@/stores/wizard-inscripcion.store';
import { useRouter } from 'next/navigation';

const TicketPago = dynamic(
  () => import('@/components/inscripciones/TicketPago'),
  { ssr: false }
);

export default function Paso3Confirmacion() {
  const {
    resultado, alumna, grupoSeleccionado, esReinscripcion, resetWizard,
    tutor, cuotaInscripcion, cicloEscolar, pago, pdfUrl,
  } = useWizardInscripcion();
  const router = useRouter();
  const [copiado, setCopiado] = useState(false);

  const emailPadre       = resultado?.emailPadre       ?? '';
  const passwordTemporal = resultado?.passwordTemporal ?? '';
  const alumnaId         = resultado?.alumnaId         ?? '';
  const mostrarCredenciales = !esReinscripcion && !!passwordTemporal;

  const tutorNombre = tutor.nombreMadre || tutor.nombrePadre;
  const precioMensualidad = grupoSeleccionado?.tarifa?.precioMensualidad ?? 0;

  const copiarCredenciales = async () => {
    const texto = `Email: ${emailPadre}\nContraseña: ${passwordTemporal}`;
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    toast.success('Credenciales copiadas al portapapeles');
    setTimeout(() => setCopiado(false), 3000);
  };

  const imprimirTicket = () => {
    window.print();
  };

  const enviarPorWhatsApp = () => {
    const texto =
      `¡Hola! Bienvenida a Epic Motion ✨\n` +
      `Tus credenciales de acceso al portal son:\n` +
      `📧 Email: ${emailPadre}\n` +
      `🔑 Contraseña: ${passwordTemporal}\n\n` +
      `📄 Tu PDF de inscripción (resumen + reglamento + horario):\n` +
      `${pdfUrl || 'Generando...'}\n\n` +
      `👉 *Importante*: Te recomendamos cambiar tu contraseña en el primer inicio de sesión.\n\n` +
      `Cualquier duda quedo a tus órdenes.`;
    const numero = tutor.celularMadre || tutor.celularPadre || '';
    window.open(`https://wa.me/52${numero}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* ── Resumen de la inscripción ─────────────────────────────────── */}
      <div className="rounded-sm border border-white/10 divide-y divide-white/10">
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
      {mostrarCredenciales && (
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
                {emailPadre}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-inter text-xs text-gray-500 dark:text-epic-silver">Contraseña</span>
              <span className="font-mono text-sm font-bold text-epic-gold tracking-widest">
                {passwordTemporal}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={imprimirTicket}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-sm border border-epic-gold/30 hover:bg-epic-gold/10 transition-colors font-inter text-sm text-epic-gold"
            >
              <Printer size={14} />
              Imprimir Ticket
            </button>
            <button
              type="button"
              onClick={copiarCredenciales}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-sm border border-epic-gold/30 hover:bg-epic-gold/10 transition-colors font-inter text-sm text-epic-gold"
            >
              {copiado ? <CheckCheck size={14} /> : <Copy size={14} />}
              {copiado ? 'Copiado' : 'Copiar credenciales'}
            </button>
          </div>

          <button
            type="button"
            onClick={enviarPorWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-sm bg-green-600/20 border border-green-500/30 hover:bg-green-600/30 transition-colors font-inter text-sm text-green-500 hover:text-green-400"
          >
            <MessageCircle size={14} />
            Enviar por WhatsApp
            {pdfUrl && <span className="text-xs opacity-70">+ PDF</span>}
          </button>

          <p className="font-inter text-xs text-amber-600 dark:text-amber-400 text-center mt-2">
            Comparte estas credenciales y adjunta el PDF del Reglamento.
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
          onClick={resetWizard}
        >
          Nueva inscripción
        </Button>
        <Button
          tamano="lg"
          fullWidth
          onClick={() => {
            resetWizard();
            router.push('/admin/alumnas');
          }}
        >
          Finalizar
        </Button>
      </div>

      {/* ── Ticket oculto para impresión ──────────────────────────────── */}
      <div id="ticket-container" className="invisible fixed top-0 left-0">
        {alumnaId && grupoSeleccionado && (
          <TicketPago
            alumna={alumna}
            grupoNombre={grupoSeleccionado.nombre}
            disciplinas={grupoSeleccionado.disciplinas}
            cuotaInscripcion={cuotaInscripcion}
            precioMensualidad={precioMensualidad}
            pago={pago}
            tutorNombre={tutorNombre}
            cicloEscolar={cicloEscolar}
            alumnaId={alumnaId}
          />
        )}
      </div>
    </div>
  );
}
