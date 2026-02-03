import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Episode {
    id: number;
    title: string;
    timestamp: any;
    [key: string]: any;
}

interface EpisodeDropdownProps {
    episodes: Episode[];
    currentId: number;
    onSelect: (id: number) => void;
}

const EpisodeDropdown = ({ episodes, currentId, onSelect }: EpisodeDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);

    // Safe handling for empty episodes array
    if (!episodes || episodes.length === 0) {
        return <div className="text-gray-500 font-mono text-xs">Loading episodes...</div>;
    }

    // Find the currently selected episode object with fallback
    const currentEpisode = episodes.find(ep => (ep.episode_num || ep.id) === currentId) || episodes[0];

    // Extra safety in case find fails and episodes[0] is somehow invalid
    if (!currentEpisode) return null;

    // Safe timestamp formatting
    const formatDate = (ts: any) => {
        if (!ts) return '';
        if (typeof ts === 'string') return new Date(ts).toLocaleDateString();
        // Handle Firebase Timestamp (seconds/nanoseconds) or Date object
        if (ts.toDate) return ts.toDate().toLocaleDateString();
        // Handle JS Date
        if (ts instanceof Date) return ts.toLocaleDateString();
        return '';
    };

    return (
        <div className="relative w-full max-w-md mb-6 z-50">

            {/* 1. THE TRIGGER BUTTON (Instead of a Link) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-gray-900 border border-gray-700 
                   text-white px-4 py-3 rounded-lg hover:border-gray-500 transition-colors"
            >
                <div className="flex flex-col items-start overflow-hidden">
                    <span className="font-mono text-xs text-gray-500 mb-1 uppercase tracking-wider">
                        Current Episode
                    </span>
                    <span className="font-medium text-sm text-white truncate w-full flex items-center gap-2">
                        {currentEpisode ? (
                            <>
                                <span className="text-emerald-400 font-mono">#{currentEpisode.episode_num || currentEpisode.id}</span>
                                <span className="truncate">{currentEpisode.topic || currentEpisode.title}</span>
                            </>
                        ) : 'Select Episode...'}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* 2. THE DROPDOWN MENU */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 
                        rounded-xl shadow-2xl max-h-80 overflow-y-auto custom-scrollbar z-50">
                    {episodes.slice().reverse().map((ep) => {
                        const epId = ep.episode_num || ep.id;
                        const isSelected = epId === currentId;

                        return (
                            <div
                                key={epId}
                                onClick={() => {
                                    onSelect(epId); // Update Parent State
                                    setIsOpen(false); // Close Menu
                                }}
                                className={`px-4 py-3 cursor-pointer flex items-center justify-between group border-b border-gray-800 last:border-0 transition-colors ${isSelected ? 'bg-gray-800/50' : 'hover:bg-gray-800'
                                    }`}
                            >
                                <div className="flex flex-col overflow-hidden mr-3">
                                    <span className={`font-mono text-[10px] mb-1 uppercase tracking-wider ${isSelected ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-400'
                                        }`}>
                                        Episode {epId} • {formatDate(ep.timestamp)}
                                    </span>
                                    <span className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'
                                        }`}>
                                        {ep.topic || ep.title}
                                    </span>
                                </div>

                                {/* Active Indicator */}
                                {isSelected && <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default EpisodeDropdown;
