import { FirebaseStorage } from './storage';

const Storage = FirebaseStorage;

const DEFAULT_BASE_URL = 'https://us-central1-jokshu-voting.cloudfunctions.net';

const getOtpBaseUrl = async (): Promise<string> => {
  try {
    const stored = await Storage.getItem('otpServiceBaseUrl');
    return (stored && stored.trim()) || DEFAULT_BASE_URL;
  } catch {
    return DEFAULT_BASE_URL;
  }
};

const postJson = async (url: string, body: Record<string, any>) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const message = data?.message || `Request failed with ${res.status}`;
    throw new Error(message);
  }
  return data;
};

export const sendOtpSmsViaFirebase = async (studentId: string, phoneNumber: string): Promise<boolean> => {
  const base = await getOtpBaseUrl();
  await postJson(`${base}/requestVoteOtp`, { studentId, phoneNumber });
  return true;
};

export const verifyOtpViaFirebase = async (studentId: string, otpCode: string): Promise<boolean> => {
  const base = await getOtpBaseUrl();
  const data = await postJson(`${base}/verifyVoteOtp`, { studentId, otpCode });
  return !!data?.verified;
};
