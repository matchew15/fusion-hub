import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { parse } from 'url';

interface Client {
  ws: WebSocket;
  userId?: number;
}

export class WebSocketHandler {
  private wss: WebSocketServer;
  private clients: Set<Client> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ noServer: true });
    
    server.on('upgrade', (request, socket, head) => {
      const { pathname } = parse(request.url!);
      
      if (pathname === '/ws') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      }
    });

    this.wss.on('connection', this.handleConnection.bind(this));
  }

  private handleConnection(ws: WebSocket) {
    const client: Client = { ws };
    this.clients.add(client);

    ws.on('message', (message: string) => {
      try {
        const { type, data } = JSON.parse(message.toString());
        this.handleMessage(client, type, data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      this.clients.delete(client);
    });
  }

  private handleMessage(client: Client, type: string, data: any) {
    switch (type) {
      case 'auth':
        client.userId = data.userId;
        break;
      case 'chat':
        this.broadcast('chat', data, [data.receiverId]);
        break;
      case 'listing':
        this.broadcast('listing', data);
        break;
    }
  }

  private broadcast(type: string, data: any, userIds?: number[]) {
    for (const client of this.clients) {
      if (!userIds || (client.userId && userIds.includes(client.userId))) {
        client.ws.send(JSON.stringify({ type, data }));
      }
    }
  }
}
