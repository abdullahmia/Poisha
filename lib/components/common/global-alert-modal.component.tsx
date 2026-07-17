import { useAlertCtx } from '@/lib/context/alert.context';
import { ConfirmModal } from '@/lib/ui/confirm-modal.ui';

export function GlobalAlertModal() {
  const { current, handleClose } = useAlertCtx();

  return (
    <ConfirmModal
      visible={current !== null}
      onClose={handleClose}
      title={current?.title ?? ''}
      message={current?.message ?? ''}
      icon={current?.icon}
      destructive={current?.destructive}
      actions={current?.actions}
    />
  );
}
