
import React, { forwardRef } from 'react';

interface CameraFeedProps {
    facingMode: 'user' | 'environment';
}

export const CameraFeed = forwardRef<HTMLVideoElement, CameraFeedProps>(({ facingMode }, ref) => {
    const videoClasses = `w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`;

    return (
        <div className="absolute inset-0 w-full h-full">
            <video
                ref={ref}
                autoPlay
                playsInline
                muted
                className={videoClasses}
            ></video>
            <div className="absolute inset-0 border-4 border-cyan-400/70 rounded-lg shadow-[0_0_20px] shadow-cyan-400/50 pointer-events-none"></div>
             <div className="absolute inset-0 bg-repeat bg-center" style={{backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQYV2NgYGD4z/AfswAMAeMAb5Lw24YAAAAASUVORK5CYII=")', pointerEvents: 'none', opacity: 0.1}}></div>
        </div>
    );
});
CameraFeed.displayName = 'CameraFeed';
