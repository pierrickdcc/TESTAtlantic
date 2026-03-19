import { create } from 'zustand';
interface UIState {
  currentView: 'trading' | 'vault' | 'scan' | 'leaderboard';
  isFaucetOpen: boolean;
  showWelcome: boolean;
  setView: (view: UIState['currentView']) => void;
  toggleFaucet: (open: boolean) => void;
  dismissWelcome: () => void;
}
export const useUIStore = create<UIState>((set) => ({
  currentView: 'trading',
  isFaucetOpen: false,
  showWelcome: true,
  setView: (view) => set({ currentView: view }),
  toggleFaucet: (open) => set({ isFaucetOpen: open }),
  dismissWelcome: () => set({ showWelcome: false }),
}));