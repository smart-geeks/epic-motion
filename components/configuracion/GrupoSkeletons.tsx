export function SkeletonGrupo() {
  return (
    <div className="dark:bg-[#121212] bg-white rounded-xl border dark:border-white/8 border-gray-200 p-4 space-y-3 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 w-28 rounded dark:bg-white/10 bg-gray-200" />
        <div className="h-4 w-10 rounded dark:bg-white/10 bg-gray-200" />
      </div>
      <div className="space-y-1.5">
        <div className="h-1.5 w-full rounded-full dark:bg-white/10 bg-gray-200" />
        <div className="h-3 w-16 rounded dark:bg-white/10 bg-gray-200" />
      </div>
      <div className="space-y-1">
        <div className="h-3 w-32 rounded dark:bg-white/10 bg-gray-200" />
        <div className="h-3 w-24 rounded dark:bg-white/10 bg-gray-200" />
      </div>
      <div className="h-4 w-20 rounded dark:bg-white/10 bg-gray-200" />
    </div>
  );
}

export function SkeletonAlumna() {
  return (
    <div className="flex items-center gap-3 px-3 py-3 animate-pulse">
      <div className="w-9 h-9 rounded-full dark:bg-white/10 bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-32 rounded dark:bg-white/10 bg-gray-200" />
        <div className="h-3 w-20 rounded dark:bg-white/10 bg-gray-200" />
      </div>
      <div className="h-7 w-36 rounded-lg dark:bg-white/10 bg-gray-200 shrink-0" />
      <div className="h-6 w-6 rounded dark:bg-white/10 bg-gray-200 shrink-0" />
    </div>
  );
}
