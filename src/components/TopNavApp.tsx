"use client";

import { alertConfirm, toastSuccess } from "@/lib/alerts";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, User as UserIcon, LogOut, HelpCircle, History } from "lucide-react";
import LogoAquaSave from "./LogoAquaSave";
import { getUser, clearUser, type AquaUser } from "@/lib/user";

const links = [
  { href: "/principal", label: "Home" },
  { href: "/gamificacion", label: "Gamificación" },
  { href: "/dispositivos", label: "Dispositivos" },
  { href: "/reportes", label: "Reportes" },
  { href: "/campanias", label: "Campañas" },
  { href: "/consumo", label: "Consumo" },
];

export default function TopNavApp() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<AquaUser | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 1) Carga inmediata desde localStorage, 2) intenta /api/me para refrescar
  useEffect(() => {
    // inmediato
    setUser(getUser());

    // refresco opcional desde API (si tienes sesión en server)
    (async () => {
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        if (j?.ok && j?.user) setUser(j.user as AquaUser);
      } catch {
        /* silencio: seguimos con el user del localStorage */
      }
    })();

    setOpen(false); // cerrar menú al navegar
  }, [pathname]);

  // Cerrar al hacer click fuera / Escape
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("click", onClick);
    };
  }, []);

  const isActive = (href: string) => (href !== "/principal" ? pathname.startsWith(href) : pathname === "/principal");

  const fullName = user ? `${user.nombre ?? ""} ${user.apellido ?? ""}`.trim() || "Usuario" : "Usuario";
  const initials =
    user?.nombre || user?.apellido
      ? `${(user?.nombre ?? "").charAt(0)}${(user?.apellido ?? "").charAt(0)}`.toUpperCase()
      : "U";

  const handleLogout = async () => {
  const ok = await alertConfirm(); 
  if (!ok) return;

  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {}
  clearUser();

  await toastSuccess("Sesión cerrada");
  router.push("/login");
};

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-gradient-to-b from-sky-900/80 to-sky-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center text-white">
          {/* Logo */}
          <Link href="/">
            <LogoAquaSave />
          </Link>

          {/* Menú centrado */}
          <nav className="flex-1 flex justify-center">
            <ul className="flex items-center gap-6">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`px-3 py-2 text-[15px] font-semibold tracking-wide rounded-md transition ${
                      isActive(l.href) ? "text-white" : "text-white/90 hover:text-white"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Notificaciones + Usuario */}
          <div className="ml-auto flex items-center gap-3" ref={menuRef}>
            <button
              className="rounded-full bg-white/15 hover:bg-white/25 p-2 transition"
              title="Notificaciones"
              aria-label="Notificaciones"
            >
              <Bell className="size-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 px-3 py-1 transition"
                aria-haspopup="menu"
                aria-expanded={open}
                title={fullName}
              >
                {/* Avatar con iniciales */}
                <span className="inline-grid place-items-center size-6 rounded-full bg-white/25 text-xs font-semibold">
                  {initials}
                </span>
                <span className="text-sm font-medium truncate max-w-[160px]">{fullName}</span>
                <ChevronDown className="size-4 opacity-80" />
              </button>

              {open && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-white text-gray-800 shadow-lg overflow-hidden"
                >
                  <Link
                    href="/perfil"
                    role="menuitem"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm"
                  >
                    <UserIcon className="size-4" /> Ver Perfil
                  </Link>
                  <Link
                    href="/historial"
                    role="menuitem"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm"
                  >
                    <History className="size-4" /> Historial de Consumo
                  </Link>
                  <Link
                    href="/ayuda"
                    role="menuitem"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm"
                  >
                    <HelpCircle className="size-4" /> Ayuda/Soporte
                  </Link>
                  <Link
                    href="/consumo"
                    role="menuitem"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm"
                  >
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor">
                      <path d="M12 3C12 8 6 9 6 14a6 6 0 0 0 12 0c0-5-6-6-6-11Z" strokeWidth="2" />
                    </svg>
                    Consumo de agua
                  </Link>
                  <button
                    onClick={handleLogout}
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-4 py-2 hover:bg-red-50 text-sm text-red-600"
                  >
                    <LogOut className="size-4" /> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
