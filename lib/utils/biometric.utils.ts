import { FaceIdIcon, FingerPrintIcon } from '@hugeicons/core-free-icons';
import type { BiometricType } from '@/lib/types/biometric.type';

export function biometricLabel(type: BiometricType): string {
  if (type === 'faceId') return 'Face ID';
  if (type === 'fingerprint') return 'Fingerprint';
  return '';
}

export function biometricIcon(type: BiometricType): typeof FaceIdIcon | typeof FingerPrintIcon | null {
  if (type === 'faceId') return FaceIdIcon;
  if (type === 'fingerprint') return FingerPrintIcon;
  return null;
}
