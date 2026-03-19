"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { DepositDialog } from "@/features/vault/components/DepositDialog";
import { Landmark, Eye, EyeOff, Lock, CheckCircle2, Wallet } from 'lucide-react'; 
import { formatUnits } from 'viem';
import { useAccount, useReadContracts } from 'wagmi';
import { motion } from "framer-motion";
import { useVault } from "@/features/vault/hooks/useVault";

const VAULT_ADDRESS = '0x3d0184662932E27748E4f9954D59ba1B17EE5Fe0' as const;
const VAULT_ABI = [
    {
        inputs: [{ internalType: "address", name: "trader", type: "address" }],
        name: "getTraderTotalBalance",
        outputs: [{ internalType: "uint256", name: "total6", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "", type: "address" }],
        name: "freeBalance",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    }
] as const;

export const BalanceWidget = () => {
    const [showBalance, setShowBalance] = useState(true); 
    const { address } = useAccount();
    const safeAddress = address || '0x0000000000000000000000000000000000000000';

    const { data: balanceData } = useReadContracts({
        contracts: [
            {
                address: VAULT_ADDRESS,
                abi: VAULT_ABI,
                functionName: 'getTraderTotalBalance',
                args: [safeAddress],
            },
            {
                address: VAULT_ADDRESS,
                abi: VAULT_ABI,
                functionName: 'freeBalance',
                args: [safeAddress],
            }
        ],
        query: { enabled: !!address, refetchInterval: 5000 }
    });

    const totalBalanceVal = balanceData?.[0]?.result ? Number(formatUnits(balanceData[0].result, 6)) : 0;
    const availableBalanceVal = balanceData?.[1]?.result ? Number(formatUnits(balanceData[1].result, 6)) : 0;
    const lockedBalanceVal = totalBalanceVal - availableBalanceVal;

    const percentLocked = totalBalanceVal > 0 ? (lockedBalanceVal / totalBalanceVal) * 100 : 0;
    const percentAvailable = totalBalanceVal > 0 ? (availableBalanceVal / totalBalanceVal) * 100 : 0;

    const getDisplayValue = (value: string | number) => showBalance ? value : '***';

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex-shrink-0 w-full h-[220px] rounded-2xl relative overflow-hidden backdrop-blur-xl bg-white/40 dark:bg-[#060A16]/40 border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.15)] transition-shadow duration-500"
        >
            {/* Ambient Background Gradients for Glassmorphism */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/10 opacity-70 pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[33%] pointer-events-none">
                <Landmark className="w-48 h-48 text-blue-600/10 dark:text-blue-200/5 rotate-[-5deg]" />
            </div>

            <div className="relative z-10 flex flex-col w-full h-full p-5">
                
                {/* Header: Title and Eye icon */}
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        <Wallet className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Vault Balance</span>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-500" 
                        onClick={() => setShowBalance(!showBalance)}
                    >
                        {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Main Total Balance */}
                <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 drop-shadow-sm">
                        ${getDisplayValue(totalBalanceVal.toFixed(2))}
                    </span>
                    <span className="text-sm text-zinc-500 font-medium">USD</span>
                </div>

                {/* Progress Bar representation */}
                <div className="mt-4 mb-3 w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden flex shadow-inner">
                    <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${percentAvailable}%` }} 
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                    />
                    <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${percentLocked}%` }} 
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
                    />
                </div>

                {/* Sub Balances */}
                <div className="flex justify-between items-center text-xs text-zinc-600 dark:text-zinc-400 mt-1 mb-auto">
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Avail: <strong className="text-zinc-800 dark:text-zinc-200">${getDisplayValue(availableBalanceVal.toFixed(2))}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Locked: <strong className="text-zinc-800 dark:text-zinc-200">${getDisplayValue(lockedBalanceVal.toFixed(2))}</strong></span>
                    </div>
                </div>

                 {/* Actions */}
                 <div className="w-full flex justify-end items-center mt-3 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
                    <DepositDialog 
                        // @ts-ignore custom prop class applied internally inside DepositDialog if supported, or wrapped if not.
                        className="h-9 px-6 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-[0_4px_14px_0_rgb(0,118,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,118,255,0.23)] transition-all duration-300 transform hover:-translate-y-0.5 border-none" 
                    />
                </div>

            </div>
        </motion.div>
    );
};
