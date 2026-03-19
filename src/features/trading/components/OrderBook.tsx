"use client";
// OrderBook.tsx
import React, { Component, ComponentType, useState } from 'react';
import { useWebSocket, WebSocketMessage } from "@/shared/hooks/useWebSocket"; // 🛑 Import du Hook
import { ExternalLink, ArrowDownLeft } from 'lucide-react';
import { PopOutWindow } from '@/shared/ui/PopOutWindow';

// -------------------------------------------------------------------------
// Types & Interfaces
// -------------------------------------------------------------------------
interface Order {
    price: string;
    size: string;
    rawSize: number;
}
interface OrderBookData {
    bids: Order[];
    asks: Order[];
}
// WsResponse est maintenant importé via useWebSocket, mais on garde la définition pour la clarté si nécessaire
interface WsResponse extends WebSocketMessage {}


// 🛑 Interfaces de Props pour le composant de classe
interface OrderBookBaseProps {
    selectedPair: string | undefined; 
    wsData: WebSocketMessage; // 🛑 Données reçues via le wrapper
}

interface OrderBookState {
    orderBookCache: OrderBookData;
    lastPrice: number;
}
// -------------------------------------------------------------------------
// Fonctions de simulation (hors classe, inchangées)
// -------------------------------------------------------------------------

const generateRandomSizes = (): { size: string, rawSize: number }[] => {
    const sizes = [];
    for (let i = 0; i < 5; i++) {
        const rawSize = 0.5 + Math.random() * 2;
        sizes.push({ size: rawSize.toFixed(4), rawSize: rawSize });
    }
    return sizes;
};

const generateStableOrders = (basePrice: number, isBid: boolean): Order[] => {
    const orders: Order[] = [];
    const spread = isBid ? -0.001 : 0.001;
    const randomSizes = generateRandomSizes();
    
    for (let i = 0; i < 5; i++) {
        const price = basePrice * (1 + spread * (i + 1));
        orders.push({
            price: price.toFixed(6),
            size: randomSizes[i].size,
            rawSize: randomSizes[i].rawSize
        });
    }
    return isBid 
        ? orders.sort((a, b) => parseFloat(b.price) - parseFloat(a.price)) 
        : orders.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
};

const calculateProportionalWidths = (orders: Order[]) => {
    if (orders.length === 0) return [];
    
    const sizes = orders.map(order => order.rawSize);
    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);
    
    return orders.map(order => {
        if (minSize === maxSize) return 100;
        const normalized = (order.rawSize - minSize) / (maxSize - minSize);
        return 10 + (normalized * 90);
    });
};

// -------------------------------------------------------------------------
// Composant OrderBook (Classe Interne)
// -------------------------------------------------------------------------

// 🛑 RENOMMÉ: C'est le composant de base qui reçoit les données par props
class OrderBookBase extends Component<OrderBookBaseProps, OrderBookState> {
    private sizeUpdateInterval: NodeJS.Timeout | null = null;
    
    constructor(props: OrderBookBaseProps) {
        super(props);
        this.state = {
            orderBookCache: { bids: [], asks: [] },
            lastPrice: 0,
        };
        
        this.updateSizesOnly = this.updateSizesOnly.bind(this);
        this.updateOrderBook = this.updateOrderBook.bind(this);
    }

    componentDidMount() {
        // La connexion WebSocket est gérée par le hook parent, on commence juste les mises à jour de sizes.
        this.startSizeUpdates();
        // 🛑 Tenter une première mise à jour si la paire et les données sont déjà là
        this.processUpdate(this.props.selectedPair, this.props.wsData);
    }
    
    componentDidUpdate(prevProps: OrderBookBaseProps, prevState: OrderBookState) {
        const currentAssetKey = this.props.selectedPair;

        // 1. Changement de la paire sélectionnée
        if (currentAssetKey !== prevProps.selectedPair) {
            // Réinitialiser le prix, vider le cache, et forcer une mise à jour
            this.setState({ 
                lastPrice: 0,
                orderBookCache: { bids: [], asks: [] }
            }, () => {
                this.processUpdate(currentAssetKey, this.props.wsData);
            });
            return;
        }
        
        // 2. Mise à jour des données reçues via WebSocket (wsData a changé)
        if (this.props.wsData !== prevProps.wsData) {
            this.processUpdate(currentAssetKey, this.props.wsData);
        }
    }

