'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  ArrowRightLeft, 
  CheckCircle2, 
  ChevronRight, 
  XCircle,
  Zap,
  Info
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfigCard from '@/components/ui/ConfigCard';
import { accionEjecutarPromocion } from '@/lib/actions/promociones';
import type { AccionPromocionResult } from '@/lib/actions/promociones';

type EstadoPromocion = 'idle' | 'confirmando' | 'procesando';

export default function TabOperaciones() {
  const [estado, setEstado] = useState<EstadoPromocion>('idle');
  const [resultado, setResultado] = useState<AccionPromocionResult | null>(null);

  const solicitarConfirmacion = () => {
    setResultado(null);
    setEstado('confirmando');
  };

  const cancelar = () => setEstado('idle');

  const ejecutar = async () => {
    setEstado('procesando');
    const toastId = toast.loading('Ejecutando promoción de ciclo…');

    try {
      const res = await accionEjecutarPromocion();
      setResultado(res);
      setEstado('idle');

      if (res.errores.length > 0) {
        toast.warning(res.mensaje, { id: toastId, duration: 6000 });
      } else if (res.promovidas === 0) {
        toast.info(res.mensaje, { id: toastId });
      } else {
        toast.success(res.mensaje, { id: toastId });
      }
    } catch (e) {
      setEstado('idle');
      toast.error(e instanceof Error ? e.message : 'Error al ejecutar la promoción', {
        id: toastId,
      });
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Sección: Promoción de Ciclo */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-2 ps-1">
          <div className="w-10 h-10 rounded-2xl bg-epic-gold/10 flex items-center justify-center shrink-0">
            <Zap size={20} className="text-epic-gold" />
          </div>
          <div>
            <h2 className="font-montserrat font-bold text-lg text-white">
              Operaciones de <span className="text-epic-gold">Ciclo</span>
            </h2>
            <p className="font-inter text-sm text-white/40">
              Acciones masivas globales para el cierre e inicio de cursos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Action Card */}
          <div className="lg:col-span-7">
            <ConfigCard>
              <div className="flex items-start gap-4 p-2">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                  <ArrowRightLeft size={24} className="text-white/60" />
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <h3 className="font-montserrat font-bold text-white text-base">
                      Promoción de Ciclo Escolar
                    </h3>
                    <p className="text-sm font-inter text-white/40 mt-1 leading-relaxed">
                      Mueve automáticamente a todas las alumnas inscritas a su grupo siguiente.
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Info size={14} className="text-epic-gold" />
                      <p className="text-[10px] font-montserrat font-bold uppercase tracking-wider text-white/60">¿Qué sucede al ejecutar?</p>
                    </div>
                    <ul className="space-y-2.5 ps-1">
                      {[
                        'Actualiza el grupo de cada alumna.',
                        'Recalcula mensualidades según nuevas tarifas.',
                        'Solo afecta grupos con "Siguiente" configurado.',
                        'Afecta cargos PENDIENTES activos.'
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <ChevronRight size={14} className="text-epic-gold shrink-0 mt-0.5" />
                          <span className="font-inter text-xs text-white/60">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {estado === 'confirmando' ? (
                    <div className="bg-amber-500/10 rounded-2xl p-5 border border-amber-500/20 space-y-4">
                      <div className="flex gap-3 text-amber-400">
                        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                        <p className="text-xs font-inter leading-relaxed">
                          <strong className="block text-sm font-montserrat font-bold mb-1">ATENCIÓN</strong>
                          Esta acción es masiva e irreversible. Una vez iniciada, no hay marcha atrás automática.
                        </p>
                      </div>
                      <div className="flex gap-3 justify-end items-center">
                        <button onClick={cancelar} className="text-xs font-montserrat font-bold text-white/40 hover:text-white uppercase tracking-widest px-4 py-2">
                          Cancelar
                        </button>
                        <Button 
                          tamano="sm" 
                          onClick={ejecutar}
                          className="bg-amber-500 hover:bg-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                        >
                          Confirmar Promoción
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variante="secondary"
                      loading={estado === 'procesando'}
                      onClick={solicitarConfirmacion}
                      disabled={estado === 'procesando'}
                      className="w-full justify-center group py-4 h-auto rounded-2xl text-base font-montserrat font-bold uppercase tracking-widest"
                    >
                      <ArrowRightLeft size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                      {estado === 'procesando' ? 'Procesando ciclo…' : 'Iniciar Promoción Global'}
                    </Button>
                  )}
                </div>
              </div>
            </ConfigCard>
          </div>

          {/* Results Sidebar */}
          <div className="lg:col-span-5">
            {resultado ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Promovidas" value={resultado.promovidas} color="text-green-400" bg="bg-green-500/5" icon={CheckCircle2} />
                  <StatCard label="Errores" value={resultado.errores.length} color="text-red-400" bg="bg-red-500/5" icon={XCircle} />
                  <StatCard label="Sin Grupo Sig." value={resultado.sinGrupoSiguiente} color="text-amber-400" bg="bg-amber-500/5" icon={AlertTriangle} className="col-span-2" />
                </div>

                {resultado.errores.length > 0 && (
                  <ConfigCard variant="inset" className="!p-4">
                    <p className="text-[10px] font-montserrat font-bold uppercase tracking-widest text-white/30 mb-3 ps-1">Errores detectados</p>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
                      {resultado.errores.map((e, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-white/5 rounded-xl p-3 border border-white/5">
                          <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] font-inter text-white/60 leading-snug">
                            {e.detalle}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ConfigCard>
                )}
              </div>
            ) : (
              <div className="glass p-8 rounded-[2.5rem] border-white/5 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
                  <Zap size={32} className="text-white/10" />
                </div>
                <p className="text-sm font-inter text-white/20 italic">
                  No se han ejecutado promociones<br/>en esta sesión.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, color, bg, icon: Icon, className = "" }: { label: string; value: number; color: string; bg: string; icon: any; className?: string }) {
  return (
    <div className={`${bg} rounded-[2rem] p-6 border border-white/5 flex flex-col items-center justify-center text-center ${className}`}>
      <Icon size={16} className={`${color} mb-3`} />
      <p className={`font-montserrat font-bold text-3xl ${color} tracking-tight`}>{value}</p>
      <p className="text-[10px] uppercase font-montserrat font-bold tracking-widest text-white/30 mt-1">{label}</p>
    </div>
  );
}
