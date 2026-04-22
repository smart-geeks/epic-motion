import { Check } from 'lucide-react';

interface PasoIndicadorProps {
  pasoActual: 1 | 2 | 3;
}

const PASOS = [
  { numero: 1, label: 'Datos' },
  { numero: 2, label: 'Pago' },
  { numero: 3, label: 'Confirmación' },
];

export default function PasoIndicador({ pasoActual }: PasoIndicadorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-12 select-none relative">
      <div className="flex items-center w-full max-w-xl">
        {PASOS.map((paso, idx) => {
          const completado = paso.numero < pasoActual;
          const activo = paso.numero === pasoActual;

          return (
            <div key={paso.numero} className="flex-1 flex items-center">
              {/* Círculo del paso */}
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div
                  className={[
                    'w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 border shadow-lg',
                    completado
                      ? 'bg-epic-gold border-epic-gold text-epic-black scale-95 shadow-epic-gold/20'
                      : activo
                      ? 'bg-white/[0.08] border-epic-gold text-epic-gold scale-110 shadow-epic-gold/10'
                      : 'bg-white/[0.03] border-white/10 text-white/20',
                  ].join(' ')}
                >
                  {completado ? (
                    <Check size={18} strokeWidth={3} />
                  ) : (
                    <span className="font-montserrat font-black text-sm">{paso.numero}</span>
                  )}
                </div>
                <span
                  className={[
                    'font-montserrat text-[10px] tracking-[0.1em] uppercase font-bold text-center w-max transition-colors duration-300',
                    activo
                      ? 'text-white'
                      : completado
                        ? 'text-epic-gold/70'
                        : 'text-white/20',
                  ].join(' ')}
                >
                  {paso.label}
                </span>
              </div>

              {/* Línea conectora */}
              {idx < PASOS.length - 1 && (
                <div className="flex-1 px-2 -mt-6">
                  <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-epic-gold transition-all duration-700 ease-in-out"
                      style={{ width: completado ? '100%' : '0%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
