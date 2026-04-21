import * as svc from "@/lib/services/teacher-service";
import { AttendanceList } from "@/components/teacher/AttendanceList";
import { ChevronLeft, Calendar, Users } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function TeacherAttendancePage({ params }: { params: { id: string } }) {
  const grupo = await prisma.grupo.findUnique({
    where: { id: params.id },
    include: {
      tarifa: true
    }
  });

  const alumnas = await svc.obtenerAlumnasPorGrupo(params.id);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 pb-2 space-y-4">
        <Link 
          href="/profesor/dashboard" 
          className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-inter"
        >
          <ChevronLeft size={16} />
          Volver al Dashboard
        </Link>
        
        <div className="space-y-1">
          <h1 className="text-2xl font-montserrat font-bold text-white leading-tight">
            Asistencia <span className="text-epic-gold">Digital</span>
          </h1>
          <p className="text-white/40 text-sm font-inter font-medium flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-epic-gold/40" /> 20 Abr 2026</span>
            <span className="flex items-center gap-1.5"><Users size={14} className="text-epic-gold/40" /> {alumnas.length} Alumnas</span>
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-white/5 border border-white/10">
          <h2 className="text-white font-montserrat font-bold text-base">{grupo?.nombre}</h2>
          <p className="text-white/30 text-[11px] font-montserrat font-bold uppercase tracking-wider mt-0.5">
            Salón de Ballet Principal • 16:00 - 17:30
          </p>
        </div>
      </div>

      {/* Alumnas List */}
      <div className="flex-1 px-6 pt-4">
        <h3 className="text-[10px] font-montserrat font-bold text-white/30 uppercase tracking-[0.2em] mb-4 ml-1">
          Desliza para marcar asistencia
        </h3>
        
        <AttendanceList alumnas={alumnas} />
      </div>
    </div>
  );
}
