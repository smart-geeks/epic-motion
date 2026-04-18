'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import type { DisciplinaPublica } from '@/app/api/disciplinas/route';

interface EstiloCardProps extends DisciplinaPublica {
  index: number;
  isMobileActive: boolean;
  onTouch: (index: number) => void;
}

function EstiloCard({ imagenUrl, nombre, descripcion, index, isMobileActive, onTouch }: EstiloCardProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  // Centra las últimas 2 cards en el grid de 6 columnas desktop
  const colStart = index === 3 ? 'md:col-start-2' : index === 4 ? 'md:col-start-4' : '';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease: 'easeOut' }}
      className={`group flex flex-col md:col-span-2 ${colStart}`}
      onTouchStart={(e) => {
        e.preventDefault();
        onTouch(index);
      }}
    >
      {/* Imagen cuadrada — grayscale por defecto, color en hover desktop o tap mobile */}
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <Image
          src={imagenUrl ?? '/images/ballet.webp'}
          alt={nombre}
          fill
          className={[
            'object-cover object-center transition-all duration-500',
            'grayscale',
            'md:group-hover:grayscale-0',
            isMobileActive ? 'grayscale-0' : '',
          ].join(' ')}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* Texto */}
      <div className="pt-5 pb-2 flex flex-col gap-2">
        <h3 className="font-montserrat font-bold text-xl tracking-[0.04em] uppercase text-epic-black dark:text-white">
          {nombre}
        </h3>
        <div className="w-8 h-px bg-epic-gold" />
        <p className="font-inter text-sm text-gray-600 dark:text-epic-silver leading-relaxed mt-1">
          {descripcion}
        </p>
      </div>
    </motion.div>
  );
}

interface EstilosGridProps {
  disciplinas: DisciplinaPublica[];
}

export default function EstilosGrid({ disciplinas }: EstilosGridProps) {
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { once: true, margin: '-80px' });
  const [mobileActive, setMobileActive] = useState<number | null>(null);

  if (disciplinas.length === 0) return null;

  return (
    <section id="estilos" className="py-24 px-4 bg-white dark:bg-epic-black">
      <div className="max-w-6xl mx-auto">
        {/* Título */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-12"
        >
          <h2 className="font-montserrat leading-tight">
            <span className="block font-bold text-epic-black dark:text-white text-[clamp(1.5rem,4vw,2.5rem)] tracking-[0.05em] uppercase">
              {disciplinas.length === 1 ? 'Una disciplina,' : `${disciplinas.length === 5 ? 'Cinco' : disciplinas.length} disciplinas,`}
            </span>
            <span className="block font-light text-gray-500 dark:text-epic-silver text-[clamp(1.5rem,4vw,2.5rem)] tracking-[0.05em] uppercase">
              un mismo espíritu
            </span>
          </h2>
          <div className="w-16 h-px bg-epic-gold mt-6" />
        </motion.div>

        {/* Grid: 1 col mobile · 2 col tablet · 6-col desktop (cada card ocupa 2 cols) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-8 md:gap-10">
          {disciplinas.map((d, i) => (
            <EstiloCard
              key={d.id}
              {...d}
              index={i}
              isMobileActive={mobileActive === i}
              onTouch={(idx) => setMobileActive((prev) => (prev === idx ? null : idx))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
