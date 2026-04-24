import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import POSClient from './POSClient';

export default async function PuntoDeVentaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const [alumnas, conceptos] = await Promise.all([
    withRLS(session, (tx) =>
      tx.alumna.findMany({
        select: {
          id: true,
          nombre: true,
          apellido: true,
          foto: true,
          padre: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          cargos: {
            where: { estado: { in: ['PENDIENTE', 'VENCIDO'] } },
            select: {
              id: true,
              montoFinal: true,
              concepto: { select: { nombre: true } },
              fechaVencimiento: true,
            },
          },
        },
        orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
      })
    ),
    withRLS(session, (tx) =>
      tx.concepto.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
      })
    ),
  ]);

  // Serializar decimales a números para el cliente
  const alumnasSerialized = alumnas.map((a) => ({
    ...a,
    cargos: a.cargos.map((c) => ({
      ...c,
      montoFinal: Number(c.montoFinal),
    })),
  }));

  const conceptosSerialized = conceptos.map((c) => ({
    ...c,
    precioSugerido: Number(c.precioSugerido),
  }));

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-montserrat font-bold dark:text-white text-gray-900 tracking-[0.03em]">
          Punto de <span className="text-epic-gold">Venta</span>
        </h1>
        <p className="mt-1 text-sm font-inter dark:text-epic-silver text-gray-500">
          Gestión de cobros, mensualidades y venta de productos.
        </p>
      </div>

      <POSClient 
        alumnas={alumnasSerialized as any} 
        conceptos={conceptosSerialized as any} 
      />
    </div>
  );
}
