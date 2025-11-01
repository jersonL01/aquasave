"use client"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

const slides = [
  { src: "/campaña1.jpg", alt: "campaña1" },
  { src: "/campaña2.jpg", alt: "campaña2" },
  { src: "/campaña3.jpg", alt: "campaña3" },
]

export default function CarouselSimple() {
  const [i, setI] = useState(0)
  const prev = () => setI((i - 1 + slides.length) % slides.length)
  const next = () => setI((i + 1) % slides.length)

  // ← → con teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <div className="relative w-full max-w-4xl mx-auto overflow-visible">
      {/* Marco */}
      <div className="relative aspect-[16/9] rounded-3xl overflow-hidden border border-white/15 bg-white/10 backdrop-blur-md shadow-2xl">
        <Image src={slides[i].src} alt={slides[i].alt} fill className="object-cover" priority />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
      </div>

      {/* FLECHAS – SIEMPRE VISIBLES, MÁS AFUERA, GLASS */}
      <button
        onClick={prev}
        aria-label="Anterior"
        className="
          absolute top-1/2 -translate-y-1/2 z-10
          left-[-28px] sm:left-[-40px] lg:left-[-56px]
          inline-flex items-center justify-center
          h-12 w-12 rounded-full
          bg-gradient-to-b from-white/28 to-white/14
          text-white
          ring-1 ring-white/30 shadow-xl shadow-black/25
          backdrop-blur-xl
          transition-transform duration-200 hover:-translate-x-0.5 focus:-translate-x-0.5
          hover:shadow-2xl focus:shadow-2xl
          focus:outline-none focus:ring-2 focus:ring-white/60
        "
      >
        <ChevronLeft className="h-6 w-6 drop-shadow" />
      </button>

      <button
        onClick={next}
        aria-label="Siguiente"
        className="
          absolute top-1/2 -translate-y-1/2 z-10
          right-[-28px] sm:right-[-40px] lg:right-[-56px]
          inline-flex items-center justify-center
          h-12 w-12 rounded-full
          bg-gradient-to-b from-white/28 to-white/14
          text-white
          ring-1 ring-white/30 shadow-xl shadow-black/25
          backdrop-blur-xl
          transition-transform duration-200 hover:translate-x-0.5 focus:translate-x-0.5
          hover:shadow-2xl focus:shadow-2xl
          focus:outline-none focus:ring-2 focus:ring-white/60
        "
      >
        <ChevronRight className="h-6 w-6 drop-shadow" />
      </button>

      {/* Dots */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === i ? "w-8 bg-white" : "w-4 bg-white/60 hover:bg-white/80"
            }`}
            aria-label={`Ir al slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
