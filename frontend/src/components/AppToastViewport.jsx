import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const toneConfig = {
  success: {
    icon: CheckCircle2,
    iconClassName: 'text-success',
  },
  error: {
    icon: AlertCircle,
    iconClassName: 'text-danger',
  },
  info: {
    icon: Info,
    iconClassName: 'text-primary',
  },
};

export function AppToastViewport({ toasts, onDismiss }) {
  return (
    <div className='pointer-events-none fixed right-4 top-4 z-[80] flex w-full max-w-sm flex-col gap-3'>
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = toneConfig[toast.tone] || toneConfig.info;
          const Icon = config.icon;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className='pointer-events-auto glass-panel rounded-[24px] p-4 shadow-glass'
            >
              <div className='flex items-start gap-3'>
                <div className={`mt-0.5 ${config.iconClassName}`}>
                  <Icon className='h-5 w-5' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='font-semibold text-slate-900 dark:text-white'>{toast.title}</p>
                  <p className='mt-1 text-sm text-slate-500 dark:text-slate-300'>{toast.message}</p>
                </div>
                <button
                  type='button'
                  className='rounded-full p-1 text-slate-400 transition hover:bg-slate-900/5 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white'
                  onClick={() => onDismiss(toast.id)}
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
