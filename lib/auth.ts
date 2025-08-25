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
    async sendResetPassword(payload: any) {
      try {
        const email = String(payload?.user?.email || '');
        const url = String(payload?.url || '');
        const apiKey = process.env.RESEND_API_KEY || '';
        const from = process.env.RESEND_FROM || 'no-reply@example.com';

        const subject = 'Reset your password';
        const text = `Click the link below to reset your password: \n\n${url}\n\nIf you did not request this, you can ignore this email.`;
        const html = `
          <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0f172a">
            <h2 style="margin:0 0 12px 0;color:#0f172a">Reset your password</h2>
            <p style="margin:0 0 16px 0;color:#334155">We received a request to reset your password.</p>
            <p style="margin:0 0 16px 0;color:#334155">Click the button below to set a new password:</p>
            <p style="margin:0 0 20px 0">
              <a href="${url}" style="display:inline-block;background:#111827;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Reset Password</a>
            </p>
            <p style="margin:0 0 8px 0;color:#334155">If the button doesn’t work, copy and paste this link into your browser:</p>
            <p style="word-break:break-all;color:#2563eb">${url}</p>
            <hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb" />
            <p style="margin:0;color:#64748b">If you didn’t request this, you can safely ignore this email.</p>
          </div>
        `;

        // If not configured, log and exit gracefully
        if (!apiKey) {
          console.warn('[auth] RESEND_API_KEY is not set, logging reset URL instead');
          console.log(`[password-reset] to=${email} url=${url}`);
          return;
        }

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ from, to: [email], subject, text, html }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          console.error('[auth] Resend error:', res.status, body);
        }
      } catch (e) {
        console.error('Failed to send reset password email:', e);
      }
    },
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
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
