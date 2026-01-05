import type { CommitteeBioAgentResponse } from '../services/geminiBridge';

interface DeploymentHistoryProps {
    deployments: CommitteeBioAgentResponse[];
    onSelectDeployment: (deployment: CommitteeBioAgentResponse) => void;
    selectedIndex: number | null;
}

export default function DeploymentHistory({
    deployments,
    onSelectDeployment,
    selectedIndex,
}: DeploymentHistoryProps) {
    if (deployments.length === 0) {
        return null;
    }

    return (
        <div className="absolute bottom-4 left-4 z-20 max-w-xs">
            <div className="glass rounded-xl p-3">
                <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span>📜</span>
                    <span>Deployment History ({deployments.length})</span>
                </h3>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {deployments.map((deployment, index) => {
                        const isSelected = selectedIndex === index;
                        const efficiency = deployment.data?.predicted_efficiency_score ?? 0;
                        const efficiencyColor = efficiency >= 0.8
                            ? 'bg-green-500'
                            : efficiency >= 0.6
                                ? 'bg-yellow-500'
                                : 'bg-red-500';

                        return (
                            <button
                                key={index}
                                onClick={() => onSelectDeployment(deployment)}
                                className={`w-full p-2 rounded-lg text-left transition-all ${isSelected
                                        ? 'bg-cyan-500/20 border border-cyan-500/50'
                                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-white font-mono truncate max-w-[140px]">
                                        {deployment.data?.enzyme_name ?? 'Failed'}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <div className={`w-2 h-2 rounded-full ${efficiencyColor}`} />
                                        <span className="text-xs text-gray-400">
                                            {(efficiency * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${deployment.mode === 'LIVE'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-purple-500/20 text-purple-400'
                                        }`}>
                                        {deployment.mode}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {deployment.data?.chassis_type}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
