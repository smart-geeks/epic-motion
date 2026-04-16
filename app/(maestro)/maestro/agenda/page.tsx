export default function AgendaPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-montserrat font-bold dark:text-white text-gray-900 tracking-[0.03em]">
          Mi agenda
        </h1>
        <p className="mt-1 text-sm font-inter dark:text-epic-silver text-gray-500">
          Tus clases programadas para hoy y esta semana.
        </p>
      </div>

      <div className="dark:bg-epic-gray bg-white rounded-2xl border dark:border-white/5 border-gray-200 p-8 text-center shadow-sm">
        <p className="text-sm font-inter dark:text-epic-silver text-gray-400 tracking-[0.02em]">
          La agenda de clases se implementará en la siguiente fase.
        </p>
      </div>
    </div>
  );
}
