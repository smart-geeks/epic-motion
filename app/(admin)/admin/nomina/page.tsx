import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { withRLS } from "@/lib/prisma-rls";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Banknote, Calendar, Clock, DollarSign, Download, Filter, FileText } from "lucide-react";
import Image from "next/image";
import { FMT_MXN } from "@/lib/format";
import TarifaModal from "./TarifaModal";
import BotonExportar from "./BotonExportar";

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

  // 1. Si NO hay profesorId, mostramos la lista de selección
  if (!profesorId) {
    const profesores = await withRLS(session, (tx) =>
      tx.usuario.findMany({
        where: { rol: "MAESTRO" },
        include: {
          profesor: true,
          gruposComoProfesor: { where: { activo: true } },
        },
        orderBy: { nombre: "asc" }
      })
    );

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h1 className="text-3xl font-montserrat font-bold text-white tracking-tight">Módulo de <span className="text-epic-gold">Nómina</span></h1>
          <p className="text-white/50 text-sm mt-1">Selecciona un profesor para gestionar sus horas y pagos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profesores.map((maestro) => {
            const iniciales = `${maestro.nombre.charAt(0)}${maestro.apellido.charAt(0)}`.toUpperCase();
            return (
              <Link 
                key={maestro.id} 
                href={`/admin/nomina?profesorId=${maestro.id}`}
                className="group relative overflow-hidden rounded-[2rem] glass border border-white/5 hover:border-epic-gold/30 bg-white/[0.02] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-xl">
                      {maestro.avatar ? (
                        <Image src={maestro.avatar} alt={maestro.nombre} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center text-epic-gold font-montserrat font-bold text-xl">
                          {iniciales}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-montserrat font-bold text-lg truncate group-hover:text-epic-gold transition-colors">
                        {maestro.nombre} {maestro.apellido}
                      </h3>
                      <p className="text-xs text-white/40 uppercase tracking-widest font-bold mt-1">Profesor de Planta</p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Tarifa Regular</p>
                      <p className="text-sm font-bold text-white">{FMT_MXN.format(Number(maestro.profesor?.tarifaHora || 0))}<span className="text-[10px] text-white/40 font-normal"> /hr</span></p>
                    </div>
                    <div className="w-px h-8 bg-white/5" />
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Tarifa Privada</p>
                      <p className="text-sm font-bold text-epic-gold">{FMT_MXN.format(Number(maestro.profesor?.tarifaPrivada || maestro.profesor?.tarifaHora || 0))}<span className="text-[10px] text-white/40 font-normal"> /hr</span></p>
                    </div>
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-epic-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Si HAY profesorId, mostramos el desglose de horas
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

  const mesActualStr = startOfMonth.toISOString().slice(0, 7);

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
          include: { clase: true },
          orderBy: { fecha: "asc" }
        }
      }
    })
  );

  if (!maestro || !maestro.profesor) notFound();

  const tarifaReg = Number(maestro.profesor.tarifaHora || 0);
  const tarifaPriv = Number(maestro.profesor.tarifaPrivada || tarifaReg);
  
  // Cálculo de horas y subtotales
  let horasRegulares = 0;
  maestro.sesionesComoProfesor.forEach((s) => {
    const diffMs = s.horaFin.getTime() - s.horaInicio.getTime();
    horasRegulares += diffMs / (1000 * 60 * 60);
  });
  
  let horasPrivadas = 0;
  maestro.profesor.clasesPrivadas.forEach((cp) => {
    horasPrivadas += cp.duracion / 60;
  });

  const subtotalRegulares = horasRegulares * tarifaReg;
  const subtotalPrivadas = horasPrivadas * tarifaPriv;
  const totalNomina = subtotalRegulares + subtotalPrivadas;

  // Función para agrupar por semana
  const agruparPorSemana = (items: any[], type: 'sesion' | 'privada') => {
    const semanas: Record<string, { inicio: Date; fin: Date; items: any[]; horas: number; subtotal: number }> = {};
    
    items.forEach(item => {
      const fecha = new Date(item.fecha);
      const diaSemana = fecha.getDay();
      const diff = fecha.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
      const lunes = new Date(fecha.setDate(diff));
      lunes.setHours(0, 0, 0, 0);
      
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);
      domingo.setHours(23, 59, 59, 999);
      
      const key = lunes.toISOString().split('T')[0];
      if (!semanas[key]) {
        semanas[key] = { inicio: lunes, fin: domingo, items: [], horas: 0, subtotal: 0 };
      }
      
      let duracionHrs = 0;
      let tarifa = 0;
      if (type === 'sesion') {
        duracionHrs = (item.horaFin.getTime() - item.horaInicio.getTime()) / (1000 * 60 * 60);
        tarifa = tarifaReg;
      } else {
        duracionHrs = item.duracion / 60;
        tarifa = tarifaPriv;
      }
      
      const monto = duracionHrs * tarifa;
      semanas[key].items.push({ ...item, duracionHrs, monto });
      semanas[key].horas += duracionHrs;
      semanas[key].subtotal += monto;
    });
    
    return Object.values(semanas).sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  };

  const semanasRegulares = agruparPorSemana(maestro.sesionesComoProfesor, 'sesion');
  const semanasPrivadas = agruparPorSemana(maestro.profesor.clasesPrivadas, 'privada');

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Navbar Minimalista */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/nomina"
          className="flex items-center gap-2 text-white/40 hover:text-epic-gold transition-all"
        >
          <ChevronLeft size={18} />
          <span className="font-bold text-xs uppercase tracking-widest">Profesores</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <form className="flex items-center gap-4 px-4 py-2 rounded-2xl glass border border-white/5 bg-white/[0.02]">
            <input type="hidden" name="profesorId" value={profesorId} />
            <Calendar size={16} className="text-epic-gold" />
            <input 
              type="month" 
              name="mes" 
              defaultValue={mesActualStr}
              className="bg-transparent border-none text-white font-bold text-sm focus:ring-0 p-0"
            />
            <button type="submit" className="text-[10px] font-bold text-epic-gold uppercase hover:text-white transition-colors">Ver Periodo</button>
          </form>
          <BotonExportar />
        </div>
      </div>

      {/* Resumen Ejecutivo */}
      <div className="glass rounded-[2rem] p-8 border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-epic-gold/5 blur-[120px] rounded-full -mr-48 -mt-48" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              {maestro.avatar ? (
                <Image src={maestro.avatar} alt={maestro.nombre} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center text-epic-gold font-montserrat font-bold text-2xl">
                  {maestro.nombre[0]}{maestro.apellido[0]}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-montserrat font-bold text-white tracking-tight">{maestro.nombre} {maestro.apellido}</h1>
                <TarifaModal maestro={maestro as any} />
              </div>
              <div className="flex gap-4 mt-2">
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">Regular: {FMT_MXN.format(tarifaReg)}/hr</span>
                <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-wider border border-purple-500/20">Privada: {FMT_MXN.format(tarifaPriv)}/hr</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mb-1">Pago Total Periodo</p>
            <div className="flex items-baseline justify-end gap-2">
              <span className="text-4xl font-extrabold text-white font-montserrat tracking-tighter">{FMT_MXN.format(totalNomina)}</span>
              <span className="text-xs text-epic-gold font-bold">MXN</span>
            </div>
          </div>
        </div>
      </div>

      {/* Relación de Horas por Semana */}
      <div className="space-y-12">
        
        {/* SECCIÓN REGULARES */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 px-4">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Clock size={16} />
            </div>
            <h2 className="text-lg font-montserrat font-bold text-white tracking-wide">Relación de Horas <span className="text-blue-400">Regulares</span></h2>
            <div className="flex-1 h-px bg-white/5 ml-4" />
            <div className="text-right">
              <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Subtotal Regulares</p>
              <p className="text-sm font-bold text-white">{FMT_MXN.format(subtotalRegulares)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {semanasRegulares.length > 0 ? semanasRegulares.map((semana, idx) => (
              <div key={idx} className="glass rounded-3xl border-white/5 overflow-hidden transition-all hover:border-white/10">
                <div className="bg-white/[0.03] px-6 py-4 flex justify-between items-center border-b border-white/5">
                  <p className="text-xs font-bold text-white/60">
                    <span className="text-epic-gold mr-2">SEMANA:</span> 
                    {semana.inicio.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} al {semana.fin.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </p>
                  <div className="flex gap-6">
                    <p className="text-xs font-bold text-white/40 tracking-wider">TOTAL HRS: <span className="text-white ml-1">{semana.horas.toFixed(1)}</span></p>
                    <p className="text-xs font-bold text-white/40 tracking-wider">COSTO: <span className="text-blue-400 ml-1">{FMT_MXN.format(semana.subtotal)}</span></p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-6 py-3 text-[9px] font-bold text-white/20 uppercase tracking-widest">Fecha</th>
                        <th className="px-6 py-3 text-[9px] font-bold text-white/20 uppercase tracking-widest">Clase / Grupo</th>
                        <th className="px-6 py-3 text-[9px] font-bold text-white/20 uppercase tracking-widest text-center">Horas</th>
                        <th className="px-6 py-3 text-[9px] font-bold text-white/20 uppercase tracking-widest text-right">Costo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {semana.items.map(s => (
                        <tr key={s.id} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-white/80">{new Date(s.fecha).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-medium text-white/60">{s.clase.nombre}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-xs font-bold text-white/40 group-hover:text-white transition-colors">{s.duracionHrs.toFixed(1)} <span className="text-[10px] font-normal">hrs</span></p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-xs font-bold text-blue-400/80">{FMT_MXN.format(s.monto)}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )) : (
              <div className="glass rounded-[2rem] p-12 border-white/5 text-center text-white/10 italic text-sm">No se registraron horas regulares en este periodo.</div>
            )}
          </div>
        </div>

        {/* SECCIÓN PRIVADAS */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 px-4">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
              <Calendar size={16} />
            </div>
            <h2 className="text-lg font-montserrat font-bold text-white tracking-wide">Relación de Horas <span className="text-purple-400">Privadas</span></h2>
            <div className="flex-1 h-px bg-white/5 ml-4" />
            <div className="text-right">
              <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Subtotal Privadas</p>
              <p className="text-sm font-bold text-epic-gold">{FMT_MXN.format(subtotalPrivadas)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {semanasPrivadas.length > 0 ? semanasPrivadas.map((semana, idx) => (
              <div key={idx} className="glass rounded-3xl border-white/5 overflow-hidden transition-all hover:border-white/10">
                <div className="bg-white/[0.03] px-6 py-4 flex justify-between items-center border-b border-white/5">
                  <p className="text-xs font-bold text-white/60">
                    <span className="text-purple-400 mr-2">SEMANA:</span> 
                    {semana.inicio.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} al {semana.fin.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </p>
                  <div className="flex gap-6">
                    <p className="text-xs font-bold text-white/40 tracking-wider">TOTAL HRS: <span className="text-white ml-1">{semana.horas.toFixed(1)}</span></p>
                    <p className="text-xs font-bold text-white/40 tracking-wider">COSTO: <span className="text-purple-400 ml-1">{FMT_MXN.format(semana.subtotal)}</span></p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-6 py-3 text-[9px] font-bold text-white/20 uppercase tracking-widest">Fecha</th>
                        <th className="px-6 py-3 text-[9px] font-bold text-white/20 uppercase tracking-widest">Alumna</th>
                        <th className="px-6 py-3 text-[9px] font-bold text-white/20 uppercase tracking-widest text-center">Horas</th>
                        <th className="px-6 py-3 text-[9px] font-bold text-white/20 uppercase tracking-widest text-right">Costo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {semana.items.map(cp => (
                        <tr key={cp.id} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className={`w-1.5 h-1.5 rounded-full ${cp.prepagoId ? 'bg-green-400' : 'bg-yellow-400'}`} />
                            <p className="text-xs font-bold text-white/80">{new Date(cp.fecha).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-medium text-white/60">{cp.alumna.nombre} {cp.alumna.apellido}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-xs font-bold text-white/40 group-hover:text-white transition-colors">{cp.duracionHrs.toFixed(1)} <span className="text-[10px] font-normal">hrs</span></p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-xs font-bold text-purple-400/80">{FMT_MXN.format(cp.monto)}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )) : (
              <div className="glass rounded-[2rem] p-12 border-white/5 text-center text-white/10 italic text-sm">No se registraron clases privadas en este periodo.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

