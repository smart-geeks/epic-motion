"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withRLS } from "@/lib/prisma-rls";
import bcrypt from "bcryptjs";
import type { InscripcionAPIResponse } from "@/types/inscripciones";
import { EstadoCargo, EstadoPago, TipoPago, TipoConcepto } from "@/app/generated/prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Validación Zod (UUIDs, no cuid — convención del proyecto)
// ─────────────────────────────────────────────────────────────────────────────

const DatosAlumnaSchema = z.object({
  nombre: z.string().min(1).max(80),
  apellido: z.string().min(1).max(80),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  domicilio: z.string().max(200).default(""),
  institucionEducativa: z.string().max(120).default(""),
  celular: z.string().max(20).default(""),
  emailAlumna: z.string().email().or(z.literal("")).default(""),
});

const DatosTutorSchema = z.object({
  nombreMadre: z.string().max(100).default(""),
  celularMadre: z.string().max(20).default(""),
  emailMadre: z.string().email().or(z.literal("")).default(""),
  telefonoTrabajoMadre: z.string().max(20).default(""),
  nombrePadre: z.string().max(100).default(""),
  celularPadre: z.string().max(20).default(""),
  emailPadre: z.string().email().or(z.literal("")).default(""),
  telefonoTrabajoPadre: z.string().max(20).default(""),
});

const DatosInfoGeneralSchema = z.object({
  otraAcademia: z.boolean(),
  nombreOtraAcademia: z.string().max(120).default(""),
  tieneEnfermedad: z.boolean(),
  descripcionEnfermedad: z.string().max(500).default(""),
  canalContacto: z.enum(["WHATSAPP", "EMAIL", "TELEFONO"]),
  aceptaTerminos: z.literal(true, {
    error: "Debes aceptar los términos y condiciones",
  }),
});

const DatosPagoSchema = z.object({
  metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA"]),
  referencia: z.string().max(100).default(""),
  comprobanteUrl: z.string().url().nullable().default(null),
});

const InscripcionSchema = z.object({
  alumnaId: z.string().uuid().optional(), // presente solo en reinscripción
  alumna: DatosAlumnaSchema,
  tutor: DatosTutorSchema,
  infoGeneral: DatosInfoGeneralSchema,
  grupoId: z.string().uuid(),
  pago: DatosPagoSchema,
});

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────────────────────

