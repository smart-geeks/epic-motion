"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import type { Transition, Variants } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  LayoutDashboard, Users, GraduationCap, CalendarDays, ClipboardList,
  CreditCard, Banknote, Newspaper, Trophy, Settings, BarChart3, LogOut,
  Menu, X, ChevronRight, ShoppingCart, UserSquare,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/admin/dashboard",      label: "Dashboard",       icon: LayoutDashboard },
  { href: "/admin/usuarios",       label: "Usuarios",        icon: Users },
  { href: "/admin/alumnas",        label: "Alumnas",         icon: GraduationCap },
  { href: "/admin/grupos",         label: "Grupos",          icon: CalendarDays },
  { href: "/admin/inscripciones",  label: "Inscripciones",   icon: ClipboardList },
  { href: "/admin/cobranza",       label: "Cobranza",        icon: CreditCard },
  { href: "/admin/punto-de-venta", label: "Punto de Venta",  icon: ShoppingCart },
  { href: "/admin/profesores",     label: "Profesores",      icon: UserSquare },
  { href: "/admin/nomina",         label: "Nómina",          icon: Banknote },
  { href: "/admin/noticias",       label: "Noticias",        icon: Newspaper },
  { href: "/admin/eventos",        label: "Eventos",         icon: Trophy },
  { href: "/admin/configuracion",  label: "Configuración",   icon: Settings },
  { href: "/admin/reportes",       label: "Reportes",        icon: BarChart3 },
];

/* ── Springs tipados con Transition de Framer Motion ───────────────────── */

const LIQUID_SPRING: Transition   = { type: "spring", mass: 0.5, damping: 14, stiffness: 100 };
const FAST_SPRING: Transition     = { type: "spring", mass: 0.5, damping: 20, stiffness: 140 };
const NAV_ITEM_SPRING: Transition = { type: "spring", mass: 0.3, damping: 18, stiffness: 130 };
const PAGE_SPRING: Transition     = { type: "spring", mass: 0.4, damping: 22, stiffness: 120 };

/* ── Variants tipadas ───────────────────────────────────────────────────── */

const sidebarVariants: Variants = {
  closed: { x: "-100%", transition: FAST_SPRING },
  open:   { x: 0,       transition: LIQUID_SPRING },
};

const navListVariants: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.035, delayChildren: 0.08 } },
};

const navItemVariants: Variants = {
  hidden:  { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: NAV_ITEM_SPRING },
};

const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0,  transition: PAGE_SPRING },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

/* ── Sub-componente: contenido interno del sidebar ──────────────────────── */

interface SidebarInnerProps {
  pathname: string;
  nombre: string;
  inicial: string;
  onClose?: () => void;
}

function SidebarInner({ pathname, nombre, inicial, onClose }: SidebarInnerProps) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.06]">
        <Image src="/logo.png" alt="Epic Motion" width={120} height={42} className="dark:block hidden" priority />
        <Image src="/logo-light.png" alt="Epic Motion" width={120} height={42} className="dark:hidden block" priority />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <motion.ul
          className="flex flex-col gap-0.5"
          variants={navListVariants}
          initial="hidden"
          animate="visible"
        >
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const activo = pathname === href || pathname.startsWith(href + "/");
            return (
              <motion.li key={href} variants={navItemVariants}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={[
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-inter font-medium",
                    "transition-all duration-200 border border-transparent",
                    activo
                      ? "glass-nav-active text-white"
                      : "text-white/50 hover:text-white/90 glass-nav-hover",
                  ].join(" ")}
                >
                  <Icon
                    size={16}
                    className={[
                      "shrink-0 transition-colors duration-200",
                      activo ? "text-epic-gold" : "text-white/40 group-hover:text-white/70",
                    ].join(" ")}
                  />
                  <span className="tracking-[-0.01em]">{label}</span>
                  {activo && (
                    <ChevronRight size={12} className="ml-auto text-epic-gold/70" />
                  )}
                </Link>
              </motion.li>
            );
          })}
        </motion.ul>
      </nav>

      {/* Footer: usuario + logout */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div className="w-8 h-8 rounded-full bg-epic-gold flex items-center justify-center text-black text-sm font-bold font-montserrat shrink-0 shadow-liquid">
            {inicial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-inter font-medium text-white truncate tracking-[-0.01em]">
              {nombre}
            </p>
            <p className="text-[11px] text-white/35 tracking-[0.04em] uppercase font-montserrat">
              Administrador
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-1.5 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-inter text-white/40 hover:text-white/80 hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all duration-200"
        >
          <LogOut size={15} className="shrink-0" />
          <span className="tracking-[-0.01em]">Cerrar sesión</span>
        </button>
      </div>
    </>
  );
}

