'use client';

import { 
  Globe, 
  Image as ImageIcon, 
  MessageSquare, 
  Info, 
  Bell,
  Palette
} from 'lucide-react';
import ConfigCard from '@/components/ui/ConfigCard';

const LANDING_MODULES = [
  {
    title: 'Textos y Mensajes',
    desc: 'Edita eslóganes, misión y descripciones de clases.',
    icon: MessageSquare,
    color: 'text-epic-gold',
    bg: 'bg-epic-gold/10'
  },
  {
    title: 'Galería Digital',
    desc: 'Administra fotos de las instalaciones y eventos.',
    icon: ImageIcon,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10'
  },
  {
    title: 'Diseño y Colores',
    desc: 'Ajusta la paleta de colores de la marca en la web.',
    icon: Palette,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10'
  },
  {
    title: 'Información Global',
    desc: 'Ubicación, contacto y redes sociales.',
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10'
  },
  {
    title: 'Comunicados',
    desc: 'Muro de noticias y avisos para el portal de padres.',
    icon: Bell,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10'
  }
];

export default function TabLandingAcademia() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LANDING_MODULES.map((mod) => (
          <ConfigCard key={mod.title} interactive>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-2xl ${mod.bg} flex items-center justify-center shrink-0`}>
                <mod.icon size={22} className={mod.color} />
              </div>
              <h3 className="font-montserrat font-bold text-white tracking-tight">
                {mod.title}
              </h3>
            </div>
            <p className="text-sm font-inter text-white/40 leading-relaxed ps-1">
              {mod.desc}
            </p>
          </ConfigCard>
        ))}
      </div>
    </div>
  );
}
