'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import type { GrupoConfigData } from '@/types/configuracion';

interface GrupoSelectProps {
  value: string;
  grupos: GrupoConfigData[];
  alumnaLabel: string;
  className?: string;
  onChange: (grupoId: string) => void;
}

export default function GrupoSelect({ value, grupos, alumnaLabel, className = 'shrink-0 w-40', onChange }: GrupoSelectProps) {
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    function handleScroll(e: Event) {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  function toggleOpen() {
    if (!open && btnRef.current) setMenuRect(btnRef.current.getBoundingClientRect());
    setOpen((o) => !o);
  }

  const etiqueta = grupos.find((g) => g.id === value)?.nombre ?? 'Sin grupo';

  return (
    <div className={className}>
      <button
        ref={btnRef}
        type="button"
        aria-label={`Grupo de ${alumnaLabel}`}
        onClick={toggleOpen}
        className={[
          'w-full flex items-center justify-between gap-2 pl-3 pr-2 py-1.5 rounded-xl text-xs font-inter',
          'dark:bg-white/[0.05] bg-white',
          'dark:border dark:border-white/[0.08] border border-gray-200',
          'dark:text-white/70 text-gray-700',
          'hover:dark:border-epic-gold/40 hover:border-epic-gold/60',
          'focus:outline-none transition-all cursor-pointer',
          open ? 'dark:border-epic-gold/50 border-epic-gold/70' : '',
        ].join(' ')}
      >
        <span className="truncate">{etiqueta}</span>
        <ChevronDown
          size={11}
          className={['shrink-0 dark:text-white/30 text-gray-400 transition-transform duration-200', open ? 'rotate-180' : ''].join(' ')}
        />
      </button>

      {open && menuRect && createPortal(
        <div
          ref={menuRef}
          style={{
            '--dp-top':   `${menuRect.bottom + 6}px`,
            '--dp-left':  `${menuRect.left}px`,
            '--dp-width': `${menuRect.width}px`,
          } as React.CSSProperties}
          className={[
            'dropdown-portal rounded-xl overflow-hidden',
            'dark:bg-[#141414] bg-white',
            'dark:border dark:border-white/[0.08] border border-gray-200',
            'shadow-[0_12px_40px_rgba(0,0,0,0.55)]',
            'py-1 max-h-56 overflow-y-auto',
          ].join(' ')}
        >
          {[{ id: '', nombre: 'Sin grupo' }, ...grupos].map((g) => {
            const activo = g.id === value;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => { onChange(g.id); setOpen(false); }}
                className={[
                  'w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-inter text-left transition-colors',
                  activo
                    ? 'dark:bg-epic-gold/10 bg-amber-50 dark:text-epic-gold text-amber-700'
                    : 'dark:text-white/60 text-gray-600 dark:hover:bg-white/[0.05] hover:bg-gray-50',
                ].join(' ')}
              >
                <span className="truncate">{g.nombre}</span>
                {activo && <Check size={11} className="shrink-0 text-epic-gold" />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
