import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Search } from 'lucide-react';
import { fetchLabTests } from '../../services/labApi';

const LabTestSearchInput = ({ value, onChange, onSelect, placeholder, className, required }) => {
    const [query, setQuery] = useState(value || '');
    const [allTests, setAllTests] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        // Load all tests initially since the list is relatively small (200 items)
        // This allows for client-side filtering which is faster for this use case
        const loadTests = async () => {
            try {
                const res = await fetchLabTests();
                if (res.success) {
                    setAllTests(res.data);
                }
            } catch (error) {
                console.error("Failed to load lab tests", error);
            }
        };
        loadTests();
    }, []);

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

    const handleSearch = (val) => {
        setQuery(val);
        // If onChange expects an event object, we might need to simulate it, but based on usage it seems to expect value
        // However, looking at DrugSearchInput usage: onChange={(val) => updateMedicineRow(index, 'name', val)}
        // So passing value is correct.
        // BUT, in DoctorDashboard select usage: onChange={(e) => ...}
        // We need to support both or standardize.
        // Let's stick to passing the value directly as per DrugSearchInput pattern.
        if (typeof onChange === 'function') {
            onChange(val);
        }

        if (val.length < 1) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        // Client-side filtering
        const filtered = allTests.filter(test => 
            test.testName.toLowerCase().includes(val.toLowerCase())
        );
        setResults(filtered);
        setIsOpen(true);
        setLoading(false);
    };

    const handleSelect = (test) => {
        setQuery(test.testName);
        if (typeof onChange === 'function') {
            onChange(test.testName);
        }
        if (onSelect) {
            onSelect(test);
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
                    onFocus={() => query.length >= 1 && setIsOpen(true)}
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 size={14} className="animate-spin text-gray-400" />
                    </div>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute z-[100] w-full mt-1 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {results.map((test, index) => (
                        <button
                            key={test.testId || index}
                            type="button"
                            onClick={() => handleSelect(test)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-800 border-b border-gray-800 last:border-0 transition-colors group"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{test.testName}</p>
                                </div>
                                <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                                    ₹{test.price}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
            
            {isOpen && results.length === 0 && query.length > 0 && (
                <div className="absolute z-[100] w-full mt-1 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl p-4 text-center">
                    <p className="text-sm text-gray-500">No lab tests found matching "{query}"</p>
                </div>
            )}
        </div>
    );
};

export default LabTestSearchInput;
