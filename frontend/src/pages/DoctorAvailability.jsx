import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { fetchAvailability, createAvailability, deleteAvailability } from '../services/doctorApi';
import { Plus, Trash2, X, RotateCcw, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const locales = { 'en-US': undefined };
const localizer = dateFnsLocalizer({
  format, parse, startOfWeek, getDay, locales,
});

const DEFAULT_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00"
];

const DoctorAvailability = () => {
  const [availability, setAvailability] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newSlots, setNewSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewDate, setViewDate] = useState(new Date()); // Track current calendar view

  const CustomToolbar = ({ label, onNavigate }) => {
    return (
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <CalendarIcon className="text-emerald-500 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{label}</h2>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Availability Management</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-inner">
          <button
            onClick={() => onNavigate('PREV')}
            className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => onNavigate('TODAY')}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all border border-white/5"
          >
            Today
          </button>
          <button
            onClick={() => onNavigate('NEXT')}
            className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  const CustomDateHeader = ({ label, date, onDrillDown }) => {
    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    return (
      <div className="flex flex-col items-center py-2 group cursor-pointer" onClick={onDrillDown}>
        <span className={`text-sm font-black transition-all ${isToday ? 'text-emerald-500 scale-110' : 'text-gray-500 group-hover:text-gray-300'}`}>
          {label}
        </span>
        {isToday && <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1 animate-pulse" />}
      </div>
    );
  };

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      const res = await fetchAvailability();
      if (res.success) setAvailability(res.availability);
    } catch (err) {
      console.error(err);
    }
  };

  const events = useMemo(() => {
    // 1. Get explicit events from backend
    const explicitEvents = availability.flatMap(day => 
      day.slots.map(slot => {
        const start = new Date(`${day.date}T${slot.time}`);
        const end = new Date(start.getTime() + 30 * 60 * 1000); 
        return {
          id: `${day._id}-${slot.time}`,
          title: slot.isBooked ? 'Booked' : 'Available',
          start,
          end,
          resource: { ...slot, date: day.date, parentId: day._id, isDefault: false },
        };
      })
    );

    // 2. Generate default events for days without explicit availability
    // Generate for current view month +/- 1 month to be safe
    const start = startOfMonth(addDays(viewDate, -30)); 
    const end = endOfMonth(addDays(viewDate, 30));
    
    const allDays = eachDayOfInterval({ start, end });
    const defaultEvents = [];

    const explicitDates = new Set(availability.map(a => a.date));

    allDays.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        if (!explicitDates.has(dateStr)) {
            // Add default slots
            DEFAULT_SLOTS.forEach(time => {
                const s = new Date(`${dateStr}T${time}`);
                const e = new Date(s.getTime() + 30 * 60 * 1000);
                defaultEvents.push({
                    id: `default-${dateStr}-${time}`,
                    title: 'Available (Default)',
                    start: s,
                    end: e,
                    resource: { time, isBooked: false, date: dateStr, isDefault: true }
                });
            });
        }
    });

    return [...explicitEvents, ...defaultEvents];
  }, [availability, viewDate]);

  const eventStyleGetter = (event) => {
    const isDefault = event.resource.isDefault;
    const isBooked = event.resource.isBooked;
    
    let backgroundColor = 'rgba(16, 185, 129, 0.1)'; // Green 500 at 0.1
    let textColor = '#10b981';
    let borderColor = 'rgba(16, 185, 129, 0.2)';

    if (isBooked) {
      backgroundColor = 'rgba(239, 68, 68, 0.1)';
      textColor = '#ef4444';
      borderColor = 'rgba(239, 68, 68, 0.2)';
    } else if (isDefault) {
      backgroundColor = 'rgba(59, 130, 246, 0.1)';
      textColor = '#3b82f6';
      borderColor = 'rgba(59, 130, 246, 0.2)';
    }

    const style = {
      backgroundColor,
      borderRadius: '8px',
      color: textColor,
      border: `1px solid ${borderColor}`,
      display: 'block',
      fontSize: '9px',
      fontWeight: '900',
      padding: '2px 6px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginTop: '2px',
      transition: 'all 0.2s ease'
    };
    return { style };
  };

  const handleSelectSlot = ({ start }) => {
    const dateStr = format(start, 'yyyy-MM-dd');
    setSelectedDate(dateStr);
    
    // Check if we have an existing record for this date
    const existing = availability.find(a => a.date === dateStr);
    
    if (existing) {
        setNewSlots(existing.slots.map(s => s.time));
    } else {
        // Pre-fill with default slots
        setNewSlots([...DEFAULT_SLOTS]);
    }
    
    setIsModalOpen(true);
  };

  const handleAddSlot = () => {
    setNewSlots([...newSlots, "09:00"]);
  };

  const handleSlotChange = (index, value) => {
    const updated = [...newSlots];
    updated[index] = value;
    setNewSlots(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await createAvailability({ date: selectedDate, slots: newSlots });
      await loadAvailability();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
      if(window.confirm("This will mark you as UNAVAILABLE for the entire day. Continue?")) {
          setNewSlots([]);
      }
  };

  const handleResetToDefault = async () => {
      if(!window.confirm("Reset to default schedule (9 AM - 5 PM)?")) return;
      
      const existing = availability.find(a => a.date === selectedDate);
      if (existing) {
          setLoading(true);
          try {
              await deleteAvailability(existing._id);
              await loadAvailability();
              setIsModalOpen(false);
          } catch(err) {
              console.error(err);
          } finally {
              setLoading(false);
          }
      } else {
          // Already default, just close
          setIsModalOpen(false);
      }
  };

  return (
    <div className="bg-[#0a0a0a] min-h-full flex flex-col p-4">
      <div className="bg-[#111] border border-gray-800 rounded-[32px] p-8 h-[800px] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative z-10">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Default Schedule</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Custom Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Booked Slots</span>
            </div>
          </div>
          <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] bg-white/5 px-4 py-2 rounded-full border border-white/5">
            Interactive Calendar Node v2.0
          </div>
        </div>

        <div className="flex-1 relative z-10 doctor-availability-calendar">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            selectable
            onSelectSlot={handleSelectSlot}
            eventPropGetter={eventStyleGetter}
            onNavigate={(date) => setViewDate(date)} // Track view changes
            onSelectEvent={(event) => handleSelectSlot({ start: event.start })}
            components={{
              toolbar: CustomToolbar,
              month: {
                dateHeader: CustomDateHeader
              }
            }}
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .doctor-availability-calendar .rbc-month-view {
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          border-radius: 24px !important;
          background: rgba(255, 255, 255, 0.02) !important;
          overflow: hidden;
        }
        .doctor-availability-calendar .rbc-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          padding: 15px 0 !important;
          font-size: 10px !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.2em !important;
          color: #4b5563 !important;
        }
        .doctor-availability-calendar .rbc-day-bg {
          border-left: 1px solid rgba(255, 255, 255, 0.05) !important;
          transition: all 0.2s ease;
        }
        .doctor-availability-calendar .rbc-day-bg:hover {
          background: rgba(255, 255, 255, 0.03) !important;
        }
        .doctor-availability-calendar .rbc-today {
          background: rgba(16, 185, 129, 0.03) !important;
        }
        .doctor-availability-calendar .rbc-month-row {
          border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        .doctor-availability-calendar .rbc-off-range-bg {
          background: transparent !important;
          opacity: 0.3;
        }
        .doctor-availability-calendar .rbc-event {
          padding: 0 !important;
          background: none !important;
        }
        .doctor-availability-calendar .rbc-show-more {
          background: rgba(255, 255, 255, 0.05) !important;
          color: #9ca3af !important;
          font-size: 9px !important;
          font-weight: 900 !important;
          padding: 2px 8px !important;
          border-radius: 6px !important;
          margin-top: 4px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}} />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Edit Slots for {selectedDate}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400 hover:text-white" /></button>
            </div>
            
            <div className="flex gap-2 mb-4">
                <button onClick={handleResetToDefault} className="flex-1 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-medium hover:bg-blue-600/30 flex items-center justify-center gap-2">
                    <RotateCcw size={14} /> Reset to Default
                </button>
                <button onClick={handleClearAll} className="flex-1 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-600/30 flex items-center justify-center gap-2">
                    <Trash2 size={14} /> Mark as Holiday
                </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {newSlots.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 italic border border-dashed border-gray-800 rounded-lg">
                      No slots available (Holiday/Busy)
                  </div>
              ) : (
                  newSlots.map((slot, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="time"
                        value={slot}
                        onChange={(e) => handleSlotChange(i, e.target.value)}
                        className="flex-1 bg-[#111] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                      <button onClick={() => setNewSlots(newSlots.filter((_, idx) => idx !== i))} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
              )}
              
              <button onClick={handleAddSlot} className="w-full py-2 border border-dashed border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 flex items-center justify-center gap-2 mt-2">
                <Plus size={16} /> Add Slot
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/5">Cancel</button>
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Availability'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAvailability;