    componentWillUnmount() {
        this.stopSizeUpdates();
    }
    
    // 🛑 NOUVELLE MÉTHODE: Traite la mise à jour des données et du prix
    processUpdate(assetKey: string | undefined, wsData: WebSocketMessage) {
        if (!assetKey || !wsData[assetKey]) return;

        const currentAssetData = wsData[assetKey];
        
        if (currentAssetData.instruments && currentAssetData.instruments.length > 0) {
            const newPrice = parseFloat(currentAssetData.instruments[0].currentPrice);
            const { lastPrice } = this.state;

            // Vérifier si le prix a réellement changé
            if (Math.abs(newPrice - lastPrice) > 0.0001) {
                // Le prix a changé, mettre à jour l'état et régénérer les ordres
                this.setState({ lastPrice: newPrice }, () => {
                    this.updateOrderBook(newPrice);
                });
            } else if (lastPrice === 0) {
                // Cas d'initialisation (première donnée reçue)
                this.setState({ lastPrice: newPrice }, () => {
                    this.updateOrderBook(newPrice);
                });
            }
        }
    }

    updateSizesOnly() {
        this.setState(prevState => {
            if (prevState.orderBookCache.bids.length === 0 || prevState.orderBookCache.asks.length === 0) return prevState;

            const newBidSizes = generateRandomSizes();
            const newAskSizes = generateRandomSizes();

            const newBids: Order[] = prevState.orderBookCache.bids.map((order, index) => ({
                ...order, size: newBidSizes[index].size, rawSize: newBidSizes[index].rawSize,
            }));

            const newAsks: Order[] = prevState.orderBookCache.asks.map((order, index) => ({
                ...order, size: newAskSizes[index].size, rawSize: newAskSizes[index].rawSize,
            }));

            return { orderBookCache: { bids: newBids, asks: newAsks } };
        });
    }

    updateOrderBook(currentPrice: number) {
        // Vérification de sécurité supplémentaire (bien que 'processUpdate' devrait déjà filtrer)
        if (currentPrice === 0) return;
        
        const newBids = generateStableOrders(currentPrice, true);
        const newAsks = generateStableOrders(currentPrice, false);

        this.setState({ orderBookCache: { bids: newBids, asks: newAsks } });
    }
    
    startSizeUpdates() {
        this.stopSizeUpdates(); 
        this.sizeUpdateInterval = setInterval(() => {
            if (this.props.selectedPair && this.state.lastPrice !== 0) {
                this.updateSizesOnly();
            }
        }, 2000);
    }

    stopSizeUpdates() {
        if (this.sizeUpdateInterval) {
            clearInterval(this.sizeUpdateInterval);
            this.sizeUpdateInterval = null;
        }
    }
    
