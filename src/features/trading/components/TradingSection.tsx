"use client";
"use client";
import React, { useState, useMemo, useEffect } from "react";
import OrderPanel from "./OrderPanel";
import { LightweightChart } from "./LightweightChart";
import { ChartControls, Asset } from "./ChartControls";
import { useChartData } from "@/features/trading/hooks/useChartData";
import { usePositions } from "@/features/trading/hooks/usePositions";
import { useWebSocket } from "@/shared/hooks/useWebSocket";
import PositionsSection from "./PositionsSection"; 
import { BottomBar } from "@/shared/ui/BottomBar";
import { ExternalLink, ArrowDownLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { PopOutWindow } from '@/shared/ui/PopOutWindow';
import { Rnd } from 'react-rnd';
import { BalanceWidget } from "@/features/vault/components/BalanceWidget";
import { MultiChartLayout } from "./MultiChartLayout";

// --- Constantes de Hauteur ---
const MIN_HEIGHT = 36; 
// ➡️ Hauteur déployée de la section Positions
const INITIAL_HEIGHT_PERCENTAGE = '37%'; 

const TradingSection = () => {
  const { data: wsData } = useWebSocket();
  
  const [selectedAsset, setSelectedAsset] = useState<Asset>({
    id: 0, 
    name: "Bitcoin",
    symbol: "BTC/USD",
    pair: "btc_usdt",
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState("300");

  const [paymasterEnabled, setPaymasterEnabled] = useState(false);
  const [isPositionsCollapsed, setIsPositionsCollapsed] = useState(false);

  const [isChartPoppedOut, setIsChartPoppedOut] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  const { data } = useChartData(selectedAsset.id, selectedTimeframe);
  const { positions } = usePositions();

  const currentWsPrice = useMemo(() => {
    if (!selectedAsset.pair || !wsData[selectedAsset.pair]) return null;
    
    const pairData = wsData[selectedAsset.pair];
    if (pairData.instruments && pairData.instruments.length > 0) {
      return parseFloat(pairData.instruments[0].currentPrice);
    }
    return null;
  }, [wsData, selectedAsset.pair]);

  const { priceChange, priceChangePercent, aggregatedCurrentPrice } = useMemo(() => {
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
  
  useEffect(() => {
    // Force ChartResize during right panel transition
    const interval = setInterval(() => {
        window.dispatchEvent(new Event('resize'));
    }, 15);
    const timeout = setTimeout(() => {
        clearInterval(interval);
        window.dispatchEvent(new Event('resize'));
    }, 350);
    return () => {
        clearInterval(interval);
        clearTimeout(timeout);
    };
  }, [isRightPanelOpen]);

  const finalCurrentPrice = currentWsPrice || aggregatedCurrentPrice;
  const finalPositionsHeight = isPositionsCollapsed ? `${MIN_HEIGHT}px` : INITIAL_HEIGHT_PERCENTAGE; 

  return (
    <div className="h-full w-full flex flex-col bg-zinc-50 dark:bg-deep-space transition-colors duration-300 relative flex-1 min-h-0"> 
        
        <section id="trading" className="flex flex-1 w-full min-h-0">
            
            {/* 🧱 Colonne gauche : Controls + Chart + Positions */}
            <div id="trading-column-left" className="bg-zinc-50 dark:bg-deep-space flex-grow h-full flex flex-col overflow-x-hidden pl-2">
                
                {/* 1️⃣ Barre pair / prix (Haut) */}
                {/* MODIF: border-gray-200 (clair) -> dark:border-zinc-800 (sombre) */}
                <div className="h-12 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
                    <ChartControls
                        selectedAsset={selectedAsset}
                        onAssetChange={setSelectedAsset} 
                        selectedTimeframe={selectedTimeframe}
                        onTimeframeChange={setSelectedTimeframe}
                        priceChange={priceChange}
                        priceChangePercent={priceChangePercent}
                        currentPrice={aggregatedCurrentPrice}
                        isChartPoppedOut={isChartPoppedOut}
                        onTogglePopOut={() => setIsChartPoppedOut(!isChartPoppedOut)}
                    />
                </div>

                {/* 2️⃣ Graphique (Milieu) - FOND SOMBRE ADOUCI */}
                <div className="flex-1 min-h-0 bg-white dark:bg-deep-space relative z-0 flex flex-col">
                    {isChartPoppedOut ? (
                        <>
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900 border-b border-dashed border-gray-300 dark:border-zinc-700">
                                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Chart is detached</p>
                                <button
                                    onClick={() => setIsChartPoppedOut(false)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <ArrowDownLeft size={16} />
                                    Restore to main window
                                </button>
                            </div>
                            <PopOutWindow
                                title={`Charts`}
                                onClose={() => setIsChartPoppedOut(false)}
                                width={900}
                                height={600}
                            >
                                <div className="w-full h-full bg-white dark:bg-deep-space">
                                    <MultiChartLayout initialAsset={selectedAsset} initialTimeframe={selectedTimeframe} />
                                </div>
                            </PopOutWindow>
                        </>
                    ) : (
                        <LightweightChart
                            data={data}
                            positions={positions}
                            isPositionsCollapsed={isPositionsCollapsed}
                        />
                    )}
                </div>
                
                {/* 3️⃣ Positions (Bas) */}
                <div 
                    style={{ height: finalPositionsHeight }} 
                    className="border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-deep-space overflow-hidden transition-height duration-300 ease-in-out flex-shrink-0 z-10 shadow-[inset_0_10px_20px_-10px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_10px_20px_-10px_rgba(0,0,0,0.3)] rounded-tl-xl" 
                >
                    <div className="w-full h-full">
                        <PositionsSection 
                            paymasterEnabled={paymasterEnabled}
                            currentAssetId={selectedAsset.id}
                            currentAssetSymbol={selectedAsset.symbol.split("/")[0]}
                            isCollapsed={isPositionsCollapsed}
                            onToggleCollapse={() => {
                                setIsPositionsCollapsed(prev => !prev);
                            }}
                        />
                    </div>
                </div>

            </div> {/* <--- Close trading-column-left */}

            {/* Toggle Button for Right Panel */}
            <div className="relative flex items-center h-full z-20">
                <button 
                    onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                    className={`absolute bottom-[180px] translate-y-1/2 w-8 h-16 bg-white dark:bg-[#11141d] border border-zinc-200 dark:border-zinc-800 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-amber-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-md transition-all duration-300 group z-40 ${isRightPanelOpen ? "right-[2px] translate-x-1/2 shadow-[4px_0_10px_rgba(0,0,0,0.1)]" : "right-2 -translate-x-0 shadow-[-4px_0_10px_rgba(0,0,0,0.2)]"}`}
                    title={isRightPanelOpen ? "Collapse Panel" : "Expand Panel"}
                >
                    {isRightPanelOpen ? <ChevronRight size={20} className="group-hover:scale-110 transition-transform" /> : <ChevronLeft size={20} className="group-hover:scale-110 transition-transform" />}
                </button>
            </div>

            {/* 🧱 Colonne droite : Order Panel + Balance Widget */}
            <div className={`h-full flex flex-col bg-white dark:bg-deep-space relative z-10 border-l border-zinc-200/50 dark:border-zinc-800/50 transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) ${isRightPanelOpen ? 'w-[340px] opacity-100' : 'w-0 opacity-0 overflow-hidden border-l-0'}`}>
                <div className="flex-1 overflow-hidden min-h-0 bg-white dark:bg-deep-space">
                    <OrderPanel 
                        selectedAsset={selectedAsset} 
                        currentPrice={finalCurrentPrice}
                        paymasterEnabled={paymasterEnabled}
                        onTogglePaymaster={() => setPaymasterEnabled(prev => !prev)}
                    />
                </div>
                {/* Balance Widget Docked Bottom Right */}
                <div className="w-full flex-shrink-0 p-3 bg-zinc-50 dark:bg-[#09090b] border-t border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
                    <BalanceWidget />
                </div>
            </div>
        </section>

        {/* 2. Pied de Page (BottomBar) */}
        <BottomBar 
            onAssetSelect={setSelectedAsset} 
            currentAssetId={selectedAsset.id} 
        />

    </div>
  );
};

export default TradingSection;