import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X, Send, Stethoscope, User, RefreshCw,
    ExternalLink, Zap, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { Spinner } from './Loader';
import { useAuth } from '../../context/AuthContext';

/* ─── Conversation Tree ─────────────────────────────────────────────── */
const FLOWS = {
    root: {
        text: (name) => {
            const hour = new Date().getHours();
            let greeting = 'Hi';
            if (hour < 12) greeting = 'Good morning';
            else if (hour < 17) greeting = 'Good afternoon';
            else greeting = 'Good evening';
            return `${greeting}${name ? `, ${name}` : ''}! I'm MediCare Assist, your personal support for all medical needs. How can I help you today?`;
        },
        options: [
            { label: '📅 Book an appointment', next: 'book_appointment' },
            { label: '📋 View my records', next: 'records' },
            { label: '🥗 My Diet Plan', next: 'diet_plan' },
            { label: '🔬 Lab Tests', next: 'lab_tests' },
            { label: '💊 Prescriptions', next: 'prescriptions' },
            { label: '🛡️ Insurance', next: 'insurance' },
            { label: '🔔 Reminders', next: 'reminders' },
            { label: '💳 Billing', next: 'billing' },
            { label: '⚕️ I have symptoms', next: 'symptoms' },
        ]
    },
    book_appointment: {
        text: () => "I'd be happy to help you book an appointment! 📅\n\nTo get started, which of these applies to you?",
        options: [
            { label: 'Know doctor name', next: 'book_by_name' },
            { label: 'Know specialty needed', next: 'book_by_specialty' },
            { label: 'Have symptoms to discuss', next: 'symptoms' },
            { label: 'Book health checkup', next: 'book_checkup' },
        ]
    },
    book_by_name: {
        text: () => "Great! You can search for your doctor directly in the Appointments page. I'll take you there now! 🏥",
        nav: { label: 'Go to Appointments', path: '/patient-dashboard/appointments' },
        options: [{ label: '🏠 Back to main menu', next: 'root' }]
    },
    book_by_specialty: {
        text: () => "Which specialty do you need?",
        options: [
            { label: '🫀 Cardiologist', next: 'nav_specialty', specialty: 'Cardiologist' },
            { label: '🦷 Dentist', next: 'nav_specialty', specialty: 'Dentist' },
            { label: '🧠 Neurologist', next: 'nav_specialty', specialty: 'Neurologist' },
            { label: '🦴 Orthopedist', next: 'nav_specialty', specialty: 'Orthopedist' },
            { label: '👶 Pediatrician', next: 'nav_specialty', specialty: 'Pediatrician' },
            { label: '🩺 General Physician', next: 'nav_specialty', specialty: 'General Physician' },
            { label: '🌸 Gynecologist', next: 'nav_specialty', specialty: 'Gynecologist' },
            { label: '🌿 Dermatologist', next: 'nav_specialty', specialty: 'Dermatologist' },
        ]
    },
    nav_specialty: {
        text: (_, specialty) => `Finding you a ${specialty}! I'll open the appointments page filtered for you. 🔍`,
        nav: { label: 'Browse Doctors', path: '/patient-dashboard/appointments' },
        options: [{ label: '🏠 Back to main menu', next: 'root' }]
    },
    book_checkup: {
        text: () => "Great! I'll help you find the right health checkup package. 🩺\n\nI'll take you to the appointments page where you can search for General Physicians who do checkups.",
        nav: { label: 'Book Health Checkup', path: '/patient-dashboard/appointments' },
        options: [{ label: '🏠 Back to main menu', next: 'root' }]
    },
    records: {
        text: () => "Your medical records and lab results are securely stored. What would you like to do?",
        options: [
            { label: '📁 View all records', next: 'nav_records' },
            { label: '🏠 Back to main menu', next: 'root' },
        ]
    },
    nav_records: {
        text: () => "Taking you to your Medical Records now! 📂",
        nav: { label: 'Open Medical Records', path: '/patient-dashboard/records' },
        options: [{ label: '🏠 Back to main menu', next: 'root' }]
    },
    prescriptions: {
        text: () => "Your active prescriptions and medication schedules are available in the prescriptions section.",
        nav: { label: 'View Prescriptions', path: '/patient-dashboard/prescriptions' },
        options: [{ label: '🏠 Back to main menu', next: 'root' }]
    },
    insurance: {
        text: () => "I can help you with your insurance details, claim status, and policy management.",
        nav: { label: 'Manage Insurance', path: '/patient-dashboard/insurance' },
        options: [{ label: '🏠 Back to main menu', next: 'root' }]
    },
    reminders: {
        text: () => "Your medication reminders and appointment alerts are set up to keep you on track. 🔔",
        nav: { label: 'View Reminders', path: '/patient-dashboard/reminders' },
        options: [{ label: '🏠 Back to main menu', next: 'root' }]
    },
    symptoms: {
        text: () => "I understand. Please select what best describes your situation:",
        options: [
            { label: '❤️ Chest / Heart', next: 'symptom_heart' },
            { label: '🦴 Bone / Joint pain', next: 'symptom_bone' },
            { label: '🌡️ Fever / Cold / Flu', next: 'symptom_fever' },
            { label: '🧠 Headache / Dizziness', next: 'symptom_head' },
            { label: '🌿 Skin / Rash / Allergy', next: 'symptom_skin' },
            { label: '🦷 Dental / Teeth', next: 'symptom_dental' },
            { label: '👶 Child health', next: 'symptom_child' },
            { label: '🩺 General / Other', next: 'nav_specialty', specialty: 'General Physician' },
        ]
    },
    symptom_heart: {
        text: () => "Heart-related symptoms require immediate attention. I recommend consulting a Cardiologist. Would you like to book now? ❤️",
        nav: { label: 'Book Cardiologist', path: '/patient-dashboard/appointments', specialty: 'Cardiologist' },
        options: [{ label: '🏠 Back to main menu', next: 'root' }]
    },
    symptom_bone: {
        text: () => "For bone or joint concerns, an Orthopedic specialist is the right choice. 🦴",
        nav: { label: 'Book Orthopedist', path: '/patient-dashboard/appointments', specialty: 'Orthopedist' },
        options: [{ label: '🏠 Back to main menu', next: 'root' }]
    },
    symptom_fever: {
        text: () => "Fever or flu symptoms are best evaluated by a General Physician first. 🌡️",
        nav: { label: 'Book General Physician', path: '/patient-dashboard/appointments', specialty: 'General Physician' },
        options: [{ label: '🏠 Back to main menu', next: 'root' }]
    },
    symptom_head: {
        text: () => "Persistent headaches or dizziness should be checked by a Neurologist. 🧠",
        nav: { label: 'Book Neurologist', path: '/patient-dashboard/appointments', specialty: 'Neurologist' },
        options: [{ label: '🏠 Back to main menu', next: 'root' }]
    },
    symptom_skin: {
        text: () => "Skin, rash, or allergy concerns are best handled by a Dermatologist. 🌿",
        nav: { label: 'Book Dermatologist', path: '/patient-dashboard/appointments', specialty: 'Dermatologist' },
        options: [{ label: '🏠 Back to main menu', next: 'root' }]
    },
    symptom_dental: {
        text: () => "For dental pain or tooth concerns, you need to see a Dentist. 🦷",
        nav: { label: 'Book Dentist', path: '/patient-dashboard/appointments', specialty: 'Dentist' },
        options: [{ label: '🏠 Back to main menu', next: 'root' }]
    },
    symptom_child: {
        text: () => "Child health concerns are handled by a Pediatrician — specialists trained specifically for children. 👶",
        nav: { label: 'Book Pediatrician', path: '/patient-dashboard/appointments', specialty: 'Pediatrician' },
        options: [{ label: '🏠 Back to main menu', next: 'root' }]
    },
    diet_plan: {
        text: () => "I can help you with your personalized diet plan based on your health indicators. Would you like to view it now? 🥗",
        nav: { label: 'View My Diet Plan', path: '/patient-dashboard/diet-plan' },
        options: [{ label: '🏠 Back to main menu', next: 'root' }]
    },
    lab_tests: {
        text: () => "You can view your lab test results or book new ones here. 🔬",
        nav: { label: 'View Lab Tests', path: '/patient-dashboard/lab-tests' },
        options: [{ label: '🏠 Back to main menu', next: 'root' }]
    },
    billing: {
        text: () => "View your bills, payment history, and pending payments. 💳",
        nav: { label: 'View My Billing', path: '/patient-dashboard/billing' },
        options: [{ label: '🏠 Back to main menu', next: 'root' }]
    },
    settings: {
        text: () => "Manage your profile, account settings, and preferences. ⚙️",
        nav: { label: 'Open Settings', path: '/patient-dashboard/settings' },
        options: [{ label: '🏠 Back to main menu', next: 'root' }]
    },
    fallback: {
        text: () => "I'm not sure about that, but I can help you with a variety of tasks! Please choose an option or try different keywords.",
        options: [
            { label: '🏠 Back to main menu', next: 'root' },
            { label: '📅 Book appointment', next: 'book_appointment' },
            { label: '🥗 Diet Plan', next: 'diet_plan' },
        ]
    }
};

