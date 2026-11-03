import { useEffect } from 'react';
import { AppState } from 'react-native';
import { syncTodoReminders } from '@/lib/utils/todo-notification.util';

// Re-derives the reminder schedule on launch and on every resume. The mutation
// call sites keep it fresh while the app is open; this covers what they can't —
// reminders consumed while the app was closed, later ones rolling into the
// MAX_SCHEDULED window, and device clock or timezone changes made outside it.
export function useTodoNotifications(): void {
  useEffect(() => {
    syncTodoReminders();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') syncTodoReminders();
    });
    return () => sub.remove();
  }, []);
}
