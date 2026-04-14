'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';

interface Estilo {
  imagen: string;
  titulo: string;
  descripcion: string;
}

interface EstiloCardProps extends Estilo {
  index: number;
  isMobileActive: boolean;
  onTouch: (index: number) => void;
}

function EstiloCard({ imagen, titulo, descripcion, index, isMobileActive, onTouch }: EstiloCardProps) {
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
          src={imagen}
          alt={titulo}
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
          {titulo}
        </h3>
        <div className="w-8 h-px bg-epic-gold" />
        <p className="font-inter text-sm text-gray-600 dark:text-epic-silver leading-relaxed mt-1">
          {descripcion}
        </p>
      </div>
    </motion.div>
  );
}

export default function EstilosGrid() {
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { once: true, margin: '-80px' });
  const [mobileActive, setMobileActive] = useState<number | null>(null);

  const estilos: Estilo[] = [
    {
      imagen: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=600&h=600&fit=crop',
      titulo: 'Ballet',
      descripcion: 'La base de toda danza. Elegancia, disciplina y técnica clásica.',
    },
    {
      imagen: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=600&h=600&fit=crop',
      titulo: 'Hip-Hop',
      descripcion: 'Energía, ritmo y expresión urbana. Estilo que conecta con la cultura actual.',
    },
    {
      imagen: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&h=600&fit=crop',
      titulo: 'Tap',
      descripcion: 'Ritmo con los pies. Precisión y musicalidad en cada paso.',
    },
    {
      imagen: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=600&h=600&fit=crop',
      titulo: 'Jazz',
      descripcion: 'Versatilidad y expresión. Técnica dinámica con estilo propio.',
    },
    {
      imagen: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=600&fit=crop',
      titulo: 'Acro',
      descripcion: 'Fuerza, flexibilidad y acrobacia fusionadas con la danza.',
    },
  ];

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
              Cinco disciplinas,
            </span>
            <span className="block font-light text-gray-500 dark:text-epic-silver text-[clamp(1.5rem,4vw,2.5rem)] tracking-[0.05em] uppercase">
              un mismo espíritu
            </span>
          </h2>
          <div className="w-16 h-px bg-epic-gold mt-6" />
        </motion.div>

        {/* Grid: 1 col mobile · 2 col tablet · 6-col desktop (cada card ocupa 2 cols) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-8 md:gap-10">
          {estilos.map((e, i) => (
            <EstiloCard
              key={e.titulo}
              {...e}
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
