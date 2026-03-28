import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  ChevronDown,
  Home,
  LogOut,
  Menu,
  MoonStar,
  PanelLeftClose,
  PanelLeftOpen,
  SunMedium,
  User,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { notificationApi } from '../services/api';
import { getHomePathForRole, getProfilePathForRole } from '../utils/roles';
import { formatDateTime } from '../utils/formatters';
import { Button } from './Button';
import { LogoMark } from './LogoMark';

const navIconClassName = 'block h-5 w-5 shrink-0 text-slate-700 dark:text-slate-100';
const smallIconClassName = 'block h-4 w-4 shrink-0 text-slate-400 dark:text-slate-300';
const iconButtonClassName = 'h-11 w-11 rounded-2xl p-0 [&_svg]:pointer-events-none';

function mergeNotifications(current, incoming) {
  const notificationMap = new Map(current.map((item) => [item.id, item]));

  incoming.forEach((item) => {
    notificationMap.set(item.id, { ...notificationMap.get(item.id), ...item });
  });

  return Array.from(notificationMap.values()).sort(
    (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  );
}

export function Navbar({ isCollapsed, onToggleSidebar, onOpenMobileSidebar }) {
  const { toggleTheme, isDark } = useTheme();
  const { user, logout, token } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState('');
  const homePath = getHomePathForRole(user?.role);
  const profilePath = getProfilePathForRole(user?.role);
  const unreadCount = notifications.filter((item) => !item.is_read).length;
  const userNotifications = notifications.slice(0, 6);

  useEffect(() => {
    if (!user || !token) {
      setNotifications([]);
      return;
    }

    let isActive = true;

    const loadNotifications = async () => {
      try {
        const items = await notificationApi.list();
        if (!isActive) {
          return;
        }

        setNotifications(items);
        setNotificationError('');
      } catch (requestError) {
        if (!isActive) {
          return;
        }

        setNotificationError(requestError.message || 'Unable to load notifications right now.');
      }
    };

    loadNotifications();
    return () => {
      isActive = false;
    };
  }, [user?.id, token]);

  useEffect(() => {
    const socketUrl = notificationApi.socketUrl(user?.id, token);
    if (!socketUrl) {
      return undefined;
    }

    const socket = new WebSocket(socketUrl);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setNotifications((current) => mergeNotifications(current, [payload]));
      } catch {
        setNotificationError('Received an unreadable notification payload.');
      }
    };
    socket.onerror = () => {
      setNotificationError('Live notifications are temporarily unavailable.');
    };

    return () => {
      socket.close();
    };
  }, [user?.id, token]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNotificationClick = async (notificationId, isRead) => {
    if (isRead) {
      return;
    }

    setNotifications((current) =>
      current.map((item) => (item.id === notificationId ? { ...item, is_read: true } : item)),
    );

    try {
      await notificationApi.markRead(notificationId);
    } catch {
      setNotificationError('Unable to mark this notification as read.');
    }
  };

  const handleProfileOpen = () => {
    setShowProfileMenu(false);
    navigate(profilePath);
  };

  const handleIdeNotice = () => {
    pushToast({
      title: 'Notification sync active',
      message: 'WebSocket updates will appear here when the backend emits project events.',
      tone: 'info',
    });
  };

  return (
    <header className='sticky top-0 z-30 border-b border-white/10 bg-white/55 px-4 py-4 backdrop-blur-xl dark:bg-slate-950/35 sm:px-6 lg:px-8'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <Button variant='ghost' className={`${iconButtonClassName} lg:hidden`} onClick={onOpenMobileSidebar}>
            <Menu className={navIconClassName} strokeWidth={2.2} />
          </Button>
          <Button
            variant='ghost'
            className={`${iconButtonClassName} hidden lg:inline-flex`}
            onClick={onToggleSidebar}
          >
            {isCollapsed ? (
              <PanelLeftOpen className={navIconClassName} strokeWidth={2.2} />
            ) : (
              <PanelLeftClose className={navIconClassName} strokeWidth={2.2} />
            )}
          </Button>
          <Link to={homePath} className='hidden md:block'>
            <LogoMark />
          </Link>
        </div>

        <div className='flex items-center gap-2 sm:gap-3'>
          <Link to={homePath}>
            <Button variant='ghost' className={iconButtonClassName} aria-label='Go to dashboard'>
              <Home className={navIconClassName} strokeWidth={2.2} />
            </Button>
          </Link>

          <div className='relative'>
            <Button
              variant='ghost'
              className={`relative ${iconButtonClassName}`}
              aria-label='Open notifications'
              onClick={() => {
                setShowNotifications((current) => !current);
                setShowProfileMenu(false);
              }}
            >
              <Bell className={navIconClassName} strokeWidth={2.2} />
              {unreadCount ? <span className='absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-accent' /> : null}
            </Button>
            <AnimatePresence>
              {showNotifications ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className='glass-panel absolute right-0 mt-3 w-[340px] rounded-[28px] p-4 shadow-glass'
                >
                  <div className='mb-4 flex items-center justify-between gap-3'>
                    <div>
                      <h3 className='font-display text-lg font-semibold text-slate-900 dark:text-white'>
                        Notifications
                      </h3>
                      <p className='text-xs text-slate-500 dark:text-slate-300'>
                        {unreadCount ? `${unreadCount} unread` : 'All caught up'}
                      </p>
                    </div>
                    <button
                      type='button'
                      className='text-xs font-semibold text-primary'
                      onClick={handleIdeNotice}
                    >
                      Live info
                    </button>
                  </div>
                  {notificationError ? <p className='mb-3 text-xs text-danger'>{notificationError}</p> : null}
                  <div className='space-y-3'>
                    {userNotifications.length ? (
                      userNotifications.map((item) => (
                        <button
                          key={item.id}
                          type='button'
                          onClick={() => handleNotificationClick(item.id, item.is_read)}
                          className={`surface-panel w-full rounded-2xl px-4 py-3 text-left ${
                            item.is_read ? 'opacity-80' : 'ring-1 ring-accent/30'
                          }`}
                        >
                          <p className='text-sm font-medium text-slate-900 dark:text-white'>{item.message}</p>
                          <p className='mt-1 text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300'>
                            {item.type.replaceAll('_', ' ')}
                          </p>
                          <p className='mt-2 text-xs text-slate-500 dark:text-slate-300'>
                            {formatDateTime(item.timestamp)}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className='surface-panel rounded-2xl px-4 py-3 text-sm text-slate-500 dark:text-slate-300'>
                        No notifications yet.
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <Button variant='ghost' className={iconButtonClassName} aria-label='Toggle theme' onClick={toggleTheme}>
            {isDark ? (
              <SunMedium className={navIconClassName} strokeWidth={2.2} />
            ) : (
              <MoonStar className={navIconClassName} strokeWidth={2.2} />
            )}
          </Button>

          <div className='relative'>
            <button
              type='button'
              className='glass-panel flex items-center gap-3 rounded-2xl px-3 py-2'
              onClick={() => {
                setShowProfileMenu((current) => !current);
                setShowNotifications(false);
              }}
            >
              <span className='flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow'>
                <User className='block h-4 w-4 shrink-0 text-white sm:hidden' strokeWidth={2.3} />
                <span className='hidden text-sm font-bold sm:block'>{user?.avatar || 'SP'}</span>
              </span>
              <div className='hidden text-left sm:block'>
                <p className='text-sm font-semibold text-slate-900 dark:text-white'>{user?.name || 'Project User'}</p>
                <p className='text-xs capitalize text-slate-500 dark:text-slate-300'>{user?.role || 'student'}</p>
              </div>
              <ChevronDown className={smallIconClassName} strokeWidth={2.2} />
            </button>
            <AnimatePresence>
              {showProfileMenu ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className='glass-panel absolute right-0 mt-3 w-56 rounded-[28px] p-3 shadow-glass'
                >
                  <button
                    type='button'
                    onClick={handleProfileOpen}
                    className='flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-900/5 dark:text-slate-100 dark:hover:bg-white/5'
                  >
                    <User className={smallIconClassName} strokeWidth={2.2} />
                    Profile
                  </button>
                  <button
                    type='button'
                    onClick={handleLogout}
                    className='flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-900/5 dark:text-slate-100 dark:hover:bg-white/5'
                  >
                    <LogOut className={smallIconClassName} strokeWidth={2.2} />
                    Logout
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
