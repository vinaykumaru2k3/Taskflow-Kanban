import React from 'react';
import { Shield, UserPlus, MoreHorizontal } from 'lucide-react';
import { getRoleLabel, getRoleColor, ROLES } from '../../lib/permissions';

const CollaboratorList = ({ 
  collaborators, 
  onInvite, 
  onRemove, 
  onRoleChange,
  canManage = false,
  maxDisplay = 3 
}) => {
  const displayCollaborators = collaborators.slice(0, maxDisplay);
  const remainingCount = collaborators.length - maxDisplay;

  return (
    <div className="flex items-center">
      {/* Avatar Stack */}
      <div className="flex -space-x-2">
        {displayCollaborators.map((collab, index) => (
          <div
            key={collab.uid}
            className="relative group"
            title={`${collab.displayName || collab.email} (${getRoleLabel(collab.role)})`}
          >
            {collab.photoURL ? (
              <img
                src={collab.photoURL}
                alt={collab.displayName}
                className="w-8 h-8 rounded-full border-2 border-white ring-2 ring-slate-100"
              />
            ) : (
              <div className="w-8 h-8 rounded-full border-2 border-white ring-2 ring-slate-100 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                {collab.displayName?.charAt(0) || collab.email?.charAt(0) || '?'}
              </div>
            )}
            
            {/* Role indicator dot */}
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
              collab.role === ROLES.OWNER ? 'bg-purple-500' :
              collab.role === ROLES.ADMIN ? 'bg-blue-500' :
              collab.role === ROLES.EDITOR ? 'bg-green-500' : 'bg-slate-400'
            }`} />
          </div>
        ))}
        
        {/* Remaining count */}
        {remainingCount > 0 && (
          <div className="w-8 h-8 rounded-full border-2 border-white ring-2 ring-slate-100 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-[10px]">
            +{remainingCount}
          </div>
        )}
      </div>

      {/* Invite Button */}
      {canManage && (
        <button
          onClick={onInvite}
          className="ml-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors"
          title="Invite collaborators"
        >
          <UserPlus size={16} />
        </button>
      )}
    </div>
  );
};

// Compact version for displaying in task cards
export const TaskCollaborators = ({ creator, assignee }) => {
  const users = [creator, assignee].filter(Boolean);
  
  if (users.length === 0) return null;

  return (
    <div className="flex items-center -space-x-1">
      {users.map((user, index) => (
        <div
          key={user.uid || index}
          className="relative group"
          title={user.displayName || user.email}
        >
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-5 h-5 rounded-full border border-white"
            />
          ) : (
            <div className="w-5 h-5 rounded-full border border-white bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-[8px]">
              {user.displayName?.charAt(0) || '?'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CollaboratorList;
