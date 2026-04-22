import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { withRLS } from "@/lib/prisma-rls";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  ChevronLeft, MessageCircle, Banknote, CalendarDays, 
  Clock, Award, MapPin, Mail, Phone, ChevronRight
} from "lucide-react";

export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: "Perfil de Profesor | Epic Motion" };
}

export default async function ProfesorProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);

  const maestro = await withRLS(session, (tx) => 
    tx.usuario.findUnique({
      where: { id: params.id, rol: "MAESTRO" },
      include: {
        profesor: {
          include: {
            clasesPrivadas: {
              where: {
                fecha: { gte: new Date() }
              },
              include: {
                alumna: true
              },
              orderBy: { fecha: "asc" },
              take: 5
            }
          }
        },
        gruposComoProfesor: {
          where: { activo: true },
        },
        sesionesComoProfesor: {
          where: { 
            fecha: { gte: startOfMonth },
            estado: { in: ["INICIADA", "COMPLETADA"] }
          },
          include: {
            clase: true
          },
          orderBy: { fecha: "desc" },
          take: 5
        },
        notasComoMaestro: {
          include: {
            alumna: true
          },
          orderBy: { fecha: "desc" },
          take: 5
        }
      }
    })
  );

  if (!maestro || !maestro.profesor) {
    notFound();
  }

  // --- Metrics Calculation ---
  const profDetails = maestro.profesor;
  const numGrupos = maestro.gruposComoProfesor.length;
  const numPrivadas = profDetails.clasesPrivadas.length;

  const totalSesiones = maestro.sesionesComoProfesor.length;
  let puntuales = 0;
  let horasTrabajadas = 0;

  maestro.sesionesComoProfesor.forEach(s => {
    // Puntualidad: Check-in <= horaInicio + 5 mins
    if (s.checkinAt && s.checkinAt <= new Date(s.horaInicio.getTime() + 5 * 60000)) {
      puntuales++;
    } else if (!s.checkinAt && s.estado === "COMPLETADA") {
      puntuales++;
    }

    // Horas trabajadas en el mes
    const diffMs = s.horaFin.getTime() - s.horaInicio.getTime();
    horasTrabajadas += diffMs / (1000 * 60 * 60);
  });

  const porcentajePuntualidad = totalSesiones > 0 ? Math.round((puntuales / totalSesiones) * 100) : 100;
  horasTrabajadas = Math.round(horasTrabajadas * 10) / 10;
  const tarifa = Number(profDetails.tarifaHora || 0);
  const nominaEstimada = (horasTrabajadas * tarifa).toFixed(2);

  const iniciales = `${maestro.nombre.charAt(0)}${maestro.apellido.charAt(0)}`.toUpperCase();
  const waNumber = maestro.telefono?.replace(/\D/g, "") || "";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header / Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link 
          href="/admin/profesores" 
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <ChevronLeft size={16} />
          </div>
          <span className="font-medium">Volver a Profesores</span>
        </Link>
        <div className="flex items-center gap-3">
          <a 
            href={waNumber ? `https://wa.me/${waNumber}` : "#"} 
            target={waNumber ? "_blank" : undefined}
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium text-sm ${waNumber ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20' : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'}`}
          >
            <MessageCircle size={16} />
            <span>WhatsApp</span>
          </a>
          <Link 
            href={`/admin/nomina?profesorId=${maestro.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-epic-gold/10 text-epic-gold hover:bg-epic-gold/20 border border-epic-gold/20 transition-all font-medium text-sm"
          >
            <Banknote size={16} />
            <span>Ver Nómina</span>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="glass rounded-3xl p-1 border border-white/10 overflow-hidden relative shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-epic-gold/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="p-6 lg:p-8 flex flex-col lg:flex-row gap-8 items-start lg:items-center relative z-10">
          {/* Avatar */}
          <div className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-3xl overflow-hidden shrink-0 border border-white/20 shadow-xl">
            {maestro.avatar ? (
              <Image src={maestro.avatar} alt={maestro.nombre} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center text-epic-gold font-montserrat font-bold text-4xl">
                {iniciales}
              </div>
            )}
            <div className={`absolute bottom-3 right-3 w-4 h-4 rounded-full border-2 border-black ${maestro.activo ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]' : 'bg-red-500'}`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl lg:text-4xl font-montserrat font-extrabold text-white tracking-tight">
              {maestro.nombre} {maestro.apellido}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm text-white/60">
                <Mail size={14} className="text-white/40" />
                <span>{maestro.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-white/60">
                <Phone size={14} className="text-white/40" />
                <span>{maestro.telefono || "Sin teléfono"}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              {profDetails?.especialidades?.map((esp, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/80 border border-white/10 font-medium tracking-wide shadow-inner">
                  {esp}
                </span>
              ))}
              {(!profDetails?.especialidades || profDetails.especialidades.length === 0) && (
                <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/40 border border-white/10">Sin especialidad</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Horas Trabajadas */}
        <div className="glass rounded-2xl p-5 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock size={64} />
          </div>
          <p className="text-sm text-white/50 font-medium mb-1 relative z-10">Horas Mes Actual</p>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-montserrat font-bold text-white">{horasTrabajadas}</span>
            <span className="text-xs text-white/40 font-medium">hrs</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 relative z-10">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40">Est. nómina</span>
              <span className="text-epic-gold font-medium">${nominaEstimada}</span>
            </div>
          </div>
        </div>

        {/* Puntualidad */}
        <div className="glass rounded-2xl p-5 border border-white/5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <p className="text-sm text-white/50 font-medium mb-1">Puntualidad</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-montserrat font-bold text-white">{porcentajePuntualidad}</span>
              <span className="text-lg text-white/40">%</span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-epic-gold rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(201,162,39,0.5)]" 
                style={{ width: `${porcentajePuntualidad}%` }}
              />
            </div>
            <p className="text-[10px] text-white/30 mt-1.5 text-right">{totalSesiones} sesiones evaluadas</p>
          </div>
        </div>

        {/* Grupos Activos */}
        <div className="glass rounded-2xl p-5 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Award size={64} />
          </div>
          <p className="text-sm text-white/50 font-medium mb-1 relative z-10">Grupos Regulares</p>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-montserrat font-bold text-white">{numGrupos}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 relative z-10">
            <Link href="#grupos" className="text-xs text-epic-gold hover:text-white transition-colors flex items-center gap-1">
              Ver detalle <ChevronRight size={12} />
            </Link>
          </div>
        </div>

        {/* Clases Privadas */}
        <div className="glass rounded-2xl p-5 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <CalendarDays size={64} />
          </div>
          <p className="text-sm text-white/50 font-medium mb-1 relative z-10">Privadas Próximas</p>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-montserrat font-bold text-white">{numPrivadas}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 relative z-10">
            <Link href="#privadas" className="text-xs text-epic-gold hover:text-white transition-colors flex items-center gap-1">
              Ver calendario <ChevronRight size={12} />
            </Link>
          </div>
        </div>

      </div>

      {/* Detalle de Actividad */}
      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-montserrat font-bold text-white flex items-center gap-2">
          <div className="w-1.5 h-5 bg-epic-gold rounded-full" />
          Detalle de Actividad
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Grupos Asignados */}
          <div className="glass rounded-3xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                <Award size={18} />
              </div>
              <div>
                <h3 className="text-white font-montserrat font-bold">Grupos Regulares</h3>
                <p className="text-xs text-white/40">Grupos que el profesor imparte actualmente</p>
              </div>
            </div>
            
            {maestro.gruposComoProfesor.length > 0 ? (
              <div className="space-y-3">
                {maestro.gruposComoProfesor.map(grupo => (
                  <div key={grupo.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div>
                      <p className="font-medium text-sm text-white">{grupo.nombre}</p>
                      <p className="text-xs text-white/40">{grupo.dias.join(', ')} • {grupo.horaInicio} ({grupo.duracionMinutos} min)</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-bold tracking-wider uppercase border border-blue-500/20">
                      {grupo.categoria}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40 text-center py-6">No tiene grupos regulares asignados.</p>
            )}
          </div>

          {/* Calendario de Clases Privadas */}
          <div className="glass rounded-3xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                <CalendarDays size={18} />
              </div>
              <div>
                <h3 className="text-white font-montserrat font-bold">Clases Privadas</h3>
                <p className="text-xs text-white/40">Próximas sesiones agendadas</p>
              </div>
            </div>

            {profDetails.clasesPrivadas.length > 0 ? (
              <div className="space-y-3">
                {profDetails.clasesPrivadas.map(privada => (
                  <div key={privada.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-white/5 text-center shrink-0">
                      <span className="text-[10px] font-bold text-epic-gold uppercase tracking-wider">{new Date(privada.fecha).toLocaleDateString('es-MX', { month: 'short' })}</span>
                      <span className="text-sm font-bold text-white leading-none mt-1">{new Date(privada.fecha).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white truncate">{privada.alumna.nombre} {privada.alumna.apellido}</p>
                      <p className="text-xs text-white/40">{privada.hora} • {privada.duracion} min</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                      privada.estado === 'AGENDADA' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                      privada.estado === 'PAGADA' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      'bg-white/10 text-white/40 border border-white/10'
                    }`}>
                      {privada.estado}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40 text-center py-6">No hay clases privadas programadas.</p>
            )}
          </div>

          {/* Bitácora de Asistencia */}
          <div className="glass rounded-3xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20">
                <Clock size={18} />
              </div>
              <div>
                <h3 className="text-white font-montserrat font-bold">Bitácora de Asistencia</h3>
                <p className="text-xs text-white/40">Últimas sesiones del mes (Check-in)</p>
              </div>
            </div>

            {maestro.sesionesComoProfesor.length > 0 ? (
              <div className="space-y-3">
                {maestro.sesionesComoProfesor.map(sesion => {
                  const checkin = sesion.checkinAt;
                  const inicio = sesion.horaInicio;
                  const isPuntual = checkin && checkin <= new Date(inicio.getTime() + 5 * 60000);
                  const isRetraso = checkin && !isPuntual;
                  
                  return (
                    <div key={sesion.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-white truncate">{sesion.clase.nombre}</p>
                        <p className="text-xs text-white/40">{new Date(sesion.fecha).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{checkin ? new Date(checkin).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                        <p className={`text-[10px] font-bold tracking-wider uppercase mt-0.5 ${
                          isPuntual ? 'text-green-400' : isRetraso ? 'text-red-400' : 'text-white/30'
                        }`}>
                          {isPuntual ? 'A TIEMPO' : isRetraso ? 'RETRASO' : sesion.estado}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-white/40 text-center py-6">No hay sesiones registradas en el mes actual.</p>
            )}
          </div>

          {/* Notas Enviadas */}
          <div className="glass rounded-3xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                <MessageCircle size={18} />
              </div>
              <div>
                <h3 className="text-white font-montserrat font-bold">Notas Enviadas</h3>
                <p className="text-xs text-white/40">Reportes recientes a alumnas</p>
              </div>
            </div>

            {maestro.notasComoMaestro.length > 0 ? (
              <div className="space-y-3">
                {maestro.notasComoMaestro.map(nota => (
                  <div key={nota.id} className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-xs text-epic-gold uppercase tracking-wider">{nota.alumna.nombre} {nota.alumna.apellido}</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                        nota.estado === 'PUBLICADA' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                        nota.estado === 'APROBADA' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-white/10 text-white/40 border border-white/10'
                      }`}>
                        {nota.estado}
                      </span>
                    </div>
                    <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">{nota.contenido}</p>
                    <p className="text-[10px] text-white/30 mt-2 text-right">{new Date(nota.fecha).toLocaleDateString('es-MX')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40 text-center py-6">No ha enviado notas recientes.</p>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
