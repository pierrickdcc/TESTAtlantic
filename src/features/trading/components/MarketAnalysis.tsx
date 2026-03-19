"use client";
// MarketAnalysis.tsx
import React, { Component } from 'react';

// -------------------------------------------------------------------------
// Types & Interfaces (Unchanged)
// -------------------------------------------------------------------------

interface TimeframeScores {
    [indicator: string]: number | null;
}

interface IndicatorScores {
    "15m": TimeframeScores;
    "1h": TimeframeScores;
    "1d": TimeframeScores;
}

interface AnalysisApiData {
    ok: boolean;
    assetId: number;
    pair: string;
    t: string;
    scores: IndicatorScores;
}

interface MarketAnalysisProps {
    selectedPair: string | undefined;
}

interface MarketAnalysisState {
    assetId: number | null;
    analysisData: IndicatorScores | null;
    loading: boolean;
    error: string | null;
    currentPairDisplay: string;
    selectedTimeframe: keyof IndicatorScores; 
}

// 🛑 TRANSLATED MAPPING
const INDICATOR_GROUPS: { [key: string]: { name: string; keys: string[] } } = {
    MOMENTUM: {
        name: "Momentum",
        keys: ["rsi14", "roc_24h", "roc_7d", "macd_hist"],
    },
    TREND: {
        name: "Trend",
        keys: ["ema_trend", "supertrend", "adx", "dist_ema200"],
    },
    VOLATILITY: {
        name: "Volatility",
        keys: ["atr_score", "bb_pos", "keltner_dir"],
    },
    CHANNEL: {
        name: "Channels",
        keys: ["donchian20", "donchian55", "rangepos20", "rangepos55"],
    },
};

const INDICATOR_MAP: { [key: string]: string } = {
    "rsi14": "RSI (14)", "macd_hist": "MACD Hist", "bb_pos": "BB Position", "adx": "ADX", "atr_score": "ATR Score",
    "donchian20": "Donchian 20", "donchian55": "Donchian 55", "keltner_dir": "Keltner Dir", "supertrend": "Supertrend",
    "ema_trend": "EMA Trend", "dist_ema200": "Dist EMA 200", "rangepos20": "Range Pos 20", "rangepos55": "Range Pos 55",
    "roc_24h": "ROC 24h", "roc_7d": "ROC 7d", "tf_aggregate": "Global Score",
};

// -------------------------------------------------------------------------
// MarketAnalysis Component (Class)
// -------------------------------------------------------------------------

export class MarketAnalysis extends Component<MarketAnalysisProps, MarketAnalysisState> {
    private fetchInterval: NodeJS.Timeout | null = null;
    private scrollableContainerId = "analysis-scroll-area"; 
    
    private static SCROLLBAR_HIDE_CSS = `
        #analysis-scroll-area::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
        }
        #analysis-scroll-area {
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
        }
    `;
    
    constructor(props: MarketAnalysisProps) {
        super(props);
        this.state = {
            assetId: null,
            analysisData: null,
            loading: false,
            error: null,
            currentPairDisplay: (props.selectedPair || 'N/A').toUpperCase().replace('_', '/'),
            selectedTimeframe: '15m',
        };
        this.fetchAnalysis = this.fetchAnalysis.bind(this);
    }

    componentDidMount() {
        this.startFetching(this.props.selectedPair);
    }

    componentDidUpdate(prevProps: MarketAnalysisProps, prevState: MarketAnalysisState) {
        // Handle asset change
        if (this.props.selectedPair !== prevProps.selectedPair) {
            this.setState({
                currentPairDisplay: (this.props.selectedPair || 'N/A').toUpperCase().replace('_', '/'),
                analysisData: null,
                error: null,
            });
            this.startFetching(this.props.selectedPair);
        }
        // Handle timeframe change
        if (this.state.selectedTimeframe !== prevState.selectedTimeframe && this.props.selectedPair) {
             this.fetchAnalysis(this.props.selectedPair);
        }
    }

    componentWillUnmount() {
        this.stopFetching();
    }

    stopFetching() {
        if (this.fetchInterval) {
            clearInterval(this.fetchInterval);
            this.fetchInterval = null;
        }
    }
    
    startFetching(pair: string | undefined) {
        this.stopFetching();
        
        if (!pair) {
            this.setState({ loading: false, analysisData: null });
            return;
        }

        this.fetchAnalysis(pair);
        
        this.fetchInterval = setInterval(() => {
            this.fetchAnalysis(pair);
        }, 15000); 
    }

    async fetchAnalysis(pair: string) {
        // SIMULATION: use ID 6004 if the pair is plausible, or 0.
        const assetId = pair && pair.toLowerCase() === "aapl_usd" ? 6004 : 0; 

        this.setState({ loading: true, error: null });

        try {
            const response = await fetch(`https://data.brokex.trade/api/indicator-scores?id=${assetId}`);
            if (!response.ok) {
                throw new Error('Network error during analysis retrieval.');
            }
            const data: AnalysisApiData = await response.json();
            
            if (data.ok && data.scores) {
                 this.setState({
                    analysisData: data.scores,
                    assetId: data.assetId,
                    loading: false,
                });
            } else {
                 this.setState({ loading: false, error: "Incorrect analysis data format." });
            }

        } catch (error) {
            this.setState({ loading: false, error: `Could not load analysis.` });
        }
    }
    
