# CLAUDE.md — Epic Motion High Performance Dance Studio

## ¿Qué es este proyecto?

Aplicación web (PWA) para **Epic Motion High Performance Dance Studio**, academia de danza en Torreón, Coahuila, México. Dirigida por Luz María Herrera. Estilos: Ballet, Hip-hop y Contemporáneo.

La app gestiona la operación completa: alumnos, asistencia, cobranza, comunicación con padres, horarios, eventos, gamificación privada y pago a profesores. La landing page pública y la app viven en el mismo proyecto bajo el mismo dominio (epicmotion.com).

## Stack técnico

| Componente | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript (estricto) |
| Estilos | Tailwind CSS |
| Animaciones | GSAP (ScrollTrigger, CustomEase, useGSAP) |
| ORM | Prisma 7 (driver adapter: @prisma/adapter-pg) |
| Base de datos | PostgreSQL (Supabase) |
| Autenticación | NextAuth.js con RBAC |
| Estado global | Zustand |
| Iconos | Lucide React |
| Toasts | Sonner |
| Storage | Supabase Storage (comprobantes, PDFs, imágenes) |
| Email | SendGrid o Mailgun |
| PDF | React-PDF o @react-pdf/renderer |
| Deploy | Vercel |

## Estructura de carpetas (estado actual)

Solo se listan archivos que **realmente existen**. Los pendientes se marcan con `# pendiente`.

```
epic-motion/
├── CLAUDE.md
├── PROYECTO.md
├── middleware.ts                    # CORS + RBAC (protección de rutas por rol)
├── next.config.mjs                  # Security headers (HSTS, CSP, X-Frame-Options…)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── prisma/
│   ├── schema.prisma                # Schema completo — 21 tablas, UUIDs, Decimal
│   └── seed.ts                      # Datos de prueba (findOrCreate, UUID-compatible)
├── supabase/
│   └── rls.sql                      # Políticas Row Level Security (5 tablas)
├── public/
│   ├── images/
│   │   ├── hero-dancer-desktop.webp/jpg
│   │   ├── ballet.webp/jpg
│   │   ├── hiphop.webp/jpg
│   │   ├── contemporaneo.webp/jpg
│   │   ├── gallery-1..4.webp/jpg
│   │   └── studio.webp/jpg
│   ├── logo.png                     # Logo dark mode
│   ├── logo-light.png               # Logo light mode
│   └── favicon.png
├── app/
│   ├── layout.tsx                   # Layout raíz (fuentes, providers, metadata)
│   ├── page.tsx                     # Landing page pública (ruta /)
│   ├── globals.css
│   ├── providers.tsx                # SessionProvider de NextAuth
│   ├── login/
│   │   └── page.tsx                 # Login para todos los roles
│   ├── (admin)/
│   │   ├── layout.tsx               # Sidebar admin (desktop) + topbar móvil
│   │   └── admin/
│   │       └── dashboard/
│   │           └── page.tsx         # Resumen del día (métricas en cards)
│   │       # usuarios/      → pendiente
│   │       # alumnas/       → pendiente
│   │       # grupos/        → pendiente
│   │       # inscripciones/ → pendiente
│   │       # cobranza/      → pendiente
│   │       # nomina/        → pendiente
│   │       # noticias/      → pendiente
│   │       # eventos/       → pendiente
│   │       # configuracion/ → pendiente
│   │       # reportes/      → pendiente
│   ├── (maestro)/
│   │   ├── layout.tsx               # Bottom nav maestro
│   │   └── maestro/
│   │       └── agenda/
│   │           └── page.tsx         # Clases del día/semana
│   │       # asistencia/ → pendiente
│   │       # notas/      → pendiente
│   │       # privadas/   → pendiente
│   ├── (padre)/
│   │   ├── layout.tsx               # Bottom nav padre
│   │   └── padre/
│   │       └── home/
│   │           └── page.tsx         # Noticias + notas de hijas
│   │       # hijas/          → pendiente
│   │       # pagos/          → pendiente
│   │       # eventos/        → pendiente
│   │       # notificaciones/ → pendiente
│   └── api/
│       └── auth/[...nextauth]/
│           └── route.ts             # NextAuth handler
│       # usuarios/    → pendiente
│       # alumnas/     → pendiente
│       # asistencias/ → pendiente
│       # notas/       → pendiente
│       # pagos/       → pendiente
│       # eventos/     → pendiente
│       # noticias/    → pendiente
│       # nomina/      → pendiente
│       # gamificacion/→ pendiente
├── components/
│   └── landing/                     # Todos implementados ✅
│       ├── Navbar.tsx
│       ├── Hero.tsx
│       ├── ValoresCards.tsx
│       ├── EstilosGrid.tsx
│       ├── Nosotros.tsx
│       ├── GaleriaTikTok.tsx
│       ├── CTASection.tsx
│       ├── LoginModal.tsx
│       └── Footer.tsx
│   # ui/     → pendiente (Button, Card, Modal, Badge, Input, Select, Table…)
│   # layout/ → pendiente (AdminSidebar, BottomNav, TopBar)
│   # shared/ → pendiente (StudentCard, AttendanceButton, NotaCard…)
├── lib/
│   ├── auth.ts                      # Configuración NextAuth + RBAC + JWT callbacks
│   ├── prisma.ts                    # Cliente Prisma singleton
│   ├── prisma-rls.ts                # withRLS() / withAdminRLS() para inyectar sesión a RLS
│   └── actions/
│       └── inscripcion.ts           # Server action de inscripción
│   # utils.ts    → pendiente
│   # constants.ts→ pendiente
├── types/
│   └── next-auth.d.ts               # Extensión de tipos de NextAuth (id, rol, nombre, avatar)
│   # models.ts → pendiente
└── # hooks/  → pendiente (useAuth, useTheme, useNotifications)
  # stores/ → pendiente (Zustand store)
```

