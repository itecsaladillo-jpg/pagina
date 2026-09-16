export default function Loading() {
  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-white px-4">
      <div className="relative flex items-center justify-center mb-6">
        <div className="w-16 h-16 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
        <div className="absolute w-8 h-8 rounded-full bg-emerald-500/10 backdrop-blur-md flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>
      <p className="text-zinc-400 text-sm font-medium tracking-wide animate-pulse">
        Cargando ITEC Saladillo...
      </p>
    </div>
  )
}
