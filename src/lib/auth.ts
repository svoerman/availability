import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import type { User as PrismaUser } from "@prisma/client";
import type { User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

interface Credentials {
  email: string;
  password: string;
}

interface ExtendedJWT extends JWT {
  id: string;
  email: string;
}

interface ExtendedSession extends Session {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

export const config = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials: Partial<Credentials>): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user?.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        
        if (!isValid) return null;
        
        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          image: user.image,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }): Promise<ExtendedJWT> {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token as ExtendedJWT;
    },
    async session({ session, token }): Promise<ExtendedSession> {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session as ExtendedSession;
    }
  },
} satisfies NextAuthConfig;

export const { auth, signIn, signOut, handlers } = NextAuth(config);
