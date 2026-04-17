-- =============================================================================
-- generacion_cargos_cron.sql
-- Autómata nocturno de mensualidades para Epic Motion.
--
-- Propósito:
--   Genera un Cargo de mensualidad por cada (Alumna, Grupo) cuyo `diaCobro`
--   coincida con el día actual, leyendo el precio de TarifaMensualidad.
--
-- Edge-cases resueltos:
--   - Días 29/30/31 en meses cortos (Feb = 28 días, etc.): si el diaCobro
--     de la alumna no existe en el mes actual, se procesa en el último día
--     del mes. Ej: diaCobro=31 en febrero → procesa el día 28/29.
--   - Idempotencia: no genera duplicados si el cron corre más de una vez
--     el mismo día o si el admin lo ejecuta manualmente.
--
-- Cómo aplicar:
--   Ejecutar en Supabase Dashboard → SQL Editor (es idempotente).
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCIÓN: fn_generar_mensualidades_diarias
-- Retorna el número de alumnas y cargos procesados para logging.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_generar_mensualidades_diarias()
RETURNS TABLE (alumnas_procesadas INT, cargos_creados INT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_hoy           DATE := CURRENT_DATE;
  v_dia_hoy       INT  := EXTRACT(DAY FROM CURRENT_DATE)::INT;
  -- Último día real del mes en curso (28, 29, 30 o 31)
  v_ultimo_dia    INT  := EXTRACT(
                            DAY FROM
                            (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')
                          )::INT;
  v_concepto_id   UUID;
  v_count_cargos  INT := 0;
  v_count_alumnas INT := 0;
BEGIN

  -- ── 1. Obtener el Concepto de MENSUALIDAD activo ────────────────────────────
  SELECT id INTO v_concepto_id
    FROM "Concepto"
   WHERE tipo = 'MENSUALIDAD'
     AND activo = true
   ORDER BY "createdAt"
   LIMIT 1;

  IF v_concepto_id IS NULL THEN
    RAISE EXCEPTION
      'fn_generar_mensualidades_diarias: no existe ningún Concepto activo '
      'de tipo MENSUALIDAD. Créalo en el catálogo antes de ejecutar el cron.';
  END IF;

  -- ── 2. INSERT masivo ────────────────────────────────────────────────────────
  -- Un Cargo por cada (Alumna, Grupo) activo que cumpla los criterios.
  -- La fechaVencimiento se fija al último día del mes en curso,
  -- lo cual da un período de gracia natural hasta fin de mes.
  INSERT INTO "Cargo" (
    id,
    "montoOriginal",
    descuento,
    "montoFinal",
    "fechaVencimiento",
    estado,
    "notificado3Dias",
    "notificadoHoy",
    "conceptoId",
    "alumnaId",
    "padreId",
    "grupoId",
    "createdAt",
    "updatedAt"
  )
  SELECT
    gen_random_uuid(),
    tm."precioMensualidad",          -- montoOriginal = tarifa vigente del grupo
    0::NUMERIC(10,2),                -- sin descuento por defecto
    tm."precioMensualidad",          -- montoFinal = montoOriginal − 0
    -- Vence el último día del mes en curso
    (DATE_TRUNC('month', v_hoy) + INTERVAL '1 month - 1 day')::TIMESTAMPTZ,
    'PENDIENTE'::"EstadoCargo",
    false,
    false,
    v_concepto_id,
    a.id,
    a."padreId",
    g.id,                            -- grupoId: clave para trazabilidad e idempotencia
    NOW(),
    NOW()

  FROM "Alumna" a
  -- Solo alumnas activas con día de cobro configurado
  JOIN "AlumnaClase"       ac ON ac."alumnaId" = a.id
                              AND ac."grupoId"  IS NOT NULL
  JOIN "Grupo"             g  ON g.id = ac."grupoId"
                              AND g.activo = true
  JOIN "TarifaMensualidad" tm ON tm."grupoId" = g.id
                              AND tm.activo   = true

  WHERE a.estatus = 'ACTIVA'
    AND a."diaCobro" IS NOT NULL

    -- ── Edge-case: meses cortos ──────────────────────────────────────────────
    -- Procesar también a quienes tienen diaCobro > días del mes (ej. 31 en feb).
    AND (
      a."diaCobro" = v_dia_hoy
      OR (a."diaCobro" > v_ultimo_dia AND v_dia_hoy = v_ultimo_dia)
    )

    -- ── Idempotencia: no duplicar si ya existe cargo de este grupo este mes ──
    -- Compara DATE_TRUNC del mes para que funcione aunque se corra el día 28 o 31.
    AND NOT EXISTS (
      SELECT 1
        FROM "Cargo" c2
       WHERE c2."alumnaId"   = a.id
         AND c2."grupoId"    = g.id
         AND c2."conceptoId" = v_concepto_id
         AND DATE_TRUNC('month', c2."fechaVencimiento")
             = DATE_TRUNC('month', v_hoy::TIMESTAMPTZ)
    );

  -- ── 3. Recopilar métricas ────────────────────────────────────────────────
  GET DIAGNOSTICS v_count_cargos = ROW_COUNT;

  SELECT COUNT(DISTINCT "alumnaId")::INT
    INTO v_count_alumnas
    FROM "Cargo"
   WHERE "conceptoId" = v_concepto_id
     AND DATE("createdAt" AT TIME ZONE 'America/Mexico_City') = v_hoy;

  RETURN QUERY SELECT v_count_alumnas, v_count_cargos;

END;
$$;


-- =============================================================================
-- CÓMO REGISTRAR EL CRON EN SUPABASE
-- (ejecutar UNA VEZ en Supabase Dashboard → SQL Editor)
--
-- 1. Habilitar la extensión pg_cron (solo desde el Dashboard, no pooler):
--      CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- 2. Programar la función para las 00:05 UTC (19:05 CST) cada día:
--      SELECT cron.schedule(
--        'generar-mensualidades-diarias',
--        '5 0 * * *',
--        $$ SELECT * FROM fn_generar_mensualidades_diarias() $$
--      );
--
-- 3. Verificar que el job quedó registrado:
--      SELECT jobid, jobname, schedule, active FROM cron.job;
--
-- 4. Para pausar el job sin borrarlo:
--      UPDATE cron.job SET active = false
--       WHERE jobname = 'generar-mensualidades-diarias';
--
-- 5. Para eliminar el job:
--      SELECT cron.unschedule('generar-mensualidades-diarias');
--
-- ALTERNATIVA: Vercel Cron Jobs
--   En vercel.json:
--     { "crons": [{ "path": "/api/cron/generar-cargos", "schedule": "5 0 * * *" }] }
--   El endpoint Next.js llama a esta función vía withAdminRLS.
-- =============================================================================
