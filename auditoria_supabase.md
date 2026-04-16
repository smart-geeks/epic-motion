# Reporte de Auditoría Arquitectónica y Base de Datos (PostgreSQL/Supabase)

Como Arquitecto de Software Experto y DBA, he evaluado el modelo propuesto en `schema.prisma`. Tu esquema actual establece una base lógica sólida para la operatividad de la academia, pero si pretendes delegar el peso operativo y de seguridad a Supabase (como BaaS) junto a Next.js (App Router), existen ciertos elementos estructurales que **debes** blindar para evitar cuellos de botella e inconsistencias financieras.

A continuación, los hallazgos y recomendaciones técnicas agrupados por tus 4 criterios:

---

## 1. Revisión de Normalización y Escalabilidad Financiera

El modelo es relacional y limpio, pero la gestión financiera (`Cargo`, `Pago`, `Concepto`) asume escenarios "felices" que rara vez ocurren en la vida real.

**Riesgos Encontrados:**
1. **Ausencia de Pagos Parciales (Abonos):** 
   En `Cargo`, declaras `pagoId String?`. Esto asume que 1 Cargo es liquidado por exactamente 1 Pago (o viceversa temporalmente a través de Supabase). ¿Qué pasa si una colegiatura es de $1,000, pero el papá abona primero $500 y luego otros $500? Tu esquema actual no lo soporta sin romper registros.
   * **Solución SQL:** Eliminar `pagoId` de `Cargo` y crear una tabla pivote `PagoDetalle` o `AplicacionPago`(`id`, `cargoId`, `pagoId`, `montoAplicado`). Así un Cargo puede sumar aplicaciones de varios Pagos.
2. **Campos sin Integridad Referencial (`Nota.aprobadaPor`):**
   Dejaste `aprobadaPor String?` con un comentario "sin FK". Evita esto en bases de datos maduras. Los "Ghost Records" destrozan BI (Business Intelligence). Configura la Foreign Key, pero con `ON DELETE SET NULL` para no perder la bitácora si das de baja al Admin.
3. **Array Strings (`Asistencia.uniformeMotivo`):**
   Manejar un `String[]` para la ausencia de partes del uniforme afectará los queries de "Top 3 faltas de uniforme". Usa la estructura pero considera que perderás algo de análisis relacional rápido.

---

## 2. Seguridad en Supabase (Row Level Security - RLS)

En una arquitectura Next.js (App Router) + Supabase, el RLS no es "opcional"; es la única muralla entre tu base de datos y ataques que clonen tokens JWT limitados.

Debes aplicar `ALTER TABLE tabla ENABLE ROW LEVEL SECURITY;` a todo, y priorizar políticas para:

**Alumnas (`Alumna`):**
```sql
-- Papás solo ven a SUS hijas
CREATE POLICY "Padres ven sus alumnas" 
ON public.Alumna FOR SELECT 
USING (padreId = auth.uid());

-- Personal interno ve todo
CREATE POLICY "Empleados ven todo" 
ON public.Alumna FOR SELECT 
USING ( (SELECT rol FROM public.Usuario WHERE id = auth.uid()) IN ('ADMIN', 'RECEPCIONISTA', 'MAESTRO') );
```

**Cargos y Pagos (`Cargo`, `Pago`):**
```sql
-- Los papás ven su deuda, sin modificarla
CREATE POLICY "Visibilidad de Deuda Padre" 
ON public.Cargo FOR SELECT 
USING (padreId = auth.uid());

-- Recepción administra dinero
CREATE POLICY "Gestion Cajeros" 
ON public.Cargo FOR ALL
USING ( (SELECT rol FROM public.Usuario WHERE id = auth.uid()) IN ('ADMIN', 'RECEPCIONISTA') );
```

> **🔥 Pro-Tip de Arquitectura:** Consultar recurrentemente `public.Usuario` en los USING() de RLS empeora el rendimiento. La mejor práctica en Supabase es que el trigger `handle_new_user` inyecte el **ROL** directamente en los `app_metadata` o `user_metadata` del JWT del login. Así tus políticas se simplifican a:
> `USING (auth.jwt() ->> 'rol' = 'ADMIN')` sin usar JOINs a la base.

---

## 3. Triggers & Constraints Recomendados

Dejar la integridad al framework Frontend (Next.js Server Actions) es una mala práctica. Crea estos componentes nativos en PostgreSQL:

1. **Trigger `handle_new_user`:**
   Atado a la tabla `auth.users` de Supabase para replicar a `public.Usuario`.
2. **Restricción Matemática (`CHECK`) de Cargos:**
   `ALTER TABLE "Cargo" ADD CONSTRAINT "chk_cargo_positivo" CHECK ("montoFinal" >= 0);`
   `ALTER TABLE "Cargo" ADD CONSTRAINT "chk_descuento_logico" CHECK ("montoOriginal" - "descuento" = "montoFinal");`
3. **Trigger de Actualización de Estado (Estados Automáticos):**
   Cuando la suma de cobros recibidos (`PagoDetalle`) iguala al `montoFinal` del `Cargo`, un trigger en base de datos debe inminentemente actualizar `estado = 'PAGADO'` y rellenar `fechaPago`. El servidor Node.js (Next) nunca debería encargarse de establecer esto a pagado, previniendo errores de red o carrera cíclica (*Race conditions*).

---

## 4. Diseño para Casos de Uso Críticos y Alta Concurrencia

### A) La generación masiva de colegiaturas (Día 1 de cada mes)
* **Error Común:** Hacer un `.map()` en Next.js llamando a Prisma `prisma.cargo.create(...)` unas 500 veces. Esto agota las conexiones y causa timeouts.
* **Solución Arquitectónica:** Escribir una función PL/pgSQL nativa en Supabase (`fn_generar_mensualidades(mes, anio)`). Dicha función hace un simple `INSERT INTO Cargo (...) SELECT ... FROM AlumnaClase WHERE activa=true`.
  - Puedes ejecutar esta función de la Base de Datos remotamente (`supabase.rpc('fn_generar_mensualidades')`) en milisegundos, o incluso automatizarla en la DB con `pg_cron`.

### B) Registro de Pagos Automáticos (Tarjetas/Transferencias) con Recibos
* **Problema:** Si integras pasarelas como Stripe o Webhooks bancarios, un problema de red puede enviar el evento de "Pago completado" dos veces en menos de un segundo, creando doble saldo a favor.
* **Solución Arquitectónica:** La tabla `Pago` **DEBE** tener una columna `referenciaExternaId` (e.j., el ID de Stripe) impuesta como `UNIQUE`. 
  - Al insertar, debes utilizar un método transaccional o un `ON CONFLICT (referenciaExternaId) DO NOTHING` de SQL. 
  - Esto garantiza **Idempotencia**. Puedes procesar el recibo 10 veces, y la base de datos de forma impecable garantizará que solo cobre una.
