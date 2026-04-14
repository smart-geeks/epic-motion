'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, User } from 'lucide-react';
import LoginModal from './LoginModal';

const links = [
  { label: 'INICIO', href: '#inicio' },
  { label: 'ESTILOS', href: '#estilos' },
  { label: 'NOSOTROS', href: '#nosotros' },
  { label: 'GALERÍA', href: '#galeria' },
];

export default function Navbar() {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setVisible(currentY < lastScrollY || currentY < 60);
      setLastScrollY(currentY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('dark');
      html.classList.add('light');
    } else {
      html.classList.remove('light');
      html.classList.add('dark');
    }
    setIsDark(!isDark);
  };

  const handleLinkClick = () => setMenuOpen(false);

  const openLogin = () => {
    setMenuOpen(false);
    setLoginOpen(true);
  };

  return (
    <>
      <motion.header
        animate={{ y: visible ? 0 : -100 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-epic-black/90 backdrop-blur-md border-b border-gray-100 dark:border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="#inicio" className="flex items-center">
            <Image
              src={isDark ? '/logo.png' : '/logo-light.png'}
              alt="Epic Motion"
              width={120}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
          </a>

          {/* Links desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-montserrat text-xs font-bold tracking-[0.08em] text-gray-600 dark:text-epic-silver hover:text-epic-black dark:hover:text-epic-gold transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={toggleTheme}
              aria-label="Cambiar tema"
              className="p-2 rounded-full text-gray-500 dark:text-epic-silver hover:text-epic-black dark:hover:text-epic-gold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Login: abre modal */}
            <button
              onClick={openLogin}
              className="inline-flex items-center gap-2 font-montserrat text-xs font-bold tracking-wider px-3 md:px-4 py-2 border border-gray-300 dark:border-epic-gold text-gray-700 dark:text-epic-gold hover:bg-gray-100 dark:hover:bg-epic-gold dark:hover:text-epic-black transition-colors duration-200"
            >
              <User size={14} />
              <span className="hidden md:inline">Iniciar Sesión</span>
            </button>

            {/* Hamburguesa mobile */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
              className="md:hidden p-2 text-gray-600 dark:text-epic-silver hover:text-epic-black dark:hover:text-epic-gold transition-colors"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Menú mobile */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-white dark:bg-epic-black border-b border-gray-100 dark:border-white/10 md:hidden"
          >
            <nav className="flex flex-col px-4 py-4 gap-1">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={handleLinkClick}
                  className="font-montserrat text-sm font-bold tracking-[0.08em] text-gray-600 dark:text-epic-silver hover:text-epic-black dark:hover:text-epic-gold py-3 border-b border-gray-100 dark:border-white/5 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <button
                type="button"
                onClick={openLogin}
                className="mt-3 flex items-center justify-center gap-2 font-montserrat text-sm font-bold tracking-[0.08em] px-5 py-3 border border-gray-300 dark:border-epic-gold text-gray-700 dark:text-epic-gold hover:bg-gray-100 dark:hover:bg-epic-gold dark:hover:text-epic-black transition-colors"
              >
                <User size={15} />
                Iniciar Sesión
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de login */}
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        isDark={isDark}
      />
    </>
  );
}
