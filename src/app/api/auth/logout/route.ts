// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  const clear = (name: string) =>
    res.cookies.set(name, "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });

  // Tus cookies
  clear("aq_uid");
  clear("token");

  // Cookies de NextAuth (dev/prod)
  clear("next-auth.session-token");
  clear("__Secure-next-auth.session-token");
  clear("next-auth.csrf-token");
  clear("next-auth.pkce.code_verifier");
  clear("next-auth.state");

  return res;
}
