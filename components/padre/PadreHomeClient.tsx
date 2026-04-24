"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Newspaper, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import type { HomeResumen } from "@/lib/services/padre-service";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ─── helpers ────────────────────────────────────────────────────────────────

function getSaludo() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function diasParaVencer(fecha: Date): number {
  return Math.ceil((new Date(fecha).getTime() - Date.now()) / 86_400_000);
}

// ─── Componente principal ────────────────────────────────────────────────────

interface Props {
  nombre: string;
  resumen: HomeResumen;
}

export default function PadreHomeClient({ nombre, resumen }: Props) {
  const primerNombre = nombre.split(" ")[0];
  const { cargosCriticos, noticias, hijas, unreadCount } = resumen;

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  } as const;
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  } as const;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

      {/* ── Saludo ── */}
      <motion.div variants={item}>
        <p className="text-sm font-inter" style={{ color: "rgba(255,255,255,0.4)" }}>
          {getSaludo()}
        </p>
        <h1 className="text-2xl font-montserrat font-bold tracking-tight mt-0.5"
          style={{
            background: "linear-gradient(135deg, #FFFFFF 0%, rgba(255,255,255,0.65) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
          {primerNombre} 👋
        </h1>
        {hijas.length > 0 && (
          <p className="mt-1 text-sm font-inter" style={{ color: "rgba(255,255,255,0.4)" }}>
            {hijas.map(h => h.nombre).join(" · ")}
          </p>
        )}
      </motion.div>

      {/* ── Alerta de cargos críticos ── */}
      {cargosCriticos.length > 0 && (
        <motion.div variants={item}
          className="rounded-2xl p-4"
          style={{
            background: "linear-gradient(135deg, rgba(201,162,39,0.18) 0%, rgba(201,162,39,0.08) 100%)",
            border: "1px solid rgba(201,162,39,0.30)",
            boxShadow: "inset 0 1px 0 rgba(201,162,39,0.25), 0 4px 20px rgba(201,162,39,0.12)",
          }}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full p-1.5"
              style={{ background: "rgba(201,162,39,0.2)" }}>
              <AlertTriangle size={16} style={{ color: "#C9A227" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-montserrat font-semibold" style={{ color: "#E8C84A" }}>
                {cargosCriticos.length === 1 ? "Pago pendiente" : `${cargosCriticos.length} pagos pendientes`}
              </p>
              <div className="mt-2 space-y-1.5">
                {cargosCriticos.slice(0, 3).map((c) => {
                  const dias = diasParaVencer(c.fechaVencimiento);
                  const vencido = c.estado === "VENCIDO" || dias < 0;
                  return (
                    <div key={c.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-inter truncate" style={{ color: "rgba(255,255,255,0.8)" }}>
                          {c.concepto} · {c.hija.split(" ")[0]}
                        </p>
                        <p className="text-[11px] font-inter mt-0.5"
                          style={{ color: vencido ? "#FF5B5B" : "rgba(255,255,255,0.4)" }}>
                          {vencido
                            ? "Vencido"
                            : dias === 0 ? "Vence hoy" : `Vence en ${dias} día${dias !== 1 ? "s" : ""}`}
                        </p>
                      </div>
                      <span className="font-montserrat font-bold text-sm shrink-0"
                        style={{ color: "#C9A227" }}>
                        ${c.monto.toLocaleString("es-MX")}
                      </span>
                    </div>
                  );
                })}
              </div>
              <a
                href="tel:+1234567890"
                className="mt-3 flex items-center gap-1.5 text-xs font-inter font-medium"
                style={{ color: "#C9A227" }}>
                Contactar a recepción <ChevronRight size={13} />
              </a>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Sin alertas ── */}
      {cargosCriticos.length === 0 && (
        <motion.div variants={item}
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
          <div className="rounded-full p-1.5" style={{ background: "rgba(34,197,94,0.15)" }}>
            <CheckCircle2 size={16} style={{ color: "#22c55e" }} />
          </div>
          <div>
            <p className="text-sm font-inter" style={{ color: "rgba(255,255,255,0.7)" }}>
              Estás al día con tus pagos
            </p>
            <p className="text-xs font-inter mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              No tienes cargos pendientes próximos
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Noticias ── */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-3">
          <Newspaper size={15} style={{ color: "#C9A227" }} />
          <h2 className="text-xs font-montserrat font-semibold tracking-[0.1em] uppercase"
            style={{ color: "rgba(255,255,255,0.45)" }}>
            Tablero de noticias
          </h2>
        </div>

        {noticias.length === 0 ? (
          <div className="rounded-2xl p-6 text-center"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
            <p className="text-sm font-inter" style={{ color: "rgba(255,255,255,0.3)" }}>
              No hay noticias publicadas
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {noticias.map((n) => (
              <motion.div
                key={n.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: n.leida ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.05)",
                  border: n.leida
                    ? "1px solid rgba(255,255,255,0.06)"
                    : "1px solid rgba(201,162,39,0.18)",
                  boxShadow: n.leida ? "none" : "inset 0 1px 0 rgba(201,162,39,0.12)",
                }}
                whileTap={{ scale: 0.985 }}>

                {/* Imagen opcional */}
                {n.imagenUrl && (
                  <div className="w-full h-36 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={n.imagenUrl}
                      alt={n.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {!n.leida && (
                        <span className="inline-block mb-1.5 px-2 py-0.5 rounded-full text-[10px] font-montserrat font-semibold tracking-wide"
                          style={{
                            background: "rgba(201,162,39,0.15)",
                            color: "#C9A227",
                            border: "1px solid rgba(201,162,39,0.25)",
                          }}>
                          NUEVO
                        </span>
                      )}
                      <h3 className="text-sm font-montserrat font-semibold leading-snug"
                        style={{ color: n.leida ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.9)" }}>
                        {n.titulo}
                      </h3>
                      <p className="mt-1.5 text-xs font-inter leading-relaxed line-clamp-2"
                        style={{ color: "rgba(255,255,255,0.4)" }}>
                        {n.cuerpo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3">
                    <Clock size={11} style={{ color: "rgba(255,255,255,0.25)" }} />
                    <span className="text-[11px] font-inter"
                      style={{ color: "rgba(255,255,255,0.25)" }}>
                      {format(new Date(n.fecha), "d 'de' MMMM", { locale: es })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

    </motion.div>
  );
}
