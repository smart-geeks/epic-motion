'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check } from 'lucide-react';

const beneficios = [
  'Instructores certificados con formación internacional',
  'Instalaciones de primer nivel con piso profesional',
  'Metodología probada y adaptada a cada edad',
  'Grupos reducidos para atención personalizada',
  'Presentaciones regulares en escenario real',
  'Ambiente seguro, disciplinado y motivador',
];

export default function Nosotros() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <section id="nosotros" className="py-24 px-4 bg-white dark:bg-epic-black">
      <div ref={ref} className="max-w-3xl mx-auto">
        {/* Título — alineado izquierda */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-10"
        >
          <h2 className="font-montserrat leading-tight">
            <span className="block font-bold text-epic-black dark:text-white text-[clamp(1.5rem,4vw,2.5rem)] tracking-[0.05em] uppercase">
              Dale a tu hijo
            </span>
            <span className="block font-light text-gray-500 dark:text-epic-silver text-[clamp(1.5rem,4vw,2.5rem)] tracking-[0.05em] uppercase">
              el mejor inicio
            </span>
          </h2>
          <div className="w-16 h-px bg-epic-gold mt-6" />
        </motion.div>

        {/* Párrafo — centrado */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="font-inter text-gray-600 dark:text-epic-silver text-sm leading-relaxed text-center mb-10"
        >
          En Epic Motion formamos bailarines completos: técnica sólida, disciplina mental y amor genuino por la danza. Cada alumno recibe la atención que merece para desarrollar su máximo potencial.
        </motion.p>

        {/* Lista de beneficios — centrada */}
        <ul className="flex flex-col items-center gap-4 mb-12">
          {beneficios.map((b, i) => (
            <motion.li
              key={b}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.25 + i * 0.07 }}
              className="flex items-center gap-3 w-full max-w-md"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-epic-gold/10 border border-epic-gold flex items-center justify-center">
                <Check size={11} className="text-epic-gold" strokeWidth={3} />
              </span>
              <span className="font-inter text-sm text-gray-700 dark:text-epic-silver leading-snug">{b}</span>
            </motion.li>
          ))}
        </ul>

        {/* Botón — centrado */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex justify-center"
        >
          <motion.a
            href="https://wa.me/528712044277?text=Hola%20Epic%20Motion%2C%20quiero%20agendar%20una%20clase%20de%20prueba"
            target="_blank"
            rel="noopener noreferrer"
            onHoverStart={() => setBtnHovered(true)}
            onHoverEnd={() => setBtnHovered(false)}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="group relative inline-flex items-center overflow-hidden font-montserrat font-bold text-xs tracking-[0.12em] px-8 py-4 uppercase"
          >
            {/* Borde base */}
            <span className="absolute inset-0 border border-gray-300 dark:border-epic-gold" />

            {/* Fill dorado que barre de izquierda a derecha */}
            <motion.span
              className="absolute inset-0 bg-epic-gold origin-left"
              animate={{ scaleX: btnHovered ? 1 : 0 }}
              transition={{ duration: 0.38, ease: [0.76, 0, 0.24, 1] }}
            />

            {/* Texto + flecha — color cambia via CSS group-hover */}
            <span className="relative z-10 flex items-center gap-2 text-gray-800 dark:text-epic-gold group-hover:text-epic-black transition-colors duration-300">
              Agenda Clase de Prueba
              <motion.span
                animate={{ x: btnHovered ? 5 : 0, opacity: btnHovered ? 1 : 0.4 }}
                transition={{ duration: 0.3 }}
              >
                →
              </motion.span>
            </span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