    render() {
        const { orderBookCache } = this.state;
        const currentAssetPair = (this.props.selectedPair || 'N/A').toUpperCase().replace('_', '/');
        
        const bidWidths = calculateProportionalWidths(orderBookCache.bids);
        const askWidths = calculateProportionalWidths(orderBookCache.asks);

        return (
            <div className="w-full h-full flex flex-col"> 
                
                <div className="w-full h-full flex flex-col overflow-hidden">
                    
                    {/* Header - Moved to wrapper for popout button */}
                    
                    <div className="flex flex-1 overflow-hidden">
                        {/* BIDS (ACHATS) */}
                        <div className="flex flex-col flex-1 border-r border-border">
                            {/* Section Header */}
                            <div className="flex justify-between px-3 py-1 text-[10px] text-muted-foreground font-semibold border-b border-border bg-accent">
                                <span>PRICE (USD)</span>
                                <span>SIZE</span>
                            </div>
                            <ul className="flex-1 overflow-y-auto list-none p-0 m-0 relative text-xs">
                                {orderBookCache.bids.slice(0, 5).map((order, index) => (
                                    <li key={`bid-${index}`} className="flex justify-between px-3 py-[3px] border-b border-border/50 relative z-10 hover:bg-muted/50">
                                        <span className="font-semibold text-trading-blue">{parseFloat(order.price).toFixed(4)}</span>
                                        <span className="text-muted-foreground">{order.size}</span>
                                        <div 
                                            className="absolute top-0 right-0 h-full z-0 opacity-20 transition-all duration-300 bg-trading-blue" 
                                            style={{ width: `${bidWidths[index]}%` }} 
                                        />
                                    </li>
                                ))}
                                {Array(5 - orderBookCache.bids.length).fill(0).map((_, index) => (
                                    <li key={`empty-bid-${index}`} className="flex justify-between px-3 py-[3px] border-b border-border/50 text-muted-foreground/60"><span>-</span><span>-</span></li>
                                ))}
                            </ul>
                        </div>
                        
                        {/* ASKS (VENTES) */}
                        <div className="flex flex-col flex-1">
                            {/* Section Header */}
                            <div className="flex justify-between px-3 py-1 text-[10px] text-muted-foreground font-semibold border-b border-border bg-accent">
                                <span>SIZE</span>
                                <span>PRICE (USD)</span>
                            </div>
                            <ul className="flex-1 overflow-y-auto list-none p-0 m-0 relative text-xs">
                                {orderBookCache.asks.slice(0, 5).map((order, index) => (
                                    <li key={`ask-${index}`} className="flex justify-between px-3 py-[3px] border-b border-border/50 relative z-10 hover:bg-muted/50">
                                        <span className="text-muted-foreground">{order.size}</span>
                                        <span className="font-semibold text-trading-red">{parseFloat(order.price).toFixed(4)}</span>
                                        <div 
                                            className="absolute top-0 left-0 h-full z-0 opacity-20 transition-all duration-300 bg-trading-red" 
                                            style={{ width: `${askWidths[index]}%` }} 
                                        />
                                    </li>
                                ))}
                                {Array(5 - orderBookCache.asks.length).fill(0).map((_, index) => (
                                    <li key={`empty-ask-${index}`} className="flex justify-between px-3 py-[3px] border-b border-border/50 text-muted-foreground/60"><span>-</span><span>-</span></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

// 🛑 EXPORT DU WRAPPER (Composant fonctionnel qui utilise le hook)
export const OrderBook: ComponentType<{ selectedPair: string | undefined }> = (props) => {
    const { data: wsData } = useWebSocket();
    const [isPoppedOut, setIsPoppedOut] = useState(false);

    const currentAssetPair = (props.selectedPair || 'N/A').toUpperCase().replace('_', '/');

    const renderContent = () => (
        <div className="w-full h-full flex flex-col bg-white dark:bg-deep-space">
            <div className="flex justify-between items-center px-3 py-2 bg-chart-bg text-black text-xs font-semibold border-b border-border">
                <span>ORDER BOOK</span>
                <div className="flex items-center gap-2">
                    <span id="assetPair" className="text-black">{currentAssetPair}</span>
                    {!isPoppedOut && (
                        <button
                            onClick={() => setIsPoppedOut(true)}
                            className="text-black hover:text-gray-600 transition-colors ml-2"
                            title="Pop-out Order Book"
                        >
                            <ExternalLink size={14} />
                        </button>
                    )}
                </div>
            </div>
            <div className="flex-1 overflow-hidden relative">
                <OrderBookBase wsData={wsData} selectedPair={props.selectedPair} />
            </div>
        </div>
    );

    if (isPoppedOut) {
        return (
            <>
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900 border border-dashed border-gray-300 dark:border-zinc-700">
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Order Book is detached</p>
                    <button
                        onClick={() => setIsPoppedOut(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <ArrowDownLeft size={16} />
                        Restore to main window
                    </button>
                </div>
                <PopOutWindow
                    title={`Order Book - ${currentAssetPair}`}
                    onClose={() => setIsPoppedOut(false)}
                    width={350}
                    height={600}
                >
                    {renderContent()}
                </PopOutWindow>
            </>
        );
    }
    
    // Rendre le composant de classe avec les données du hook
    return renderContent();
};