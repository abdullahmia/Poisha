import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { useFieldArray, useForm } from 'react-hook-form';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { entryFormSchema, type TEntryFormData } from '@/lib/schemas/entry.schemas';
import type { TEntry } from '@/lib/types';
import { todayISO } from '@/lib/utils/date.util';

export function useEntryForm(entry: TEntry | null) {
  const { saveEntry, deleteEntry, closeSheet } = useEntries();
  const { notification } = useHaptics();

  const form = useForm<TEntryFormData>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      date: entry?.date ?? todayISO(),
      amounts: entry ? entry.amounts.map(a => ({ value: String(a) })) : [{ value: '' }],
      note: entry?.note ?? '',
    },
  });

  const amountFieldArray = useFieldArray({ control: form.control, name: 'amounts' });
  const amounts = form.watch('amounts');
  const dateISO = form.watch('date');
  const note = form.watch('note');

  const total = amounts.reduce((s, a) => s + (parseFloat(a.value) || 0), 0);
  const canSave = amounts.some(a => parseFloat(a.value) > 0);

  function updateAmount(index: number, raw: string) {
    form.setValue(`amounts.${index}.value`, raw.replace(/[^0-9.]/g, ''));
  }

  function addLine() {
    amountFieldArray.append({ value: '' });
  }

  function removeLine(index: number) {
    if (amountFieldArray.fields.length === 1) {
      form.setValue('amounts.0.value', '');
    } else {
      amountFieldArray.remove(index);
    }
  }

  function handleSave() {
    const values = form.getValues();
    const cleaned = values.amounts.map(a => parseFloat(a.value)).filter(n => !isNaN(n) && n > 0);
    if (cleaned.length === 0) return;
    saveEntry({ id: entry?.id, date: values.date, amounts: cleaned, note: values.note.trim() });
    notification(Haptics.NotificationFeedbackType.Success);
    closeSheet();
  }

  function handleDelete() {
    if (entry) deleteEntry(entry.id);
    notification(Haptics.NotificationFeedbackType.Warning);
    closeSheet();
  }

  return {
    dateISO,
    setDateISO: (iso: string) => form.setValue('date', iso),
    note,
    setNote: (next: string) => form.setValue('note', next),
    amountFields: amountFieldArray.fields,
    amounts,
    updateAmount,
    addLine,
    removeLine,
    total,
    canSave,
    handleSave,
    handleDelete,
  };
}