function generarPasswordTemporal(): string {
  // Excluir caracteres ambiguos: 0, O, I, l
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < 8; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

function calcularFechaVencimientoMensualidad(diaCorte: number): Date {
  const hoy = new Date();
  let anio = hoy.getFullYear();
  let mes = hoy.getMonth(); // 0-indexed

  // Si el día de corte ya pasó este mes, ir al mes siguiente
  if (diaCorte <= hoy.getDate()) {
    mes += 1;
    if (mes > 11) { mes = 0; anio += 1; }
  }

  return new Date(anio, mes, diaCorte);
}

// ─────────────────────────────────────────────────────────────────────────────
// Error tipado para errores de negocio esperados
// ─────────────────────────────────────────────────────────────────────────────

class InscripcionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InscripcionError";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Server Action principal
// ─────────────────────────────────────────────────────────────────────────────

export async function inscribirAlumna(
  raw: unknown
): Promise<InscripcionAPIResponse> {
  // 1. Validar sesión
  const session = await getServerSession(authOptions);
  if (!session) {
    return { ok: false, error: "No autorizado" };
  }
  const rol = session.user?.rol;
  if (rol !== "ADMIN" && rol !== "RECEPCIONISTA") {
    return { ok: false, error: "Acceso denegado" };
  }

  // 2. Validar payload con Zod
  const parsed = InscripcionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      campos: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const input = parsed.data;
  const esReinscripcion = !!input.alumnaId;

  // 3. Generar password temporal ANTES de la transacción (no en la BD)
  const passwordTemporal = esReinscripcion ? "" : generarPasswordTemporal();

  try {
    const resultado = await withRLS(session, async (tx) => {
      // ── A. Leer configuración ──────────────────────────────────────────────
      const [cfgCuota, cfgCorte] = await Promise.all([
        tx.configuracion.findUnique({ where: { clave: "cuota_inscripcion" } }),
        tx.configuracion.findUnique({ where: { clave: "dia_corte_global" } }),
      ]);

      const cuotaInscripcion = cfgCuota ? parseFloat(cfgCuota.valor) : 0;
      const diaCorte = cfgCorte ? parseInt(cfgCorte.valor, 10) : 1;

      // ── B. Validar grupo y cupo ────────────────────────────────────────────
      const grupo = await tx.grupo.findUnique({
        where: { id: input.grupoId, activo: true },
        include: {
          tarifa: true,
          _count: { select: { disciplinas: true } },
        },
      });

      if (!grupo) throw new InscripcionError("Grupo no encontrado o inactivo");
      if (grupo._count.disciplinas >= grupo.cupo) {
        throw new InscripcionError(`El grupo "${grupo.nombre}" no tiene cupo disponible`);
      }
      if (!grupo.tarifa) {
        throw new InscripcionError(`El grupo "${grupo.nombre}" no tiene tarifa configurada`);
      }

      const precioMensualidad = grupo.tarifa.precioMensualidad.toNumber();

      // ── C. Obtener o crear Conceptos ───────────────────────────────────────
      let conceptoInscripcion = await tx.concepto.findFirst({
        where: { tipo: TipoConcepto.INSCRIPCION, activo: true },
      });
      if (!conceptoInscripcion) {
        conceptoInscripcion = await tx.concepto.create({
          data: {
            nombre: "Cuota de Inscripción",
            tipo: TipoConcepto.INSCRIPCION,
            precioSugerido: cuotaInscripcion,
          },
        });
      }

      let conceptoMensualidad = await tx.concepto.findFirst({
        where: { tipo: TipoConcepto.MENSUALIDAD, activo: true },
      });
      if (!conceptoMensualidad) {
        conceptoMensualidad = await tx.concepto.create({
          data: {
            nombre: "Mensualidad",
            tipo: TipoConcepto.MENSUALIDAD,
            precioSugerido: precioMensualidad,
          },
        });
      }

      // ── D. Resolver padre e identidad de alumna ────────────────────────────
      let padreId: string;
      let alumnaId: string;
      let emailPadre: string;

      if (esReinscripcion) {
        // Reinscripción: verificar alumna existente y reactivar
        const alumnaExistente = await tx.alumna.findUnique({
          where: { id: input.alumnaId },
          include: { padre: true },
        });
        if (!alumnaExistente) throw new InscripcionError("Alumna no encontrada");

        padreId = alumnaExistente.padreId;
        alumnaId = alumnaExistente.id;
        emailPadre = alumnaExistente.padre.email;

        // Actualizar datos de alumna y reactivar
        await tx.alumna.update({
          where: { id: alumnaId },
          data: {
            nombre: input.alumna.nombre,
            apellido: input.alumna.apellido,
            fechaNacimiento: new Date(input.alumna.fechaNacimiento),
            domicilio: input.alumna.domicilio || null,
            institucionEducativa: input.alumna.institucionEducativa || null,
            celular: input.alumna.celular || null,
            emailAlumna: input.alumna.emailAlumna || null,
            otraAcademia: input.infoGeneral.otraAcademia
              ? input.infoGeneral.nombreOtraAcademia || null
              : null,
            enfermedadLesion: input.infoGeneral.tieneEnfermedad
              ? input.infoGeneral.descripcionEnfermedad || null
              : null,
            canalContacto: input.infoGeneral.canalContacto,
            estatus: "ACTIVA",
            fechaInscripcion: new Date(),
          },
        });

        // Actualizar datos del padre/tutor
        const nombreMadre = input.tutor.nombreMadre;
        const nombrePadre = input.tutor.nombrePadre;
        const tutorPrincipal = nombreMadre || nombrePadre;
        const partes = tutorPrincipal.split(" ");

        await tx.usuario.update({
          where: { id: padreId },
          data: {
            nombre: partes[0] || alumnaExistente.padre.nombre,
            apellido: partes.slice(1).join(" ") || alumnaExistente.padre.apellido,
            telefono: input.tutor.celularMadre || input.tutor.celularPadre || null,
            telefonoTrabajo: input.tutor.telefonoTrabajoMadre || input.tutor.telefonoTrabajoPadre || null,
            emailConyuge: nombreMadre ? input.tutor.emailPadre || null : input.tutor.emailMadre || null,
            celularConyuge: nombreMadre ? input.tutor.celularPadre || null : input.tutor.celularMadre || null,
            nombreConyuge: nombreMadre ? input.tutor.nombrePadre || null : input.tutor.nombreMadre || null,
          },
        });
      } else {
        // Nueva inscripción: crear padre + alumna
        const passwordHash = await bcrypt.hash(passwordTemporal, 10);

        const nombreMadre = input.tutor.nombreMadre;
        const nombrePadre = input.tutor.nombrePadre;

        // El email del padre: preferir email de la madre, luego padre, luego email de la alumna
        emailPadre =
          input.tutor.emailMadre ||
          input.tutor.emailPadre ||
          input.alumna.emailAlumna;

        if (!emailPadre) {
          throw new InscripcionError("Se requiere al menos un correo de contacto del tutor");
        }

        // Verificar que el email no esté en uso
        const emailExistente = await tx.usuario.findUnique({
          where: { email: emailPadre },
        });
        if (emailExistente) {
          throw new InscripcionError(
            `El correo ${emailPadre} ya está registrado. Si es reinscripción, usa la búsqueda.`
          );
        }

        // Determinar nombre/apellido del tutor principal
        const tutorNombre = nombreMadre || nombrePadre;
        const partes = tutorNombre.split(" ");
        const nombre = partes[0] || "Tutor";
        const apellido = partes.slice(1).join(" ") || input.alumna.apellido;

        const padre = await tx.usuario.create({
          data: {
            email: emailPadre,
            password: passwordHash,
            nombre,
            apellido,
            telefono: input.tutor.celularMadre || input.tutor.celularPadre || null,
            telefonoTrabajo: input.tutor.telefonoTrabajoMadre || input.tutor.telefonoTrabajoPadre || null,
            nombreConyuge: nombreMadre ? input.tutor.nombrePadre || null : input.tutor.nombreMadre || null,
            celularConyuge: nombreMadre ? input.tutor.celularPadre || null : input.tutor.celularMadre || null,
            emailConyuge: nombreMadre ? input.tutor.emailPadre || null : input.tutor.emailMadre || null,
            telefonoTrabajoConyuge: nombreMadre
              ? input.tutor.telefonoTrabajoPadre || null
              : input.tutor.telefonoTrabajoMadre || null,
            rol: "PADRE",
            activo: true,
          },
        });

        padreId = padre.id;

        const alumna = await tx.alumna.create({
          data: {
            nombre: input.alumna.nombre,
            apellido: input.alumna.apellido,
            fechaNacimiento: new Date(input.alumna.fechaNacimiento),
            domicilio: input.alumna.domicilio || null,
            institucionEducativa: input.alumna.institucionEducativa || null,
            celular: input.alumna.celular || null,
            emailAlumna: input.alumna.emailAlumna || null,
            otraAcademia: input.infoGeneral.otraAcademia
              ? input.infoGeneral.nombreOtraAcademia || null
              : null,
            enfermedadLesion: input.infoGeneral.tieneEnfermedad
              ? input.infoGeneral.descripcionEnfermedad || null
              : null,
            canalContacto: input.infoGeneral.canalContacto,
            estatus: "ACTIVA",
            padreId,
          },
        });

        alumnaId = alumna.id;
      }

      // ── E. Vincular alumna al grupo (AlumnaClase) ──────────────────────────
      await tx.alumnaClase.create({
        data: {
          alumnaId,
          grupoId: input.grupoId,
          // claseId queda null hasta que el grupo tenga Clase operativa asignada
        },
      });

      // ── F. Calcular fechas de vencimiento ──────────────────────────────────
      const hoy = new Date();
      const fechaVencimientoMensualidad = calcularFechaVencimientoMensualidad(diaCorte);

      // ── G. Determinar estados según método de pago ─────────────────────────
      // Transferencia queda PENDIENTE hasta confirmación; efectivo y tarjeta = PAGADO
      const esPagadoInmediato = input.pago.metodoPago !== "TRANSFERENCIA";
      const estadoCargo = esPagadoInmediato ? EstadoCargo.PAGADO : EstadoCargo.PENDIENTE;
      const estadoPago = esPagadoInmediato ? EstadoPago.PAGADO : EstadoPago.PENDIENTE;
      const fechaPago = esPagadoInmediato ? hoy : null;

      // ── H. Crear el registro de Pago ───────────────────────────────────────
      const importeTotal = cuotaInscripcion + precioMensualidad;

      const pago = await tx.pago.create({
        data: {
          importe: importeTotal,
          concepto: `Inscripción ${grupo.nombre} — ${input.alumna.nombre} ${input.alumna.apellido}`,
          fechaVencimiento: hoy,
          fechaPago,
          estado: estadoPago,
          tipo: TipoPago.INSCRIPCION,
          comprobanteUrl: input.pago.comprobanteUrl,
          alumnaId,
          padreId,
        },
      });

      // ── I. Crear Cargos y vincularlos al Pago ─────────────────────────────
      await tx.cargo.createMany({
        data: [
          {
            montoOriginal: cuotaInscripcion,
            descuento: 0,
            montoFinal: cuotaInscripcion,
            fechaVencimiento: hoy,
            fechaPago,
            estado: estadoCargo,
            notas: `Cuota inscripción — método: ${input.pago.metodoPago}`,
            conceptoId: conceptoInscripcion.id,
            alumnaId,
            padreId,
            pagoId: pago.id,
          },
          {
            montoOriginal: precioMensualidad,
            descuento: 0,
            montoFinal: precioMensualidad,
            fechaVencimiento: fechaVencimientoMensualidad,
            fechaPago,
            estado: estadoCargo,
            notas: `Mensualidad ${grupo.nombre} — método: ${input.pago.metodoPago}`,
            conceptoId: conceptoMensualidad.id,
            alumnaId,
            padreId,
            pagoId: pago.id,
          },
        ],
      });

      return { alumnaId, padreId, emailPadre };
    });

    revalidatePath("/admin/inscripciones");
    revalidatePath("/admin/alumnas");

    return {
      ok: true,
      alumnaId: resultado.alumnaId,
      padreId: resultado.padreId,
      emailPadre: resultado.emailPadre,
      passwordTemporal,
    };
  } catch (err) {
    if (err instanceof InscripcionError) {
      return { ok: false, error: err.message };
    }
    console.error("[inscribirAlumna]", err);
    return { ok: false, error: "Error interno al procesar la inscripción" };
  }
}
