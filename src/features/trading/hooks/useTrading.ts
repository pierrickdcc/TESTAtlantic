"use client";
import { useAccount, useWriteContract } from 'wagmi';
// Assurez-vous que ces imports pointent vers le fichier avec les ABIs mis à jour
import { TRADING_ADDRESS, TRADING_ABI } from '@/shared/config/contracts';
import { customChain } from '@/shared/config/wagmi';
import { Hash } from 'viem'; 

// ====================================================================
// Interfaces Mises à Jour pour les fonctions du contrat
// ====================================================================

interface OpenPositionLimitParams {
  assetId: number;
  longSide: boolean;
  leverageX: number;
  lots: number;
  targetX6: number; // Nouveau nom pour le prix limite
  slX6: number;
  tpX6: number;
}

interface OpenPositionMarketParams {
  assetId: number;
  longSide: boolean;
  leverageX: number;
  lots: number;
  slX6: number;
  tpX6: number;
  proof: Hash; // Nécessaire pour l'ordre Market
}


export const useTrading = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // ====================================================================
  // 1. OPEN POSITION (Market & Limit)
  // L'ancienne fonction `open` est remplacée par deux nouvelles.
  // ====================================================================

  const openLimit = async (params: OpenPositionLimitParams) => {
    if (!address) throw new Error('No wallet connected');

    const hash = await writeContractAsync({
      address: TRADING_ADDRESS,
      abi: TRADING_ABI,
      functionName: 'openLimit',
      args: [
        params.assetId,
        params.longSide,
        params.leverageX,
        params.lots,
        BigInt(params.targetX6), // targetX6 pour le prix limite
        BigInt(params.slX6),
        BigInt(params.tpX6),
      ],
      account: address,
      chain: customChain,
    });

    return hash;
  };
  
  const openMarket = async (params: OpenPositionMarketParams) => {
    if (!address) throw new Error('No wallet connected');

    const hash = await writeContractAsync({
      address: TRADING_ADDRESS,
      abi: TRADING_ABI,
      functionName: 'openMarket',
      args: [
        params.proof, // La preuve est le premier argument
        params.assetId,
        params.longSide,
        params.leverageX,
        params.lots,
        BigInt(params.slX6),
        BigInt(params.tpX6),
      ],
      account: address,
      chain: customChain,
    });

    return hash;
  };


  // ====================================================================
  // 2. ANNULER ORDRE (Inchangée)
  // ====================================================================

  const cancelOrder = async (id: number) => {
    if (!address) throw new Error('No wallet connected');

    const hash = await writeContractAsync({
      address: TRADING_ADDRESS,
      abi: TRADING_ABI,
      functionName: 'cancel',
      args: [id],
      account: address,
      chain: customChain,
    });

    return hash;
  };


  // ====================================================================
  // 3. MISE À JOUR DES STOPS (Logique Conditionnelle)
  // L'ancienne updateStops est surchargée pour gérer setSL et setTP.
  // ====================================================================
  
  // Nouvelle signature pour gérer les appels sélectifs:
  const updateStops = async (
    id: number, 
    newSLx6: bigint | number | null, 
    newTPx6: bigint | number | null
  ) => {
    if (!address) throw new Error('No wallet connected');

    const finalSL = newSLx6 !== null ? BigInt(newSLx6) : 0n;
    const finalTP = newTPx6 !== null ? BigInt(newTPx6) : 0n;

    let functionName: 'updateStops' | 'setSL' | 'setTP';
    let args: (number | bigint)[];
    
    const isSLChanged = newSLx6 !== null;
    const isTPChanged = newTPx6 !== null;

    if (isSLChanged && isTPChanged) {
        // Appeler updateStops si les deux sont définis
        functionName = 'updateStops';
        args = [id, finalSL, finalTP];
    } else if (isSLChanged) {
        // Appeler setSL si seul SL est défini
        functionName = 'setSL';
        args = [id, finalSL];
    } else if (isTPChanged) {
        // Appeler setTP si seul TP est défini
        functionName = 'setTP';
        args = [id, finalTP];
    } else {
        throw new Error('No changes provided for SL or TP.');
    }

    const hash = await writeContractAsync({
        address: TRADING_ADDRESS,
        abi: TRADING_ABI,
        functionName: functionName as any, // Cast pour Wagmi
        args: args as any, // Cast pour Wagmi
        account: address,
        chain: customChain,
    });

    return hash;
  };


  // ====================================================================
  // 4. FERMETURE DE POSITION (Market avec preuve)
  // L'ancienne closePosition est remplacée par la nouvelle closeMarket.
  // ====================================================================
  
  // 🚨 CORRECTION: Renommée en closePosition pour correspondre à l'usage dans PositionsSection
  // et accepter la preuve en argument.
  const closePosition = async (id: number, proof: Hash) => { 
    if (!address) throw new Error('No wallet connected');

    const hash = await writeContractAsync({
      address: TRADING_ADDRESS,
      abi: TRADING_ABI,
      // La fonction à appeler sur le contrat est 'closeMarket'
      functionName: 'closeMarket', 
      args: [id, proof], // SEULEMENT id et proof
      account: address,
      chain: customChain,
    });

    return hash;
  };

  return {
    openLimit,
    openMarket,
    cancelOrder,
    updateStops,
    closePosition, // Cette fonction gère maintenant closeMarket(id, proof)
  };
};