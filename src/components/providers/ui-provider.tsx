"use client";

import * as React from "react";
import { Toaster } from "@/components/ui/sonner";

export function UIProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors position="top-right" closeButton />
    </>
  );
}