    getColorClass(score: number | null): string {
        if (score === null) return 'text-muted-foreground';
        if (score >= 20) return 'text-trading-blue'; // Strong Buy
        if (score >= 0) return 'text-trading-blue/80'; // Light Buy
        if (score > -20) return 'text-trading-red/80'; // Light Sell
        return 'text-trading-red'; // Strong Sell
    }

    handleTimeframeChange = (tf: keyof IndicatorScores) => {
        this.setState({ selectedTimeframe: tf });
    }

    renderTableRows(data: TimeframeScores, groupKeys: string[]) {
        return groupKeys
            .filter(key => data[key] !== undefined)
            .map(key => {
                const score = data[key];
                return (
                    <tr key={key} className="border-b border-border/50">
                        <td className="py-1 text-primary">{INDICATOR_MAP[key]}</td>
                        <td className={`text-right font-semibold ${this.getColorClass(score)}`}>
                            {score === null ? 'N/A' : score.toFixed(2)}
                        </td>
                    </tr>
                );
            });
    }

    render() {
        const { analysisData, loading, error, currentPairDisplay, selectedTimeframe } = this.state;
        const timeframeData = analysisData ? analysisData[selectedTimeframe] : null;
        
        const headerTextColor = "text-black";
        const timeframes = ['15m', '1h', '1d'] as (keyof IndicatorScores)[];

        return (
            <div className="w-full h-full flex flex-col"> 
                
                <div className="w-full h-full flex flex-col overflow-hidden">
                    
                    <style dangerouslySetInnerHTML={{ __html: MarketAnalysis.SCROLLBAR_HIDE_CSS }} />
                    
                    {/* Header */}
                    <div className="flex justify-between items-center px-3 py-2 bg-chart-bg text-white text-xs font-semibold border-b border-border">
                        <span className={headerTextColor}>MARKET ANALYSIS</span>
                        
                        {/* 🛑 Timeframe Buttons (Smaller and less padding/margin) */}
                        <div className="flex items-center gap-1 bg-muted rounded-md p-[1px]">
                            {timeframes.map((tf) => (
                              <button
                                key={tf}
                                onClick={() => this.handleTimeframeChange(tf)}
                                // 🛑 Reduced height and padding: h-5 px-1.5
                                className={`h-5 px-1.5 text-[10px] font-bold rounded-sm ${selectedTimeframe === tf ? 'bg-secondary text-primary' : 'bg-transparent text-muted-foreground hover:bg-muted/70'}`}
                              >
                                {tf.toUpperCase()}
                              </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area (Scrollable with Horizontal Padding) */}
                    <div id={this.scrollableContainerId} className="flex-1 overflow-y-scroll text-xs"> 
                        {loading && <div className="text-center text-muted-foreground p-4">Loading analysis for {currentPairDisplay}...</div>}
                        {error && <div className="text-center text-trading-red p-4">Error: {error}</div>}
                        
                        {timeframeData && (
                            // 🛑 ADDING PX-3 (or px-4) PADDING TO THE TABLE CONTAINER
                            <div className="px-3">
                                <table className="w-full border-collapse">
                                    <tbody>
                                        {Object.values(INDICATOR_GROUPS).map((group, index) => {
                                            const rows = this.renderTableRows(timeframeData, group.keys);
                                            if (rows.length === 0) return null;
                                            
                                            return (
                                                <React.Fragment key={group.name}>
                                                    <tr>
                                                        <td colSpan={2} 
                                                            // 🛑 REMOVING TOP MARGIN: Set pt-0 on first index, pt-2 for others.
                                                            className={`pb-1 text-left uppercase text-muted-foreground font-semibold border-b border-border/50 ${index === 0 ? 'pt-0' : 'pt-2'}`}
                                                        >
                                                            {group.name}
                                                        </td>
                                                    </tr>
                                                    {rows}
                                                </React.Fragment>
                                            );
                                        })}
                                        
                                        {/* 🛑 Global Score Row (Blue line removed) */}
                                        {timeframeData["tf_aggregate"] !== undefined && (
                                            <tr className="bg-accent/50 font-bold mt-2"> 
                                                <td className="py-2 text-primary">GLOBAL SCORE</td>
                                                <td className={`text-right ${this.getColorClass(timeframeData["tf_aggregate"])}`}>
                                                    {timeframeData["tf_aggregate"] === null ? 'N/A' : timeframeData["tf_aggregate"].toFixed(2)}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {!loading && !error && !analysisData && (
                             <div className="text-center text-muted-foreground py-4">No data available.</div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}