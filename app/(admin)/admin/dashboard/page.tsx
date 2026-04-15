import { Users, CalendarCheck, CreditCard, UserCheck } from "lucide-react";

const CARDS = [
  {
    label: "Total alumnas",
    valor: "—",
    icon: Users,
    color: "dark:bg-blue-500/10 bg-blue-50 dark:text-blue-400 text-blue-600",
  },
  {
    label: "Clases hoy",
    valor: "—",
    icon: CalendarCheck,
    color: "dark:bg-epic-gold/10 bg-yellow-50 dark:text-epic-gold text-yellow-600",
  },
  {
    label: "Pagos pendientes",
    valor: "—",
    icon: CreditCard,
    color: "dark:bg-red-500/10 bg-red-50 dark:text-red-400 text-red-600",
  },
  {
    label: "Maestros activos",
    valor: "—",
    icon: UserCheck,
    color: "dark:bg-green-500/10 bg-green-50 dark:text-green-400 text-green-600",
  },
];

export default function DashboardPage() {
  return (
    <div>
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-2xl font-montserrat font-bold dark:text-white text-gray-900 tracking-[0.03em]">
          Resumen del día
        </h1>
        <p className="mt-1 text-sm font-inter dark:text-epic-silver text-gray-500">
          Bienvenida, Luz. Aquí tienes el resumen de hoy.
        </p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {CARDS.map(({ label, valor, icon: Icon, color }) => (
          <div
            key={label}
            className="dark:bg-epic-gray bg-white rounded-2xl border dark:border-white/5 border-gray-200 p-5 flex items-center gap-4 shadow-sm"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-montserrat font-bold dark:text-white text-gray-900">
                {valor}
              </p>
              <p className="text-xs font-inter dark:text-epic-silver text-gray-500 mt-0.5 tracking-[0.02em]">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder de contenido futuro */}
      <div className="dark:bg-epic-gray bg-white rounded-2xl border dark:border-white/5 border-gray-200 p-8 text-center shadow-sm">
        <p className="text-sm font-inter dark:text-epic-silver text-gray-400 tracking-[0.02em]">
          El contenido del dashboard se completará en la siguiente fase del proyecto.
        </p>
      </div>
    </div>
  );
}