## Paleta de colores

### Dark mode (default)

```
Fondo principal:    #0A0A0A   (negro profundo)
Texto principal:    #FFFFFF   (blanco)
Acento dorado:      #C9A227   (dorado Epic Motion)
Texto secundario:   #CCCCCC   (plata)
Superficies:        #2A2A2A   (gris oscuro)
Superficies hover:  #4A4A4A   (gris medio)
Overlay:            rgba(10, 10, 10, 0.7)
```

### Light mode

```
Fondo principal:    #FFFFFF
Texto principal:    #0A0A0A
Acento:             #000000   (negro, sin dorado en light)
Texto secundario:   #666666
Superficies:        #F5F5F5
Superficies hover:  #E8E8E8
```

### Tailwind config

```typescript
colors: {
  epic: {
    black: '#0A0A0A',
    gold: '#C9A227',
    silver: '#CCCCCC',
    gray: '#2A2A2A',
    'gray-light': '#4A4A4A',
  }
}
```

## Tipografías

```
Montserrat         — Títulos, marca "EPIC MOTION", headings
  Weights: 300 (light), 700 (bold), 800 (extrabold)

Inter              — Body text, navegación, formularios, tablas
  Weights: 400, 500, 600

Cormorant Garamond — Acentos elegantes (opcional, peso 600)
```

Cargadas desde Google Fonts en `app/layout.tsx` con `next/font/google`.

## Roles del sistema (4 activos)

| Rol | Acceso |
|---|---|
| **ADMIN** | Acceso total. CRUD usuarios, alertas, cobranza, nómina, noticias, eventos, reportes. Operado por Luz y su esposo. |
| **MAESTRO** | Agenda de clases, toma de asistencia + uniforme, notas rutinarias y extraordinarias, clases privadas. |
| **PADRE** | Home con noticias + notas de hijas, gamificación privada, estado de cuenta, eventos, agendar clases privadas. |
| **RECEPCIONISTA** | Registrar pagos en efectivo, gestionar inscripciones. |

**IMPORTANTE**: NO hay panel de estudiantes. Las alumnas son menores de edad; todo se gestiona a través de las cuentas de los padres.

## Reglas de negocio críticas

### Asistencia

- Un click: Presente, Tarde, Ausente.
- Botón extra de uniforme: popup con check de zapato, tocado, tutú.
- Uniforme incompleto → notificación automática al padre.
- Faltas consecutivas: rango configurable por admin (3-6), disparan alerta al padre.
- PRIORIDAD: minimizar clicks. El maestro debe pasar lista rápido.

### Check-in del profesor

- La clase se considera "iniciada" cuando el maestro marca la primera asistencia.
- Si no hay check-in en X minutos (configurable en `Configuracion`), se marca como retraso/no iniciada → notifica al admin.

### Notas y pautas

- Notas rutinarias: evaluación por clase.
- Notas extraordinarias: retroalimentación especial.
- Flujo: maestro escribe → admin revisa/aprueba → se publica al padre.

### Gamificación (PRIVADA)

- Cada padre solo ve el progreso de sus propias hijas. SIN rankings públicos.
- El admin tiene vista global.
- Puntos por: asistencia, puntualidad, uniforme completo, notas positivas.

### Cobranza (Motor de Cobros)

- Catálogo de conceptos (`Concepto`): mensualidad, uniforme, inscripción, clase privada, etc.
- Cargos (`Cargo`): cada cargo tiene `montoOriginal` (del catálogo), `descuento` (default 0) y `montoFinal` = montoOriginal - descuento. El `motivoDescuento` es texto libre.
- Notificaciones WhatsApp: `notificado3Dias` y `notificadoHoy` son flags booleanos que actúan de idempotency guard — evitan reenviar si el admin ya mandó el recordatorio manualmente o si n8n ya lo procesó.
- Pago en efectivo en la academia (registro manual por admin/recepcionista).
- Un `Pago` puede cubrir N `Cargos` (mensualidad + uniforme en una transacción).
- Fecha de corte configurable global en `Configuracion.dia_corte_global`.

