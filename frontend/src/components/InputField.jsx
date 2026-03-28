import { cn } from '../utils/cn';

export function InputField({
  label,
  icon: Icon,
  textarea = false,
  options,
  className,
  hint,
  ...props
}) {
  const sharedClassName = cn(
    'w-full rounded-2xl border border-primary/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 input-glow dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500',
    Icon && 'pl-11',
    className,
  );

  return (
    <label className='block space-y-2'>
      {label ? (
        <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>{label}</span>
      ) : null}
      <div className='relative'>
        {Icon ? (
          <Icon className='pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400 dark:text-slate-500' />
        ) : null}
        {textarea ? (
          <textarea className={cn(sharedClassName, 'min-h-[140px] resize-none')} {...props} />
        ) : options ? (
          <select className={sharedClassName} {...props}>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input className={sharedClassName} {...props} />
        )}
      </div>
      {hint ? <p className='text-xs text-slate-500 dark:text-slate-400'>{hint}</p> : null}
    </label>
  );
}
