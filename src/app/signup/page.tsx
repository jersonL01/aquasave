"use client"
import FormRegistro from "@/components/FormRegistro"

export default function SignupPage() {
  return (
    <section className="relative min-h-screen grid place-items-center overflow-hidden">
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/aquasavefondo.jpg)" }}
        aria-hidden
      />
      {/* Oscurecer para legibilidad */}
      <div className="absolute inset-0 bg-black/40" aria-hidden />

      <div className="relative w-full max-w-2xl px-4">
        <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 md:p-8 shadow-2xl">
          <h1 className="text-center text-3xl md:text-4xl font-bold text-white mb-6">Registrarse</h1>
          <FormRegistro />
        </div>
      </div>
    </section>
  )
}
