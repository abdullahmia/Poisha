import { Redirect } from 'expo-router';
import { LoadingSplash } from '@/lib/components/home/loading-splash.component';
import { Categories } from '@/lib/components/settings/categories/categories.component';
import { useCategories } from '@/lib/hooks/use-categories.hook';

export default function CategoriesRoute() {
  const { enabled, loading } = useCategories();

  // The route is registered whether or not its tab button renders, so it guards
  // itself against deep links and against being focused after the flag flips.
  // `loading` must come first — see the note in use-categories.hook.ts.
  if (loading) return <LoadingSplash />;
  if (!enabled) return <Redirect href="/" />;

  return <Categories />;
}
