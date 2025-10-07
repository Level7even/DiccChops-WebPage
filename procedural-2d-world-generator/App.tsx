import React, { useState, useCallback } from 'react';
import { generateWorld } from './services/worldGenerator';
import { Spinner } from './components/Spinner';
import { Button } from './components/Button';
import { WORLD_WIDTH, WORLD_HEIGHT, TERRAIN_COLORS, SEED, TERRAIN_SMOOTHNESS, TERRAIN_AMPLITUDE, BASE_HEIGHT, DIRT_LAYER_THICKNESS, CAVE_SMOOTHNESS, CAVE_THRESHOLD, WATER_LEVEL, NOISE_TYPE, OCTAVES } from './constants';
import { WorldSettings } from './types';

const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [settings, setSettings] = useState<WorldSettings>({
        worldWidth: WORLD_WIDTH,
        worldHeight: WORLD_HEIGHT,
        terrainColors: { ...TERRAIN_COLORS },
        seed: SEED,
        terrainSmoothness: TERRAIN_SMOOTHNESS,
        terrainAmplitude: TERRAIN_AMPLITUDE,
        baseHeight: BASE_HEIGHT,
        dirtLayerThickness: DIRT_LAYER_THICKNESS,
        caveSmoothness: CAVE_SMOOTHNESS,
        caveThreshold: CAVE_THRESHOLD,
        waterLevel: WATER_LEVEL,
        noiseType: NOISE_TYPE,
        octaves: OCTAVES,
    });

    const handleGenerateClick = useCallback(async () => {
        setIsLoading(true);
        setImageUrl(null);
        // Use a brief timeout to allow the UI to update to the loading state
        // before the potentially blocking generation process starts.
        setTimeout(async () => {
            try {
                const dataUrl = await generateWorld(settings);
                setImageUrl(dataUrl);
            } catch (error) {
                console.error("Failed to generate world:", error);
            } finally {
                setIsLoading(false);
            }
        }, 50);
    }, [settings]);

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                        2D Procedural World Generator
                    </h1>
                    <p className="mt-4 text-lg text-gray-400">
                        Crafting unique, otherworldly landscapes with noise algorithms. Click generate to create a new world.
                    </p>
                </header>

                <main className="bg-gray-800/50 rounded-xl shadow-2xl p-6 border border-gray-700">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
                        <Button onClick={handleGenerateClick} disabled={isLoading}>
                            Generate New World
                        </Button>
                        {imageUrl && !isLoading && (
                            <a
                                href={imageUrl}
                                download="generated-world.png"
                                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                            >
                                <DownloadIcon className="-ml-1 mr-3 h-5 w-5" aria-hidden="true" />
                                Download PNG
                            </a>
                        )}
                    </div>

                    <details className="mb-6">
                        <summary className="cursor-pointer text-lg font-medium text-gray-300 hover:text-white">Settings</summary>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">World Width</label>
                                <input
                                    type="range"
                                    min="512"
                                    max="4096"
                                    step="64"
                                    value={settings.worldWidth}
                                    onChange={(e) => setSettings({ ...settings, worldWidth: Number(e.target.value) })}
                                    className="w-full"
                                />
                                <span className="text-xs text-gray-500">{settings.worldWidth}</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">World Height</label>
                                <input
                                    type="range"
                                    min="512"
                                    max="4096"
                                    step="64"
                                    value={settings.worldHeight}
                                    onChange={(e) => setSettings({ ...settings, worldHeight: Number(e.target.value) })}
                                    className="w-full"
                                />
                                <span className="text-xs text-gray-500">{settings.worldHeight}</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Seed</label>
                                <input
                                    type="text"
                                    value={settings.seed}
                                    onChange={(e) => setSettings({ ...settings, seed: e.target.value })}
                                    className="w-full px-2 py-1 bg-gray-700 text-white rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Terrain Smoothness</label>
                                <input
                                    type="range"
                                    min="50"
                                    max="1000"
                                    step="10"
                                    value={settings.terrainSmoothness}
                                    onChange={(e) => setSettings({ ...settings, terrainSmoothness: Number(e.target.value) })}
                                    className="w-full"
                                />
                                <span className="text-xs text-gray-500">{settings.terrainSmoothness}</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Terrain Amplitude</label>
                                <input
                                    type="range"
                                    min="50"
                                    max="500"
                                    step="10"
                                    value={settings.terrainAmplitude}
                                    onChange={(e) => setSettings({ ...settings, terrainAmplitude: Number(e.target.value) })}
                                    className="w-full"
                                />
                                <span className="text-xs text-gray-500">{settings.terrainAmplitude}</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Base Height</label>
                                <input
                                    type="range"
                                    min="100"
                                    max="1500"
                                    step="10"
                                    value={settings.baseHeight}
                                    onChange={(e) => setSettings({ ...settings, baseHeight: Number(e.target.value) })}
                                    className="w-full"
                                />
                                <span className="text-xs text-gray-500">{settings.baseHeight}</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Dirt Layer Thickness</label>
                                <input
                                    type="range"
                                    min="50"
                                    max="500"
                                    step="10"
                                    value={settings.dirtLayerThickness}
                                    onChange={(e) => setSettings({ ...settings, dirtLayerThickness: Number(e.target.value) })}
                                    className="w-full"
                                />
                                <span className="text-xs text-gray-500">{settings.dirtLayerThickness}</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Cave Smoothness</label>
                                <input
                                    type="range"
                                    min="20"
                                    max="500"
                                    step="10"
                                    value={settings.caveSmoothness}
                                    onChange={(e) => setSettings({ ...settings, caveSmoothness: Number(e.target.value) })}
                                    className="w-full"
                                />
                                <span className="text-xs text-gray-500">{settings.caveSmoothness}</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Cave Threshold</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={settings.caveThreshold}
                                    onChange={(e) => setSettings({ ...settings, caveThreshold: Number(e.target.value) })}
                                    className="w-full"
                                />
                                <span className="text-xs text-gray-500">{settings.caveThreshold}</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Water Level</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1000"
                                    step="10"
                                    value={settings.waterLevel}
                                    onChange={(e) => setSettings({ ...settings, waterLevel: Number(e.target.value) })}
                                    className="w-full"
                                />
                                <span className="text-xs text-gray-500">{settings.waterLevel}</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Noise Type</label>
                                <select
                                    value={settings.noiseType}
                                    onChange={(e) => setSettings({ ...settings, noiseType: e.target.value as 'value' | 'perlin' })}
                                    className="w-full px-2 py-1 bg-gray-700 text-white rounded"
                                >
                                    <option value="value">Value Noise</option>
                                    <option value="perlin">Perlin Noise</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Octaves</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="8"
                                    step="1"
                                    value={settings.octaves}
                                    onChange={(e) => setSettings({ ...settings, octaves: Number(e.target.value) })}
                                    className="w-full"
                                />
                                <span className="text-xs text-gray-500">{settings.octaves}</span>
                            </div>
                        </div>
                    </details>

                    <div className="w-full aspect-square bg-black/50 rounded-lg flex items-center justify-center overflow-auto border-2 border-gray-700">
                        {isLoading ? (
                            <Spinner />
                        ) : imageUrl ? (
                            <img
                                src={imageUrl}
                                alt="Generated 2D World"
                                className="object-contain"
                                style={{ width: settings.worldWidth, height: settings.worldHeight, maxWidth: '100%', maxHeight: '100%' }}
                            />
                        ) : (
                            <div className="text-center text-gray-500 p-8">
                                <p className="text-xl">Your generated world will appear here.</p>
                                <p className="mt-2 text-base">({settings.worldWidth}x{settings.worldHeight} pixels)</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
