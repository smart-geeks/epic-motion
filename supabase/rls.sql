-- ============================================================
-- Row Level Security — Epic Motion High Performance Dance Studio
-- ============================================================
-- IMPORTANTE: Este proyecto usa NextAuth + Prisma (NO Supabase Auth).
-- Las políticas usan current_setting('app.current_user_id') y
-- current_setting('app.current_user_rol') en lugar de auth.uid().
-- Estas variables se inyectan por transacción desde lib/prisma-rls.ts.
--
-- Tablas cubiertas (21/21):
--   Usuario, Alumna, Pago, Cargo, Sesion, Asistencia, Nota, Logro,
--   Notificacion, Noticia, LecturaNoticia, Evento, EventoGrupo,
--   Clase, AlumnaClase, Profesor, Paquete, ClasePrivada, Concepto,
--   Configuracion, Grupo, Disciplina, GrupoDisciplina, TarifaMensualidad
--
-- Convenciones:
--   - app.current_user_id()  → TEXT → castear a ::uuid en comparaciones
--   - app.current_user_rol() → TEXT → comparar con literales de rol
--   - NULLIF devuelve NULL si la variable no está definida → USING = false
--     → fail closed correcto (sin sesión = sin acceso)
--   - El usuario postgres tiene BYPASSRLS en Supabase por defecto.
--     Activar al final: ALTER ROLE postgres NOBYPASSRLS;
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- PASO 0: Schema auxiliar y funciones helpers
-- ──────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')
$$;

CREATE OR REPLACE FUNCTION app.current_user_rol()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_user_rol', true), '')
$$;

-- Helper: el usuario tiene uno de los roles del array
CREATE OR REPLACE FUNCTION app.rol_in(roles text[])
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT app.current_user_rol() = ANY(roles)
$$;


-- ══════════════════════════════════════════════════════════════
-- SECCIÓN A: Integridad financiera (CHECK constraints)
-- Aplicar una sola vez. Verificar que no existan datos inválidos
-- antes de ejecutar en producción.
-- ══════════════════════════════════════════════════════════════

