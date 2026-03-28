import { ArrowUpRight } from 'lucide-react';
import { Card } from './Card';

export function StatCard({ title, value, trend, icon: Icon, accent }) {
  return (
    <Card className='group overflow-hidden p-0'>
      <div className='relative p-6'>
        <div
          className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accent} opacity-90 transition-opacity duration-300 group-hover:opacity-100`}
        />
        <div className='flex items-start justify-between gap-4'>
          <div>
            <p className='text-sm font-medium text-slate-500 dark:text-slate-300'>{title}</p>
            <h3 className='mt-4 font-display text-4xl font-bold text-slate-900 dark:text-white'>
              {value}
            </h3>
            <p className='mt-3 inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300'>
              <ArrowUpRight className='h-4 w-4 text-success' />
              {trend}
            </p>
          </div>
          <div className={`rounded-2xl bg-gradient-to-br ${accent} p-3 text-white shadow-lg`}>
            <Icon className='h-5 w-5' />
          </div>
        </div>
      </div>
    </Card>
  );
}
