import React, { useState } from 'react';
import { Send, User, Bot, ArrowLeft, HeartPulse, Sparkles, UserCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

interface Chat {
  id: string;
  sender: 'user' | 'doctor';
  text: string;
  time: string;
}

export const Messages = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Chat[]>([
    { id: '1', sender: 'doctor', text: 'Hello, I have reviewed your latest test results. Everything looks good, but please ensure you are staying hydrated.', time: '10:00 AM' },
    { id: '2', sender: 'user', text: 'Thank you Doctor. I will make sure to drink more water.', time: '10:05 AM' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), sender: 'user', text: input.trim(), time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
    ]);
    setInput('');
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white/60 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/50 shadow-lg">
      {/* Sidebar - Chat List */}
      <div className="w-1/3 border-r border-white/50 bg-slate-50/50 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Messages</h2>
          <div className="mt-3 relative">
            <input type="text" placeholder="Search conversations..." className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2 text-sm focus:ring-sky-500 focus:border-sky-500 shadow-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-sky-100 cursor-pointer relative overflow-hidden group transition-all hover:shadow-md">
            <div className="absolute top-0 left-0 w-1 h-full bg-sky-500 rounded-l-xl"></div>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                D
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">Dr. Sarah Smith</h3>
                  <span className="text-xs text-sky-500 font-medium">10:05 AM</span>
                </div>
                <p className="text-xs text-slate-500 truncate">Thank you Doctor. I will make sure...</p>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl border border-transparent hover:bg-white/50 cursor-pointer transition-colors">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
                J
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="text-sm font-medium text-slate-900 truncate">Dr. John Doe</h3>
                  <span className="text-xs text-slate-400">Yesterday</span>
                </div>
                <p className="text-xs text-slate-500 truncate">Your prescription is ready for pickup.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white/40">
        <div className="bg-white/60 backdrop-blur-md border-b border-white/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="md:hidden mr-4 text-slate-400 hover:text-slate-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3 relative shadow-sm">
              <UserCircle className="w-6 h-6 text-indigo-600" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Dr. Sarah Smith</h2>
              <p className="text-xs text-slate-500 font-medium">Cardiologist</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="text-center my-4">
            <span className="bg-slate-100 text-slate-500 text-xs px-3 py-1 rounded-full font-medium">Today</span>
          </div>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[70%] flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-sky-500 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white/80 border-t border-white/50 p-4">
          <form onSubmit={handleSend} className="flex items-center space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-white border border-slate-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 disabled:opacity-50 text-white h-12 w-12 rounded-full flex items-center justify-center transition-all shadow-md"
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
