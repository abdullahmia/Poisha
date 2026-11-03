import { Redirect } from 'expo-router';
import { LoadingSplash } from '@/lib/components/home/loading-splash.component';
import { TodoScreen } from '@/lib/components/todo/todo-screen.component';
import { useTodo } from '@/lib/hooks/use-todo.hook';

export default function TodoRoute() {
  const { enabled, loading } = useTodo();

  // The route is registered whether or not its tab button renders, so it guards
  // itself against deep links and against being focused after the flag flips.
  // `loading` must come first — see the note in use-todo.hook.ts.
  if (loading) return <LoadingSplash />;
  if (!enabled) return <Redirect href="/" />;

  return <TodoScreen />;
}
