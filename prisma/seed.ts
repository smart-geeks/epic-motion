import "dotenv/config";
import { PrismaClient, Rol, EstatusAlumna, EstiloClase } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Helper: busca por nombre, crea si no existe
async function findOrCreate<T>(
  findFn: () => Promise<T | null>,
  createFn: () => Promise<T>
): Promise<T> {
  return (await findFn()) ?? (await createFn());
}

async function main() {
  console.log("🌱 Iniciando seed de Epic Motion...");

  // ─────────────────────────────────────────────
  // Usuarios (upsert por email — campo único)
  // ─────────────────────────────────────────────

  const passwordAdmin   = await bcrypt.hash("admin123",   10);
  const passwordMaestro = await bcrypt.hash("maestro123", 10);
  const passwordPadre   = await bcrypt.hash("padre123",   10);

  await prisma.usuario.upsert({
    where:  { email: "luz@epicmotion.com" },
    update: {},
    create: {
      email:    "luz@epicmotion.com",
      password: passwordAdmin,
      nombre:   "Luz María",
      apellido: "Herrera",
      telefono: "8712044277",
      rol:      Rol.ADMIN,
    },
  });

  const carolina = await prisma.usuario.upsert({
    where:  { email: "carolina@epicmotion.com" },
    update: {},
    create: {
      email:    "carolina@epicmotion.com",
      password: passwordMaestro,
      nombre:   "Carolina",
      apellido: "López",
      telefono: "8711000001",
      rol:      Rol.MAESTRO,
    },
  });

  const roberto = await prisma.usuario.upsert({
    where:  { email: "roberto@epicmotion.com" },
    update: {},
    create: {
      email:    "roberto@epicmotion.com",
      password: passwordMaestro,
      nombre:   "Roberto",
      apellido: "García",
      telefono: "8711000002",
      rol:      Rol.MAESTRO,
    },
  });

  const juan = await prisma.usuario.upsert({
    where:  { email: "juan@epicmotion.com" },
    update: {},
    create: {
      email:    "juan@epicmotion.com",
      password: passwordPadre,
      nombre:   "Juan",
      apellido: "Pérez",
      telefono: "8711000003",
      rol:      Rol.PADRE,
    },
  });

  const ana = await prisma.usuario.upsert({
    where:  { email: "ana@epicmotion.com" },
    update: {},
    create: {
      email:    "ana@epicmotion.com",
      password: passwordPadre,
      nombre:   "Ana",
      apellido: "López",
      telefono: "8711000004",
      rol:      Rol.PADRE,
    },
  });

  console.log("✅ Usuarios creados");

  // ─────────────────────────────────────────────
  // Profesores (upsert por usuarioId — campo único)
  // ─────────────────────────────────────────────

  await prisma.profesor.upsert({
    where:  { usuarioId: carolina.id },
    update: {},
    create: {
      usuarioId:      carolina.id,
      tarifaHora:     250,
      especialidades: ["BALLET", "TAP", "JAZZ"],
    },
  });

  await prisma.profesor.upsert({
    where:  { usuarioId: roberto.id },
    update: {},
    create: {
      usuarioId:      roberto.id,
      tarifaHora:     280,
      especialidades: ["HIPHOP", "ACRO"],
    },
  });

  console.log("✅ Profesores creados");

  // ─────────────────────────────────────────────
  // Salones (findOrCreate por nombre)
  // ─────────────────────────────────────────────

  const salonPrincipal = await findOrCreate(
    () => prisma.salon.findFirst({ where: { nombre: "Salón Principal" } }),
    () => prisma.salon.create({
      data: {
        nombre:      "Salón Principal",
        descripcion: "Salón principal con espejo y barra de ballet",
        capacidad:   20,
      },
    })
  );

  const salonB = await findOrCreate(
    () => prisma.salon.findFirst({ where: { nombre: "Salón B" } }),
    () => prisma.salon.create({
      data: {
        nombre:      "Salón B",
        descripcion: "Salón secundario para grupos pequeños",
        capacidad:   15,
      },
    })
  );

  console.log("✅ Salones creados");

  // ─────────────────────────────────────────────
  // Clases (findOrCreate por nombre)
  // ─────────────────────────────────────────────

  const clasesBallet = await findOrCreate(
    () => prisma.clase.findFirst({ where: { nombre: "Ballet Infantil" } }),
    () => prisma.clase.create({
      data: {
        nombre:     "Ballet Infantil",
        estilo:     EstiloClase.BALLET,
        nivel:      "Infantil",
        duracion:   60,
        dias:       ["Lunes", "Miércoles"],
        horario:    "16:00",
        cupo:       15,
        salonId:    salonPrincipal.id,
        profesorId: carolina.id,
      },
    })
  );

  await findOrCreate(
    () => prisma.clase.findFirst({ where: { nombre: "Hip-Hop Urbano" } }),
    () => prisma.clase.create({
      data: {
        nombre:     "Hip-Hop Urbano",
        estilo:     EstiloClase.HIPHOP,
        nivel:      "Intermedio",
        duracion:   60,
        dias:       ["Martes", "Jueves"],
        horario:    "16:00",
        cupo:       20,
        salonId:    salonPrincipal.id,
        profesorId: roberto.id,
      },
    })
  );

  const claseTap = await findOrCreate(
    () => prisma.clase.findFirst({ where: { nombre: "Tap Principiantes" } }),
    () => prisma.clase.create({
      data: {
        nombre:     "Tap Principiantes",
        estilo:     EstiloClase.TAP,
        nivel:      "Principiante",
        duracion:   60,
        dias:       ["Lunes", "Miércoles"],
        horario:    "17:00",
        cupo:       15,
        salonId:    salonB.id,
        profesorId: carolina.id,
      },
    })
  );

  const claseJazz = await findOrCreate(
    () => prisma.clase.findFirst({ where: { nombre: "Jazz Contemporáneo" } }),
    () => prisma.clase.create({
      data: {
        nombre:     "Jazz Contemporáneo",
        estilo:     EstiloClase.JAZZ,
        nivel:      "Intermedio",
        duracion:   60,
        dias:       ["Martes", "Jueves"],
        horario:    "17:00",
        cupo:       15,
        salonId:    salonB.id,
        profesorId: carolina.id,
      },
    })
  );

  const claseAcro = await findOrCreate(
    () => prisma.clase.findFirst({ where: { nombre: "Acro Dance" } }),
    () => prisma.clase.create({
      data: {
        nombre:     "Acro Dance",
        estilo:     EstiloClase.ACRO,
        nivel:      "Avanzado",
        duracion:   90,
        dias:       ["Viernes"],
        horario:    "16:00",
        cupo:       12,
        salonId:    salonPrincipal.id,
        profesorId: roberto.id,
      },
    })
  );

  console.log("✅ Clases creadas");

  // ─────────────────────────────────────────────
  // Alumnas (findOrCreate por nombre + padreId)
  // ─────────────────────────────────────────────

  const sofia = await findOrCreate(
    () => prisma.alumna.findFirst({ where: { nombre: "Sofía", padreId: juan.id } }),
    () => prisma.alumna.create({
      data: {
        nombre:          "Sofía",
        apellido:        "Pérez",
        fechaNacimiento: new Date("2016-03-15"),
        estatus:         EstatusAlumna.ACTIVA,
        padreId:         juan.id,
      },
    })
  );

  const valentina = await findOrCreate(
    () => prisma.alumna.findFirst({ where: { nombre: "Valentina", padreId: juan.id } }),
    () => prisma.alumna.create({
      data: {
        nombre:          "Valentina",
        apellido:        "Pérez",
        fechaNacimiento: new Date("2018-07-22"),
        estatus:         EstatusAlumna.ACTIVA,
        padreId:         juan.id,
      },
    })
  );

  const maria = await findOrCreate(
    () => prisma.alumna.findFirst({ where: { nombre: "María", padreId: ana.id } }),
    () => prisma.alumna.create({
      data: {
        nombre:          "María",
        apellido:        "López",
        fechaNacimiento: new Date("2014-11-08"),
        estatus:         EstatusAlumna.ACTIVA,
        padreId:         ana.id,
      },
    })
  );

  console.log("✅ Alumnas creadas");

  // ─────────────────────────────────────────────
  // Inscripciones (upsert por clave compuesta — única)
  // ─────────────────────────────────────────────

  // Sofía → Ballet + Tap
  await prisma.alumnaClase.upsert({
    where:  { alumnaId_claseId: { alumnaId: sofia.id, claseId: clasesBallet.id } },
    update: {},
    create: { alumnaId: sofia.id, claseId: clasesBallet.id },
  });
  await prisma.alumnaClase.upsert({
    where:  { alumnaId_claseId: { alumnaId: sofia.id, claseId: claseTap.id } },
    update: {},
    create: { alumnaId: sofia.id, claseId: claseTap.id },
  });

  // Valentina → Ballet
  await prisma.alumnaClase.upsert({
    where:  { alumnaId_claseId: { alumnaId: valentina.id, claseId: clasesBallet.id } },
    update: {},
    create: { alumnaId: valentina.id, claseId: clasesBallet.id },
  });

  // María → Jazz + Acro
  await prisma.alumnaClase.upsert({
    where:  { alumnaId_claseId: { alumnaId: maria.id, claseId: claseJazz.id } },
    update: {},
    create: { alumnaId: maria.id, claseId: claseJazz.id },
  });
  await prisma.alumnaClase.upsert({
    where:  { alumnaId_claseId: { alumnaId: maria.id, claseId: claseAcro.id } },
    update: {},
    create: { alumnaId: maria.id, claseId: claseAcro.id },
  });

  console.log("✅ Inscripciones creadas");

  // ─────────────────────────────────────────────
  // Paquetes (findOrCreate por nombre)
  // ─────────────────────────────────────────────

  await findOrCreate(
    () => prisma.paquete.findFirst({ where: { nombre: "Básico" } }),
    () => prisma.paquete.create({
      data: {
        nombre:           "Básico",
        clasesPorSemana:  2,
        precio:           800,
        estilosIncluidos: ["BALLET", "HIPHOP", "TAP", "JAZZ", "ACRO"],
      },
    })
  );

  await findOrCreate(
    () => prisma.paquete.findFirst({ where: { nombre: "Intensivo" } }),
    () => prisma.paquete.create({
      data: {
        nombre:           "Intensivo",
        clasesPorSemana:  4,
        precio:           1400,
        estilosIncluidos: ["BALLET", "HIPHOP", "TAP", "JAZZ", "ACRO"],
      },
    })
  );

  console.log("✅ Paquetes creados");

  // ─────────────────────────────────────────────
  // Configuración (upsert por clave — campo único)
  // ─────────────────────────────────────────────

  const configs = [
    {
      clave:       "umbral_faltas",
      valor:       "3",
      descripcion: "Número de faltas consecutivas antes de notificar al padre",
    },
    {
      clave:       "minutos_checkin",
      valor:       "10",
      descripcion: "Minutos máximos para que el maestro inicie la clase antes de marcar retraso",
    },
    {
      clave:       "dia_corte_global",
      valor:       "1",
      descripcion: "Día del mes en que vence el pago mensual (global)",
    },
  ];

  for (const config of configs) {
    await prisma.configuracion.upsert({
      where:  { clave: config.clave },
      update: { valor: config.valor },
      create: config,
    });
  }

  console.log("✅ Configuración creada");

  // ─────────────────────────────────────────────
  // Resumen
  // ─────────────────────────────────────────────

  console.log("\n🎉 Seed completado exitosamente!");
  console.log("─────────────────────────────────────────────");
  console.log("Usuarios de prueba:");
  console.log("  Admin      → luz@epicmotion.com       / admin123");
  console.log("  Maestro    → carolina@epicmotion.com  / maestro123");
  console.log("  Maestro    → roberto@epicmotion.com   / maestro123");
  console.log("  Padre      → juan@epicmotion.com      / padre123");
  console.log("  Padre      → ana@epicmotion.com       / padre123");
  console.log("─────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
