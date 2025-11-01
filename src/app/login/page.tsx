"use client"
// Opción B (relativa, 100% segura)
import FormLogin from "../../components/FormLogin"


export default function LoginPage() {
  return (
    <section className="relative min-h-screen grid place-items-center overflow-hidden">
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/aquasavefondo.jpg)" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      {/* Card */}
      <div className="relative w-full max-w-xl px-4">
        <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 md:p-8 shadow-2xl">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-sky-600/70 grid place-items-center shadow-lg">
            <span className="text-3xl text-white">👤</span>
          </div>
          <FormLogin />
      
        </div>
      </div>
    </section>
  )
}
