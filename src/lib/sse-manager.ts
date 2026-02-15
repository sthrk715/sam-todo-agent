type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
};

class SSEManager {
  private clients: SSEClient[] = [];
  private heartbeatId: ReturnType<typeof setInterval> | null = null;

  addClient(id: string, controller: ReadableStreamDefaultController) {
    this.clients.push({ id, controller });
    if (!this.heartbeatId && this.clients.length > 0) {
      this.startHeartbeat();
    }
  }

  removeClient(id: string) {
    this.clients = this.clients.filter((c) => c.id !== id);
    if (this.clients.length === 0 && this.heartbeatId) {
      clearInterval(this.heartbeatId);
      this.heartbeatId = null;
    }
  }

  broadcast(event: string, data: unknown) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const encoded = new TextEncoder().encode(message);
    this.clients = this.clients.filter((client) => {
      try {
        client.controller.enqueue(encoded);
        return true;
      } catch {
        return false;
      }
    });
  }

  private startHeartbeat() {
    this.heartbeatId = setInterval(() => {
      const ping = new TextEncoder().encode(":\n\n");
      this.clients = this.clients.filter((client) => {
        try {
          client.controller.enqueue(ping);
          return true;
        } catch {
          return false;
        }
      });
    }, 30_000);
  }
}

export const sseManager = new SSEManager();
