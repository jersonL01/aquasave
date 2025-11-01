import Link from "next/link"

export default function HeroInicio() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center md:bg-[center_top]"
        style={{ backgroundImage: "url(/aquasavefondo.jpg)" }}
        aria-hidden
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45" aria-hidden />

      {/* Contenido centrado */}
      <div className="relative mx-auto max-w-4xl px-4 text-center text-white">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Bienvenido a <span className="text-sky-400">AquaSave</span>
        </h1>
        <p className="mt-5 text-base md:text-lg text-white/90">
          Mide tu consumo de agua, descubre cuánto puedes ahorrar y ayuda al planeta
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/signup" className="rounded-full bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 text-sm md:text-base transition shadow">
            Comenzar Ahora
          </Link>
          <Link
            href="/about"
            className="rounded-md bg-white/15 hover:bg-white/25 text-white px-6 py-3 text-sm md:text-base border border-white/20 backdrop-blur transition"
          >
            Saber más
          </Link>
        </div>
        <p className="mt-6 text-xs md:text-sm text-white/70">Haz clic en “Comenzar Ahora” para unirte</p>
      </div>
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70">
    © 2025 AquaSave
    </p>
    </section>
  )
}
