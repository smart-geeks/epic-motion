-- =============================================================================
-- triggers_financieros.sql
-- Autómata de estados para el Motor de Cobros de Epic Motion.
--
-- Propósito:
--   Mantener el campo `estado` y `fechaPago` de la tabla `Cargo` sincronizados
--   automáticamente cada vez que se inserta, actualiza o elimina una fila en
--   `AplicacionPago`.
--
-- Lógica:
--   - Suma `montoAplicado` de todas las `AplicacionPago` para el cargo afectado.
--   - Si la suma >= `montoFinal` del Cargo  → estado = 'PAGADO',  fechaPago = NOW()
--   - Si la suma <  `montoFinal` (o = 0)    → estado = 'PENDIENTE', fechaPago = NULL
--
-- Cómo aplicar:
--   Ejecutar este archivo una sola vez contra la base de datos de Supabase
--   (es idempotente: usa CREATE OR REPLACE + DROP TRIGGER IF EXISTS).
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCIÓN: fn_sincronizar_estado_cargo
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_sincronizar_estado_cargo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_cargo_id        UUID;
  v_total_pagado    NUMERIC(10, 2);
  v_monto_final     NUMERIC(10, 2);
BEGIN
  -- ── 1. Determinar qué cargoId fue afectado ──────────────────────────────────
  -- En DELETE, NEW no existe → usar OLD. En INSERT/UPDATE → usar NEW.
  IF TG_OP = 'DELETE' THEN
    v_cargo_id := OLD."cargoId";
  ELSE
    v_cargo_id := NEW."cargoId";
  END IF;

  -- ── 2. Sumar el total ya aplicado a ese cargo ───────────────────────────────
  -- COALESCE maneja el caso en que no haya ninguna AplicacionPago restante
  -- (ej. se borró la única fila), devolviendo 0 en vez de NULL.
  SELECT COALESCE(SUM("montoAplicado"), 0)
    INTO v_total_pagado
    FROM "AplicacionPago"
   WHERE "cargoId" = v_cargo_id;

  -- ── 3. Obtener el monto que el padre debe realmente pagar ───────────────────
  SELECT "montoFinal"
    INTO v_monto_final
    FROM "Cargo"
   WHERE id = v_cargo_id;

  -- Si el cargo ya no existe (borrado en cascada u otro trigger), salir sin error.
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- ── 4. Actualizar el estado del Cargo según la comparación ─────────────────
  IF v_total_pagado >= v_monto_final THEN
    -- Cargo cubierto total o parcialmente (prepago/beca que llevó el saldo a cero)
    UPDATE "Cargo"
       SET estado      = 'PAGADO',
           "fechaPago" = NOW()
     WHERE id = v_cargo_id;
  ELSE
    -- Pago revertido, borrado o incompleto → vuelve a PENDIENTE
    UPDATE "Cargo"
       SET estado      = 'PENDIENTE',
           "fechaPago" = NULL
     WHERE id = v_cargo_id;
  END IF;

  -- Los triggers AFTER no necesitan retornar la fila modificada;
  -- retornamos NULL para indicar que no hay fila nueva que propagar.
  RETURN NULL;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: trg_sincronizar_estado_cargo
-- Se adhiere a AplicacionPago y dispara la función tras cada cambio.
-- DROP IF EXISTS garantiza idempotencia: re-ejecutar este archivo es seguro.
-- ─────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_sincronizar_estado_cargo ON "AplicacionPago";

CREATE TRIGGER trg_sincronizar_estado_cargo
  AFTER INSERT OR UPDATE OR DELETE
  ON "AplicacionPago"
  FOR EACH ROW
  EXECUTE FUNCTION fn_sincronizar_estado_cargo();
