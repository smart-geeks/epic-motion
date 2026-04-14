'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const videos = [
  {
    id: '6787763843503279365',
    titulo: 'Presentación de Ballet',
  },
  {
    id: '6785359702889991429',
    titulo: 'Presentación de Hip-Hop',
  },
  {
    id: '6803526935071788294',
    titulo: 'Presentación Contemporáneo',
  },
];

interface VideoCardProps {
  id: string;
  titulo: string;
  index: number;
}

function VideoCard({ id, titulo, index }: VideoCardProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: 'easeOut' }}
      className="flex flex-col gap-3 flex-none w-[72vw] md:w-auto"
    >
      {/* Embed TikTok — proporción 9:16 */}
      <div className="relative w-full aspect-[9/16]">
        <iframe
          src={`https://www.tiktok.com/embed/v2/${id}`}
          className="absolute inset-0 w-full h-full rounded-lg border border-gray-200 dark:border-white/10"
          allowFullScreen
          allow="encrypted-media"
          title={titulo}
          loading="lazy"
        />
      </div>

      <p className="font-montserrat font-bold text-xs tracking-[0.08em] uppercase text-epic-black dark:text-white/70 px-1">
        {titulo}
      </p>
    </motion.div>
  );
}

export default function GaleriaTikTok() {
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { once: true, margin: '-80px' });

  const tiktokRef = useRef(null);
  const tiktokInView = useInView(tiktokRef, { once: true, margin: '-60px' });

  return (
    <section id="galeria" className="py-24 px-4 bg-gray-50 dark:bg-epic-black">
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
              Nuestras
            </span>
            <span className="block font-light text-gray-500 dark:text-epic-silver text-[clamp(1.5rem,4vw,2.5rem)] tracking-[0.05em] uppercase">
              presentaciones
            </span>
          </h2>
          <div className="w-16 h-px bg-epic-gold mt-6" />
        </motion.div>

        {/* Mobile: carrusel horizontal · Desktop: grid 3 columnas */}
        <div className="flex md:grid md:grid-cols-3 gap-5 md:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none -mx-4 md:mx-0 px-4 md:px-0 pb-4 md:pb-0 mb-12 [&::-webkit-scrollbar]:hidden">
          {videos.map((v, i) => (
            <VideoCard key={v.id} {...v} index={i} />
          ))}
        </div>

        {/* TikTok follow */}
        <motion.div
          ref={tiktokRef}
          initial={{ opacity: 0, y: 10 }}
          animate={tiktokInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="w-8 h-px bg-epic-gold flex-shrink-0" />
          <p className="font-inter text-sm text-gray-500 dark:text-epic-silver">
            Síguenos en TikTok{' '}
            <a
              href="https://tiktok.com/@epicmotionds"
              target="_blank"
              rel="noopener noreferrer"
              className="text-epic-gold hover:underline font-medium"
            >
              @epicmotionds
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
