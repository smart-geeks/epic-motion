'use client';

import { useState } from 'react';
import { X, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { createProductAction } from '@/lib/actions/pos';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProduct: any) => void;
}

export default function NuevoProductoModal({ isOpen, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    nombre: '',
    precio: '',
    tipo: 'OTRO',
    descripcion: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.precio) {
      toast.error('Nombre y precio son obligatorios');
      return;
    }

    setLoading(true);
    const res = await createProductAction({
      nombre: form.nombre,
      precioSugerido: parseFloat(form.precio),
      tipo: form.tipo,
      descripcion: form.descripcion
    });
    setLoading(false);

    if (res.ok) {
      toast.success('Producto creado correctamente');
      onSuccess(res.data);
      onClose();
      setForm({ nombre: '', precio: '', tipo: 'OTRO', descripcion: '' });
    } else {
      toast.error(res.error || 'Error al crear producto');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md glass-card rounded-[2.5rem] border-white/10 shadow-2xl overflow-hidden bg-epic-gray">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="font-montserrat font-bold text-lg text-white">Nuevo Producto</h3>
            <p className="text-xs text-white/40">Alta de uniforme, playera o concepto</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-white/20 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Nombre del Producto</label>
            <input 
              type="text"
              required
              value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              placeholder="Ej: Playera Epic Motion XL"
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3 px-4 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-epic-gold/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Precio</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">$</span>
                <input 
                  type="number"
                  step="0.01"
                  required
                  value={form.precio}
                  onChange={e => setForm(p => ({ ...p, precio: e.target.value }))}
                  placeholder="0.00"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3 pl-8 pr-4 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-epic-gold/50 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Categoría</label>
              <select 
                value={form.tipo}
                onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-epic-gold/50 transition-all appearance-none cursor-pointer"
              >
                <option value="OTRO" className="bg-epic-gray">Venta Directa / Otro</option>
                <option value="UNIFORME" className="bg-epic-gray">Uniforme</option>
                <option value="INSCRIPCION" className="bg-epic-gray">Inscripción / Cuota</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Descripción (Opcional)</label>
            <textarea 
              value={form.descripcion}
              onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
              placeholder="Detalles adicionales..."
              rows={3}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3 px-4 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-epic-gold/50 transition-all resize-none"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3.5 rounded-2xl bg-epic-gold text-black text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-epic-gold/80 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Check size={16} />
                  Crear Producto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
