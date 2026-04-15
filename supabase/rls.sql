-- ============================================================
-- Row Level Security — Epic Motion High Performance Dance Studio
-- ============================================================
-- IMPORTANTE: Este proyecto usa NextAuth + Prisma (NO Supabase Auth).
-- Las políticas usan current_setting('app.current_user_id') y
-- current_setting('app.current_user_rol') en lugar de auth.uid().
-- Estas variables se inyectan por transacción desde lib/prisma-rls.ts.
--
-- Los IDs son tipo UUID en todas las tablas.
-- app.current_user_id() devuelve text → se castea a ::uuid en cada comparación.
-- Si la variable no está definida, NULLIF devuelve NULL → el cast falla con NULL
-- → la condición USING evalúa false → acceso denegado (fail closed correcto).
--
-- El usuario `postgres` (Prisma) tiene BYPASSRLS en Supabase por defecto.
-- Ejecutar al final: ALTER ROLE postgres NOBYPASSRLS;
-- para que las políticas apliquen también a Prisma.
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- PASO 0: Crear el schema auxiliar (DEBE ir primero)
-- ──────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS app;


-- ──────────────────────────────────────────────────────────────
-- FUNCIONES AUXILIARES
-- Devuelven NULL cuando la variable no está definida,
-- lo que hace que USING (col = app.current_user_id()::uuid) → false
-- → acceso denegado. Comportamiento "fail closed" correcto.
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')
$$;

CREATE OR REPLACE FUNCTION app.current_user_rol()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_user_rol', true), '')
$$;


-- ══════════════════════════════════════════
-- 1. TABLA: "Usuario"
-- ══════════════════════════════════════════
-- Protege: datos personales, contraseña hasheada, teléfono y rol de cada usuario.
-- Un padre no puede ver qué rol tienen otros usuarios ni sus datos de contacto.
-- Un maestro no puede enumerar todos los padres del sistema.

ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total a todos los usuarios (CRUD completo)
CREATE POLICY "usuario_admin_all"
  ON "Usuario"
  AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Cualquier usuario autenticado: solo puede leer SU PROPIA fila.
CREATE POLICY "usuario_self_select"
  ON "Usuario"
  AS PERMISSIVE FOR SELECT
  USING (id = app.current_user_id()::uuid);

-- Cualquier usuario autenticado: puede actualizar solo su propia fila.
-- El campo `rol` queda bloqueado: no puede escalar sus propios privilegios.
CREATE POLICY "usuario_self_update"
  ON "Usuario"
  AS PERMISSIVE FOR UPDATE
  USING      (id = app.current_user_id()::uuid)
  WITH CHECK (
    id  = app.current_user_id()::uuid
    AND rol = (SELECT u.rol FROM "Usuario" u WHERE u.id = app.current_user_id()::uuid)
  );


-- ══════════════════════════════════════════
-- 2. TABLA: "Alumna"
-- ══════════════════════════════════════════
-- Protege: datos personales de las niñas (menores de edad).
-- Un padre nunca puede ver alumnas que no son sus hijas.
-- Un maestro solo ve las alumnas inscritas en SUS clases.
-- El aislamiento entre familias es total.

ALTER TABLE "Alumna" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
CREATE POLICY "alumna_admin_all"
  ON "Alumna"
  AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Padre: solo puede ver a SUS PROPIAS hijas (vinculadas por "padreId").
CREATE POLICY "alumna_padre_select"
  ON "Alumna"
  AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'PADRE'
    AND "padreId" = app.current_user_id()::uuid
  );

-- Maestro: puede ver las alumnas inscritas en las clases que imparte.
-- Necesario para tomar asistencia y registrar notas.
-- NO puede ver alumnas de clases de otros maestros.
CREATE POLICY "alumna_maestro_select"
  ON "Alumna"
  AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND EXISTS (
      SELECT 1
      FROM   "AlumnaClase" ac
      JOIN   "Clase"        c ON c.id = ac."claseId"
      WHERE  ac."alumnaId"    = "Alumna".id
        AND  c."profesorId"   = app.current_user_id()::uuid
    )
  );


