'use client';

interface CheckboxProps {
  id: string;
  label: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  disabled?: boolean;
}

export default function Checkbox({
  id,
  label,
  checked,
  onChange,
  error,
  disabled,
}: CheckboxProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className={[
          'flex items-start gap-3 cursor-pointer',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        <span
          className={[
            'mt-0.5 w-5 h-5 shrink-0 rounded-sm border-2 flex items-center justify-center transition-colors',
            checked
              ? 'bg-epic-gold border-epic-gold'
              : 'border-gray-300 dark:border-white/30 bg-transparent',
          ].join(' ')}
        >
          {checked && (
            <svg
              className="w-3 h-3 text-epic-black"
              fill="none"
              viewBox="0 0 12 12"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <span className="font-inter text-sm text-gray-700 dark:text-epic-silver leading-snug">
          {label}
        </span>
      </label>
      {error && (
        <p className="font-inter text-xs text-red-500 dark:text-red-400 ml-8">{error}</p>
      )}
    </div>
  );
}
