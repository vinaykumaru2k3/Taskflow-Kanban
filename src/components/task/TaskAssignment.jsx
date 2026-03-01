import React, { useState } from 'react';
import { UserPlus, Check, X, ChevronDown, Search } from 'lucide-react';
import { ROLES } from '../../lib/permissions';

const TaskAssignment = ({ 
  collaborators, 
  currentAssignment, 
  onAssign, 
  onRemove,
  canAssign = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const assignedUser = collaborators.find(c => c.uid === currentAssignment);

  const filteredCollaborators = collaborators.filter(c => 
    c.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (user) => {
    onAssign(user.uid);
    setIsOpen(false);
    setSearch('');
  };

  if (!canAssign) {
    // Display only mode
    return (
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
          <UserPlus size={12} /> Assigned To
        </label>
        {assignedUser ? (
          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            {assignedUser.photoURL ? (
              <img 
                src={assignedUser.photoURL} 
                alt={assignedUser.displayName}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs">
                {assignedUser.displayName?.charAt(0) || '?'}
              </div>
            )}
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {assignedUser.displayName || assignedUser.email}
            </span>
          </div>
        ) : (
          <div className="text-sm text-slate-400 italic">
            No one assigned
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
        <UserPlus size={12} /> Assigned To
      </label>
      
      <div className="relative">
        {/* Current Assignment Display */}
        {assignedUser ? (
          <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              {assignedUser.photoURL ? (
                <img 
                  src={assignedUser.photoURL} 
                  alt={assignedUser.displayName}
                  className="w-7 h-7 rounded-full"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs">
                  {assignedUser.displayName?.charAt(0) || '?'}
                </div>
              )}
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {assignedUser.displayName || assignedUser.email}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 hover:bg-slate-200 dark:bg-slate-700 rounded transition-colors"
              >
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => onRemove()}
                className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-500 rounded transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:border-slate-300 dark:border-slate-600 hover:text-slate-500 dark:text-slate-400 transition-colors"
          >
            <UserPlus size={16} />
            <span className="text-sm font-semibold">Assign someone</span>
          </button>
        )}

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search collaborators..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-300"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto">
              {filteredCollaborators.length === 0 ? (
                <div className="py-4 text-center text-sm text-slate-400">
                  No collaborators found
                </div>
              ) : (
                filteredCollaborators.map((collab) => (
                  <button
                    key={collab.uid}
                    onClick={() => handleSelect(collab)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
                  >
                    {collab.photoURL ? (
                      <img 
                        src={collab.photoURL} 
                        alt={collab.displayName}
                        className="w-7 h-7 rounded-full"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs">
                        {collab.displayName?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {collab.displayName || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {collab.email}
                      </p>
                    </div>
                    {currentAssignment === collab.uid && (
                      <Check size={16} className="text-green-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskAssignment;
