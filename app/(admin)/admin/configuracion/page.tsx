import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import type { GrupoConfigData, AlumnaConfigData, CursoEspecialData, DisciplinaConfigData, ProfesorData } from '@/types/configuracion';
import * as svc from '@/lib/services/configuracion-service';
import ConfiguracionShell from '@/components/configuracion/ConfiguracionShell';

// Una sola transacción RLS con las cinco queries en paralelo interno
async function fetchConfiguracionData(session: Session | null) {
  return await withRLS(session, async (tx) => {
    const [gruposData, alumnasData, cursosData, disciplinasData, staffData, salonesData] = await Promise.all([
      svc.getGrupos(tx),
      svc.getAlumnas(tx),
      svc.getCursosEspeciales(tx),
      svc.getDisciplinas(tx),
      svc.getStaff(tx),
      svc.getSalones(tx),
    ]);

    return { gruposData, alumnasData, cursosData, disciplinasData, staffData, salonesData };
  });
}


export default async function ConfiguracionPage() {
  const session = await getServerSession(authOptions);
  const { gruposData, alumnasData, cursosData, disciplinasData, staffData, salonesData } =
    await fetchConfiguracionData(session);

  return (
    <div>
      {/* Encabezado — Diseño Liquid Glass */}
      <div className="mb-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-0.5 w-8 bg-epic-gold rounded-full" />
            <p className="text-[10px] font-montserrat font-bold text-epic-gold uppercase tracking-[0.3em]">
              Management Center
            </p>
          </div>
          <h1 className="text-4xl font-montserrat font-bold text-white tracking-[-0.03em]">
            Centro de <span className="text-epic-gold">Mando</span>
          </h1>
          <p className="mt-2 text-sm font-inter text-white/40 tracking-tight leading-relaxed max-w-2xl">
            Control total de la academia: gestiona grupos, supervisa el rendimiento de las alumnas, 
            administra tu equipo de staff y personaliza la experiencia digital de Epic Motion.
          </p>
        </div>
      </div>

      <ConfiguracionShell
        grupos={gruposData}
        alumnas={alumnasData}
        cursosEspeciales={cursosData}
        disciplinas={disciplinasData}
        staff={staffData}
        salones={salonesData}
      />
    </div>
  );
}
