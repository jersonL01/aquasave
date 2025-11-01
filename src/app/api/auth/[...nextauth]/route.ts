// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

const sql = neon(process.env.DATABASE_URL!); // con ?sslmode=require

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // Mapea la página de login a tu /login (evita /auth/* antiguas)
  pages: {
    signIn: "/login",
  },

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      const providerId = (account as any)?.providerAccountId ?? null;
      try {
        await sql/*sql*/`
          INSERT INTO public.usuarios (nombre, email, telefono, pass, tipo, provider, provider_id)
          VALUES (${user.name ?? ""}, ${user.email}, NULL, DEFAULT,
                  COALESCE((SELECT tipo FROM public.usuarios WHERE email=${user.email}), 'usuario'),
                  'google', ${providerId})
          ON CONFLICT (email) DO UPDATE
            SET nombre      = EXCLUDED.nombre,
                provider    = 'google',
                provider_id = COALESCE(public.usuarios.provider_id, EXCLUDED.provider_id)
        `;
        return true;
      } catch (e) {
        console.error("Upsert user failed:", e);
        return "/login?error=Configuration";
      }
    },

    async jwt({ token }) {
      if (token?.email) {
        try {
          const rows = await sql/*sql*/`
            SELECT id, nombre, tipo
            FROM public.usuarios
            WHERE email = ${token.email}
            LIMIT 1
          `;
          const u = rows[0] as any;
          if (u) {
            (token as any).userId = u.id;
            (token as any).tipo = u.tipo ?? "usuario";
            token.name = u.nombre ?? token.name;
          } else {
            (token as any).tipo = (token as any).tipo ?? "usuario";
          }
        } catch (e) {
          console.error("read user failed:", e);
          (token as any).tipo = (token as any).tipo ?? "usuario";
        }
      }
      return token;
    },

    async session({ session, token }) {
      (session.user as any).id = (token as any).userId;
      (session.user as any).tipo = (token as any).tipo ?? "usuario";
      return session;
    },

    // 🔒 FIX: fuerzo el post-login SIEMPRE a /principal, sin importar lo que venga en cookies antiguas
    async redirect({ baseUrl }) {
      return `${baseUrl}/principal`;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
