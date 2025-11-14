
import React from 'react';

const AIAvatar: React.FC = () => {
    return (
        <div className="w-56 h-56 relative animate-float">
            <style>
                {`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-12px); }
                    }
                    .animate-float {
                        animation: float 7s ease-in-out infinite;
                    }
                    @keyframes pulse-glow-visor {
                        0%, 100% { opacity: 0.6; }
                        50% { opacity: 1; }
                    }
                    .visor-glow {
                        animation: pulse-glow-visor 2.5s ease-in-out infinite;
                    }
                `}
            </style>
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <defs>
                    <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <linearGradient id="grad-hair" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <radialGradient id="grad-face" cx="50%" cy="40%" r="50%">
                        <stop offset="0%" stopColor="#4a5568" />
                        <stop offset="100%" stopColor="#1a202c" />
                    </radialGradient>
                     <linearGradient id="grad-visor" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                    </linearGradient>
                </defs>

                {/* Background Glow */}
                <circle cx="100" cy="100" r="70" fill="#ec4899" opacity="0.1" filter="url(#neon-glow)" />

                {/* Bust */}
                <path d="M 60 200 C 60 140, 140 140, 140 200 Z" fill="#2d3748" />
                <path d="M 70 145 a 30 30 0 0 1 60 0" stroke="#63b3ed" strokeWidth="1.5" fill="none" />

                {/* Head */}
                <path d="M 75 140 C 50 120, 50 50, 100 40 C 150 50, 150 120, 125 140 Z" fill="url(#grad-face)" />

                {/* Hair */}
                <path d="M 100 40 C 40 40, 40 120, 75 130 C 70 80, 100 70, 100 40 Z" fill="url(#grad-hair)" />
                <path d="M 100 40 C 160 40, 160 120, 125 130 C 130 80, 100 70, 100 40 Z" fill="url(#grad-hair)" />
                
                {/* Visor */}
                <path d="M 65 90 C 80 80, 120 80, 135 90 L 130 105 C 120 110, 80 110, 70 105 Z" fill="url(#grad-visor)" opacity="0.7" className="visor-glow" />
                <path d="M 65 90 C 80 80, 120 80, 135 90" stroke="#67e8f9" strokeWidth="2.5" fill="none" filter="url(#neon-glow)" />

                {/* Chin & Jaw line */}
                <path d="M 80 138 C 100 145, 120 138, 120 138" stroke="#a0aec0" strokeWidth="1" fill="none" />
            </svg>
        </div>
    );
};

export default AIAvatar;