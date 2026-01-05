import { useState } from 'react';
import type { PlasticType } from '../services/geminiBridge';

interface ControlPanelProps {
    salinity: number;
    plasticType: PlasticType;
    stressSignal: boolean;
    isLiveMode: boolean;
    onSalinityChange: (value: number) => void;
    onPlasticTypeChange: (value: PlasticType) => void;
    onStressSignalChange: (value: boolean) => void;
    onResetLocation: () => void;
}

const PLASTIC_TYPES: { value: PlasticType; label: string; icon: string }[] = [
    { value: 'PET', label: 'PET (Bottles)', icon: '🍶' },
    { value: 'HDPE', label: 'HDPE (Pipes)', icon: '🔧' },
    { value: 'PVC', label: 'PVC (Cables)', icon: '🔌' },
    { value: 'LDPE', label: 'LDPE (Bags)', icon: '🛍️' },
    { value: 'PP', label: 'PP (Containers)', icon: '📦' },
    { value: 'PS', label: 'PS (Foam)', icon: '🧊' },
];

export default function ControlPanel({
    salinity,
    plasticType,
    stressSignal,
    isLiveMode,
    onSalinityChange,
    onPlasticTypeChange,
    onStressSignalChange,
    onResetLocation,
}: ControlPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    // Determine salinity category for visual feedback
    const salinityCategory = salinity > 35 ? 'high' : salinity > 20 ? 'medium' : 'low';
    const salinityColor = {
        high: 'text-cyan-400',
        medium: 'text-blue-400',
        low: 'text-green-400',
    }[salinityCategory];

    return (
        <div className="absolute top-4 right-4 z-20">
            {/* Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="glass rounded-lg px-3 py-2 mb-2 text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2"
            >
                <span>⚙️</span>
                <span>{isExpanded ? 'Hide Controls' : 'Show Controls'}</span>
            </button>

            {/* Control Panel */}
            {isExpanded && (
                <div className="glass rounded-xl p-4 w-72 space-y-4 animate-slideIn">
                    {/* API Status */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <span className="text-xs text-gray-400 uppercase tracking-wider">Mode</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${isLiveMode
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-purple-500/20 text-purple-400'
                            }`}>
                            {isLiveMode ? '🔑 LIVE API' : '🧪 SIMULATION'}
                        </span>
                    </div>

                    {/* Salinity Slider */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-300">Salinity</label>
                            <span className={`text-sm font-mono font-bold ${salinityColor}`}>
                                {salinity.toFixed(1)} ppt
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="50"
                            step="0.5"
                            value={salinity}
                            onChange={(e) => onSalinityChange(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Fresh (0)</span>
                            <span className="text-cyan-500">Ocean (35+)</span>
                            <span>Hypersaline (50)</span>
                        </div>
                        {salinity > 35 && (
                            <div className="text-xs text-cyan-400 flex items-center gap-1">
                                <span>🧬</span>
                                <span>Halophilic chassis required (Lee et al. 2025)</span>
                            </div>
                        )}
                    </div>

                    {/* Plastic Type Selector */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-300">Plastic Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {PLASTIC_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => onPlasticTypeChange(type.value)}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${plasticType === type.value
                                            ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                                            : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                                        }`}
                                >
                                    <span className="mr-1">{type.icon}</span>
                                    {type.value}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stress Signal Toggle */}
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <label className="text-sm text-gray-300">Environmental Stress</label>
                            <p className="text-xs text-gray-500">Hostile conditions detected</p>
                        </div>
                        <button
                            onClick={() => onStressSignalChange(!stressSignal)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${stressSignal ? 'bg-red-500' : 'bg-gray-600'
                                }`}
                        >
                            <span
                                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${stressSignal ? 'translate-x-7' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                    {stressSignal && (
                        <div className="text-xs text-orange-400 flex items-center gap-1 -mt-2">
                            <span>⚠️</span>
                            <span>Thermophilic chassis recommended for stress conditions</span>
                        </div>
                    )}

                    {/* Reset Location Button */}
                    <button
                        onClick={onResetLocation}
                        className="w-full py-2 px-4 rounded-lg bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                        <span>📍</span>
                        <span>Reset to Pacific Garbage Patch</span>
                    </button>
                </div>
            )}
        </div>
    );
}
