export const queryKeys = {
  trading: {
    all: ['trading'] as const,
    trades: (address: string) => [...queryKeys.trading.all, 'trades', address] as const,
    openTrades: (address: string) => [...queryKeys.trading.trades(address), 'open'] as const,
    chartData: (assetId: number, timeframe: string) => [...queryKeys.trading.all, 'chartData', assetId, timeframe] as const,
    marketStatus: () => [...queryKeys.trading.all, 'marketStatus'] as const,
  },
  vault: {
    all: ['vault'] as const,
    balances: (address: string) => [...queryKeys.vault.all, 'balances', address] as const,
    tvl: () => [...queryKeys.vault.all, 'tvl'] as const,
    apy: () => [...queryKeys.vault.all, 'apy'] as const,
  },
  explorer: {
    all: ['explorer'] as const,
    trader: (address: string) => [...queryKeys.explorer.all, 'trader', address] as const,
    leaderboard: () => [...queryKeys.explorer.all, 'leaderboard'] as const,
    scan: () => [...queryKeys.explorer.all, 'scan'] as const,
  }
};