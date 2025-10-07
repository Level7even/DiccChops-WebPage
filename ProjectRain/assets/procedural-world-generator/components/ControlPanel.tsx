
import React from 'react';
import type { MapSettings } from '../types';

interface SliderControlProps {
  label: string;
  id: keyof MapSettings;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (id: keyof MapSettings, value: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({ label, id, value, min, max, step, onChange }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
    <div className="flex items-center space-x-3">
      <input
        type="range"
        id={id}
        name={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(id, parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(id, parseFloat(e.target.value))}
        className="w-20 bg-gray-900 text-white rounded-md p-1 text-center border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
    </div>
  </div>
);


interface ControlPanelProps {
  settings: MapSettings;
  onSettingsChange: (newSettings: Partial<MapSettings>) => void;
  onGenerate: () => void;
  onDownload: () => void;
  isGenerating: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ settings, onSettingsChange, onGenerate, onDownload, isGenerating }) => {
  const handleSliderChange = (id: keyof MapSettings, value: number) => {
    onSettingsChange({ [id]: value });
  };

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-bold text-white mb-6 border-b-2 border-gray-700 pb-2">World Generator</h1>
      
      <div className="flex-grow overflow-y-auto pr-2">
        <h2 className="text-lg font-semibold text-blue-400 mb-2">General</h2>
        <SliderControl label="Width" id="width" value={settings.width} min={100} max={1920} step={10} onChange={handleSliderChange} />
        <SliderControl label="Height" id="height" value={settings.height} min={100} max={1920} step={10} onChange={handleSliderChange} />
        <SliderControl label="Base Ground Height" id="baseHeightFactor" value={settings.baseHeightFactor} min={0.1} max={0.9} step={0.05} onChange={handleSliderChange} />
        <SliderControl label="Smooth Passes" id="smoothPasses" value={settings.smoothPasses} min={0} max={20} step={1} onChange={handleSliderChange} />

        <h2 className="text-lg font-semibold text-blue-400 mt-6 mb-2">Surface Waves</h2>
        <SliderControl label="Wave 1 Amplitude" id="sin1Amp" value={settings.sin1Amp} min={0} max={100} step={1} onChange={handleSliderChange} />
        <SliderControl label="Wave 1 Frequency" id="sin1Freq" value={settings.sin1Freq} min={0} max={0.1} step={0.001} onChange={handleSliderChange} />
        <SliderControl label="Wave 2 Amplitude" id="sin2Amp" value={settings.sin2Amp} min={0} max={50} step={1} onChange={handleSliderChange} />
        <SliderControl label="Wave 2 Frequency" id="sin2Freq" value={settings.sin2Freq} min={0} max={0.1} step={0.001} onChange={handleSliderChange} />
        <SliderControl label="Wave 3 Amplitude" id="sin3Amp" value={settings.sin3Amp} min={0} max={25} step={1} onChange={handleSliderChange} />
        <SliderControl label="Wave 3 Frequency" id="sin3Freq" value={settings.sin3Freq} min={0} max={0.2} step={0.001} onChange={handleSliderChange} />
        <SliderControl label="Wave 4 Amplitude" id="sin4Amp" value={settings.sin4Amp} min={0} max={10} step={1} onChange={handleSliderChange} />
        <SliderControl label="Wave 4 Frequency" id="sin4Freq" value={settings.sin4Freq} min={0} max={0.5} step={0.001} onChange={handleSliderChange} />
        <SliderControl label="Random Amplitude" id="randomAmp" value={settings.randomAmp} min={0} max={20} step={1} onChange={handleSliderChange} />

        <h2 className="text-lg font-semibold text-blue-400 mt-6 mb-2">Terrain Layers</h2>
        <SliderControl label="Grass Thickness" id="grassThickness" value={settings.grassThickness} min={1} max={10} step={1} onChange={handleSliderChange} />
        <SliderControl label="Dirt Layer Depth" id="dirtLayerDepth" value={settings.dirtLayerDepth} min={10} max={100} step={1} onChange={handleSliderChange} />
        
        <h2 className="text-lg font-semibold text-blue-400 mt-6 mb-2">Caves</h2>
        <SliderControl label="Cave Density" id="caveDensity" value={settings.caveDensity} min={1} max={100} step={1} onChange={handleSliderChange} />
        <SliderControl label="Cave Size" id="caveSize" value={settings.caveSize} min={10} max={200} step={1} onChange={handleSliderChange} />
        <SliderControl label="Cave Vertical Bias" id="caveVerticalBias" value={settings.caveVerticalBias} min={0} max={1} step={0.01} onChange={handleSliderChange} />
        <SliderControl label="Cave Vertical Freq" id="caveVerticalFreq" value={settings.caveVerticalFreq} min={0.001} max={0.1} step={0.001} onChange={handleSliderChange} />
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <button onClick={onGenerate} disabled={isGenerating} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition duration-300">
          {isGenerating ? 'Generating...' : 'Regenerate Map'}
        </button>
        <button onClick={onDownload} disabled={isGenerating} className="w-full mt-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition duration-300">
          Download Map
        </button>
      </div>
    </div>
  );
};
