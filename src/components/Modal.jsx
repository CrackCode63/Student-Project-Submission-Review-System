import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';

export function Modal({ open, title, description, onClose, children, footer }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm'
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className='glass-panel w-full max-w-2xl rounded-[30px] p-6'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='mb-6 flex items-start justify-between gap-4'>
              <div>
                <h3 className='font-display text-2xl font-semibold text-slate-900 dark:text-white'>
                  {title}
                </h3>
                {description ? (
                  <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>{description}</p>
                ) : null}
              </div>
              <Button variant='ghost' className='h-10 w-10 rounded-full p-0' onClick={onClose}>
                <X className='h-4 w-4' />
              </Button>
            </div>
            <div className='space-y-5'>{children}</div>
            {footer ? <div className='mt-6'>{footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
