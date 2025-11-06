// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

const sql = neon(process.env.DATABASE_URL!);

export const authOptions: NextAuthOptions = {
  providers: [
    // 🔵 Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // 🟣 Credenciales propias (correo + pass de tu tabla usuarios)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // buscamos el usuario por email
        const rows = await sql/*sql*/`
          SELECT id, email, pass, nombre, tipo
          FROM public.usuarios
          WHERE email = ${credentials.email}
          LIMIT 1
        `;
        const user = Array.isArray(rows) ? rows[0] : (rows as any)[0];
        if (!user) return null;

        // la columna se llama pass en tu tabla
        const hash = user.pass as string;
        const ok = await bcrypt.compare(credentials.password, hash);
        if (!ok) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.nombre,
          tipo: user.tipo ?? "usuario",
        };
      },
    }),
  ],

  pages: {
    signIn: "/login", // tu página de login
  },

  session: { strategy: "jwt" },

  callbacks: {
    // cuando entra por Google, lo upserteamos en tu tabla
    async signIn({ user, account }) {
      if (account?.provider === "google") {
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
        } catch (e) {
          console.error("Upsert user failed:", e);
          // igual dejamos entrar
        }
      }
      return true;
    },

    // meter id y tipo al token
    async jwt({ token }) {
      if (token?.email) {
        try {
          const rows = await sql/*sql*/`
            SELECT id, nombre, tipo
            FROM public.usuarios
            WHERE email = ${token.email}
            LIMIT 1
          `;
          const u = Array.isArray(rows) ? rows[0] : (rows as any)[0];
          if (u) {
            (token as any).userId = u.id;
            (token as any).tipo = u.tipo ?? "usuario";
            token.name = u.nombre ?? token.name;
          }
        } catch (e) {
          console.error("read user failed:", e);
        }
      }
      return token;
    },

    // lo mismo pero para la sesión del cliente
    async session({ session, token }) {
      (session.user as any).id = (token as any).userId;
      (session.user as any).tipo = (token as any).tipo ?? "usuario";
      return session;
    },

    async redirect({ baseUrl }) {
      return `${baseUrl}/principal`;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
