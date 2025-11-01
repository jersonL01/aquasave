"use client"
import TopNavApp from "@/components/TopNavApp"
import CarouselSimple from "@/components/CarouselSimple"
import ActionCards from "@/components/ActionCards"

export default function PrincipalPage() {
  return (
    <div className="relative min-h-screen text-white">
      {/* Fondo correcto */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url(/fondo2.jpg)" }}
        aria-hidden
      />
      {/* Overlay para legibilidad */}
      <div className="absolute inset-0 -z-10 bg-sky-950/70" aria-hidden />

      <TopNavApp />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <CarouselSimple />
        <ActionCards />
      </main>
    </div>
  )
}
