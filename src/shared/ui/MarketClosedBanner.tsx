"use client";
import React, { useState, useEffect } from 'react';
import { Sunset } from "lucide-react";
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
// Importe MarketStatus depuis useopen (où il est défini)
import { MarketStatus } from "@/features/trading/hooks/useopen";

// ====================================================================
// COMPOSANT : CountdownDisplay
// ====================================================================
interface CountdownProps {
  timeUntilOpenMs: number | null | undefined;
}
const CountdownDisplay: React.FC<CountdownProps> = ({ timeUntilOpenMs }) => {
  const [remainingTime, setRemainingTime] = useState(timeUntilOpenMs || 0);

  useEffect(() => {
    // Synchronisation avec la valeur du hook useMarketStatus
    setRemainingTime(timeUntilOpenMs || 0);
  }, [timeUntilOpenMs]);

  useEffect(() => {
    if (remainingTime <= 0) return;

    // Décrémenter le temps restant chaque seconde
    const interval = setInterval(() => {
      setRemainingTime(prev => prev > 1000 ? prev - 1000 : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingTime]);

  if (remainingTime <= 0) {
    return <span className="text-sm font-semibold text-white">Market is opening soon...</span>;
  }

  const totalSeconds = Math.floor(remainingTime / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formatUnit = (unit: number) => String(unit).padStart(2, '0');

  return (
    <span className="text-lg font-bold text-white tracking-wider">
        {hours > 0 && `${hours}h `}
        {formatUnit(minutes)}m {formatUnit(seconds)}s
    </span>
  );
};
// ====================================================================

interface MarketClosedBannerProps {
    // Utilise le type MarketStatus importé correctement
    status: MarketStatus & { timeUntilOpenMs?: number };
}

export const MarketClosedBanner: React.FC<MarketClosedBannerProps> = ({ status }) => {
    if (status.isOpen) {
        return null;
    }

    const { nextOpen, timeUntilOpenMs } = status;

    return (
        // Rendu verticalement centré, mais aligné à gauche, avec marge latérale
        <div className="flex-shrink-0 relative h-[100px] bg-purple-600/90 text-white flex flex-col justify-center overflow-hidden 
                       mx-4 mt-4 rounded-lg shadow-xl px-4"> 
            
            {/* Icône Sunset en fond (violet clair) - Centrée vers la gauche */}
            <Sunset className="absolute w-32 h-32 text-purple-400/50 top-1/2 -translate-y-1/2 left-0" />
            
            <div className="relative z-10 text-left space-y-1">
                {/* 1. Afficher le titre et le compte à rebours ensemble */}
                <h3 className="text-lg font-bold">
                </h3>
                
                {nextOpen && (
                    <div className="flex flex-col">
                        {/* 2. Afficher le compte à rebours */}
                        <p className="text-sm font-medium">
                            Market re-opens in:
                        </p>
                        <CountdownDisplay timeUntilOpenMs={timeUntilOpenMs} />

                        {/* 3. Afficher la date d'ouverture UTC */}
                        <p className="text-xs text-purple-200 mt-1">
                            {format(nextOpen, 'EEEE, MMM d HH:mm', { locale: enUS })} UTC
                        </p>
                    </div>
                )}
                {!nextOpen && (
                    <p className="text-sm font-medium">Next open time unknown.</p>
                )}
            </div>
        </div>
    );
};