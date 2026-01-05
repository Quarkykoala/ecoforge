import { useRef, useEffect, useState, useCallback } from 'react';
import { geminiBridge, type WaterAnalysis, type PlasticType, type CommitteeBioAgentResponse } from '../services/geminiBridge';
import PhysarumCanvas from './PhysarumCanvas';
import ControlPanel from './ControlPanel';
import DeploymentHistory from './DeploymentHistory';

// Great Pacific Garbage Patch coordinates
const DEFAULT_LOCATION = {
    lat: 32.0,
    lng: -145.0,
};

interface OceanMapProps {
    apiKey?: string;
}

export default function OceanMap({ apiKey }: OceanMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);

    // Deployment state
    const [isDeploying, setIsDeploying] = useState(false);
    const [deploymentResult, setDeploymentResult] = useState<CommitteeBioAgentResponse | null>(null);
    const [showMonologue, setShowMonologue] = useState(false);
    const [deploymentHistory, setDeploymentHistory] = useState<CommitteeBioAgentResponse[]>([]);
    const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);

    // Interactive controls state
    const [location, setLocation] = useState(DEFAULT_LOCATION);
    const [salinity, setSalinity] = useState(35.5);
    const [plasticType, setPlasticType] = useState<PlasticType>('PET');
    const [stressSignal, setStressSignal] = useState(true);

    // Load Google Maps 3D
    useEffect(() => {
        if (!apiKey) return;

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=alpha&libraries=maps3d`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            if (mapContainerRef.current) {
                // Create 3D Map element
                const map3d = document.createElement('gmp-map-3d');
                map3d.setAttribute('center', `${location.lat},${location.lng}`);
                map3d.setAttribute('altitude', '500000');
                map3d.setAttribute('tilt', '45');
                map3d.setAttribute('heading', '0');
                map3d.setAttribute('range', '2000000');
                map3d.style.width = '100%';
                map3d.style.height = '100%';

                mapContainerRef.current.appendChild(map3d);
            }
        };

        document.head.appendChild(script);

        return () => {
            script.remove();
        };
    }, [apiKey, location.lat, location.lng]);

    // Handle map click for location selection
    const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (apiKey) return; // Let Google Maps handle clicks when available

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert click position to approximate lat/lng
        // Center is at DEFAULT_LOCATION, with a rough scale
        const lngRange = 100; // ~100 degrees visible width
        const latRange = 60;  // ~60 degrees visible height

        const newLng = DEFAULT_LOCATION.lng + (x / rect.width - 0.5) * lngRange;
        const newLat = DEFAULT_LOCATION.lat - (y / rect.height - 0.5) * latRange;

        setLocation({
            lat: Math.max(-60, Math.min(60, newLat)),
            lng: Math.max(-180, Math.min(180, newLng)),
        });
    }, [apiKey]);

    // Handle Deploy button click
    const handleDeploy = useCallback(async () => {
        setIsDeploying(true);
        setDeploymentResult(null);
        setSelectedHistoryIndex(null);

        // Create water analysis from current controls
        const analysis: WaterAnalysis = {
            lat: location.lat,
            lng: location.lng,
            salinity: salinity,
            plastic_type: plasticType,
            stress_signal_bool: stressSignal,
        };

        console.log('🌊 POLYMER-X: Initiating deployment...');
        console.log('📊 Water Analysis:', analysis);
        console.log('🔧 Mode:', geminiBridge.isLiveMode ? 'LIVE API' : 'SIMULATION');

        try {
            const result = await geminiBridge.runCommitteeDebate(analysis);
            setDeploymentResult(result);

            // Add to history
            setDeploymentHistory(prev => [result, ...prev].slice(0, 10)); // Keep last 10

            // Log the full result
            console.log('');
            console.log('═'.repeat(70));
            console.log(`🧠 COMMITTEE DEBATE COMPLETE (${result.mode} MODE)`);
            console.log('═'.repeat(70));

            result.internal_monologue.forEach((entry) => {
                const emoji = { ARCHITECT: '🏗️', SAFETY_OFFICER: '🛡️', SIMULATOR: '🔬' }[entry.agent];
                console.log('');
                console.log(`${emoji} [${entry.agent}]`);
                console.log(`   💭 ${entry.thought}`);
                if (entry.decision) {
                    console.log(`   ${entry.rejected ? '❌' : '✅'} ${entry.decision}`);
                }
                if (entry.retry_reason) {
                    console.log(`   🔄 ${entry.retry_reason}`);
                }
            });

            console.log('');
            console.log('═'.repeat(70));
            console.log('✅ ENZYME DESIGN OUTPUT:');
            console.log(JSON.stringify(result.data, null, 2));
            console.log('═'.repeat(70));

        } catch (error) {
            console.error('❌ Deployment failed:', error);
        } finally {
            setIsDeploying(false);
        }
    }, [location, salinity, plasticType, stressSignal]);

    // Handle selecting a deployment from history
    const handleSelectDeployment = useCallback((deployment: CommitteeBioAgentResponse) => {
        const index = deploymentHistory.indexOf(deployment);
        setSelectedHistoryIndex(index);
        setDeploymentResult(deployment);
    }, [deploymentHistory]);

    // Handle reset location
    const handleResetLocation = useCallback(() => {
        setLocation(DEFAULT_LOCATION);
    }, []);

    return (
        <div className="relative w-full h-full">
            {/* Google Maps 3D Container - or fallback ocean gradient */}
            <div
                ref={mapContainerRef}
                className="absolute inset-0 cursor-crosshair"
                onClick={handleMapClick}
                style={{
                    background: apiKey
                        ? '#0a0a1a'
                        : 'linear-gradient(180deg, #0a1628 0%, #0d2847 30%, #0a3d62 60%, #0b4f6c 100%)',
                }}
            >
                {!apiKey && (
                    <>
                        {/* Ocean background pattern */}
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute inset-0" style={{
                                backgroundImage: `radial-gradient(circle at 30% 40%, rgba(0, 212, 255, 0.15) 0%, transparent 50%),
                                                  radial-gradient(circle at 70% 60%, rgba(0, 102, 255, 0.1) 0%, transparent 40%)`,
                            }} />
                        </div>

                        {/* Click instruction */}
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center">
                            <div className="glass rounded-lg px-4 py-2 text-xs text-gray-400">
                                Click anywhere to set deployment location
                            </div>
                        </div>

                        {/* Location marker */}
                        <div
                            className="absolute w-8 h-8 -ml-4 -mt-4 pointer-events-none"
                            style={{
                                left: `${50 + (location.lng - DEFAULT_LOCATION.lng) / 100 * 100}%`,
                                top: `${50 - (location.lat - DEFAULT_LOCATION.lat) / 60 * 100}%`,
                            }}
                        >
                            <div className="w-full h-full relative">
                                <div className="absolute inset-0 bg-cyan-500/30 rounded-full animate-ping" />
                                <div className="absolute inset-2 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50" />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Physarum Slime Mold Overlay */}
            <PhysarumCanvas
                isActive={!!deploymentResult?.success}
                safetyLockEnabled={deploymentResult?.data?.safety_lock_type === 'Quorum_Sensing_Type_B'}
                centerX={typeof window !== 'undefined' ? window.innerWidth / 2 : 500}
                centerY={typeof window !== 'undefined' ? window.innerHeight / 2 : 400}
            />

            {/* Control Panel */}
            <ControlPanel
                salinity={salinity}
                plasticType={plasticType}
                stressSignal={stressSignal}
                isLiveMode={geminiBridge.isLiveMode}
                onSalinityChange={setSalinity}
                onPlasticTypeChange={setPlasticType}
                onStressSignalChange={setStressSignal}
                onResetLocation={handleResetLocation}
            />

            {/* Deployment History */}
            <DeploymentHistory
                deployments={deploymentHistory}
                onSelectDeployment={handleSelectDeployment}
                selectedIndex={selectedHistoryIndex}
            />

            {/* Deploy Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <button
                    onClick={handleDeploy}
                    disabled={isDeploying}
                    className={`
            pointer-events-auto
            px-8 py-4 rounded-xl
            font-bold text-lg uppercase tracking-wider
            transition-all duration-300
            ${isDeploying
                            ? 'bg-gray-700 text-gray-400 cursor-wait'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 pulse-glow cursor-pointer'
                        }
          `}
                >
                    {isDeploying ? (
                        <span className="flex items-center gap-3">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            {geminiBridge.isLiveMode ? 'Consulting Gemini...' : 'Committee Debating...'}
                        </span>
                    ) : (
                        '🧬 DEPLOY POLYMER-X'
                    )}
                </button>
            </div>

            {/* Result Panel */}
            {deploymentResult && (
                <div className="absolute bottom-4 right-4 md:w-96 z-10">
                    <div className="glass rounded-xl p-4 shadow-2xl animate-slideIn">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-cyan-400 font-bold flex items-center gap-2">
                                {deploymentResult.success ? '✅' : '❌'}
                                {deploymentResult.success ? 'Deployment Ready' : 'Deployment Failed'}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded ${deploymentResult.mode === 'LIVE'
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-purple-500/20 text-purple-400'
                                    }`}>
                                    {deploymentResult.mode}
                                </span>
                                <button
                                    onClick={() => setShowMonologue(!showMonologue)}
                                    className="text-xs text-gray-400 hover:text-white transition-colors"
                                >
                                    {showMonologue ? 'Hide' : 'Show'} Debate
                                </button>
                            </div>
                        </div>

                        {deploymentResult.data && (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Enzyme:</span>
                                    <span className="text-white font-mono">{deploymentResult.data.enzyme_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Efficiency:</span>
                                    <span className={`font-bold ${deploymentResult.data.predicted_efficiency_score >= 0.8 ? 'text-green-400' :
                                        deploymentResult.data.predicted_efficiency_score >= 0.6 ? 'text-yellow-400' : 'text-red-400'
                                        }`}>
                                        {(deploymentResult.data.predicted_efficiency_score * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Safety Lock:</span>
                                    <span className={`${deploymentResult.data.safety_lock_type === 'Quorum_Sensing_Type_B'
                                        ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {deploymentResult.data.safety_lock_type === 'Quorum_Sensing_Type_B' ? '🔒 Active' : '⚠️ Missing'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Chassis:</span>
                                    <span className="text-purple-400">{deploymentResult.data.chassis_type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Location:</span>
                                    <span className="text-gray-300 font-mono text-xs">
                                        {location.lat.toFixed(2)}°, {location.lng.toFixed(2)}°
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Internal Monologue (expandable) */}
                        {showMonologue && deploymentResult.internal_monologue && (
                            <div className="mt-4 pt-4 border-t border-gray-700 max-h-48 overflow-y-auto text-xs">
                                {deploymentResult.internal_monologue.map((entry, i) => (
                                    <div key={i} className="mb-2 opacity-80">
                                        <span className={`
                      ${entry.agent === 'ARCHITECT' ? 'text-cyan-400' : ''}
                      ${entry.agent === 'SAFETY_OFFICER' ? 'text-yellow-400' : ''}
                      ${entry.agent === 'SIMULATOR' ? 'text-purple-400' : ''}
                    `}>
                                            {entry.agent === 'ARCHITECT' && '🏗️'}
                                            {entry.agent === 'SAFETY_OFFICER' && '🛡️'}
                                            {entry.agent === 'SIMULATOR' && '🔬'}
                                            {' '}{entry.agent}
                                        </span>
                                        <div className="text-gray-400 ml-5">{entry.decision}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Location Badge */}
            <div className="absolute top-4 left-4 glass rounded-lg px-4 py-2 z-10">
                <div className="text-xs text-gray-400">TARGET ZONE</div>
                <div className="text-cyan-400 font-mono text-sm">
                    {location.lat === DEFAULT_LOCATION.lat && location.lng === DEFAULT_LOCATION.lng
                        ? 'Great Pacific Garbage Patch'
                        : 'Custom Location'}
                </div>
                <div className="text-xs text-gray-500">
                    {location.lat.toFixed(2)}°{location.lat >= 0 ? 'N' : 'S'}, {Math.abs(location.lng).toFixed(2)}°{location.lng >= 0 ? 'E' : 'W'}
                </div>
            </div>

            {/* Version Badge */}
            <div className="fixed bottom-4 right-4 glass rounded-lg px-3 py-1.5 text-xs text-gray-400 z-10">
                POLYMER-X v0.3 • {geminiBridge.isLiveMode ? '🔑 Live' : '🧪 Sim'} Mode
            </div>
        </div>
    );
}
