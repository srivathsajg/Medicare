import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, FileText, ClipboardList, Calendar, Package } from 'lucide-react';
import { Spinner } from './Loader';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const UniversalSearchBar = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);

    const getPlaceholder = () => {
        switch (user?.role) {
            case 'doctor': return 'Search Patients...';
            case 'pharmacist': return 'Search Orders...';
            case 'patient': return 'Search My Records...';
            case 'admin': return 'Search System Users...';
            case 'lab_technician': return 'Search Lab Tests...';
            case 'delivery': return 'Search Deliveries...';
            default: return 'Search...';
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.trim().length > 1) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const API_URL = '/api';
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/search?q=${searchTerm}&role=${user?.role}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setResults(response.data.data);
                setShowResults(true);
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleResultClick = (result) => {
        setShowResults(false);
        setSearchTerm('');
        
        // Navigation logic based on role and result type
        if (user?.role === 'doctor') {
            navigate(`/doctor-dashboard?tab=patients&id=${result._id}`);
        } else if (user?.role === 'pharmacist') {
            navigate(`/pharmacy-dashboard?tab=history&id=${result._id}`);
        } else if (user?.role === 'patient') {
            navigate(`/patient-dashboard/records?id=${result._id}`);
        } else if (user?.role === 'admin') {
            navigate(`/admin-dashboard?tab=users&search=${result.name}`);
        } else if (user?.role === 'lab_technician') {
            navigate(`/lab-dashboard?tab=patients&id=${result._id}`);
        } else if (user?.role === 'delivery') {
            navigate(`/delivery-dashboard?tab=assigned&id=${result._id}`);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'patient': return <User size={14} />;
            case 'order': return <Package size={14} />;
            case 'record': return <FileText size={14} />;
            case 'appointment': return <Calendar size={14} />;
            default: return <Search size={14} />;
        }
    };

    return (
        <div className="relative w-full max-w-md" ref={searchRef}>
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-500 transition-colors" size={18} />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => results.length > 0 && setShowResults(true)}
                    placeholder={getPlaceholder()}
                    className="w-full bg-[#0a0a0a]/60 backdrop-blur-md border border-white/[0.08] hover:border-emerald-500/30 focus:border-emerald-500/50 rounded-2xl pl-10 pr-16 py-3 text-sm text-gray-200 outline-none transition-all placeholder:text-gray-600 shadow-2xl"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    {!searchTerm && (
                        <span className="hidden sm:block px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[9px] font-black text-gray-600 tracking-tighter uppercase whitespace-nowrap">Alt + S</span>
                    )}
                </div>
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                )}
                {loading && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                        <Spinner size={14} />
                    </div>
                )}
            </div>

            {/* Results Dropdown */}
            {showResults && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-[#111] border border-gray-800 rounded-2xl shadow-2xl p-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {results.map((result, idx) => (
                            <button
                                key={result._id || idx}
                                onClick={() => handleResultClick(result)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors text-left group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center text-gray-500 group-hover:text-green-400 group-hover:bg-green-500/10 transition-colors">
                                    {getIcon(result.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{result.name || result.title || `Order# ${result._id?.slice(-6)}`}</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{result.subtitle || result.type || ''}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                    {results.length >= 5 && (
                        <div className="p-2 border-t border-gray-800 mt-1">
                            <p className="text-[10px] text-center text-gray-600 uppercase tracking-widest">Showing top {results.length} results</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UniversalSearchBar;
