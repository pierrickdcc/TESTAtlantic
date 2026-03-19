"use client";

import React, { Suspense } from 'react';
import { TopNavbar } from "@/shared/ui/TopNavbar";
import { FaucetDialog } from "@/shared/ui/FaucetDialog";
import { WelcomeOverlay } from "@/shared/ui/WelcomeOverlay";
import MobileLayout from "@/shared/ui/mobile/MobileLayout";
import { useUIStore } from '@/shared/store/uiStore';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { useTheme } from 'next-themes';
import { useLocation, useNavigate } from 'react-router-dom';

const TradingSection = React.lazy(() => import('@/features/trading/components/TradingSection'));
const VaultInterface = React.lazy(() => import('@/features/vault/components/VaultInterface'));
const Leaderboard = React.lazy(() => import('@/features/leaderboard/components/Leaderboard'));
const Scan = React.lazy(() => import('@/features/explorer/components/Scan'));

const LoadingFallback = () => (
  <div className="h-full w-full flex items-center justify-center bg-zinc-50 dark:bg-deep-space">
    <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
  </div>
);

const Index: React.FC = () => {
  const { currentView, isFaucetOpen, toggleFaucet, setView } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  // 1. Adapter le navigateur au thème
  React.useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content', 
      theme === 'dark' ? '#060A16' : '#ffffff'
    );
  }, [theme]);

  // 2. Synchro URL -> Store (pour que Précédent/Suivant marche)
  React.useEffect(() => {
      const path = location.pathname.replace(/^\/+/, '') || 'trading';
      if (['trading', 'vault', 'scan', 'leaderboard'].includes(path)) {
          if (currentView !== path) {
              setView(path as any);
          }
      }
  }, [location.pathname, currentView, setView]);

  // 3. Synchro Store -> URL
  React.useEffect(() => {
      const path = location.pathname.replace(/^\/+/, '') || 'trading';
      if (currentView !== path) {
          navigate(currentView === 'trading' ? '/' : `/${currentView}`);
      }
  }, [currentView, location.pathname, navigate]);

  return (
    <div className="antialiased bg-background dark:bg-deep-space h-screen w-full transition-colors duration-300">

      {/* VERSION MOBILE */}
      <div className="md:hidden h-full w-full">
         <MobileLayout />
      </div>

      {/* VERSION DESKTOP */}
      <div className="hidden md:flex flex-col h-screen w-full overflow-hidden">

        <TopNavbar />

        <main className="w-full flex-1 pt-16 bg-zinc-50 dark:bg-deep-space transition-colors duration-300 min-h-0 flex flex-col">
            {/* NAVIGATION DES VUES DANS LE MAIN */}
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                {currentView === 'trading' && (
                  <div className="flex-1 w-full min-h-0 bg-zinc-50 dark:bg-deep-space flex flex-col">
                      <TradingSection />
                  </div>
                )}

                {currentView === 'vault' && (
                  <div className="h-full overflow-y-auto bg-slate-50 dark:bg-deep-space transition-colors duration-300">
                      <VaultInterface />
                  </div>
                )}

                {currentView === 'scan' && (
                  <div className="h-full overflow-y-auto bg-slate-50 dark:bg-deep-space transition-colors duration-300">
                      <Scan />
                  </div>
                )}

                {/* AJOUT PROPRE DU LEADERBOARD ICI */}
                {currentView === 'leaderboard' && (
                  <div className="h-full overflow-y-auto bg-slate-50 dark:bg-deep-space transition-colors duration-300">
                      <Leaderboard />
                  </div>
                )}
              </Suspense>
            </ErrorBoundary>
        </main>
      </div>

      {/* Faucet Dialog (Partagé Mobile & Desktop) */}
      <FaucetDialog
          open={isFaucetOpen}
          onOpenChange={toggleFaucet}
      />

    </div>
  );
};

export default Index;