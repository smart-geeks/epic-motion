"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, X, MessageCircle, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import type { CargoResumen } from "@/lib/services/padre-service";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ─── helpers ─────────────────────────────────────────────────────────────────

function estadoConfig(estado: string, fechaVencimiento: Date) {
  const dias = Math.ceil((new Date(fechaVencimiento).getTime() - Date.now()) / 86_400_000);
  if (estado === "PAGADO")   return { label: "Pagado",   color: "#22c55e", bg: "rgba(34,197,94,0.12)",    icon: CheckCircle2 };
  if (estado === "VENCIDO" || dias < 0) return { label: "Vencido",  color: "#FF5B5B", bg: "rgba(255,91,91,0.12)",   icon: AlertTriangle };
  if (dias <= 7)             return { label: `${dias}d`,  color: "#C9A227", bg: "rgba(201,162,39,0.12)",  icon: Clock };
  return                            { label: "Pendiente", color: "rgba(255,255,255,0.45)", bg: "rgba(255,255,255,0.06)", icon: Clock };
}

// ─── Modal de detalle de cargo ────────────────────────────────────────────────

function CargoModal({ cargo, onClose }: { cargo: CargoResumen; onClose: () => void }) {
  const cfg = estadoConfig(cargo.estado, cargo.fechaVencimiento);
  const Icon = cfg.icon;
  const waMsg = encodeURIComponent(
    `Hola! Me gustaría pagar el cargo de ${cargo.concepto} por $${cargo.monto.toLocaleString("es-MX")} MXN de ${cargo.hija}. ¿Me pueden orientar?`
  );

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} />

      <motion.div
        className="relative w-full max-w-2xl mx-auto rounded-t-3xl overflow-hidden"
        style={{
          background: "rgba(16,16,16,0.98)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderBottom: "none",
          boxShadow: "0 -16px 60px rgba(0,0,0,0.8)",
        }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 35 }}
        onClick={(e) => e.stopPropagation()}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
        </div>

        <div className="px-5 pb-8 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-inter uppercase tracking-widest mb-1"
                style={{ color: "rgba(255,255,255,0.35)" }}>Detalle del cargo</p>
              <h2 className="text-lg font-montserrat font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>
                {cargo.concepto}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full"
              style={{ background: "rgba(255,255,255,0.06)" }} aria-label="Cerrar">
              <X size={16} style={{ color: "rgba(255,255,255,0.6)" }} />
            </button>
          </div>

          {/* Monto prominente */}
          <div className="rounded-2xl p-5 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(201,162,39,0.12) 0%, rgba(201,162,39,0.05) 100%)",
              border: "1px solid rgba(201,162,39,0.25)",
            }}>
            <p className="text-xs font-inter mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Total a pagar</p>
            <p className="text-4xl font-montserrat font-bold tracking-tight"
              style={{ color: "#C9A227" }}>
              ${cargo.monto.toLocaleString("es-MX")}
              <span className="text-base ml-1.5 font-normal" style={{ color: "rgba(201,162,39,0.6)" }}>MXN</span>
            </p>
          </div>

          {/* Detalles */}
          <div className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { label: "Alumna",     value: cargo.hija },
              { label: "Tipo",       value: cargo.tipo.replace(/_/g, " ") },
              { label: "Vencimiento",value: format(new Date(cargo.fechaVencimiento), "d 'de' MMMM yyyy", { locale: es }) },
              { label: "Estado",     value: (
                <span className="flex items-center gap-1.5">
                  <Icon size={12} style={{ color: cfg.color }} />
                  <span style={{ color: cfg.color }}>{cfg.label}</span>
                </span>
              )},
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                <span className="text-xs font-inter" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {row.label}
                </span>
                <span className="text-xs font-inter font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* CTA — WhatsApp */}
          {cargo.estado !== "PAGADO" && (
            <a
              href={`https://wa.me/521XXXXXXXXXX?text=${waMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-montserrat font-semibold text-sm transition-opacity active:opacity-80"
              style={{
                background: "linear-gradient(135deg, #25D366, #128C7E)",
                color: "#fff",
                boxShadow: "0 4px 20px rgba(37,211,102,0.3)",
              }}>
              <MessageCircle size={17} />
              Contactar a recepción por WhatsApp
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

type Seccion = "PENDIENTE" | "PAGADO";

interface Props { cargos: CargoResumen[] }

export default function PadrePagosClient({ cargos }: Props) {
  const [selected, setSelected] = useState<CargoResumen | null>(null);
  const [verHistorial, setVerHistorial] = useState(false);

  const pendientes = cargos.filter(c => c.estado !== "PAGADO");
  const pagados    = cargos.filter(c => c.estado === "PAGADO");

  const totalPendiente = pendientes.reduce((s, c) => s + c.monto, 0);

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
  const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22,1,0.36,1] } } };

  function CargoRow({ cargo }: { cargo: CargoResumen }) {
    const cfg = estadoConfig(cargo.estado, cargo.fechaVencimiento);
    const Icon = cfg.icon;
    return (
      <motion.button
        variants={item}
        onClick={() => setSelected(cargo)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl text-left transition-all"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        whileTap={{ scale: 0.985 }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: cfg.bg }}>
            <Icon size={14} style={{ color: cfg.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-inter font-medium truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
              {cargo.concepto}
            </p>
            <p className="text-[11px] font-inter mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              {cargo.hija.split(" ")[0]} · {format(new Date(cargo.fechaVencimiento), "d MMM", { locale: es })}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-montserrat font-bold text-sm" style={{ color: cfg.color }}>
            ${cargo.monto.toLocaleString("es-MX")}
          </p>
          <p className="text-[10px] font-inter mt-0.5" style={{ color: cfg.color, opacity: 0.7 }}>
            {cfg.label}
          </p>
        </div>
      </motion.button>
    );
  }

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">

        {/* Encabezado */}
        <motion.div variants={item}>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={15} style={{ color: "#C9A227" }} />
            <h1 className="text-xs font-montserrat font-semibold tracking-[0.1em] uppercase"
              style={{ color: "rgba(255,255,255,0.4)" }}>Estado de cuenta</h1>
          </div>
        </motion.div>

        {/* Resumen total */}
        {pendientes.length > 0 && (
          <motion.div variants={item} className="rounded-2xl p-5"
            style={{
              background: "linear-gradient(135deg, rgba(201,162,39,0.14) 0%, rgba(201,162,39,0.06) 100%)",
              border: "1px solid rgba(201,162,39,0.28)",
              boxShadow: "inset 0 1px 0 rgba(201,162,39,0.2)",
            }}>
            <p className="text-xs font-inter mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>
              Total pendiente por pagar
            </p>
            <p className="text-3xl font-montserrat font-bold" style={{ color: "#C9A227" }}>
              ${totalPendiente.toLocaleString("es-MX")}
              <span className="text-sm ml-1.5 font-normal" style={{ color: "rgba(201,162,39,0.55)" }}>MXN</span>
            </p>
            <p className="text-xs font-inter mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              {pendientes.length} cargo{pendientes.length !== 1 ? "s" : ""} pendiente{pendientes.length !== 1 ? "s" : ""}
            </p>
          </motion.div>
        )}

        {pendientes.length === 0 && (
          <motion.div variants={item} className="rounded-2xl p-5 flex items-center gap-3"
            style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <CheckCircle2 size={20} style={{ color: "#22c55e" }} />
            <div>
              <p className="text-sm font-montserrat font-semibold" style={{ color: "#22c55e" }}>
                Estás al día
              </p>
              <p className="text-xs font-inter mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                No tienes cargos pendientes
              </p>
            </div>
          </motion.div>
        )}

        {/* Lista de pendientes */}
        {pendientes.length > 0 && (
          <div className="space-y-2">
            <motion.p variants={item} className="text-xs font-montserrat font-semibold tracking-[0.08em] uppercase px-1"
              style={{ color: "rgba(255,255,255,0.3)" }}>Pendientes</motion.p>
            {pendientes.map(c => <CargoRow key={c.id} cargo={c} />)}
          </div>
        )}

        {/* Historial de pagados (colapsable) */}
        {pagados.length > 0 && (
          <div className="space-y-2">
            <motion.button
              variants={item}
              onClick={() => setVerHistorial(v => !v)}
              className="w-full flex items-center justify-between px-1"
              aria-label="Ver historial">
              <span className="text-xs font-montserrat font-semibold tracking-[0.08em] uppercase"
                style={{ color: "rgba(255,255,255,0.3)" }}>
                Historial de pagos ({pagados.length})
              </span>
              {verHistorial
                ? <ChevronUp size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                : <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
              }
            </motion.button>

            <AnimatePresence>
              {verHistorial && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden space-y-2">
                  {pagados.map(c => <CargoRow key={c.id} cargo={c} />)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Modal detalle */}
      <AnimatePresence>
        {selected && <CargoModal cargo={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </>
  );
}
