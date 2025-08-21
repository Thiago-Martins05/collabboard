import * as React from "react";
import PusherServer from "pusher";
import PusherClient from "pusher-js";

// Verifica se o Pusher está configurado no servidor
const isPusherServerConfigured = () => {
  return !!(
    process.env.PUSHER_APP_ID &&
    process.env.NEXT_PUBLIC_PUSHER_KEY &&
    process.env.PUSHER_SECRET &&
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  );
};

// Verifica se o Pusher está configurado no cliente
const isPusherClientConfigured = () => {
  const hasKey = !!process.env.NEXT_PUBLIC_PUSHER_KEY;
  const hasCluster = !!process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  return !!(hasKey && hasCluster);
};

export const pusherServer = isPusherServerConfigured()
  ? new PusherServer({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    })
  : null;

export const pusherClient = isPusherClientConfigured()
  ? new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })
  : null;

// Tipos de eventos base (sem boardId)
export type RealtimeEventBase =
  | {
      type: "column.created";
      column: { id: string; title: string; index: number };
    }
  | { type: "column.updated"; column: { id: string; title: string } }
  | { type: "column.deleted"; columnId: string }
  | { type: "column.reordered"; columnIds: string[] }
  | {
      type: "card.created";
      card: {
        id: string;
        title: string;
        description?: string | null;
        columnId: string;
        index: number;
      };
    }
  | {
      type: "card.updated";
      card: { id: string; title: string; description?: string | null };
    }
  | { type: "card.deleted"; cardId: string }
  | {
      type: "card.reordered";
      updates: Array<{ id: string; columnId: string; index: number }>;
    }
  | { type: "label.toggled"; cardId: string; labelId: string; added: boolean };

// Tipo completo com boardId
export type RealtimeEvent = RealtimeEventBase & { boardId: string };

// Função para publicar eventos
export async function publishEvent(boardId: string, event: RealtimeEventBase) {
  if (!pusherServer) {
    console.log(
      "Pusher não configurado no servidor, evento ignorado:",
      event.type
    );
    return;
  }

  try {
    await pusherServer.trigger(`board-${boardId}`, "board-updated", {
      ...event,
      boardId,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Erro ao publicar evento:", error);
  }
}

// Hook para escutar eventos em tempo real
export function useRealtimeBoard(
  boardId: string,
  onEvent: (event: RealtimeEvent) => void
) {
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    if (!pusherClient) {
      console.log("Pusher não configurado no cliente, tempo real desabilitado");
      return;
    }

    const channel = pusherClient.subscribe(`board-${boardId}`);

    channel.bind("board-updated", (data: RealtimeEvent) => {
      onEvent(data);
    });

    channel.bind("pusher:subscription_succeeded", () => {
      setIsConnected(true);
    });

    channel.bind("pusher:subscription_error", (error: unknown) => {
      console.error("Erro na subscrição:", error);
      setIsConnected(false);
    });

    return () => {
      pusherClient.unsubscribe(`board-${boardId}`);
    };
  }, [boardId, onEvent]);

  return { isConnected };
}
