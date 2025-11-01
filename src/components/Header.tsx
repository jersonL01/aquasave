"use client";
import Navbar from "./navbar";
export default function Header() {

  return (
    <header className="absolute inset-x-0 top-0 z-50 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Navbar />
      </div>
    </header>
  );
}
