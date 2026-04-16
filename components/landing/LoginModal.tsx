'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

// Mapa de redirección por rol después del login
const REDIRECT_BY_ROL: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  MAESTRO: '/maestro/agenda',
  PADRE: '/padre/home',
  RECEPCIONISTA: '/admin/dashboard',
};

export default function LoginModal({ isOpen, onClose, isDark }: LoginModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cerrar con ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false, // manejamos la redirección manualmente para poder mostrar errores
    });

    setLoading(false);

    if (!result || result.error) {
      toast.error('Credenciales incorrectas', {
        description: 'Verifica tu correo y contraseña.',
      });
      return;
    }

    // Obtener el rol del usuario recién autenticado para redirigir
    // next-auth actualiza la sesión tras signIn exitoso
    const { getSession } = await import('next-auth/react');
    const session = await getSession();
    const rol = (session?.user as { rol?: string })?.rol;
    const destino = (rol && REDIRECT_BY_ROL[rol]) ?? '/admin/dashboard';

    onClose();
    router.push(destino);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="relative w-full max-w-md pointer-events-auto bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/8 shadow-2xl">
              {/* Botón cerrar */}
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="absolute top-4 right-4 p-1.5 text-gray-400 dark:text-white/30 hover:text-epic-black dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              <div className="px-8 py-10 sm:px-10">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                  <Image
                    src={isDark ? '/logo.png' : '/logo-light.png'}
                    alt="Epic Motion"
                    width={140}
                    height={46}
                    className="h-10 w-auto object-contain"
                  />
                </div>

                {/* Título */}
                <div className="mb-7 text-center">
                  <h2 className="font-montserrat font-bold text-sm tracking-[0.2em] uppercase text-epic-black dark:text-white">
                    Iniciar Sesión
                  </h2>
                  <div className="w-8 h-px bg-epic-gold mx-auto mt-3" />
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Email */}
                  <div>
                    <label className="block font-inter text-xs font-medium tracking-wide text-gray-500 dark:text-epic-silver mb-1.5 uppercase">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full font-inter text-sm px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-epic-black dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:border-epic-gold transition-colors"
                    />
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label className="block font-inter text-xs font-medium tracking-wide text-gray-500 dark:text-epic-silver mb-1.5 uppercase">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full font-inter text-sm px-4 py-3 pr-11 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-epic-black dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:border-epic-gold transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* ¿Olvidaste tu contraseña? */}
                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      onClick={() => toast('Próximamente', { description: 'La recuperación de contraseña estará disponible en el Mes 1.' })}
                      className="font-inter text-xs text-gray-400 dark:text-epic-silver hover:text-epic-gold dark:hover:text-epic-gold transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  {/* Botón submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative mt-2 w-full overflow-hidden font-montserrat font-bold text-xs tracking-[0.2em] uppercase px-6 py-4 bg-epic-black dark:bg-epic-gold text-white dark:text-epic-black disabled:opacity-60 transition-opacity"
                  >
                    <span className="relative z-10">
                      {loading ? 'Verificando...' : 'Iniciar Sesión'}
                    </span>
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
