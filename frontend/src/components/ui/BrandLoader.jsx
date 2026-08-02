import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';

const BrandLoader = ({ isLoading = true, message = "Syncing Clinical Records" }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0b0d11] text-white overflow-hidden"
        >
          <div className="flex flex-col items-center justify-center gap-8 text-center">
            <div className="relative">
                {/* Core Icon Container (Squircle) */}
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="relative w-28 h-28 rounded-[2.5rem] bg-[#0b0d11] border border-emerald-500/20 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.1)] overflow-hidden"
                >
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
                </motion.div>

                {/* Subtle Outer Glow */}
                <div className="absolute -inset-4 bg-emerald-500/5 rounded-[3rem] blur-2xl animate-pulse -z-10" />
            </div>

            <div className="flex flex-col items-center gap-3">
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-[11px] font-black text-emerald-500/90 uppercase tracking-[0.5em] ml-[0.5em]"
                >
                    {message}
                </motion.p>
                <div className="flex gap-1.5 opacity-40">
                    {[...Array(3)].map((_, i) => (
                        <motion.div 
                            key={i} 
                            animate={{ y: [0, -4, 0] }}
                            transition={{ 
                              duration: 0.6, 
                              repeat: Infinity, 
                              delay: i * 0.2,
                              ease: "easeInOut"
                            }}
                            className="w-1 h-1 rounded-full bg-emerald-400" 
                        />
                    ))}
                </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BrandLoader;
