import React, { useState } from 'react';
import { Apple, Utensils, HeartPulse, Activity, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const DietPlan = () => {
  const { user } = useAuthStore();
  const [preferences, setPreferences] = useState('vegetarian');
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);

  const generatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/ai/diet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ preferences })
      });
      const data = await res.json();
      if (data.success) {
        setPlan(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl p-8 text-white shadow-xl shadow-orange-500/20 flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">AI Diet Recommendations</h1>
          <p className="text-orange-50 opacity-90 max-w-md">
            Get a personalized nutrition plan tailored to your body metrics, medical conditions, and lifestyle.
          </p>
        </div>
        <div className="hidden md:flex h-24 w-24 bg-white/20 backdrop-blur-md rounded-2xl items-center justify-center relative z-10 border border-white/30 shadow-inner">
          <Utensils className="w-12 h-12 text-white drop-shadow-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Activity className="w-5 h-5 text-orange-500 mr-2" />
            Your Profile
          </h2>
          <form onSubmit={generatePlan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dietary Preference</label>
              <select 
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 bg-white/80 focus:ring-orange-500 focus:border-orange-500 shadow-sm"
              >
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="keto">Keto</option>
                <option value="paleo">Paleo</option>
                <option value="non-vegetarian">Non-Vegetarian</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Health Goal</label>
              <select className="w-full rounded-xl border border-slate-200 px-4 py-2.5 bg-white/80 focus:ring-orange-500 focus:border-orange-500 shadow-sm">
                <option>Weight Loss</option>
                <option>Muscle Gain</option>
                <option>Maintenance</option>
                <option>Manage Diabetes</option>
              </select>
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center"
            >
              {loading ? 'Generating...' : 'Generate Plan'}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-h-[400px]">
          {plan ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4">
                <Apple className="w-6 h-6 text-green-500 mr-2" />
                Your Recommended Plan
              </h2>
              <div className="prose prose-orange prose-sm max-w-none text-slate-700">
                <div className="whitespace-pre-wrap leading-relaxed p-4 bg-orange-50/50 rounded-xl border border-orange-100/50">
                  {plan}
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between bg-sky-50 p-4 rounded-xl border border-sky-100">
                <div className="flex items-center text-sky-800 text-sm">
                  <HeartPulse className="w-5 h-5 text-sky-500 mr-2" />
                  <strong>Hydration Reminder:</strong> Drink at least 8 glasses of water today.
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Utensils className="w-10 h-10 text-slate-300" />
              </div>
              <p>Configure your profile and click Generate Plan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