-- Cargos: montos siempre positivos y matemáticamente consistentes
-- Bloques DO para idempotencia (re-ejecutable sin error si ya existe)
DO $$ BEGIN
  ALTER TABLE "Cargo" ADD CONSTRAINT "chk_cargo_monto_original_positivo"
    CHECK ("montoOriginal" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Cargo" ADD CONSTRAINT "chk_cargo_descuento_positivo"
    CHECK ("descuento" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Cargo" ADD CONSTRAINT "chk_cargo_monto_final_positivo"
    CHECK ("montoFinal" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Cargo" ADD CONSTRAINT "chk_cargo_logica_financiera"
    CHECK ("montoOriginal" - "descuento" = "montoFinal");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Pagos: el importe nunca puede ser negativo
DO $$ BEGIN
  ALTER TABLE "Pago" ADD CONSTRAINT "chk_pago_importe_positivo"
    CHECK ("importe" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tarifas: precios siempre positivos
DO $$ BEGIN
  ALTER TABLE "TarifaMensualidad" ADD CONSTRAINT "chk_tarifa_mensualidad_positiva"
    CHECK ("precioMensualidad" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "TarifaMensualidad" ADD CONSTRAINT "chk_tarifa_preseason_positiva"
    CHECK ("precioPreseason" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ══════════════════════════════════════════════════════════════
-- SECCIÓN B: Row Level Security — tabla por tabla
-- ══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════
-- 1. TABLA: "Usuario"
-- Protege: datos personales, contraseña hasheada, teléfono y rol.
-- Un padre no puede ver datos de otras familias ni de maestros.
-- ══════════════════════════════════════════

ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total a todos los usuarios (CRUD)
DROP POLICY IF EXISTS "usuario_admin_all" ON "Usuario";
CREATE POLICY "usuario_admin_all"
  ON "Usuario" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Cualquier usuario autenticado: solo lee SU PROPIA fila
DROP POLICY IF EXISTS "usuario_self_select" ON "Usuario";
CREATE POLICY "usuario_self_select"
  ON "Usuario" AS PERMISSIVE FOR SELECT
  USING (id = app.current_user_id()::uuid);

-- Cualquier usuario autenticado: actualiza solo su propia fila.
-- El campo `rol` está bloqueado — nadie puede escalar sus propios privilegios.
DROP POLICY IF EXISTS "usuario_self_update" ON "Usuario";
CREATE POLICY "usuario_self_update"
  ON "Usuario" AS PERMISSIVE FOR UPDATE
  USING      (id = app.current_user_id()::uuid)
  WITH CHECK (
    id  = app.current_user_id()::uuid
    AND rol = (SELECT u.rol FROM "Usuario" u WHERE u.id = app.current_user_id()::uuid)
  );

-- Maestro: puede ver datos básicos de los padres de SUS alumnas
-- (necesario para mostrar contacto en caso de emergencia)
DROP POLICY IF EXISTS "usuario_maestro_padres_select" ON "Usuario";
CREATE POLICY "usuario_maestro_padres_select"
  ON "Usuario" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND rol = 'PADRE'
    AND EXISTS (
      SELECT 1
      FROM   "Alumna" a
      JOIN   "AlumnaClase" ac ON ac."alumnaId" = a.id
      LEFT JOIN "Clase"   c  ON c.id = ac."claseId"
      LEFT JOIN "Grupo"   g  ON g.id = ac."grupoId"
      WHERE  a."padreId" = "Usuario".id
        AND (c."profesorId" = app.current_user_id()::uuid
          OR g."profesorId" = app.current_user_id()::uuid)
    )
  );

-- Recepcionista: puede leer usuarios para búsquedas en el wizard de inscripción
DROP POLICY IF EXISTS "usuario_recepcionista_select" ON "Usuario";
CREATE POLICY "usuario_recepcionista_select"
  ON "Usuario" AS PERMISSIVE FOR SELECT
  USING (app.current_user_rol() = 'RECEPCIONISTA');

-- Recepcionista: puede crear cuentas de padres (wizard de inscripción)
DROP POLICY IF EXISTS "usuario_recepcionista_insert" ON "Usuario";
CREATE POLICY "usuario_recepcionista_insert"
  ON "Usuario" AS PERMISSIVE FOR INSERT
  WITH CHECK (
    app.current_user_rol() = 'RECEPCIONISTA'
    AND rol = 'PADRE'
  );


-- ══════════════════════════════════════════
-- 2. TABLA: "Alumna"
-- Protege: datos personales de menores de edad.
-- Aislamiento total entre familias. Un padre nunca ve alumnas de otra familia.
-- ══════════════════════════════════════════

ALTER TABLE "Alumna" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
DROP POLICY IF EXISTS "alumna_admin_all" ON "Alumna";
CREATE POLICY "alumna_admin_all"
  ON "Alumna" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Recepcionista: puede crear y leer alumnas (wizard de inscripción + búsqueda)
DROP POLICY IF EXISTS "alumna_recepcionista_all" ON "Alumna";
CREATE POLICY "alumna_recepcionista_all"
  ON "Alumna" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'RECEPCIONISTA')
  WITH CHECK (app.current_user_rol() = 'RECEPCIONISTA');

-- Padre: solo ve a SUS PROPIAS hijas (vinculadas por padreId)
DROP POLICY IF EXISTS "alumna_padre_select" ON "Alumna";
CREATE POLICY "alumna_padre_select"
  ON "Alumna" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'PADRE'
    AND "padreId" = app.current_user_id()::uuid
  );

-- Maestro: ve las alumnas inscritas en sus clases o grupos.
-- claseId puede ser null (wizard nuevo), por eso se chequea también grupoId.
DROP POLICY IF EXISTS "alumna_maestro_select" ON "Alumna";
CREATE POLICY "alumna_maestro_select"
  ON "Alumna" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND EXISTS (
      SELECT 1
      FROM   "AlumnaClase" ac
      LEFT JOIN "Clase" c ON c.id = ac."claseId"
      LEFT JOIN "Grupo" g ON g.id = ac."grupoId"
      WHERE  ac."alumnaId" = "Alumna".id
        AND (c."profesorId" = app.current_user_id()::uuid
          OR g."profesorId" = app.current_user_id()::uuid)
    )
  );


-- ══════════════════════════════════════════
-- 3. TABLA: "Pago"
-- Protege: información financiera por familia.
-- Un padre nunca ve el estado de cuenta de otra familia.
-- ══════════════════════════════════════════

ALTER TABLE "Pago" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
DROP POLICY IF EXISTS "pago_admin_all" ON "Pago";
CREATE POLICY "pago_admin_all"
  ON "Pago" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Recepcionista: puede crear y actualizar pagos (efectivo en caja)
DROP POLICY IF EXISTS "pago_recepcionista_insert" ON "Pago";
CREATE POLICY "pago_recepcionista_insert"
  ON "Pago" AS PERMISSIVE FOR INSERT
  WITH CHECK (app.current_user_rol() = 'RECEPCIONISTA');

DROP POLICY IF EXISTS "pago_recepcionista_update" ON "Pago";
CREATE POLICY "pago_recepcionista_update"
  ON "Pago" AS PERMISSIVE FOR UPDATE
  USING      (app.current_user_rol() = 'RECEPCIONISTA')
  WITH CHECK (app.current_user_rol() = 'RECEPCIONISTA');

-- Recepcionista: puede leer los pagos de la familia que está atendiendo
DROP POLICY IF EXISTS "pago_recepcionista_select" ON "Pago";
CREATE POLICY "pago_recepcionista_select"
  ON "Pago" AS PERMISSIVE FOR SELECT
  USING (app.current_user_rol() = 'RECEPCIONISTA');

-- Padre: solo lee sus propios pagos (no puede modificarlos)
DROP POLICY IF EXISTS "pago_padre_select" ON "Pago";
CREATE POLICY "pago_padre_select"
  ON "Pago" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'PADRE'
    AND "padreId" = app.current_user_id()::uuid
  );


-- ══════════════════════════════════════════
-- 4. TABLA: "Cargo"
-- Protege: el libro mayor de cuentas por cobrar.
-- Un padre solo ve los cargos de sus propias hijas.
-- ══════════════════════════════════════════

ALTER TABLE "Cargo" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
DROP POLICY IF EXISTS "cargo_admin_all" ON "Cargo";
CREATE POLICY "cargo_admin_all"
  ON "Cargo" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Recepcionista: crea, lee y actualiza cargos (registro de cobros)
DROP POLICY IF EXISTS "cargo_recepcionista_insert" ON "Cargo";
CREATE POLICY "cargo_recepcionista_insert"
  ON "Cargo" AS PERMISSIVE FOR INSERT
  WITH CHECK (app.current_user_rol() = 'RECEPCIONISTA');

DROP POLICY IF EXISTS "cargo_recepcionista_select" ON "Cargo";
CREATE POLICY "cargo_recepcionista_select"
  ON "Cargo" AS PERMISSIVE FOR SELECT
  USING (app.current_user_rol() = 'RECEPCIONISTA');

DROP POLICY IF EXISTS "cargo_recepcionista_update" ON "Cargo";
CREATE POLICY "cargo_recepcionista_update"
  ON "Cargo" AS PERMISSIVE FOR UPDATE
  USING      (app.current_user_rol() = 'RECEPCIONISTA')
  WITH CHECK (app.current_user_rol() = 'RECEPCIONISTA');

-- Padre: solo lee sus propios cargos (no puede modificarlos)
DROP POLICY IF EXISTS "cargo_padre_select" ON "Cargo";
CREATE POLICY "cargo_padre_select"
  ON "Cargo" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'PADRE'
    AND "padreId" = app.current_user_id()::uuid
  );


