
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { generateMap } from './services/mapGenerator';
import { INITIAL_SETTINGS } from './types';
import type { MapSettings } from './types';

const App: React.FC = () => {
  const [settings, setSettings] = useState<MapSettings>(INITIAL_SETTINGS);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  const regenerateMap = useCallback(() => {
    if (!canvasRef.current) return;
    setIsGenerating(true);
    // Use a timeout to allow the UI to update to the "Generating..." state
    setTimeout(() => {
      generateMap(canvasRef.current!, settings);
      setIsGenerating(false);
    }, 50);
  }, [settings]);

  useEffect(() => {
    regenerateMap();
  }, [regenerateMap]);

  const handleSettingsChange = (newSettings: Partial<MapSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'procedural-world.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-gray-200 font-sans">
      <div className="w-full md:w-80 lg:w-96 bg-gray-800 shadow-lg p-4 overflow-y-auto">
        <ControlPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onGenerate={regenerateMap}
          onDownload={handleDownload}
          isGenerating={isGenerating}
        />
      </div>
      <main className="flex-1 flex items-center justify-center p-4 bg-gray-900 overflow-auto">
         <div className="relative w-full h-full border-2 border-gray-700 rounded-lg overflow-hidden shadow-2xl">
          {isGenerating && (
              <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-10">
                  <div className="text-center">
                      <svg className="animate-spin h-10 w-10 text-blue-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="mt-4 text-lg font-semibold text-gray-300">Generating World...</p>
                  </div>
              </div>
          )}
          <canvas 
              ref={canvasRef} 
              width={settings.width} 
              height={settings.height} 
              className="object-contain w-full h-full"
              style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
