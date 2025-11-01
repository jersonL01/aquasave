// src/lib/auth.ts
import { cookies } from "next/headers"

export async function requireUserId() {
  const jar = await cookies()
  const uid = jar.get("aq_uid")?.value
  if (!uid) throw new Error("Unauthorized")
  return uid
}
