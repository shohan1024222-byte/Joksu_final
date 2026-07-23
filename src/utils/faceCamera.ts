// Demo-only camera face helpers.
// This is intentionally weak and should not be used for production biometric security.

export const CAMERA_FACE_PREFIX = 'FACE:';

const SAMPLE_STEP = 23;
const TEMPLATE_LENGTH = 220;

export const generateCameraFaceTemplate = (base64: string): string => {
  const clean = (base64 || '').replace(/\s+/g, '');
  if (!clean) return `${CAMERA_FACE_PREFIX}EMPTY`;

  let sampled = '';
  for (let i = 0; i < clean.length && sampled.length < TEMPLATE_LENGTH; i += SAMPLE_STEP) {
    sampled += clean[i];
  }

  let bucketA = 0;
  let bucketB = 0;
  let bucketC = 0;
  for (let i = 0; i < clean.length; i += 13) {
    const code = clean.charCodeAt(i);
    if ((code & 1) === 0) bucketA++;
    if ((code & 2) === 2) bucketB++;
    if ((code & 4) === 4) bucketC++;
  }

  const meta = `${clean.length.toString(36)}-${bucketA.toString(36)}-${bucketB.toString(36)}-${bucketC.toString(36)}`;
  return `${CAMERA_FACE_PREFIX}${meta}:${sampled}`;
};

export const isCameraFaceTemplate = (value: string): boolean => {
  return value.startsWith(CAMERA_FACE_PREFIX);
};

export const cameraFaceSimilarity = (storedTemplate: string, incomingTemplate: string): number => {
  if (!isCameraFaceTemplate(storedTemplate) || !isCameraFaceTemplate(incomingTemplate)) {
    return 0;
  }

  const stored = storedTemplate.slice(CAMERA_FACE_PREFIX.length);
  const incoming = incomingTemplate.slice(CAMERA_FACE_PREFIX.length);
  const length = Math.min(stored.length, incoming.length);
  if (length === 0) return 0;

  let same = 0;
  for (let i = 0; i < length; i++) {
    if (stored[i] === incoming[i]) same++;
  }
  return same / length;
};

export const isCameraFaceMatch = (storedTemplate: string, incomingTemplate: string): boolean => {
  const similarity = cameraFaceSimilarity(storedTemplate, incomingTemplate);
  return similarity >= 0.74;
};
