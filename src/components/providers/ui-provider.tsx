"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";

export function UIProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster richColors position="top-right" closeButton />
    </SessionProvider>
  );
}
