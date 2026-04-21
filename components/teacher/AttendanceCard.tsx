"use client";

import { useState } from "react";
import { motion, PanInfo, useAnimation } from "framer-motion";
import { Check, User, Info, MessageSquare, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AttendanceCardProps {
  alumna: any;
  index: number;
}

export function AttendanceCard({ alumna, index }: AttendanceCardProps) {
  const [status, setStatus] = useState<"pending" | "present" | "late">("pending");
  const [showDetails, setShowDetails] = useState(false);
  const [uniform, setUniform] = useState(true);
  const [note, setNote] = useState("");
  
  const controls = useAnimation();

  const onDragEnd = async (event: any, info: PanInfo) => {
    // Si desliza notablemente a la derecha (> 100px)
    if (info.offset.x > 100) {
      setStatus("present");
      await controls.start({ x: 0, transition: { type: "spring", bounce: 0.2 } });
      toast.success(`${alumna.nombre} marcada como PRESENTE`, {
        icon: <Check className="text-green-500" />,
        duration: 2000
      });
    } else if (info.offset.x < -80) {
       // Opcional: algún gesto a la izquierda si fuera necesario
       await controls.start({ x: 0 });
    } else {
      controls.start({ x: 0 });
    }
  };

  return (
    <div className="relative">
      {/* Background Actions (Visible during swipe) */}
      <div className="absolute inset-0 rounded-[1.75rem] flex items-center px-8 bg-green-500/20 text-green-500 pointer-events-none">
        <Check size={28} strokeWidth={3} />
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 150 }}
        dragElastic={0.2}
        animate={controls}
        onDragEnd={onDragEnd}
        className={`relative z-10 glass p-4 rounded-[1.75rem] border-white/5 transition-all duration-300 ${
          status === "present" ? "border-green-500/30 bg-green-500/5" : ""
        } ${status === "late" ? "border-epic-gold/30 bg-epic-gold/5" : ""}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
              status === "present" ? "bg-green-500/20 border-green-500/30" : "bg-white/5 border-white/10"
            }`}>
              {alumna.foto ? (
                <img src={alumna.foto} alt="" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <User className="text-white/30" size={20} />
              )}
            </div>
            
            <div onClick={() => setShowDetails(!showDetails)} className="cursor-pointer">
              <h4 className="text-white font-montserrat font-bold text-sm leading-tight">
                {alumna.nombre} {alumna.apellido}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                {status === "present" ? (
                  <span className="text-[9px] font-montserrat font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                    <Check size={10} /> Presente
                  </span>
                ) : status === "late" ? (
                  <span className="text-[9px] font-montserrat font-bold text-epic-gold uppercase tracking-widest flex items-center gap-1">
                    <AlertCircle size={10} /> Tarde
                  </span>
                ) : (
                  <span className="text-[9px] font-montserrat font-bold text-white/20 uppercase tracking-widest">Pendiente</span>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowDetails(!showDetails)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              showDetails ? "bg-epic-gold text-black" : "bg-white/5 text-white/30 border border-white/10"
            }`}
          >
            <Info size={18} />
          </button>
        </div>

        {/* Extended Details / Notes (Liquid Sheet Style) */}
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden mt-4 pt-4 border-t border-white/5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-montserrat font-bold text-white/40 uppercase tracking-widest">
                <ShieldCheck size={14} className={uniform ? "text-green-500" : "text-white/20"} />
                Uniforme Completo
              </div>
              <button 
                onClick={() => setUniform(!uniform)}
                className={`w-12 h-6 rounded-full relative transition-colors ${uniform ? "bg-epic-gold" : "bg-white/10"}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${uniform ? "left-7" : "left-1"}`} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-montserrat font-bold text-white/40 uppercase tracking-widest ml-1">
                Nota para Padres y Admin (Opcional)
              </label>
              <div className="relative">
                <MessageSquare size={14} className="absolute left-3 top-3 text-white/10" />
                <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej. Maia hoy se veía con poca energía..."
                  className="w-full bg-black/20 border border-white/10 rounded-2xl p-3 pl-9 text-xs text-white/80 placeholder:text-white/10 focus:outline-none focus:border-epic-gold/30 min-h-[80px]"
                />
              </div>
            </div>

            <button 
              onClick={() => {
                setStatus(status === "present" ? "late" : "present");
                toast.success("Estatus actualizado");
              }}
              className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-[10px] font-montserrat font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Cambiar a {status === "present" ? "TARDE" : "PRESENTE"}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
