export const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
  ];

export const PRIORITIES = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-500' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-600', dot: 'bg-orange-500' },
  urgent: { label: 'Urgent', color: 'bg-rose-100 text-rose-600', dot: 'bg-rose-600' },
};
