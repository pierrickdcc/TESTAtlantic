"use client";
import React, { useState, useContext, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// Définition du contexte pour stocker la fonction
interface WalletConnectContextType {
    openConnectModal: (() => void) | undefined;
}

const WalletConnectContext = React.createContext<WalletConnectContextType>({ openConnectModal: undefined });

// 1. Le Fournisseur (Provider) qui utilise ConnectButton.Custom pour capturer la fonction
interface WalletConnectProviderProps {
    children: React.ReactNode;
}

export const WalletConnectProvider: React.FC<WalletConnectProviderProps> = ({ children }) => {
    const [openConnectModalFn, setOpenConnectModalFn] = useState<(() => void) | undefined>(undefined);

    return (
        <ConnectButton.Custom>
            {({ openConnectModal, mounted }) => {
                // 🛑 CRITIQUE: Enregistrer la fonction openConnectModal dans le state local
                // Cela se produit une seule fois au montage.
                useEffect(() => {
                    if (mounted) {
                        setOpenConnectModalFn(() => openConnectModal);
                    }
                }, [mounted, openConnectModal]);

                // Fournir la fonction capturée via le contexte
                return (
                    <WalletConnectContext.Provider value={{ openConnectModal: openConnectModalFn }}>
                        {children}
                        {/* Important: Le ConnectButton.Custom a besoin de rendre quelque chose. 
                           Nous rendons un fragment vide ici pour ne pas interférer avec le rendu de Sidebar. */}
                        <div style={{ display: 'none' }} />
                    </WalletConnectContext.Provider>
                );
            }}
        </ConnectButton.Custom>
    );
};

// 2. Le Hook personnalisé pour consommer la fonction
export const useWalletConnectModal = () => {
    const context = useContext(WalletConnectContext);
    if (context === undefined) {
        console.error("useWalletConnectModal must be used within a WalletConnectProvider.");
    }
    return context;
};