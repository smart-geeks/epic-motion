'use client';

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

// Variantes visuales del card
const VARIANT_CLASSES = {
  default: 'dark:bg-[#121212] bg-white border dark:border-white/8 border-gray-200',
  cyan:    'dark:bg-[#0d1417] bg-cyan-50/60 border dark:border-cyan-500/15 border-cyan-200/60',
  inset:   'dark:bg-zinc-900 bg-gray-50 border dark:border-white/8 border-gray-200',
} as const;

// Estilos de hover según variante (solo cuando es interactivo)
const HOVER_CLASSES = {
  default: 'hover:border-epic-gold/50 dark:hover:bg-[#181818] hover:shadow-md',
  cyan:    'hover:border-cyan-500/40 dark:hover:bg-[#101c20] hover:shadow-md',
  inset:   'hover:dark:bg-zinc-800 hover:bg-gray-100',
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
