export const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
  ];

export const PRIORITIES = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400', border: 'border-slate-400' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-500', border: 'border-blue-500' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-600', dot: 'bg-orange-500', border: 'border-orange-500' },
  urgent: { label: 'Urgent', color: 'bg-rose-100 text-rose-600', dot: 'bg-rose-600', border: 'border-rose-600' },
};

export const TAG_COLORS = [
  { id: 'slate', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
  { id: 'blue', bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300' },
  { id: 'green', bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-300' },
  { id: 'yellow', bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-300' },
  { id: 'orange', bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-300' },
  { id: 'red', bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-300' },
  { id: 'purple', bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-300' },
  { id: 'pink', bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-300' },
];

export const DEFAULT_TAGS = [
  { id: 'bug', label: 'Bug', colorId: 'red' },
  { id: 'feature', label: 'Feature', colorId: 'blue' },
  { id: 'enhancement', label: 'Enhancement', colorId: 'purple' },
  { id: 'documentation', label: 'Docs', colorId: 'yellow' },
  { id: 'urgent', label: 'Urgent', colorId: 'orange' },
  { id: 'wontfix', label: 'Wont Fix', colorId: 'slate' },
];
