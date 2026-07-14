import { useMutation } from '@tanstack/react-query';
import { verifyPinCredentials } from './pin-storage.util';

export function useVerifyPin() {
  return useMutation({ mutationFn: verifyPinCredentials });
}