-- ══════════════════════════════════════════
-- 3. TABLA: "Pago"
-- ══════════════════════════════════════════
-- Protege: información financiera — importes, vencimientos, estado de deuda.
-- Un padre nunca puede ver el estado de cuenta de otra familia.
-- Un maestro no tiene acceso a información de pagos (no es su rol).

ALTER TABLE "Pago" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total (cobranza, registrar pagos, exportar reportes)
CREATE POLICY "pago_admin_all"
  ON "Pago"
  AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Recepcionista: puede registrar nuevos pagos (efectivo) y actualizarlos,
-- pero NO tiene política SELECT → no puede navegar pagos de otras familias.
CREATE POLICY "pago_recepcionista_insert"
  ON "Pago"
  AS PERMISSIVE FOR INSERT
  WITH CHECK (app.current_user_rol() = 'RECEPCIONISTA');

CREATE POLICY "pago_recepcionista_update"
  ON "Pago"
  AS PERMISSIVE FOR UPDATE
  USING      (app.current_user_rol() = 'RECEPCIONISTA')
  WITH CHECK (app.current_user_rol() = 'RECEPCIONISTA');

-- Padre: solo puede VER (no modificar) sus propios pagos.
CREATE POLICY "pago_padre_select"
  ON "Pago"
  AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'PADRE'
    AND "padreId" = app.current_user_id()::uuid
  );


-- ══════════════════════════════════════════
-- 4. TABLA: "Sesion"
-- ══════════════════════════════════════════
-- Protege: el registro de clases impartidas, check-in del profesor
-- y el historial operativo.
-- Un maestro solo ve y modifica SUS sesiones.
-- Un padre no tiene acceso directo (accede vía "Asistencia").

ALTER TABLE "Sesion" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
CREATE POLICY "sesion_admin_all"
  ON "Sesion"
  AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Maestro: solo puede leer sus propias sesiones (agenda del día/semana).
CREATE POLICY "sesion_maestro_select"
  ON "Sesion"
  AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND "profesorId" = app.current_user_id()::uuid
  );

-- Maestro: puede actualizar sus sesiones (check-in, marcar COMPLETADA).
-- No puede crear ni borrar sesiones — eso lo gestiona el admin.
CREATE POLICY "sesion_maestro_update"
  ON "Sesion"
  AS PERMISSIVE FOR UPDATE
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND "profesorId" = app.current_user_id()::uuid
  )
  WITH CHECK (
    app.current_user_rol() = 'MAESTRO'
    AND "profesorId" = app.current_user_id()::uuid
  );


-- ══════════════════════════════════════════
-- 5. TABLA: "Cargo"
-- ══════════════════════════════════════════
-- Protege: el libro mayor de cuentas por cobrar.
-- Un padre solo ve los cargos de sus propias hijas.
-- Un maestro no tiene acceso a información financiera.

ALTER TABLE "Cargo" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total (generar cargos, ajustar importes, cancelar)
CREATE POLICY "cargo_admin_all"
  ON "Cargo"
  AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Recepcionista: puede crear y actualizar cargos (ej. registrar cargo por uniforme)
CREATE POLICY "cargo_recepcionista_insert"
  ON "Cargo"
  AS PERMISSIVE FOR INSERT
  WITH CHECK (app.current_user_rol() = 'RECEPCIONISTA');

CREATE POLICY "cargo_recepcionista_update"
  ON "Cargo"
  AS PERMISSIVE FOR UPDATE
  USING      (app.current_user_rol() = 'RECEPCIONISTA')
  WITH CHECK (app.current_user_rol() = 'RECEPCIONISTA');

-- Padre: solo puede VER sus propios cargos (no modificar).
CREATE POLICY "cargo_padre_select"
  ON "Cargo"
  AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'PADRE'
    AND "padreId" = app.current_user_id()::uuid
  );


-- ══════════════════════════════════════════
-- PASO FINAL (activar cuando lib/prisma-rls.ts esté integrado)
-- ══════════════════════════════════════════
-- Por defecto el usuario postgres tiene BYPASSRLS.
-- Al removerlo, las políticas aplican a TODOS los accesos,
-- incluidas las queries de Prisma.
--
-- ALTER ROLE postgres NOBYPASSRLS;
--
-- Para revertir si algo falla:
-- ALTER ROLE postgres BYPASSRLS;
