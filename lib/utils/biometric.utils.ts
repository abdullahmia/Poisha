import { FaceIdIcon, FingerPrintIcon } from '@hugeicons/core-free-icons';
import type { TBiometricType } from '@/lib/types';

export function biometricLabel(type: TBiometricType): string {
  if (type === 'faceId') return 'Face ID';
  if (type === 'fingerprint') return 'Fingerprint';
  return '';
}

export function biometricIcon(type: TBiometricType): typeof FaceIdIcon | typeof FingerPrintIcon | null {
  if (type === 'faceId') return FaceIdIcon;
  if (type === 'fingerprint') return FingerPrintIcon;
  return null;
}
