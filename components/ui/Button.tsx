'use client';

import { forwardRef } from 'react';

type Variante = 'primary' | 'secondary' | 'ghost' | 'danger';
type Tamano = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANTES: Record<Variante, string> = {
  primary: [
    'bg-epic-gold text-epic-black',
    'hover:bg-epic-gold/90 hover:scale-[1.02] hover:shadow-liquid-lg',
    'active:scale-[0.98] active:shadow-none',
    'dark:bg-epic-gold dark:text-epic-black',
    'font-montserrat font-bold tracking-[0.15em] uppercase',
    'shadow-liquid',
  ].join(' '),
  secondary: [
    'bg-white/[0.06] text-white',
    'border border-white/10',
    'hover:bg-white/[0.10] hover:border-white/20 hover:scale-[1.015] hover:shadow-glass-sm',
    'active:scale-[0.99]',
    'dark:bg-white/[0.06] dark:text-white dark:border-white/10',
    'light:bg-white light:text-epic-black light:border-gray-200',
    'light:hover:bg-gray-50',
    'font-inter font-medium',
  ].join(' '),
  ghost: [
    'bg-transparent text-white/50',
    'hover:text-white hover:bg-white/[0.05] hover:scale-[1.01]',
    'active:scale-[0.99]',
    'font-inter',
  ].join(' '),
  danger: [
    'bg-red-500/80 text-white',
    'border border-red-500/30',
    'hover:bg-red-500 hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(239,68,68,0.25)]',
    'active:scale-[0.98]',
    'font-inter font-medium',
  ].join(' '),
};

const TAMANOS: Record<Tamano, string> = {
  xs: 'px-2 py-1 text-[10px] rounded-md',
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-sm rounded-xl',
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
        type={props.type ?? 'button'}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center gap-2',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-epic-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
          VARIANTES[variante],
          TAMANOS[tamano],
          fullWidth ? 'w-full' : '',
          disabled || loading ? 'opacity-40 cursor-not-allowed !scale-100 !shadow-none' : 'cursor-pointer',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
