import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { todayISO } from '@/lib/utils/date.util';

// `todayISO()` read during render goes stale in a session held open across
// midnight. AppState 'active' catches the overwhelmingly common case — the app
// backgrounded overnight and resumed the next day — without a timer that has to
// be cancelled, re-armed across DST, and kept from firing in the background.
export function useToday(): string {
  const [today, setToday] = useState(todayISO);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') return;
      // Keep the previous string when the date hasn't changed, or every app
      // switch would produce a new value and invalidate every downstream memo.
      setToday(prev => {
        const next = todayISO();
        return next === prev ? prev : next;
      });
    });
    return () => sub.remove();
  }, []);

  return today;
}
