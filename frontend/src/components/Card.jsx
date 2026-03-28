import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

export function Card({ children, className, hover = true, ...props }) {
  return (
    <motion.div
      whileHover={hover ? { y: -6, boxShadow: '0 24px 70px rgba(15, 23, 42, 0.14)' } : undefined}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className={cn('glass-panel rounded-[28px] p-6', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
