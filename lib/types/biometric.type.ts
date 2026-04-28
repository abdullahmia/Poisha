export type BiometricType = 'faceId' | 'fingerprint' | 'none';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}
