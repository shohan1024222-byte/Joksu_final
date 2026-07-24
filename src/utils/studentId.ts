export const normalizeStudentId = (value: string): string => value.trim().toLowerCase();

export const formatStudentId = (value: string): string => value.trim().toUpperCase();

export const findStudentById = <T extends { studentId?: string }>(students: T[], studentId: string): T | undefined => {
  const target = normalizeStudentId(studentId);
  return students.find((student) => normalizeStudentId(student.studentId ?? '') === target);
};

export const getRecordValueByStudentId = <T>(record: Record<string, T> | undefined, studentId: string): T | undefined => {
  if (!record) return undefined;

  const trimmedId = studentId.trim();
  const canonicalKey = formatStudentId(trimmedId);
  const normalizedTarget = normalizeStudentId(trimmedId);

  if (record[canonicalKey] !== undefined) {
    return record[canonicalKey];
  }

  if (record[trimmedId] !== undefined) {
    return record[trimmedId];
  }

  return Object.entries(record).find(([key]) => normalizeStudentId(key) === normalizedTarget)?.[1];
};

export const setRecordValueByStudentId = <T>(record: Record<string, T>, studentId: string, value: T): void => {
  const trimmedId = studentId.trim();
  const canonicalKey = formatStudentId(trimmedId);
  const normalizedTarget = normalizeStudentId(trimmedId);

  Object.keys(record).forEach((key) => {
    if (normalizeStudentId(key) === normalizedTarget) {
      delete record[key];
    }
  });

  record[canonicalKey] = value;
};

export const deleteRecordValueByStudentId = <T>(record: Record<string, T>, studentId: string): void => {
  const trimmedId = studentId.trim();
  const normalizedTarget = normalizeStudentId(trimmedId);

  Object.keys(record).forEach((key) => {
    if (normalizeStudentId(key) === normalizedTarget) {
      delete record[key];
    }
  });
};
