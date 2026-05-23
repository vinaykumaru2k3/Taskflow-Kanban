import React, { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'error', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgStyle = type === 'success' 
    ? 'bg-emerald-600 dark:bg-emerald-950 border-emerald-500 text-white dark:text-emerald-300 shadow-emerald-500/10' 
    : type === 'warning'
    ? 'bg-amber-600 dark:bg-amber-950 border-amber-500 text-white dark:text-amber-300 shadow-amber-500/10'
    : 'bg-rose-600 dark:bg-rose-950 border-rose-500 text-white dark:text-rose-300 shadow-rose-500/10';

  const Icon = type === 'success' 
    ? CheckCircle2 
    : type === 'warning'
    ? AlertTriangle
    : AlertCircle;

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 border rounded-xl shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300 ${bgStyle}`}>
      <Icon size={16} className="flex-shrink-0" />
      <span className="text-xs font-bold flex-1 leading-snug">{message}</span>
      <button onClick={onClose} className="hover:opacity-75 p-0.5 rounded transition-all active:scale-90 flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
