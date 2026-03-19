"use client";

import React, { useEffect, useState } from 'react';
import { TrendingUp, Droplet, Sun, Moon, Vault, Compass, Trophy, Wallet } from "lucide-react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTheme } from "next-themes"; 
import { useUIStore } from "../store/uiStore";
import { useNavigate, useLocation } from "react-router-dom";

export const TopNavbar: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { currentView, setView, toggleFaucet } = useUIStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => { setMounted(true); }, []);

    const handleNavigate = (view: 'trading' | 'vault' | 'scan' | 'leaderboard') => {
        setView(view);
        navigate(view === 'trading' ? '/' : `/${view}`);
    };

    const getLinkStyle = (viewName: string) => {
        const isActive = currentView === viewName;
        return `flex items-center gap-2 px-3 py-2 text-sm font-semibold uppercase tracking-wider transition-all duration-300 relative group cursor-pointer ${
            isActive 
                ? "text-blue-500 dark:text-blue-400" 
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        }`;
    };

    return (
        <header className="fixed top-0 left-0 w-full h-16 z-50 flex items-center justify-between px-4 md:px-6 backdrop-blur-xl bg-white/70 dark:bg-[#060A16]/70 border-b border-zinc-200/50 dark:border-zinc-800/50 shadow-sm transition-colors duration-300 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Left: Logo & Navigation */}
            <div className="flex items-center gap-8 h-full">
                {/* Logo */}
                <a href="/" onClick={(e) => { e.preventDefault(); handleNavigate('trading'); }} className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
                    <img src="/logo.svg" alt="Logo" className="w-8 h-8 group-hover:scale-105 transition-transform duration-300" />
                    <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        BROKEX
                    </span>
                </a>

                {/* Nav Links */}
                <nav className="hidden md:flex items-center gap-2 h-full pt-1">
                    <button onClick={() => handleNavigate('trading')} className={getLinkStyle('trading')}>
                        <TrendingUp className="w-4 h-4" /> Trade
                        {currentView === 'trading' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] rounded-t-full" />}
                    </button>
                    <button onClick={() => handleNavigate('vault')} className={getLinkStyle('vault')}>
                        <Vault className="w-4 h-4" /> Portfolio
                        {currentView === 'vault' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] rounded-t-full" />}
                    </button>
                    <button onClick={() => handleNavigate('scan')} className={getLinkStyle('scan')}>
                        <Compass className="w-4 h-4" /> Explorer
                        {currentView === 'scan' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] rounded-t-full" />}
                    </button>
                    <button onClick={() => handleNavigate('leaderboard')} className={getLinkStyle('leaderboard')}>
                        <Trophy className="w-4 h-4" /> Leaderboard
                        {currentView === 'leaderboard' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] rounded-t-full" />}
                    </button>
                </nav>
            </div>

            {/* Right: Actions Island */}
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-inner">
                {/* Faucet Button */}
                <button 
                    onClick={() => toggleFaucet(true)} 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-zinc-800/80 transition-all duration-300 shadow-sm"
                >
                    <Droplet className="w-3.5 h-3.5" /> Faucet
                </button>

                <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-700" />

                {/* Theme Toggle */}
                {mounted && (
                    <button 
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                        className="p-1.5 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800/80 transition-all shadow-sm"
                        aria-label="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                )}

                <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-700" />

                {/* Wallet Connect */}
                <ConnectButton.Custom>
                    {({ account, chain, openAccountModal, openConnectModal, mounted: connectMounted }) => {
                        const ready = connectMounted;
                        const connected = ready && account && chain;
                        
                        return (
                            <div {...(!ready && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none' } })}>
                                {!connected ? (
                                    <button 
                                        onClick={openConnectModal} 
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[11px] uppercase tracking-wide bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
                                    >
                                        <Wallet className="w-3.5 h-3.5" /> Connect
                                    </button>
                                ) : chain.unsupported ? (
                                    <button 
                                        onClick={openConnectModal} 
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[11px] uppercase tracking-wide bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm"
                                    >
                                        <Wallet className="w-3.5 h-3.5" /> Wrong Net
                                    </button>
                                ) : (
                                    <button 
                                        onClick={openAccountModal} 
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[11px] bg-white hover:bg-gray-50 text-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white border border-zinc-200 dark:border-zinc-700 transition-all shadow-sm"
                                    >
                                        <Wallet className="w-3.5 h-3.5" /> {account.displayName}
                                    </button>
                                )}
                            </div>
                        );
                    }}
                </ConnectButton.Custom>
            </div>
        </header>
    );
};
