"use client"

export type AquaUser = {
  nombre?: string
  apellido?: string
  email: string
}

const KEY = "aq_user"

export function setUser(u: AquaUser) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(u))
}

export function getUser(): AquaUser | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(KEY)
  try { return raw ? (JSON.parse(raw) as AquaUser) : null } catch { return null }
}

export function clearUser() {
  if (typeof window === "undefined") return
  localStorage.removeItem(KEY)
}

/** Divide "Juan Pérez Soto" → {nombre:"Juan Pérez", apellido:"Soto"} */
export function splitNombreCompleto(full?: string): { nombre?: string; apellido?: string } {
  if (!full) return {}
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return { nombre: parts[0], apellido: "" }
  const apellido = parts.pop() || ""
  return { nombre: parts.join(" "), apellido }
}
