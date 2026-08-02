import React from 'react';
import { Activity } from 'lucide-react';

const Loader = ({ message = "Syncing Clinical Records", fullScreen = false }) => {
    const content = (
        <div className="flex flex-col items-center justify-center gap-8">
            <div className="relative">
                {/* Core Icon Container (Squircle) */}
                <div className="relative w-28 h-28 rounded-[2.5rem] bg-[#0b0d11] border border-emerald-500/20 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.1)] overflow-hidden group">
                    {/* Inner Glow/Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50" />
                    
                    {/* Pulsing Aura */}
                    <div className="absolute inset-4 rounded-[1.5rem] bg-emerald-500/5 animate-pulse blur-xl" />
                    
                    {/* Icon with glow */}
                    <Activity 
                        size={42} 
                        className="text-emerald-400 animate-pulse drop-shadow-[0_0_15px_rgba(52,211,153,0.6)] relative z-10" 
                        strokeWidth={1.5}
                    />
                </div>

                {/* Subtle Outer Glow */}
                <div className="absolute -inset-4 bg-emerald-500/5 rounded-[3rem] blur-2xl animate-pulse -z-10" />
            </div>

            <div className="flex flex-col items-center gap-3">
                <p className="text-[11px] font-black text-emerald-500/90 uppercase tracking-[0.5em] text-center ml-[0.5em]">
                    {message}
                </p>
                <div className="flex gap-1.5 opacity-40">
                    {[...Array(3)].map((_, i) => (
                        <div 
                            key={i} 
                            className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce" 
                            style={{ animationDelay: `${i * 200}ms` }} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#0b0d11] overflow-hidden">
                {content}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-[70vh] w-full bg-transparent">
            {content}
        </div>
    );
};

export const Spinner = ({ size = 20, className = "" }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <Activity 
            size={size} 
            className="text-emerald-400 animate-pulse drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" 
            strokeWidth={2}
        />
        <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-md animate-pulse" />
    </div>
);

export default Loader;
