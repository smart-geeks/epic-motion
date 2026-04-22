"use client";

import { motion } from "framer-motion";
import { CalendarDays, MapPin } from "lucide-react";
import type { EventoResumen } from "@/lib/services/padre-service";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const TIPO_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  RECITAL:             { label: "Recital",      color: "#C9A227", emoji: "🌟" },
  COMPETENCIA_INTERNA: { label: "Competencia",  color: "#8B5CF6", emoji: "🏆" },
  COMPETENCIA_EXTERNA: { label: "Comp. Ext.",   color: "#EC4899", emoji: "🎖️" },
  SHOWCASE:            { label: "Showcase",     color: "#06B6D4", emoji: "✨" },
  ENSAYO:              { label: "Ensayo",       color: "rgba(255,255,255,0.45)", emoji: "🎵" },
};

interface Props { eventos: EventoResumen[] }

export default function PadreEventosClient({ eventos }: Props) {
  const grupos = eventos.reduce<Record<string, EventoResumen[]>>((acc, e) => {
    const key = format(new Date(e.fecha), "MMMM yyyy", { locale: es });
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  let idx = 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays size={15} style={{ color: "#C9A227" }} />
          <h1 className="text-xs font-montserrat font-semibold tracking-[0.1em] uppercase"
            style={{ color: "rgba(255,255,255,0.4)" }}>Próximos eventos</h1>
        </div>
        <p className="text-xl font-montserrat font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
          Calendario Epic Motion
        </p>
      </motion.div>

      {eventos.length === 0 ? (
        <div className="rounded-2xl p-8 text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <CalendarDays size={28} className="mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p className="text-sm font-inter" style={{ color: "rgba(255,255,255,0.35)" }}>
            No hay eventos próximos
          </p>
        </div>
      ) : (
        Object.entries(grupos).map(([mes, evts]) => (
          <div key={mes} className="space-y-2">
            <div className="flex items-center gap-3 py-1">
              <span className="text-xs font-montserrat font-bold uppercase tracking-[0.12em] capitalize"
                style={{ color: "#C9A227" }}>{mes}</span>
              <div className="flex-1 h-px" style={{ background: "rgba(201,162,39,0.15)" }} />
            </div>

            {evts.map((e) => {
              const delay = (idx++) * 0.06;
              const fecha = new Date(e.fecha);
              const cfg = TIPO_CONFIG[e.tipo] ?? TIPO_CONFIG.ENSAYO;
              return (
                <motion.div key={e.id}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="flex gap-4">
                  {/* Fecha */}
                  <div className="flex flex-col items-center shrink-0 w-12">
                    <div className="rounded-xl overflow-hidden w-full"
                      style={{ border: `1px solid ${cfg.color}30`, background: `${cfg.color}10` }}>
                      <div className="py-0.5 text-center text-[9px] font-montserrat font-bold uppercase tracking-widest"
                        style={{ background: `${cfg.color}25`, color: cfg.color }}>
                        {format(fecha, "MMM", { locale: es })}
                      </div>
                      <div className="py-1.5 text-center text-xl font-montserrat font-bold leading-none"
                        style={{ color: "rgba(255,255,255,0.9)" }}>
                        {format(fecha, "d")}
                      </div>
                    </div>
                    <div className="w-px flex-1 mt-2 min-h-[12px]"
                      style={{ background: "rgba(255,255,255,0.06)" }} />
                  </div>

                  {/* Card */}
                  <div className="flex-1 pb-4 min-w-0">
                    <div className="rounded-2xl p-4"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-montserrat font-semibold text-sm"
                          style={{ color: "rgba(255,255,255,0.9)" }}>{e.titulo}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-montserrat font-semibold shrink-0"
                          style={{ color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}>
                          {cfg.emoji} {cfg.label}
                        </span>
                      </div>
                      {e.descripcion && (
                        <p className="text-xs font-inter mb-2 leading-relaxed"
                          style={{ color: "rgba(255,255,255,0.4)" }}>{e.descripcion}</p>
                      )}
                      <div className="flex flex-wrap gap-3">
                        <span className="flex items-center gap-1 text-[11px] font-inter"
                          style={{ color: "rgba(255,255,255,0.3)" }}>
                          <CalendarDays size={11} />
                          {format(fecha, "EEEE, HH:mm", { locale: es })}
                        </span>
                        {e.ubicacion && (
                          <span className="flex items-center gap-1 text-[11px] font-inter"
                            style={{ color: "rgba(255,255,255,0.3)" }}>
                            <MapPin size={11} />{e.ubicacion}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