-- ══════════════════════════════════════════
-- 5. TABLA: "Sesion"
-- Protege: el registro de clases impartidas y check-in del profesor.
-- Un maestro solo ve y modifica SUS sesiones.
-- ══════════════════════════════════════════

ALTER TABLE "Sesion" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
DROP POLICY IF EXISTS "sesion_admin_all" ON "Sesion";
CREATE POLICY "sesion_admin_all"
  ON "Sesion" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Maestro: lee sus propias sesiones (agenda del día/semana)
DROP POLICY IF EXISTS "sesion_maestro_select" ON "Sesion";
CREATE POLICY "sesion_maestro_select"
  ON "Sesion" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND "profesorId" = app.current_user_id()::uuid
  );

-- Maestro: actualiza sus sesiones (check-in, marcar COMPLETADA)
-- No puede crear ni borrar sesiones — eso lo hace el admin.
DROP POLICY IF EXISTS "sesion_maestro_update" ON "Sesion";
CREATE POLICY "sesion_maestro_update"
  ON "Sesion" AS PERMISSIVE FOR UPDATE
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND "profesorId" = app.current_user_id()::uuid
  )
  WITH CHECK (
    app.current_user_rol() = 'MAESTRO'
    AND "profesorId" = app.current_user_id()::uuid
  );


-- ══════════════════════════════════════════
-- 6. TABLA: "Asistencia"
-- Protege: el registro de presencia, puntualidad y uniforme de cada alumna.
-- El maestro solo puede registrar asistencia de SUS sesiones.
-- El padre solo ve la asistencia de SUS hijas.
-- ══════════════════════════════════════════

ALTER TABLE "Asistencia" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
DROP POLICY IF EXISTS "asistencia_admin_all" ON "Asistencia";
CREATE POLICY "asistencia_admin_all"
  ON "Asistencia" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Maestro: lee, crea y actualiza asistencias de sus propias sesiones
DROP POLICY IF EXISTS "asistencia_maestro_select" ON "Asistencia";
CREATE POLICY "asistencia_maestro_select"
  ON "Asistencia" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND EXISTS (
      SELECT 1 FROM "Sesion" s
      WHERE s.id = "Asistencia"."sesionId"
        AND s."profesorId" = app.current_user_id()::uuid
    )
  );

DROP POLICY IF EXISTS "asistencia_maestro_insert" ON "Asistencia";
CREATE POLICY "asistencia_maestro_insert"
  ON "Asistencia" AS PERMISSIVE FOR INSERT
  WITH CHECK (
    app.current_user_rol() = 'MAESTRO'
    AND EXISTS (
      SELECT 1 FROM "Sesion" s
      WHERE s.id = "Asistencia"."sesionId"
        AND s."profesorId" = app.current_user_id()::uuid
    )
  );

DROP POLICY IF EXISTS "asistencia_maestro_update" ON "Asistencia";
CREATE POLICY "asistencia_maestro_update"
  ON "Asistencia" AS PERMISSIVE FOR UPDATE
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND EXISTS (
      SELECT 1 FROM "Sesion" s
      WHERE s.id = "Asistencia"."sesionId"
        AND s."profesorId" = app.current_user_id()::uuid
    )
  )
  WITH CHECK (
    app.current_user_rol() = 'MAESTRO'
    AND EXISTS (
      SELECT 1 FROM "Sesion" s
      WHERE s.id = "Asistencia"."sesionId"
        AND s."profesorId" = app.current_user_id()::uuid
    )
  );

-- Padre: solo lee asistencias de sus propias hijas
DROP POLICY IF EXISTS "asistencia_padre_select" ON "Asistencia";
CREATE POLICY "asistencia_padre_select"
  ON "Asistencia" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'PADRE'
    AND EXISTS (
      SELECT 1 FROM "Alumna" a
      WHERE a.id = "Asistencia"."alumnaId"
        AND a."padreId" = app.current_user_id()::uuid
    )
  );


