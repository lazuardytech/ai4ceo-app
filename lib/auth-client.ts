import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { auth } from "./auth";

// Use a relative baseURL on the server so the incoming request cookies
// are forwarded with SSR fetches. On the client, same-origin is also fine.
// This fixes false unauthenticated state during SSR that caused redirects.
const isServer = typeof window === "undefined";
const baseURL = isServer ? "" : (process.env.NEXT_PUBLIC_AUTH_URL || "");

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
        },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
