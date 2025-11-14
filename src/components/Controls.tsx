
import React, { useState, useEffect } from 'react';
import type { AppStatus } from '../types';
import { MicIcon, StopIcon, PermissionsIcon, SendIcon } from './Icons';

interface ControlsProps {
    status: AppStatus;
    error: string | null;
    onStartSession: () => void;
    onEndSession: () => void;
    onSendText: (text: string) => void;
}

const baseButtonClasses = "font-orbitron text-lg font-bold px-8 py-4 rounded-full border-2 transition-all duration-300 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed";
const primaryButtonClasses = "bg-cyan-500/20 border-cyan-400 text-cyan-300 hover:bg-cyan-500/40 hover:shadow-[0_0_20px_theme(colors.cyan.500)]";
const secondaryButtonClasses = "bg-pink-500/20 border-pink-400 text-pink-300 hover:bg-pink-500/40 hover:shadow-[0_0_20px_theme(colors.pink.500)]";
const iconButtonClasses = "p-4"; // For icon-only buttons

export const Controls: React.FC<ControlsProps> = ({ status, error, onStartSession, onEndSession, onSendText }) => {
    const [inputText, setInputText] = useState('');
    const [isTextMode, setIsTextMode] = useState(false);

    // Reset text mode when session ends or status changes
    useEffect(() => {
        if (status !== 'listening') {
            setIsTextMode(false);
        }
    }, [status]);

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim()) {
            onSendText(inputText.trim());
            setInputText('');
        }
    };
    
    const renderContent = () => {
        switch (status) {
            case 'idle':
                return null; // This is now handled by StartScreen
            case 'ready':
                return (
                    <div className="flex items-center gap-4">
                        <button onClick={onStartSession} className={`${baseButtonClasses} ${primaryButtonClasses}`}>
                            <PermissionsIcon />
                            Start
                        </button>
                    </div>
                );
            case 'initializing':
                return (
                    <button disabled className={`${baseButtonClasses} ${primaryButtonClasses}`}>
                        <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                        Initializing AI...
                    </button>
                );
            case 'listening':
                return (
                    <div className="flex items-center justify-center gap-4 w-full max-w-3xl flex-wrap">
                        {!isTextMode ? (
                            <>
                                <button
                                    onClick={() => setIsTextMode(true)}
                                    className="flex flex-col items-center gap-2 px-4 group transition-all"
                                    aria-label="Switch to text input"
                                >
                                    <div className="relative flex items-center justify-center">
                                        <div className="absolute w-16 h-16 bg-green-500/50 rounded-full animate-ping group-hover:animate-none"></div>
                                        <MicIcon className="w-8 h-8 text-green-400" />
                                    </div>
                                    <p className="text-green-300 font-bold">Listening...</p>
                                </button>
                                <button onClick={onEndSession} className={`${baseButtonClasses} ${secondaryButtonClasses}`}>
                                    <StopIcon />
                                    End
                                </button>
                            </>
                        ) : (
                            <>
                                <form onSubmit={handleTextSubmit} className="flex-1 flex items-center gap-2" style={{ minWidth: '250px' }}>
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="...or type your message here"
                                        className="w-full bg-gray-800/50 border-2 border-indigo-400 rounded-full px-6 py-3 text-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                                        aria-label="Text input for conversation"
                                        autoFocus
                                    />
                                    <button type="submit" className={`${baseButtonClasses} ${primaryButtonClasses} ${iconButtonClasses} px-4`} aria-label="Send text message">
                                        <SendIcon />
                                    </button>
                                </form>
                                <div className="flex items-center shrink-0 gap-2">
                                    <button onClick={() => setIsTextMode(false)} className={`${baseButtonClasses} ${secondaryButtonClasses} ${iconButtonClasses}`} aria-label="Switch to voice input">
                                        <MicIcon />
                                    </button>
                                    <button onClick={onEndSession} className={`${baseButtonClasses} ${secondaryButtonClasses} ${iconButtonClasses}`} aria-label="End Session">
                                        <StopIcon />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };
    
    return (
        <div className="flex flex-col items-center justify-center min-h-[8rem] w-full">
            {error && <p className="text-red-400 mb-4 text-center">{error}</p>}
            {renderContent()}
        </div>
    );
};