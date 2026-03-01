import React from 'react';
import { Book, FileText, Zap, Shield, ChevronRight, Search, Code, CheckCircle2, ArrowLeft } from 'lucide-react';

const DOC_SECTIONS = [
  {
    icon: Zap,
    title: 'Getting Started',
    desc: 'Learn the basics of TaskFlow and set up your first board in minutes.',
    color: 'bg-blue-500',
    links: ['Quick Start Guide', 'Creating Your First Board', 'Inviting Team Members']
  },
  {
    icon: CheckCircle2,
    title: 'Task Management',
    desc: 'Master the core loop of creating, assigning, and tracking tasks.',
    color: 'bg-emerald-500',
    links: ['Using Priorities', 'Status Workflows', 'Checklists & Subtasks']
  },
  {
    icon: Shield,
    title: 'Access & Security',
    desc: 'Understand role-based access control and organizational security.',
    color: 'bg-purple-500',
    links: ['Roles & Permissions', 'Sharing Boards Safely', 'Data Privacy']
  },
  {
    icon: Code,
    title: 'Developer API',
    desc: 'Integrate TaskFlow directly into your own systems and webhooks.',
    color: 'bg-slate-700',
    links: ['Authentication', 'REST Endpoints', 'Rate Limits']
  }
];

export default function Documentation({ onBack }) {
  return (
    <div className="max-w-5xl mx-auto h-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {onBack && (
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors w-fit group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to Board
        </button>
      )}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/50 dark:border-slate-800/60 p-8 md:p-12 shadow-sm relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-6 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest text-xs">
            <Book size={16} />
            Knowledge Base
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
            How can we help you build faster?
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg mb-8 leading-relaxed">
            Everything you need to know about the TaskFlow platform. Read our extensive guides, API references, and best practices.
          </p>
          
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search documentation..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#0a0f1c] focus:border-blue-500/50 outline-none transition-all shadow-sm" 
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {DOC_SECTIONS.map((section, idx) => (
          <div key={idx} className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/50 dark:border-slate-800/60 p-8 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all group">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-10 h-10 rounded-xl ${section.color} text-white flex items-center justify-center shadow-md`}>
                <section.icon size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{section.title}</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed min-h-[40px]">
              {section.desc}
            </p>
            <div className="space-y-3">
              {section.links.map((link, lidx) => (
                <a key={lidx} href="#" className="flex items-center justify-between group/link">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors">
                    {link}
                  </span>
                  <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover/link:text-blue-500 group-hover/link:translate-x-1 transition-all" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
