// Demo-only camera fingerprint helpers.
// This is intentionally weak and should not be used for production biometric security.

export const CAMERA_FP_PREFIX = 'CAM:';

const SAMPLE_STEP = 29;
const TEMPLATE_LENGTH = 180;

export const generateCameraFingerprintTemplate = (base64: string): string => {
  const clean = (base64 || '').replace(/\s+/g, '');
  if (!clean) return `${CAMERA_FP_PREFIX}EMPTY`;

  let sampled = '';
  for (let i = 0; i < clean.length && sampled.length < TEMPLATE_LENGTH; i += SAMPLE_STEP) {
    sampled += clean[i];
  }

  let bucketA = 0;
  let bucketB = 0;
  let bucketC = 0;
  for (let i = 0; i < clean.length; i += 11) {
    const code = clean.charCodeAt(i);
    if ((code & 1) === 0) bucketA++;
    if ((code & 2) === 2) bucketB++;
    if ((code & 4) === 4) bucketC++;
  }

  const meta = `${clean.length.toString(36)}-${bucketA.toString(36)}-${bucketB.toString(36)}-${bucketC.toString(36)}`;
  return `${CAMERA_FP_PREFIX}${meta}:${sampled}`;
};

export const isCameraFingerprintTemplate = (value: string): boolean => {
  return value.startsWith(CAMERA_FP_PREFIX);
};

export const cameraFingerprintSimilarity = (storedTemplate: string, incomingTemplate: string): number => {
  if (!isCameraFingerprintTemplate(storedTemplate) || !isCameraFingerprintTemplate(incomingTemplate)) {
    return 0;
  }

  const stored = storedTemplate.slice(CAMERA_FP_PREFIX.length);
  const incoming = incomingTemplate.slice(CAMERA_FP_PREFIX.length);
  const length = Math.min(stored.length, incoming.length);
  if (length === 0) return 0;

  let same = 0;
  for (let i = 0; i < length; i++) {
    if (stored[i] === incoming[i]) same++;
  }
  return same / length;
};

export const isCameraFingerprintMatch = (storedTemplate: string, incomingTemplate: string): boolean => {
  const similarity = cameraFingerprintSimilarity(storedTemplate, incomingTemplate);
  return similarity >= 0.72;
};
