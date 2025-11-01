// src/app/perfil/page.tsx
import type { Metadata } from "next";
import Perfil from "@/components/Perfil";
import TopNavApp from "@/components/TopNavApp";

export const metadata: Metadata = {
  title: "Mi Perfil • AquaSave",
};

export default function PerfilPage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-sky-900/30 to-sky-900/10 pt-6 pb-12">
      <TopNavApp /> 
      <div className="mx-auto max-w-5xl px-4 mt-5">
        <Perfil />
      </div>
    </main>
  );
}
