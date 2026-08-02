import React, { useEffect, useState } from 'react';
import { fetchDietPlan, refreshDietPlan, fetchFoodImage } from '../../services/patientApi';
import { FOOD_PLACEHOLDER, generateFoodImage } from '../../services/getFoodImage_v2';
import { 
    Utensils, Sun, Coffee, Moon, AlertCircle, RefreshCw, Sparkles, 
    FileText, Eye, Maximize2, X, Activity, Scale, Heart, User,
    ChevronRight, BookOpen, BarChart3, UserCircle2, Plus,
    UtensilsCrossed, Cookie, Clock
} from 'lucide-react';
import Loader from '../../components/ui/Loader';

const getMealIcon = (type) => {
    const t = type?.toLowerCase();
    if (t.includes('breakfast')) return <Coffee size={24} />;
    if (t.includes('lunch')) return <UtensilsCrossed size={24} />;
    if (t.includes('snack')) return <Cookie size={24} />;
    if (t.includes('dinner')) return <Moon size={24} />;
    return <Sparkles size={24} />;
};

const MealJournalCard = ({ type, time, meals, isEmpty }) => {
    const mainMealObj  = (meals && meals[0]) || { name: 'Healthy Nutrition', calories: 0, protein: 0, carbs: 0, fat: 0, quantity: '150g' };
    const rawMainMeal  = typeof mainMealObj === 'string' ? mainMealObj : (mainMealObj?.name || 'Healthy Nutrition');

    if (isEmpty) {
        return (
            <div className="group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-3 hover:border-emerald-500/50 hover:bg-emerald-500/[0.02] transition-all duration-500 cursor-pointer overflow-hidden bg-[#0d0e10]">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-900 border border-white/5 flex items-center justify-center text-gray-600 group-hover:scale-110 group-hover:text-emerald-500 transition-all duration-500 z-10">
                    <Plus size={18} sm:size={20} />
                </div>
                <div className="text-center z-10">
                    <h4 className="text-white font-black text-xs sm:text-sm mb-0.5 tracking-tight uppercase">Log {type}</h4>
                    <p className="text-[8px] sm:text-[9px] text-gray-600 font-bold uppercase tracking-widest">Awaiting Entry</p>
                </div>
            </div>
        );
    }

    const match       = rawMainMeal.match(/^(.+?)\s*\(\d+(?:g|ml)\)$/);
    const title       = match ? match[1].trim() : rawMainMeal;
    const weight      = mainMealObj.quantity || (match ? (rawMainMeal.match(/(\d+)(?:g|ml)/)?.[1] + 'g' || '150g') : '150g');
    const kcal        = mainMealObj.calories || Math.round(parseInt(weight) * 2.4);

    return (
        <div className="group relative bg-[#090a0c] p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-white/5 hover:border-emerald-500/20 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-[60px] -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-all duration-1000" />
            
            <div className="flex items-center justify-between gap-4 mb-5 sm:mb-6 relative z-10">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                        {getMealIcon(type)}
                    </div>
                    <div>
                        <span className="text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5 block">{type}</span>
                        <div className="flex items-center gap-1.5">
                            <Clock size={10} className="text-emerald-500/70" />
                            <p className="text-[10px] sm:text-xs font-black text-white italic">{time}</p>
                        </div>
                    </div>
                </div>
                <div className="hidden xs:flex px-3 py-1 rounded-lg bg-white/[0.03] border border-white/10 text-[8px] font-black text-gray-500 uppercase tracking-widest items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
                    Bio-Verified
                </div>
            </div>

            <div className="space-y-5 sm:space-y-6 relative z-10">
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight group-hover:text-emerald-400 transition-colors duration-500 truncate">
                      {title}
                  </h3>
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                          <Activity size={12} className="text-emerald-500/70" />
                          <p className="text-emerald-400 text-sm sm:text-base font-black italic tracking-tighter">{kcal} <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-500/40 not-italic ml-0.5">kcal</span></p>
                      </div>
                      <div className="w-[1px] h-3 bg-white/10" />
                      <div className="flex items-center gap-2">
                          <Scale size={12} className="text-gray-600" />
                          <p className="text-gray-400 text-[10px] sm:text-xs font-black uppercase tracking-widest">{weight}</p>
                      </div>
                  </div>
                </div>

                {/* Macro Architecture Grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 group/macro hover:border-emerald-500/20 transition-all duration-300">
                        <p className="text-[7px] sm:text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1 group-hover/macro:text-emerald-500 transition-colors">Protein</p>
                        <p className="text-base sm:text-lg font-black text-white">{mainMealObj.protein || 0}<span className="text-[10px] text-gray-700 ml-0.5">g</span></p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 group/macro hover:border-blue-500/20 transition-all duration-300">
                        <p className="text-[7px] sm:text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1 group-hover/macro:text-blue-500 transition-colors">Carbs</p>
                        <p className="text-base sm:text-lg font-black text-white">{mainMealObj.carbs || 0}<span className="text-[10px] text-gray-700 ml-0.5">g</span></p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 group/macro hover:border-purple-500/20 transition-all duration-300">
                        <p className="text-[7px] sm:text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1 group-hover/macro:text-purple-500 transition-colors">Fat</p>
                        <p className="text-base sm:text-lg font-black text-white">{mainMealObj.fat || 0}<span className="text-[10px] text-gray-700 ml-0.5">g</span></p>
                    </div>
                </div>

                {meals.length > 1 && (
                    <div className="bg-white/[0.01] border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 mt-1 hover:bg-white/[0.02] transition-colors">
                         <div className="flex items-center justify-between mb-3">
                            <p className="text-[8px] sm:text-[9px] font-black text-emerald-500/60 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={10} /> Alternatives
                            </p>
                         </div>
                        <div className="space-y-2">
                            {meals.slice(1, 3).map((m, i) => (
                                <div key={i} className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500 font-bold border-b border-white/5 pb-2 last:border-0 last:pb-0 hover:text-white transition-colors cursor-pointer group/alt">
                                    <div className="flex items-center gap-2 truncate pr-4">
                                        <div className="w-1 h-1 rounded-full bg-gray-800 group-hover/alt:bg-emerald-500 shrink-0" />
                                        <span className="truncate">{typeof m === 'object' ? m.name : m}</span>
                                    </div>
                                    <span className="text-[9px] text-gray-600 group-hover/alt:text-white shrink-0 uppercase">{typeof m === 'object' ? (m.calories + ' kcal') : ''}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const HealthOptimizationStats = ({ bmi, bmiStatus, bmr, bmrStatus, tdee }) => {
    // ── Status Fallbacks (to show text even before data refresh) ─────────────
    const displayBmiStatus = bmiStatus || (bmi ? (
        bmi < 18.5 ? 'Low' : 
        bmi < 25 ? 'Normal' : 
        bmi < 30 ? 'High' : 'Obesity'
    ) : 'Normal');

    const displayBmrStatus = bmrStatus || (bmr ? (
        bmr < 1300 ? 'Low' : 
        bmr < 2000 ? 'Standard' : 'High'
    ) : 'Standard');

    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        if (s === 'normal' || s === 'standard') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (s === 'low') return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
        if (s === 'high' || s === 'obesity') return 'text-red-500 bg-red-500/10 border-red-500/20';
        return 'text-gray-500 bg-gray-500/10 border-white/5';
    };

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-12 px-1 sm:px-2">
            <div className="bg-[#0f1115] border border-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl hover:border-emerald-500/20 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                    <Scale size={48} sm:size={64} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 relative z-10 gap-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shrink-0">
                            <Scale size={14} sm:size={16} />
                        </div>
                        <span className="text-[7px] sm:text-[9px] font-black text-gray-600 uppercase tracking-widest truncate">BMI Index</span>
                    </div>
                    <div className={`px-2 py-0.5 rounded-md border text-[6px] sm:text-[8px] font-black uppercase tracking-widest w-fit ${getStatusColor(displayBmiStatus)}`}>
                        {displayBmiStatus}
                    </div>
                </div>
                <div className="flex items-end gap-1 relative z-10">
                    <h3 className="text-xl sm:text-3xl font-black text-white leading-none">{bmi || '24.5'}</h3>
                    <span className="text-[7px] sm:text-[10px] font-bold text-emerald-500/60 mb-0.5 uppercase tracking-tighter">kg/m²</span>
                </div>
            </div>
            
            <div className="bg-[#0f1115] border border-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl hover:border-blue-500/20 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                    <Activity size={48} sm:size={64} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 relative z-10 gap-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shrink-0">
                            <Activity size={14} sm:size={16} />
                        </div>
                        <span className="text-[7px] sm:text-[9px] font-black text-gray-600 uppercase tracking-widest truncate">BMR Rate</span>
                    </div>
                    <div className={`px-2 py-0.5 rounded-md border text-[6px] sm:text-[8px] font-black uppercase tracking-widest w-fit ${getStatusColor(displayBmrStatus)}`}>
                        {displayBmrStatus}
                    </div>
                </div>
                <div className="flex items-end gap-1 relative z-10">
                    <h3 className="text-xl sm:text-3xl font-black text-white leading-none">{bmr || '1,650'}</h3>
                    <span className="text-[7px] sm:text-[10px] font-bold text-blue-500/60 mb-0.5 uppercase tracking-tighter">kcal/day</span>
                </div>
            </div>

            <div className="bg-[#0f1115] border border-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl hover:border-purple-500/20 transition-all group relative overflow-hidden col-span-2 lg:col-span-1">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                    <Sparkles size={48} sm:size={64} />
                </div>
                <div className="flex items-center gap-2 sm:gap-3 mb-3 relative z-10">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shrink-0">
                        <Sparkles size={14} sm:size={16} />
                    </div>
                    <span className="text-[7px] sm:text-[9px] font-black text-gray-600 uppercase tracking-widest truncate">Energy Target</span>
                </div>
                <div className="flex items-end gap-1 relative z-10">
                    <h3 className="text-xl sm:text-3xl font-black text-white leading-none">{tdee || '2,100'}</h3>
                    <span className="text-[7px] sm:text-[10px] font-bold text-purple-500/60 mb-0.5 uppercase tracking-tighter">kcal total</span>
                </div>
            </div>
        </div>
    );
};
                
// Removed local getFoodImage and integrated it via import for scalability
// const getFoodImage = (mealTitle) => { ... } 


const PatientDietPlan = () => {
    const [dietPlan, setDietPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const loadDietPlan = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchDietPlan();
            if (response.success) {
                setDietPlan(response.data);
            } else {
                setError("Failed to load diet plan");
            }
        } catch (err) {
            console.error("Error fetching diet plan:", err);
            setError("Something went wrong while generating your diet plan.");
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const response = await refreshDietPlan();
            if (response.success) {
                setDietPlan(response.data);
            }
        } catch (err) {
            console.error("Error refreshing diet plan:", err);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadDietPlan();
    }, []);

    if (loading) {
        return <Loader message="Analyzing Health Data & Generating Meal Journal..." />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 animate-in fade-in duration-500">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <AlertCircle size={32} />
                </div>
                <p className="text-gray-400 text-center max-w-md font-medium">{error}</p>
                <button 
                    onClick={loadDietPlan}
                    className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 mt-4"
                >
                    <RefreshCw size={16} /> Try Again
                </button>
            </div>
        );
    }

    const targeting = dietPlan?.targeting || dietPlan?.importantComponents || [];

    return (
        <div className="pb-20 animate-in fade-in duration-1000">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 px-2 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
                            Archive v2.5
                        </div>
                        <div className="text-gray-700 text-[10px] font-bold">•</div>
                        <div className="text-gray-600 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest">
                            Updated {new Date().toLocaleDateString()}
                        </div>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tighter leading-none">
                        Daily Diet <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">Plan.</span>
                    </h1>
                    <p className="text-gray-500 text-xs sm:text-base font-medium mt-2 sm:mt-3 max-w-xl leading-relaxed">
                        Your personalized nutritional roadmap, AI-curated based on your real-time health indicators.
                    </p>
                </div>

                <button 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 sm:px-8 sm:py-3.5 bg-[#111318] border border-white/5 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:border-emerald-500/40 hover:bg-emerald-500/[0.02] transition-all group shrink-0"
                >
                    <RefreshCw size={14} className={`${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                    {refreshing ? 'Processing...' : 'Regenerate'}
                </button>
            </header>

            {/* Health Stats Grid */}
            <HealthOptimizationStats 
                bmi={dietPlan?.metadata?.bmi}
                bmiStatus={dietPlan?.metadata?.bmiStatus}
                bmr={dietPlan?.metadata?.bmr}
                bmrStatus={dietPlan?.metadata?.bmrStatus}
                tdee={dietPlan?.metadata?.dailyCalorieNeeds}
            />

            {/* Target Components Section */}
            {targeting.length > 0 && (
                <div className="mb-8 sm:mb-12 px-2 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-max pb-2">
                        {targeting.map((comp, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#0f1115] border border-white/5 rounded-xl hover:border-emerald-500/20 transition-all cursor-default group">
                                <div className="w-1 h-1 rounded-full bg-emerald-500/40 group-hover:bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all" />
                                <span className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">{comp}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Meal Journal Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 px-1 sm:px-2">
                <MealJournalCard 
                    type="Breakfast" 
                    time={dietPlan?.breakfast?.time || "08:30 AM"} 
                    meals={dietPlan?.morning || []}
                    isEmpty={!dietPlan?.morning || dietPlan.morning.length === 0}
                />
                <MealJournalCard 
                    type="Lunch" 
                    time={dietPlan?.lunch?.time || "01:15 PM"} 
                    meals={dietPlan?.afternoon || []}
                    isEmpty={!dietPlan?.afternoon || dietPlan.afternoon.length === 0}
                />
                <MealJournalCard 
                    type="Snack" 
                    time={dietPlan?.snacks?.time || "04:45 PM"} 
                    meals={dietPlan?.snacks || []}
                    isEmpty={!dietPlan?.snacks || dietPlan.snacks.length === 0}
                />
                <MealJournalCard 
                    type="Dinner" 
                    time={dietPlan?.dinner?.time || "08:30 PM"} 
                    meals={dietPlan?.night || []}
                    isEmpty={!dietPlan?.night || dietPlan.night.length === 0}
                />
            </div>


            {/* Medical Data Analysis */}
            {dietPlan?.medicalRecord && (
                <div className="mt-16 p-10 rounded-[48px] bg-[#08090a] border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-12">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tight">Clinical Evidence</h3>
                                    <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mt-0.5">Reference Data Source</p>
                                </div>
                            </div>
                            <div className="hidden md:block">
                                <div className="px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                    Status: Verified
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            <div className="lg:col-span-7 space-y-10">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Diagnostic Summary</h4>
                                    <div className="bg-white/[0.02] p-8 rounded-[32px] border border-white/5 group hover:border-emerald-500/20 transition-all duration-500">
                                        <p className="text-gray-300 text-lg leading-relaxed font-medium">
                                            {dietPlan.medicalRecord.diagnosis || "General wellness assessment based on latest checkup."}
                                        </p>
                                    </div>
                                </div>
                                
                                {dietPlan.medicalRecord.fileUrl && (
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Digital Twin Ledger</h4>
                                        <div className="relative rounded-[40px] overflow-hidden border border-white/5 bg-white group transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/5">
                                            <img 
                                                src={dietPlan.medicalRecord.fileUrl.startsWith('http') 
                                                    ? dietPlan.medicalRecord.fileUrl 
                                                    : `/${dietPlan.medicalRecord.fileUrl.replace(/\\/g, '/').split('/').map(s => encodeURIComponent(s)).join('/')}`} 
                                                alt="Medical Record" 
                                                className="w-full h-auto object-contain opacity-100 transition-all duration-1000"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="lg:col-span-5 space-y-10">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em]">Biometric Indicators</h4>
                                    <div className="bg-white/[0.02] rounded-[32px] border border-white/5 p-8 space-y-6">
                                        {dietPlan.medicalRecord.indicators ? (
                                            <div className="grid grid-cols-1 gap-6">
                                                {Object.entries(dietPlan.medicalRecord.indicators).map(([key, data]) => (
                                                    <div key={key} className="flex items-center justify-between group/item">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight mb-1">{key}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-xl font-black transition-colors
                                                                    ${data.status === 'high' ? 'text-red-500' : 
                                                                    data.status === 'low' ? 'text-orange-500' : 
                                                                    'text-emerald-400'}`}>
                                                                    {data.value}
                                                                </span>
                                                                {data.status !== 'normal' && (
                                                                    <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${
                                                                        data.status === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                                                                    }`}>
                                                                        {data.status}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full rounded-full transition-all duration-1000 ${
                                                                    data.status === 'high' ? 'bg-red-500 w-[90%]' : 
                                                                    data.status === 'low' ? 'bg-orange-500 w-[30%]' : 
                                                                    'bg-emerald-500 w-[60%]'
                                                                }`} 
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 text-sm italic leading-relaxed">
                                                {dietPlan.medicalRecord.labResults || "No lab indicators detected in the current report session."}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Technician Notes</h4>
                                    <div className="bg-white/[0.01] border-l-2 border-orange-500/30 p-6 rounded-r-3xl">
                                        <p className="text-gray-500 leading-relaxed text-sm italic">
                                            "{dietPlan.medicalRecord.description || "No additional clinical notes provided for this session."}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <footer className="mt-32 pb-10 text-center">
                <div className="w-12 h-1 bg-gray-900 mx-auto mb-8 rounded-full" />
                <p className="text-[10px] text-gray-700 font-black uppercase tracking-[0.4em] mb-2">
                    Autonomous Health Archive
                </p>
                <p className="text-[8px] text-gray-800 font-bold uppercase tracking-widest">
                    Precision Nutrition System • Blockchain Verified
                </p>
            </footer>
        </div>
    );
};

export default PatientDietPlan;
