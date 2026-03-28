import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { getNavigationForRole } from '../utils/roles';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../utils/cn';
import { LogoMark } from './LogoMark';
import { StatusBadge } from './StatusBadge';

function getWorkspaceCopy(role) {
  if (role === 'mentor') {
    return {
      title: 'Mentor Review Suite',
      description: 'Review submissions, publish marks, and keep verification approvals moving.',
      healthLabel: 'High',
      healthPercent: '84%',
      healthText: '84% of active review items are within the expected turnaround window.',
    };
  }

  if (role === 'admin') {
    return {
      title: 'Admin Control Center',
      description: 'Track users, teams, mentors, and delivery health from one clean workspace.',
      healthLabel: 'Stable',
      healthPercent: '88%',
      healthText: '88% of tracked records already have valid mentor alignment.',
    };
  }

  return {
    title: 'Student Delivery Hub',
    description: 'Submit polished versions, manage your team, and stay ready for mentor review.',
    healthLabel: 'On Track',
    healthPercent: '91%',
    healthText: '91% of submission milestones are currently on schedule.',
  };
}

function SidebarLinks({ collapsed, onNavigate }) {
  const { user } = useAuth();
  const items = getNavigationForRole(user?.role);

  return (
    <div className='space-y-2'>
      {items.map(({ label, icon: Icon, to }) => (
        <NavLink key={to} to={to} title={label} onClick={onNavigate}>
          {({ isActive }) => (
            <motion.div
              whileHover={{ x: 4 }}
              className={cn(
                'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300',
                isActive
                  ? 'bg-brand-gradient text-white shadow-glow'
                  : 'text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white',
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-white' : 'text-primary')} />
              <span className={cn('transition-all duration-300', collapsed && 'hidden')}>{label}</span>
            </motion.div>
          )}
        </NavLink>
      ))}
    </div>
  );
}

function SidebarBody({ collapsed, onNavigate, mobile = false, onCloseMobile }) {
  const { user } = useAuth();
  const workspaceCopy = getWorkspaceCopy(user?.role);

  return (
    <div className='flex h-full flex-col justify-between p-4'>
      <div>
        <div className='mb-8 flex items-center justify-between'>
          <LogoMark collapsed={collapsed && !mobile} />
          {mobile ? (
            <button
              type='button'
              className='inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-slate-600 dark:text-white'
              onClick={onCloseMobile}
            >
              <X className='h-5 w-5' />
            </button>
          ) : null}
        </div>
        <div className='mb-6 rounded-[28px] bg-brand-gradient p-[1px]'>
          <div className='rounded-[27px] bg-white/80 p-4 dark:bg-slate-950/65'>
            <p className='text-xs uppercase tracking-[0.24em] text-primary/75'>Workspace</p>
            <h3 className='mt-3 font-display text-lg font-semibold text-slate-900 dark:text-white'>{workspaceCopy.title}</h3>
            <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>{workspaceCopy.description}</p>
          </div>
        </div>
        <SidebarLinks collapsed={collapsed && !mobile} onNavigate={onNavigate} />
      </div>

      <div className='surface-panel rounded-[28px] p-4'>
        <div className='flex items-center justify-between'>
          <p className='text-sm font-semibold text-slate-900 dark:text-white'>Cycle Health</p>
          <StatusBadge status={workspaceCopy.healthLabel} />
        </div>
        <div className='mt-4 h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10'>
          <div className='h-full rounded-full bg-brand-gradient' style={{ width: workspaceCopy.healthPercent }} />
        </div>
        <p className='mt-3 text-sm text-slate-500 dark:text-slate-300'>{workspaceCopy.healthText}</p>
      </div>
    </div>
  );
}

export function Sidebar({ isCollapsed, isMobileOpen, onCloseMobile }) {
  return (
    <>
      <motion.aside
        animate={{ width: isCollapsed ? 96 : 296 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className='hidden min-h-screen border-r border-white/10 bg-white/45 backdrop-blur-xl dark:bg-slate-950/30 lg:block'
      >
        <SidebarBody collapsed={isCollapsed} onNavigate={() => null} />
      </motion.aside>

      <AnimatePresence>
        {isMobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden'
              onClick={onCloseMobile}
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className='fixed inset-y-0 left-0 z-50 w-[300px] bg-white/85 shadow-glass backdrop-blur-2xl dark:bg-slate-950/88 lg:hidden'
            >
              <SidebarBody collapsed={false} mobile onNavigate={onCloseMobile} onCloseMobile={onCloseMobile} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
