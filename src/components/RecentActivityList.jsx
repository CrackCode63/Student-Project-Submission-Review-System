import { Card } from './Card';
import { StatusBadge } from './StatusBadge';

export function RecentActivityList({ title, description, items }) {
  return (
    <Card className='space-y-5'>
      <div>
        <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>{title}</h3>
        <p className='mt-1 text-sm text-slate-500 dark:text-slate-300'>{description}</p>
      </div>
      <div className='space-y-4'>
        {items.map((item) => (
          <div
            key={`${item.title}-${item.meta}`}
            className='surface-panel flex items-center justify-between gap-4 rounded-2xl px-4 py-4'
          >
            <div>
              <p className='font-medium text-slate-900 dark:text-white'>{item.title}</p>
              <p className='mt-1 text-sm text-slate-500 dark:text-slate-300'>{item.meta}</p>
            </div>
            <StatusBadge status={item.status} />
          </div>
        ))}
      </div>
    </Card>
  );
}
