export const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
  ];

export const PRIORITIES = {
  low: { label: 'Low', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400', dot: 'bg-slate-400 dark:bg-slate-500', border: 'border-slate-400 dark:border-slate-700' },
  medium: { label: 'Medium', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', dot: 'bg-blue-500 dark:bg-blue-400', border: 'border-blue-500 dark:border-slate-700' },
  high: { label: 'High', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400', dot: 'bg-orange-500 dark:bg-orange-400', border: 'border-orange-500 dark:border-slate-700' },
  urgent: { label: 'Urgent', color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400', dot: 'bg-rose-600 dark:bg-rose-500', border: 'border-rose-600 dark:border-slate-700' },
};

export const TAG_COLORS = [
  { id: 'slate', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-300 dark:border-slate-700' },
  { id: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-300 dark:border-blue-800' },
  { id: 'green', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-300 dark:border-emerald-800' },
  { id: 'yellow', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-800' },
  { id: 'orange', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-300 dark:border-orange-800' },
  { id: 'red', bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-300 dark:border-rose-800' },
  { id: 'purple', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-300 dark:border-purple-800' },
  { id: 'pink', bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-300 dark:border-pink-800' },
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
  owner: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  admin: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  editor: 'bg-green-100 text-green-700 border-green-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  viewer: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
};
