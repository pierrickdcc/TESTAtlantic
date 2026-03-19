import React, { useState, useMemo } from 'react';
import { Asset, ChartControls } from './ChartControls';
import { useChartData } from '@/features/trading/hooks/useChartData';
import { LightweightChart } from './LightweightChart';
import { usePositions } from '@/features/trading/hooks/usePositions';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';

export const SingleChartInstance = ({ initialAsset, initialTimeframe, onRemove }: { initialAsset: Asset, initialTimeframe: string, onRemove?: () => void }) => {
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
        <div className="flex flex-col w-full h-full relative group bg-white dark:bg-deep-space border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
            <div className="h-10 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0 flex items-center justify-between pr-2">
                <div className="flex-1 overflow-hidden scale-90 origin-left">
                    <ChartControls
                        selectedAsset={asset}
                        onAssetChange={setAsset}
                        selectedTimeframe={timeframe}
                        onTimeframeChange={setTimeframe}
                        priceChange={0} // simplified for popout
                        priceChangePercent={0}
                        currentPrice={currentPrice}
                        isChartPoppedOut={true}
                        onTogglePopOut={() => {}} // disable close from here
                    />
                </div>
                {onRemove && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-red-500" onClick={onRemove}>
                        <X size={14} />
                    </Button>
                )}
            </div>
            <div className="flex-1 min-h-0 bg-white dark:bg-deep-space">
                <LightweightChart data={data} positions={positions} isPositionsCollapsed={true} />
            </div>
        </div>
    );
};
