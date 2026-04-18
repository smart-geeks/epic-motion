import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import KardexView from './KardexView';

export default async function KardexPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  const alumna = await withRLS(session, (tx) =>
    tx.alumna.findUnique({
      where: { id: params.id },
      include: {
        padre: true,
        clases: {
          include: { grupo: true },
          take: 1,
        },
        cargos: {
          include: { concepto: true },
          orderBy: { fechaVencimiento: 'desc' },
        },
        asistencias: {
          include: { sesion: { include: { clase: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
  );

  if (!alumna) notFound();

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

  // Porcentaje de asistencia del mes desde los registros cargados
  const asistenciasMes = alumna.asistencias.filter(
    (a) => new Date(a.createdAt) >= inicioMes
  );
  const porcentajeAsistenciaMes =
    asistenciasMes.length === 0
      ? null
      : Math.round(
          (asistenciasMes.filter((a) => a.estado !== 'AUSENTE').length /
            asistenciasMes.length) *
            100
        );

  const totalVencido = alumna.cargos
    .filter((c) => c.estado === 'VENCIDO')
    .reduce((sum, c) => sum + c.montoFinal.toNumber(), 0);

  return (
    <KardexView
      data={{
        alumna: {
          id: alumna.id,
          nombre: alumna.nombre,
          apellido: alumna.apellido,
          foto: alumna.foto,
          estatus: alumna.estatus,
          fechaNacimiento: alumna.fechaNacimiento.toISOString(),
          otraAcademia: alumna.otraAcademia,
          enfermedadLesion: alumna.enfermedadLesion,
          canalContacto: alumna.canalContacto,
          grupo: alumna.clases[0]?.grupo?.nombre ?? null,
          padre: {
            nombre: alumna.padre.nombre,
            apellido: alumna.padre.apellido,
            email: alumna.padre.email,
            telefono: alumna.padre.telefono ?? null,
            telefonoTrabajo: alumna.padre.telefonoTrabajo ?? null,
            nombreConyuge: alumna.padre.nombreConyuge ?? null,
            celularConyuge: alumna.padre.celularConyuge ?? null,
            emailConyuge: alumna.padre.emailConyuge ?? null,
            telefonoTrabajoConyuge: alumna.padre.telefonoTrabajoConyuge ?? null,
          },
        },
        totalVencido,
        porcentajeAsistenciaMes,
        cargos: alumna.cargos.map((c) => ({
          id: c.id,
          concepto: c.concepto.nombre,
          monto: c.montoFinal.toNumber(),
          fechaVencimiento: c.fechaVencimiento.toISOString(),
          estado: c.estado,
        })),
        asistencias: alumna.asistencias.map((a) => ({
          id: a.id,
          estado: a.estado,
          fecha: a.sesion.fecha.toISOString(),
          clase: a.sesion.clase.nombre,
          observacion: a.observacionComportamiento ?? null,
        })),
      }}
    />
  );
}
