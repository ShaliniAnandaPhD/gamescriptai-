import React, { useState } from 'react';
import { getApiBaseUrl } from '../lib/utils';

interface AnalysisResult {
    success: boolean;
    analysis: any;
    latency_ms: number;
    model: string;
    analysis_type: string;
}

const MultimodalAnalyzer: React.FC = () => {
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [type, setType] = useState<'scoreboard' | 'play' | 'stats' | 'crowd'>('scoreboard');

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const runAnalysis = async () => {
        if (!image) return;
        setLoading(true);
        try {
            const baseUrl = getApiBaseUrl();
            const res = await fetch(`${baseUrl}/api/multimodal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: image, analysisType: type }),
            });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            console.error('Analysis failed:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm mt-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="p-1.5 bg-blue-500/20 rounded text-blue-400">🖼️</span>
                    Multimodal Game Analyzer
                </h3>
                <span className="text-[10px] font-mono text-gray-500 bg-black/30 px-2 py-1 rounded">GEMINI 2.0 FLASH</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div
                        className="aspect-video bg-black/40 border-2 border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer"
                        onClick={() => document.getElementById('image-upload')?.click()}
                    >
                        {image ? (
                            <img src={image} className="w-full h-full object-cover" alt="Upload" />
                        ) : (
                            <div className="text-center space-y-2">
                                <div className="text-3xl text-gray-600 group-hover:text-blue-400 transition-colors">📤</div>
                                <div className="text-xs text-gray-500 font-mono">UPLOAD GAME IMAGE</div>
                            </div>
                        )}
                        <input id="image-upload" type="file" hidden accept="image/*" onChange={handleImageUpload} />
                    </div>

                    <div className="flex gap-2">
                        {(['scoreboard', 'play', 'stats', 'crowd'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={`flex-1 py-2 rounded-lg text-[10px] font-mono border transition-all ${type === t
                                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                    : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10'
                                    }`}
                            >
                                {t.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={runAnalysis}
                        disabled={!image || loading}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${!image || loading
                            ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                            }`}
                    >
                        {loading ? 'ANALYZING...' : 'RUN GEMINI ANALYSIS'}
                    </button>
                </div>

                <div className="bg-black/40 rounded-xl p-4 border border-white/5 font-mono overflow-auto min-h-[200px]">
                    <div className="text-[10px] text-gray-500 mb-2 font-bold bg-white/5 -m-4 p-2 px-4 border-b border-white/5 flex items-center justify-between">
                        <span>ANALYSIS_OUTPUT.JSON</span>
                        {result && <span className="text-blue-400">{result.latency_ms}ms</span>}
                    </div>
                    {result ? (
                        <pre className="text-xs text-blue-200/80 leading-relaxed whitespace-pre-wrap mt-2">
                            {JSON.stringify(result.analysis, null, 2)}
                        </pre>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-700 text-xs text-center px-8">
                            Upload an image and select analysis type to see Gemini output
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MultimodalAnalyzer;
