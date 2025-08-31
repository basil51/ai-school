import { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import argon2 from "argon2";

const prisma = new PrismaClient();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Email & Password",
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const parsed = credentialsSchema.safeParse(creds);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;
        const ok = await argon2.verify(user.password, password);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).role = token.role;
      (session as any).user = {
        ...session.user,
        id: token.sub,
        role: token.role
      };
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle signin redirects to our custom signin page
      if (url.startsWith('/api/auth/signin')) {
        return `${baseUrl}/en/signin`;
      }
      // Allow relative URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allow URLs from the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
};
