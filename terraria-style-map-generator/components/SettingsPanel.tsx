import React from 'react';
import type { WorldSettings } from '../types';
import { Button } from './Button';
import { Slider } from './Slider';
import { NumberInput } from './NumberInput';

interface SettingsPanelProps {
    settings: WorldSettings;
    setSettings: React.Dispatch<React.SetStateAction<WorldSettings>>;
    onGenerate: () => void;
    onDownload: () => void;
    onRandomizeSeed: () => void;
    isGenerating: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, setSettings, onGenerate, onDownload, onRandomizeSeed, isGenerating }) => {

    const handleSettingsChange = (key: keyof WorldSettings, value: number) => {
        setSettings(prev => ({...prev, [key]: value}));
    };

    return (
        <aside className="w-full lg:w-96 bg-gradient-to-br from-gray-900 via-purple-900 to-black rounded-lg shadow-2xl p-6 flex-shrink-0 flex flex-col gap-6 border border-cyan-500/50 shadow-cyan-500/20">
            <h1 className="text-2xl font-bold text-cyan-300 text-center drop-shadow-lg">World Generation</h1>
            
            <div className="flex flex-col gap-6 flex-grow overflow-y-auto pr-2">
                <div className="flex items-center gap-4">
                    <NumberInput
                        label="Seed"
                        value={settings.seed}
                        onChange={(val) => handleSettingsChange('seed', val)}
                    />
                    <Button onClick={onRandomizeSeed} className="p-2 h-10 mt-6" disabled={isGenerating}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V4a1 1 0 011-1zm10 8a1 1 0 011-1v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 011.885-.666A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101z" clipRule="evenodd" />
                        </svg>
                    </Button>
                </div>

                <Slider
                    label="Tile Size (px)"
                    min={2}
                    max={16}
                    step={2}
                    value={settings.tileSize}
                    onChange={(val) => handleSettingsChange('tileSize', val)}
                />
                
                <Slider
                    label="Terrain Roughness"
                    min={10}
                    max={200}
                    value={settings.terrainRoughness}
                    onChange={(val) => handleSettingsChange('terrainRoughness', val)}
                />

                <Slider
                    label="Cave Density"
                    min={1}
                    max={100}
                    value={settings.caveDensity}
                    onChange={(val) => handleSettingsChange('caveDensity', val)}
                />
                
                <Slider
                    label="Cave Size"
                    min={10}
                    max={150}
                    value={settings.caveSize}
                    onChange={(val) => handleSettingsChange('caveSize', val)}
                />
                
                <Slider
                    label="Water Amount"
                    min={0}
                    max={100}
                    value={settings.waterAmount}
                    onChange={(val) => handleSettingsChange('waterAmount', val)}
                />
                
                <Slider
                    label="Biome Scale"
                    min={10}
                    max={200}
                    value={settings.biomeScale}
                    onChange={(val) => handleSettingsChange('biomeScale', val)}
                />
                
                <Slider
                    label="Mountain Height"
                    min={10}
                    max={100}
                    value={settings.mountainHeight}
                    onChange={(val) => handleSettingsChange('mountainHeight', val)}
                />
                
                <Slider
                    label="Tree Density"
                    min={0}
                    max={100}
                    value={settings.treeDensity}
                    onChange={(val) => handleSettingsChange('treeDensity', val)}
                />
                
                <Slider
                    label="Ore Density"
                    min={0}
                    max={100}
                    value={settings.oreDensity}
                    onChange={(val) => handleSettingsChange('oreDensity', val)}
                />
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-gray-700">
                <Button onClick={onGenerate} disabled={isGenerating} primary>
                    Generate World
                </Button>
                <Button onClick={onDownload} disabled={isGenerating}>
                    Download PNG
                </Button>
            </div>
        </aside>
    );
};
