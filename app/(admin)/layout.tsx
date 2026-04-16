"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Banknote,
  Newspaper,
  Trophy,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/admin/dashboard",      label: "Dashboard",      icon: LayoutDashboard },
  { href: "/admin/usuarios",       label: "Usuarios",       icon: Users },
  { href: "/admin/alumnas",        label: "Alumnas",        icon: GraduationCap },
  { href: "/admin/grupos",         label: "Grupos",         icon: CalendarDays },
  { href: "/admin/inscripciones",  label: "Inscripciones",  icon: ClipboardList },
  { href: "/admin/cobranza",       label: "Cobranza",       icon: CreditCard },
  { href: "/admin/nomina",         label: "Nómina",         icon: Banknote },
  { href: "/admin/noticias",       label: "Noticias",       icon: Newspaper },
  { href: "/admin/eventos",        label: "Eventos",        icon: Trophy },
  { href: "/admin/configuracion",  label: "Configuración",  icon: Settings },
  { href: "/admin/reportes",       label: "Reportes",       icon: BarChart3 },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nombre = session?.user?.nombre ?? "Admin";
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex dark:bg-epic-black bg-gray-50">

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed top-0 left-0 z-30 h-full w-64 flex flex-col",
          "dark:bg-epic-gray bg-white border-r dark:border-white/5 border-gray-200",
          "transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b dark:border-white/5 border-gray-100">
          <Image
            src="/logo.png"
            alt="Epic Motion"
            width={120}
            height={42}
            className="dark:block hidden"
            priority
          />
          <Image
            src="/logo-light.png"
            alt="Epic Motion"
            width={120}
            height={42}
            className="dark:hidden block"
            priority
          />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden dark:text-epic-silver text-gray-500 hover:dark:text-white hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="flex flex-col gap-0.5">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const activo = pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={[
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-inter font-medium transition-colors duration-150",
                      activo
                        ? "bg-epic-gold text-black"
                        : "dark:text-epic-silver text-gray-600 hover:dark:bg-epic-gray-light/40 hover:bg-gray-100 hover:dark:text-white hover:text-gray-900",
                    ].join(" ")}
                  >
                    <Icon size={17} className="shrink-0" />
                    <span className="tracking-[0.02em]">{label}</span>
                    {activo && <ChevronRight size={14} className="ml-auto" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer del sidebar: usuario + logout */}
        <div className="px-3 py-4 border-t dark:border-white/5 border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg dark:bg-epic-black/40 bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-epic-gold flex items-center justify-center text-black text-sm font-bold font-montserrat shrink-0">
              {inicial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-inter font-medium dark:text-white text-gray-900 truncate">
                {nombre}
              </p>
              <p className="text-xs dark:text-epic-silver text-gray-500 tracking-[0.03em]">
                Administrador
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-inter dark:text-epic-silver text-gray-500 hover:dark:text-white hover:text-gray-900 hover:dark:bg-epic-gray-light/40 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={17} className="shrink-0" />
            <span className="tracking-[0.02em]">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar móvil */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 dark:bg-epic-gray bg-white border-b dark:border-white/5 border-gray-200 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="dark:text-epic-silver text-gray-600 hover:dark:text-white hover:text-gray-900 transition-colors"
          >
            <Menu size={22} />
          </button>
          <Image
            src="/logo.png"
            alt="Epic Motion"
            width={90}
            height={32}
            className="dark:block hidden"
          />
          <Image
            src="/logo-light.png"
            alt="Epic Motion"
            width={90}
            height={32}
            className="dark:hidden block"
          />
        </header>

        {/* Contenido de la página */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
