import { useCallback } from 'react';
import { useBudget as useBudgetQuery, useSetBudget } from '@/lib/services/budget';

export function useBudget() {
  const budgetQuery = useBudgetQuery();
  const setBudgetMutation = useSetBudget();

  const setBudget = useCallback(async (value: number | null) => {
    await setBudgetMutation.mutateAsync(value);
  }, [setBudgetMutation]);

  const refresh = useCallback(async () => {
    await budgetQuery.refetch();
  }, [budgetQuery]);

  const getProgress = useCallback((spent: number) => {
    const budget = budgetQuery.data;
    if (budget === null || budget === undefined) return { percent: 0, exceeded: false, isSet: false };
    const percent = (spent / budget) * 100;
    return { percent, exceeded: spent > budget, isSet: true };
  }, [budgetQuery.data]);

  return { budget: budgetQuery.data ?? null, setBudget, refresh, getProgress };
}
