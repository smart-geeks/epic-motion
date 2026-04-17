'use client';

interface Opcion {
  value: string;
  label: string;
  descripcion?: string;
}

interface RadioGroupProps {
  label?: string;
  opciones: Opcion[];
  valor: string;
  onChange: (valor: string) => void;
  error?: string;
  name: string;
}

export default function RadioGroup({
  label,
  opciones,
  valor,
  onChange,
  error,
  name,
}: RadioGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="font-inter text-xs font-medium tracking-wide uppercase text-gray-500 dark:text-epic-silver">
          {label}
        </span>
      )}
      <div className="flex flex-wrap gap-2">
        {opciones.map((op) => {
          const activo = valor === op.value;
          return (
            <label
              key={op.value}
              className={[
                'flex items-center gap-2.5 px-4 py-2.5 cursor-pointer border transition-colors rounded-sm',
                activo
                  ? 'border-epic-gold bg-epic-gold/10 dark:bg-epic-gold/20 text-epic-black dark:text-white'
                  : 'bg-transparent dark:bg-black/30 border-gray-200 dark:border-white/20 text-gray-600 dark:text-epic-silver hover:border-epic-gold/50 dark:hover:bg-white/8',
              ].join(' ')}
            >
              <input
                type="radio"
                name={name}
                value={op.value}
                checked={activo}
                onChange={() => onChange(op.value)}
                className="sr-only"
              />
              <span
                className={[
                  'w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0',
                  activo ? 'border-epic-gold' : 'border-gray-300 dark:border-white/30',
                ].join(' ')}
              >
                {activo && (
                  <span className="w-1.5 h-1.5 rounded-full bg-epic-gold" />
                )}
              </span>
              <span className="font-inter text-sm font-medium">{op.label}</span>
              {op.descripcion && (
                <span className="font-inter text-xs text-gray-400 dark:text-white/30">
                  {op.descripcion}
                </span>
              )}
            </label>
          );
        })}
      </div>
      {error && (
        <p className="font-inter text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
