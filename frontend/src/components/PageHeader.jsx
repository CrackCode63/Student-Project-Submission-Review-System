import { motion } from 'framer-motion';

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className='mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'
    >
      <div className='max-w-2xl'>
        {eyebrow ? (
          <p className='mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary/80'>
            {eyebrow}
          </p>
        ) : null}
        <h1 className='font-display text-3xl font-bold text-slate-900 dark:text-white md:text-4xl'>
          {title}
        </h1>
        <p className='mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300 md:text-base'>
          {description}
        </p>
      </div>
      {actions ? <div className='flex items-center gap-3'>{actions}</div> : null}
    </motion.div>
  );
}
