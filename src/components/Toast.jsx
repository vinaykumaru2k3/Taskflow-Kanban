import { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'error', onClose, toastId }) => {
  useEffect(() => {
    // [fix] Empty dep array: run once on mount. Previously [onClose] caused
    // the timer to reset on every App re-render because onClose was a new
    // inline arrow function each render — toasts would NEVER auto-dismiss.
    const timer = setTimeout(() => onClose(toastId), 4000);
    return () => clearTimeout(timer);
  }, []);

  const containerStyle = 'bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-zinc-100 border-slate-200/80 dark:border-zinc-800 shadow-xl shadow-slate-100/40 dark:shadow-zinc-950/65';
  
  const accentBorder = type === 'success' 
    ? 'border-l-4 border-l-emerald-500' 
    : type === 'warning'
    ? 'border-l-4 border-l-amber-500'
    : 'border-l-4 border-l-rose-500';

  const iconColor = type === 'success' 
    ? 'text-emerald-500' 
    : type === 'warning'
    ? 'text-amber-500'
    : 'text-rose-500';

  const Icon = type === 'success' 
    ? CheckCircle2 
    : type === 'warning'
    ? AlertTriangle
    : AlertCircle;

  return (
    <div className={`flex items-center gap-3 pl-3 pr-4 py-3.5 border rounded-xl backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300 ${containerStyle} ${accentBorder}`}>
      <Icon size={16} className={`flex-shrink-0 ${iconColor}`} />
      <span className="text-xs font-bold flex-1 leading-snug">{message}</span>
      <button onClick={() => onClose(toastId)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5 rounded transition-all active:scale-90 flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
