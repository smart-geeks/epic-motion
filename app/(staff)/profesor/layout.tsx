"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  LogOut, 
  Bell,
  MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";

export default function ProfesorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const navLinks = [
    { href: "/profesor/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/profesor/horarios", label: "Horarios", icon: CalendarDays },
    { href: "/profesor/grupos", label: "Mis Grupos", icon: Users },
    { href: "/profesor/mensajes", label: "Chat", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-epic-black flex flex-col">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-epic-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Mobile Header */}
      <header className="sticky top-0 z-50 glass-topbar px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-epic-gold flex items-center justify-center text-black font-bold font-montserrat shadow-liquid">
            {session?.user?.nombre?.charAt(0) || "P"}
          </div>
          <div>
            <h1 className="text-white font-montserrat font-bold text-sm leading-none">
              Portal Docente
            </h1>
            <p className="text-epic-gold text-[10px] font-montserrat font-bold tracking-widest uppercase mt-1">
              {session?.user?.nombre ?? "Profesor"}
            </p>
          </div>
        </div>
        
        <button className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-epic-black" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 pb-32 relative z-10">
        {children}
      </main>

      {/* Floating Liquid Tab Bar */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md h-16 glass rounded-full border-white/10 flex items-center justify-around px-4 shadow-2xl">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className="relative group">
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -inset-2 bg-white/5 rounded-2xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className={`relative flex flex-col items-center gap-1 transition-colors duration-300 ${active ? 'text-epic-gold' : 'text-white/40'}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-montserrat font-bold tracking-tight uppercase">
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
        
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex flex-col items-center gap-1 text-white/20 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
          <span className="text-[10px] font-montserrat font-bold tracking-tight uppercase">Salir</span>
        </button>
      </nav>
    </div>
  );
}
