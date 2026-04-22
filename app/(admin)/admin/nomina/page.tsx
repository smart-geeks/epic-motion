import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { withRLS } from "@/lib/prisma-rls";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Banknote, Calendar, Clock, DollarSign, Download, Filter, FileText } from "lucide-react";
import Image from "next/image";
import { FMT_MXN } from "@/lib/format";

export async function generateMetadata() {
  return { title: "Nómina Detallada | Epic Motion" };
}

export default async function NominaPage({
  searchParams,
}: {
  searchParams: { profesorId?: string; mes?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const profesorId = searchParams.profesorId;
  
  if (!profesorId) {
    // Si no hay profesor seleccionado, por ahora redirigimos al directorio de profesores
    // En un futuro esto podría ser una vista general de nóminas de todo el staff
    redirect('/admin/profesores');
  }

  // Parsear el mes seleccionado (formato YYYY-MM) o usar el mes actual
  const hoy = new Date();
  let startOfMonth = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  let endOfMonth = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);

  if (searchParams.mes) {
    const [year, month] = searchParams.mes.split('-');
    if (year && month) {
      startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
      endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    }
  }

  const mesActualStr = startOfMonth.toISOString().slice(0, 7); // 'YYYY-MM'

  const maestro = await withRLS(session, (tx) =>
    tx.usuario.findUnique({
      where: { id: profesorId, rol: "MAESTRO" },
      include: {
        profesor: {
          include: {
            clasesPrivadas: {
              where: {
                fecha: { gte: startOfMonth, lte: endOfMonth },
                estado: { in: ["COMPLETADA", "PAGADA"] }
              },
              include: { alumna: true },
              orderBy: { fecha: "asc" }
            }
          }
        },
        sesionesComoProfesor: {
          where: {
            fecha: { gte: startOfMonth, lte: endOfMonth },
            estado: { in: ["INICIADA", "COMPLETADA"] }
          },
          include: {
            clase: true
          },
          orderBy: { fecha: "asc" }
        }
      }
    })
  );

  if (!maestro || !maestro.profesor) {
    notFound();
  }

  // ── Cálculos de Nómina ───────────────────────────────────────────────────────
  const tarifaPorHora = Number(maestro.profesor.tarifaHora || 0);
  
  let horasRegulares = 0;
  maestro.sesionesComoProfesor.forEach((s) => {
    const diffMs = s.horaFin.getTime() - s.horaInicio.getTime();
    horasRegulares += diffMs / (1000 * 60 * 60);
  });
  
  let horasPrivadas = 0;
  maestro.profesor.clasesPrivadas.forEach((cp) => {
    horasPrivadas += cp.duracion / 60;
  });

  const subtotalRegulares = horasRegulares * tarifaPorHora;
  const subtotalPrivadas = horasPrivadas * tarifaPorHora;
  const totalNomina = subtotalRegulares + subtotalPrivadas;
  const totalHoras = horasRegulares + horasPrivadas;

  const iniciales = `${maestro.nombre.charAt(0)}${maestro.apellido.charAt(0)}`.toUpperCase();

  // Helper para agrupar sesiones por semana o mostrar listado (aqui lo mostraremos plano por MVP)
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header / Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href={`/admin/profesores/${profesorId}`}
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <ChevronLeft size={16} />
          </div>
          <span className="font-medium">Volver al Perfil</span>
        </Link>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium text-sm bg-white/5 text-white hover:bg-white/10 border border-white/10">
            <Download size={16} />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Título de Sección */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-montserrat font-bold text-white tracking-tight">
            Nómina Detallada
          </h1>
          <p className="mt-1 text-sm font-inter text-white/40">
            Desglose de clases regulares y privadas para el periodo seleccionado.
          </p>
        </div>

        {/* Filtro de Mes (Solo UI demostrativa por ahora, en el futuro será un form o un router.push) */}
        <form className="flex items-center gap-2 p-1.5 rounded-2xl glass border border-white/10 shrink-0">
          <div className="pl-3 text-white/40">
            <Calendar size={16} />
          </div>
          <input type="hidden" name="profesorId" value={profesorId} />
          <input 
            type="month" 
            name="mes" 
            defaultValue={mesActualStr}
            className="bg-transparent border-none text-white font-medium text-sm focus:ring-0 cursor-pointer p-2 w-[160px]"
          />
          <button type="submit" className="px-3 py-1.5 rounded-xl bg-epic-gold/20 text-epic-gold text-xs font-bold hover:bg-epic-gold/30 transition-colors">
            Filtrar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resumen Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tarjeta del Profesor */}
          <div className="glass rounded-3xl p-6 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-epic-gold/5 via-transparent to-transparent pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                {maestro.avatar ? (
                  <Image src={maestro.avatar} alt={maestro.nombre} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-black/50 flex items-center justify-center text-epic-gold font-montserrat font-bold text-xl">
                    {iniciales}
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-montserrat font-bold text-white text-lg leading-tight">
                  {maestro.nombre} {maestro.apellido}
                </h2>
                <p className="text-sm text-epic-gold mt-1 font-medium">{FMT_MXN.format(tarifaPorHora)} / hora</p>
              </div>
            </div>
          </div>

          {/* Gran Total */}
          <div className="glass rounded-3xl p-6 border border-epic-gold/20 shadow-[0_0_30px_rgba(201,162,39,0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Banknote size={80} />
            </div>
            <h3 className="font-montserrat font-bold text-white/50 text-sm uppercase tracking-widest relative z-10">Total a Pagar</h3>
            <div className="mt-2 flex items-baseline gap-2 relative z-10">
              <span className="text-4xl font-montserrat font-extrabold text-epic-gold">{FMT_MXN.format(totalNomina)}</span>
              <span className="text-sm text-white/40 font-medium">MXN</span>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/10 space-y-3 relative z-10">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/60">Clases Regulares</span>
                <span className="text-white font-medium">{FMT_MXN.format(subtotalRegulares)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/60">Clases Privadas</span>
                <span className="text-white font-medium">{FMT_MXN.format(subtotalPrivadas)}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-white/5">
                <span className="text-white/40">Total Horas</span>
                <span className="text-white/80">{totalHoras.toFixed(1)} hrs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tablas de Desglose */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Desglose Regulares */}
          <div className="glass rounded-3xl overflow-hidden border border-white/5">
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Clock size={16} />
                </div>
                <h3 className="font-montserrat font-bold text-white">Sesiones Regulares</h3>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">{horasRegulares.toFixed(1)} hrs</p>
              </div>
            </div>
            <div className="p-2">
              {maestro.sesionesComoProfesor.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {maestro.sesionesComoProfesor.map((sesion) => {
                    const diffMs = sesion.horaFin.getTime() - sesion.horaInicio.getTime();
                    const hrs = diffMs / (1000 * 60 * 60);
                    return (
                      <div key={sesion.id} className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 p-3 hover:bg-white/5 transition-colors rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-white truncate">{sesion.clase.nombre}</p>
                          <p className="text-xs text-white/40">{new Date(sesion.fecha).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <p className="text-sm text-white/60">{hrs.toFixed(1)} hrs</p>
                            <p className="text-[10px] text-white/30 uppercase tracking-wider">{sesion.estado}</p>
                          </div>
                          <div className="w-20">
                            <p className="text-sm font-medium text-white">{FMT_MXN.format(hrs * tarifaPorHora)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-white/40 text-sm flex flex-col items-center">
                  <FileText size={24} className="mb-2 opacity-20" />
                  No hay sesiones regulares completadas en este periodo.
                </div>
              )}
            </div>
          </div>

          {/* Desglose Privadas */}
          <div className="glass rounded-3xl overflow-hidden border border-white/5">
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Calendar size={16} />
                </div>
                <h3 className="font-montserrat font-bold text-white">Clases Privadas</h3>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">{horasPrivadas.toFixed(1)} hrs</p>
              </div>
            </div>
            <div className="p-2">
              {maestro.profesor.clasesPrivadas.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {maestro.profesor.clasesPrivadas.map((privada) => {
                    const hrs = privada.duracion / 60;
                    return (
                      <div key={privada.id} className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 p-3 hover:bg-white/5 transition-colors rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-white truncate">Alumna: {privada.alumna.nombre} {privada.alumna.apellido}</p>
                          <p className="text-xs text-white/40">{new Date(privada.fecha).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })} • {privada.hora}</p>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <p className="text-sm text-white/60">{hrs.toFixed(1)} hrs</p>
                            <p className="text-[10px] text-white/30 uppercase tracking-wider">{privada.estado}</p>
                          </div>
                          <div className="w-20">
                            <p className="text-sm font-medium text-white">{FMT_MXN.format(hrs * tarifaPorHora)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-white/40 text-sm flex flex-col items-center">
                  <FileText size={24} className="mb-2 opacity-20" />
                  No hay clases privadas en este periodo.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
