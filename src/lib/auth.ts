import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
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
    async signIn({ user, account, profile: _profile }) {
      if (account?.type === 'oauth' && account.provider === 'google') {
        try {
          // Check if this is a new user
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });

          if (!existingUser) {
            // This is a new user, check for invitation in state
            const state = account.state && typeof account.state === 'string' ? JSON.parse(account.state) : null;
            const invitationToken = state?.invitationToken;

            if (invitationToken) {
              // Find the invitation
              const invitation = await prisma.invitation.findUnique({
                where: { token: invitationToken },
                include: { organization: true }
              });

              if (invitation && invitation.status === 'PENDING') {
                // Create user and handle invitation in a transaction
                const result = await prisma.$transaction(async (tx) => {
                  // Create the user
                  const newUser = await tx.user.create({
                    data: {
                      email: user.email!,
                      name: user.name || user.email!.split('@')[0],
                    }
                  });

                  // Create organization membership
                  await tx.organizationMember.create({
                    data: {
                      organizationId: invitation.organizationId,
                      userId: newUser.id,
                      role: 'MEMBER',
                    },
                  });

                  // If there's project metadata, add to project
                  if (invitation.invitationMetadata) {
                    try {
                      const metadata = JSON.parse(invitation.invitationMetadata);
                      if (metadata.projectId) {
                        await tx.user.update({
                          where: { id: newUser.id },
                          data: {
                            projects: {
                              connect: { id: metadata.projectId }
                            }
                          }
                        });
                      }
                    } catch (e) {
                      console.error('Error parsing invitation metadata:', e);
                    }
                  }

                  // Update invitation status
                  await tx.invitation.update({
                    where: { token: invitationToken },
                    data: { status: 'ACCEPTED' },
                  });

                  return {
                    user: newUser,
                    organizationId: invitation.organizationId,
                  };
                });

                // Store the organization ID to use in the session
                (user as { organizationId?: string }).organizationId = result.organizationId;
              }
            }
          }
        } catch (error) {
          console.error('Error in Google sign in:', error);
        }
      }
      return true;
    },

    async redirect({ url, baseUrl }) {
      // If we have an organizationId in the URL, redirect to it
      const parsedUrl = new URL(url, baseUrl);
      const organizationId = parsedUrl.searchParams.get('organizationId');
      
      if (organizationId) {
        return `/organizations/${organizationId}`;
      }
      
      return url;
    },

    async jwt({ token, user }): Promise<ExtendedJWT> {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        // Pass through any organizationId from the user
        const userWithOrg = user as { organizationId?: string };
        if (userWithOrg.organizationId) {
          (token as { organizationId?: string }).organizationId = userWithOrg.organizationId;
        }
      }
      return token as ExtendedJWT;
    },

    async session({ session, token }): Promise<ExtendedSession> {
      // Pass through any organizationId from the token
      const tokenWithOrg = token as { organizationId?: string };
      if (tokenWithOrg.organizationId) {
        (session as { organizationId?: string }).organizationId = tokenWithOrg.organizationId;
      }
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },

  }
} satisfies NextAuthConfig;

export const { auth, signIn, signOut, handlers } = NextAuth(config);
