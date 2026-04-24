'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import { revalidatePath } from 'next/cache';

export async function createProductAction(data: {
  nombre: string;
  precioSugerido: number;
  tipo: string;
  descripcion?: string;
}) {
  const session = await getServerSession(authOptions);

  try {
    const nuevoConcepto = await withRLS(session, (tx) =>
      tx.concepto.create({
        data: {
          nombre: data.nombre,
          precioSugerido: data.precioSugerido,
          tipo: data.tipo,
          descripcion: data.descripcion || '',
          activo: true,
        },
      })
    );

    revalidatePath('/admin/punto-de-venta');
    return { ok: true, data: nuevoConcepto };
  } catch (error: any) {
    console.error('Error creating product:', error);
    return { ok: false, error: error.message || 'Error al crear el producto' };
  }
}

export async function checkoutPOSAction(data: {
  alumnaId: string;
  items: {
    type: 'cargo' | 'product';
    originalId: string;
    price: number;
    name: string;
  }[];
  metodo: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
  total: number;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, error: 'No autorizado' };

  try {
    const result = await withRLS(session, async (tx) => {
      // Obtener datos de la alumna para el padreId
      const alumna = await tx.alumna.findUnique({
        where: { id: data.alumnaId },
        select: { padreId: true }
      });

      if (!alumna) throw new Error('Alumna no encontrada');

      // 1. Crear el registro de Pago
      const pago = await tx.pago.create({
        data: {
          importe: data.total,
          metodoPago: data.metodo,
          alumnaId: data.alumnaId,
          padreId: alumna.padreId,
          concepto: 'Venta Punto de Venta',
          tipo: 'OTRO',
          estado: 'PAGADO',
          fechaPago: new Date(),
          fechaVencimiento: new Date(),
        }
      });

      // 2. Procesar cada item
      for (const item of data.items) {
        let cargoId = item.originalId;

        if (item.type === 'product') {
          // Si es un producto del catálogo, creamos el Cargo primero (ya marcado como pagado)
          const nuevoCargo = await tx.cargo.create({
            data: {
              alumnaId: data.alumnaId,
              padreId: alumna.padreId,
              conceptoId: item.originalId,
              montoOriginal: item.price,
              montoFinal: item.price,
              estado: 'PAGADO',
              fechaVencimiento: new Date(),
              fechaPago: new Date(),
            }
          });
          cargoId = nuevoCargo.id;
        } else {
          // Si es un cargo existente, lo actualizamos a PAGADO
          await tx.cargo.update({
            where: { id: item.originalId },
            data: {
              estado: 'PAGADO',
              fechaPago: new Date(),
            }
          });
        }

        // 3. Crear la aplicación del pago para vincular Cargo y Pago
        await tx.aplicacionPago.create({
          data: {
            pagoId: pago.id,
            cargoId: cargoId,
            montoAplicado: item.price
          }
        });
      }

      return pago;
    });

    revalidatePath('/admin/punto-de-venta');
    revalidatePath('/admin/cobranza');
    
    // Serializar el resultado para evitar errores de Decimal en Server Actions
    return { 
      ok: true, 
      data: {
        ...result,
        importe: Number(result.importe)
      } 
    };
  } catch (error: any) {
    console.error('Error in POS checkout:', error);
    return { ok: false, error: error.message || 'Error al procesar el pago' };
  }
}
