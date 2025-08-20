"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-12 text-center shadow-lg">
      <div className="flex flex-col items-center gap-4">
        {icon ? (
          icon
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <div className="relative w-8 h-8">
              <Image
                src="/collabboard-logo.png"
                alt="CollabBoard Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          {description ? (
            <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>

        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}
