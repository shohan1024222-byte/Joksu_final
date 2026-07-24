export type GpaCourse = {
  code: string;
  title: string;
  credit: number;
};

export const gpaCourses: GpaCourse[] = [
  { code: 'CSE-3101', title: 'Theory of Computation', credit: 3 },
  { code: 'CSE-3102', title: 'Mathematical Analysis for Computer Science', credit: 3 },
  { code: 'CSE-3103', title: 'Operating Systems', credit: 3 },
  { code: 'CSEL-3104', title: 'Operating Systems Lab', credit: 1 },
  { code: 'CSE-3105', title: 'Microprocessor and Assembly Language', credit: 3 },
  { code: 'CSEL-3106', title: 'Microprocessor and Assembly Language Lab', credit: 1 },
  { code: 'CSE-3107', title: 'Computer Networks', credit: 3 },
  { code: 'CSEL-3108', title: 'Computer Networks Lab', credit: 1 },
  { code: 'CSEP-3109', title: 'Internet and Web Programming (Project)', credit: 1 },
];