### Noticias

- Publicadas por admin con imagen, título, texto.
- Padres confirman lectura. Admin ve quién confirmó y quién no.

### Inscripciones

- Al inscribir alumna se crea usuario y contraseña para el padre.
- Se genera PDF de bienvenida.
- Paquetes mensuales con X clases/semana.

### Clases privadas

- Maestro define disponibilidad. Padre agenda con prepago obligatorio (1-2 días anticipación).

## Convenciones de código

### General

- TypeScript estricto (`strict: true`).
- `async/await` siempre, nunca `.then()`.
- Nombres de archivos: `kebab-case` para rutas, `PascalCase` para componentes.
- Comentarios en español.
- Mensajes de commit en español.

### Componentes React

- Functional components con arrow functions.
- Props tipadas con interfaces (no `type`).
- `'use client'` solo cuando sea necesario (preferir Server Components).
- Componentes pequeños y enfocados (< 150 líneas).

### API Routes

- Validar input con Zod.
- Retornar `NextResponse.json()` con status codes apropiados.
- Usar `withRLS(session, tx => ...)` de `lib/prisma-rls.ts` en todas las rutas que accedan a la BD.
- Manejar errores con try/catch y respuestas consistentes.

### Estilos

- Tailwind CSS para todo. No CSS custom excepto en `globals.css`.
- Dark mode con prefix `dark:`.
- Mobile-first.
- Usar clases `epic-*` para colores de marca.

### Base de datos

- Prisma para todo acceso a BD.
- **IDs exclusivamente UUID generados en PostgreSQL:** `@default(dbgenerated("gen_random_uuid()")) @db.Uuid` en todos los modelos. Todas las FK también llevan `@db.Uuid`. NUNCA usar cuid.
- **Flujo de desarrollo:** `prisma db push` (no `prisma migrate dev`).
- Tras cualquier cambio al schema correr `prisma generate` para actualizar el cliente.
- Campos de dinero: siempre `Decimal @db.Decimal(10, 2)`. Nunca `Float`.

## Seguridad

### CORS (`middleware.ts`)

Solo acepta requests desde orígenes autorizados: `epicmotion.com`, `www.epicmotion.com`, `epicmotion.mx`, `www.epicmotion.mx`, `localhost:3000`. Rutas `/api/*` con origen no autorizado → 403 JSON. Preflight OPTIONS → 204 inmediato.

### Security Headers (`next.config.mjs`)

Aplicados a todas las rutas:
- `Strict-Transport-Security` — fuerza HTTPS 2 años
- `Content-Security-Policy` — allowlists para scripts, estilos, fuentes, imágenes, conexiones, iframes
- `X-Frame-Options: SAMEORIGIN` — anti-clickjacking
- `X-Content-Type-Options: nosniff` — anti MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — deshabilita cámara, micrófono, GPS, pagos, USB
- `Cross-Origin-Resource-Policy / Opener-Policy` — anti-Spectre

### Row Level Security (`supabase/rls.sql` + `lib/prisma-rls.ts`)

Este proyecto usa **NextAuth**, no Supabase Auth. Las políticas RLS usan `current_setting('app.current_user_id', true)` y `current_setting('app.current_user_rol', true)` en lugar de `auth.uid()`.

Tablas con RLS activo: `Usuario`, `Alumna`, `Pago`, `Sesion`, `Cargo`.

**Patrón obligatorio en API routes:**
```ts
const session = await getServerSession(authOptions);
const data = await withRLS(session, (tx) => tx.alumna.findMany());
```

Si la sesión es null o no tiene rol → `withRLS` lanza error (fail closed). Nunca ejecutar queries sin RLS en rutas autenticadas.

## Comunicación (WhatsApp)

### MVP (meses 1-2)

Abrir WhatsApp Web con texto dinámico prellenado:
```
https://wa.me/528712044277?text=Hola%20Epic%20Motion...
```

### Mes 3+

Migrar a Meta Cloud API (WhatsApp Business) para envío automático. Los flags `notificado3Dias` y `notificadoHoy` en `Cargo` están diseñados para que n8n los consulte y actualice sin reenviar mensajes duplicados.

## Diseño y UX

### Principios

- **Sobrio, elegante, disciplina** — alineado con la identidad de Epic Motion.
- **Mobile-first** — padres y maestros usan principalmente celular.
- **Minimizar clicks** — especialmente para toma de asistencia.
- **Tarjetas sobre tablas** — en móvil usar cards y popovers.
- **Dark mode es el default** — con toggle para light mode.

