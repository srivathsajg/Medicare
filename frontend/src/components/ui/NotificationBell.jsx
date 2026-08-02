import React from 'react';
import { Bell } from 'lucide-react';

const NotificationBell = ({ count = 0, onClick, title = 'Notifications' }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="relative text-gray-400 hover:text-white transition-colors"
  >
    <Bell size={20} />
    {count > 0 && (
      <span className="absolute -top-1 -right-1 min-w-[18px] h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center px-1.5">
        {count > 99 ? '99+' : count}
      </span>
    )}
  </button>
);

export default NotificationBell;
