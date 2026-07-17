import { useCallback } from 'react';
import {
  useArchiveCategory,
  useCategories as useCategoriesQuery,
  useCategoriesEnabled as useCategoriesEnabledQuery,
  useReorderCategories,
  useSaveCategory,
  useSetCategoriesEnabled,
} from '@/lib/services/categories';
import type { TCategory } from '@/lib/types';

export function useCategories() {
  const enabledQuery = useCategoriesEnabledQuery();
  const setEnabledMutation = useSetCategoriesEnabled();
  const categoriesQuery = useCategoriesQuery();
  const saveCategoryMutation = useSaveCategory();
  const archiveCategoryMutation = useArchiveCategory();
  const reorderCategoriesMutation = useReorderCategories();

  const enabled = enabledQuery.data ?? false;

  const setEnabled = useCallback(async (value: boolean) => {
    await setEnabledMutation.mutateAsync(value);
  }, [setEnabledMutation]);

  const saveCategory = useCallback((category: TCategory) => {
    saveCategoryMutation.mutate(category);
  }, [saveCategoryMutation]);

  const archiveCategory = useCallback((id: string) => {
    archiveCategoryMutation.mutate(id);
  }, [archiveCategoryMutation]);

  const reorderCategories = useCallback((ids: string[]) => {
    reorderCategoriesMutation.mutate(ids);
  }, [reorderCategoriesMutation]);

  return {
    enabled,
    setEnabled,
    categories: enabled ? categoriesQuery.data ?? [] : [],
    saveCategory,
    archiveCategory,
    reorderCategories,
  };
}