-- ══════════════════════════════════════════
-- 7. TABLA: "Nota"
-- Flujo: maestro escribe (BORRADOR) → admin aprueba (APROBADA) → publica (PUBLICADA)
-- El padre solo ve notas PUBLICADAS de sus hijas.
-- ══════════════════════════════════════════

ALTER TABLE "Nota" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total (aprueba, publica, gestiona)
DROP POLICY IF EXISTS "nota_admin_all" ON "Nota";
CREATE POLICY "nota_admin_all"
  ON "Nota" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Maestro: lee y escribe sus propias notas (BORRADOR y APROBADA, no puede publicar)
DROP POLICY IF EXISTS "nota_maestro_select" ON "Nota";
CREATE POLICY "nota_maestro_select"
  ON "Nota" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND "maestroId" = app.current_user_id()::uuid
  );

DROP POLICY IF EXISTS "nota_maestro_insert" ON "Nota";
CREATE POLICY "nota_maestro_insert"
  ON "Nota" AS PERMISSIVE FOR INSERT
  WITH CHECK (
    app.current_user_rol() = 'MAESTRO'
    AND "maestroId" = app.current_user_id()::uuid
    AND estado = 'BORRADOR'
  );

DROP POLICY IF EXISTS "nota_maestro_update" ON "Nota";
CREATE POLICY "nota_maestro_update"
  ON "Nota" AS PERMISSIVE FOR UPDATE
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND "maestroId" = app.current_user_id()::uuid
    AND estado = 'BORRADOR'       -- solo puede editar mientras esté en borrador
  )
  WITH CHECK (
    app.current_user_rol() = 'MAESTRO'
    AND "maestroId" = app.current_user_id()::uuid
    AND estado IN ('BORRADOR', 'APROBADA')  -- puede ver el resultado pero no publicar
  );

-- Padre: solo lee notas PUBLICADAS de sus propias hijas
DROP POLICY IF EXISTS "nota_padre_select" ON "Nota";
CREATE POLICY "nota_padre_select"
  ON "Nota" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'PADRE'
    AND estado = 'PUBLICADA'
    AND EXISTS (
      SELECT 1 FROM "Alumna" a
      WHERE a.id = "Nota"."alumnaId"
        AND a."padreId" = app.current_user_id()::uuid
    )
  );


-- ══════════════════════════════════════════
-- 8. TABLA: "Logro"
-- Gamificación PRIVADA: cada familia solo ve el progreso de SUS hijas.
-- Sin rankings públicos — aislamiento total entre familias.
-- ══════════════════════════════════════════

ALTER TABLE "Logro" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total (asigna logros, vista global)
DROP POLICY IF EXISTS "logro_admin_all" ON "Logro";
CREATE POLICY "logro_admin_all"
  ON "Logro" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Padre: solo ve logros de SUS hijas
DROP POLICY IF EXISTS "logro_padre_select" ON "Logro";
CREATE POLICY "logro_padre_select"
  ON "Logro" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'PADRE'
    AND EXISTS (
      SELECT 1 FROM "Alumna" a
      WHERE a.id = "Logro"."alumnaId"
        AND a."padreId" = app.current_user_id()::uuid
    )
  );

-- Maestro: puede ver logros de sus alumnas (para dar contexto en notas)
DROP POLICY IF EXISTS "logro_maestro_select" ON "Logro";
CREATE POLICY "logro_maestro_select"
  ON "Logro" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND EXISTS (
      SELECT 1
      FROM   "AlumnaClase" ac
      LEFT JOIN "Clase" c ON c.id = ac."claseId"
      LEFT JOIN "Grupo" g ON g.id = ac."grupoId"
      WHERE  ac."alumnaId" = "Logro"."alumnaId"
        AND (c."profesorId" = app.current_user_id()::uuid
          OR g."profesorId" = app.current_user_id()::uuid)
    )
  );


-- ══════════════════════════════════════════
-- 9. TABLA: "Notificacion"
-- Cada usuario solo ve y gestiona SUS PROPIAS notificaciones.
-- ══════════════════════════════════════════

ALTER TABLE "Notificacion" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total (puede enviar y leer todas las notificaciones)
DROP POLICY IF EXISTS "notificacion_admin_all" ON "Notificacion";
CREATE POLICY "notificacion_admin_all"
  ON "Notificacion" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Cualquier usuario autenticado: solo ve sus propias notificaciones
DROP POLICY IF EXISTS "notificacion_self_select" ON "Notificacion";
CREATE POLICY "notificacion_self_select"
  ON "Notificacion" AS PERMISSIVE FOR SELECT
  USING ("usuarioId" = app.current_user_id()::uuid);

-- Cualquier usuario autenticado: puede marcar como leída su propia notificación
DROP POLICY IF EXISTS "notificacion_self_update" ON "Notificacion";
CREATE POLICY "notificacion_self_update"
  ON "Notificacion" AS PERMISSIVE FOR UPDATE
  USING      ("usuarioId" = app.current_user_id()::uuid)
  WITH CHECK ("usuarioId" = app.current_user_id()::uuid);


