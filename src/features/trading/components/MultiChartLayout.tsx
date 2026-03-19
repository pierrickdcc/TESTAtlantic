"use client";
import React, { useState, useMemo } from 'react';
import { Asset, ChartControls } from './ChartControls';
import { useChartData } from '@/features/trading/hooks/useChartData';
import { LightweightChart } from './LightweightChart';
import { usePositions } from '@/features/trading/hooks/usePositions';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import { Plus, LayoutGrid, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';

const SingleChartInstance = ({ initialAsset, initialTimeframe, onRemove }: { initialAsset: Asset, initialTimeframe: string, onRemove?: () => void }) => {
    const [asset, setAsset] = useState<Asset>(initialAsset);
    const [timeframe, setTimeframe] = useState(initialTimeframe);
    
    const { data } = useChartData(asset.id, timeframe);
    const { positions } = usePositions();
    const { data: wsData } = useWebSocket();
    
    const currentPrice = useMemo(() => {
        if (!asset.pair || !wsData[asset.pair]) return 0;
        const pairData = wsData[asset.pair];
        return pairData.instruments?.length ? parseFloat(pairData.instruments[0].currentPrice) : 0;
    }, [wsData, asset.pair]);
    
    return (
        <div className="flex flex-col w-full h-full relative group bg-white dark:bg-deep-space border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm transition-all hover:border-blue-500/50 min-h-0 min-w-0">
            <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0 flex items-center justify-between overflow-x-auto no-scrollbar relative z-10">
                <div className="flex-1 w-full scale-[0.95] origin-left">
                    <ChartControls
                        selectedAsset={asset}
                        onAssetChange={setAsset}
                        selectedTimeframe={timeframe}
                        onTimeframeChange={setTimeframe}
                        priceChange={0} 
                        priceChangePercent={0}
                        currentPrice={currentPrice}
                        isChartPoppedOut={true}
                        onTogglePopOut={() => {}} 
                    />
                </div>
                {onRemove && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-white dark:bg-deep-space pl-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" onClick={onRemove}>
                            <X size={14} />
                        </Button>
                    </div>
                )}
            </div>
            <div className="flex-1 min-h-0 bg-white dark:bg-deep-space relative z-0">
                <LightweightChart data={data} positions={positions} isPositionsCollapsed={true} />
            </div>
        </div>
    );
};

export const MultiChartLayout = ({ initialAsset, initialTimeframe }: { initialAsset: Asset, initialTimeframe: string }) => {
    const [charts, setCharts] = useState([{ id: '1', asset: initialAsset, timeframe: initialTimeframe }]);
    
    const addChart = () => {
        if (charts.length < 4) {
            setCharts([...charts, { id: Math.random().toString(), asset: initialAsset, timeframe: initialTimeframe }]);
        }
    };
    
    const removeChart = (id: string) => {
        if (charts.length > 1) {
            setCharts(charts.filter(c => c.id !== id));
        }
    };
    
    const gridClass = charts.length === 1 ? 'grid-cols-1 grid-rows-1' 
                    : charts.length === 2 ? 'grid-cols-2 grid-rows-1' 
                    : 'grid-cols-2 grid-rows-2';
                    
    return (
        <div className="flex flex-col w-full h-full bg-zinc-50 dark:bg-[#060A16] overflow-hidden">
            <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-deep-space flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <LayoutGrid size={16} className="text-zinc-500" />
                    <span className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Multi-Chart View</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">({charts.length}/4)</span>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={addChart} 
                    disabled={charts.length >= 4}
                    className="h-8 gap-1 border border-zinc-200 dark:border-zinc-700 text-slate-900 bg-transparent dark:bg-transparent dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <Plus size={14} /> Add Chart
                </Button>
            </div>
            
            <div className={`flex-1 p-2 grid gap-2 ${gridClass} min-h-0 min-w-0`}>
                {charts.map((chart) => (
                    <div key={chart.id} className="min-w-0 min-h-0 relative flex flex-col">
                        <SingleChartInstance 
                            initialAsset={chart.asset} 
                            initialTimeframe={chart.timeframe}
                            onRemove={charts.length > 1 ? () => removeChart(chart.id) : undefined}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
