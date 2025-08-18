"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

export function HeaderSearch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState<string>(searchParams.get("q") ?? "");
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<number | null>(null);

  // mantém o input sincronizado quando a URL muda
  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  // envia para /dashboard?q=... (com debounce)
  useEffect(() => {
    if (!pathname.startsWith("/dashboard")) return;

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      const s = new URLSearchParams(searchParams.toString());
      if (q) s.set("q", q);
      else s.delete("q");
      startTransition(() => {
        router.push(`/dashboard${s.toString() ? `?${s.toString()}` : ""}`);
      });
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, pathname]);

  // só renderiza no /dashboard (hooks já foram chamados acima -> seguro)
  if (!pathname.startsWith("/dashboard")) return null;

  return (
    <Input
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder="Buscar boards..."
      aria-label="Buscar boards"
      className="w-72"
      disabled={isPending}
    />
  );
}
