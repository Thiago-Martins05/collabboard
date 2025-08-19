import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { UIProvider } from "@/components/providers/ui-provider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <UIProvider>{children}</UIProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
