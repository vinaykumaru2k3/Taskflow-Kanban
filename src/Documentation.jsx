import React, { useState } from 'react';
import { Book, FileText, Zap, Shield, ChevronRight, Search, Code, CheckCircle2, ArrowLeft, ChevronDown } from 'lucide-react';

const DOC_SECTIONS = [
  {
    id: 'getting-started',
    icon: Zap,
    title: 'Getting Started',
    desc: 'Learn the basics of TaskFlow and set up your first board in minutes.',
    color: 'bg-blue-500',
    links: [
      { title: 'Quick Start Guide', content: 'Welcome to TaskFlow! To get started:\n\n1. Create your first board by clicking the "+" button\n2. Add columns like "To Do", "In Progress", "Done"\n3. Create tasks by clicking "+ Add Task" in any column\n4. Drag and drop tasks between columns\n5. Invite team members to collaborate' },
      { title: 'Creating Your First Board', content: 'Boards help you organize tasks into workflows.\n\n1. Click "New Board" in the sidebar\n2. Name your board (e.g., "Marketing Campaign")\n3. Customize columns based on your workflow\n4. Start adding tasks!' },
      { title: 'Inviting Team Members', content: 'Collaboration is key!\n\n1. Open your board settings\n2. Click "Invite Members"\n3. Enter their email addresses\n4. Choose their role (Admin, Member, or Viewer)\n5. They\'ll receive an invitation email' }
    ]
  },
  {
    id: 'task-management',
    icon: CheckCircle2,
    title: 'Task Management',
    desc: 'Master the core loop of creating, assigning, and tracking tasks.',
    color: 'bg-emerald-500',
    links: [
      { title: 'Using Priorities', content: 'Set task priorities to focus on what matters:\n\n• Urgent: Needs immediate attention\n• High: Important for current sprint\n• Medium: Standard priority\n• Low: Can be addressed later\n\nPriority indicators appear as colored dots on tasks.' },
      { title: 'Status Workflows', content: 'Track progress through workflow stages:\n\n• To Do: Newly created tasks\n• In Progress: Currently being worked on\n• Review: Awaiting review or feedback\n• Done: Completed tasks\n\nDrag tasks between columns to update status.' },
      { title: 'Checklists & Subtasks', content: 'Break down complex tasks:\n\n1. Open any task\n2. Add a checklist with "+ Add Checklist"\n3. Add items to your checklist\n4. Check off items as you complete them\n\nGreat for tracking multi-step processes!' }
    ]
  },
  {
    id: 'access-security',
    icon: Shield,
    title: 'Access & Security',
    desc: 'Understand role-based access control and organizational security.',
    color: 'bg-purple-500',
    links: [
      { title: 'Roles & Permissions', content: 'TaskFlow offers three roles:\n\n• Admin: Full access, can manage billing\n• Member: Can create/edit tasks and boards\n• Viewer: Read-only access to assigned boards\n\nRole-based access keeps your data secure.' },
      { title: 'Sharing Boards Safely', content: 'When sharing boards:\n\n• Only invite people who need access\n• Use "Viewer" role for stakeholders\n• Review team members regularly\n• Remove inactive members promptly' },
      { title: 'Data Privacy', content: 'Your data is protected:\n\n• All data is encrypted in transit\n• Firebase provides enterprise-grade security\n• Review our Privacy Policy for details\n• Contact support for security concerns' }
    ]
  },
  {
    id: 'developer-api',
    icon: Code,
    title: 'Developer API',
    desc: 'Integrate TaskFlow directly into your own systems and webhooks.',
    color: 'bg-slate-700',
    links: [
      { title: 'Authentication', content: 'API authentication uses Firebase Auth.\n\nInclude your token in requests:\nAuthorization: Bearer YOUR_TOKEN\n\nCheck Firebase docs for token generation.' },
      { title: 'REST Endpoints', content: 'Core API endpoints:\n\n• GET /tasks - List all tasks\n• POST /tasks - Create new task\n• PUT /tasks/:id - Update task\n• DELETE /tasks/:id - Delete task\n\nMore endpoints coming soon!' },
      { title: 'Rate Limits', content: 'API rate limits ensure fair usage:\n\n• 100 requests per minute per user\n• 1000 requests per minute per board\n\nExceeding limits returns 429 status.' }
    ]
  }
];

export default function Documentation({ onBack }) {
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedLink, setExpandedLink] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
    setExpandedLink(null);
  };

  const toggleLink = (linkTitle) => {
    setExpandedLink(expandedLink === linkTitle ? null : linkTitle);
  };

  // Filter sections based on search
  const filteredSections = DOC_SECTIONS.map(section => ({
    ...section,
    links: section.links.filter(link => 
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.links.length > 0 || searchQuery === '');

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#0a0f1c] focus:border-blue-500/50 outline-none transition-all shadow-sm" 
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {filteredSections.map((section, idx) => (
          <div key={idx} className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/50 dark:border-slate-800/60 p-8 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all group">
            <button 
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center gap-4 mb-4"
            >
              <div className={`w-10 h-10 rounded-xl ${section.color} text-white flex items-center justify-center shadow-md`}>
                <section.icon size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex-1 text-left">{section.title}</h2>
              <ChevronDown 
                size={20} 
                className={`text-slate-400 transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`}
              />
            </button>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              {section.desc}
            </p>
            
            {/* Expandable links */}
            <div className={`space-y-2 overflow-hidden transition-all ${expandedSection === section.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {section.links.map((link, lidx) => (
                <div key={lidx} className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                  <button 
                    onClick={() => toggleLink(link.title)}
                    className="flex items-center justify-between w-full group/link py-2"
                  >
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors text-left">
                      {link.title}
                    </span>
                    <ChevronDown 
                      size={14} 
                      className={`text-slate-300 dark:text-slate-600 group-hover/link:text-blue-500 transition-all ${expandedLink === link.title ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div className={`overflow-hidden transition-all ${expandedLink === link.title ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed py-2 pl-2 border-l-2 border-blue-200 dark:border-blue-800 whitespace-pre-line">
                      {link.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
