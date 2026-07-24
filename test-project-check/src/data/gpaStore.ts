import { FirebaseStorage } from '../firebase/storage';
import { gpaCourses, GpaCourse } from './gpaCourses';
import { gpaResults, StudentResult } from './gpaResults';

const GPA_RESULTS_KEY = 'gpaResults_3_1';
const GPA_COURSES_KEY = 'gpaCourses_3_1';

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

export const loadGpaCourses = async (): Promise<GpaCourse[]> => {
  const stored = await FirebaseStorage.getItem(GPA_COURSES_KEY);
  const parsed = safeParse<GpaCourse[]>(stored, gpaCourses);
  return Array.isArray(parsed) && parsed.length > 0 ? parsed : gpaCourses;
};

export const loadGpaResults = async (): Promise<StudentResult[]> => {
  const stored = await FirebaseStorage.getItem(GPA_RESULTS_KEY);
  const parsed = safeParse<StudentResult[]>(stored, gpaResults);
  return Array.isArray(parsed) && parsed.length > 0 ? parsed : gpaResults;
};

export const saveGpaCourses = async (courses: GpaCourse[]): Promise<void> => {
  await FirebaseStorage.setItem(GPA_COURSES_KEY, JSON.stringify(courses));
};

export const saveGpaResults = async (results: StudentResult[]): Promise<void> => {
  await FirebaseStorage.setItem(GPA_RESULTS_KEY, JSON.stringify(results));
};
