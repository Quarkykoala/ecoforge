# 🧬 EcoForge (Polymer-X)

> **Zero-Cost Bioremediation Command Center** — AI-powered enzyme design simulation for ocean plastic degradation

[![MIT License](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-purple.svg)](https://vitejs.dev)
[![Gemini](https://img.shields.io/badge/Gemini_API-Ready-green.svg)](https://ai.google.dev)

---

## 🌊 Overview

EcoForge simulates what would normally require expensive computational resources (Evo 2 protein language models + RFdiffusion structure prediction) using a **Wizard of Oz** pattern powered by Gemini AI.

Deploy engineered enzymes to break down ocean plastics at any location, with real-time efficiency predictions and mandatory biosafety protocols.

### ✨ Key Features

- **🗺️ Interactive Ocean Map** — Click anywhere to set deployment location
- **🎛️ Control Panel** — Adjust salinity, plastic type, and stress conditions
- **🧠 Committee Mode** — 3-agent debate (Architect → Safety Officer → Simulator)
- **🧪 Dual Mode** — Gemini API integration OR deterministic simulation
- **🦠 Physarum Visualization** — Slime mold algorithm shows enzyme spread
- **🔒 Biosafety** — Mandatory Quorum Sensing kill-switch (Zhang et al. 2025)

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/ecoforge.git
cd ecoforge

# Install dependencies
cd web
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Environment Variables (Optional)

Create a `.env` file in the `web/` directory:

```bash
# Enable Gemini API (live mode)
VITE_GEMINI_API_KEY=your_gemini_api_key

# Enable Google Maps 3D (replacing ocean gradient)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

> **Note:** The app works fully without API keys — it falls back to simulation mode.

---

## 🧬 How It Works

### The Committee Debate

When you click **DEPLOY POLYMER-X**, three sub-agents deliberate:

| Agent | Role | Output |
|-------|------|--------|
| 🏗️ **Architect** | Proposes chassis organism + enzyme | Enzyme design + mutations |
| 🛡️ **Safety Officer** | Validates biosafety locks | Approval or rejection |
| 🔬 **Simulator** | Predicts efficiency score | 0-95% efficiency rating |

### Biological Logic Rules

From `docs/LOGIC.md`:

```
Chassis Selection:
├── Salinity > 35ppt → Halophilic (Lee et al. 2025)
├── Stress = true → Thermophilic
└── Default → Mesophilic

Safety: ALL designs MUST include Quorum_Sensing_Type_B (Zhang et al. 2025)
```

### Enzyme-Plastic Mapping

| Plastic | Enzyme | Common Source |
|---------|--------|---------------|
| PET | PETase | Bottles, containers |
| HDPE | LacCase-HD | Pipes, bottles |
| PVC | HaloHyd-VC | Cables, pipes |
| LDPE | AlkB-LDPE | Bags, films |
| PP | CutinasePP | Containers |
| PS | StyreneOx | Foam, packaging |

---

## 📁 Project Structure

```
ecoforge/
├── docs/
│   ├── LOGIC.md          # Biological simulation rules
│   ├── INTERFACES.ts     # Type definitions
│   └── BIBLIOGRAPHY.md   # Scientific citations
├── web/
│   ├── src/
│   │   ├── components/
│   │   │   ├── OceanMap.tsx        # Main map + deployment UI
│   │   │   ├── ControlPanel.tsx    # Input controls
│   │   │   ├── DeploymentHistory.tsx
│   │   │   └── PhysarumCanvas.tsx  # Slime mold visualization
│   │   ├── services/
│   │   │   └── geminiBridge.ts     # Gemini API + simulation
│   │   └── App.tsx
│   └── .env.example
└── scripts/
    └── test-logic.ts     # CLI testing tool
```

---

## 📚 Scientific References

1. **Lee et al. 2025** — "Halophilic Enzyme Expression in Marine Bioremediation" (*Nature Biotechnology*)
2. **Zhang et al. 2025** — "Engineered Quorum Sensing Kill Switches for Synthetic Biology Containment" (*Science Synthetic Biology*)
3. **Yoshida et al. 2016** — "A bacterium that degrades and assimilates poly(ethylene terephthalate)" (*Science*)
4. **Austin et al. 2018** — "Characterization and engineering of a plastic-degrading aromatic polyesterase" (*PNAS*)

---

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript + Vite 7
- **Styling:** Tailwind CSS 4
- **AI:** Google Gemini API (optional)
- **Maps:** Google Maps 3D Tiles (optional)
- **Visualization:** Canvas-based Physarum simulation

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built for a cleaner ocean 🌊**

</div>
