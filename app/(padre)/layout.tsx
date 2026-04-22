"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Home, Users, CreditCard, CalendarDays, Bell, LogOut } from "lucide-react";
import { motion } from "framer-motion";

const TABS = [
  { href: "/padre/home",           label: "Inicio",   icon: Home },
  { href: "/padre/hijas",          label: "Hijas",    icon: Users },
  { href: "/padre/pagos",          label: "Pagos",    icon: CreditCard },
  { href: "/padre/eventos",        label: "Eventos",  icon: CalendarDays },
  { href: "/padre/notificaciones", label: "Avisos",   icon: Bell },
];

interface PadreLayoutProps {
  children: React.ReactNode;
}

export default function PadreLayout({ children }: PadreLayoutProps) {
  const pathname   = usePathname();
  const { data: session } = useSession();
  const nombre  = session?.user?.nombre ?? "Padre";
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0A0A0A" }}>

      {/* Ambient blobs — idénticos al admin */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className="absolute rounded-full blur-[120px] opacity-[0.07] blob-gold"
          style={{ width: 600, height: 600, background: "#C9A227", top: "-15%", left: "-10%" }}
        />
        <div
          className="absolute rounded-full blur-[100px] opacity-[0.04]"
          style={{ width: 400, height: 400, background: "#00F0FF", bottom: "-10%", right: "-5%" }}
        />
      </div>

      {/* Topbar */}
      <header className="sticky top-0 z-20 glass-topbar">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto w-full">
          <Image
            src="/logo.png"
            alt="Epic Motion"
            width={96}
            height={34}
            priority
          />

          <div className="flex items-center gap-3">
            {/* Avatar dorado */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-black text-sm font-bold font-montserrat shrink-0"
              style={{ background: "linear-gradient(135deg, #C9A227, #E8C84A)" }}>
              {inicial}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-white/40 hover:text-white/80 transition-colors"
              aria-label="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="relative z-10 flex-1 pb-24 px-4 pt-6 max-w-2xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom navigation — Liquid Glass */}
      <nav className="fixed bottom-0 left-0 right-0 z-20"
        style={{
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.5)",
        }}>
        <div className="flex max-w-2xl mx-auto pb-safe">
          {TABS.map(({ href, label, icon: Icon }) => {
            const activo = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-3 relative transition-colors duration-150"
              >
                {activo && (
                  <motion.div
                    layoutId="padre-tab-indicator"
                    className="absolute inset-x-2 top-1.5 h-[2px] rounded-full"
                    style={{ background: "linear-gradient(90deg, #C9A227, #E8C84A)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  size={21}
                  strokeWidth={activo ? 2.2 : 1.8}
                  style={{ color: activo ? "#C9A227" : "rgba(255,255,255,0.35)" }}
                />
                <span
                  className="text-[10px] font-inter font-medium tracking-[0.04em]"
                  style={{ color: activo ? "#C9A227" : "rgba(255,255,255,0.35)" }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
