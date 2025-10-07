import React from 'react';

interface SliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
}

export const Slider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, onChange }) => {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-baseline">
                <label className="text-sm font-medium text-gray-300">{label}</label>
                <span className="text-cyan-400 font-mono bg-gray-900 px-2 py-1 rounded text-sm shadow-lg shadow-cyan-500/50">{value}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
        </div>
    );
};
