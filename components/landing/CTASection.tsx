'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.79a4.85 4.85 0 0 1-1.01-.1z" />
    </svg>
  );
}

const redes = [
  {
    label: '@epicmotiondancestudio',
    href: 'https://instagram.com/epicmotiondancestudio',
    icon: InstagramIcon,
  },
  {
    label: 'Epic Motion Dance Studio',
    href: 'https://facebook.com/epicmotiondancestudio',
    icon: FacebookIcon,
  },
  {
    label: '@epicmotionds',
    href: 'https://tiktok.com/@epicmotionds',
    icon: TikTokIcon,
  },
];

export default function CTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <section className="relative py-32 px-4 overflow-hidden bg-white dark:bg-epic-gray border-t-2 border-epic-gold">
      <div ref={ref} className="relative max-w-3xl mx-auto text-center">
        {/* Título */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-8"
        >
          <h2 className="font-montserrat leading-tight">
            <span className="block font-bold text-epic-black dark:text-white text-[clamp(1.5rem,4vw,2.5rem)] tracking-[0.05em] uppercase">
              ¿Listo para
            </span>
            <span className="block font-light text-gray-500 dark:text-epic-silver text-[clamp(1.5rem,4vw,2.5rem)] tracking-[0.05em] uppercase">
              el primer paso?
            </span>
          </h2>
        </motion.div>

        {/* Texto */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="font-inter text-gray-600 dark:text-epic-silver text-sm leading-relaxed mb-10 max-w-xl mx-auto"
        >
          Agenda una clase de prueba gratuita y descubre por qué Epic Motion es el lugar donde los grandes bailarines comienzan. Sin compromiso, solo danza.
        </motion.p>

        {/* Botón principal — negro en light, dorado en dark */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-14"
        >
          <motion.a
            href="https://wa.me/528712044277?text=Hola%20Epic%20Motion%2C%20quiero%20agendar%20una%20clase%20de%20prueba%20gratuita"
            target="_blank"
            rel="noopener noreferrer"
            onHoverStart={() => setBtnHovered(true)}
            onHoverEnd={() => setBtnHovered(false)}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="group relative inline-flex items-center overflow-hidden font-montserrat font-bold text-sm tracking-[0.12em] px-10 py-5 uppercase"
          >
            {/* Fondo base */}
            <span className="absolute inset-0 bg-epic-black dark:bg-epic-gold" />

            {/* Fill inverso que barre al hacer hover — blanco en dark, dorado en light */}
            <motion.span
              className="absolute inset-0 bg-white dark:bg-epic-black origin-left"
              animate={{ scaleX: btnHovered ? 1 : 0 }}
              transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
            />

            {/* Texto + flecha */}
            <span className="relative z-10 flex items-center gap-3 text-white dark:text-epic-black group-hover:text-epic-black dark:group-hover:text-epic-gold transition-colors duration-300">
              Clase de Prueba Gratuita
              <motion.span
                animate={{ x: btnHovered ? 5 : 0, opacity: btnHovered ? 1 : 0.5 }}
                transition={{ duration: 0.3 }}
              >
                →
              </motion.span>
            </span>
          </motion.a>
        </motion.div>

        {/* Divisor */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="w-full h-px bg-gray-200 dark:bg-white/10 mb-10 origin-center"
        />

        {/* Redes sociales */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          {redes.map((red) => (
            <a
              key={red.label}
              href={red.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-500 dark:text-epic-silver hover:text-epic-gold dark:hover:text-epic-gold transition-colors duration-200 group"
            >
              <span className="group-hover:scale-110 transition-transform inline-flex">
                <red.icon size={18} />
              </span>
              <span className="font-inter text-xs tracking-wide">{red.label}</span>
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
