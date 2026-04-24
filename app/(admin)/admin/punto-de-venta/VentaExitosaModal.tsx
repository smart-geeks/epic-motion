'use client';

import { X, CheckCircle2, Printer, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: {
    id: string;
    monto: number;
    metodo: string;
    fecha: Date;
    alumna: string;
    items: { name: string; price: number }[];
  } | null;
}

export default function VentaExitosaModal({ isOpen, onClose, data }: Props) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg glass-card rounded-[2.5rem] border-white/10 shadow-2xl overflow-hidden bg-epic-gray p-8 flex flex-col items-center text-center"
      >
        <div className="w-20 h-20 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-6">
          <CheckCircle2 size={48} />
        </div>

        <h2 className="font-montserrat font-bold text-3xl text-white mb-2">¡Venta Exitosa!</h2>
        <p className="text-white/40 text-sm mb-8">El pago ha sido registrado y los cargos marcados como pagados.</p>

        {/* Ticket Preview */}
        <div className="w-full bg-white/[0.03] border border-white/5 rounded-3xl p-6 mb-8 text-left font-inter">
          <div className="flex justify-between mb-4 border-b border-white/5 pb-4">
            <div>
              <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Folio</p>
              <p className="text-sm font-bold text-white">#{data.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Fecha</p>
              <p className="text-sm font-bold text-white">{new Date(data.fecha).toLocaleString('es-MX')}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Alumna</p>
            <p className="text-sm font-bold text-white">{data.alumna}</p>
          </div>

          <div className="space-y-2 mb-6">
            <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Conceptos</p>
            {data.items.map((item, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-white/60">{item.name}</span>
                <span className="text-white font-bold">${item.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <span className="text-sm font-bold text-white/40">Total ({data.metodo})</span>
            <span className="text-2xl font-bold text-epic-gold">${data.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="flex gap-4 w-full">
          <Button 
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-2xl h-14 border-white/10 text-white/40 hover:text-white"
          >
            Cerrar
          </Button>
          <Button 
            onClick={handlePrint}
            className="flex-1 rounded-2xl h-14 gap-2"
          >
            <Printer size={18} />
            Imprimir Ticket
          </Button>
        </div>

        {/* Hidden element for printing */}
        <div id="ticket-container" className="hidden print:block bg-white text-black p-8 w-[80mm] font-mono text-[10px]">
          <div className="text-center mb-4">
            <h1 className="text-lg font-bold">EPIC MOTION</h1>
            <p>Academia de Danza</p>
            <p>RECIBO DE PAGO</p>
          </div>
          <div className="border-b border-black border-dashed mb-2 pb-2">
            <p>Folio: {data.id.slice(0, 8).toUpperCase()}</p>
            <p>Fecha: {new Date(data.fecha).toLocaleString('es-MX')}</p>
            <p>Alumna: {data.alumna}</p>
          </div>
          <div className="mb-4">
            {data.items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>{item.name}</span>
                <span>${item.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-black border-dashed pt-2 flex justify-between font-bold">
            <span>TOTAL ({data.metodo})</span>
            <span>${data.monto.toFixed(2)}</span>
          </div>
          <div className="text-center mt-8 pt-4 border-t border-black border-dashed">
            <p>¡Gracias por tu pago!</p>
            <p>www.epicmotion.mx</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
