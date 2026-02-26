export const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
  ];

export const PRIORITIES = {
  low: { 
    label: 'Low', 
    color: 'bg-slate-100 text-slate-500', 
    dot: 'bg-slate-400', 
    border: 'border-slate-400',
    darkColor: 'dark:bg-slate-700 dark:text-slate-400',
    darkDot: 'dark:bg-slate-500',
    darkBorder: 'dark:border-slate-600',
  },
  medium: { 
    label: 'Medium', 
    color: 'bg-blue-100 text-blue-600', 
    dot: 'bg-blue-500', 
    border: 'border-blue-500',
    darkColor: 'dark:bg-blue-900/50 dark:text-blue-400',
    darkDot: 'dark:bg-blue-500',
    darkBorder: 'dark:border-blue-500',
  },
  high: { 
    label: 'High', 
    color: 'bg-orange-100 text-orange-600', 
    dot: 'bg-orange-500', 
    border: 'border-orange-500',
    darkColor: 'dark:bg-orange-900/50 dark:text-orange-400',
    darkDot: 'dark:bg-orange-500',
    darkBorder: 'dark:border-orange-500',
  },
  urgent: { 
    label: 'Urgent', 
    color: 'bg-rose-100 text-rose-600', 
    dot: 'bg-rose-600', 
    border: 'border-rose-600',
    darkColor: 'dark:bg-rose-900/50 dark:text-rose-400',
    darkDot: 'dark:bg-rose-500',
    darkBorder: 'dark:border-rose-500',
  },
};

export const TAG_COLORS = [
  { id: 'slate', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', darkBg: 'dark:bg-slate-700', darkText: 'dark:text-slate-300', darkBorder: 'dark:border-slate-600' },
  { id: 'blue', bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300', darkBg: 'dark:bg-blue-900/50', darkText: 'dark:text-blue-300', darkBorder: 'dark:border-blue-700' },
  { id: 'green', bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-300', darkBg: 'dark:bg-emerald-900/50', darkText: 'dark:text-emerald-300', darkBorder: 'dark:border-emerald-700' },
  { id: 'yellow', bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-300', darkBg: 'dark:bg-amber-900/50', darkText: 'dark:text-amber-300', darkBorder: 'dark:border-amber-700' },
  { id: 'orange', bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-300', darkBg: 'dark:bg-orange-900/50', darkText: 'dark:text-orange-300', darkBorder: 'dark:border-orange-700' },
  { id: 'red', bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-300', darkBg: 'dark:bg-rose-900/50', darkText: 'dark:text-rose-300', darkBorder: 'dark:border-rose-700' },
  { id: 'purple', bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-300', darkBg: 'dark:bg-purple-900/50', darkText: 'dark:text-purple-300', darkBorder: 'dark:border-purple-700' },
  { id: 'pink', bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-300', darkBg: 'dark:bg-pink-900/50', darkText: 'dark:text-pink-300', darkBorder: 'dark:border-pink-700' },
];

export const DEFAULT_TAGS = [
  { id: 'bug', label: 'Bug', colorId: 'red' },
  { id: 'feature', label: 'Feature', colorId: 'blue' },
  { id: 'enhancement', label: 'Enhancement', colorId: 'purple' },
  { id: 'documentation', label: 'Docs', colorId: 'yellow' },
  { id: 'urgent', label: 'Urgent', colorId: 'orange' },
  { id: 'wontfix', label: 'Wont Fix', colorId: 'slate' },
];

// Collaboration roles
export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

export const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer'
};

export const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-700 border-purple-300',
  admin: 'bg-blue-100 text-blue-700 border-blue-300',
  editor: 'bg-green-100 text-green-700 border-green-300',
  viewer: 'bg-slate-100 text-slate-600 border-slate-300'
};
