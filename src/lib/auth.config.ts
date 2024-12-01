import { AuthConfig } from "@auth/core";

export const authConfig: AuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {},
  providers: [], // configured in auth.ts
} as const;
