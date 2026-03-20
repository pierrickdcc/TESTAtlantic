import { useMemo } from 'react';

interface ChartData {
  time: string;
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
}

export const usePriceStats = (data: ChartData[], currentWsPrice: number | null) => {
  return useMemo(() => {
    const currentPriceUsed =
      currentWsPrice ||
      (data.length > 0 ? parseFloat(data[data.length - 1].close) : 0);

    if (data.length < 2 || currentPriceUsed === 0) {
      return { priceChange: 0, priceChangePercent: 0, aggregatedCurrentPrice: currentPriceUsed };
    }

    const firstPrice = parseFloat(data[0].open);
    const change = currentPriceUsed - firstPrice;
    const changePercent = (change / firstPrice) * 100;

    return {
      priceChange: change,
      priceChangePercent: changePercent,
      aggregatedCurrentPrice: currentPriceUsed,
    };
  }, [data, currentWsPrice]);
};