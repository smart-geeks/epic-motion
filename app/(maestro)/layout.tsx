"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { CalendarDays, ClipboardCheck, FileText, Star, LogOut } from "lucide-react";

const TABS = [
  { href: "/maestro/agenda",     label: "Agenda",     icon: CalendarDays },
  { href: "/maestro/asistencia", label: "Asistencia", icon: ClipboardCheck },
  { href: "/maestro/notas",      label: "Notas",      icon: FileText },
  { href: "/maestro/privadas",   label: "Privadas",   icon: Star },
];

interface MaestroLayoutProps {
  children: React.ReactNode;
}

export default function MaestroLayout({ children }: MaestroLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const nombre = session?.user?.nombre ?? "Maestro";
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col dark:bg-epic-black bg-gray-50">

      {/* Topbar */}
      <header className="sticky top-0 z-10 dark:bg-epic-gray bg-white border-b dark:border-white/5 border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto w-full">
          <Image
            src="/logo.png"
            alt="Epic Motion"
            width={100}
            height={36}
            className="dark:block hidden"
            priority
          />
          <Image
            src="/logo-light.png"
            alt="Epic Motion"
            width={100}
            height={36}
            className="dark:hidden block"
            priority
          />

          {/* Avatar + logout */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-epic-gold flex items-center justify-center text-black text-sm font-bold font-montserrat shrink-0">
              {inicial}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="dark:text-epic-silver text-gray-500 hover:dark:text-white hover:text-gray-900 transition-colors"
              aria-label="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 pb-20 px-4 py-6 max-w-2xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 dark:bg-epic-gray bg-white border-t dark:border-white/5 border-gray-200 safe-area-bottom">
        <div className="flex max-w-2xl mx-auto">
          {TABS.map(({ href, label, icon: Icon }) => {
            const activo = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors duration-150",
                  activo
                    ? "text-epic-gold"
                    : "dark:text-epic-silver text-gray-400 hover:dark:text-white hover:text-gray-600",
                ].join(" ")}
              >
                <Icon size={22} strokeWidth={activo ? 2.2 : 1.8} />
                <span className="text-[10px] font-inter font-medium tracking-[0.04em]">
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