-- ══════════════════════════════════════════
-- 10. TABLA: "Noticia"
-- Publicadas por admin con imagen, título, texto.
-- Padres y maestros pueden leer las activas.
-- Admin ve quién confirmó lectura.
-- ══════════════════════════════════════════

ALTER TABLE "Noticia" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total (CRUD de noticias)
DROP POLICY IF EXISTS "noticia_admin_all" ON "Noticia";
CREATE POLICY "noticia_admin_all"
  ON "Noticia" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Padre: solo lee noticias activas
DROP POLICY IF EXISTS "noticia_padre_select" ON "Noticia";
CREATE POLICY "noticia_padre_select"
  ON "Noticia" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'PADRE'
    AND activa = true
  );

-- Maestro: lee noticias activas (para estar informado)
DROP POLICY IF EXISTS "noticia_maestro_select" ON "Noticia";
CREATE POLICY "noticia_maestro_select"
  ON "Noticia" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND activa = true
  );


-- ══════════════════════════════════════════
-- 11. TABLA: "LecturaNoticia"
-- Confirmación de lectura del padre.
-- Admin ve quién confirmó y quién no.
-- ══════════════════════════════════════════

ALTER TABLE "LecturaNoticia" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total (para ver confirmaciones y hacer seguimiento)
DROP POLICY IF EXISTS "lectura_admin_all" ON "LecturaNoticia";
CREATE POLICY "lectura_admin_all"
  ON "LecturaNoticia" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Padre: solo ve y confirma sus propias lecturas
DROP POLICY IF EXISTS "lectura_padre_select" ON "LecturaNoticia";
CREATE POLICY "lectura_padre_select"
  ON "LecturaNoticia" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'PADRE'
    AND "padreId" = app.current_user_id()::uuid
  );

DROP POLICY IF EXISTS "lectura_padre_insert" ON "LecturaNoticia";
CREATE POLICY "lectura_padre_insert"
  ON "LecturaNoticia" AS PERMISSIVE FOR INSERT
  WITH CHECK (
    app.current_user_rol() = 'PADRE'
    AND "padreId" = app.current_user_id()::uuid
  );


-- ══════════════════════════════════════════
-- 12. TABLA: "Evento"
-- Recitales, competencias, showcases, ensayos.
-- Padres y maestros ven los eventos activos.
-- ══════════════════════════════════════════

ALTER TABLE "Evento" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
DROP POLICY IF EXISTS "evento_admin_all" ON "Evento";
CREATE POLICY "evento_admin_all"
  ON "Evento" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Padre: lee eventos activos
DROP POLICY IF EXISTS "evento_padre_select" ON "Evento";
CREATE POLICY "evento_padre_select"
  ON "Evento" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'PADRE'
    AND activo = true
  );

-- Maestro: lee eventos activos
DROP POLICY IF EXISTS "evento_maestro_select" ON "Evento";
CREATE POLICY "evento_maestro_select"
  ON "Evento" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND activo = true
  );


-- ══════════════════════════════════════════
-- 13. TABLA: "EventoGrupo"
-- Pivot evento ↔ clase. Lectura pública para roles autenticados.
-- ══════════════════════════════════════════

ALTER TABLE "EventoGrupo" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
DROP POLICY IF EXISTS "evento_grupo_admin_all" ON "EventoGrupo";
CREATE POLICY "evento_grupo_admin_all"
  ON "EventoGrupo" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Todos los roles autenticados: pueden leer (para ver qué clases participan)
DROP POLICY IF EXISTS "evento_grupo_authenticated_select" ON "EventoGrupo";
CREATE POLICY "evento_grupo_authenticated_select"
  ON "EventoGrupo" AS PERMISSIVE FOR SELECT
  USING (app.current_user_id() IS NOT NULL);


-- ══════════════════════════════════════════
-- 14. TABLA: "Clase"
-- Horario y cupo de cada clase. Maestro gestiona sus clases.
-- ══════════════════════════════════════════

ALTER TABLE "Clase" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
DROP POLICY IF EXISTS "clase_admin_all" ON "Clase";
CREATE POLICY "clase_admin_all"
  ON "Clase" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Recepcionista: lee clases para el wizard de inscripción
DROP POLICY IF EXISTS "clase_recepcionista_select" ON "Clase";
CREATE POLICY "clase_recepcionista_select"
  ON "Clase" AS PERMISSIVE FOR SELECT
  USING (app.current_user_rol() = 'RECEPCIONISTA');

-- Maestro: lee y actualiza solo sus propias clases
DROP POLICY IF EXISTS "clase_maestro_select" ON "Clase";
CREATE POLICY "clase_maestro_select"
  ON "Clase" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND "profesorId" = app.current_user_id()::uuid
  );

DROP POLICY IF EXISTS "clase_maestro_update" ON "Clase";
CREATE POLICY "clase_maestro_update"
  ON "Clase" AS PERMISSIVE FOR UPDATE
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND "profesorId" = app.current_user_id()::uuid
  )
  WITH CHECK (
    app.current_user_rol() = 'MAESTRO'
    AND "profesorId" = app.current_user_id()::uuid
  );

