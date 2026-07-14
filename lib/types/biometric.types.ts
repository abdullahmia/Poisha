export type TBiometricType = 'faceId' | 'fingerprint' | 'none';

export interface TBiometricAuthResult {
  success: boolean;
  error?: string;
}
