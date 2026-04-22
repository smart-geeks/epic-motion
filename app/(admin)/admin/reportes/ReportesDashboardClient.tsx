'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, AlertCircle, DollarSign, Wallet, ArrowUpRight, ArrowDownRight,
  Users, UserPlus, GraduationCap, UserCheck, Clock, CalendarCheck
} from 'lucide-react';
import type { MetricasFinancieras } from '@/lib/services/reportes-financieros-service';
import type { MetricasOperativas } from '@/lib/services/reportes-operativos-service';

// Importación dinámica de Recharts para evitar errores de hidratación
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });

const COLORS = ['#FFB800', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#F43F5E'];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

function formatCurrency(value: number) {
  if (value === undefined || value === null || isNaN(value)) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ReportesDashboardClient({ 
  dataFinanzas, dataOperativa 
}: { 
  dataFinanzas: MetricasFinancieras,
  dataOperativa: MetricasOperativas
}) {
  const [activeTab, setActiveTab] = useState<'FINANZAS' | 'ALUMNAS' | 'STAFF'>('FINANZAS');

  // Aseguramos que los arrays existan antes de mapear
  const pieDataFinanzas = (dataFinanzas?.ingresosPorCategoria || []).map((item) => ({
    name: item.categoria || 'Otro',
    value: item.monto || 0
  }));

  const pieDataDisciplinas = (dataOperativa?.alumnas?.distribucionDisciplinas || []).map((item) => ({
    name: item.nombre || 'Otro',
    value: item.cantidad || 0
  }));

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-epic-gold/30 hidden sm:block" />
            <p className="font-montserrat font-bold text-[10px] tracking-[0.25em] uppercase text-white/30">
              Reportes & Analíticas
            </p>
          </div>
          <h1 className="text-3xl font-montserrat font-extrabold text-white tracking-tight">
            Desempeño <span className="text-epic-gold">Global</span>
          </h1>
          <p className="text-sm font-inter text-white/40">
            Métricas operativas, financieras y de rendimiento de la academia.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white/5 backdrop-blur-md rounded-2xl w-full sm:w-fit border border-white/10">
        {(['FINANZAS', 'ALUMNAS', 'STAFF'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 sm:flex-none relative px-6 py-2.5 text-xs font-bold font-montserrat tracking-wider rounded-xl transition-colors ${
              activeTab === tab ? 'text-black' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="activeTabReportes"
                className="absolute inset-0 bg-epic-gold rounded-xl shadow-[0_0_15px_rgba(255,184,0,0.3)]"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'FINANZAS' && (
          <motion.div 
            key="FINANZAS"
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div variants={cardVariants} className="glass-card rounded-[2rem] p-5 relative overflow-hidden group">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <TrendingUp className="text-blue-400 w-6 h-6" />
                </div>
                <p className="text-[11px] font-montserrat font-bold text-white/40 uppercase tracking-wider">Ingreso Proyectado</p>
                <p className="text-2xl font-montserrat font-extrabold text-white mt-1">{formatCurrency(dataFinanzas.ingresosProyectados)}</p>
                <p className="text-[10px] font-inter text-white/30 mt-1">Esperado este mes</p>
              </motion.div>

              <motion.div variants={cardVariants} className="glass-card rounded-[2rem] p-5 relative overflow-hidden group">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                  <Wallet className="text-green-400 w-6 h-6" />
                </div>
                <p className="text-[11px] font-montserrat font-bold text-white/40 uppercase tracking-wider">Ingreso Real</p>
                <p className="text-2xl font-montserrat font-extrabold text-green-400 mt-1">{formatCurrency(dataFinanzas.ingresosReales)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {dataFinanzas.porcentajeCobranza >= 80 ? (
                     <ArrowUpRight className="text-green-400 w-3 h-3" />
                  ) : (
                     <ArrowDownRight className="text-red-400 w-3 h-3" />
                  )}
                  <p className="text-[10px] font-inter text-white/30">{dataFinanzas.porcentajeCobranza.toFixed(1)}% de cobranza</p>
                </div>
              </motion.div>

              <motion.div variants={cardVariants} className="glass-card rounded-[2rem] p-5 relative overflow-hidden group">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                  <AlertCircle className="text-red-400 w-6 h-6" />
                </div>
                <p className="text-[11px] font-montserrat font-bold text-white/40 uppercase tracking-wider">Morosidad Total</p>
                <p className="text-2xl font-montserrat font-extrabold text-red-400 mt-1">{formatCurrency(dataFinanzas.morosidadTotal)}</p>
                <p className="text-[10px] font-inter text-white/30 mt-1">Cargos vencidos y pendientes</p>
              </motion.div>

              <motion.div variants={cardVariants} className="glass-card rounded-[2rem] p-5 relative overflow-hidden group">
                <div className="w-12 h-12 rounded-2xl bg-epic-gold/10 flex items-center justify-center mb-4">
                  <DollarSign className="text-epic-gold w-6 h-6" />
                </div>
                <p className="text-[11px] font-montserrat font-bold text-white/40 uppercase tracking-wider">Brecha</p>
                <p className="text-2xl font-montserrat font-extrabold text-white mt-1">
                  {formatCurrency(dataFinanzas.ingresosProyectados - dataFinanzas.ingresosReales)}
                </p>
                <p className="text-[10px] font-inter text-white/30 mt-1">Por recaudar este mes</p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div variants={cardVariants} className="glass-card rounded-[2.5rem] p-6 lg:col-span-2">
                <h3 className="font-montserrat font-bold text-white text-sm mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  Tendencia de Ingresos (6 Meses)
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataFinanzas.tendenciaMeses} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="mes" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', backdropFilter: 'blur(10px)' }} formatter={(value: number) => formatCurrency(value)} labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px', fontWeight: 'bold' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="proyectado" name="Proyectado" fill="#FFB800" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="ingreso" name="Ingreso Real" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div variants={cardVariants} className="glass-card rounded-[2.5rem] p-6 flex flex-col">
                <h3 className="font-montserrat font-bold text-white text-sm mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-epic-gold" />
                  Distribución de Ingresos
                </h3>
                <p className="text-xs text-white/30 mb-4">Ingresos reales del mes actual por categoría</p>
                <div className="h-[200px] w-full flex-1">
                  {pieDataFinanzas.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieDataFinanzas} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                          {pieDataFinanzas.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }} formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white/20 text-xs">No hay pagos registrados este mes.</div>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  {pieDataFinanzas.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-xs text-white/60">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-white">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {activeTab === 'ALUMNAS' && (
          <motion.div 
            key="ALUMNAS"
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.div variants={cardVariants} className="glass-card rounded-[2rem] p-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <Users className="text-blue-400 w-6 h-6" />
                </div>
                <p className="text-[11px] font-montserrat font-bold text-white/40 uppercase tracking-wider">Total Activas</p>
                <p className="text-2xl font-montserrat font-extrabold text-white mt-1">{dataOperativa.alumnas.activas}</p>
                <p className="text-[10px] font-inter text-white/30 mt-1">Alumnas cursando actualmente</p>
              </motion.div>
              <motion.div variants={cardVariants} className="glass-card rounded-[2rem] p-5">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                  <UserPlus className="text-green-400 w-6 h-6" />
                </div>
                <p className="text-[11px] font-montserrat font-bold text-white/40 uppercase tracking-wider">Nuevas Inscripciones</p>
                <p className="text-2xl font-montserrat font-extrabold text-green-400 mt-1">+{dataOperativa.alumnas.nuevasEsteMes}</p>
                <p className="text-[10px] font-inter text-white/30 mt-1">Registradas este mes</p>
              </motion.div>
              <motion.div variants={cardVariants} className="glass-card rounded-[2rem] p-5">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                  <AlertCircle className="text-red-400 w-6 h-6" />
                </div>
                <p className="text-[11px] font-montserrat font-bold text-white/40 uppercase tracking-wider">Inactivas / Bajas</p>
                <p className="text-2xl font-montserrat font-extrabold text-red-400 mt-1">{dataOperativa.alumnas.inactivas}</p>
                <p className="text-[10px] font-inter text-white/30 mt-1">Histórico de bajas</p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={cardVariants} className="glass-card rounded-[2.5rem] p-6 flex flex-col">
                <h3 className="font-montserrat font-bold text-white text-sm mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  Distribución por Disciplina
                </h3>
                <p className="text-xs text-white/30 mb-4">Alumnas inscritas según especialidad</p>
                <div className="h-[250px] w-full flex-1">
                  {pieDataDisciplinas.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieDataDisciplinas} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                          {pieDataDisciplinas.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white/20 text-xs">Sin información de disciplinas.</div>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {pieDataDisciplinas.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between bg-white/5 p-2 px-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-xs font-bold text-white/70">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {activeTab === 'STAFF' && (
          <motion.div 
            key="STAFF"
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.div variants={cardVariants} className="glass-card rounded-[2rem] p-5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-epic-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-2xl bg-epic-gold/10 flex items-center justify-center mb-4 relative z-10">
                  <DollarSign className="text-epic-gold w-6 h-6" />
                </div>
                <p className="text-[11px] font-montserrat font-bold text-white/40 uppercase tracking-wider relative z-10">Nómina Estimada Mes</p>
                <p className="text-2xl font-montserrat font-extrabold text-white mt-1 relative z-10">{formatCurrency(dataOperativa.staff.nominaProyectada)}</p>
                <p className="text-[10px] font-inter text-white/30 mt-1 relative z-10">Basado en clases impartidas</p>
              </motion.div>

              <motion.div variants={cardVariants} className="glass-card rounded-[2rem] p-5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4 relative z-10">
                  <Clock className="text-green-400 w-6 h-6" />
                </div>
                <p className="text-[11px] font-montserrat font-bold text-white/40 uppercase tracking-wider relative z-10">Puntualidad Global</p>
                <p className="text-2xl font-montserrat font-extrabold text-green-400 mt-1 relative z-10">{dataOperativa.staff.puntualidadPromedio.toFixed(1)}%</p>
                <p className="text-[10px] font-inter text-white/30 mt-1 relative z-10">Promedio de Check-in a tiempo</p>
              </motion.div>

              <motion.div variants={cardVariants} className="glass-card rounded-[2rem] p-5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 relative z-10">
                  <CalendarCheck className="text-blue-400 w-6 h-6" />
                </div>
                <p className="text-[11px] font-montserrat font-bold text-white/40 uppercase tracking-wider relative z-10">Sesiones Impartidas</p>
                <p className="text-2xl font-montserrat font-extrabold text-white mt-1 relative z-10">{dataOperativa.staff.totalSesiones}</p>
                <p className="text-[10px] font-inter text-white/30 mt-1 relative z-10">Total acumulado en el mes</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