-- Padre: lee las clases en las que están inscritas sus hijas
DROP POLICY IF EXISTS "clase_padre_select" ON "Clase";
CREATE POLICY "clase_padre_select"
  ON "Clase" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'PADRE'
    AND EXISTS (
      SELECT 1
      FROM   "AlumnaClase" ac
      JOIN   "Alumna" a ON a.id = ac."alumnaId"
      WHERE  ac."claseId" = "Clase".id
        AND  a."padreId" = app.current_user_id()::uuid
    )
  );


-- ══════════════════════════════════════════
-- 15. TABLA: "AlumnaClase"
-- Pivot inscripción: alumna ↔ clase/grupo.
-- claseId puede ser NULL (inscripción nueva via wizard).
-- ══════════════════════════════════════════

ALTER TABLE "AlumnaClase" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
DROP POLICY IF EXISTS "alumna_clase_admin_all" ON "AlumnaClase";
CREATE POLICY "alumna_clase_admin_all"
  ON "AlumnaClase" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Recepcionista: puede crear inscripciones y leerlas
DROP POLICY IF EXISTS "alumna_clase_recepcionista_insert" ON "AlumnaClase";
CREATE POLICY "alumna_clase_recepcionista_insert"
  ON "AlumnaClase" AS PERMISSIVE FOR INSERT
  WITH CHECK (app.current_user_rol() = 'RECEPCIONISTA');

DROP POLICY IF EXISTS "alumna_clase_recepcionista_select" ON "AlumnaClase";
CREATE POLICY "alumna_clase_recepcionista_select"
  ON "AlumnaClase" AS PERMISSIVE FOR SELECT
  USING (app.current_user_rol() = 'RECEPCIONISTA');

-- Maestro: lee inscripciones de sus clases o grupos
DROP POLICY IF EXISTS "alumna_clase_maestro_select" ON "AlumnaClase";
CREATE POLICY "alumna_clase_maestro_select"
  ON "AlumnaClase" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND (
      EXISTS (
        SELECT 1 FROM "Clase" c
        WHERE c.id = "AlumnaClase"."claseId"
          AND c."profesorId" = app.current_user_id()::uuid
      )
      OR EXISTS (
        SELECT 1 FROM "Grupo" g
        WHERE g.id = "AlumnaClase"."grupoId"
          AND g."profesorId" = app.current_user_id()::uuid
      )
    )
  );

-- Padre: lee inscripciones de sus propias hijas
DROP POLICY IF EXISTS "alumna_clase_padre_select" ON "AlumnaClase";
CREATE POLICY "alumna_clase_padre_select"
  ON "AlumnaClase" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'PADRE'
    AND EXISTS (
      SELECT 1 FROM "Alumna" a
      WHERE a.id = "AlumnaClase"."alumnaId"
        AND a."padreId" = app.current_user_id()::uuid
    )
  );


-- ══════════════════════════════════════════
-- 16. TABLA: "Profesor"
-- Perfil de tarifa y especialidades del maestro.
-- Solo admin y el propio maestro tienen acceso.
-- ══════════════════════════════════════════

ALTER TABLE "Profesor" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total (gestiona tarifas y nómina)
DROP POLICY IF EXISTS "profesor_admin_all" ON "Profesor";
CREATE POLICY "profesor_admin_all"
  ON "Profesor" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Maestro: lee y actualiza su propio perfil
DROP POLICY IF EXISTS "profesor_self_select" ON "Profesor";
CREATE POLICY "profesor_self_select"
  ON "Profesor" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND "usuarioId" = app.current_user_id()::uuid
  );

DROP POLICY IF EXISTS "profesor_self_update" ON "Profesor";
CREATE POLICY "profesor_self_update"
  ON "Profesor" AS PERMISSIVE FOR UPDATE
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND "usuarioId" = app.current_user_id()::uuid
  )
  WITH CHECK (
    app.current_user_rol() = 'MAESTRO'
    AND "usuarioId" = app.current_user_id()::uuid
  );

-- Recepcionista: lee perfiles de profesores para asignaciones en inscripciones
DROP POLICY IF EXISTS "profesor_recepcionista_select" ON "Profesor";
CREATE POLICY "profesor_recepcionista_select"
  ON "Profesor" AS PERMISSIVE FOR SELECT
  USING (app.current_user_rol() = 'RECEPCIONISTA');


-- ══════════════════════════════════════════
-- 17. TABLA: "Paquete"
-- Catálogo de paquetes mensuales. Solo admin modifica.
-- ══════════════════════════════════════════

ALTER TABLE "Paquete" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
DROP POLICY IF EXISTS "paquete_admin_all" ON "Paquete";
CREATE POLICY "paquete_admin_all"
  ON "Paquete" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Recepcionista: lee para wizard de inscripción
DROP POLICY IF EXISTS "paquete_recepcionista_select" ON "Paquete";
CREATE POLICY "paquete_recepcionista_select"
  ON "Paquete" AS PERMISSIVE FOR SELECT
  USING (app.current_user_rol() = 'RECEPCIONISTA');

-- Padre: lee paquetes activos (para informarse de precios)
DROP POLICY IF EXISTS "paquete_padre_select" ON "Paquete";
CREATE POLICY "paquete_padre_select"
  ON "Paquete" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'PADRE'
    AND activo = true
  );


-- ══════════════════════════════════════════
-- 18. TABLA: "ClasePrivada"
-- El maestro ve sus clases privadas agendadas.
-- El padre ve las clases privadas de sus hijas.
-- ══════════════════════════════════════════

