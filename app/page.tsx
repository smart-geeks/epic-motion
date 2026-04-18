import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import ValoresCards from '@/components/landing/ValoresCards';
import EstilosGrid from '@/components/landing/EstilosGrid';
import Nosotros from '@/components/landing/Nosotros';
import GaleriaTikTok from '@/components/landing/GaleriaTikTok';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';
import { prisma } from '@/lib/prisma';
import type { DisciplinaPublica } from '@/app/api/disciplinas/route';

// Imágenes de respaldo por disciplina — se usan si la BD no tiene imagenUrl configurada todavía
const IMAGEN_FALLBACK: Record<string, string> = {
  Ballet:        '/images/ballet.webp',
  'Hip-Hop':     '/images/hiphop.webp',
  Tap:           '/images/hiphop.webp',
  Jazz:          '/images/contemporaneo.webp',
  Acro:          '/images/contemporaneo.webp',
  Contemporáneo: '/images/contemporaneo.webp',
};

async function getDisciplinas(): Promise<DisciplinaPublica[]> {
  try {
    const rows = await prisma.disciplina.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, descripcion: true, imagenUrl: true, color: true },
      orderBy: { nombre: 'asc' },
    });
    // Aplicar imagen de respaldo si imagenUrl no está configurada en la BD
    return rows.map((d: DisciplinaPublica) => ({
      ...d,
      imagenUrl: d.imagenUrl ?? IMAGEN_FALLBACK[d.nombre] ?? '/images/ballet.webp',
    }));
  } catch {
    return [];
  }
}

export default async function Home() {
  const disciplinas = await getDisciplinas();

  return (
    <main>
      <Navbar />
      <Hero />
      <ValoresCards />
      <EstilosGrid disciplinas={disciplinas} />
      <Nosotros />
      <GaleriaTikTok />
      <CTASection />
      <Footer />
    </main>
  );
}
