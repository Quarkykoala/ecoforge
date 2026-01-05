import './index.css';
import OceanMap from './components/OceanMap';

/**
 * Polymer-X: Zero-Cost Bioremediation Command Center
 * 
 * Main entry point for the web UI.
 * 
 * Features:
 * - Interactive ocean map with click-to-deploy location selection
 * - Control panel for salinity, plastic type, and stress parameters
 * - Committee Mode: 3-agent debate (Architect, Safety Officer, Simulator)
 * - Physarum slime mold visualization for enzyme spread
 * - Gemini API integration (optional) with simulation fallback
 * 
 * Environment Variables:
 * - VITE_GEMINI_API_KEY: Enable live Gemini API mode
 * - VITE_GOOGLE_MAPS_API_KEY: Enable 3D Google Maps
 */

function App() {
  // Read API keys from environment
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <div className="w-full h-full bg-[#0a0a1a]">
      <OceanMap apiKey={googleMapsApiKey} />
    </div>
  );
}

export default App;