ALTER TABLE "ClasePrivada" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
DROP POLICY IF EXISTS "clase_privada_admin_all" ON "ClasePrivada";
CREATE POLICY "clase_privada_admin_all"
  ON "ClasePrivada" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Maestro: lee sus clases privadas (via Profesor.usuarioId → profesorId)
DROP POLICY IF EXISTS "clase_privada_maestro_select" ON "ClasePrivada";
CREATE POLICY "clase_privada_maestro_select"
  ON "ClasePrivada" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND EXISTS (
      SELECT 1 FROM "Profesor" p
      WHERE p.id = "ClasePrivada"."profesorId"
        AND p."usuarioId" = app.current_user_id()::uuid
    )
  );

-- Padre: lee clases privadas de sus hijas y puede agendar (INSERT)
DROP POLICY IF EXISTS "clase_privada_padre_select" ON "ClasePrivada";
CREATE POLICY "clase_privada_padre_select"
  ON "ClasePrivada" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'PADRE'
    AND EXISTS (
      SELECT 1 FROM "Alumna" a
      WHERE a.id = "ClasePrivada"."alumnaId"
        AND a."padreId" = app.current_user_id()::uuid
    )
  );

DROP POLICY IF EXISTS "clase_privada_padre_insert" ON "ClasePrivada";
CREATE POLICY "clase_privada_padre_insert"
  ON "ClasePrivada" AS PERMISSIVE FOR INSERT
  WITH CHECK (
    app.current_user_rol() = 'PADRE'
    AND EXISTS (
      SELECT 1 FROM "Alumna" a
      WHERE a.id = "ClasePrivada"."alumnaId"
        AND a."padreId" = app.current_user_id()::uuid
    )
  );


-- ══════════════════════════════════════════
-- 19. TABLA: "Concepto"
-- Catálogo de conceptos de cobro. Solo admin modifica.
-- Recepcionista necesita leerlo para registrar cargos.
-- ══════════════════════════════════════════

ALTER TABLE "Concepto" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
DROP POLICY IF EXISTS "concepto_admin_all" ON "Concepto";
CREATE POLICY "concepto_admin_all"
  ON "Concepto" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Recepcionista: lee conceptos para registrar cargos
DROP POLICY IF EXISTS "concepto_recepcionista_select" ON "Concepto";
CREATE POLICY "concepto_recepcionista_select"
  ON "Concepto" AS PERMISSIVE FOR SELECT
  USING (app.current_user_rol() = 'RECEPCIONISTA');


-- ══════════════════════════════════════════
-- 20. TABLA: "Configuracion"
-- Parámetros del sistema (dia_corte_global, umbral_faltas, etc.)
-- Solo admin modifica. Todos los roles necesitan leer para operar.
-- ══════════════════════════════════════════

ALTER TABLE "Configuracion" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
DROP POLICY IF EXISTS "configuracion_admin_all" ON "Configuracion";
CREATE POLICY "configuracion_admin_all"
  ON "Configuracion" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Todos los roles autenticados: lectura de configuración del sistema
DROP POLICY IF EXISTS "configuracion_authenticated_select" ON "Configuracion";
CREATE POLICY "configuracion_authenticated_select"
  ON "Configuracion" AS PERMISSIVE FOR SELECT
  USING (app.current_user_id() IS NOT NULL);


-- ══════════════════════════════════════════
-- 21. TABLA: "Grupo"  (módulo inscripciones)
-- Unidad comercial de inscripción (Senior Full, Tiny Full, etc.)
-- ══════════════════════════════════════════

ALTER TABLE "Grupo" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total (CRUD de grupos, cupos, horarios)
DROP POLICY IF EXISTS "grupo_admin_all" ON "Grupo";
CREATE POLICY "grupo_admin_all"
  ON "Grupo" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Recepcionista: lee grupos activos para el wizard de inscripción
DROP POLICY IF EXISTS "grupo_recepcionista_select" ON "Grupo";
CREATE POLICY "grupo_recepcionista_select"
  ON "Grupo" AS PERMISSIVE FOR SELECT
  USING (app.current_user_rol() = 'RECEPCIONISTA');

-- Maestro: lee sus propios grupos
DROP POLICY IF EXISTS "grupo_maestro_select" ON "Grupo";
CREATE POLICY "grupo_maestro_select"
  ON "Grupo" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'MAESTRO'
    AND "profesorId" = app.current_user_id()::uuid
  );

-- Padre: lee grupos activos (para ver en qué grupo está su hija inscrita)
DROP POLICY IF EXISTS "grupo_padre_select" ON "Grupo";
CREATE POLICY "grupo_padre_select"
  ON "Grupo" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'PADRE'
    AND activo = true
  );


-- ══════════════════════════════════════════
-- 22. TABLA: "Disciplina"  (módulo inscripciones)
-- Catálogo de disciplinas: Ballet, Hip-Hop, Tap, Jazz, Acro…
-- Es información pública para todos los roles. Solo admin modifica.
-- ══════════════════════════════════════════

ALTER TABLE "Disciplina" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
DROP POLICY IF EXISTS "disciplina_admin_all" ON "Disciplina";
CREATE POLICY "disciplina_admin_all"
  ON "Disciplina" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Todos los roles autenticados: lectura del catálogo
