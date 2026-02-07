'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface PipelineContextType {
    currentRun: any | null;
    isRunning: boolean;
    startRun: () => void;
    completeRun: (context: any) => void;
    clearRun: () => void;
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

export function PipelineProvider({ children }: { children: ReactNode }) {
    const [currentRun, setCurrentRun] = useState<any | null>(null);
    const [isRunning, setIsRunning] = useState(false);

    const startRun = () => {
        setIsRunning(true);
        setCurrentRun(null);
    };

    const completeRun = (context: any) => {
        console.log('✅ Pipeline completed:', context);
        setCurrentRun(context);
        setIsRunning(false);
    };

    const clearRun = () => {
        setCurrentRun(null);
        setIsRunning(false);
    };

    return (
        <PipelineContext.Provider value={{
            currentRun,
            isRunning,
            startRun,
            completeRun,
            clearRun
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
