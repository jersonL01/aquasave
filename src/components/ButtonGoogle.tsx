// components/ButtonGoogle.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type ButtonGoogleProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  /** A dónde redirigir después del login de Google.
   *  Por defecto usamos el "bridge" que sincroniza cookies. */
  callbackUrl?: string;
};

export default function GoogleSignInButton({
  loading: loadingProp = false,
  className = "",
  callbackUrl = "/auth/google-bridge",
  onClick,
  ...props
}: ButtonGoogleProps) {
  const [loading, setLoading] = useState(loadingProp);

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    // permite que el padre cancele si quiere
    onClick?.(e);
    if (e.defaultPrevented) return;

    if (loading) return; // evita doble envío
    setLoading(true);
    try {
      // NextAuth redirige automáticamente cuando hay callbackUrl
      await signIn("google", { callbackUrl });
      // no hace falta setLoading(false) porque habrá redirect
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setLoading(false); // solo si falló
    }
  }

  return (
    <button
      type="button"
      aria-label="Iniciar sesión con Google"
      aria-busy={loading}
      disabled={loading || props.disabled}
      onClick={handleClick}
      className={[
        "w-full h-11 inline-flex items-center justify-center gap-3 rounded-lg px-4",
        "bg-white text-slate-900 font-semibold",
        "border border-white/30 backdrop-blur-sm",
        "shadow-[0_6px_20px_rgba(0,0,0,0.35)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.45)]",
        "transition focus:outline-none focus:ring-2 focus:ring-white/60",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      ].join(" ")}
      {...props}
    >
      {/* Google "G" multicolor (SVG inline) */}
      <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 31.8 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.8 5 29.7 3 24 3 12.3 3 3 12.3 3 24s9.3 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.1-2.7-.4-3.5z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.4 18.9 14 24 14c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.8 5 29.7 3 24 3 16.1 3 9.2 7.6 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.5-5.3l-6.2-5.1C29.3 35.8 26.8 37 24 37c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.1 40.4 16 45 24 45z"/>
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 3.1-3.9 5-7.3 5-3.2 0-5.9-2.1-6.9-5l-6.5 5C16 37.7 19.8 40 24 40c10.5 0 20-7.6 20-21 0-1.3-.1-2.7-.4-3.5z"/>
      </svg>

      <span>{loading ? "Conectando…" : "Continuar con Google"}</span>
    </button>
  );
}