DROP POLICY IF EXISTS "disciplina_authenticated_select" ON "Disciplina";
CREATE POLICY "disciplina_authenticated_select"
  ON "Disciplina" AS PERMISSIVE FOR SELECT
  USING (app.current_user_id() IS NOT NULL);


-- ══════════════════════════════════════════
-- 23. TABLA: "GrupoDisciplina"  (módulo inscripciones)
-- Pivot grupo ↔ disciplina. Lectura pública para todos los roles.
-- ══════════════════════════════════════════

ALTER TABLE "GrupoDisciplina" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
DROP POLICY IF EXISTS "grupo_disciplina_admin_all" ON "GrupoDisciplina";
CREATE POLICY "grupo_disciplina_admin_all"
  ON "GrupoDisciplina" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Todos los roles autenticados: lectura
DROP POLICY IF EXISTS "grupo_disciplina_authenticated_select" ON "GrupoDisciplina";
CREATE POLICY "grupo_disciplina_authenticated_select"
  ON "GrupoDisciplina" AS PERMISSIVE FOR SELECT
  USING (app.current_user_id() IS NOT NULL);


-- ══════════════════════════════════════════
-- 24. TABLA: "TarifaMensualidad"  (módulo inscripciones)
-- 1 tarifa por grupo. Admin la define. Recepcionista y padre la leen.
-- ══════════════════════════════════════════

ALTER TABLE "TarifaMensualidad" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
DROP POLICY IF EXISTS "tarifa_admin_all" ON "TarifaMensualidad";
CREATE POLICY "tarifa_admin_all"
  ON "TarifaMensualidad" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Recepcionista: lee tarifas para calcular el costo en el wizard
DROP POLICY IF EXISTS "tarifa_recepcionista_select" ON "TarifaMensualidad";
CREATE POLICY "tarifa_recepcionista_select"
  ON "TarifaMensualidad" AS PERMISSIVE FOR SELECT
  USING (app.current_user_rol() = 'RECEPCIONISTA');

-- Padre: lee tarifas activas (transparencia de precios)
DROP POLICY IF EXISTS "tarifa_padre_select" ON "TarifaMensualidad";
CREATE POLICY "tarifa_padre_select"
  ON "TarifaMensualidad" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'PADRE'
    AND activo = true
  );


-- ══════════════════════════════════════════════════════════════
-- 25. TABLA: "AplicacionPago"
-- Tabla pivote entre Pago y Cargo (pagos parciales).
-- El padre puede ver qué pagos cubrieron sus cargos.
-- Solo Admin y Recepcionista pueden crear/modificar registros.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE "AplicacionPago" ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
DROP POLICY IF EXISTS "aplicacion_admin_all" ON "AplicacionPago";
CREATE POLICY "aplicacion_admin_all"
  ON "AplicacionPago" AS PERMISSIVE FOR ALL
  USING      (app.current_user_rol() = 'ADMIN')
  WITH CHECK (app.current_user_rol() = 'ADMIN');

-- Recepcionista: crea y lee aplicaciones (registra cobros en caja)
DROP POLICY IF EXISTS "aplicacion_recepcionista_insert" ON "AplicacionPago";
CREATE POLICY "aplicacion_recepcionista_insert"
  ON "AplicacionPago" AS PERMISSIVE FOR INSERT
  WITH CHECK (app.current_user_rol() = 'RECEPCIONISTA');

DROP POLICY IF EXISTS "aplicacion_recepcionista_select" ON "AplicacionPago";
CREATE POLICY "aplicacion_recepcionista_select"
  ON "AplicacionPago" AS PERMISSIVE FOR SELECT
  USING (app.current_user_rol() = 'RECEPCIONISTA');

-- Padre: solo lee las aplicaciones de SUS propios cargos
-- (transparencia: puede ver qué pagos cubrieron cada cargo de sus hijas)
DROP POLICY IF EXISTS "aplicacion_padre_select" ON "AplicacionPago";
CREATE POLICY "aplicacion_padre_select"
  ON "AplicacionPago" AS PERMISSIVE FOR SELECT
  USING (
    app.current_user_rol() = 'PADRE'
    AND EXISTS (
      SELECT 1
      FROM   "Cargo" c
      WHERE  c.id = "AplicacionPago"."cargoId"
        AND  c."padreId" = app.current_user_id()::uuid
    )
  );


-- ══════════════════════════════════════════════════════════════
-- PASO FINAL: Activar BYPASSRLS
-- ══════════════════════════════════════════════════════════════
-- Por defecto el usuario postgres tiene BYPASSRLS en Supabase,
-- lo que significa que las políticas RLS no aplican a Prisma.
-- Para activarlas hay que remover ese privilegio.
--
-- ⚠️  ADVERTENCIA: Este comando NO puede ejecutarse vía pooler.
--     Debe correrse en:
--     Supabase Dashboard → SQL Editor → pegar y ejecutar:
--
--     ALTER ROLE postgres NOBYPASSRLS;
--
-- ✅ Todas las API routes usan withRLS() — es seguro activarlo.
--
-- Para revertir si algo falla:
-- ALTER ROLE postgres BYPASSRLS;
