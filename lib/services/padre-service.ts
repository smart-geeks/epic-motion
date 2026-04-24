import { prisma } from '@/lib/prisma';

// ─────────────────────────────────────────────
// Tipos de retorno
// ─────────────────────────────────────────────

export type HijaResumen = {
  id: string;
  nombre: string;
  apellido: string;
  foto: string | null;
  estatus: string;
  fechaInscripcion: Date;
  grupo: {
    id: string;
    nombre: string;
    categoria: string;
    dias: string[];
    horaInicio: string;
    disciplinas: { nombre: string; color: string | null }[];
  } | null;
  asistenciasMes: { presente: number; tarde: number; ausente: number };
  notasRecientes: {
    id: string;
    contenido: string;
    tipo: string;
    fecha: Date;
    maestro: string;
  }[];
  logros: { id: string; nombre: string; icono: string | null; puntos: number }[];
};

export type CargoResumen = {
  id: string;
  concepto: string;
  monto: number;
  fechaVencimiento: Date;
  estado: string;
  hija: string;
  tipo: string;
};

export type NoticiaResumen = {
  id: string;
  titulo: string;
  cuerpo: string;
  imagenUrl: string | null;
  fecha: Date;
  leida: boolean;
};

export type EventoResumen = {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  fecha: Date;
  ubicacion: string | null;
};

