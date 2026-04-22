export default function ReportesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-2">
        <div className="space-y-2">
          <div className="h-2 w-16 bg-white/10 rounded-full" />
          <div className="h-8 w-64 bg-white/10 rounded-lg" />
          <div className="h-4 w-48 bg-white/5 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-card rounded-[2rem] p-5 h-32 flex flex-col justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5" />
            <div className="h-6 w-32 bg-white/10 rounded-md" />
            <div className="h-3 w-24 bg-white/5 rounded-md" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-[2.5rem] p-6 lg:col-span-2 h-[380px] bg-white/[0.02]" />
        <div className="glass-card rounded-[2.5rem] p-6 h-[380px] bg-white/[0.02]" />
      </div>
    </div>
  );
}