/* ── Layout principal ───────────────────────────────────────────────────── */

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const spotlightRef = useRef<HTMLDivElement>(null);

  const nombre  = session?.user?.nombre ?? "Admin";
  const inicial = nombre.charAt(0).toUpperCase();

  /* ── GSAP: spotlight sigue el cursor ──────────────────────────────────── */
  useGSAP(() => {
    const spotlight = spotlightRef.current;
    if (!spotlight) return;

    let hasMoved = false;
    const onMove = (e: MouseEvent) => {
      if (!hasMoved) {
        gsap.to(spotlight, { opacity: 1, duration: 0.6, ease: "power2.out" });
        hasMoved = true;
      }
      gsap.to(spotlight, {
        x: e.clientX - 300,
        y: e.clientY - 300,
        duration: 1.4,
        ease: "power3.out",
      });
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="min-h-screen flex dark:bg-epic-black bg-gray-50 relative overflow-hidden">

      {/* ── Capa 0: fondo ambiente (blobs estáticos) ──────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        {/* Blob dorado — esquina superior izquierda */}
        <div className="blob-gold absolute rounded-full opacity-[0.055] blur-[140px] dark:block hidden" />
        {/* Blob cyan — esquina inferior derecha */}
        <div className="blob-cyan absolute rounded-full opacity-[0.035] blur-[120px] dark:block hidden" />
        {/* Blob rosa — centro */}
        <div className="blob-pink absolute rounded-full opacity-[0.025] blur-[100px] dark:block hidden" />
      </div>

      {/* ── Capa 1: spotlight GSAP (sigue cursor) ─────────────────────────── */}
      <div
        ref={spotlightRef}
        className="spotlight-container fixed w-[600px] h-[600px] rounded-full pointer-events-none z-[1] opacity-0 dark:block hidden"
        aria-hidden
      >
        <div className="spotlight-glow w-full h-full rounded-full blur-[90px]" />
      </div>

      {/* ── Overlay móvil ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar MÓVIL — Framer Motion spring ──────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            key="mobile-sidebar"
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="sidebar-mobile fixed top-0 left-0 z-30 h-full w-64 flex flex-col lg:hidden glass"
          >
            <SidebarInner
              pathname={pathname}
              nombre={nombre}
              inicial={inicial}
              onClose={() => setSidebarOpen(false)}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Sidebar DESKTOP — siempre visible, sin animación ──────────────── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 z-10 glass">
        <SidebarInner pathname={pathname} nombre={nombre} inicial={inicial} />
      </aside>

      {/* ── Área de contenido principal ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-[2]">

        {/* Topbar móvil */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-10 glass-topbar">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-white/50 hover:text-white transition-colors"
            aria-label="Abrir menú lateral"
          >
            <Menu size={20} />
          </button>
          <Image src="/logo.png" alt="Epic Motion" width={90} height={32} className="dark:block hidden" />
          <Image src="/logo-light.png" alt="Epic Motion" width={90} height={32} className="dark:hidden block" />
        </header>

        {/* Contenido de la página — transición Framer Motion */}
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 p-6 lg:p-8"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
