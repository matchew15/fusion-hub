import { useEffect, useRef } from 'react';

type MessageHandler = (data: any) => void;

class SocketClient {
  private socket: WebSocket | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

    this.socket.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.forEach((handler) => handler(data));
      }
    };

    this.socket.onclose = () => {
      setTimeout(() => this.connect(), 1000);
    };
  }

  on(type: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);
  }

  off(type: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  send(type: string, data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data }));
    }
  }
}

export const socketClient = new SocketClient();

export function useSocket(type: string, handler: MessageHandler) {
  useEffect(() => {
    socketClient.connect();
    socketClient.on(type, handler);
    return () => socketClient.off(type, handler);
  }, [type, handler]);
}
