'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { getApiBaseUrl } from '../lib/utils';

interface PipelineContextType {
    currentRun: any | null;
    isRunning: boolean;
    episodeCount: number;
    mutationCount: number;
    gatePassRate: number;
    averageQuality: number;
    primitives: any;
    startRun: () => void;
    completeRun: (context: any, newEpisodeCount?: number) => void;
    clearRun: () => void;
    refreshStats: () => Promise<void>;
    refreshPrimitives: () => Promise<void>;
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

export function PipelineProvider({ children }: { children: ReactNode }) {
    const [currentRun, setCurrentRun] = useState<any | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [episodeCount, setEpisodeCount] = useState(59);
    const [mutationCount, setMutationCount] = useState(44);
    const [gatePassRate, setGatePassRate] = useState(0.78);
    const [averageQuality, setAverageQuality] = useState(84.7);
    const [primitives, setPrimitives] = useState<any>({});

    const refreshPrimitives = useCallback(async () => {
        try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/primitives`);
            const data = await response.json();
            setPrimitives(data);
        } catch (error) {
            console.error('Failed to fetch primitives:', error);
        }
    }, []);

    const refreshStats = useCallback(async () => {
        try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/stats`);
            const data = await response.json();
            if (data.success || data.total_episodes) {
                setEpisodeCount(data.total_episodes);
                setMutationCount(data.total_mutations);
                setGatePassRate((data.gate_pass_rate || 78) / 100);
                setAverageQuality(data.average_quality || 84.7);
                refreshPrimitives(); // Sync primitives with stats
            }
        } catch (error) {
            console.error('Failed to refresh stats:', error);
        }
    }, [refreshPrimitives]);

    const startRun = () => {
        setIsRunning(true);
        setCurrentRun(null);
    };

    const completeRun = (context: any, newEpisodeCount?: number) => {
        console.log('✅ Pipeline completed:', context);
        setCurrentRun(context);
        setIsRunning(false);

        if (newEpisodeCount) {
            setEpisodeCount(newEpisodeCount);
        }

        // Auto-refresh stats and primitives after 1.5 seconds to ensure Redis has settled
        setTimeout(() => {
            refreshStats();
        }, 1500);
    };

    const clearRun = () => {
        setCurrentRun(null);
        setIsRunning(false);
    };

    // Initial fetch
    useState(() => {
        refreshPrimitives();
    });

    return (
        <PipelineContext.Provider value={{
            currentRun,
            isRunning,
            episodeCount,
            mutationCount,
            gatePassRate,
            averageQuality,
            primitives,
            startRun,
            completeRun,
            clearRun,
            refreshStats,
            refreshPrimitives
        }}>
            {children}
        </PipelineContext.Provider>
    );
}

export function usePipeline() {
    const context = useContext(PipelineContext);
    if (!context) {
        throw new Error('usePipeline must be used within PipelineProvider');
    }
    return context;
}
