import { betterAuth, generateId } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { user, session, account, verification } from "./db/schema";
import { customSession } from "better-auth/plugins";
import { findUserRoles } from "./db/queries";
import { nextCookies } from "better-auth/next-js";
import { randomUUID } from "node:crypto";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    database: {
      generateId: ({ model, size }) => (model === "user" ? randomUUID() : generateId(size ?? 24)),
    },
  },
  user: {
    model: "user",
    id: "id",
    additionalFields: {
      name: {
        type: "string",
      },
      image: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        values: ["user", "admin", "superadmin"],
        defaultValue: "user",
      },
    }
  },
  plugins: [
    // customSession(async ({ user, session }) => {
    //   const userRoles = await findUserRoles({ id: session.userId });
    //   return {
    //     user: {
    //       ...user,
    //       role: userRoles
    //     },
    //     session,
    //   };
    // }),
    nextCookies(),
  ],
});
