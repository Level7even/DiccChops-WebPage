import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    primary?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, primary = false, className = '', ...props }) => {
    const baseClasses = "w-full font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed";
    const primaryClasses = "bg-cyan-500 hover:bg-cyan-600 text-white focus:ring-cyan-400 shadow-lg shadow-cyan-500/50 hover:shadow-cyan-400/70";
    const secondaryClasses = "bg-gray-700 hover:bg-gray-600 text-cyan-300 focus:ring-cyan-500 shadow-lg shadow-gray-600/50 hover:shadow-gray-500/70";
    
    const combinedClasses = `${baseClasses} ${primary ? primaryClasses : secondaryClasses} ${className}`;

    return (
        <button className={combinedClasses} {...props}>
            {children}
        </button>
    );
};
