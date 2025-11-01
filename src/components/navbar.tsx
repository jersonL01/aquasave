"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-transparent">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <h1 className="text-2xl font-bold text-white">
          <img src="/img/logo.png" alt="Logo" height={80} width={110} />
        </h1>

        {/* Links */}
        <ul className="flex gap-6 text-white font-medium items-center">
          <li>
            <Link href="/" className="hover:text-blue-300 transition">
              Inicio
            </Link>
          </li>
          <li>
            <Link href="/sobre" className="hover:text-blue-300 transition">
              Sobre Nosotros
            </Link>
          </li>
          <li>
            <Link href="/contacto" className="hover:text-blue-300 transition">
              Contacto
            </Link>
          </li>
          <li>
            <Link href="login" className="hover:opacity-80 transition flex items-center">
              <img src="/img/login.png" alt="Login" className="w-7 h-7" />
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
