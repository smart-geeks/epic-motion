import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import type { GrupoConfigData } from '@/app/api/configuracion/grupos/route';
import type { AlumnaConfigData } from '@/app/api/configuracion/alumnas/route';
import type { CursoEspecialData } from '@/app/api/configuracion/cursos-especiales/route';
import type { DisciplinaConfigData } from '@/app/api/configuracion/disciplinas/route';
import type { ProfesorData } from '@/lib/actions/config-grupos';
import ConfiguracionShell from '@/components/configuracion/ConfiguracionShell';

// Ejecuta las cinco queries en paralelo para minimizar latencia
async function fetchConfiguracionData(session: Session | null) {
  const [grupos, alumnas, cursosEspeciales, disciplinas, profesores] = await Promise.all([

    // Grupos con disciplinas, tarifa, profesor y conteo de inscritos
    withRLS(session, (tx) =>
      tx.grupo.findMany({
        include: {
          disciplinasGrupo: { include: { disciplina: true } },
          tarifa: { select: { precioMensualidad: true } },
          grupoSiguiente: { select: { nombre: true } },
          profesor: { select: { nombre: true, apellido: true } },
          _count: { select: { disciplinas: true } },
        },
        orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
      }),
    ),

    // Alumnas con grupo actual y estado de cargos
    withRLS(session, (tx) =>
      tx.alumna.findMany({
        select: {
          id: true, nombre: true, apellido: true, foto: true,
          fechaNacimiento: true, estatus: true, invitadaCompetencia: true,
          clases: {
            where: { grupoId: { not: null } },
            select: { grupo: { select: { id: true, nombre: true } } },
            take: 1,
          },
          cargos: {
            where: { estado: { in: ['PENDIENTE', 'VENCIDO'] } },
            select: { estado: true, montoFinal: true },
          },
        },
        orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
      }),
    ),

    // Cursos especiales (vacaciones / verano)
    withRLS(session, (tx) =>
      tx.cursoEspecial.findMany({
        orderBy: [{ fechaInicio: 'asc' }, { nombre: 'asc' }],
        include: {
          profesor: { select: { nombre: true, apellido: true } },
          _count: { select: { inscritas: true } },
        },
      }),
    ),

    // Catálogo de disciplinas activas
    withRLS(session, (tx) =>
      tx.disciplina.findMany({
        where: { activo: true },
        select: { id: true, nombre: true, color: true },
        orderBy: { nombre: 'asc' },
      }),
    ),

    // Profesores activos para selects
    withRLS(session, (tx) =>
      tx.usuario.findMany({
        where: { rol: 'MAESTRO', activo: true },
        select: { id: true, nombre: true, apellido: true },
        orderBy: [{ nombre: 'asc' }],
      }),
    ),
  ]);

  // Transformar al mismo shape que usan los componentes
  const gruposData: GrupoConfigData[] = grupos.map((g) => ({
    id: g.id,
    nombre: g.nombre,
    categoria: g.categoria,
    esCompetitivo: g.esCompetitivo,
    tier: g.tier,
    edadMin: g.edadMin,
    edadMax: g.edadMax,
    cupo: g.cupo,
    inscritos: g._count.disciplinas,
    activo: g.activo,
    descripcion: g.descripcion,
    idGrupoSiguiente: g.idGrupoSiguiente,
    grupoSiguienteNombre: g.grupoSiguiente?.nombre ?? null,
    profesorId: g.profesorId,
    profesorNombre: g.profesor ? `${g.profesor.nombre} ${g.profesor.apellido}` : null,
    disciplinas: g.disciplinasGrupo.map((gd) => ({
      id: gd.disciplina.id,
      nombre: gd.disciplina.nombre,
      color: gd.disciplina.color,
      horaTexto: gd.horaTexto,
    })),
    tarifa: g.tarifa ? { precioMensualidad: g.tarifa.precioMensualidad.toNumber() } : null,
  }));

  const alumnasData: AlumnaConfigData[] = alumnas.map((a) => {
    const pendientes = a.cargos.filter((c) => c.estado === 'PENDIENTE');
    const vencidos = a.cargos.filter((c) => c.estado === 'VENCIDO');
    return {
      id: a.id,
      nombre: a.nombre,
      apellido: a.apellido,
      foto: a.foto,
      fechaNacimiento: a.fechaNacimiento.toISOString(),
      estatus: a.estatus,
      invitadaCompetencia: a.invitadaCompetencia,
      grupoActual: a.clases[0]?.grupo ?? null,
      cargosPendientes: pendientes.length,
      cargosVencidos: vencidos.length,
      montoDeuda: a.cargos.reduce((sum, c) => sum + c.montoFinal.toNumber(), 0),
    };
  });

  const cursosData: CursoEspecialData[] = cursosEspeciales.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    tipo: c.tipo,
    descripcion: c.descripcion,
    fechaInicio: c.fechaInicio.toISOString(),
    fechaFin: c.fechaFin.toISOString(),
    cupo: c.cupo,
    inscritas: c._count.inscritas,
    precio: c.precio.toNumber(),
    activo: c.activo,
    diasSemana: c.diasSemana,
    horaInicio: c.horaInicio,
    duracionMinutos: c.duracionMinutos,
    profesorId: c.profesorId,
    profesorNombre: c.profesor ? `${c.profesor.nombre} ${c.profesor.apellido}` : null,
  }));

  const disciplinasData: DisciplinaConfigData[] = disciplinas;

  const profesoresData: ProfesorData[] = profesores;

  return { gruposData, alumnasData, cursosData, disciplinasData, profesoresData };
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
