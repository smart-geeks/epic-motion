"use client";

import { useSession } from "next-auth/react";

export default function PadreHomePage() {
  const { data: session } = useSession();
  const nombre = session?.user?.nombre?.split(" ")[0] ?? "Bienvenido";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-montserrat font-bold dark:text-white text-gray-900 tracking-[0.03em]">
          Hola, {nombre}
        </h1>
        <p className="mt-1 text-sm font-inter dark:text-epic-silver text-gray-500">
          Aquí encontrarás noticias, notas y el progreso de tus hijas.
        </p>
      </div>

      <div className="dark:bg-epic-gray bg-white rounded-2xl border dark:border-white/5 border-gray-200 p-8 text-center shadow-sm">
        <p className="text-sm font-inter dark:text-epic-silver text-gray-400 tracking-[0.02em]">
          El contenido del home se implementará en la siguiente fase.
        </p>
      </div>
    </div>
  );
}
