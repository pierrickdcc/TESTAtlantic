import { create } from 'zustand';
import { API_BASE_URL } from '../config/env';
export interface InstrumentData {
  time: string;
  timestamp: string;
  currentPrice: string;
  "24h_high": string;
  "24h_low": string;
  "24h_change": string;
  tradingPair: string;
}
export interface PairData {
  id: number;
  name: string;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  instruments: InstrumentData[];
}
export interface WebSocketMessage {
  [pair: string]: PairData;
}
interface WebSocketState {
  data: WebSocketMessage;
  connected: boolean;
  ws: WebSocket | null;
  connect: () => void;
  disconnect: () => void;
}
export const useWebSocketStore = create<WebSocketState>((set, get) => {
  let reconnectTimeout: NodeJS.Timeout | null = null;

  return {
    data: {},
    connected: false,
    ws: null,
    connect: () => {
      const { ws, connected } = get();
      if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING || connected) return;

      try {
        const wsUrl = import.meta.env.VITE_WS_URL || 'wss://backend.brokex.trade/ws/prices';
        const newWs = new WebSocket(wsUrl);

        newWs.onopen = () => {
          console.log('WebSocket connected globally');
          set({ connected: true });
        };
        newWs.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            set({ data: message });
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        newWs.onerror = (error) => {
          console.error('WebSocket error globally:', error);
        };
        newWs.onclose = () => {
          console.log('WebSocket disconnected globally');
          set({ connected: false, ws: null });

          if (reconnectTimeout) clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(() => {
            get().connect();
          }, 3000);
        };
        set({ ws: newWs });
      } catch (error) {
        console.error('Error creating global WebSocket:', error);
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(() => {
          get().connect();
        }, 3000);
      }
    },
    disconnect: () => {
      const { ws } = get();
      if (ws) {
        ws.onclose = null; // Prevent reconnect logic on intentional disconnect
        ws.close();
        set({ ws: null, connected: false });
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    }
  };
});
