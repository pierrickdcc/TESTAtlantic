"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Checkbox } from "@/shared/ui/checkbox";
import { useVault } from "@/features/vault/hooks/useVault";
import { useToast } from "@/shared/hooks/use-toast";

import { Asset } from "./ChartControls";
import { useAssetConfig } from "@/shared/hooks/useAssetConfig";
import { MarketClosedBanner } from "@/shared/ui/MarketClosedBanner";
import { useWriteContract, useAccount, usePublicClient, useReadContracts } from 'wagmi';
import { usePaymaster } from "@/shared/hooks/useBrokexPaymaster";
import { ChevronUp, ChevronDown, Fuel } from 'lucide-react'; 
import { Hash, formatUnits } from 'viem';
import { useMarketStatus } from "@/features/trading/hooks/useMarketStatus";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ExternalLink, ArrowDownLeft } from 'lucide-react';
import { PopOutWindow } from '@/shared/ui/PopOutWindow';

// NOUVEAU : On importe le FaucetDialog pour pouvoir l'ouvrir depuis l'OrderPanel
import { FaucetDialog } from "@/shared/ui/FaucetDialog";

// --- MAPPING DES TAILLES DE LOTS ---
const ASSET_LOT_SIZES: Record<number, number> = {
    0: 0.01,    // btc_usdt
    1: 0.01,     // eth_usdt
    2: 1,       // link_usdt
    3: 1000,    // doge_usdt
    5: 1,       // avax_usdt
    10: 1,      // sol_usdt
    14: 100,    // xrp_usdt
    15: 1000,   // trx_usdt
    16: 100,    // ada_usdt
    90: 10,     // sui_usdt
    5500: 0.01, // xau_usd
    5501: 0.1,  // xag_usd
};

// --- CONSTANTES TRADING ---
const TRADING_ADDRESS = '0xC7eA1B52D20d0B4135ae5cc8E4225b3F12eA279B' as const;
const TRADING_ABI = [
    {
        inputs: [
            { internalType: "uint32", name: "assetId", type: "uint32" },
            { internalType: "bool", name: "isLong", type: "bool" },
            { internalType: "uint8", name: "leverage", type: "uint8" },
            { internalType: "int32", name: "lotSize", type: "int32" },
            { internalType: "uint48", name: "stopLoss", type: "uint48" },
            { internalType: "uint48", name: "takeProfit", type: "uint48" },
            { internalType: "bytes", name: "oracleProof", type: "bytes" }
        ],
        name: "openMarketPosition",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            { internalType: "uint32", name: "assetId", type: "uint32" },
            { internalType: "bool", name: "isLong", type: "bool" },
            { internalType: "bool", name: "isLimit", type: "bool" },
            { internalType: "uint8", name: "leverage", type: "uint8" },
            { internalType: "int32", name: "lotSize", type: "int32" },
            { internalType: "uint48", name: "targetPrice", type: "uint48" },
            { internalType: "uint48", name: "stopLoss", type: "uint48" },
            { internalType: "uint48", name: "takeProfit", type: "uint48" }
        ],
        name: "placeOrder",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    }
] as const;

// --- CONSTANTES VAULT ---
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

interface StepControllerProps {
    value: string | number;
    onChange: (value: any) => void;
    step: number;
    min?: number;
    max?: number;
    decimals?: number;
    isCompact?: boolean;
}

const StepController: React.FC<StepControllerProps> = ({
    value, onChange, step, min = 0, max = Infinity, decimals = 2, isCompact = false
}) => {
    const numericValue = Number(value);
    const handleStep = (delta: number) => {
        const newValue = Math.min(max, Math.max(min, numericValue + delta));
        const finalDecimals = isCompact && step === 1 ? 0 : decimals;
        onChange(Number(newValue.toFixed(finalDecimals)));
    };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);
    };

    const widthClass = isCompact 
        ? 'w-full text-center h-7 text-xs p-1 pr-5 dark:bg-deep-space dark:border-zinc-800 dark:text-white dark:focus:border-zinc-600' 
        : 'w-full text-lg font-medium pr-10 dark:bg-deep-space dark:border-zinc-800 dark:text-white dark:focus:border-zinc-600';
    const buttonWidth = isCompact ? 'w-5' : 'w-8';
    const iconSize = isCompact ? 'w-3 h-3' : 'w-4 h-4';

    return (
        <div className="relative flex items-center">
            <Input
                type="text"
                placeholder="0.00"
                value={value}
                onChange={handleInputChange}
                className={widthClass}
            />
            <div className={`absolute right-0 top-0 h-full flex flex-col justify-center border-l border-border dark:border-zinc-800`}>
                <Button variant="ghost" size="icon" className={`h-1/2 ${buttonWidth} p-0 border-b border-border/80 dark:border-zinc-800 rounded-none rounded-tr-sm hover:dark:bg-zinc-900`} onClick={() => handleStep(step)}>
                    <ChevronUp className={`${iconSize} dark:text-zinc-500`} />
                </Button>
                <Button variant="ghost" size="icon" className={`h-1/2 ${buttonWidth} p-0 rounded-none rounded-br-sm hover:dark:bg-zinc-900`} onClick={() => handleStep(-step)}>
                    <ChevronDown className={`${iconSize} dark:text-zinc-500`} />
                </Button>
            </div>
        </div>
    );
};

