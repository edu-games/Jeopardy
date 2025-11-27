// Server-Sent Events (SSE) manager for real-time game updates

type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
  gameId: string;
};

// Store active SSE connections
const clients = new Map<string, SSEClient>();

export function addClient(
  clientId: string,
  gameId: string,
  controller: ReadableStreamDefaultController,
) {
  clients.set(clientId, { id: clientId, controller, gameId });
  console.log(
    `[SSE] Client ${clientId} connected to game ${gameId}. Total clients: ${clients.size}`,
  );
}

export function removeClient(clientId: string) {
  const client = clients.get(clientId);
  if (client) {
    clients.delete(clientId);
    console.log(
      `[SSE] Client ${clientId} disconnected. Total clients: ${clients.size}`,
    );
  }
}

export function getClientsByGame(gameId: string): SSEClient[] {
  return Array.from(clients.values()).filter(
    (client) => client.gameId === gameId,
  );
}

export type GameEvent =
  | {
      type: "question-revealed";
      slotId: string;
      currentSlot: any;
      buzzerEnabled: boolean;
    }
  | {
      type: "answer-submitted";
      teams: any[];
      answeredSlots: string[];
      currentSlotId: string | null;
    }
  | {
      type: "buzzer-pressed";
      studentId: string;
      studentName: string;
      teamId: string;
      teamName: string;
      buzzerAt: string;
    }
  | { type: "game-started"; status: string }
  | { type: "game-ended"; status: string; finalScores: any[] }
  | { type: "student-joined"; students: any[]; teams: any[] }
  | { type: "team-assigned"; students: any[]; teams: any[] }
  | { type: "buzzer-enabled"; enabled: boolean }
  | { type: "buzzer-disabled"; enabled: boolean };

export function broadcastToGame(gameId: string, event: GameEvent) {
  const gameClients = getClientsByGame(gameId);
  const message = `data: ${JSON.stringify(event)}\n\n`;

  console.log(
    `[SSE] Broadcasting ${event.type} to ${gameClients.length} clients in game ${gameId}`,
  );

  gameClients.forEach((client) => {
    try {
      client.controller.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      console.error(`[SSE] Error sending to client ${client.id}:`, error);
      removeClient(client.id);
    }
  });
}

export function sendToClient(clientId: string, event: GameEvent) {
  const client = clients.get(clientId);
  if (client) {
    const message = `data: ${JSON.stringify(event)}\n\n`;
    try {
      client.controller.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      console.error(`[SSE] Error sending to client ${clientId}:`, error);
      removeClient(clientId);
    }
  }
}

// Send keepalive pings every 30 seconds to prevent connection timeout
export function startKeepalive() {
  setInterval(() => {
    const allClients = Array.from(clients.values());
    allClients.forEach((client) => {
      try {
        client.controller.enqueue(new TextEncoder().encode(": keepalive\n\n"));
      } catch (error) {
        console.error(`[SSE] Keepalive error for client ${client.id}:`, error);
        removeClient(client.id);
      }
    });
  }, 30000);
}

// Start keepalive when module loads
startKeepalive();
