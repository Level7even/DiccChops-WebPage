import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SettingsPanel } from './components/SettingsPanel';
import { generateWorld } from './services/worldGenerator';
import { WorldSettings, TileType } from './types';
import { TILE_COLORS } from './constants';

const MAP_DIMENSION = 1920;

const LoadingSpinner: React.FC = () => (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg shadow-cyan-400/50"></div>
        <p className="mt-4 text-cyan-300 text-lg font-semibold drop-shadow-lg">Generating World...</p>
    </div>
);


const App: React.FC = () => {
    const [settings, setSettings] = useState<WorldSettings>({
        seed: Math.floor(Math.random() * 100000),
        tileSize: 4,
        terrainRoughness: 50,
        caveDensity: 45,
        caveSize: 60,
        waterAmount: 20,
        biomeScale: 100,
        mountainHeight: 50,
        treeDensity: 30,
        oreDensity: 20,
    });
    const [worldData, setWorldData] = useState<TileType[][] | null>(null);
    const [isGenerating, setIsGenerating] = useState(true);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleGenerate = useCallback(() => {
        setIsGenerating(true);
        // Use setTimeout to allow the UI to update and show the spinner
        setTimeout(() => {
            const data = generateWorld(settings, MAP_DIMENSION, MAP_DIMENSION);
            setWorldData(data);
            setIsGenerating(false);
        }, 50);
    }, [settings]);

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `terraria-map-seed-${settings.seed}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleRandomizeSeed = () => {
        setSettings(prev => ({...prev, seed: Math.floor(Math.random() * 100000)}));
    };

    useEffect(() => {
        handleGenerate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!worldData || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const gridWidth = MAP_DIMENSION / settings.tileSize;
        const gridHeight = MAP_DIMENSION / settings.tileSize;
        
        canvas.width = MAP_DIMENSION;
        canvas.height = MAP_DIMENSION;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const tile = worldData[y][x];
                ctx.fillStyle = TILE_COLORS[tile];
                ctx.fillRect(x * settings.tileSize, y * settings.tileSize, settings.tileSize, settings.tileSize);
            }
        }
    }, [worldData, settings.tileSize]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white flex flex-col lg:flex-row font-sans p-4 gap-4">
            <main className="flex-grow flex items-center justify-center bg-gradient-to-br from-gray-800 via-indigo-900 to-black rounded-lg shadow-2xl p-4 relative overflow-auto border border-purple-500/50 shadow-purple-500/20">
                {isGenerating && <LoadingSpinner />}
                <canvas 
                    ref={canvasRef} 
                    className="bg-black shadow-lg"
                    style={{ imageRendering: 'pixelated', width: '100%', maxWidth: 'calc(100vh - 4rem)', aspectRatio: '1 / 1' }}
                />
            </main>
            <SettingsPanel 
                settings={settings}
                setSettings={setSettings}
                onGenerate={handleGenerate}
                onDownload={handleDownload}
                onRandomizeSeed={handleRandomizeSeed}
                isGenerating={isGenerating}
            />
        </div>
    );
};

export default App;
