"use client";
// hooks/useWebSocket.ts

import { useEffect, useRef } from 'react';
import { useWebSocketStore, WebSocketMessage } from '../store/websocketStore';

export const useWebSocket = () => {
  const { data, connected, connect } = useWebSocketStore();

  useEffect(() => {
    connect();
  }, [connect]);

  return { data: data as WebSocketMessage, connected };
};

export const getAssetsByCategory = (data: WebSocketMessage) => {
  const assets = Object.entries(data)
    .filter(([_, pairData]) => pairData.instruments && pairData.instruments.length > 0)
    .map(([pair, pairData]) => ({
      id: pairData.id,
      name: pairData.name,
      // Utilisation du format Pair pour le symbole
      symbol: pair.toUpperCase().includes('_') ? pair.toUpperCase().replace('_', '/') : pair.toUpperCase(),
      pair: pair,
      currentPrice: pairData.instruments[0]?.currentPrice || '0',
      change24h: pairData.instruments[0]?.["24h_change"] || '0',
    }));

  return {
    crypto: assets.filter(a => a.id >= 0 && a.id < 1000),
    forex: assets.filter(a => a.id >= 5000 && a.id < 5100),
    commodities: assets.filter(a => a.id >= 5500 && a.id < 5600),
    stocks: assets.filter(a => a.id >= 6000 && a.id < 6100),
    indices: assets.filter(a => a.id >= 6100),
  };
};