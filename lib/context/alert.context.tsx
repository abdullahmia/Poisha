import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Feather } from '@expo/vector-icons';
import type { TConfirmModalAction } from '@/lib/ui/confirm-modal.ui';

export interface TAlertOptions {
  title: string;
  message: string;
  icon?: keyof typeof Feather.glyphMap;
  destructive?: boolean;
  actions?: TConfirmModalAction[];
}

export interface AlertCtxValue {
  current: TAlertOptions | null;
  showAlert: (options: TAlertOptions) => void;
  handleClose: () => void;
}

export const AlertCtx = createContext<AlertCtxValue | null>(null);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<TAlertOptions[]>([]);
  const [current, setCurrent] = useState<TAlertOptions | null>(null);

  // A queued alert (e.g. a follow-up shown from within another alert's action)
  // only opens once the current one has fully closed, so sheets never overlap.
  useEffect(() => {
    if (current === null && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((q) => q.slice(1));
    }
  }, [current, queue]);

  const showAlert = useCallback((options: TAlertOptions) => {
    setQueue((q) => [...q, options]);
  }, []);

  const handleClose = useCallback(() => setCurrent(null), []);

  const value = useMemo(() => ({ current, showAlert, handleClose }), [current, showAlert, handleClose]);

  return <AlertCtx.Provider value={value}>{children}</AlertCtx.Provider>;
}

export function useAlertCtx() {
  const ctx = useContext(AlertCtx);
  if (!ctx) throw new Error('useAlertCtx must be used within AlertProvider');
  return ctx;
}

/** Imperative replacement for `Alert.alert` — usable from components and hooks alike. */
export function useAlert() {
  return useAlertCtx().showAlert;
}
