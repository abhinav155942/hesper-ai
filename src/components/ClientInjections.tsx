"use client";

import dynamic from "next/dynamic";

// Load client-only utilities safely on the client
const ErrorReporter = dynamic(() => import("@/components/ErrorReporter"), { ssr: false });
const VisualEditsMessenger = dynamic(() => import("@/visual-edits/VisualEditsMessenger"), { ssr: false });
const Toaster = dynamic(() => import("@/components/ui/sonner").then((m) => m.Toaster), { ssr: false });

export const ClientInjections = () => {
  return (
    <>
      <ErrorReporter />
      <VisualEditsMessenger />
      <Toaster />
    </>
  );
};