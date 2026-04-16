'use client';

import { forwardRef } from 'react';

type Variante = 'primary' | 'secondary' | 'ghost' | 'danger';
type Tamano = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANTES: Record<Variante, string> = {
  primary:
    'bg-epic-gold text-epic-black hover:bg-epic-gold/90 dark:bg-epic-gold dark:text-epic-black font-montserrat font-bold tracking-[0.15em] uppercase',
  secondary:
    'bg-white dark:bg-white/10 text-epic-black dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/15 font-inter font-medium',
  ghost:
    'bg-transparent text-gray-600 dark:text-epic-silver hover:text-epic-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 font-inter',
  danger:
    'bg-red-500 text-white hover:bg-red-600 font-inter font-medium',
};

const TAMANOS: Record<Tamano, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-sm',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variante = 'primary',
      tamano = 'md',
      loading = false,
      fullWidth = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center gap-2 transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-epic-gold focus-visible:ring-offset-2',
          VARIANTES[variante],
          TAMANOS[tamano],
          fullWidth ? 'w-full' : '',
          disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
