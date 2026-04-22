import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { withRLS } from "@/lib/prisma-rls";
import Link from "next/link";
import { UserSquare, ChevronRight, Phone, Award } from "lucide-react";
import Image from "next/image";

export const metadata = {
  title: "Profesores | Epic Motion",
};

export default async function ProfesoresPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) return null;

  // Query to get teachers
  const profesores = await withRLS(session, (tx) =>
    tx.usuario.findMany({
      where: { rol: "MAESTRO" },
      include: {
        profesor: true,
        gruposComoProfesor: {
          where: { activo: true },
        },
      },
      orderBy: { nombre: "asc" }
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-montserrat font-bold text-white tracking-tight">Plantilla Docente</h1>
          <p className="text-white/50 text-sm mt-1">Expedientes y rendimiento de los profesores de Epic Motion.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {profesores.map((maestro) => {
          const profDetails = maestro.profesor;
          const numGrupos = maestro.gruposComoProfesor.length;
          const iniciales = `${maestro.nombre.charAt(0)}${maestro.apellido.charAt(0)}`.toUpperCase();

          return (
            <Link 
              key={maestro.id} 
              href={`/admin/profesores/${maestro.id}`}
              className="group block relative overflow-hidden rounded-2xl glass transition-all duration-300 hover:-translate-y-1 hover:shadow-liquid-gold border border-white/5 hover:border-epic-gold/30 bg-white/[0.02]"
            >
              <div className="p-5 flex gap-4 items-start">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-xl">
                  {maestro.avatar ? (
                    <Image src={maestro.avatar} alt={maestro.nombre} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center text-epic-gold font-montserrat font-bold text-xl">
                      {iniciales}
                    </div>
                  )}
                  {/* Online indicator */}
                  <div className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-black ${maestro.activo ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                </div>
                
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="text-white font-montserrat font-bold text-base truncate group-hover:text-epic-gold transition-colors">
                    {maestro.nombre} {maestro.apellido}
                  </h3>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <Phone size={12} className="text-white/40" />
                    <span className="text-xs text-white/50 truncate">{maestro.telefono || "Sin teléfono"}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {profDetails?.especialidades?.map((esp, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/70 border border-white/10 font-medium tracking-wide">
                        {esp}
                      </span>
                    ))}
                    {(!profDetails?.especialidades || profDetails.especialidades.length === 0) && (
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/40 border border-white/10">Sin especialidad</span>
                    )}
                  </div>
                </div>
                
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 group-hover:text-epic-gold group-hover:bg-epic-gold/10 transition-colors shrink-0">
                  <ChevronRight size={18} />
                </div>
              </div>

              <div className="px-5 py-3 border-t border-white/5 bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-white/40">
                  <Award size={12} className="text-epic-gold/70" />
                  <span>{numGrupos} grupo{numGrupos !== 1 ? 's' : ''} activo{numGrupos !== 1 ? 's' : ''}</span>
                </div>
                <div className="text-xs font-medium text-epic-gold">
                  ${profDetails?.tarifaHora?.toString() || "0.00"} <span className="text-white/40 text-[10px]">/ hr</span>
                </div>
              </div>
            </Link>
          );
        })}

        {profesores.length === 0 && (
          <div className="col-span-full py-12 text-center text-white/50 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            <UserSquare size={48} className="mx-auto mb-3 opacity-20" />
            <p>No hay profesores registrados en el sistema.</p>
          </div>
        )}
      </div>
    </div>
  );
}
