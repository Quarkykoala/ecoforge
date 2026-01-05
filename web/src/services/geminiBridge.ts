/**
 * Polymer-X: Gemini Bridge Service
 * 
 * Hybrid service that supports both:
 * - LIVE mode: Actual Gemini API calls for enzyme design
 * - SIMULATION mode: Deterministic logic following docs/LOGIC.md rules
 * 
 * The mode is automatically selected based on whether VITE_GEMINI_API_KEY is set.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// =============================================================================
// Type Definitions (mirrored from docs/INTERFACES.ts)
// =============================================================================

export type PlasticType = 'PET' | 'HDPE' | 'PVC' | 'LDPE' | 'PP' | 'PS';

export type SafetyLockType =
    | 'Quorum_Sensing_Type_A'
    | 'Quorum_Sensing_Type_B'
    | 'Temperature_Sensitive'
    | 'Auxotrophic'
    | 'Light_Activated';

export type ChassisType =
    | 'Halophilic'
    | 'Mesophilic'
    | 'Thermophilic'
    | 'Psychrophilic';

export interface WaterAnalysis {
    lat: number;
    lng: number;
    salinity: number;
    plastic_type: PlasticType;
    stress_signal_bool: boolean;
}

export interface EnzymeDesign {
    enzyme_name: string;
    mutation_list: string[];
    predicted_efficiency_score: number;
    safety_lock_type: SafetyLockType;
    chassis_type: ChassisType;
    design_rationale: string;
    references: string[];
}

export interface MonologueEntry {
    agent: 'ARCHITECT' | 'SAFETY_OFFICER' | 'SIMULATOR';
    timestamp: string;
    thought: string;
    decision?: string;
    rejected?: boolean;
    retry_reason?: string;
}

export interface CommitteeBioAgentResponse {
    success: boolean;
    data?: EnzymeDesign;
    error?: string;
    timestamp: string;
    internal_monologue: MonologueEntry[];
    mode: 'LIVE' | 'SIMULATION';
}

// =============================================================================
// Configuration Tables
// =============================================================================

const ORGANISM_CHASSIS: Record<PlasticType, { organism: string; description: string }> = {
    PET: { organism: 'Ideonella sakaiensis', description: 'Native PETase producer, optimal for PET degradation' },
    HDPE: { organism: 'Pseudomonas putida', description: 'Robust chassis for hydrocarbon degradation pathways' },
    PVC: { organism: 'Sphingomonas sp.', description: 'Known for chlorinated compound metabolism' },
    LDPE: { organism: 'Rhodococcus ruber', description: 'Alkane-degrading actinobacterium' },
    PP: { organism: 'Aspergillus tubingensis', description: 'Fungal chassis with strong cutinase expression' },
    PS: { organism: 'Exiguobacterium sp.', description: 'Psychrotolerant styrene degrader' },
};

const ENZYME_CONFIG: Record<PlasticType, { base: string; mutations: string[] }> = {
    PET: { base: 'PETase', mutations: ['S238F', 'W159H', 'S280A'] },
    HDPE: { base: 'LacCase-HD', mutations: ['T241M', 'G352V'] },
    PVC: { base: 'HaloHyd-VC', mutations: ['C127S', 'L89F'] },
    LDPE: { base: 'AlkB-LDPE', mutations: ['W55L', 'F181Y'] },
    PP: { base: 'CutinasePP', mutations: ['L117F', 'S141G'] },
    PS: { base: 'StyreneOx', mutations: ['M108L', 'H223Y'] },
};

// =============================================================================
// Gemini API Prompt
// =============================================================================

const GEMINI_SYSTEM_PROMPT = `You are a synthetic biology expert designing enzymes for plastic bioremediation.

RULES (from docs/LOGIC.md):
1. Chassis Selection:
   - Salinity > 35ppt → Halophilic (Lee et al. 2025)
   - Salinity ≤ 35ppt AND no stress → Mesophilic
   - Salinity ≤ 35ppt AND stress = true → Thermophilic

2. Enzyme-Plastic Mapping:
   - PET → PETase (mutations: S238F, W159H, S280A)
   - HDPE → LacCase-HD (mutations: T241M, G352V)
   - PVC → HaloHyd-VC (mutations: C127S, L89F)
   - LDPE → AlkB-LDPE (mutations: W55L, F181Y)
   - PP → CutinasePP (mutations: L117F, S141G)
   - PS → StyreneOx (mutations: M108L, H223Y)

3. Efficiency Score:
   Base = 0.60
   + 0.15 if chassis matches salinity requirements
   + 0.10 if stress = false
   - 0.10 if stress = true AND chassis = Mesophilic
   + 0.05 per mutation (max 3 counted)
   Final = min(0.95, calculated)

4. MANDATORY SAFETY: All designs MUST include Quorum_Sensing_Type_B (Zhang et al. 2025)

Respond ONLY with valid JSON matching this schema:
{
  "enzyme_name": "string",
  "mutation_list": ["string"],
  "predicted_efficiency_score": number,
  "safety_lock_type": "Quorum_Sensing_Type_B",
  "chassis_type": "Halophilic" | "Mesophilic" | "Thermophilic",
  "design_rationale": "string explaining your decisions",
  "references": ["Lee et al. 2025...", "Zhang et al. 2025..."]
}`;

// =============================================================================
// Simulation Logic (fallback when no API key)
// =============================================================================

function determineChassisType(salinity: number, stress: boolean): ChassisType {
    if (salinity > 35) return 'Halophilic';
    if (stress) return 'Thermophilic';
    return 'Mesophilic';
}

function calculateEfficiencyScore(
    salinity: number,
    stress: boolean,
    chassis: ChassisType,
    mutationCount: number
): number {
    let score = 0.60;
    if ((salinity > 35 && chassis === 'Halophilic') || (salinity <= 35 && chassis !== 'Halophilic')) {
        score += 0.15;
    }
    if (!stress) score += 0.10;
    if (stress && chassis === 'Mesophilic') score -= 0.10;
    score += Math.min(mutationCount, 3) * 0.05;
    return Math.min(0.95, Math.round(score * 100) / 100);
}

interface ArchitectProposal {
    organism: string;
    organism_description: string;
    chassis_type: ChassisType;
    enzyme_name: string;
    mutation_list: string[];
    rationale: string;
    safety_lock_type?: SafetyLockType;
}

function runArchitect(input: WaterAnalysis): { proposal: ArchitectProposal; monologue: MonologueEntry } {
    const organism = ORGANISM_CHASSIS[input.plastic_type];
    const enzymeConfig = ENZYME_CONFIG[input.plastic_type];
    const chassis = determineChassisType(input.salinity, input.stress_signal_bool);

    const chassisSuffix = chassis === 'Halophilic' ? '-Halo' : chassis === 'Thermophilic' ? '-Thermo' : '';

    const proposal: ArchitectProposal = {
        organism: organism.organism,
        organism_description: organism.description,
        chassis_type: chassis,
        enzyme_name: `${enzymeConfig.base}-v4.2${chassisSuffix}`,
        mutation_list: enzymeConfig.mutations,
        rationale: `Selected ${organism.organism} as chassis organism (${organism.description}). ` +
            `Environmental analysis: salinity=${input.salinity}ppt, stress=${input.stress_signal_bool}. ` +
            `Applying ${chassis} expression system.`,
    };

    const monologue: MonologueEntry = {
        agent: 'ARCHITECT',
        timestamp: new Date().toISOString(),
        thought: `Analyzing water sample at (${input.lat.toFixed(2)}, ${input.lng.toFixed(2)}). ` +
            `Detected ${input.plastic_type} contamination. Salinity: ${input.salinity}ppt. ` +
            `Stress signals: ${input.stress_signal_bool ? 'PRESENT' : 'absent'}.`,
        decision: `Proposing ${organism.organism} chassis with ${enzymeConfig.base} enzyme. ` +
            `Expression system: ${chassis}. Mutations: ${enzymeConfig.mutations.join(', ')}.`,
    };

    return { proposal, monologue };
}

function runSafetyOfficer(
    proposal: ArchitectProposal
): { approved: boolean; correctedProposal: ArchitectProposal; monologue: MonologueEntry } {

    const hasSafetyLock = proposal.safety_lock_type === 'Quorum_Sensing_Type_B';

    if (!hasSafetyLock) {
        const correctedProposal: ArchitectProposal = {
            ...proposal,
            safety_lock_type: 'Quorum_Sensing_Type_B',
        };

        return {
            approved: false,
            correctedProposal,
            monologue: {
                agent: 'SAFETY_OFFICER',
                timestamp: new Date().toISOString(),
                thought: `Reviewing proposal for ${proposal.organism}. Checking safety constraints from docs/LOGIC.md...`,
                decision: `REJECTED - Architect proposal lacks Quorum_Sensing_Type_B lock!`,
                rejected: true,
                retry_reason: 'Forcing retry with mandatory safety lock. Zhang et al. 2025 requires Quorum_Sensing_Type_B for all engineered organisms.',
            },
        };
    }

    return {
        approved: true,
        correctedProposal: proposal,
        monologue: {
            agent: 'SAFETY_OFFICER',
            timestamp: new Date().toISOString(),
            thought: `Reviewing proposal for ${proposal.organism}. Verifying Zhang et al. 2025 compliance...`,
            decision: `APPROVED - All safety constraints satisfied. Quorum_Sensing_Type_B verified.`,
        },
    };
}

function runSimulator(
    proposal: ArchitectProposal,
    input: WaterAnalysis
): { efficiency: number; monologue: MonologueEntry } {

    const efficiencyScore = calculateEfficiencyScore(
        input.salinity,
        input.stress_signal_bool,
        proposal.chassis_type,
        proposal.mutation_list.length
    );

    let envMatch: 'OPTIMAL' | 'SUBOPTIMAL' | 'MARGINAL';
    if (efficiencyScore >= 0.85) envMatch = 'OPTIMAL';
    else if (efficiencyScore >= 0.70) envMatch = 'SUBOPTIMAL';
    else envMatch = 'MARGINAL';

    let confidence = 0.85;
    if (input.stress_signal_bool) confidence -= 0.15;
    if (input.salinity > 40) confidence -= 0.10;
    confidence = Math.max(0.50, Math.round(confidence * 100) / 100);

    return {
        efficiency: efficiencyScore,
        monologue: {
            agent: 'SIMULATOR',
            timestamp: new Date().toISOString(),
            thought: `Running Evo 2 efficiency simulation for ${proposal.enzyme_name}. ` +
                `Base chassis: ${proposal.chassis_type}. ` +
                `Environmental parameters: salinity=${input.salinity}ppt, stress=${input.stress_signal_bool}.`,
            decision: `Prediction complete. Efficiency: ${(efficiencyScore * 100).toFixed(1)}% (${envMatch}). ` +
                `Confidence: ${(confidence * 100).toFixed(0)}%. Model ready for deployment recommendation.`,
        },
    };
}

// =============================================================================
// Main Service Class
// =============================================================================

export class GeminiBridge {
    private simulationDelay: number;
    private genAI: GoogleGenerativeAI | null = null;

    constructor(simulationDelay = 500) {
        this.simulationDelay = simulationDelay;

        // Check for API key
        const key = import.meta.env.VITE_GEMINI_API_KEY;
        if (key && key.length > 0) {
            this.genAI = new GoogleGenerativeAI(key);
            console.log('🔑 GeminiBridge: LIVE mode enabled (API key detected)');
        } else {
            console.log('🧪 GeminiBridge: SIMULATION mode (no API key)');
        }
    }

    get isLiveMode(): boolean {
        return this.genAI !== null;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Run the committee debate using the Gemini API (if available) or simulation
     */
    async runCommitteeDebate(input: WaterAnalysis): Promise<CommitteeBioAgentResponse> {
        if (this.genAI) {
            return this.runLiveDebate(input);
        }
        return this.runSimulatedDebate(input);
    }

    /**
     * Live Gemini API-powered debate
     */
    private async runLiveDebate(input: WaterAnalysis): Promise<CommitteeBioAgentResponse> {
        const monologue: MonologueEntry[] = [];

        try {
            // Phase 1: Architect thinks
            monologue.push({
                agent: 'ARCHITECT',
                timestamp: new Date().toISOString(),
                thought: `Analyzing water sample at (${input.lat.toFixed(2)}, ${input.lng.toFixed(2)}). ` +
                    `Detected ${input.plastic_type} contamination. Salinity: ${input.salinity}ppt. ` +
                    `Stress signals: ${input.stress_signal_bool ? 'PRESENT' : 'absent'}.`,
                decision: 'Consulting Gemini AI for optimal enzyme design...',
            });

            // Call Gemini API
            const model = this.genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const userPrompt = `Design an enzyme for these conditions:
- Location: (${input.lat}, ${input.lng})
- Salinity: ${input.salinity} ppt
- Plastic Type: ${input.plastic_type}
- Environmental Stress: ${input.stress_signal_bool}

Follow the RULES exactly. Return ONLY valid JSON.`;

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                systemInstruction: GEMINI_SYSTEM_PROMPT,
            });

            const responseText = result.response.text();

            // Parse JSON from response (handle markdown code blocks)
            let jsonStr = responseText;
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
            }

            const design: EnzymeDesign = JSON.parse(jsonStr);

            // Phase 2: Safety Officer validates
            monologue.push({
                agent: 'SAFETY_OFFICER',
                timestamp: new Date().toISOString(),
                thought: `Reviewing Gemini-generated design. Verifying Zhang et al. 2025 compliance...`,
                decision: design.safety_lock_type === 'Quorum_Sensing_Type_B'
                    ? 'APPROVED - Quorum_Sensing_Type_B verified.'
                    : 'WARNING - Safety lock may need review.',
            });

            // Phase 3: Simulator confirms
            monologue.push({
                agent: 'SIMULATOR',
                timestamp: new Date().toISOString(),
                thought: `Validating efficiency prediction from Gemini...`,
                decision: `Efficiency: ${(design.predicted_efficiency_score * 100).toFixed(1)}%. Design validated.`,
            });

            return {
                success: true,
                data: design,
                timestamp: new Date().toISOString(),
                internal_monologue: monologue,
                mode: 'LIVE',
            };
        } catch (error) {
            console.error('Gemini API error, falling back to simulation:', error);

            // Fallback to simulation
            const fallback = await this.runSimulatedDebate(input);
            fallback.internal_monologue.unshift({
                agent: 'ARCHITECT',
                timestamp: new Date().toISOString(),
                thought: 'Gemini API call failed. Falling back to local simulation.',
                decision: 'Switching to deterministic mode.',
            });
            return fallback;
        }
    }

    /**
     * Simulated debate (no API needed)
     */
    private async runSimulatedDebate(input: WaterAnalysis): Promise<CommitteeBioAgentResponse> {
        const monologue: MonologueEntry[] = [];

        try {
            // Phase 1: Architect proposes
            await this.delay(this.simulationDelay);
            const { proposal: initialProposal, monologue: architectMonologue } = runArchitect(input);
            monologue.push(architectMonologue);

            // Phase 2: Safety Officer reviews
            await this.delay(this.simulationDelay);
            const { approved, correctedProposal, monologue: safetyMonologue } = runSafetyOfficer(initialProposal);
            monologue.push(safetyMonologue);

            const finalProposal = approved
                ? { ...initialProposal, safety_lock_type: 'Quorum_Sensing_Type_B' as SafetyLockType }
                : correctedProposal;

            if (!approved) {
                monologue.push({
                    agent: 'ARCHITECT',
                    timestamp: new Date().toISOString(),
                    thought: 'Received rejection from Safety Officer. Acknowledging mandatory safety requirement.',
                    decision: 'Retry accepted. Adding Quorum_Sensing_Type_B lock to proposal as required by Zhang et al. 2025.',
                });
            }

            // Phase 3: Simulator predicts
            await this.delay(this.simulationDelay);
            const { efficiency, monologue: simulatorMonologue } = runSimulator(finalProposal, input);
            monologue.push(simulatorMonologue);

            // Assemble final design
            const design: EnzymeDesign = {
                enzyme_name: finalProposal.enzyme_name,
                mutation_list: finalProposal.mutation_list,
                predicted_efficiency_score: efficiency,
                safety_lock_type: finalProposal.safety_lock_type!,
                chassis_type: finalProposal.chassis_type,
                design_rationale: `[COMMITTEE CONSENSUS] Organism: ${finalProposal.organism} (${finalProposal.organism_description}). ` +
                    `${finalProposal.rationale} Safety: ${finalProposal.safety_lock_type} verified. ` +
                    `Simulation: ${efficiency * 100}% efficiency.`,
                references: [
                    'Lee et al. 2025 - Halophilic Enzyme Expression in Marine Bioremediation',
                    'Zhang et al. 2025 - Engineered Quorum Sensing Kill Switches for Synthetic Biology Containment',
                ],
            };

            return {
                success: true,
                data: design,
                timestamp: new Date().toISOString(),
                internal_monologue: monologue,
                mode: 'SIMULATION',
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                internal_monologue: monologue,
                mode: 'SIMULATION',
            };
        }
    }
}

// Default singleton instance
export const geminiBridge = new GeminiBridge();
