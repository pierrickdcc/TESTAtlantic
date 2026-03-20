"use client";

import { Toaster } from "@/shared/ui/toaster";
import { Toaster as Sonner } from "@/shared/ui/sonner";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { config } from '@/shared/config/wagmi';
import '@rainbow-me/rainbowkit/styles.css';
import { SpiceFlowProvider } from "@spicenet-io/spiceflow-ui";
import "@spicenet-io/spiceflow-ui/styles.css";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TraderPage from "./pages/TraderPage"; // 👈 On importe la nouvelle page trader

import { ThemeProvider } from "@/shared/ui/theme-provider";

const queryClient = new QueryClient();

const customDarkTheme = darkTheme({
  accentColor: '#3b82f6',
  accentColorForeground: 'white',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'small',
});
// Override with deep navy background to match the new dark theme
customDarkTheme.colors.modalBackground = '#060A16';
customDarkTheme.colors.modalBorder = 'rgba(255,255,255,0.05)';

const App = () => (
  <QueryClientProvider client={queryClient}> 
    <WagmiProvider config={config}> 
      <RainbowKitProvider theme={customDarkTheme}> 
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme" attribute="class">
          
          <SpiceFlowProvider 
            provider="privy"
            privyAppId="cmebl077a0160l40a7xpxcv84"
            supportedChainIds={[84532, 688689, 5115, 421614, 11155111]}
            nativeChainId={688689}
            nonEip7702Mode={true}
          >
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Route principale (Trading, Dashboard, etc.) */}
                  <Route path="/" element={<Index />} />
                  
                  {/* Route dynamique pour les profils Traders 🏆 */}
                  <Route path="/trader/:address" element={<TraderPage />} />
                  
                  {/* Route de secours 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </SpiceFlowProvider>

        </ThemeProvider>
      </RainbowKitProvider>
    </WagmiProvider>
  </QueryClientProvider>
);

export default App;