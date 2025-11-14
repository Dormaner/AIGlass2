
import React from 'react';
import type { Difficulty } from '../types';
import { CloseIcon } from './Icons';

interface SettingsScreenProps {
    isOpen: boolean;
    onClose: () => void;
    difficulty: Difficulty;
    setDifficulty: (d: Difficulty) => void;
    speechRate: number;
    setSpeechRate: (r: number) => void;
}

const difficultyMap: Record<Difficulty, string> = {
    elementary: '小学',
    middle_school: '初中',
    high_school: '高中',
    university: '大学',
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
    isOpen,
    onClose,
    difficulty,
    setDifficulty,
    speechRate,
    setSpeechRate
}) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center font-share-tech-mono"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-md m-4 p-8 bg-gray-900 border-2 border-pink-500/80 rounded-lg shadow-[0_0_25px] shadow-pink-500/50"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-pink-300 transition-colors"
                    aria-label="Close settings"
                >
                    <CloseIcon className="w-8 h-8" />
                </button>
                <h2 className="font-orbitron text-3xl text-pink-300 uppercase mb-8" style={{textShadow: '0 0 8px #ec4899'}}>
                    Settings
                </h2>
                
                <div className="space-y-8">
                    {/* Difficulty Setting */}
                    <div>
                        <label htmlFor="difficulty" className="block text-lg text-cyan-300 mb-2">
                            对话难度 (Difficulty Level)
                        </label>
                        <select
                            id="difficulty"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                            className="w-full bg-gray-800/50 border-2 border-cyan-400 rounded-md px-4 py-3 text-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all appearance-none"
                            style={{
                                backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="rgb(107 235 244)" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>')`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 1rem center'
                            }}
                        >
                            {Object.entries(difficultyMap).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Speech Rate Setting */}
                    <div>
                        <label htmlFor="speech-rate" className="block text-lg text-cyan-300 mb-2">
                            对话速度 (Speech Rate): <span className="font-orbitron text-cyan-100">{speechRate.toFixed(1)}x</span>
                        </label>
                        <input
                            id="speech-rate"
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={speechRate}
                            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-slider"
                        />
                        <style>{`
                            .range-slider::-webkit-slider-thumb {
                                -webkit-appearance: none;
                                appearance: none;
                                width: 20px;
                                height: 20px;
                                border-radius: 50%;
                                background: #ec4899;
                                border: 2px solid #f9a8d4;
                                cursor: pointer;
                            }
                            .range-slider::-moz-range-thumb {
                                width: 20px;
                                height: 20px;
                                border-radius: 50%;
                                background: #ec4899;
                                border: 2px solid #f9a8d4;
                                cursor: pointer;
                            }
                        `}</style>
                    </div>
                </div>

            </div>
        </div>
    );
};