### Layout por rol

- **Admin**: Sidebar lateral en desktop, topbar + hamburger en mobile.
- **Maestro**: Bottom nav con 4 tabs (Agenda, Asistencia, Notas, Privadas).
- **Padre**: Bottom nav con 5 tabs (Home, Hijas, Pagos, Eventos, Notificaciones).

### Landing page (ruta /)

1. Hero — "EPIC MOTION" con fondo de bailarina, lema "Consciente · Constante · Correcto"
2. ValoresCards — 3 cards (Consciente, Constante, Correcto) con animaciones GSAP
3. EstilosGrid — Ballet, Hip-hop, Contemporáneo
4. Nosotros — Beneficios con checklist
5. GaleriaTikTok — Videos embebidos
6. CTASection — "Agenda clase de prueba" + redes sociales
7. Footer — Logo, ubicación, copyright
8. Navbar — Botón LOGIN prominente que abre LoginModal

## Modelos de datos (Prisma)

```
Usuario        — id (uuid), email, password (bcrypt), nombre, apellido, telefono?, rol (enum), activo
Alumna         — id, nombre, apellido, fechaNacimiento, estatus (enum), padreId (FK Usuario)
Salon          — id, nombre, descripcion?, capacidad
Clase          — id, nombre, estilo (enum), nivel?, duracion, dias[], horario, cupo, salonId, profesorId
AlumnaClase    — alumnaId + claseId (pivot, unique constraint)
Sesion         — id, fecha, horaInicio, horaFin, estado (enum), checkinAt?, claseId, profesorId
Asistencia     — id, estado (enum), uniforme, uniformeMotivo[], sesionId, alumnaId
Profesor       — id, tarifaHora (Decimal), especialidades[], usuarioId (único)
Pago           — id, importe (Decimal), concepto, fechaVencimiento, fechaPago?, estado, comprobanteUrl?, tipo (enum), alumnaId, padreId
Evento         — id, tipo (enum), titulo, descripcion?, fecha, ubicacion?, cupo?, activo
EventoGrupo    — eventoId + claseId (tabla pivot, PK compuesta)
Noticia        — id, titulo, cuerpo, imagenUrl?, fecha, activa, autorId
LecturaNoticia — noticiaId + padreId (pivot)
Nota           — id, tipo (enum), contenido, estado (enum), alumnaId, maestroId
Logro          — id, tipo, nombre, descripcion, icono?, puntos, fechaDesbloqueo, alumnaId
Notificacion   — id, tipo, titulo, cuerpo?, leida, fecha, usuarioId
Paquete        — id, nombre, clasesPorSemana, precio (Decimal), estilosIncluidos[], activo
ClasePrivada   — id, fecha, hora, duracion, estado (enum), alumnaId, profesorId, prepagoId?
Concepto       — id, nombre, descripcion?, tipo (enum), precioSugerido (Decimal), activo
                 Tipos: MENSUALIDAD, INSCRIPCION, UNIFORME, ENSAYO_SOLO, CLASE_PRIVADA, OTRO
Cargo          — id, montoOriginal (Decimal), descuento (Decimal, default 0), montoFinal (Decimal),
                 motivoDescuento?, fechaVencimiento, fechaPago?, estado (enum),
                 notificado3Dias (bool), notificadoHoy (bool),
                 conceptoId, alumnaId, padreId, pagoId?
Configuracion  — id, clave (unique), valor, descripcion?
                 Claves: umbral_faltas, minutos_checkin, dia_corte_global
```

## Datos de prueba (seed)

```
Admin      → luz@epicmotion.com       / admin123
Maestro    → carolina@epicmotion.com  / maestro123
Maestro    → roberto@epicmotion.com   / maestro123
Padre      → juan@epicmotion.com      / padre123
Padre      → ana@epicmotion.com       / padre123
```

Alumnas: Sofía Pérez (Ballet+Tap), Valentina Pérez (Ballet), María López (Jazz+Acro).

## Roadmap

```
Semana 0  → Landing page ✅
Mes 1     → Auth + RBAC ✅ | Panel admin + Grupos/horarios + Inscripciones + PDF
Mes 2     → Asistencia + Check-in + Panel maestros + Notas + Panel padres + Cobranza + Nómina
Mes 3     → Gamificación + Notificaciones (push + WhatsApp API) + Eventos + Noticias + Clases privadas
Mes 4     → Testing + PWA + Reportes + Onboarding datos reales + Deploy producción
```

## Contacto de la academia

- **Clienta**: Luz María Herrera
- **Teléfono**: (871) 204-4277
- **Instagram**: @epicmotiondancestudio
- **TikTok**: @epicmotionds
- **Ubicación**: Torreón, Coahuila, México
- **Dominios**: epicmotion.com / epicmotion.mx
