"use client";

import * as React from "react";
import { useRealtimeBoard } from "@/lib/realtime";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

interface RealtimeStatusProps {
  boardId: string;
}

export function RealtimeStatus({ boardId }: RealtimeStatusProps) {
  const { isConnected } = useRealtimeBoard(boardId, (event) => {
    // Este callback é usado apenas para manter a conexão ativa
    // Os eventos são tratados no componente Kanban
  });

  // Verifica se o Pusher está configurado
  const isPusherConfigured = !!(
    process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  );

  if (!isPusherConfigured) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <WifiOff className="h-3 w-3" />
        Tempo real não configurado
      </Badge>
    );
  }

  return (
    <Badge
      variant={isConnected ? "default" : "secondary"}
      className="flex items-center gap-1"
    >
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          Tempo real ativo
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          Desconectado
        </>
      )}
    </Badge>
  );
}
