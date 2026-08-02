import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, Building2, MapPin, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomSelect = ({ 
    options = [], 
    value, 
    onChange, 
    placeholder = "Select option...", 
    label, 
    icon: Icon,
    className = "",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value || opt === value);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside, true);
        return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const filteredOptions = options.filter(opt => {
        const label = (opt.label || opt).toLowerCase();
        return label.includes(searchTerm.toLowerCase());
    });

    return (
        <div className={`space-y-2 relative ${className}`} ref={containerRef}>
            {label && (
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">
                    {label}
                </label>
            )}
            
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`w-full bg-[#1a1c23] border border-white/10 rounded-[24px] px-5 py-4 flex items-center justify-between group hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300 ${isOpen ? 'border-emerald-500/50 bg-emerald-500/[0.02] shadow-[0_0_30px_rgba(16,185,129,0.1)]' : ''}`}
            >
                <div className="flex items-center gap-4 pointer-events-none">
                    <div className={`p-2 rounded-xl transition-colors ${isOpen ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-gray-500'}`}>
                        {Icon ? <Icon size={20} /> : <Building2 size={20} />}
                    </div>
                    <div className="text-left">
                        <span className={`block text-sm truncate ${value ? 'text-white font-black tracking-tight' : 'text-gray-500 font-bold'}`}>
                            {selectedOption?.label || selectedOption || placeholder}
                        </span>
                        {selectedOption?.metadata && (
                            <span className="text-[10px] text-gray-500 font-medium block truncate mt-0.5">
                                {selectedOption.metadata}
                            </span>
                        )}
                    </div>
                </div>
                <ChevronDown 
                    size={20} 
                    className={`text-gray-500 group-hover:text-gray-300 transition-transform duration-500 pointer-events-none ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} 
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="absolute left-0 right-0 mt-3 bg-[#111318] border border-white/10 rounded-[32px] shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-3xl z-[1000]"
                    >
                        {/* Search Header */}
                        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors" size={16} />
                                <input 
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search clinical network..."
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/40 focus:bg-emerald-500/[0.01] transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>

                        <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {filteredOptions.map((option, idx) => {
                                const optValue = option.value || option;
                                const optLabel = option.label || option;
                                const optMetadata = option.metadata;
                                const isSelected = optValue === value;

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onChange(optValue);
                                            setIsOpen(false);
                                            setSearchTerm('');
                                        }}
                                        className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 group transition-all duration-300 relative overflow-hidden ${
                                            isSelected 
                                            ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' 
                                            : 'hover:bg-white/[0.04]'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                            isSelected ? 'bg-black/20 text-white' : 'bg-white/5 text-emerald-500/60 group-hover:text-emerald-500 group-hover:bg-emerald-500/10'
                                        }`}>
                                            <Building2 size={20} />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-black truncate tracking-tight ${
                                                    isSelected ? 'text-white' : 'text-gray-200 group-hover:text-white'
                                                }`}>{optLabel}</span>
                                                {!isSelected && (
                                                    <ShieldCheck size={12} className="text-emerald-500/40" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <MapPin size={10} className={isSelected ? 'text-white/40' : 'text-gray-600'} />
                                                <span className={`text-[10px] truncate font-medium ${
                                                    isSelected ? 'text-white/60' : 'text-gray-500'
                                                }`}>{optMetadata || 'Verified Provider'}</span>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="bg-white text-emerald-500 rounded-full p-1 shadow-lg">
                                                <Check size={14} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                            {filteredOptions.length === 0 && (
                                <div className="py-12 flex flex-col items-center justify-center opacity-30">
                                    <Search size={40} className="mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No clinical matching</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomSelect;