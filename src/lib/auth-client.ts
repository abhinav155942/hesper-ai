"use client"
import { createAuthClient } from "better-auth/react"

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  sendVerificationEmail,
  forgetPassword,
  resetPassword,
} = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL,
  fetchOptions: {
    auth: {
      type: "Bearer",
      token: () => typeof window !== 'undefined' ? localStorage.getItem("bearer_token") || "" : "",
    },
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (authToken) {
        localStorage.setItem("bearer_token", authToken);
      }
    },
  },
});