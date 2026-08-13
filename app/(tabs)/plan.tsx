import { Redirect } from 'expo-router';
import { LoadingSplash } from '@/lib/components/home/loading-splash.component';
import { PlanScreen } from '@/lib/components/plan/plan-screen.component';
import { usePlanMode } from '@/lib/hooks/use-plan-mode.hook';

export default function PlanRoute() {
  const { enabled, loading } = usePlanMode();

  // The route is registered whether or not its tab button renders, so it guards
  // itself against deep links and against being focused after the flag flips.
  // `loading` must come first — see the note in use-plan-mode.hook.ts.
  if (loading) return <LoadingSplash />;
  if (!enabled) return <Redirect href="/" />;

  return <PlanScreen />;
}