type OrderType = "limit" | "market" | "stop";

const getMarketProof = async (assetId: number): Promise<Hash> => {
    const url = `https://backend.brokex.trade/proof?pairs=${assetId}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch proof`);
    const data = await response.json();
    return data.proof as Hash;
};

interface OrderPanelProps {
    selectedAsset: Asset;
    currentPrice: number;
    paymasterEnabled: boolean;
    onTogglePaymaster: () => void;
    onGoToWallet?: () => void;
}

const OrderPanel = ({
    selectedAsset,
    currentPrice,
    paymasterEnabled,
    onTogglePaymaster,
    onGoToWallet
}: OrderPanelProps) => {

    const [orderType, setOrderType] = useState<OrderType>("limit");
    const [tpEnabled, setTpEnabled] = useState(false);
    const [slEnabled, setSlEnabled] = useState(false);
    const [leverage, setLeverage] = useState(10);
    const [assetAmount, setAssetAmount] = useState<number | string>(1); 
    const [limitPrice, setLimitPrice] = useState('');
    
    const [isUserEditedPrice, setIsUserEditedPrice] = useState(false);

    // Etat pour ouvrir la modale Faucet
    const [isFaucetOpen, setIsFaucetOpen] = useState(false);

    // Etat pour le popout
    const [isPoppedOut, setIsPoppedOut] = useState(false);

    const [tpPrice, setTpPrice] = useState('');
    const [slPrice, setSlPrice] = useState('');
    const [localLoading, setLocalLoading] = useState(false);

    const { refetchAll: refetchVault } = useVault();
    const { getConfigById } = useAssetConfig();
    const { address, chain: currentChain } = useAccount();
    const { executeOpenMarket, executePlaceOrder, isLoading: paymasterLoading } = usePaymaster();
    
    const { writeContractAsync } = useWriteContract();
    const { toast } = useToast();
    const publicClient = usePublicClient({ chainId: currentChain?.id });

    const safeAddress = address || '0x0000000000000000000000000000000000000000';

    const { data: balanceData, refetch: refetchBalances } = useReadContracts({
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

    const loading = localLoading || paymasterLoading;
    
    const finalAssetIdForTx = useMemo(() => {
        const id = Number(selectedAsset.id);
        return (isNaN(id) || id < 0) ? 0 : id;
    }, [selectedAsset.id]);

    const marketStatus = useMarketStatus(finalAssetIdForTx);
    const isMarketOpen = marketStatus.isOpen;

    const lotSizeInAsset = ASSET_LOT_SIZES[finalAssetIdForTx] || 1;
    const amountDecimals = Math.max(0, -Math.floor(Math.log10(lotSizeInAsset)));
    
    const actualLots = useMemo(() => {
        return Math.max(1, Math.round(Number(assetAmount) / lotSizeInAsset));
    }, [assetAmount, lotSizeInAsset]);

    const effectiveAmount = actualLots * lotSizeInAsset;

    useEffect(() => {
        setAssetAmount(lotSizeInAsset);
    }, [finalAssetIdForTx, lotSizeInAsset]);

    useEffect(() => {
        if (!isMarketOpen && orderType === "market") setOrderType("limit");
    }, [isMarketOpen, orderType]);

    const assetConfig = getConfigById(finalAssetIdForTx);

    const { priceDecimals, priceStep } = useMemo(() => {
        const decimals = Math.max(0, Math.round(Math.log10(1000000 / (assetConfig?.tick_size_usd6 || 10000))));
        return { priceDecimals: decimals, priceStep: 1 / (10 ** decimals) };
    }, [assetConfig]);

    useEffect(() => {
        setIsUserEditedPrice(false);
    }, [selectedAsset.id, orderType]);

    useEffect(() => {
        if (currentPrice > 0 && (orderType === 'limit' || orderType === 'stop')) {
            if (!isUserEditedPrice) {
                setLimitPrice(currentPrice.toFixed(priceDecimals));
            }
        }
    }, [currentPrice, priceDecimals, orderType, isUserEditedPrice]);

    const handleLimitPriceChange = (newVal: any) => {
        setIsUserEditedPrice(true);
        setLimitPrice(newVal);
    };

    const calculations = useMemo(() => {
        const price = (orderType === 'limit' || orderType === 'stop') && limitPrice ? Number(limitPrice) : currentPrice;
        if (isNaN(price) || price <= 0 || effectiveAmount <= 0) return { value: 0, cost: 0, commission: 0, liqPriceLong: 0, liqPriceShort: 0 };
        
        const displayNotional = effectiveAmount * price; 
        const commissionRate = 0.001; 

        return {
            value: displayNotional,
            cost: displayNotional / leverage,
            commission: displayNotional * commissionRate,
            liqPriceLong: price * (1 - 0.99 / leverage),
            liqPriceShort: price * (1 + 0.99 / leverage),
        };
    }, [effectiveAmount, leverage, limitPrice, currentPrice, orderType]);

    const formatPrice = (value: number) => value === 0 ? "0.00" : value.toFixed(priceDecimals > 5 ? 5 : priceDecimals || 2);

    const handleTrade = async (longSide: boolean) => {
        if (!isMarketOpen && orderType === 'market') return toast({ title: 'Market Closed', variant: "destructive" });
        
        const numLimitPrice = Number(limitPrice);
        const numSlPrice = slEnabled && slPrice ? Number(slPrice) : undefined;
        const numTpPrice = tpEnabled && tpPrice ? Number(tpPrice) : undefined;
        const requiredMargin = calculations.cost * 1.01;

        if (availableBalanceVal < requiredMargin) return toast({ title: 'Insufficient Balance', variant: "destructive" });

        if (!paymasterEnabled) setLocalLoading(true);
        let txHash: Hash | string | undefined;

        try {
            const slX6 = numSlPrice ? Math.round(numSlPrice * 1000000) : 0;
            const tpX6 = numTpPrice ? Math.round(numTpPrice * 1000000) : 0;

            if (paymasterEnabled) {
                if (orderType === 'limit' || orderType === 'stop') {
                    const targetPriceX6 = Math.round(numLimitPrice * 1000000);
                    txHash = await executePlaceOrder({
                        assetId: finalAssetIdForTx,
                        isLong: longSide,
                        isLimit: orderType === 'limit',
                        leverage: leverage,
                        lotSize: actualLots,
                        targetPrice: targetPriceX6,
                        stopLoss: slX6,
                        takeProfit: tpX6
                    });
                } else {
                    txHash = await executeOpenMarket({
                        assetId: finalAssetIdForTx,
                        isLong: longSide,
                        leverage: leverage,
                        lotSize: actualLots,
                        stopLoss: slX6,
                        takeProfit: tpX6
                    });
                }
            } else {
                if (orderType === 'limit' || orderType === 'stop') {
                    const isLimit = orderType === 'limit'; 
                    const targetPriceX6 = Math.round(numLimitPrice * 1000000);

                    txHash = await writeContractAsync({
                        address: TRADING_ADDRESS, 
                        abi: TRADING_ABI, 
                        functionName: 'placeOrder',
                        args: [
                            finalAssetIdForTx, 
                            longSide, 
                            isLimit, 
                            leverage, 
                            actualLots,
                            targetPriceX6, 
                            slX6, 
                            tpX6
                        ],
                    });
                } else {
                    const proof = await getMarketProof(finalAssetIdForTx);
                    txHash = await writeContractAsync({
                        address: TRADING_ADDRESS, 
                        abi: TRADING_ABI, 
                        functionName: 'openMarketPosition',
                        args: [
                            finalAssetIdForTx, 
                            longSide, 
                            leverage, 
                            actualLots,
                            slX6, 
                            tpX6, 
                            proof
                        ],
                    });
                }
                
                if (publicClient && txHash) await publicClient.waitForTransactionReceipt({ hash: txHash as Hash });
            }

            toast({ title: 'Order Placed', description: `${longSide ? 'Buy' : 'Sell'} order successful.` });
            refetchVault();
            refetchBalances();
        } catch (e: any) {
            console.error("Order error:", e);
            toast({ title: 'Order failed', description: e.message || "An error occurred", variant: "destructive" });
        } finally {
            setLocalLoading(false);
        }
    };

    const renderContent = () => (
        <div className="w-full h-full flex flex-col bg-zinc-50 dark:bg-deep-space transition-colors duration-300 mx-auto border-l border-zinc-200/50 dark:border-zinc-800/50 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] dark:shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.3)] z-10">
            {/* Header */}
            <div className="flex justify-between items-center px-4 h-12 flex-shrink-0 bg-zinc-50/80 dark:bg-white/5 backdrop-blur-md text-zinc-800 dark:text-zinc-200 text-xs font-bold tracking-widest uppercase border-b border-gray-200 dark:border-zinc-800">
                <span>ORDER PANEL</span>
                {!isPoppedOut && (
                    <button
                        onClick={() => setIsPoppedOut(true)}
                        className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                        title="Pop-out Order Panel"
                    >
                        <ExternalLink size={14} />
                    </button>
                )}
            </div>
            <MarketClosedBanner status={marketStatus} />

            <div className="flex-grow p-4 space-y-5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                
                <div className="flex justify-between items-center border-b border-zinc-200/50 dark:border-zinc-800/50 text-zinc-500 font-medium text-sm pt-1 pb-2">
                    <div className="flex">
                        <div 
                            className={`py-1 mr-4 cursor-pointer transition ${orderType === "limit" ? "text-foreground dark:text-white border-b-2 border-foreground dark:border-white" : "hover:text-foreground dark:hover:text-zinc-400"}`} 
                            onClick={() => setOrderType("limit")}
                        >
                            Limit
                        </div>
                        <div 
                            className={`py-1 mr-4 cursor-pointer transition ${orderType === "stop" ? "text-foreground dark:text-white border-b-2 border-foreground dark:border-white" : "hover:text-foreground dark:hover:text-zinc-400"}`} 
                            onClick={() => setOrderType("stop")}
                        >
                            Stop
                        </div>
                        <div 
                            className={`py-1 mr-4 transition ${!isMarketOpen ? "opacity-50 cursor-not-allowed" : orderType === "market" ? "text-foreground dark:text-white border-b-2 border-foreground dark:border-white cursor-pointer" : "hover:text-foreground dark:hover:text-zinc-400 cursor-pointer"}`} 
                            onClick={() => isMarketOpen && setOrderType("market")}
                        >
                            Market
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-20">
                            <StepController value={leverage} onChange={setLeverage} step={1} min={1} max={100} decimals={0} isCompact={true} />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 rounded-md ${paymasterEnabled ? "bg-amber-400 text-white" : "border border-border dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"}`} onClick={onTogglePaymaster}>
                            <Fuel className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {(orderType === "limit" || orderType === "stop") && (
                    <div>
                        <span className="text-light-text dark:text-zinc-500 text-xs block mb-1">
                            {orderType === "stop" ? "Stop Price (USD)" : "Limit Price (USD)"}
                        </span>
                        <StepController value={limitPrice} onChange={handleLimitPriceChange} step={priceStep} decimals={priceDecimals} />
                    </div>
                )}

                <div>
                    <span className="text-light-text dark:text-zinc-500 text-xs block mb-1">
                        Amount ({selectedAsset.symbol.split('/')[0]})
                    </span>
                    <StepController 
                        value={assetAmount} 
                        onChange={setAssetAmount} 
                        step={lotSizeInAsset} 
                        min={lotSizeInAsset} 
                        decimals={amountDecimals} 
                    />
                </div>

                <div className="space-y-3">
                    <div>
                        {/* NOUVEAU : Logique de clic sur Checkbox pour Take Profit */}
                        <label className="flex items-center text-foreground dark:text-zinc-300 cursor-pointer mb-2">
                            <Checkbox 
                                checked={tpEnabled} 
                                onCheckedChange={(c) => {
                                    setTpEnabled(!!c);
                                    if (!!c) setTpPrice(currentPrice.toFixed(priceDecimals));
                                }} 
                                className="mr-2 dark:border-zinc-600 dark:data-[state=checked]:bg-zinc-200 dark:data-[state=checked]:text-black" 
                            />
                            <span className="text-sm">Take Profit</span>
                        </label>
                        {tpEnabled && <StepController value={tpPrice} onChange={setTpPrice} step={priceStep} decimals={priceDecimals} />}
                    </div>
                    <div>
                        {/* NOUVEAU : Logique de clic sur Checkbox pour Stop Loss */}
                        <label className="flex items-center text-foreground dark:text-zinc-300 cursor-pointer mb-2">
                            <Checkbox 
                                checked={slEnabled} 
                                onCheckedChange={(c) => {
                                    setSlEnabled(!!c);
                                    if (!!c) setSlPrice(currentPrice.toFixed(priceDecimals));
                                }} 
                                className="mr-2 dark:border-zinc-600 dark:data-[state=checked]:bg-zinc-200 dark:data-[state=checked]:text-black" 
                            />
                            <span className="text-sm">Stop Loss</span>
                        </label>
                        {slEnabled && <StepController value={slPrice} onChange={setSlPrice} step={priceStep} decimals={priceDecimals} />}
                    </div>
                </div>

                {/* SÉCURISATION DU CONNECT BUTTON + CLAIM FAUCET */}
                <div className="w-full pt-2 pb-3">
                    <ConnectButton.Custom>
                        {({ account, chain, openConnectModal, mounted }) => {
                            const ready = mounted;
                            const connected = ready && account && chain;
                            
                            return (
                                <div
                                    className="flex space-x-3 w-full"
                                    {...(!ready && {
                                        'aria-hidden': true,
                                        style: { opacity: 0, pointerEvents: 'none' },
                                    })}
                                >
                                    {!connected ? (
                                        <Button 
                                            onClick={openConnectModal} 
                                            className="w-full font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                                        >
                                            Connect Wallet
                                        </Button>
                                    ) : totalBalanceVal <= 0 ? (
                                        <Button 
                                            onClick={() => setIsFaucetOpen(true)} 
                                            className="w-full font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                                        >
                                            Claim Test Funds
                                        </Button>
                                    ) : (
                                        <>
                                            <Button onClick={() => handleTrade(true)} disabled={loading} className={`flex-1 font-bold ${loading ? 'bg-zinc-800' : 'bg-trading-blue hover:opacity-90'} text-white`}>
                                                {loading ? '...' : 'Buy'}
                                            </Button>
                                            <Button onClick={() => handleTrade(false)} disabled={loading} className={`flex-1 font-bold ${loading ? 'bg-zinc-800' : 'bg-trading-red hover:opacity-90'} text-white`}>
                                                {loading ? '...' : 'Sell'}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            );
                        }}
                    </ConnectButton.Custom>
                </div>

                <div className="text-xs space-y-1.5 pt-3 border-t border-border dark:border-zinc-800">
                    <div className="flex justify-between text-light-text dark:text-zinc-500"><span>Value</span><span className="text-foreground dark:text-zinc-200">${formatPrice(calculations.value)}</span></div>
                    <div className="flex justify-between text-light-text dark:text-zinc-500"><span>Cost (Margin)</span><span className="text-foreground dark:text-zinc-200">${formatPrice(calculations.cost)}</span></div>
                    <div className="flex justify-between text-light-text dark:text-zinc-500"><span>Commission</span><span className="text-foreground dark:text-zinc-200">${formatPrice(calculations.commission)}</span></div>
                    <div className="flex justify-between text-light-text dark:text-zinc-500"><span>Liq. Price</span><span className="text-foreground dark:text-zinc-400 text-[10px]">${formatPrice(calculations.liqPriceLong)} / ${formatPrice(calculations.liqPriceShort)}</span></div>
                </div>
            </div>


            {/* Faucet Modal ajoutée à la fin */}
            <FaucetDialog 
                open={isFaucetOpen} 
                onOpenChange={setIsFaucetOpen} 
            />
        </div>
    );

    if (isPoppedOut) {
        return (
            <div className="w-[320px] h-full flex flex-col">
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-deep-space border-l border-dashed border-zinc-300 dark:border-zinc-800/50">
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Order Panel is detached</p>
                    <button
                        onClick={() => setIsPoppedOut(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-zinc-700 dark:text-zinc-300"
                    >
                        <ArrowDownLeft size={16} />
                        Restore to main window
                    </button>
                </div>
                <PopOutWindow
                    title="Order Panel"
                    onClose={() => setIsPoppedOut(false)}
                    width={340}
                    height={850}
                >
                    {renderContent()}
                </PopOutWindow>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            {renderContent()}
        </div>
    );
};

export default OrderPanel;