export type NotificacionResumen = {
  id: string;
  tipo: string;
  titulo: string;
  cuerpo: string | null;
  leida: boolean;
  fecha: Date;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// ─────────────────────────────────────────────
// Hijas del padre
// ─────────────────────────────────────────────

export async function getHijasByPadre(padreId: string): Promise<HijaResumen[]> {
  const alumnas = await prisma.alumna.findMany({
    where: { padreId },
    include: {
      clases: {
        include: {
          grupo: {
            include: {
              disciplinasGrupo: {
                include: { disciplina: true },
              },
            },
          },
        },
      },
      asistencias: {
        where: { createdAt: { gte: startOfMonth() } },
      },
      notas: {
        where: { estado: "PUBLICADA" },
        orderBy: { fecha: "desc" },
        take: 3,
        include: { maestro: true },
      },
      logros: {
        orderBy: { fechaDesbloqueo: "desc" },
        take: 5,
      },
    },
    orderBy: { nombre: "asc" },
  });

  return alumnas.map((a) => {
    const grupoActual = a.clases[0]?.grupo ?? null;
    const asistencias = a.asistencias;

    return {
      id: a.id,
      nombre: a.nombre,
      apellido: a.apellido,
      foto: a.foto,
      estatus: a.estatus,
      fechaInscripcion: a.fechaInscripcion,
      grupo: grupoActual
        ? {
            id: grupoActual.id,
            nombre: grupoActual.nombre,
            categoria: grupoActual.categoria,
            dias: grupoActual.dias,
            horaInicio: grupoActual.horaInicio,
            disciplinas: grupoActual.disciplinasGrupo.map((gd) => ({
              nombre: gd.disciplina.nombre,
              color: gd.disciplina.color,
            })),
          }
        : null,
      asistenciasMes: {
        presente: asistencias.filter((a) => a.estado === "PRESENTE").length,
        tarde: asistencias.filter((a) => a.estado === "TARDE").length,
        ausente: asistencias.filter((a) => a.estado === "AUSENTE").length,
      },
      notasRecientes: a.notas.map((n) => ({
        id: n.id,
        contenido: n.contenido,
        tipo: n.tipo,
        fecha: n.fecha,
        maestro: `${n.maestro.nombre} ${n.maestro.apellido}`,
      })),
      logros: a.logros.map((l) => ({
        id: l.id,
        nombre: l.nombre,
        icono: l.icono,
        puntos: l.puntos,
      })),
    };
  });
}

// ─────────────────────────────────────────────
// Cargos pendientes / historial de pagos
// ─────────────────────────────────────────────

export async function getCargosByPadre(padreId: string): Promise<CargoResumen[]> {
  const cargos = await prisma.cargo.findMany({
    where: { padreId },
    include: { alumna: true, concepto: { select: { nombre: true, tipo: true } } },
    orderBy: { fechaVencimiento: "asc" },
  });

  return cargos.map((c) => ({
    id: c.id,
    concepto: c.concepto.nombre,
    monto: Number(c.montoFinal),
    fechaVencimiento: c.fechaVencimiento,
    estado: c.estado,
    hija: `${c.alumna.nombre} ${c.alumna.apellido}`,
    tipo: c.concepto.tipo,
  }));
}

// ─────────────────────────────────────────────
// Noticias activas + estado de lectura
// ─────────────────────────────────────────────

export async function getNoticiasByPadre(padreId: string): Promise<NoticiaResumen[]> {
  const noticias = await prisma.noticia.findMany({
    where: { activa: true },
    orderBy: { fecha: "desc" },
    include: {
      lecturas: {
        where: { padreId },
      },
    },
  });

  return noticias.map((n) => ({
    id: n.id,
    titulo: n.titulo,
    cuerpo: n.cuerpo,
    imagenUrl: n.imagenUrl,
    fecha: n.fecha,
    leida: n.lecturas.length > 0,
  }));
}

// ─────────────────────────────────────────────
// Eventos futuros
// ─────────────────────────────────────────────

export async function getEventosFuturos(): Promise<EventoResumen[]> {
  const hoy = new Date();

  const eventos = await prisma.evento.findMany({
    where: {
      activo: true,
      fecha: { gte: hoy },
    },
    orderBy: { fecha: "asc" },
    take: 20,
  });

  return eventos.map((e) => ({
    id: e.id,
    tipo: e.tipo,
    titulo: e.titulo,
    descripcion: e.descripcion,
    fecha: e.fecha,
    ubicacion: e.ubicacion,
  }));
}

// ─────────────────────────────────────────────
// Notificaciones del padre
// ─────────────────────────────────────────────

export async function getNotificacionesByPadre(
  padreId: string
): Promise<NotificacionResumen[]> {
  const notificaciones = await prisma.notificacion.findMany({
    where: { usuarioId: padreId },
    orderBy: { fecha: "desc" },
    take: 50,
  });

  return notificaciones.map((n) => ({
    id: n.id,
    tipo: n.tipo,
    titulo: n.titulo,
    cuerpo: n.cuerpo,
    leida: n.leida,
    fecha: n.fecha,
  }));
}

export async function getUnreadNotificacionesCount(padreId: string): Promise<number> {
  return prisma.notificacion.count({
    where: { usuarioId: padreId, leida: false },
  });
}

// ─────────────────────────────────────────────
// Resumen para el Home
// ─────────────────────────────────────────────

export type HomeResumen = {
  cargosCriticos: CargoResumen[];  // VENCIDO o vence en ≤7 días
  noticias: NoticiaResumen[];
  hijas: { id: string; nombre: string; foto: string | null }[];
  unreadCount: number;
};

export async function getHomeResumen(padreId: string): Promise<HomeResumen> {
  const ahora = new Date();
  const en7Dias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [cargos, noticias, hijas, unreadCount] = await Promise.all([
    prisma.cargo.findMany({
      where: {
        padreId,
        OR: [
          { estado: "VENCIDO" },
          { estado: "PENDIENTE", fechaVencimiento: { lte: en7Dias } },
        ],
      },
      include: { alumna: true, concepto: { select: { nombre: true, tipo: true } } },
      orderBy: { fechaVencimiento: "asc" },
    }),
    getNoticiasByPadre(padreId),
    prisma.alumna.findMany({
      where: { padreId },
      select: { id: true, nombre: true, foto: true },
    }),
    getUnreadNotificacionesCount(padreId),
  ]);

  return {
    cargosCriticos: cargos.map((c) => ({
      id: c.id,
      concepto: c.concepto.nombre,
      monto: Number(c.montoFinal),
      fechaVencimiento: c.fechaVencimiento,
      estado: c.estado,
      hija: `${c.alumna.nombre} ${c.alumna.apellido}`,
      tipo: c.concepto.tipo,
    })),
    noticias,
    hijas,
    unreadCount,
  };
}

// ─────────────────────────────────────────────
// Marcar noticia como leída
// ─────────────────────────────────────────────

export async function marcarNoticiaLeida(
  noticiaId: string,
  padreId: string
): Promise<void> {
  await prisma.lecturaNoticia.upsert({
    where: { noticiaId_padreId: { noticiaId, padreId } },
    create: { noticiaId, padreId },
    update: { fechaLectura: new Date() },
  });
}

// ─────────────────────────────────────────────
// Marcar notificación como leída
// ─────────────────────────────────────────────

export async function marcarNotificacionLeida(
  notificacionId: string,
  padreId: string
): Promise<void> {
  await prisma.notificacion.updateMany({
    where: { id: notificacionId, usuarioId: padreId },
    data: { leida: true },
  });
}
