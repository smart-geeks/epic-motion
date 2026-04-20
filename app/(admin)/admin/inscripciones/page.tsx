import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import { ClipboardList } from 'lucide-react';
import BotonNuevaInscripcion from '@/components/inscripciones/BotonNuevaInscripcion';
import * as svc from '@/lib/services/inscripcion-service';

// Carga lista de inscripciones recientes desde el servidor
async function obtenerInscripciones() {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const inscripciones = await withRLS(session, (tx) =>
    tx.alumnaClase.findMany({
      where: { grupoId: { not: null } },
      include: {
        alumna: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            estatus: true,
            fechaInscripcion: true,
          },
        },
        grupo: {
          select: { id: true, nombre: true },
        },
      },
      orderBy: { fechaInscripcion: 'desc' },
      take: 50,
    })
  );

  return inscripciones;
}

// Datos iniciales para el wizard de inscripción
async function obtenerDatosInscripcion() {
  const session = await getServerSession(authOptions);
  if (!session) return { grupos: [], cuotaInscripcion: 0, cicloEscolar: '' };

  const [grupos, config] = await withRLS(session, async (tx) => {
    const g = await svc.getGruposParaInscripcion(tx);
    const c = await svc.getConfiguracion(tx, ['cuota_inscripcion']);
    return [g, c];
  });

  return {
    grupos,
    cuotaInscripcion: parseFloat(config.cuota_inscripcion ?? '0'),
    cicloEscolar: svc.calcularCicloEscolar(),
  };
}

export default async function InscripcionesPage() {
  const [inscripciones, datosWizard] = await Promise.all([
    obtenerInscripciones(),
    obtenerDatosInscripcion(),
  ]);

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-montserrat font-bold dark:text-white text-gray-900 tracking-[0.03em]">
            Inscripciones
          </h1>
          <p className="mt-1 text-sm font-inter dark:text-epic-silver text-gray-500">
            {inscripciones.length} inscripción{inscripciones.length !== 1 ? 'es' : ''} registrada{inscripciones.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Suspense fallback={null}>
          <BotonNuevaInscripcion 
            gruposIniciales={datosWizard.grupos} 
            cuotaInicial={datosWizard.cuotaInscripcion} 
            cicloInicial={datosWizard.cicloEscolar} 
          />
        </Suspense>
      </div>

      {/* Tabla de inscripciones */}
      {inscripciones.length === 0 ? (
        <div className="dark:bg-epic-gray bg-white rounded-2xl border dark:border-white/5 border-gray-200 p-12 text-center shadow-sm">
          <ClipboardList
            size={36}
            className="mx-auto mb-3 text-gray-300 dark:text-white/10"
          />
          <p className="text-sm font-inter dark:text-epic-silver text-gray-400">
            No hay inscripciones registradas.
          </p>
          <p className="text-xs font-inter dark:text-white/30 text-gray-400 mt-1">
            Usa el botón &quot;Nueva Inscripción&quot; para comenzar.
          </p>
        </div>
      ) : (
        <div className="dark:bg-epic-gray bg-white rounded-2xl border dark:border-white/5 border-gray-200 shadow-sm overflow-hidden">
          {/* Vista de tabla en desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm font-inter">
              <thead>
                <tr className="border-b dark:border-white/5 border-gray-100">
                  <th className="text-left px-6 py-3.5 font-medium dark:text-epic-silver text-gray-500 text-xs uppercase tracking-wide">
                    Alumna
                  </th>
                  <th className="text-left px-6 py-3.5 font-medium dark:text-epic-silver text-gray-500 text-xs uppercase tracking-wide">
                    Grupo
                  </th>
                  <th className="text-left px-6 py-3.5 font-medium dark:text-epic-silver text-gray-500 text-xs uppercase tracking-wide">
                    Fecha inscripción
                  </th>
                  <th className="text-left px-6 py-3.5 font-medium dark:text-epic-silver text-gray-500 text-xs uppercase tracking-wide">
                    Estatus
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/5 divide-gray-50">
                {inscripciones.map((i) => (
                  <tr
                    key={i.id}
                    className="hover:dark:bg-white/3 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-3.5 dark:text-white text-gray-900 font-medium">
                      {i.alumna.nombre} {i.alumna.apellido}
                    </td>
                    <td className="px-6 py-3.5 dark:text-epic-silver text-gray-600">
                      {i.grupo?.nombre ?? '—'}
                    </td>
                    <td className="px-6 py-3.5 dark:text-epic-silver text-gray-500">
                      {new Date(i.alumna.fechaInscripcion).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={[
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          i.alumna.estatus === 'ACTIVA'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : i.alumna.estatus === 'PRUEBA'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-epic-silver',
                        ].join(' ')}
                      >
                        {i.alumna.estatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista de cards en móvil */}
          <div className="sm:hidden divide-y dark:divide-white/5 divide-gray-100">
            {inscripciones.map((i) => (
              <div key={i.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-inter font-medium dark:text-white text-gray-900 text-sm">
                      {i.alumna.nombre} {i.alumna.apellido}
                    </p>
                    <p className="font-inter text-xs dark:text-epic-silver text-gray-500 mt-0.5">
                      {i.grupo?.nombre ?? 'Sin grupo'}
                    </p>
                  </div>
                  <span
                    className={[
                      'shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      i.alumna.estatus === 'ACTIVA'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : i.alumna.estatus === 'PRUEBA'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-epic-silver',
                    ].join(' ')}
                  >
                    {i.alumna.estatus}
                  </span>
                </div>
                <p className="font-inter text-xs dark:text-white/30 text-gray-400 mt-1.5">
                  {new Date(i.alumna.fechaInscripcion).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
