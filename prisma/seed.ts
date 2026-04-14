import "dotenv/config";
import { PrismaClient, Rol, EstatusAlumna, EstiloClase } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando seed de Epic Motion...");

  // ─────────────────────────────────────────────
  // Usuarios
  // ─────────────────────────────────────────────

  const passwordAdmin = await bcrypt.hash("admin123", 10);
  const passwordMaestro = await bcrypt.hash("maestro123", 10);
  const passwordPadre = await bcrypt.hash("padre123", 10);

  const luz = await prisma.usuario.upsert({
    where: { email: "luz@epicmotion.com" },
    update: {},
    create: {
      email: "luz@epicmotion.com",
      password: passwordAdmin,
      nombre: "Luz María",
      apellido: "Herrera",
      telefono: "8712044277",
      rol: Rol.ADMIN,
    },
  });

  const carolina = await prisma.usuario.upsert({
    where: { email: "carolina@epicmotion.com" },
    update: {},
    create: {
      email: "carolina@epicmotion.com",
      password: passwordMaestro,
      nombre: "Carolina",
      apellido: "López",
      telefono: "8711000001",
      rol: Rol.MAESTRO,
    },
  });

  const roberto = await prisma.usuario.upsert({
    where: { email: "roberto@epicmotion.com" },
    update: {},
    create: {
      email: "roberto@epicmotion.com",
      password: passwordMaestro,
      nombre: "Roberto",
      apellido: "García",
      telefono: "8711000002",
      rol: Rol.MAESTRO,
    },
  });

  const juan = await prisma.usuario.upsert({
    where: { email: "juan@epicmotion.com" },
    update: {},
    create: {
      email: "juan@epicmotion.com",
      password: passwordPadre,
      nombre: "Juan",
      apellido: "Pérez",
      telefono: "8711000003",
      rol: Rol.PADRE,
    },
  });

  const ana = await prisma.usuario.upsert({
    where: { email: "ana@epicmotion.com" },
    update: {},
    create: {
      email: "ana@epicmotion.com",
      password: passwordPadre,
      nombre: "Ana",
      apellido: "López",
      telefono: "8711000004",
      rol: Rol.PADRE,
    },
  });

  console.log("✅ Usuarios creados");

  // ─────────────────────────────────────────────
  // Profesores
  // ─────────────────────────────────────────────

  const profesorCarolina = await prisma.profesor.upsert({
    where: { usuarioId: carolina.id },
    update: {},
    create: {
      usuarioId: carolina.id,
      tarifaHora: 250,
      especialidades: ["BALLET", "TAP", "JAZZ"],
    },
  });

  const profesorRoberto = await prisma.profesor.upsert({
    where: { usuarioId: roberto.id },
    update: {},
    create: {
      usuarioId: roberto.id,
      tarifaHora: 280,
      especialidades: ["HIPHOP", "ACRO"],
    },
  });

  console.log("✅ Profesores creados");

  // ─────────────────────────────────────────────
  // Salones
  // ─────────────────────────────────────────────

  const salonPrincipal = await prisma.salon.upsert({
    where: { id: "salon-principal" },
    update: {},
    create: {
      id: "salon-principal",
      nombre: "Salón Principal",
      descripcion: "Salón principal con espejo y barra de ballet",
      capacidad: 20,
    },
  });

  const salonB = await prisma.salon.upsert({
    where: { id: "salon-b" },
    update: {},
    create: {
      id: "salon-b",
      nombre: "Salón B",
      descripcion: "Salón secundario para grupos pequeños",
      capacidad: 15,
    },
  });

  console.log("✅ Salones creados");

  // ─────────────────────────────────────────────
  // Clases (grupos)
  // ─────────────────────────────────────────────

  const clasesBallet = await prisma.clase.upsert({
    where: { id: "clase-ballet" },
    update: {},
    create: {
      id: "clase-ballet",
      nombre: "Ballet Infantil",
      estilo: EstiloClase.BALLET,
      nivel: "Infantil",
      duracion: 60,
      dias: ["Lunes", "Miércoles"],
      horario: "16:00",
      cupo: 15,
      salonId: salonPrincipal.id,
      profesorId: carolina.id,
    },
  });

  const claseHiphop = await prisma.clase.upsert({
    where: { id: "clase-hiphop" },
    update: {},
    create: {
      id: "clase-hiphop",
      nombre: "Hip-Hop Urbano",
      estilo: EstiloClase.HIPHOP,
      nivel: "Intermedio",
      duracion: 60,
      dias: ["Martes", "Jueves"],
      horario: "16:00",
      cupo: 20,
      salonId: salonPrincipal.id,
      profesorId: roberto.id,
    },
  });

  const claseTap = await prisma.clase.upsert({
    where: { id: "clase-tap" },
    update: {},
    create: {
      id: "clase-tap",
      nombre: "Tap Principiantes",
      estilo: EstiloClase.TAP,
      nivel: "Principiante",
      duracion: 60,
      dias: ["Lunes", "Miércoles"],
      horario: "17:00",
      cupo: 15,
      salonId: salonB.id,
      profesorId: carolina.id,
    },
  });

  const claseJazz = await prisma.clase.upsert({
    where: { id: "clase-jazz" },
    update: {},
    create: {
      id: "clase-jazz",
      nombre: "Jazz Contemporáneo",
      estilo: EstiloClase.JAZZ,
      nivel: "Intermedio",
      duracion: 60,
      dias: ["Martes", "Jueves"],
      horario: "17:00",
      cupo: 15,
      salonId: salonB.id,
      profesorId: carolina.id,
    },
  });

  const claseAcro = await prisma.clase.upsert({
    where: { id: "clase-acro" },
    update: {},
    create: {
      id: "clase-acro",
      nombre: "Acro Dance",
      estilo: EstiloClase.ACRO,
      nivel: "Avanzado",
      duracion: 90,
      dias: ["Viernes"],
      horario: "16:00",
      cupo: 12,
      salonId: salonPrincipal.id,
      profesorId: roberto.id,
    },
  });

  console.log("✅ Clases creadas");

  // ─────────────────────────────────────────────
  // Alumnas
  // ─────────────────────────────────────────────

  const sofia = await prisma.alumna.upsert({
    where: { id: "alumna-sofia" },
    update: {},
    create: {
      id: "alumna-sofia",
      nombre: "Sofía",
      apellido: "Pérez",
      fechaNacimiento: new Date("2016-03-15"),
      estatus: EstatusAlumna.ACTIVA,
      padreId: juan.id,
    },
  });

  const valentina = await prisma.alumna.upsert({
    where: { id: "alumna-valentina" },
    update: {},
    create: {
      id: "alumna-valentina",
      nombre: "Valentina",
      apellido: "Pérez",
      fechaNacimiento: new Date("2018-07-22"),
      estatus: EstatusAlumna.ACTIVA,
      padreId: juan.id,
    },
  });

  const maria = await prisma.alumna.upsert({
    where: { id: "alumna-maria" },
    update: {},
    create: {
      id: "alumna-maria",
      nombre: "María",
      apellido: "López",
      fechaNacimiento: new Date("2014-11-08"),
      estatus: EstatusAlumna.ACTIVA,
      padreId: ana.id,
    },
  });

  console.log("✅ Alumnas creadas");

  // ─────────────────────────────────────────────
  // Inscripciones (AlumnaClase)
  // ─────────────────────────────────────────────

  // Sofía → Ballet + Tap
  await prisma.alumnaClase.upsert({
    where: { alumnaId_claseId: { alumnaId: sofia.id, claseId: clasesBallet.id } },
    update: {},
    create: { alumnaId: sofia.id, claseId: clasesBallet.id },
  });
  await prisma.alumnaClase.upsert({
    where: { alumnaId_claseId: { alumnaId: sofia.id, claseId: claseTap.id } },
    update: {},
    create: { alumnaId: sofia.id, claseId: claseTap.id },
  });

  // Valentina → Ballet
  await prisma.alumnaClase.upsert({
    where: { alumnaId_claseId: { alumnaId: valentina.id, claseId: clasesBallet.id } },
    update: {},
    create: { alumnaId: valentina.id, claseId: clasesBallet.id },
  });

  // María → Jazz + Acro
  await prisma.alumnaClase.upsert({
    where: { alumnaId_claseId: { alumnaId: maria.id, claseId: claseJazz.id } },
    update: {},
    create: { alumnaId: maria.id, claseId: claseJazz.id },
  });
  await prisma.alumnaClase.upsert({
    where: { alumnaId_claseId: { alumnaId: maria.id, claseId: claseAcro.id } },
    update: {},
    create: { alumnaId: maria.id, claseId: claseAcro.id },
  });

  console.log("✅ Inscripciones creadas");

  // ─────────────────────────────────────────────
  // Paquetes
  // ─────────────────────────────────────────────

  await prisma.paquete.upsert({
    where: { id: "paquete-basico" },
    update: {},
    create: {
      id: "paquete-basico",
      nombre: "Básico",
      clasesPorSemana: 2,
      precio: 800,
      estilosIncluidos: ["BALLET", "HIPHOP", "TAP", "JAZZ", "ACRO"],
    },
  });

  await prisma.paquete.upsert({
    where: { id: "paquete-intensivo" },
    update: {},
    create: {
      id: "paquete-intensivo",
      nombre: "Intensivo",
      clasesPorSemana: 4,
      precio: 1400,
      estilosIncluidos: ["BALLET", "HIPHOP", "TAP", "JAZZ", "ACRO"],
    },
  });

  console.log("✅ Paquetes creados");

  // ─────────────────────────────────────────────
  // Configuración
  // ─────────────────────────────────────────────

  const configs = [
    {
      clave: "umbral_faltas",
      valor: "3",
      descripcion: "Número de faltas consecutivas antes de notificar al padre",
    },
    {
      clave: "minutos_checkin",
      valor: "10",
      descripcion: "Minutos máximos para que el maestro inicie la clase antes de marcar retraso",
    },
    {
      clave: "dia_corte_global",
      valor: "1",
      descripcion: "Día del mes en que vence el pago mensual (global)",
    },
  ];

  for (const config of configs) {
    await prisma.configuracion.upsert({
      where: { clave: config.clave },
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
