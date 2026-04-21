import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import * as svc from "@/lib/services/teacher-service";
import { redirect } from "next/navigation";
import { Calendar, Users, GraduationCap, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default async function TeacherDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.rol !== "MAESTRO") {
    // Para propósitos de este ejercicio, si no hay sesión simulamos una del profesor administrador
    // En producción esto redirigiría a login
  }

  const profesorId = session?.user?.id;
  const dashboardData = profesorId ? await svc.obtenerDashboardProfesor(profesorId) : null;

  // Mock de datos para el timeline si no hay clases registradas hoy
  const clasesHoy = [
    { id: "1", nombre: "Ballet Inicial A", horario: "16:00 - 17:30", alumnas: 12, salon: "Salón Principal" },
    { id: "2", nombre: "Jazz Teen B", horario: "18:00 - 19:30", alumnas: 8, salon: "Salón B" },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Bienvenida */}
      <section className="space-y-1">
        <h2 className="text-2xl font-montserrat font-bold text-white leading-tight">
          ¡Hola, <span className="text-epic-gold">{session?.user?.nombre ?? "Profe"}</span>!
        </h2>
        <p className="text-white/40 font-inter text-sm flex items-center gap-2">
          <Calendar size={14} className="text-epic-gold/50" />
          Martes, 20 de Abril
        </p>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 gap-4">
        <div className="glass p-4 rounded-3xl border-white/5 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-epic-gold/10 flex items-center justify-center text-epic-gold">
            <Users size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-montserrat font-bold text-white/30 uppercase tracking-widest">Alumnas Hoy</p>
            <p className="text-2xl font-montserrat font-bold text-white">20</p>
          </div>
        </div>
        <div className="glass p-4 rounded-3xl border-white/5 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Clock size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-montserrat font-bold text-white/30 uppercase tracking-widest">Horas Clase</p>
            <p className="text-2xl font-montserrat font-bold text-white">3h</p>
          </div>
        </div>
      </section>

      {/* Clases del Día */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-montserrat font-bold text-white uppercase tracking-widest">
            Clases de Hoy
          </h3>
          <span className="text-xs text-epic-gold font-inter">Ver todo</span>
        </div>

        <div className="space-y-4">
          {dashboardData?.gruposComoProfesor?.length ? (
            dashboardData.gruposComoProfesor.map((grupo) => (
              <Link 
                key={grupo.id} 
                href={`/profesor/grupos/${grupo.id}`}
                className="block group"
              >
                <div className="glass p-5 rounded-[2rem] border-white/5 flex items-center justify-between hover:border-white/20 transition-all active:scale-[0.98]">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[1.25rem] bg-white/5 flex flex-col items-center justify-center border border-white/10 group-hover:border-epic-gold/30 transition-all">
                      <span className="text-epic-gold font-montserrat font-bold text-sm">16:00</span>
                      <span className="text-[9px] text-white/30 font-montserrat font-bold uppercase">PM</span>
                    </div>
                    <div>
                      <h4 className="text-white font-montserrat font-bold group-hover:text-epic-gold transition-colors">
                        {grupo.nombre}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[11px] text-white/40">
                          <Users size={12} />
                          {grupo._count?.disciplinas ?? 0} alumnas
                        </span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[11px] text-white/40">Salón A</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-white/20 group-hover:text-epic-gold transition-all" />
                </div>
              </Link>
            ))
          ) : (
            // Fallback con mock si no hay asignaciones reales
            clasesHoy.map((clase) => (
              <Link 
                key={clase.id} 
                href={`/profesor/asistencia/${clase.id}`}
                className="block group"
              >
                <div className="glass p-5 rounded-[2rem] border-white/5 flex items-center justify-between hover:border-white/20 transition-all active:scale-[0.98]">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[1.25rem] bg-white/5 flex flex-col items-center justify-center border border-white/10 group-hover:border-epic-gold/30 transition-all">
                      <span className="text-epic-gold font-montserrat font-bold text-sm">16:00</span>
                      <span className="text-[9px] text-white/30 font-montserrat font-bold uppercase">PM</span>
                    </div>
                    <div>
                      <h4 className="text-white font-montserrat font-bold group-hover:text-epic-gold transition-colors">
                        {clase.nombre}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[11px] text-white/40">
                          <Users size={12} />
                          {clase.alumnas} alumnas
                        </span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[11px] text-white/40">{clase.salon}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-white/20 group-hover:text-epic-gold transition-all" />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Recordatorios / Notas */}
      <section className="glass p-6 rounded-[2.5rem] border-white/5 bg-gradient-to-br from-epic-gold/5 to-transparent">
        <h3 className="text-epic-gold font-montserrat font-bold text-xs uppercase tracking-widest mb-3">Recordatorio Administrativo</h3>
        <p className="text-white/80 text-sm font-inter leading-relaxed">
          Recuerda marcar el uso de uniforme de cada alumna para su progreso de Avatar. ¡Las competencias internas se acercan!
        </p>
      </section>
    </div>
  );
}
