'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, useGSAP);

const EPIC   = ['E', 'P', 'I', 'C'];
const MOTION = ['M', 'O', 'T', 'I', 'O', 'N'];

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef      = useRef<HTMLDivElement>(null);
  const textRef    = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [btnHovered, setBtnHovered] = useState(false);

  useGSAP(() => {
    // ── Letras: flotan de abajo hacia arriba una a una al hacer scroll ──
    // overflow-hidden en el wrapper enmascara cada letra; GSAP las anima
    // desde y:'110%' (oculta) hasta y:0 (visible) con stagger scrubbed.
    // ── Letras: visibles al inicio, flotan hacia arriba y desaparecen al hacer scroll ──
    gsap.to('.hero-letter', {
      y: '-115%',
      opacity: 0,
      stagger: 0.06,
      ease: 'power2.in',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=450',
        scrub: 1.2,
      },
    });

    // ── Parallax del bloque de texto (sube más rápido que el fondo) ──
    gsap.to(textRef.current, {
      y: -160,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
    });

    // ── Parallax del fondo (se mueve más lento) ──
    gsap.to(bgRef.current, {
      y: 80,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5,
      },
    });

    // ── Overlay se oscurece hasta negro al salir del hero ──
    // Crea una transición suave hacia la sección siguiente (fondo negro)
    gsap.to(overlayRef.current, {
      backgroundColor: 'rgba(10,10,10,0.97)',
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'center top',
        end: 'bottom top',
        scrub: 1.5,
      },
    });
  }, { scope: sectionRef }); // scope = limpieza automática al desmontar

  const scrollToNext = () => {
    const next = sectionRef.current?.nextElementSibling as HTMLElement | null;
    if (next) {
      gsap.to(window, {
        scrollTo: { y: next, offsetY: 0 },
        duration: 1.2,
        ease: 'power3.inOut',
      });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="inicio"
      className="relative min-h-screen flex flex-col overflow-hidden"
    >
      {/* ── Fondo BN con parallax ── */}
      <div ref={bgRef} className="absolute inset-0 z-0 scale-110 origin-top">
        <Image
          src="/images/hero-dancer-desktop.webp"
          alt="Epic Motion dancer"
          fill
          className="object-cover object-center grayscale"
          priority
          quality={90}
        />
        {/* Overlay con ref — GSAP anima desde el computed style hasta negro */}
        <div ref={overlayRef} className="absolute inset-0 bg-epic-black/55" />
      </div>

      {/* ── Contenido con parallax ── */}
      <div
        ref={textRef}
        className="relative z-10 flex flex-col items-center text-center px-4 mt-auto mb-[18vh]"
      >
        {/* EPIC MOTION — cada letra en un wrapper overflow-hidden */}
        <h1 className="font-montserrat leading-none tracking-tight select-none">
          {/* EPIC */}
          <span className="flex justify-center gap-[0.02em] text-[clamp(4rem,18vw,13rem)] font-extrabold text-white">
            {EPIC.map((letter, i) => (
              <span key={i} className="inline-block overflow-hidden leading-[1.05]">
                <span className="hero-letter inline-block">{letter}</span>
              </span>
            ))}
          </span>
          {/* MOTION */}
          <span className="flex justify-center gap-[0.02em] text-[clamp(4rem,18vw,13rem)] font-light text-epic-silver -mt-4 md:-mt-8">
            {MOTION.map((letter, i) => (
              <span key={i} className="inline-block overflow-hidden leading-[1.05]">
                <span className="hero-letter inline-block">{letter}</span>
              </span>
            ))}
          </span>
        </h1>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="font-montserrat font-light text-[clamp(0.6rem,2.2vw,0.9rem)] tracking-[0.15em] text-epic-silver/80 mt-3 uppercase"
        >
          High Performance Dance Studio
        </motion.p>

        {/* Divider dorado */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.55, ease: 'easeOut' }}
          className="w-20 h-px bg-epic-gold my-6 origin-center"
        />

        {/* Slogan */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.75 }}
          className="font-montserrat font-light text-[clamp(0.7rem,1.8vw,0.9rem)] tracking-[0.12em] text-epic-silver/70"
        >
          Consciente · Constante · Correcto
        </motion.p>

        {/* ── CTA — blanco/negro con fill animado en hover y scale en tap ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mt-10"
        >
          <motion.a
            href="https://wa.me/528712044277?text=Hola%20Epic%20Motion%2C%20quiero%20agendar%20una%20clase%20de%20prueba"
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-flex items-center overflow-hidden font-montserrat font-bold text-xs tracking-[0.12em] px-8 py-4 uppercase"
            onHoverStart={() => setBtnHovered(true)}
            onHoverEnd={() => setBtnHovered(false)}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {/* Base blanca */}
            <span className="absolute inset-0 bg-white" />

            {/* Fill negro que barre de izquierda a derecha en hover */}
            <motion.span
              className="absolute inset-0 bg-epic-black origin-left"
              animate={{ scaleX: btnHovered ? 1 : 0 }}
              transition={{ duration: 0.38, ease: [0.76, 0, 0.24, 1] }}
            />

            {/* Texto — cambia de negro a blanco cuando el fill llega */}
            <motion.span
              className="relative z-10 flex items-center gap-2"
              animate={{ color: btnHovered ? '#FFFFFF' : '#0A0A0A' }}
              transition={{ duration: 0.38 }}
            >
              Agenda Clase de Prueba
              {/* Flecha que desliza hacia la derecha en hover */}
              <motion.span
                animate={{ x: btnHovered ? 4 : 0, opacity: btnHovered ? 1 : 0.5 }}
                transition={{ duration: 0.3 }}
              >
                →
              </motion.span>
            </motion.span>
          </motion.a>
        </motion.div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.button
        onClick={scrollToNext}
        aria-label="Scroll hacia abajo"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 cursor-pointer bg-transparent border-none p-2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="w-px h-10 bg-gradient-to-b from-epic-gold to-transparent mx-auto"
        />
      </motion.button>
    </section>
  );
}
