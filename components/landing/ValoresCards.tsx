'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, CustomEase, useGSAP);

const valores = [
  {
    titulo: 'Consciente',
    descripcion:
      'Cada movimiento tiene un propósito. Entendemos el cuerpo, la técnica y la música para bailar con intención y presencia plena.',
  },
  {
    titulo: 'Constante',
    descripcion:
      'La excelencia no es un accidente. La práctica sostenida, la dedicación diaria y la perseverancia construyen grandes bailarines.',
  },
  {
    titulo: 'Correcto',
    descripcion:
      'La técnica correcta protege el cuerpo y perfecciona el arte. Formamos bailarines con bases sólidas que duran toda la vida.',
  },
];

export default function ValoresCards() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    // ── CustomEase: arranque rápido, aterrizaje suave (paso de baile) ──
    CustomEase.create(
      'wordReveal',
      'M0,0 C0.14,0 0.242,0.438 0.272,0.561 0.313,0.728 0.354,0.963 1,1'
    );

    const ST_SECTION = {
      trigger: sectionRef.current,
      start: 'top 75%',
      toggleActions: 'play none none reverse' as const,
    };

    // ── 1. Título: palabra por palabra con wave stagger ──
    gsap.from('.valores-word', {
      y: '105%',
      stagger: { each: 0.07, ease: 'power1.in' },
      duration: 0.65,
      ease: 'wordReveal',
      scrollTrigger: ST_SECTION,
    });

    // ── 2. Línea dorada: se dibuja tras las palabras ──
    gsap.from('.valores-line', {
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 1.1,
      ease: 'expo.out',
      delay: 0.3,
      scrollTrigger: ST_SECTION,
    });

    // ── 3. Cards: entrada direccional con blur — izq / abajo / der ──
    // Cada card entra como un bailarín desde su propia ala del escenario
    const cards = gsap.utils.toArray<HTMLElement>('.valor-card');
    const directions: [number, number][] = [
      [-60, -4], // Card 1: desde la izquierda, leve inclinación CCW
      [0,    0], // Card 2: desde abajo, centrado
      [60,   4], // Card 3: desde la derecha, leve inclinación CW
    ];

    cards.forEach((card, i) => {
      const [xFrom, rotFrom] = directions[i];
      gsap.from(card, {
        x: xFrom,
        y: 55,
        rotation: rotFrom,
        opacity: 0,
        scale: 0.9,
        filter: 'blur(6px)',
        transformOrigin: 'center bottom',
        duration: 0.9,
        ease: 'power3.out',
        delay: 0.18 * i,
        scrollTrigger: {
          trigger: '.valores-grid',
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        onStart() {
          card.style.willChange = 'transform, opacity, filter';
        },
        onComplete() {
          card.style.willChange = 'auto';
          card.style.filter = '';
        },
      });
    });

    // ── 4. Índices: bajan desde arriba tras que las cards aterrizan ──
    gsap.from('.valor-index', {
      y: -28,
      opacity: 0,
      stagger: 0.18,
      duration: 0.55,
      delay: 0.55,
      ease: 'back.out(2)',
      scrollTrigger: {
        trigger: '.valores-grid',
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });

  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="valores"
      className="py-24 px-4 bg-gray-50 dark:bg-epic-black"
    >
      <div className="max-w-6xl mx-auto">

        {/* ── Título con máscara por palabra ── */}
        <div className="mb-12">
          <h2 className="font-montserrat leading-tight">
            {/* Línea 1: "La disciplina" */}
            <div className="flex flex-wrap gap-x-[0.4em]">
              {['La', 'disciplina'].map((word) => (
                <div key={word} className="overflow-hidden">
                  <span className="valores-word block font-bold text-epic-black dark:text-white text-[clamp(1.5rem,4vw,2.5rem)] tracking-[0.05em] uppercase">
                    {word}
                  </span>
                </div>
              ))}
            </div>
            {/* Línea 2: "que nos define" */}
            <div className="flex flex-wrap gap-x-[0.4em] mt-1">
              {['que', 'nos', 'define'].map((word) => (
                <div key={word} className="overflow-hidden">
                  <span className="valores-word block font-light text-gray-500 dark:text-epic-silver text-[clamp(1.5rem,4vw,2.5rem)] tracking-[0.05em] uppercase">
                    {word}
                  </span>
                </div>
              ))}
            </div>
          </h2>
          <div className="valores-line w-16 h-px bg-epic-gold mt-6" />
        </div>

        {/* ── Grid de cards ── */}
        <div className="valores-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          {valores.map((v, i) => (
            <div
              key={v.titulo}
              className="valor-card group p-8 flex flex-col gap-4 bg-white dark:bg-epic-gray border border-gray-200 dark:border-white/10 hover:border-epic-gold dark:hover:border-epic-gold transition-colors duration-300 cursor-default"
            >
              {/* Índice */}
              <span className="valor-index font-montserrat font-bold text-xs tracking-[0.15em] text-epic-gold/60 group-hover:text-epic-gold transition-colors duration-300">
                0{i + 1}
              </span>

              {/* Título */}
              <h3 className="font-montserrat font-bold text-xl tracking-[0.04em] uppercase text-epic-black dark:text-white">
                {v.titulo}
              </h3>

              {/* Divider — se ensancha en hover */}
              <div className="w-8 h-px bg-epic-gold group-hover:w-16 transition-all duration-500" />

              {/* Descripción */}
              <p className="font-inter text-gray-600 dark:text-epic-silver text-sm leading-relaxed">
                {v.descripcion}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
