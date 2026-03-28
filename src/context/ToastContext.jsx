import { createContext, useContext, useMemo, useState } from 'react';
import { AppToastViewport } from '../components/AppToastViewport';

const ToastContext = createContext(null);

let toastCounter = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = (toastId) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  };

  const pushToast = ({ title, message, tone = 'info' }) => {
    const id = toastCounter++;
    setToasts((current) => [...current, { id, title, message, tone }]);

    window.setTimeout(() => {
      dismissToast(id);
    }, 4200);
  };

  const value = useMemo(
    () => ({
      toasts,
      pushToast,
      dismissToast,
    }),
    [toasts],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <AppToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}
