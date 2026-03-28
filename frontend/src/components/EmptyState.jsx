import { Card } from './Card';
import { Button } from './Button';

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <Card className='flex flex-col items-center justify-center rounded-[30px] px-6 py-10 text-center' hover={false}>
      {Icon ? (
        <div className='mb-4 inline-flex rounded-2xl bg-primary/10 p-4 text-primary'>
          <Icon className='h-6 w-6' />
        </div>
      ) : null}
      <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>{title}</h3>
      <p className='mt-3 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-300'>{description}</p>
      {actionLabel && onAction ? (
        <div className='mt-6'>
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </Card>
  );
}
