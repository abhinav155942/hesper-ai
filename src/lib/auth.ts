import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { NextRequest } from 'next/server';
import { headers } from "next/headers"
import { db } from "@/db";
 
export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
	}),
	emailAndPassword: {    
		enabled: true,
		requireEmailVerification: false,
	},
	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		async sendVerificationEmail({ user, url }, request) {
			// Send verification email via Resend
			const apiKey = process.env.RESEND_API_KEY;
			const from = process.env.RESEND_FROM || "no-reply@yourdomain.com";
			if (!apiKey) {
				console.error("Missing RESEND_API_KEY env var. Cannot send verification email.");
				return;
			}
			try {
				const { Resend } = await import("resend");
				const resend = new Resend(apiKey);
				await resend.emails.send({
					from,
					to: user.email,
					subject: "Verify your email",
					html: `
					  <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;">
					    <h2>Confirm your email</h2>
					    <p>Hi ${user.name || "there"},</p>
					    <p>Please verify your email to complete your sign up.</p>
					    <p><a href="${url}" style="display:inline-block;padding:10px 16px;background:#1a73e8;color:#fff;border-radius:6px;text-decoration:none;">Verify Email</a></p>
					    <p>If the button doesn't work, copy and paste this link into your browser:</p>
					    <p><a href="${url}">${url}</a></p>
					    <p>This link will expire in 24 hours.</p>
					  </div>
					`,
				});
			} catch (err) {
				console.error("Failed to send verification email via Resend:", err);
			}
		},
	},
	plugins: [bearer()]
});

// Session validation helper
export async function getCurrentUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user || null;
}