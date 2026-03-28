import { GraduationCap } from 'lucide-react';
import { cn } from '../utils/cn';

export function LogoMark({ collapsed = false }) {
  return (
    <div className='flex items-center gap-3'>
      <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow'>
        <GraduationCap className='h-5 w-5' />
      </div>
      <div className={cn('transition-all duration-300', collapsed && 'hidden')}>
        <p className='font-display text-base font-bold text-slate-900 dark:text-white'>Project Review</p>
        <p className='text-xs text-slate-500 dark:text-slate-300'>Student Submission System</p>
      </div>
    </div>
  );
}
