import React from 'react';
import { Mail, MessageCircle, AlertTriangle, Phone, LifeBuoy, Send, Layers, ArrowLeft } from 'lucide-react';

export default function Support({ onBack }) {
  return (
    <div className="max-w-4xl mx-auto h-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {onBack && (
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors w-fit group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to Board
        </button>
      )}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/50 dark:border-slate-800/60 p-8 md:p-12 shadow-sm relative overflow-hidden text-center">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 shadow-sm">
            <LifeBuoy size={32} />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
            How can we support you?
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            Our technical support team is available 24/7. Whether you found a bug, need help navigating features, or want to discuss enterprise options.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Support Form */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/50 dark:border-slate-800/60 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <MessageCircle size={20} className="text-slate-400" />
            Send a Request
          </h2>
          <form className="space-y-4" onSubmit={e => e.preventDefault()}>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject</label>
              <input required type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:border-emerald-500 outline-none transition-all shadow-sm" placeholder="e.g. Can't invite new user" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
              <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-emerald-500 outline-none transition-all cursor-pointer shadow-sm">
                <option>Technical Support</option>
                <option>Billing Question</option>
                <option>Bug Report</option>
                <option>Feature Request</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
              <textarea required rows="4" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 outline-none transition-all shadow-sm resize-none" placeholder="Provide as much detail as possible..." />
            </div>
            <button className="w-full bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md">
              <Send size={16} /> Submit Ticket
            </button>
          </form>
        </div>

        {/* Contact info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/50 dark:border-slate-800/60 p-8 shadow-sm group hover:-translate-y-1 transition-all hover:border-blue-500/30">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <Mail size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Email Us</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              We respond to all standard inquiries within 24 hours. Enterprise customers get priority 1hr SLA.
            </p>
            <a href="mailto:support@taskflow.dev" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">support@taskflow.dev</a>
          </div>

          <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/50 dark:border-slate-800/60 p-8 shadow-sm group hover:-translate-y-1 transition-all hover:border-amber-500/30">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Live Outages</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Check our status page for any ongoing incidents before submitting a network error ticket.
            </p>
            <a href="#" className="text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
