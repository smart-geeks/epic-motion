"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, User, Mail, Phone, Briefcase, GraduationCap, DollarSign, CheckCircle2 } from "lucide-react";
import { Rol } from "@/app/generated/prisma/enums";
import { upsertStaff } from "@/lib/actions/staff-actions";
import { toast } from "sonner";

interface StaffFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export function StaffForm({ isOpen, onClose, initialData }: StaffFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: initialData?.id || undefined,
    nombre: initialData?.nombre || "",
    apellido: initialData?.apellido || "",
    email: initialData?.email || "",
    rol: initialData?.rol || Rol.MAESTRO,
    telefono: initialData?.telefono || "",
    tarifaHora: initialData?.tarifaHora || 0,
    especialidades: initialData?.especialidades || [],
    activo: initialData?.activo ?? true,
  });

  const [especialidadInput, setEspecialidadInput] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        nombre: initialData.nombre,
        apellido: initialData.apellido,
        email: initialData.email,
        rol: initialData.rol,
        telefono: initialData.telefono,
        tarifaHora: initialData.tarifaHora,
        especialidades: initialData.especialidades || [],
        activo: initialData.activo,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await upsertStaff(formData as any);
    
    if (result.success) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
    }
    
    setLoading(false);
  };

  const addEspecialidad = () => {
    if (especialidadInput.trim() && !formData.especialidades.includes(especialidadInput.trim())) {
      setFormData({
        ...formData,
        especialidades: [...formData.especialidades, especialidadInput.trim()]
      });
      setEspecialidadInput("");
    }
  };

  const removeEspecialidad = (esp: string) => {
    setFormData({
      ...formData,
      especialidades: formData.especialidades.filter(e => e !== esp)
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative z-[70] w-full max-w-md max-h-[90vh] glass rounded-[3rem] border border-white/10 flex flex-col shadow-[0_32px_80px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="p-8 border-b border-white/10 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-montserrat font-bold text-white flex items-center gap-3">
                {initialData ? "Editar Perfil" : "Nuevo Miembro"}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-montserrat font-bold uppercase tracking-widest text-white/40 ml-1">
                      Nombre
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                      <input
                        type="text"
                        required
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-inter text-sm focus:outline-none focus:border-epic-gold/50 transition-all"
                        placeholder="Ej. Héctor"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-montserrat font-bold uppercase tracking-widest text-white/40 ml-1">
                      Apellido
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.apellido}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-inter text-sm focus:outline-none focus:border-epic-gold/50 transition-all"
                      placeholder="Ej. González"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-montserrat font-bold uppercase tracking-widest text-white/40 ml-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-inter text-sm focus:outline-none focus:border-epic-gold/50 transition-all"
                      placeholder="ejemplo@epicmotion.app"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-montserrat font-bold uppercase tracking-widest text-white/40 ml-1">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-inter text-sm focus:outline-none focus:border-epic-gold/50 transition-all"
                      placeholder="811 000 0000"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-montserrat font-bold uppercase tracking-widest text-white/40 ml-1">
                    Rol en la Academia
                  </label>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <select
                      value={formData.rol}
                      onChange={(e) => setFormData({ ...formData, rol: e.target.value as Rol })}
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-inter text-sm focus:outline-none focus:border-epic-gold/50 appearance-none transition-all"
                    >
                      <option value={Rol.MAESTRO} className="bg-zinc-900">Maestro</option>
                      <option value={Rol.RECEPCIONISTA} className="bg-zinc-900">Recepción</option>
                      <option value={Rol.ADMIN} className="bg-zinc-900">Administrador</option>
                    </select>
                  </div>
                </div>

                {formData.rol === Rol.MAESTRO && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4 pt-4 border-t border-white/5"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-montserrat font-bold uppercase tracking-widest text-white/40 ml-1">
                        Tarifa por Hora (MXN)
                      </label>
                      <div className="relative">
                        <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-epic-gold/40" />
                        <input
                          type="number"
                          value={formData.tarifaHora}
                          onChange={(e) => setFormData({ ...formData, tarifaHora: Number(e.target.value) })}
                          className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-inter text-sm focus:outline-none focus:border-epic-gold/50 transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-montserrat font-bold uppercase tracking-widest text-white/40 ml-1">
                        Especialidades
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={especialidadInput}
                          onChange={(e) => setEspecialidadInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEspecialidad())}
                          className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-inter text-sm focus:outline-none focus:border-epic-gold/50 transition-all"
                          placeholder="Ej. Ballet..."
                        />
                        <button
                          type="button"
                          onClick={addEspecialidad}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-all"
                        >
                          Añadir
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {formData.especialidades.map((esp) => (
                          <span
                            key={esp}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-epic-gold/10 border border-epic-gold/20 text-epic-gold rounded-full text-xs font-medium"
                          >
                            {esp}
                            <button
                              type="button"
                              onClick={() => removeEspecialidad(esp)}
                              className="hover:text-white"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </form>

            <div className="p-8 border-t border-white/10 shrink-0">
              <button
                disabled={loading}
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 py-4 bg-epic-gold text-black font-montserrat font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-liquid disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={20} />
                    {initialData ? "Guardar Cambios" : "Crear Perfil"}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
