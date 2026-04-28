import { useContext } from 'react';
import { LockCtx } from '@/lib/context/lock.context';

export function useLock() {
  const ctx = useContext(LockCtx);
  if (!ctx) throw new Error('useLock must be used inside LockProvider');
  return ctx;
}
