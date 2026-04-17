import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';

// ─────────────────────────────────────────────────────────────
// Schemas de validación (Zod)
// ─────────────────────────────────────────────────────────────

const AplicacionSchema = z.object({
  cargoId:       z.string().uuid({ message: 'cargoId debe ser un UUID válido' }),
  montoAplicado: z.number().positive({ message: 'montoAplicado debe ser mayor a 0' }),
});

const PagoSchema = z.object({
  alumnaId:           z.string().uuid(),
  padreId:            z.string().uuid(),
  importe:            z.number().positive({ message: 'El importe debe ser mayor a 0' }),
  concepto:           z.string().min(1, 'El concepto es requerido'),
  tipo:               z.enum(['MENSUALIDAD', 'CLASE_PRIVADA', 'INSCRIPCION', 'OTRO']),
  referenciaExternaId: z.string().optional(),
  // Al menos una aplicación: cada AplicacionPago vincula este Pago a un Cargo específico.
  // El trigger fn_sincronizar_estado_cargo actualizará Cargo.estado automáticamente.
  aplicaciones:       z.array(AplicacionSchema).min(1, 'Debe incluir al menos un cargo a cubrir'),
});

// ─────────────────────────────────────────────────────────────
// POST /api/pagos
// Crea un Pago y sus AplicacionPago en una sola transacción.
// El trigger de BD actualiza Cargo.estado automáticamente.
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
    }

    // Solo Admin y Recepcionista pueden registrar pagos
    if (!['ADMIN', 'RECEPCIONISTA'].includes(session.user.rol)) {
      return NextResponse.json({ ok: false, error: 'Sin permiso para registrar pagos' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = PagoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Datos inválidos', detalle: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { alumnaId, padreId, importe, concepto, tipo, referenciaExternaId, aplicaciones } = parsed.data;

    const resultado = await withRLS(session, async (tx) => {
      // Verificar que los cargoIds existen y pertenecen a la alumna/padre indicados
      const cargosIds = aplicaciones.map((a) => a.cargoId);
      const cargosExistentes = await tx.cargo.findMany({
        where: {
          id:       { in: cargosIds },
          alumnaId,
          padreId,
        },
        select: { id: true, estado: true, montoFinal: true },
      });

      if (cargosExistentes.length !== cargosIds.length) {
        throw new Error('Uno o más cargos no existen o no pertenecen a esta alumna/padre');
      }

      // Crear el Pago
      const pago = await tx.pago.create({
        data: {
          importe:             importe,
          concepto,
          tipo,
          referenciaExternaId: referenciaExternaId ?? null,
          fechaVencimiento:    new Date(), // pagos en efectivo: vencimiento = hoy
          fechaPago:           new Date(),
          estado:              'PAGADO',
          alumnaId,
          padreId,
        },
      });

      // Crear las AplicacionPago — el trigger en BD actualizará Cargo.estado automáticamente
      await tx.aplicacionPago.createMany({
        data: aplicaciones.map((a) => ({
          pagoId:        pago.id,
          cargoId:       a.cargoId,
          montoAplicado: a.montoAplicado,
        })),
      });

      return pago;
    });

    return NextResponse.json({ ok: true, pago: resultado }, { status: 201 });

  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'Error interno';

    // referenciaExternaId duplicado → idempotencia
    if (mensaje.includes('Unique constraint') || mensaje.includes('unique')) {
      return NextResponse.json(
        { ok: false, error: 'Este pago ya fue registrado (referenciaExternaId duplicada)' },
        { status: 409 }
      );
    }

    console.error('[POST /api/pagos]', err);
    return NextResponse.json({ ok: false, error: mensaje }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/pagos?alumnaId=&padreId=&estado=
// Lista pagos con filtros opcionales. Solo Admin y Recepcionista.
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
    }

    if (!['ADMIN', 'RECEPCIONISTA'].includes(session.user.rol)) {
      return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const alumnaId = searchParams.get('alumnaId') ?? undefined;
    const padreId  = searchParams.get('padreId')  ?? undefined;

    const pagos = await withRLS(session, (tx) =>
      tx.pago.findMany({
        where: {
          ...(alumnaId && { alumnaId }),
          ...(padreId  && { padreId  }),
        },
        include: {
          alumna:      { select: { nombre: true, apellido: true } },
          aplicaciones: {
            include: {
              cargo: {
                include: { concepto: { select: { nombre: true } } },
              },
            },
          },
        },
        orderBy: { fechaPago: 'desc' },
        take: 100,
      })
    );

    return NextResponse.json({ ok: true, pagos });

  } catch (err) {
    console.error('[GET /api/pagos]', err);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