/* ─── Main Component ─────────────────────────────────────────────────── */
const AIAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            pushBotMessage('root');
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const pushBotMessage = (flowKey, specialty = null) => {
        const flow = FLOWS[flowKey];
        if (!flow) return;

        const name = user?.name ? user.name.split(' ')[0] : '';
        const text = typeof flow.text === 'function' ? flow.text(name, specialty) : flow.text;

        const msg = {
            id: Date.now(),
            type: 'bot',
            text,
            options: flow.options || [],
            nav: flow.nav || null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, msg]);
    };

    const handleOption = (opt) => {
        // Add user bubble
        const userMsg = {
            id: Date.now(),
            type: 'user',
            text: opt.label,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        setTimeout(() => {
            setIsTyping(false);
            const specialty = opt.specialty || null;
            const flow = FLOWS[opt.next];

            if (flow) {
                const name = user?.name ? user.name.split(' ')[0] : '';
                const text = typeof flow.text === 'function' ? flow.text(name, specialty) : flow.text;
                const navTarget = flow.nav
                    ? { ...flow.nav, specialty: specialty || flow.nav.specialty }
                    : null;

                const botMsg = {
                    id: Date.now() + 1,
                    type: 'bot',
                    text,
                    options: flow.options || [],
                    nav: navTarget,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, botMsg]);
            }
        }, 700);
    };

    const handleNav = (nav) => {
        navigate(nav.path, nav.specialty ? { state: { specialty: nav.specialty } } : undefined);
        setIsOpen(false);
    };

    const handleReset = () => {
        setMessages([]);
        pushBotMessage('root');
    };

    const handleTypedMessage = (e) => {
        e.preventDefault();
        const text = inputMessage.trim();
        if (!text || isTyping) return;
        setInputMessage('');

        // Add user bubble
        const userMsg = {
            id: Date.now(),
            type: 'user',
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        // Keyword-to-flow routing
        const lower = text.toLowerCase();
        let targetFlow = 'fallback';
        let specialty = null;

        // Smart keyword mapping
        const keywordMap = [
            { flow: 'book_appointment', keywords: ['appointment', 'book', 'schedule', 'doctor', 'visit', 'consultation'] },
            { flow: 'nav_records', keywords: ['record', 'result', 'lab', 'report', 'history', 'medical data'] },
            { flow: 'prescriptions', keywords: ['prescription', 'medicine', 'drug', 'tablet', 'pill', 'dosage'] },
            { flow: 'insurance', keywords: ['insurance', 'policy', 'claim', 'coverage', 'provider'] },
            { flow: 'reminders', keywords: ['reminder', 'alert', 'notification', 'alarm', 'medication time'] },
            { flow: 'diet_plan', keywords: ['diet', 'food', 'nutrition', 'meal', 'eating', 'calories', 'weight', 'health plan'] },
            { flow: 'lab_tests', keywords: ['test', 'blood', 'urine', 'scan', 'report', 'lab results', 'checkup'] },
            { flow: 'billing', keywords: ['bill', 'payment', 'invoice', 'cost', 'money', 'transaction', 'paid'] },
            { flow: 'settings', keywords: ['setting', 'profile', 'account', 'password', 'edit', 'preferences'] },
            { flow: 'symptom_heart', keywords: ['heart', 'chest', 'cardiac', 'pulse', 'bp', 'blood pressure'] },
            { flow: 'symptom_bone', keywords: ['bone', 'joint', 'fracture', 'ortho', 'back pain', 'knee'] },
            { flow: 'symptom_fever', keywords: ['fever', 'cold', 'flu', 'cough', 'headache', 'sick'] },
            { flow: 'symptom_skin', keywords: ['skin', 'rash', 'allergy', 'itch', 'dermatology'] },
            { flow: 'symptom_dental', keywords: ['tooth', 'dental', 'teeth', 'gum', 'dentist'] },
            { flow: 'symptom_child', keywords: ['child', 'baby', 'pediatric', 'kid', 'son', 'daughter'] }
        ];

        for (const entry of keywordMap) {
            if (entry.keywords.some(k => lower.includes(k))) {
                targetFlow = entry.flow;
                break;
            }
        }

        // Special handling for Cardiologist/Heart
        if (targetFlow === 'symptom_heart') specialty = 'Cardiologist';

        setTimeout(() => {
            setIsTyping(false);
            if (targetFlow === 'fallback') {
                const botMsg = {
                    id: Date.now() + 1,
                    type: 'bot',
                    text: `I'm not sure about that, but I can help you with:\n• Booking appointments\n• Viewing records or prescriptions\n• Personalized Diet Plans\n• Lab Test results\n• Insurance & Billing\n\nOr pick an option below:`,
                    options: FLOWS.root.options,
                    nav: null,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, botMsg]);
            } else {
                const flow = FLOWS[targetFlow];
                if (flow) {
                    const name = user?.name ? user.name.split(' ')[0] : '';
                    const botText = typeof flow.text === 'function' ? flow.text(name, specialty) : flow.text;
                    const navTarget = flow.nav ? { ...flow.nav, specialty: specialty || flow.nav.specialty } : null;
                    const botMsg = {
                        id: Date.now() + 1,
                        type: 'bot',
                        text: botText,
                        options: flow.options || [],
                        nav: navTarget,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                    setMessages(prev => [...prev, botMsg]);
                }
            }
        }, 800);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] font-sans pointer-events-none">
            {/* ── Chat Window ── */}
            {isOpen && (
                <div className="absolute bottom-24 right-0 w-[380px] h-[600px] bg-[#0b0e14]/98 backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden pointer-events-auto ring-1 ring-white/10"
                    style={{ animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
                >
                    {/* Header */}
                    <header className="p-5 bg-gradient-to-br from-[#10b981] via-[#059669] to-[#047857] flex items-center justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-[40px] -mr-16 -mt-16 pointer-events-none" />
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-3xl flex items-center justify-center border border-white/20 shadow-xl">
                                <Stethoscope size={22} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-[15px] tracking-tight flex items-center gap-2">
                                    MediCare Assist
                                    <span className="text-[9px] bg-black/30 px-1.5 py-0.5 rounded-md text-emerald-300 border border-emerald-500/20 font-black uppercase tracking-widest">Live</span>
                                </h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                                    <span className="text-[10px] text-emerald-50/70 font-bold uppercase tracking-[0.15em]">Always here for you</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 relative z-10">
                            <button onClick={handleReset} title="Restart" className="p-2 rounded-xl bg-black/10 hover:bg-black/20 text-white/70 hover:text-white border border-white/10 transition-all">
                                <RefreshCw size={15} />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl bg-black/10 hover:bg-black/20 text-white/70 hover:text-white border border-white/10 transition-all">
                                <X size={18} />
                            </button>
                        </div>
                    </header>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2.5 max-w-[90%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center border ${
                                        msg.type === 'user'
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                            : 'bg-white/5 border-white/10 text-emerald-400'
                                    }`}>
                                        {msg.type === 'user' ? <User size={14} /> : <Zap size={13} className="animate-pulse" />}
                                    </div>

                                    <div className="space-y-2 min-w-0">
                                        {/* Bubble */}
                                        <div className={`px-4 py-3 rounded-[20px] text-[13px] leading-relaxed whitespace-pre-line ${
                                            msg.type === 'user'
                                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-tr-none'
                                                : 'bg-white/[0.05] border border-white/10 text-gray-200 rounded-tl-none'
                                        }`}>
                                            {msg.text}
                                            <div className={`text-[9px] mt-1.5 font-semibold opacity-40 ${msg.type === 'user' ? 'text-right' : ''}`}>
                                                {msg.timestamp}
                                            </div>
                                        </div>

                                        {/* Nav button */}
                                        {msg.type === 'bot' && msg.nav && (
                                            <button
                                                onClick={() => handleNav(msg.nav)}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-2xl text-[12px] font-bold transition-all active:scale-95 group"
                                            >
                                                <ExternalLink size={13} className="group-hover:rotate-12 transition-transform" />
                                                {msg.nav.label}
                                            </button>
                                        )}

                                        {/* Option chips */}
                                        {msg.type === 'bot' && msg.options && msg.options.length > 0 && (
                                            <div className="space-y-1.5 pt-1">
                                                {msg === messages[messages.length - 1] ? (
                                                    // Only last bot message shows clickable options
                                                    msg.options.map((opt, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleOption(opt)}
                                                            className="w-full text-left px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-emerald-500/10 hover:border-emerald-500/30 text-gray-300 hover:text-emerald-300 text-[12px] font-medium transition-all active:scale-[0.98]"
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))
                                                ) : (
                                                    // Past options show as greyed label
                                                    <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider px-1">Option selected ✓</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Feedback (only on last bot msg) */}
                                        {msg.type === 'bot' && msg === messages[messages.length - 1] && !msg.options?.length && (
                                            <div className="flex items-center gap-2 pt-1">
                                                <span className="text-[10px] text-gray-600">Was this helpful?</span>
                                                <button className="text-gray-600 hover:text-emerald-400 transition-colors"><ThumbsUp size={13} /></button>
                                                <button className="text-gray-600 hover:text-red-400 transition-colors"><ThumbsDown size={13} /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-[#1a1d23] border border-white/[0.04] p-4 rounded-2xl flex items-center gap-3">
                                    <Spinner size={16} />
                                    <span className="text-xs text-emerald-500/60 font-medium animate-pulse">Assistant is thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Text Input Bar */}
                    <div className="px-4 py-4 bg-[#0b0e14] border-t border-white/5">
                        <form onSubmit={handleTypedMessage} className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputMessage}
                                onChange={e => setInputMessage(e.target.value)}
                                placeholder="Or type your question..."
                                className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-emerald-500/40 focus:bg-white/[0.06] transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!inputMessage.trim() || isTyping}
                                className={`w-10 h-10 flex items-center justify-center rounded-2xl flex-shrink-0 transition-all ${
                                    inputMessage.trim() && !isTyping
                                        ? 'bg-emerald-500 text-white hover:bg-emerald-400 active:scale-90 shadow-lg shadow-emerald-900/20'
                                        : 'bg-white/5 text-gray-700'
                                }`}
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── FAB ── */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group pointer-events-auto relative w-16 h-16 rounded-[22px] flex items-center justify-center transition-all duration-500 shadow-2xl overflow-hidden border border-white/10
                    ${isOpen
                        ? 'bg-gradient-to-br from-rose-500 to-red-600 rotate-90'
                        : 'bg-[#10b981] hover:rounded-[28px] hover:scale-105 active:scale-95 shadow-emerald-500/30'
                    }
                `}
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {isOpen ? (
                    <X size={28} className="text-white relative z-10" />
                ) : (
                    <div className="relative">
                        <Stethoscope size={28} className="text-white relative z-10 group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_white]" />
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-[#10b981] rounded-full animate-ping" />
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-[#10b981] rounded-full shadow-lg" />
                    </div>
                )}
            </button>

            <style>{`
                @keyframes popIn {
                    from { opacity: 0; transform: scale(0.85) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default AIAssistant;
