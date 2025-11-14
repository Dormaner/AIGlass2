
import React from 'react';
import AIAvatar from './AIAvatar';
import { PermissionsIcon, SettingsIcon } from './Icons';

interface StartScreenProps {
    onStart: () => void;
    error: string | null;
    onOpenSettings: () => void;
}

const baseButtonClasses = "font-orbitron text-lg font-bold px-8 py-4 rounded-full border-2 transition-all duration-300 flex items-center gap-3";
const primaryButtonClasses = "bg-cyan-500/20 border-cyan-400 text-cyan-300 hover:bg-cyan-500/40 hover:shadow-[0_0_20px_theme(colors.cyan.500)]";

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, error, onOpenSettings }) => {
    return (
        <div className="relative w-screen h-screen bg-black overflow-hidden font-orbitron flex flex-col justify-center items-center p-8 text-center">
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black"></div>
            <style>
                {`
                .bg-grid-pattern {
                    background-image:
                        linear-gradient(to right, rgba(0, 255, 255, 0.2) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(0, 255, 255, 0.2) 1px, transparent 1px);
                    background-size: 3rem 3rem;
                }
                `}
            </style>

            <button
                onClick={onOpenSettings}
                className="absolute top-8 right-8 z-20 p-3 rounded-full bg-black/50 border-2 border-pink-400 text-pink-300 hover:bg-pink-500/40 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
                aria-label="Open Settings"
            >
                <SettingsIcon className="w-6 h-6" />
            </button>

            <div className="z-10 flex flex-col items-center">
                <AIAvatar />
                <h1 className="text-4xl md:text-6xl font-bold text-cyan-300 tracking-widest uppercase my-8" style={{textShadow: '0 0 10px #0891b2, 0 0 20px #0891b2'}}>
                    Cyberpunk English Tutor
                </h1>
                 {error && <p className="text-red-400 mb-4 text-center max-w-xl">{error}</p>}
                <button onClick={onStart} className={`${baseButtonClasses} ${primaryButtonClasses} mx-auto mt-8`}>
                    <PermissionsIcon />
                    Start
                </button>
            </div>
        </div>
    );
};
