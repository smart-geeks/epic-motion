'use client';

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

// Variantes visuales del card con estética Liquid Glass
const VARIANT_CLASSES = {
  default: 'glass p-6 rounded-[2rem] border-white/5 shadow-lg relative overflow-hidden',
  cyan:    'bg-cyan-500/5 backdrop-blur-md p-6 rounded-[2rem] border-cyan-500/10 shadow-lg relative overflow-hidden',
  inset:   'bg-black/10 backdrop-blur-sm p-6 rounded-[2rem] border-white/5 shadow-inner relative overflow-hidden',
} as const;

// Estilos de hover con resplandor sutil (solo cuando es interactivo)
const HOVER_CLASSES = {
  default: 'hover:border-epic-gold/20 hover:bg-white/[0.04] hover:shadow-epic-gold/5',
  cyan:    'hover:border-cyan-400/20 hover:bg-cyan-500/10 hover:shadow-cyan-400/5',
  inset:   'hover:bg-black/20',
} as const;

type Variant = keyof typeof VARIANT_CLASSES;

interface BaseProps {
  children: ReactNode;
  variant?: Variant;
  interactive?: boolean;
  className?: string;
}

type DivProps = BaseProps & { as?: 'div' } & Omit<HTMLAttributes<HTMLDivElement>, keyof BaseProps>;
type ButtonProps = BaseProps & { as: 'button' } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps>;

type ConfigCardProps = DivProps | ButtonProps;

export default function ConfigCard({
  children,
  variant = 'default',
  interactive = false,
  className = '',
  as: Tag = 'div',
  ...rest
}: ConfigCardProps) {
  const base = 'rounded-xl p-4 space-y-3 transition-all duration-200';
  const variantCls = VARIANT_CLASSES[variant];
  const hoverCls = interactive ? `${HOVER_CLASSES[variant]} cursor-pointer group` : '';
  const combined = [base, variantCls, hoverCls, className].filter(Boolean).join(' ');

  if (Tag === 'button') {
    const { ...btnRest } = rest as Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps>;
    return (
      <button type="button" className={`text-left ${combined}`} {...btnRest}>
        {children}
      </button>
    );
  }

  const { ...divRest } = rest as Omit<HTMLAttributes<HTMLDivElement>, keyof BaseProps>;
  return (
    <div className={combined} {...divRest}>
      {children}
    </div>
  );
}
