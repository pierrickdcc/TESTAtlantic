"use client";
"use client";

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TopNavbar } from "@/shared/ui/TopNavbar";
import TraderExplorerView from "@/features/explorer/components/TraderExplorerView";
import { useWebSocket } from '@/shared/hooks/useWebSocket';

const TraderPage: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const { data: wsData } = useWebSocket();

  if (!address) return null;

  return (
    <div className="antialiased bg-background dark:bg-deep-space h-screen w-full flex overflow-hidden">
      {/* Navbar en haut */}
      <TopNavbar />

      <main className="w-full h-full pt-20 bg-zinc-50 dark:bg-deep-space overflow-y-auto px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Retour</span>
          </button>
          
          <TraderExplorerView address={address} wsData={wsData} />
        </div>
      </main>
    </div>
  );
};

export default TraderPage;