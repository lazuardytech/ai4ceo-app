import { betterAuth, generateId } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { user, session, account, verification } from "./db/schema";
import { nextCookies } from "better-auth/next-js";
import { generateCUID } from "./utils";

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
      generateId: ({ model, size }) => (model === "user" ? generateCUID() : generateId(size ?? 24)),
    },
  },
  user: {
    model: "user",
    id: "id",
    additionalFields: {
      name: {
        type: "string",
        required: false,
        defaultValue: null,
        input: false
      },
      image: {
        type: "string",
        required: false,
      },
      onboarded: {
        type: "boolean",
        defaultValue: false,
      },
      tour: {
        type: "boolean",
        defaultValue: false,
      },
      role: {
        type: "string",
        values: ["user", "admin"],
        defaultValue: "user",
      },
    }
  },
  plugins: [
    nextCookies(),
  ],
});
