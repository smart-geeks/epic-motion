import "dotenv/config";
import {
  PrismaClient,
  Rol,
  EstatusAlumna,
  EstiloClase,
  CategoriaGrupo,
  TipoTierGrupo,
} from "../app/generated/prisma/client";
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
  // Inscripciones (upsert por clave compuesta)
  // ─────────────────────────────────────────────

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
  await prisma.alumnaClase.upsert({
    where:  { alumnaId_claseId: { alumnaId: valentina.id, claseId: clasesBallet.id } },
    update: {},
    create: { alumnaId: valentina.id, claseId: clasesBallet.id },
  });
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
  // Configuración (upsert por clave)
  // ─────────────────────────────────────────────

  const configs = [
    { clave: "umbral_faltas",      valor: "3",   descripcion: "Faltas consecutivas antes de notificar al padre" },
    { clave: "minutos_checkin",    valor: "10",  descripcion: "Minutos máximos para que el maestro inicie la clase" },
    { clave: "dia_corte_global",   valor: "1",   descripcion: "Día del mes en que vence el pago mensual (global)" },
    { clave: "cuota_inscripcion",  valor: "500", descripcion: "Cuota única de inscripción por alumna (nuevo ingreso)" },
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
  // Disciplinas (upsert por nombre — campo único)
  // ─────────────────────────────────────────────
  // Catálogo completo de disciplinas de Epic Motion

  const dMovimiento = await prisma.disciplina.upsert({
    where:  { nombre: "Movimiento y Ritmo" },
    update: {},
    create: { nombre: "Movimiento y Ritmo", color: "#FFF9C4", descripcion: "Clase base para los más pequeños" },
  });
  const dBallet = await prisma.disciplina.upsert({
    where:  { nombre: "Ballet" },
    update: {},
    create: { nombre: "Ballet", color: "#F8BBD0" },
  });
  const dHipHop = await prisma.disciplina.upsert({
    where:  { nombre: "Hip-Hop" },
    update: {},
    create: { nombre: "Hip-Hop", color: "#B3E5FC" },
  });
  const dTap = await prisma.disciplina.upsert({
    where:  { nombre: "Tap" },
    update: {},
    create: { nombre: "Tap", color: "#DCEDC8" },
  });
  const dJazz = await prisma.disciplina.upsert({
    where:  { nombre: "Jazz" },
    update: {},
    create: { nombre: "Jazz", color: "#FFE0B2" },
  });
  const dAcro = await prisma.disciplina.upsert({
    where:  { nombre: "Acro" },
    update: {},
    create: { nombre: "Acro", color: "#E1BEE7" },
  });
  const dContempo = await prisma.disciplina.upsert({
    where:  { nombre: "Contempo" },
    update: {},
    create: { nombre: "Contempo", color: "#E0F7FA", descripcion: "Danza contemporánea" },
  });
  const dConditioning = await prisma.disciplina.upsert({
    where:  { nombre: "Conditioning" },
    update: {},
    create: { nombre: "Conditioning", color: "#FFCCBC", descripcion: "Acondicionamiento físico para danza" },
  });
  const dTecnica = await prisma.disciplina.upsert({
    where:  { nombre: "Técnica" },
    update: {},
    create: { nombre: "Técnica", color: "#FFF9C4", descripcion: "Técnica avanzada de danza" },
  });
  const dPuntas = await prisma.disciplina.upsert({
    where:  { nombre: "Puntas" },
    update: {},
    create: { nombre: "Puntas", color: "#F8BBD0", descripcion: "Ballet en puntas" },
  });

  console.log("✅ Disciplinas creadas");

  // ─────────────────────────────────────────────
  // Helper para upsert de GrupoDisciplina
  // ─────────────────────────────────────────────

  type GDData = {
    disciplinaId: string;
    dias: string[];
    horaInicio: string;
    duracionMinutos: number;
    horaTexto: string;
  };

  async function upsertGrupoDisciplina(grupoId: string, gd: GDData) {
    await prisma.grupoDisciplina.upsert({
      where:  { grupoId_disciplinaId: { grupoId, disciplinaId: gd.disciplinaId } },
      update: {
        dias: gd.dias,
        horaInicio: gd.horaInicio,
        duracionMinutos: gd.duracionMinutos,
        horaTexto: gd.horaTexto,
      },
      create: {
        grupoId,
        disciplinaId: gd.disciplinaId,
        dias: gd.dias,
        horaInicio: gd.horaInicio,
        duracionMinutos: gd.duracionMinutos,
        horaTexto: gd.horaTexto,
      },
    });
  }

  // ─────────────────────────────────────────────
  // Grupos — Academia Regular
  // ─────────────────────────────────────────────

  // ── EPIC TOTZ (2–4 años) ───────────────────────────────────────────────────

  const gTotzBase = await prisma.grupo.upsert({
    where:  { nombre: "EPIC TOTZ" },
    update: { categoria: CategoriaGrupo.EPIC_TOTZ, esCompetitivo: false, tier: TipoTierGrupo.BASE,
              edadMin: 2, edadMax: 4, horasPorSemana: 2, dias: ["L","X"],
              horaInicio: "16:00", duracionMinutos: 60, cupo: 12 },
    create: { nombre: "EPIC TOTZ", categoria: CategoriaGrupo.EPIC_TOTZ, esCompetitivo: false,
              tier: TipoTierGrupo.BASE, edadMin: 2, edadMax: 4, horasPorSemana: 2,
              dias: ["L","X"], horaInicio: "16:00", duracionMinutos: 60, cupo: 12,
              salonId: salonB.id },
  });

  await upsertGrupoDisciplina(gTotzBase.id, {
    disciplinaId: dMovimiento.id,
    dias: ["L","X"], horaInicio: "16:00", duracionMinutos: 60,
    horaTexto: "Lun y Mié 16:00–17:00",
  });

  // ── HAPPY FEET (5–7 años) ──────────────────────────────────────────────────
  // Horarios por disciplina: Hip-Hop L+X 16–17, Ballet L+X 17–18, Tap M+J 16–17, Jazz M+J 17–18, Acro S 10–12

  const gHF1 = await prisma.grupo.upsert({
    where:  { nombre: "HAPPY FEET 1 CLASE" },
    update: { categoria: CategoriaGrupo.HAPPY_FEET, esCompetitivo: false, tier: TipoTierGrupo.T1,
              edadMin: 5, edadMax: 7, horasPorSemana: 2, dias: ["L","M","X","J"],
              horaInicio: "16:00", duracionMinutos: 60, cupo: 15 },
    create: { nombre: "HAPPY FEET 1 CLASE", categoria: CategoriaGrupo.HAPPY_FEET, esCompetitivo: false,
              tier: TipoTierGrupo.T1, edadMin: 5, edadMax: 7, horasPorSemana: 2,
              dias: ["L","M","X","J"], horaInicio: "16:00", duracionMinutos: 60, cupo: 15,
              salonId: salonB.id },
  });

  const gHF2 = await prisma.grupo.upsert({
    where:  { nombre: "HAPPY FEET 2 CLASES" },
    update: { categoria: CategoriaGrupo.HAPPY_FEET, esCompetitivo: false, tier: TipoTierGrupo.T2,
              edadMin: 5, edadMax: 7, horasPorSemana: 4, dias: ["L","M","X","J"],
              horaInicio: "16:00", duracionMinutos: 60, cupo: 15 },
    create: { nombre: "HAPPY FEET 2 CLASES", categoria: CategoriaGrupo.HAPPY_FEET, esCompetitivo: false,
              tier: TipoTierGrupo.T2, edadMin: 5, edadMax: 7, horasPorSemana: 4,
              dias: ["L","M","X","J"], horaInicio: "16:00", duracionMinutos: 60, cupo: 15,
              salonId: salonB.id },
  });

  const gHF3 = await prisma.grupo.upsert({
    where:  { nombre: "HAPPY FEET 3 CLASES" },
    update: { categoria: CategoriaGrupo.HAPPY_FEET, esCompetitivo: false, tier: TipoTierGrupo.T3,
              edadMin: 5, edadMax: 7, horasPorSemana: 6, dias: ["L","M","X","J"],
              horaInicio: "16:00", duracionMinutos: 60, cupo: 15 },
    create: { nombre: "HAPPY FEET 3 CLASES", categoria: CategoriaGrupo.HAPPY_FEET, esCompetitivo: false,
              tier: TipoTierGrupo.T3, edadMin: 5, edadMax: 7, horasPorSemana: 6,
              dias: ["L","M","X","J"], horaInicio: "16:00", duracionMinutos: 60, cupo: 15,
              salonId: salonB.id },
  });

  const gHF4 = await prisma.grupo.upsert({
    where:  { nombre: "HAPPY FEET 4 CLASES" },
    update: { categoria: CategoriaGrupo.HAPPY_FEET, esCompetitivo: false, tier: TipoTierGrupo.T4,
              edadMin: 5, edadMax: 7, horasPorSemana: 8, dias: ["L","M","X","J"],
              horaInicio: "16:00", duracionMinutos: 60, cupo: 15 },
    create: { nombre: "HAPPY FEET 4 CLASES", categoria: CategoriaGrupo.HAPPY_FEET, esCompetitivo: false,
              tier: TipoTierGrupo.T4, edadMin: 5, edadMax: 7, horasPorSemana: 8,
              dias: ["L","M","X","J"], horaInicio: "16:00", duracionMinutos: 60, cupo: 15,
              salonId: salonPrincipal.id },
  });

  const gHFFull = await prisma.grupo.upsert({
    where:  { nombre: "HAPPY FEET FULL" },
    update: { categoria: CategoriaGrupo.HAPPY_FEET, esCompetitivo: false, tier: TipoTierGrupo.FULL,
              edadMin: 5, edadMax: 7, horasPorSemana: 10, dias: ["L","M","X","J","S"],
              horaInicio: "16:00", duracionMinutos: 60, cupo: 15 },
    create: { nombre: "HAPPY FEET FULL", categoria: CategoriaGrupo.HAPPY_FEET, esCompetitivo: false,
              tier: TipoTierGrupo.FULL, edadMin: 5, edadMax: 7, horasPorSemana: 10,
              dias: ["L","M","X","J","S"], horaInicio: "16:00", duracionMinutos: 60, cupo: 15,
              salonId: salonPrincipal.id },
  });

  // GrupoDisciplinas de HAPPY FEET FULL (fuente de disciplinas y horarios para el wizard)
  const gdHF: GDData[] = [
    { disciplinaId: dHipHop.id, dias: ["L","X"], horaInicio: "16:00", duracionMinutos: 60, horaTexto: "Lun y Mié 16:00–17:00" },
    { disciplinaId: dBallet.id, dias: ["L","X"], horaInicio: "17:00", duracionMinutos: 60, horaTexto: "Lun y Mié 17:00–18:00" },
    { disciplinaId: dTap.id,    dias: ["M","J"], horaInicio: "16:00", duracionMinutos: 60, horaTexto: "Mar y Jue 16:00–17:00" },
    { disciplinaId: dJazz.id,   dias: ["M","J"], horaInicio: "17:00", duracionMinutos: 60, horaTexto: "Mar y Jue 17:00–18:00" },
    { disciplinaId: dAcro.id,   dias: ["S"],     horaInicio: "10:00", duracionMinutos: 120, horaTexto: "Sáb 10:00–12:00" },
  ];
  for (const gd of gdHF) await upsertGrupoDisciplina(gHFFull.id, gd);
  for (const gd of gdHF) await upsertGrupoDisciplina(gHF1.id, gd);
  for (const gd of gdHF) await upsertGrupoDisciplina(gHF2.id, gd);
  for (const gd of gdHF) await upsertGrupoDisciplina(gHF3.id, gd);
  for (const gd of gdHF) await upsertGrupoDisciplina(gHF4.id, gd);

  // ── EPIC ONE (8–12 años) ───────────────────────────────────────────────────
  // Horarios: Tap L+X 17–18, Hip-Hop L+X 18–19, Jazz M+J 16–17, Ballet M+J 17–18, Acro S 10–12

  const gEO1 = await prisma.grupo.upsert({
    where:  { nombre: "EPIC ONE 1 CLASE" },
    update: { categoria: CategoriaGrupo.EPIC_ONE, esCompetitivo: false, tier: TipoTierGrupo.T1,
              edadMin: 8, edadMax: 12, horasPorSemana: 2, dias: ["L","M","X","J"],
              horaInicio: "17:00", duracionMinutos: 60, cupo: 15 },
    create: { nombre: "EPIC ONE 1 CLASE", categoria: CategoriaGrupo.EPIC_ONE, esCompetitivo: false,
              tier: TipoTierGrupo.T1, edadMin: 8, edadMax: 12, horasPorSemana: 2,
              dias: ["L","M","X","J"], horaInicio: "17:00", duracionMinutos: 60, cupo: 15,
              salonId: salonB.id },
  });

  const gEO2 = await prisma.grupo.upsert({
    where:  { nombre: "EPIC ONE 2 CLASES" },
    update: { categoria: CategoriaGrupo.EPIC_ONE, esCompetitivo: false, tier: TipoTierGrupo.T2,
              edadMin: 8, edadMax: 12, horasPorSemana: 4, dias: ["L","M","X","J"],
              horaInicio: "17:00", duracionMinutos: 60, cupo: 15 },
    create: { nombre: "EPIC ONE 2 CLASES", categoria: CategoriaGrupo.EPIC_ONE, esCompetitivo: false,
              tier: TipoTierGrupo.T2, edadMin: 8, edadMax: 12, horasPorSemana: 4,
              dias: ["L","M","X","J"], horaInicio: "17:00", duracionMinutos: 60, cupo: 15,
              salonId: salonB.id },
  });

  const gEO3 = await prisma.grupo.upsert({
    where:  { nombre: "EPIC ONE 3 CLASES" },
    update: { categoria: CategoriaGrupo.EPIC_ONE, esCompetitivo: false, tier: TipoTierGrupo.T3,
              edadMin: 8, edadMax: 12, horasPorSemana: 6, dias: ["L","M","X","J"],
              horaInicio: "17:00", duracionMinutos: 60, cupo: 15 },
    create: { nombre: "EPIC ONE 3 CLASES", categoria: CategoriaGrupo.EPIC_ONE, esCompetitivo: false,
              tier: TipoTierGrupo.T3, edadMin: 8, edadMax: 12, horasPorSemana: 6,
              dias: ["L","M","X","J"], horaInicio: "17:00", duracionMinutos: 60, cupo: 15,
              salonId: salonB.id },
  });

  const gEO4 = await prisma.grupo.upsert({
    where:  { nombre: "EPIC ONE 4 CLASES" },
    update: { categoria: CategoriaGrupo.EPIC_ONE, esCompetitivo: false, tier: TipoTierGrupo.T4,
              edadMin: 8, edadMax: 12, horasPorSemana: 8, dias: ["L","M","X","J"],
              horaInicio: "17:00", duracionMinutos: 60, cupo: 15 },
    create: { nombre: "EPIC ONE 4 CLASES", categoria: CategoriaGrupo.EPIC_ONE, esCompetitivo: false,
              tier: TipoTierGrupo.T4, edadMin: 8, edadMax: 12, horasPorSemana: 8,
              dias: ["L","M","X","J"], horaInicio: "17:00", duracionMinutos: 60, cupo: 15,
              salonId: salonPrincipal.id },
  });

  const gEOFull = await prisma.grupo.upsert({
    where:  { nombre: "EPIC ONE FULL" },
    update: { categoria: CategoriaGrupo.EPIC_ONE, esCompetitivo: false, tier: TipoTierGrupo.FULL,
              edadMin: 8, edadMax: 12, horasPorSemana: 10, dias: ["L","M","X","J","S"],
              horaInicio: "17:00", duracionMinutos: 60, cupo: 15 },
    create: { nombre: "EPIC ONE FULL", categoria: CategoriaGrupo.EPIC_ONE, esCompetitivo: false,
              tier: TipoTierGrupo.FULL, edadMin: 8, edadMax: 12, horasPorSemana: 10,
              dias: ["L","M","X","J","S"], horaInicio: "17:00", duracionMinutos: 60, cupo: 15,
              salonId: salonPrincipal.id },
  });

  const gdEO: GDData[] = [
    { disciplinaId: dTap.id,    dias: ["L","X"], horaInicio: "17:00", duracionMinutos: 60, horaTexto: "Lun y Mié 17:00–18:00" },
    { disciplinaId: dHipHop.id, dias: ["L","X"], horaInicio: "18:00", duracionMinutos: 60, horaTexto: "Lun y Mié 18:00–19:00" },
    { disciplinaId: dJazz.id,   dias: ["M","J"], horaInicio: "16:00", duracionMinutos: 60, horaTexto: "Mar y Jue 16:00–17:00" },
    { disciplinaId: dBallet.id, dias: ["M","J"], horaInicio: "17:00", duracionMinutos: 60, horaTexto: "Mar y Jue 17:00–18:00" },
    { disciplinaId: dAcro.id,   dias: ["S"],     horaInicio: "10:00", duracionMinutos: 120, horaTexto: "Sáb 10:00–12:00" },
  ];
  for (const gd of gdEO) await upsertGrupoDisciplina(gEOFull.id, gd);
  for (const gd of gdEO) await upsertGrupoDisciplina(gEO1.id, gd);
  for (const gd of gdEO) await upsertGrupoDisciplina(gEO2.id, gd);
  for (const gd of gdEO) await upsertGrupoDisciplina(gEO3.id, gd);
  for (const gd of gdEO) await upsertGrupoDisciplina(gEO4.id, gd);

  // ── TEEN (12–17 años) ──────────────────────────────────────────────────────
  // Horarios: Tap L+X 19–20, Hip-Hop L+X 20–21, Ballet M+J 18–19, Jazz M+J 19–20:30, Contempo S 10–11, Conditioning S 11–12

  // Renombrar grupos legados (si existen con nomenclatura "DÍAS")
  await prisma.grupo.updateMany({ where: { nombre: "TEEN 2 DÍAS" }, data: { nombre: "TEEN 2 CLASES" } });
  await prisma.grupo.updateMany({ where: { nombre: "TEEN 4 DÍAS" }, data: { nombre: "TEEN 4 CLASES" } });

  const gTeen1 = await prisma.grupo.upsert({
    where:  { nombre: "TEEN 1 CLASE" },
    update: { categoria: CategoriaGrupo.TEEN, esCompetitivo: false, tier: TipoTierGrupo.T1,
              edadMin: 12, edadMax: 17, horasPorSemana: 2, dias: ["L","X"],
              horaInicio: "19:00", duracionMinutos: 60, cupo: 15 },
    create: { nombre: "TEEN 1 CLASE", categoria: CategoriaGrupo.TEEN, esCompetitivo: false,
              tier: TipoTierGrupo.T1, edadMin: 12, edadMax: 17, horasPorSemana: 2,
              dias: ["L","X"], horaInicio: "19:00", duracionMinutos: 60, cupo: 15,
              salonId: salonB.id },
  });

  const gTeen2 = await prisma.grupo.upsert({
    where:  { nombre: "TEEN 2 CLASES" },
    update: { categoria: CategoriaGrupo.TEEN, esCompetitivo: false, tier: TipoTierGrupo.T2,
              edadMin: 12, edadMax: 17, horasPorSemana: 4, dias: ["L","X"],
              horaInicio: "19:00", duracionMinutos: 60, cupo: 15 },
    create: { nombre: "TEEN 2 CLASES", categoria: CategoriaGrupo.TEEN, esCompetitivo: false,
              tier: TipoTierGrupo.T2, edadMin: 12, edadMax: 17, horasPorSemana: 4,
              dias: ["L","X"], horaInicio: "19:00", duracionMinutos: 60, cupo: 15,
              salonId: salonB.id },
  });

  const gTeen3 = await prisma.grupo.upsert({
    where:  { nombre: "TEEN 3 CLASES" },
    update: { categoria: CategoriaGrupo.TEEN, esCompetitivo: false, tier: TipoTierGrupo.T3,
              edadMin: 12, edadMax: 17, horasPorSemana: 6, dias: ["L","M","X","J"],
              horaInicio: "18:00", duracionMinutos: 60, cupo: 15 },
    create: { nombre: "TEEN 3 CLASES", categoria: CategoriaGrupo.TEEN, esCompetitivo: false,
              tier: TipoTierGrupo.T3, edadMin: 12, edadMax: 17, horasPorSemana: 6,
              dias: ["L","M","X","J"], horaInicio: "18:00", duracionMinutos: 60, cupo: 15,
              salonId: salonB.id },
  });

  const gTeen4 = await prisma.grupo.upsert({
    where:  { nombre: "TEEN 4 CLASES" },
    update: { categoria: CategoriaGrupo.TEEN, esCompetitivo: false, tier: TipoTierGrupo.T4,
              edadMin: 12, edadMax: 17, horasPorSemana: 8, dias: ["L","M","X","J"],
              horaInicio: "18:00", duracionMinutos: 60, cupo: 15 },
    create: { nombre: "TEEN 4 CLASES", categoria: CategoriaGrupo.TEEN, esCompetitivo: false,
              tier: TipoTierGrupo.T4, edadMin: 12, edadMax: 17, horasPorSemana: 8,
              dias: ["L","M","X","J"], horaInicio: "18:00", duracionMinutos: 60, cupo: 15,
              salonId: salonPrincipal.id },
  });

  const gTeen5 = await prisma.grupo.upsert({
    where:  { nombre: "TEEN 5 CLASES" },
    update: { categoria: CategoriaGrupo.TEEN, esCompetitivo: false, tier: TipoTierGrupo.T4,
              edadMin: 12, edadMax: 17, horasPorSemana: 10, dias: ["L","M","X","J"],
              horaInicio: "18:00", duracionMinutos: 60, cupo: 15 },
    create: { nombre: "TEEN 5 CLASES", categoria: CategoriaGrupo.TEEN, esCompetitivo: false,
              tier: TipoTierGrupo.T4, edadMin: 12, edadMax: 17, horasPorSemana: 10,
              dias: ["L","M","X","J"], horaInicio: "18:00", duracionMinutos: 60, cupo: 15,
              salonId: salonPrincipal.id },
  });

  const gTeenFull = await prisma.grupo.upsert({
    where:  { nombre: "TEEN FULL CON SÁBADOS" },
    update: { categoria: CategoriaGrupo.TEEN, esCompetitivo: false, tier: TipoTierGrupo.FULL,
              edadMin: 12, edadMax: 17, horasPorSemana: 10, dias: ["L","M","X","J","S"],
              horaInicio: "18:00", duracionMinutos: 60, cupo: 15 },
    create: { nombre: "TEEN FULL CON SÁBADOS", categoria: CategoriaGrupo.TEEN, esCompetitivo: false,
              tier: TipoTierGrupo.FULL, edadMin: 12, edadMax: 17, horasPorSemana: 10,
              dias: ["L","M","X","J","S"], horaInicio: "18:00", duracionMinutos: 60, cupo: 15,
              salonId: salonPrincipal.id },
  });

  const gdTeen: GDData[] = [
    { disciplinaId: dTap.id,          dias: ["L","X"], horaInicio: "19:00", duracionMinutos: 60,  horaTexto: "Lun y Mié 19:00–20:00"  },
    { disciplinaId: dHipHop.id,       dias: ["L","X"], horaInicio: "20:00", duracionMinutos: 60,  horaTexto: "Lun y Mié 20:00–21:00"  },
    { disciplinaId: dBallet.id,       dias: ["M","J"], horaInicio: "18:00", duracionMinutos: 60,  horaTexto: "Mar y Jue 18:00–19:00"  },
    { disciplinaId: dContempo.id,     dias: ["S"],     horaInicio: "10:00", duracionMinutos: 120, horaTexto: "Sáb 10:00–12:00"        },
  ];
  for (const gd of gdTeen) await upsertGrupoDisciplina(gTeenFull.id, gd);
  for (const gd of gdTeen) await upsertGrupoDisciplina(gTeen1.id, gd);
  for (const gd of gdTeen) await upsertGrupoDisciplina(gTeen2.id, gd);
  for (const gd of gdTeen) await upsertGrupoDisciplina(gTeen3.id, gd);
  for (const gd of gdTeen) await upsertGrupoDisciplina(gTeen4.id, gd);
  for (const gd of gdTeen) await upsertGrupoDisciplina(gTeen5.id, gd);

  console.log("✅ Grupos regulares creados (EPIC TOTZ, HAPPY FEET, EPIC ONE, TEEN)");

  // ─────────────────────────────────────────────
  // Grupos — Competición
  // ─────────────────────────────────────────────

  // ── TINY FULL (6–8 años, 10 hrs/sem) ──────────────────────────────────────
  const gTiny = await prisma.grupo.upsert({
    where:  { nombre: "TINY FULL" },
    update: { categoria: CategoriaGrupo.COMPETICION, esCompetitivo: true, tier: TipoTierGrupo.FULL,
              edadMin: 6, edadMax: 8, horasPorSemana: 10, dias: ["L","M","X","J","S"],
              horaInicio: "16:00", duracionMinutos: 60, cupo: 12 },
    create: { nombre: "TINY FULL", categoria: CategoriaGrupo.COMPETICION, esCompetitivo: true,
              tier: TipoTierGrupo.FULL, edadMin: 6, edadMax: 8, horasPorSemana: 10,
              dias: ["L","M","X","J","S"], horaInicio: "16:00", duracionMinutos: 60, cupo: 12,
              salonId: salonPrincipal.id },
  });
  const gdTiny: GDData[] = [
    { disciplinaId: dBallet.id, dias: ["L","X"], horaInicio: "16:00", duracionMinutos: 60, horaTexto: "Lun y Mié 16:00–17:00" },
    { disciplinaId: dJazz.id,   dias: ["L","X"], horaInicio: "17:00", duracionMinutos: 60, horaTexto: "Lun y Mié 17:00–18:00" },
    { disciplinaId: dHipHop.id, dias: ["M","J"], horaInicio: "16:00", duracionMinutos: 60, horaTexto: "Mar y Jue 16:00–17:00" },
    { disciplinaId: dTap.id,    dias: ["M","J"], horaInicio: "17:00", duracionMinutos: 60, horaTexto: "Mar y Jue 17:00–18:00" },
    { disciplinaId: dAcro.id,   dias: ["S"],     horaInicio: "10:00", duracionMinutos: 120, horaTexto: "Sáb 10:00–12:00" },
  ];
  for (const gd of gdTiny) await upsertGrupoDisciplina(gTiny.id, gd);

  // ── MINIS FULL (11–12 años, 13 hrs/sem) ───────────────────────────────────
  const gMinis = await prisma.grupo.upsert({
    where:  { nombre: "MINIS FULL" },
    update: { categoria: CategoriaGrupo.COMPETICION, esCompetitivo: true, tier: TipoTierGrupo.FULL,
              edadMin: 11, edadMax: 12, horasPorSemana: 13, dias: ["L","M","X","J","S"],
              horaInicio: "16:00", duracionMinutos: 90, cupo: 12 },
    create: { nombre: "MINIS FULL", categoria: CategoriaGrupo.COMPETICION, esCompetitivo: true,
              tier: TipoTierGrupo.FULL, edadMin: 11, edadMax: 12, horasPorSemana: 13,
              dias: ["L","M","X","J","S"], horaInicio: "16:00", duracionMinutos: 90, cupo: 12,
              salonId: salonPrincipal.id },
  });
  const gdMinis: GDData[] = [
    { disciplinaId: dBallet.id,       dias: ["L","X"], horaInicio: "16:00", duracionMinutos: 90,  horaTexto: "Lun y Mié 16:00–17:30"                   },
    { disciplinaId: dConditioning.id, dias: ["L","X"], horaInicio: "17:30", duracionMinutos: 30,  horaTexto: "Lun y Mié 17:30–18:00 · Sáb 10:00–12:00" },
    { disciplinaId: dTap.id,          dias: ["L","X"], horaInicio: "18:00", duracionMinutos: 60,  horaTexto: "Lun y Mié 18:00–19:00"                   },
    { disciplinaId: dJazz.id,         dias: ["M","J"], horaInicio: "16:00", duracionMinutos: 90,  horaTexto: "Mar y Jue 16:00–17:30"                   },
    { disciplinaId: dHipHop.id,       dias: ["M","J"], horaInicio: "17:30", duracionMinutos: 60,  horaTexto: "Mar y Jue 17:30–18:30"                   },
    { disciplinaId: dAcro.id,         dias: ["S"],     horaInicio: "10:00", duracionMinutos: 120, horaTexto: "Sáb 10:00–12:00"                         },
  ];
  for (const gd of gdMinis) await upsertGrupoDisciplina(gMinis.id, gd);

  // ── JUNIOR FULL (13–14 años, 14 hrs/sem) ──────────────────────────────────
  const gJunior = await prisma.grupo.upsert({
    where:  { nombre: "JUNIOR FULL" },
    update: { categoria: CategoriaGrupo.COMPETICION, esCompetitivo: true, tier: TipoTierGrupo.FULL,
              edadMin: 13, edadMax: 14, horasPorSemana: 14, dias: ["L","M","X","J","S"],
              horaInicio: "17:30", duracionMinutos: 90, cupo: 12 },
    create: { nombre: "JUNIOR FULL", categoria: CategoriaGrupo.COMPETICION, esCompetitivo: true,
              tier: TipoTierGrupo.FULL, edadMin: 13, edadMax: 14, horasPorSemana: 14,
              dias: ["L","M","X","J","S"], horaInicio: "17:30", duracionMinutos: 90, cupo: 12,
              salonId: salonPrincipal.id },
  });
  const gdJunior: GDData[] = [
    { disciplinaId: dJazz.id,         dias: ["L","X"], horaInicio: "17:30", duracionMinutos: 90,  horaTexto: "Lun y Mié 17:30–19:00"                   },
    { disciplinaId: dHipHop.id,       dias: ["L","X"], horaInicio: "19:00", duracionMinutos: 60,  horaTexto: "Lun y Mié 19:00–20:00"                   },
    { disciplinaId: dConditioning.id, dias: ["L","X"], horaInicio: "20:00", duracionMinutos: 30,  horaTexto: "Lun y Mié 20:00–20:30"                   },
    { disciplinaId: dTap.id,          dias: ["M","J"], horaInicio: "18:00", duracionMinutos: 60,  horaTexto: "Mar y Jue 18:00–19:00"                   },
    { disciplinaId: dBallet.id,       dias: ["M","J"], horaInicio: "19:00", duracionMinutos: 90,  horaTexto: "Mar y Jue 19:00–20:30"                   },
    { disciplinaId: dTecnica.id,      dias: ["S"],     horaInicio: "10:00", duracionMinutos: 60,  horaTexto: "Sáb 10:00–11:00"                         },
    { disciplinaId: dAcro.id,         dias: ["S"],     horaInicio: "11:00", duracionMinutos: 60,  horaTexto: "Sáb 11:00–12:00"                         },
    { disciplinaId: dContempo.id,     dias: ["S"],     horaInicio: "12:00", duracionMinutos: 60,  horaTexto: "Sáb 12:00–13:00"                         },
  ];
  for (const gd of gdJunior) await upsertGrupoDisciplina(gJunior.id, gd);

  // ── SENIOR FULL (15+ años, 15.5 hrs/sem) ──────────────────────────────────
  const gSenior = await prisma.grupo.upsert({
    where:  { nombre: "SENIOR FULL" },
    update: { categoria: CategoriaGrupo.COMPETICION, esCompetitivo: true, tier: TipoTierGrupo.FULL,
              edadMin: 15, edadMax: 99, horasPorSemana: 15.5, dias: ["L","M","X","J","S"],
              horaInicio: "17:00", duracionMinutos: 90, cupo: 12 },
    create: { nombre: "SENIOR FULL", categoria: CategoriaGrupo.COMPETICION, esCompetitivo: true,
              tier: TipoTierGrupo.FULL, edadMin: 15, edadMax: 99, horasPorSemana: 15.5,
              dias: ["L","M","X","J","S"], horaInicio: "17:00", duracionMinutos: 90, cupo: 12,
              salonId: salonPrincipal.id },
  });
  const gdSenior: GDData[] = [
    { disciplinaId: dHipHop.id,       dias: ["L","X"], horaInicio: "18:00", duracionMinutos: 60,  horaTexto: "Lun y Mié 18:00–19:00"  },
    { disciplinaId: dBallet.id,       dias: ["L","X"], horaInicio: "19:00", duracionMinutos: 90,  horaTexto: "Lun y Mié 19:00–20:30"  },
    { disciplinaId: dJazz.id,         dias: ["M","J"], horaInicio: "18:00", duracionMinutos: 90,  horaTexto: "Mar y Jue 18:00–19:30"  },
    { disciplinaId: dTap.id,          dias: ["M","J"], horaInicio: "19:30", duracionMinutos: 60,  horaTexto: "Mar y Jue 19:30–20:30"  },
    { disciplinaId: dPuntas.id,       dias: ["V"],     horaInicio: "16:00", duracionMinutos: 120, horaTexto: "Vie 16:00–18:00"        },
    { disciplinaId: dAcro.id,         dias: ["S"],     horaInicio: "09:30", duracionMinutos: 90,  horaTexto: "Sáb 09:30–11:00"        },
    { disciplinaId: dContempo.id,     dias: ["S"],     horaInicio: "11:00", duracionMinutos: 60,  horaTexto: "Sáb 11:00–12:00"        },
    { disciplinaId: dTecnica.id,      dias: ["S"],     horaInicio: "12:00", duracionMinutos: 60,  horaTexto: "Sáb 12:00–13:00"        },
  ];
  for (const gd of gdSenior) await upsertGrupoDisciplina(gSenior.id, gd);

  console.log("✅ Grupos de competición creados (TINY, MINIS, JUNIOR, SENIOR)");

  // ─────────────────────────────────────────────
  // Tarifas de mensualidad (upsert por grupoId)
  // ─────────────────────────────────────────────

  const tarifas: Array<{ grupoId: string; mensualidad: number; preseason: number; horas: number }> = [
    // Regulares
    { grupoId: gTotzBase.id, mensualidad: 700,  preseason: 500, horas: 2   },
    { grupoId: gHF1.id,      mensualidad: 650,  preseason: 500, horas: 2   },
    { grupoId: gHF2.id,      mensualidad: 750,  preseason: 500, horas: 4   },
    { grupoId: gHF3.id,      mensualidad: 900,  preseason: 500, horas: 6   },
    { grupoId: gHF4.id,      mensualidad: 1000, preseason: 500, horas: 8   },
    { grupoId: gHFFull.id,   mensualidad: 1100, preseason: 500, horas: 10  },
    { grupoId: gEO1.id,      mensualidad: 700,  preseason: 500, horas: 2   },
    { grupoId: gEO2.id,      mensualidad: 900,  preseason: 500, horas: 4   },
    { grupoId: gEO3.id,      mensualidad: 1050, preseason: 500, horas: 6   },
    { grupoId: gEO4.id,      mensualidad: 1200, preseason: 500, horas: 8   },
    { grupoId: gEOFull.id,   mensualidad: 1400, preseason: 500, horas: 10  },
    { grupoId: gTeen1.id,    mensualidad: 750,  preseason: 500, horas: 2   },
    { grupoId: gTeen2.id,    mensualidad: 900,  preseason: 500, horas: 4   },
    { grupoId: gTeen3.id,    mensualidad: 1050, preseason: 500, horas: 6   },
    { grupoId: gTeen4.id,    mensualidad: 1200, preseason: 500, horas: 8   },
    { grupoId: gTeen5.id,    mensualidad: 1350, preseason: 500, horas: 10  },
    { grupoId: gTeenFull.id, mensualidad: 1500, preseason: 500, horas: 10  },
    // Competición
    { grupoId: gTiny.id,     mensualidad: 1500, preseason: 500, horas: 10  },
    { grupoId: gMinis.id,    mensualidad: 1500, preseason: 500, horas: 13  },
    { grupoId: gJunior.id,   mensualidad: 1500, preseason: 500, horas: 14  },
    { grupoId: gSenior.id,   mensualidad: 1500, preseason: 500, horas: 15.5 },
  ];

  for (const t of tarifas) {
    await prisma.tarifaMensualidad.upsert({
      where:  { grupoId: t.grupoId },
      update: { precioMensualidad: t.mensualidad, precioPreseason: t.preseason, horasPorSemana: t.horas },
      create: { grupoId: t.grupoId, precioMensualidad: t.mensualidad, precioPreseason: t.preseason, horasPorSemana: t.horas },
    });
  }

  console.log("✅ Tarifas de mensualidad creadas (16 grupos)");

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
  console.log("Grupos regulares: EPIC TOTZ · HAPPY FEET ×5 · EPIC ONE ×5 · TEEN ×6");
  console.log("Grupos competición: TINY FULL · MINIS FULL · JUNIOR FULL · SENIOR FULL");
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
