import React from 'react';

interface NumberInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
}

export const NumberInput: React.FC<NumberInputProps> = ({ label, value, onChange }) => {
    return (
        <div className="flex flex-col gap-2 flex-grow">
            <label className="text-sm font-medium text-gray-300">{label}</label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition shadow-lg shadow-gray-900/50 focus:shadow-cyan-500/50"
            />
        </div>
    );
};
