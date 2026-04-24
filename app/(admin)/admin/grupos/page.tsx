import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import { getHorariosData } from '@/lib/services/horario-service';
import GruposClient from './GruposClient';

export default async function GruposPage() {
  const session = await getServerSession(authOptions);
  
  const data = await withRLS(session, async (tx) => {
    return await getHorariosData(tx);
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-0.5 w-8 bg-epic-gold rounded-full" />
          <p className="text-[10px] font-montserrat font-bold text-epic-gold uppercase tracking-[0.3em]">
            Operations Center
          </p>
        </div>
        <h1 className="text-4xl font-montserrat font-bold text-white tracking-[-0.03em]">
          Mapa de <span className="text-epic-gold">Ocupación</span>
        </h1>
        <p className="mt-2 text-sm font-inter text-white/40 tracking-tight leading-relaxed max-w-2xl">
          Visualiza la distribución de clases, gestiona la disponibilidad de los salones 
          y supervisa la carga horaria de los profesores en tiempo real.
        </p>
      </div>

      <GruposClient initialData={data} />
    </div>
  );
}
