import { cn } from '../utils/cn';

const badgeStyles = {
  Pending: 'bg-warning/15 text-warning border-warning/20',
  Approved: 'bg-success/15 text-success border-success/20',
  Deleted: 'bg-slate-500/10 text-slate-600 border-slate-300/30 dark:text-slate-200',
  Verified: 'bg-success/15 text-success border-success/20',
  Rejected: 'bg-danger/15 text-danger border-danger/20',
  'Not Requested': 'bg-slate-500/10 text-slate-600 border-slate-300/30 dark:text-slate-200',
  'Changes Required': 'bg-danger/15 text-danger border-danger/20',
  Active: 'bg-success/15 text-success border-success/20',
  Available: 'bg-accent/15 text-accent border-accent/20',
  'In Review': 'bg-warning/15 text-warning border-warning/20',
  'On Track': 'bg-success/15 text-success border-success/20',
  'Review Due': 'bg-warning/15 text-warning border-warning/20',
  'Needs Support': 'bg-danger/15 text-danger border-danger/20',
  Excellent: 'bg-primary/15 text-primary border-primary/20',
  High: 'bg-danger/15 text-danger border-danger/20',
  Medium: 'bg-warning/15 text-warning border-warning/20',
  Normal: 'bg-primary/15 text-primary border-primary/20',
  Team: 'bg-primary/15 text-primary border-primary/20',
  Individual: 'bg-accent/15 text-accent border-accent/20',
  Unassigned: 'bg-slate-500/10 text-slate-600 border-slate-300/30 dark:text-slate-200',
};

export function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide',
        badgeStyles[status] || 'bg-slate-500/10 text-slate-600 border-slate-300/30 dark:text-slate-200',
        className,
      )}
    >
      {status}
    </span>
  );
}
