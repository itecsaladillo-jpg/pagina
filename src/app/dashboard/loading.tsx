export default function DashboardLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-zinc-800/60 rounded-lg" />
          <div className="h-4 w-72 bg-zinc-800/40 rounded" />
        </div>
        <div className="h-10 w-32 bg-zinc-800/60 rounded-xl" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-3"
          >
            <div className="h-4 w-28 bg-zinc-800/60 rounded" />
            <div className="h-8 w-20 bg-zinc-800 rounded" />
            <div className="h-3 w-40 bg-zinc-800/30 rounded" />
          </div>
        ))}
      </div>

      {/* Content Area Skeleton */}
      <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-4">
        <div className="h-5 w-40 bg-zinc-800/70 rounded" />
        <div className="space-y-2.5">
          <div className="h-12 w-full bg-zinc-800/30 rounded-xl" />
          <div className="h-12 w-full bg-zinc-800/30 rounded-xl" />
          <div className="h-12 w-full bg-zinc-800/30 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
