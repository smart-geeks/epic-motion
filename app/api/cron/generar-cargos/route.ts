import { NextRequest, NextResponse } from 'next/server';
import { withAdminRLS } from '@/lib/prisma-rls';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cron/generar-cargos
//
// Invoca fn_generar_mensualidades_diarias() dentro de una transacción con
// contexto ADMIN (para cumplir las políticas RLS de la tabla Cargo).
//
// Seguridad: solo acepta requests con el header x-cron-secret = CRON_SECRET.
//
// Usos:
//   · Vercel Cron Jobs → configurar en vercel.json con schedule "5 0 * * *"
//   · Supabase pg_cron → ver supabase/generacion_cargos_cron.sql
//   · n8n / Zapier     → HTTP POST con header x-cron-secret
//
// Variables de entorno necesarias:
//   CRON_SECRET          — token secreto para autenticar el cron
//   CRON_ADMIN_USER_ID   — UUID del usuario Admin (ej. luz@epicmotion.com)
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Autenticación ────────────────────────────────────────────────────────
  const secret = req.headers.get('x-cron-secret');

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const adminId = process.env.CRON_ADMIN_USER_ID;
  if (!adminId) {
    console.error('[CRON generar-cargos] CRON_ADMIN_USER_ID no está configurado en .env');
    return NextResponse.json(
      { ok: false, error: 'Configuración incompleta: CRON_ADMIN_USER_ID requerido' },
      { status: 500 }
    );
  }

  // ── Ejecución ────────────────────────────────────────────────────────────
  try {
    const rows = await withAdminRLS(adminId, async (tx) => {
      // La función PL/pgSQL hace el INSERT masivo internamente.
      // withAdminRLS inyecta app.current_user_rol = 'ADMIN' para que las
      // políticas RLS de Cargo permitan el INSERT.
      return tx.$queryRaw<Array<{ alumnas_procesadas: number; cargos_creados: number }>>`
        SELECT * FROM fn_generar_mensualidades_diarias()
      `;
    });

    const alumnas  = Number(rows[0]?.alumnas_procesadas  ?? 0);
    const cargos   = Number(rows[0]?.cargos_creados       ?? 0);

    console.info(
      `[CRON generar-cargos] OK · alumnas=${alumnas} cargos_nuevos=${cargos} · ${new Date().toISOString()}`
    );

    return NextResponse.json({
      ok: true,
      alumnas_procesadas: alumnas,
      cargos_creados:     cargos,
      ejecutado:          new Date().toISOString(),
    });

  } catch (err) {
    console.error('[CRON generar-cargos] ERROR', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 }
    );
  }
}
