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
    <div className="flex items-center justify-center gap-0 mb-8 select-none">
      {PASOS.map((paso, idx) => {
        const completado = paso.numero < pasoActual;
        const activo = paso.numero === pasoActual;

        return (
          <div key={paso.numero} className="flex items-center">
            {/* Círculo del paso */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2',
                  completado
                    ? 'bg-epic-gold border-epic-gold text-epic-black'
                    : activo
                    ? 'bg-epic-black dark:bg-epic-gray border-epic-gold text-epic-gold'
                    : 'bg-transparent border-gray-300 dark:border-white/20 text-gray-400 dark:text-white/30',
                ].join(' ')}
              >
                {completado ? (
                  <Check size={14} strokeWidth={2.5} />
                ) : (
                  <span className="font-montserrat font-bold text-xs">{paso.numero}</span>
                )}
              </div>
              <span
                className={[
                  'font-inter text-xs tracking-wide',
                  activo
                    ? 'text-epic-black dark:text-white font-medium'
                    : completado
                      ? 'text-epic-gold font-medium'
                      : 'text-gray-400 dark:text-white/30',
                ].join(' ')}
              >
                {paso.label}
              </span>
            </div>

            {/* Línea conectora (no en el último paso) */}
            {idx < PASOS.length - 1 && (
              <div
                className={[
                  'w-16 sm:w-24 h-px mx-2 -mt-5 transition-colors duration-300',
                  completado ? 'bg-epic-gold' : 'bg-gray-200 dark:bg-white/15',
                ].join(' ')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
