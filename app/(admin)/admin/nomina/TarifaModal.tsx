'use client';

import { useState } from 'react';
import { Settings, X, Loader2 } from 'lucide-react';
import { upsertStaff } from '@/lib/actions/staff-actions';
import { useRouter } from 'next/navigation';
import { Rol } from '@/app/generated/prisma/enums';

interface TarifaModalProps {
  maestro: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: any;
    profesor?: {
      tarifaHora: any;
      tarifaPrivada: any;
    } | null;
  };
}

export default function TarifaModal({ maestro }: TarifaModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      id: maestro.id,
      nombre: maestro.nombre,
      apellido: maestro.apellido,
      email: maestro.email,
      rol: Rol.MAESTRO,
      tarifaHora: Number(formData.get('tarifaHora')),
      tarifaPrivada: Number(formData.get('tarifaPrivada')),
    };

    const res = await upsertStaff(data);
    setLoading(false);
    
    if (res.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      alert(res.message);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-epic-gold hover:bg-epic-gold/10 hover:border-epic-gold/20 transition-all"
        title="Configurar Tarifas"
      >
        <Settings size={20} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-md glass rounded-[2.5rem] border-white/10 p-8 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-epic-gold/10 blur-3xl rounded-full -mr-16 -mt-16" />
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-montserrat font-bold text-white">Configurar Tarifas</h3>
                <p className="text-xs text-white/40 mt-1">{maestro.nombre} {maestro.apellido}</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/20 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-2">Tarifa Regular (por hora)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-bold">$</div>
                  <input
                    name="tarifaHora"
                    type="number"
                    step="0.01"
                    defaultValue={Number(maestro.profesor?.tarifaHora || 0)}
                    required
                    className="w-full pl-8 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold focus:border-epic-gold/50 focus:ring-0 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-2">Tarifa Clases Privadas (por hora)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-epic-gold/40 font-bold">$</div>
                  <input
                    name="tarifaPrivada"
                    type="number"
                    step="0.01"
                    defaultValue={Number(maestro.profesor?.tarifaPrivada || maestro.profesor?.tarifaHora || 0)}
                    required
                    className="w-full pl-8 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-epic-gold font-bold focus:border-epic-gold/50 focus:ring-0 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-epic-gold to-yellow-600 text-black font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
