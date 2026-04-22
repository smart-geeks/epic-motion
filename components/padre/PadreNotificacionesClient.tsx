"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, AlertCircle, CreditCard, Star, Info } from "lucide-react";
import type { NotificacionResumen } from "@/lib/services/padre-service";
import { marcarNotificacionLeidaAction } from "@/lib/actions/padre-actions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// ─── Icono por tipo ──────────────────────────────────────────────────────────

function TipoIcon({ tipo }: { tipo: string }) {
  const t = tipo.toUpperCase();
  if (t.includes("PAGO") || t.includes("CARGO") || t.includes("MENSUAL"))
    return <CreditCard size={15} style={{ color: "#C9A227" }} />;
  if (t.includes("NOTA") || t.includes("LOGRO"))
    return <Star size={15} style={{ color: "#8B5CF6" }} />;
  if (t.includes("ALERTA") || t.includes("UNIFORME") || t.includes("FALTA"))
    return <AlertCircle size={15} style={{ color: "#FF5B5B" }} />;
  return <Info size={15} style={{ color: "rgba(255,255,255,0.45)" }} />;
}

// ─── Row de notificación ─────────────────────────────────────────────────────

function NotificacionRow({
  n,
  padreId,
  onRead,
}: {
  n: NotificacionResumen;
  padreId: string;
  onRead: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleRead() {
    if (n.leida) return;
    startTransition(async () => {
      await marcarNotificacionLeidaAction(n.id, padreId);
      onRead(n.id);
    });
  }

  return (
    <motion.button
      layout
      onClick={handleRead}
      className="w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl text-left transition-opacity"
      style={{
        background: n.leida ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.055)",
        border: n.leida
          ? "1px solid rgba(255,255,255,0.06)"
          : "1px solid rgba(255,255,255,0.12)",
        opacity: pending ? 0.5 : 1,
      }}
      whileTap={{ scale: 0.984 }}>

      {/* Icono */}
      <div className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "rgba(255,255,255,0.06)" }}>
        <TipoIcon tipo={n.tipo} />
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-inter font-medium leading-snug"
            style={{ color: n.leida ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.9)" }}>
            {n.titulo}
          </p>
          {!n.leida && (
            <span className="shrink-0 w-2 h-2 rounded-full mt-1"
              style={{ background: "#C9A227", boxShadow: "0 0 6px rgba(201,162,39,0.6)" }} />
          )}
        </div>
        {n.cuerpo && (
          <p className="text-xs font-inter mt-1 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.35)" }}>
            {n.cuerpo}
          </p>
        )}
        <p className="text-[11px] font-inter mt-1.5"
          style={{ color: "rgba(255,255,255,0.22)" }}>
          {formatDistanceToNow(new Date(n.fecha), { addSuffix: true, locale: es })}
        </p>
      </div>
    </motion.button>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  notificaciones: NotificacionResumen[];
  padreId: string;
}

export default function PadreNotificacionesClient({ notificaciones, padreId }: Props) {
  const [lista, setLista] = useState(notificaciones);

  const sinLeer = lista.filter(n => !n.leida).length;

  function handleRead(id: string) {
    setLista(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  }

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">

      {/* Encabezado */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-1">
          <Bell size={15} style={{ color: "#C9A227" }} />
          <h1 className="text-xs font-montserrat font-semibold tracking-[0.1em] uppercase"
            style={{ color: "rgba(255,255,255,0.4)" }}>Avisos</h1>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-montserrat font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
            Notificaciones
          </p>
          {sinLeer > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-montserrat font-bold"
              style={{
                background: "rgba(201,162,39,0.2)",
                color: "#C9A227",
                border: "1px solid rgba(201,162,39,0.3)",
              }}>
              {sinLeer} nueva{sinLeer !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </motion.div>

      {/* Hint: toca para marcar leída */}
      {sinLeer > 0 && (
        <motion.div variants={item}
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <CheckCheck size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
          <p className="text-[11px] font-inter" style={{ color: "rgba(255,255,255,0.3)" }}>
            Toca una notificación para marcarla como leída
          </p>
        </motion.div>
      )}

      {/* Lista */}
      {lista.length === 0 ? (
        <motion.div variants={item} className="rounded-2xl p-8 text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Bell size={28} className="mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
          <p className="text-sm font-inter" style={{ color: "rgba(255,255,255,0.3)" }}>
            No tienes notificaciones
          </p>
        </motion.div>
      ) : (
        <AnimatePresence>
          <motion.div className="space-y-2" layout>
            {lista.map((n) => (
              <motion.div key={n.id} variants={item} layout>
                <NotificacionRow n={n} padreId={padreId} onRead={handleRead} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
