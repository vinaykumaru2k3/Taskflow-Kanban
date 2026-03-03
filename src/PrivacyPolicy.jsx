import React from 'react';
import { Shield, Eye, Lock, Users, Mail, ChevronRight, ArrowLeft, Cookie } from 'lucide-react';

const SECTIONS = [
  {
    icon: Shield,
    title: 'Introduction',
    content: 'TaskFlow ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, disclosed, and safeguarded by TaskFlow when you use our Kanban board application.'
  },
  {
    icon: Eye,
    title: 'Information We Collect',
    content: 'We collect information you provide directly to us, including:\n\n• Account information (name, email address) when you sign up\n• Task data (titles, descriptions, priorities, deadlines) you create\n• Team collaboration data (comments, assignments)\n• Usage data and preferences'
  },
  {
    icon: Lock,
    title: 'How We Use Your Information',
    content: 'We use the information we collect to:\n\n• Provide, maintain, and improve our services\n• Process transactions and send related information\n• Send you technical notices, updates, and support messages\n• Respond to your comments, questions, and requests\n• Communicate with you about products, services, and events'
  },
  {
    icon: Users,
    title: 'Data Sharing & Disclosure',
    content: 'We do not sell, trade, or otherwise transfer your personal information to outside parties. We may share information with:\n\n• Service providers who assist in our operations\n• Law enforcement when required by law\n• Business transfers in connection with mergers or acquisitions'
  },
  {
    icon: Cookie,
    title: 'Cookies & Tracking',
    content: 'We use cookies and similar tracking technologies to:\n\n• Keep you logged in\n• Understand your preferences\n• Analyze traffic and usage patterns\n• Improve our services\n\nYou can instruct your browser to refuse all cookies.'
  },
  {
    icon: Mail,
    title: 'Contact Us',
    content: 'If you have any questions about this Privacy Policy, please contact us at:\n\nsupport@taskflow.example.com'
  }
];

export default function PrivacyPolicy({ onBack }) {
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
      
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/50 dark:border-slate-800/60 p-8 md:p-12 shadow-sm relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest text-xs">
            <Shield size={16} />
            Privacy Policy
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
            Your Privacy Matters
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg mb-8 leading-relaxed">
            Learn how TaskFlow collects, uses, and protects your personal information.
          </p>
          <div className="text-sm text-slate-400 dark:text-slate-500">
            Last updated: March 2026
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {SECTIONS.map((section, idx) => (
          <div key={idx} className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/50 dark:border-slate-800/60 p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md flex-shrink-0">
                <section.icon size={20} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {section.title}
                </h2>
                <div className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
