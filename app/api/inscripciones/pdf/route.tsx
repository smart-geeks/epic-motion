import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRLS } from '@/lib/prisma-rls';
import { supabaseAdmin } from '@/lib/supabase';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import PDFInscripcion from '@/components/pdf/PDFInscripcion';
import React from 'react';

function calcularCicloEscolar(): string {
  const ahora = new Date();
  const mes = ahora.getMonth();
  const anio = ahora.getFullYear();
  const inicio = mes >= 7 ? anio : anio - 1;
  return `Agosto ${inicio} – Junio ${inicio + 1}`;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }
    const rol = session.user?.rol;
    if (rol !== 'ADMIN' && rol !== 'RECEPCIONISTA') {
      return NextResponse.json({ ok: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json() as { alumnaId: string; padreId: string; passwordTemporal: string };
    const { alumnaId, padreId, passwordTemporal } = body;

    if (!alumnaId || !padreId) {
      return NextResponse.json({ ok: false, error: 'alumnaId y padreId son requeridos' }, { status: 400 });
    }

    // ── Consultar datos ──────────────────────────────────────────
    const [alumna, pagoRecord] = await withRLS(session, (tx) =>
      Promise.all([
        tx.alumna.findUnique({
          where: { id: alumnaId },
          include: {
            padre: true,
            clases: {
              include: {
                grupo: {
                  include: {
                    disciplinasGrupo: { include: { disciplina: true } },
                    tarifa: true,
                  },
                },
              },
              orderBy: { fechaInscripcion: 'desc' },
              take: 1,
            },
            cargos: {
              include: { concepto: true },
              orderBy: { createdAt: 'desc' },
              take: 2,
            },
          },
        }),
        tx.pago.findFirst({
          where: { alumnaId, tipo: 'INSCRIPCION' },
          orderBy: { fechaVencimiento: 'desc' },
        }),
      ])
    );

    if (!alumna) {
      return NextResponse.json({ ok: false, error: 'Alumna no encontrada' }, { status: 404 });
    }

    const grupo = alumna.clases[0]?.grupo;
    const disciplinas = grupo?.disciplinasGrupo.map((gd) => ({
      nombre: gd.disciplina.nombre,
      horaTexto: gd.horaTexto,
    })) ?? [];

    // Reconstruir montos desde los cargos
    const cargoInsc = alumna.cargos.find((c) => c.concepto.tipo === 'INSCRIPCION');
    const cargoMens = alumna.cargos.find((c) => c.concepto.tipo === 'MENSUALIDAD');
    const cuotaInscripcion = cargoInsc?.montoOriginal.toNumber() ?? 0;
    const precioMensualidad = cargoMens?.montoOriginal.toNumber() ?? grupo?.tarifa?.precioMensualidad.toNumber() ?? 0;
    const montoAjustado =
      (cargoInsc?.montoFinal.toNumber() ?? 0) + (cargoMens?.montoFinal.toNumber() ?? 0);
    const totalOriginal = cuotaInscripcion + precioMensualidad;
    const hayAjuste = Math.abs(montoAjustado - totalOriginal) > 0.01;

    const metodoPago = pagoRecord?.metodoPago ?? 'EFECTIVO';
    const motivoAjuste = cargoInsc?.motivoDescuento ?? cargoMens?.motivoDescuento ?? '';

    const cicloEscolar = calcularCicloEscolar();
    const folio = 'EM-' + alumnaId.slice(-5).toUpperCase();
    const storagePath = `inscripciones/${alumnaId}/inscripcion_${folio}.pdf`;

    // ── Generar PDF ──────────────────────────────────────────────
    const pdfElement = React.createElement(PDFInscripcion, {
      alumna: {
        nombre: alumna.nombre,
        apellido: alumna.apellido,
        fechaInscripcion: alumna.fechaInscripcion.toISOString(),
      },
      grupoNombre: grupo?.nombre ?? '',
      disciplinas,
      cicloEscolar,
      tutor: {
        nombre: alumna.padre.nombre,
        apellido: alumna.padre.apellido,
        email: alumna.padre.email,
        telefono: alumna.padre.telefono ?? null,
      },
      cuotaInscripcion,
      precioMensualidad,
      pago: {
        metodoPago,
        montoAjustado: hayAjuste ? montoAjustado : null,
        motivoAjuste,
      },
      emailPadre: alumna.padre.email,
      passwordTemporal: passwordTemporal ?? '',
    }) as React.ReactElement<DocumentProps>;

    const buffer = await renderToBuffer(pdfElement);

    // ── Subir a Supabase Storage ─────────────────────────────────
    const { error: uploadError } = await supabaseAdmin.storage
      .from('documentos')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('[pdf/route] Supabase upload error:', uploadError);
      return NextResponse.json({ ok: false, error: 'Error al subir el PDF' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('documentos')
      .getPublicUrl(storagePath);

    return NextResponse.json({ ok: true, pdfUrl: publicUrl });
  } catch (err) {
    console.error('[pdf/route]', err);
    return NextResponse.json({ ok: false, error: 'Error interno al generar el PDF' }, { status: 500 });
  }
}
