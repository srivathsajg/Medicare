import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Search } from 'lucide-react';
import { searchDrugs } from '../../services/drugApi';

const DrugSearchInput = ({ value, onChange, onSelect, placeholder, className, required }) => {
    const [query, setQuery] = useState(value || '');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = async (val) => {
        setQuery(val);
        onChange(val); // Update parent immediately

        if (val.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        setIsOpen(true);
        try {
            const res = await searchDrugs(val);
            if (res.success) {
                setResults(res.data);
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (drug) => {
        const name = drug.name;
        // Optionally append price or composition?
        // Let's just use name for now, or name + dosage if available
        setQuery(name);
        onChange(name);
        if (onSelect) {
            onSelect(drug);
        }
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative flex-1">
            <div className="relative">
                <input
                    required={required}
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={placeholder}
                    className={className}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 size={14} className="animate-spin text-gray-400" />
                    </div>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute z-[100] w-full mt-1 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {results.map((drug, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleSelect(drug)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-800 border-b border-gray-800 last:border-0 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-white">{drug.name}</p>
                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{drug.composition || drug.manufacturer}</p>
                                </div>
                                <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded">
                                    ₹{drug.price}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DrugSearchInput;
