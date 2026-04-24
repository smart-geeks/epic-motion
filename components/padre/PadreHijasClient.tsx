"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, ChevronRight, X, Calendar, Star,
  CheckCircle2, Clock, AlertCircle, Trophy
} from "lucide-react";
import type { HijaResumen } from "@/lib/services/padre-service";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ─── Badge de estatus ────────────────────────────────────────────────────────

function EstatusBadge({ estatus }: { estatus: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVA:   { label: "Activa",   color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
    INACTIVA: { label: "Inactiva", color: "#FF5B5B", bg: "rgba(255,91,91,0.12)" },
    PRUEBA:   { label: "Prueba",   color: "#C9A227", bg: "rgba(201,162,39,0.12)" },
  };
  const s = map[estatus] ?? map.ACTIVA;
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-montserrat font-semibold tracking-wide"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}30` }}>
      {s.label}
    </span>
  );
}

// ─── Stat de asistencia ──────────────────────────────────────────────────────

function AsistenciaBar({ presente, tarde, ausente }: { presente: number; tarde: number; ausente: number }) {
  const total = presente + tarde + ausente;
  if (total === 0) return (
    <p className="text-xs font-inter" style={{ color: "rgba(255,255,255,0.3)" }}>
      Sin clases este mes
    </p>
  );

  return (
    <div className="space-y-2">
      <div className="flex gap-1 h-2 rounded-full overflow-hidden">
        {presente > 0 && (
          <div style={{ flex: presente, background: "#22c55e" }} className="rounded-l-full" />
        )}
        {tarde > 0 && (
          <div style={{ flex: tarde, background: "#C9A227" }} />
        )}
        {ausente > 0 && (
          <div style={{ flex: ausente, background: "#FF5B5B" }} className="rounded-r-full" />
        )}
      </div>
      <div className="flex gap-3">
        <span className="text-[11px] font-inter flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          <span style={{ color: "rgba(255,255,255,0.5)" }}>{presente} presente{presente !== 1 ? "s" : ""}</span>
        </span>
        {tarde > 0 && (
          <span className="text-[11px] font-inter flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#C9A227" }} />
            <span style={{ color: "rgba(255,255,255,0.5)" }}>{tarde} tarde{tarde !== 1 ? "s" : ""}</span>
          </span>
        )}
        {ausente > 0 && (
          <span className="text-[11px] font-inter flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            <span style={{ color: "rgba(255,255,255,0.5)" }}>{ausente} ausencia{ausente !== 1 ? "s" : ""}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Bottom Sheet de hija ────────────────────────────────────────────────────

function HijaBottomSheet({ hija, onClose }: { hija: HijaResumen; onClose: () => void }) {
  const diasMap: Record<string, string> = { L: "Lun", M: "Mar", X: "Mié", J: "Jue", V: "Vie", S: "Sáb", D: "Dom" };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}>

      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} />

      {/* Sheet */}
      <motion.div
        className="relative w-full max-w-2xl mx-auto rounded-t-3xl overflow-hidden"
        style={{
          background: "rgba(18,18,18,0.97)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderBottom: "none",
          boxShadow: "0 -16px 60px rgba(0,0,0,0.8)",
          maxHeight: "85vh",
        }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 35 }}
        onClick={(e) => e.stopPropagation()}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
        </div>

        {/* Scroll content */}
        <div className="overflow-y-auto p-5 space-y-5" style={{ maxHeight: "calc(85vh - 32px)" }}>

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-black text-lg font-bold font-montserrat"
                style={{ background: "linear-gradient(135deg, #C9A227, #E8C84A)" }}>
                {hija.nombre.charAt(0)}
              </div>
              <div>
                <h2 className="font-montserrat font-bold text-lg" style={{ color: "rgba(255,255,255,0.95)" }}>
                  {hija.nombre} {hija.apellido}
                </h2>
                <EstatusBadge estatus={hija.estatus} />
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full transition-colors"
              style={{ background: "rgba(255,255,255,0.06)" }}
              aria-label="Cerrar">
              <X size={16} style={{ color: "rgba(255,255,255,0.6)" }} />
            </button>
          </div>

          {/* Grupo / Horario */}
          {hija.grupo && (
            <div className="rounded-2xl p-4 space-y-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={14} style={{ color: "#C9A227" }} />
                <span className="text-xs font-montserrat font-semibold tracking-[0.08em] uppercase"
                  style={{ color: "rgba(255,255,255,0.4)" }}>Grupo & Horario</span>
              </div>
              <p className="font-montserrat font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                {hija.grupo.nombre}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {hija.grupo.dias.map((d) => (
                  <span key={d} className="px-2.5 py-1 rounded-lg text-xs font-inter"
                    style={{ background: "rgba(201,162,39,0.12)", color: "#C9A227", border: "1px solid rgba(201,162,39,0.2)" }}>
                    {diasMap[d] ?? d}
                  </span>
                ))}
                <span className="px-2.5 py-1 rounded-lg text-xs font-inter"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                  {hija.grupo.horaInicio}
                </span>
              </div>
              {hija.grupo.disciplinas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {hija.grupo.disciplinas.map((d) => (
                    <span key={d.nombre} className="px-2 py-0.5 rounded-full text-[11px] font-inter font-medium"
                      style={{
                        background: d.color ? `${d.color}20` : "rgba(255,255,255,0.06)",
                        color: d.color ?? "rgba(255,255,255,0.6)",
                        border: `1px solid ${d.color ?? "rgba(255,255,255,0.1)"}40`,
                      }}>
                      {d.nombre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Asistencia del mes */}
          <div className="rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={14} style={{ color: "#C9A227" }} />
              <span className="text-xs font-montserrat font-semibold tracking-[0.08em] uppercase"
                style={{ color: "rgba(255,255,255,0.4)" }}>
                Asistencia — {format(new Date(), "MMMM", { locale: es })}
              </span>
            </div>
            <AsistenciaBar {...hija.asistenciasMes} />
          </div>

          {/* Notas del maestro */}
          {hija.notasRecientes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star size={14} style={{ color: "#C9A227" }} />
                <span className="text-xs font-montserrat font-semibold tracking-[0.08em] uppercase"
                  style={{ color: "rgba(255,255,255,0.4)" }}>Notas del maestro</span>
              </div>
              {hija.notasRecientes.map((n) => (
                <div key={n.id} className="rounded-xl p-3"
                  style={{
                    background: n.tipo === "EXTRAORDINARIA"
                      ? "rgba(201,162,39,0.08)"
                      : "rgba(255,255,255,0.03)",
                    border: n.tipo === "EXTRAORDINARIA"
                      ? "1px solid rgba(201,162,39,0.2)"
                      : "1px solid rgba(255,255,255,0.06)",
                  }}>
                  <p className="text-xs font-inter leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.75)" }}>
                    {n.contenido}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Clock size={10} style={{ color: "rgba(255,255,255,0.25)" }} />
                    <span className="text-[10px] font-inter" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {n.maestro} · {format(new Date(n.fecha), "d MMM", { locale: es })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Logros */}
          {hija.logros.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Trophy size={14} style={{ color: "#C9A227" }} />
                <span className="text-xs font-montserrat font-semibold tracking-[0.08em] uppercase"
                  style={{ color: "rgba(255,255,255,0.4)" }}>Logros recientes</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {hija.logros.map((l) => (
                  <div key={l.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{
                      background: "rgba(201,162,39,0.1)",
                      border: "1px solid rgba(201,162,39,0.2)",
                    }}>
                    <span className="text-base">{l.icono ?? "🏆"}</span>
                    <span className="text-xs font-inter" style={{ color: "rgba(255,255,255,0.7)" }}>
                      {l.nombre}
                    </span>
                    <span className="text-[10px] font-montserrat font-bold" style={{ color: "#C9A227" }}>
                      +{l.puntos}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inscrita desde */}
          <p className="text-center text-[11px] font-inter pb-2" style={{ color: "rgba(255,255,255,0.2)" }}>
            Inscrita desde {format(new Date(hija.fechaInscripcion), "MMMM yyyy", { locale: es })}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

interface Props {
  hijas: HijaResumen[];
}

export default function PadreHijasClient({ hijas }: Props) {
  const [selected, setSelected] = useState<HijaResumen | null>(null);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  } as const;

  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  } as const;

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">

        {/* Encabezado */}
        <motion.div variants={item}>
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} style={{ color: "#C9A227" }} />
            <h1 className="text-xs font-montserrat font-semibold tracking-[0.1em] uppercase"
              style={{ color: "rgba(255,255,255,0.4)" }}>
              Mis hijas
            </h1>
          </div>
          <p className="text-xl font-montserrat font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
            {hijas.length === 0
              ? "No hay alumnas registradas"
              : `${hijas.length} alumna${hijas.length !== 1 ? "s" : ""} inscrita${hijas.length !== 1 ? "s" : ""}`}
          </p>
        </motion.div>

        {/* Cards de hijas */}
        {hijas.map((h) => {
          const total = h.asistenciasMes.presente + h.asistenciasMes.tarde + h.asistenciasMes.ausente;
          const pct = total > 0 ? Math.round((h.asistenciasMes.presente / total) * 100) : null;

          return (
            <motion.button
              key={h.id}
              variants={item}
              onClick={() => setSelected(h)}
              className="w-full text-left rounded-2xl p-4 transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
              whileTap={{ scale: 0.985 }}>

              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-black font-bold font-montserrat shrink-0"
                  style={{ background: "linear-gradient(135deg, #C9A227, #E8C84A)" }}>
                  {h.nombre.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-montserrat font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                        {h.nombre} {h.apellido}
                      </h3>
                      <p className="text-xs font-inter mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {h.grupo?.nombre ?? "Sin grupo asignado"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <EstatusBadge estatus={h.estatus} />
                      <ChevronRight size={15} style={{ color: "rgba(255,255,255,0.25)" }} />
                    </div>
                  </div>

                  {/* Disciplinas */}
                  {h.grupo?.disciplinas && h.grupo.disciplinas.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {h.grupo.disciplinas.slice(0, 3).map((d) => (
                        <span key={d.nombre} className="px-2 py-0.5 rounded-full text-[10px] font-inter"
                          style={{
                            background: d.color ? `${d.color}18` : "rgba(255,255,255,0.06)",
                            color: d.color ?? "rgba(255,255,255,0.45)",
                          }}>
                          {d.nombre}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Asistencia rápida */}
                  {pct !== null && (
                    <div className="flex items-center gap-2 mt-2.5">
                      <div className="flex-1 h-1 rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: pct >= 80 ? "#22c55e" : pct >= 60 ? "#C9A227" : "#FF5B5B",
                          }} />
                      </div>
                      <span className="text-[11px] font-inter shrink-0"
                        style={{ color: "rgba(255,255,255,0.35)" }}>
                        {pct}% asistencia
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}

        {hijas.length === 0 && (
          <motion.div variants={item} className="rounded-2xl p-8 text-center"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
            <AlertCircle size={28} className="mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
            <p className="text-sm font-inter" style={{ color: "rgba(255,255,255,0.35)" }}>
              No hay alumnas registradas en tu cuenta
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {selected && (
          <HijaBottomSheet hija={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
