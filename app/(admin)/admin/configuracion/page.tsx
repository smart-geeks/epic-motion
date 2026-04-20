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
    const [gruposData, alumnasData, cursosData, disciplinasData, profesoresData] = await Promise.all([
      svc.getGrupos(tx),
      svc.getAlumnas(tx),
      svc.getCursosEspeciales(tx),
      svc.getDisciplinas(tx),
      svc.getProfesores(tx),
    ]);

    return { gruposData, alumnasData, cursosData, disciplinasData, profesoresData };
  });
}


export default async function ConfiguracionPage() {
  const session = await getServerSession(authOptions);
  const { gruposData, alumnasData, cursosData, disciplinasData, profesoresData } =
    await fetchConfiguracionData(session);

  return (
    <div>
      {/* Encabezado — renderizado en el servidor, sin JS */}
      <div className="mb-6">
        <h1 className="text-2xl font-montserrat font-bold dark:text-white text-gray-900 tracking-[0.03em]">
          Centro de Mando
        </h1>
        <p className="mt-1 text-sm font-inter dark:text-epic-silver text-gray-500">
          Configura grupos, tarifas, staff y el contenido público de la academia.
        </p>
      </div>

      <ConfiguracionShell
        grupos={gruposData}
        alumnas={alumnasData}
        cursosEspeciales={cursosData}
        disciplinas={disciplinasData}
        profesores={profesoresData}
      />
    </div>
  );
}
