"use client";
import { useState, useEffect } from "react";
// 🛑 CORRECTION: Importe les types et fonctions de logique de marché depuis useopen.tsx
import { getMarketKindFromId, getMarketStatusUTC, MarketStatus } from "./useopen"; 

// Définissez un statut par défaut pour éviter les erreurs de montage/clignotement initial.
const DEFAULT_STATUS: MarketStatus = { isOpen: true, nextOpen: null };

/**
 * Hook pour obtenir et maintenir à jour le statut d'ouverture du marché pour un actif donné.
 * Se rafraîchit à l'ouverture/fermeture prochaine, ou au moins toutes les minutes.
 */
export const useMarketStatus = (assetId: number) => {
  const [status, setStatus] = useState<MarketStatus>(DEFAULT_STATUS);
  const [tick, setTick] = useState(Date.now()); // Pour forcer le re-rendu du compteur

  useEffect(() => {
    // Si l'ID est invalide (e.g., -1), ne pas essayer de calculer le statut
    if (assetId < 0) {
      setStatus(DEFAULT_STATUS);
      return;
    }

    const kind = getMarketKindFromId(assetId);

    if (!kind) {
      // Si le type est inconnu, supposez ouvert (comportement par défaut)
      setStatus(DEFAULT_STATUS);
      return;
    }

    // Fonction pour calculer et mettre à jour le statut
    const updateStatus = () => {
      const newStatus = getMarketStatusUTC(kind, new Date());
      setStatus(newStatus);
      setTick(Date.now()); 
      return newStatus;
    };

    const initialStatus = updateStatus();
    let nextUpdateMs = 60000; // Rafraîchissement par défaut: 1 minute

    if (initialStatus.isOpen && initialStatus.timeUntilCloseMs) {
      // Si ouvert, rafraîchir 1s après la fermeture
      nextUpdateMs = Math.min(initialStatus.timeUntilCloseMs + 1000, 60000);
    } else if (!initialStatus.isOpen && initialStatus.timeUntilOpenMs) {
      // Si fermé, rafraîchir 1s après l'ouverture
      nextUpdateMs = Math.min(initialStatus.timeUntilOpenMs + 1000, 60000);
    }
    
    // Timer principal pour le prochain événement critique (ouverture/fermeture)
    const criticalTimer = setTimeout(updateStatus, nextUpdateMs);

    // Timer de sécurité pour mettre à jour le compteur chaque seconde (géré dans CountdownDisplay) ou au moins chaque minute ici.
    const safetyTimer = setInterval(updateStatus, 60000);

    return () => {
      clearTimeout(criticalTimer);
      clearInterval(safetyTimer);
    };
  }, [assetId]);

  return { ...status, tick };
};