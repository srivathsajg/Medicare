import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, ArrowLeft, HeartPulse, Sparkles, UserCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

interface Chat {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
}

interface Contact {
  _id: string;
  name: string;
  role: string;
  specialization?: string;
}

export const Messages = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch('/api/messages/contacts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setContacts(data.data);
          if (data.data.length > 0) {
            setActiveContact(data.data[0]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchContacts();
  }, [token]);

  useEffect(() => {
    if (!activeContact) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages/${activeContact._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setMessages(data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMessages();
  }, [activeContact, token]);

  useEffect(() => {
    const newSocket = io({
      auth: { token }
    });

    newSocket.on('receiveMessage', (message: Chat) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('messageSent', (message: Chat) => {
      setMessages(prev => [...prev, message]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket || !activeContact) return;
    
    socket.emit('sendMessage', {
      receiverId: activeContact._id,
      text: input.trim()
    });
    
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
          {contacts.map(contact => (
            <div 
              key={contact._id}
              onClick={() => setActiveContact(contact)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                activeContact?._id === contact._id 
                  ? 'bg-white shadow-sm border-sky-200 relative overflow-hidden group' 
                  : 'border-transparent hover:bg-white/50'
              }`}
            >
              {activeContact?._id === contact._id && (
                <div className="absolute top-0 left-0 w-1 h-full bg-sky-500 rounded-l-xl"></div>
              )}
              <div className="flex items-center space-x-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                  activeContact?._id === contact._id ? 'bg-indigo-100 text-indigo-600' : 'bg-sky-100 text-sky-600'
                }`}>
                  {contact.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {contact.role === 'doctor' ? `Dr. ${contact.name}` : contact.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {contact.specialization || 'Patient'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white/40">
        {activeContact ? (
          <>
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
                  <h2 className="text-lg font-bold text-slate-900">
                    {activeContact.role === 'doctor' ? `Dr. ${activeContact.name}` : activeContact.name}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">{activeContact.specialization || 'Patient'}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="text-center my-4">
                <span className="bg-slate-100 text-slate-500 text-xs px-3 py-1 rounded-full font-medium">Today</span>
              </div>
              {messages.map((msg) => {
                const isUser = msg.senderId === user?.id;
                return (
                  <div key={msg._id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[70%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                        isUser 
                          ? 'bg-sky-500 text-white rounded-tr-none' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
};
