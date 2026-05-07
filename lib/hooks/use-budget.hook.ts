import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const BUDGET_KEY = 'poisha_monthly_budget';

interface UseBudgetReturn {
  budget: number | null;
  setBudget: (value: number | null) => Promise<void>;
  refresh: () => Promise<void>;
  getProgress: (spent: number) => {
    percent: number;
    exceeded: boolean;
    isSet: boolean;
  };
}

export function useBudget(): UseBudgetReturn {
  const [budget, setBudgetState] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const val = await AsyncStorage.getItem(BUDGET_KEY);
    if (val) {
      const parsed = parseFloat(val);
      setBudgetState(isNaN(parsed) ? null : parsed);
    } else {
      setBudgetState(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, []);

  async function setBudget(value: number | null): Promise<void> {
    if (value === null) {
      await AsyncStorage.removeItem(BUDGET_KEY);
    } else {
      await AsyncStorage.setItem(BUDGET_KEY, String(value));
    }
    setBudgetState(value);
  }

  function getProgress(spent: number) {
    if (budget === null) return { percent: 0, exceeded: false, isSet: false };
    const percent = (spent / budget) * 100;
    return { percent, exceeded: spent > budget, isSet: true };
  }

  return { budget, setBudget, refresh, getProgress };
}
