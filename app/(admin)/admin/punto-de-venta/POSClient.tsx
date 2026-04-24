'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Package, 
  CreditCard, 
  Trash2, 
  Plus,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronDown,
  PlusCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { createProductAction, checkoutPOSAction } from '@/lib/actions/pos';
import NuevoProductoModal from './NuevoProductoModal';
import VentaExitosaModal from './VentaExitosaModal';

interface Cargo {
  id: string;
  montoFinal: number;
  concepto: { nombre: string };
  fechaVencimiento: Date;
}

interface Alumna {
  id: string;
  nombre: string;
  apellido: string;
  foto: string | null;
  padre: {
    id: string;
    nombre: string;
    apellido: string;
  };
  cargos: Cargo[];
}

interface Concepto {
  id: string;
  nombre: string;
  precioSugerido: number;
  tipo: string;
}

interface CartItem {
  id: string; // Unique ID for the cart (can be cargoId or a random one for new items)
  type: 'cargo' | 'product';
  name: string;
  price: number;
  originalId: string; // cargoId or conceptoId
}

interface Props {
  alumnas: Alumna[];
  conceptos: Concepto[];
}

export default function POSClient({ alumnas: initialAlumnas, conceptos: initialConceptos }: Props) {
  const [search, setSearch] = useState('');
  const [selectedAlumnaId, setSelectedAlumnaId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'>('EFECTIVO');
  
  // Estados para dropdown y modales
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Listas locales para actualización reactiva
  const [conceptos, setConceptos] = useState(initialConceptos);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrado de alumnas
  const filteredAlumnas = useMemo(() => {
    if (!search) return initialAlumnas.slice(0, 20); // Mostrar 20 primeras si no hay búsqueda pero está abierto
    return initialAlumnas.filter(a => 
      `${a.nombre} ${a.apellido}`.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 20);
  }, [initialAlumnas, search]);

  const selectedAlumna = useMemo(() => 
    initialAlumnas.find(a => a.id === selectedAlumnaId),
    [initialAlumnas, selectedAlumnaId]
  );

  const total = useMemo(() => 
    cart.reduce((sum, item) => sum + item.price, 0),
    [cart]
  );

  const addToCart = (item: CartItem) => {
    if (item.type === 'cargo' && cart.some(i => i.originalId === item.originalId)) return;
    setCart(prev => [...prev, item]);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const clearAlumna = () => {
    setSelectedAlumnaId(null);
    setSearch('');
    setIsDropdownOpen(false);
  };

  const handleProductAdded = (newProduct: any) => {
    setConceptos(prev => [newProduct, ...prev]);
    addToCart(newProduct, 'product');
  };

  const handleCheckout = async () => {
    if (!selectedAlumnaId) {
      toast.error('Selecciona una alumna antes de cobrar');
      return;
    }
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    setLoading(true);
    const res = await checkoutPOSAction({
      alumnaId: selectedAlumnaId,
      items: cart.map(i => ({
        type: i.type,
        originalId: i.originalId,
        price: i.price,
        name: i.name
      })),
      metodo: paymentMethod,
      total: total
    });
    setLoading(false);

    if (res.ok) {
      toast.success('Venta procesada correctamente');
      setLastSaleData({
        id: res.data.id,
        monto: Number(res.data.importe),
        metodo: res.data.metodoPago,
        fecha: res.data.fechaPago,
        alumna: `${selectedAlumna?.nombre} ${selectedAlumna?.apellido}`,
        items: cart.map(i => ({ name: i.name, price: i.price }))
      });
      setIsSuccessModalOpen(true);
      setCart([]);
      clearAlumna();
    } else {
      toast.error(res.error || 'Error al procesar la venta');
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
      
      {/* PANEL IZQUIERDO: Selección y Catálogo */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        
        {/* Selector de Alumna */}
        <section className={`glass-card rounded-[2rem] border-white/5 p-6 shadow-xl relative transition-all duration-300 ${isDropdownOpen ? 'z-[100] ring-1 ring-epic-gold/20' : 'z-[10]'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-epic-gold/10 text-epic-gold">
              <User size={20} />
            </div>
            <h2 className="font-montserrat font-bold text-white uppercase tracking-wider text-sm">
              Seleccionar Alumna
            </h2>
          </div>

          <div className="relative" ref={dropdownRef}>
            <div className="relative group">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDropdownOpen ? 'text-epic-gold' : 'text-white/20'}`} size={18} />
              <input 
                type="text" 
                placeholder="Buscar alumna por nombre o apellido..." 
                value={search}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setIsDropdownOpen(true);
                  if (selectedAlumnaId) setSelectedAlumnaId(null);
                }}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-sm font-inter text-white placeholder:text-white/20 focus:outline-none focus:border-epic-gold/50 transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {search || selectedAlumnaId ? (
                  <button 
                    onClick={clearAlumna}
                    className="p-2 text-white/20 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="p-2 text-white/20 hover:text-white transition-colors"
                  >
                    <ChevronDown size={18} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Resultados de búsqueda / Dropdown */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  className="absolute top-full left-0 right-0 mt-2 z-[110] bg-[#121212] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden max-h-[350px] flex flex-col backdrop-blur-3xl"
                >
                  <div className="p-2 border-b border-white/5 bg-white/[0.02]">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-2 py-1">
                      {search ? `Resultados para "${search}"` : 'Alumnas frecuentes / Recientes'}
                    </p>
                  </div>
                  <div className="overflow-y-auto custom-scrollbar p-1">
                    {filteredAlumnas.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm text-white/40 italic">No se encontraron alumnas.</p>
                      </div>
                    ) : (
                      filteredAlumnas.map(a => (
                        <button
                          key={a.id}
                          onClick={() => {
                            setSelectedAlumnaId(a.id);
                            setSearch(`${a.nombre} ${a.apellido}`);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 rounded-xl text-left transition-all ${selectedAlumnaId === a.id ? 'bg-epic-gold/10' : ''}`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-epic-gold/10 text-epic-gold flex items-center justify-center font-bold text-xs shrink-0 border border-epic-gold/20">
                            {a.nombre[0]}{a.apellido[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{a.nombre} {a.apellido}</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-tighter truncate">Tutor: {a.padre.nombre} {a.padre.apellido}</p>
                          </div>
                          <ChevronRight size={14} className="ml-auto text-white/20" />
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Información de Alumna Seleccionada */}
          <AnimatePresence>
            {selectedAlumna && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-6 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-epic-gold/20 to-epic-gold/5 border border-epic-gold/30 flex items-center justify-center text-epic-gold font-bold text-xl">
                      {selectedAlumna.nombre[0]}{selectedAlumna.apellido[0]}
                    </div>
                    <div>
                      <h3 className="font-montserrat font-bold text-xl text-white">
                        {selectedAlumna.nombre} {selectedAlumna.apellido}
                      </h3>
                      <p className="text-xs text-white/40 font-inter">Expediente activo · Responsable: {selectedAlumna.padre.nombre}</p>
                    </div>
                  </div>

                  {/* Cargos Pendientes */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-2">Mensualidades y Cargos Pendientes</p>
                    {selectedAlumna.cargos.length === 0 ? (
                      <div className="bg-white/[0.02] rounded-xl p-4 text-center border border-dashed border-white/5">
                        <p className="text-xs text-white/30 italic">No hay cargos pendientes para esta alumna.</p>
                      </div>
                    ) : (
                      selectedAlumna.cargos.map(cargo => {
                        const inCart = cart.some(i => i.originalId === cargo.id);
                        return (
                          <div 
                            key={cargo.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-epic-gold/30 transition-all"
                          >
                            <div>
                              <p className="text-sm font-bold text-white">{cargo.concepto.nombre}</p>
                              <p className="text-[10px] text-white/40">Vence: {new Date(cargo.fechaVencimiento).toLocaleDateString('es-MX')}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-bold text-epic-gold">
                                ${cargo.montoFinal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </span>
                              <button
                                onClick={() => addToCart({
                                  id: cargo.id,
                                  type: 'cargo',
                                  name: cargo.concepto.nombre,
                                  price: cargo.montoFinal,
                                  originalId: cargo.id
                                })}
                                disabled={inCart}
                                className={`p-2 rounded-lg transition-all ${inCart ? 'bg-green-500/10 text-green-400' : 'bg-epic-gold/10 text-epic-gold hover:bg-epic-gold hover:text-black'}`}
                              >
                                {inCart ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Catálogo de Conceptos */}
        <section className="flex-1 glass-card rounded-[2rem] border-white/5 p-6 shadow-xl flex flex-col min-h-0 relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Package size={20} />
              </div>
              <h2 className="font-montserrat font-bold text-white uppercase tracking-wider text-sm">
                Catálogo
              </h2>
            </div>
            
            <button 
              onClick={() => setIsNewProductModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all text-xs font-bold uppercase tracking-wider"
            >
              <PlusCircle size={14} className="text-epic-gold" />
              Nuevo Producto
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {conceptos.map(c => (
              <button
                key={c.id}
                onClick={() => addToCart({
                  id: Math.random().toString(36).substr(2, 9),
                  type: 'product',
                  name: c.nombre,
                  price: c.precioSugerido,
                  originalId: c.id
                })}
                className="group flex flex-col items-start p-4 rounded-[1.5rem] bg-white/[0.02] border border-white/5 hover:border-epic-gold/50 hover:bg-white/[0.04] transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 mb-3 group-hover:bg-epic-gold/10 group-hover:text-epic-gold transition-all">
                  <ShoppingCart size={18} />
                </div>
                <p className="text-xs font-bold text-white/80 line-clamp-2 leading-tight mb-1">{c.nombre}</p>
                <p className="text-sm font-bold text-epic-gold">${c.precioSugerido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* PANEL DERECHO: Carrito y Checkout */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6">
        
        <section className="flex-1 glass-card rounded-[2rem] border-white/5 flex flex-col shadow-2xl overflow-hidden bg-black/40 backdrop-blur-3xl">
          {/* Header Cart */}
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart size={18} className="text-epic-gold" />
              <h2 className="font-montserrat font-bold text-white text-sm uppercase tracking-widest">Resumen</h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold text-white/40">
              {cart.length} ITEMS
            </span>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
            <AnimatePresence initial={false}>
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-12">
                  <ShoppingCart size={48} className="mb-4" />
                  <p className="font-montserrat font-bold text-sm">CARRITO VACÍO</p>
                  <p className="text-xs mt-2">Agrega productos o cargos para cobrar</p>
                </div>
              ) : (
                cart.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between gap-4 group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-white/40 uppercase">{item.type === 'cargo' ? 'Deuda' : 'Producto'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white">
                        ${item.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Payment Method & Total */}
          <div className="px-6 py-6 bg-white/[0.02] border-t border-white/5 space-y-6">
            
            {/* Método de Pago */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Método de Pago</p>
              <div className="grid grid-cols-3 gap-2">
                {(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${
                      paymentMethod === m 
                        ? 'bg-epic-gold border-epic-gold text-black' 
                        : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    {m === 'EFECTIVO' ? 'EFEC' : m === 'TARJETA' ? 'TARJ' : 'TRANS'}
                  </button>
                ))}
              </div>
            </div>

            {/* Totales */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-white/40 text-xs">
                <span>Subtotal</span>
                <span>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between text-white font-bold text-xl pt-2 border-t border-white/5">
                <span>Total</span>
                <span className="text-epic-gold">${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <Button 
              disabled={cart.length === 0 || loading}
              onClick={handleCheckout}
              className="w-full h-14 rounded-2xl font-bold tracking-[0.2em] text-xs uppercase shadow-2xl flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <CreditCard size={18} />
                  Finalizar Venta
                </>
              )}
            </Button>
          </div>
        </section>
        
      </div>

      <NuevoProductoModal 
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        onSuccess={handleProductAdded}
      />

      <VentaExitosaModal 
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        data={lastSaleData}
      />

    </div>
  );
}
