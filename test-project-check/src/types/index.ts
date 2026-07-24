// JOKSU Election Types

export interface Student {
  id: string;
  studentId: string;
  name: string;
  phoneNumber?: string;
  department: string;
  session: string;
  hasVoted: boolean;
  votedPositions: string[];
}

export interface Candidate {
  id: string;
  name: string;
  studentId: string;
  voterNo?: string;
  position: Position;
  department: string;
  session: string;
  image?: string;
  manifesto: string;
  votes: number;
  symbol: string;
}

export type Position = 
  | 'VP' // Vice President (সহ-সভাপতি)
  | 'GS' // General Secretary (সাধারণ সম্পাদক)
  | 'AGS' // Assistant General Secretary (সহ-সাধারণ সম্পাদক)
  | 'OS' // Organizing Secretary (সাংগঠনিক সম্পাদক)
  | 'PS' // Publicity Secretary (প্রচার সম্পাদক)
  | 'SPS' // Sports Secretary (ক্রীড়া সম্পাদক)
  | 'IS' // International Affairs Secretary (আন্তর্জাতিক বিষয়ক সম্পাদক)
  | 'LS' // Library Secretary (গ্রন্থাগার সম্পাদক)
  | 'LWR' // Liberation War & Research Secretary (মুক্তিযুদ্ধ ও গবেষণা সম্পাদক)
  | 'ERC' // Education & Reading Circle Secretary (শিক্ষা ও পাঠচক্র সম্পাদক)
  | 'ST' // Science & Technology Secretary (বিজ্ঞান ও প্রযুক্তি সম্পাদক)
  | 'LP' // Literature & Publication Secretary (সাহিত্য ও প্রকাশনা সম্পাদক)
  | 'DCS' // Drama & Cultural Secretary (নাট্য ও সাংস্কৃতিক সম্পাদক)
  | 'LC' // Literature & Culture Secretary (সাহিত্য ও সংস্কৃতি সম্পাদক)
  | 'MS' // Magazine Secretary (পত্রিকা সম্পাদক)
  | 'SSWS' // Social Service & Student Welfare Secretary (সমাজসেবা ও শিক্ষার্থী কল্যাণ সম্পাদক)
  | 'ESS' // Environment & Service Secretary (পরিবেশ ও সেবামূলক সম্পাদক)
  | 'EC'; // Executive Council (কার্যনির্বাহী পরিষদ)

export interface PositionInfo {
  id: Position;
  title: string;
  titleBn: string;
  description: string;
}

export interface Vote {
  id: string;
  voterId: string;
  candidateId: string;
  position: Position;
  timestamp: Date;
}

export interface ElectionState {
  isActive: boolean;
  startTime: Date;
  endTime: Date;
  totalVoters: number;
  votedCount: number;
}

export interface FingerprintTemplate {
  code: string;
  updatedAt: string;
}

export interface FaceTemplate {
  code: string;
  updatedAt: string;
}

export type VoteOtpRequestStatus = 'pending' | 'approved' | 'sent' | 'verified' | 'rejected' | 'expired';

export interface VoteOtpRequest {
  studentId: string;
  phoneNumber: string;
  status: VoteOtpRequestStatus;
  requestedAt: string;
  approvedAt?: string;
  sentAt?: string;
  verifiedAt?: string;
  expiresAt?: string;
  otpCode?: string;
  attemptsLeft?: number;
  note?: string;
}

// Context Types
export interface AuthContextType {
  user: Student | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  registeredStudentsCount: number;
  login: (studentId: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserName: (newName: string) => Promise<boolean>;
  updateUserPhoneNumber: (phoneNumber: string) => Promise<boolean>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  updateStudentPassword: (studentId: string, newPassword: string) => Promise<boolean>;
  addStudent: (studentId: string, name: string, password: string, department: string, session: string, phoneNumber?: string) => Promise<boolean>;
  getRegisteredStudents: () => Promise<Array<{ studentId: string; name: string; phoneNumber?: string; department: string; session: string }>>;
  removeStudent: (studentId: string) => Promise<boolean>;
  updateStudent: (studentId: string, name: string, department: string, session: string, phoneNumber?: string) => Promise<boolean>;
}

export interface VotingContextType {
  candidates: Candidate[];
  positions: PositionInfo[];
  electionState: ElectionState;
  otpRequired: boolean;
  otpRequests: VoteOtpRequest[];
  setOtpRequired: (required: boolean) => Promise<boolean>;
  requestVoteOtp: (studentId: string, phoneNumber: string) => Promise<boolean>;
  verifyVoteOtp: (studentId: string, otpCode: string) => Promise<boolean>;
  isOtpVerified: (studentId: string) => boolean;
  getVoteOtpRequest: (studentId: string) => VoteOtpRequest | null;
  approveVoteOtpRequest: (studentId: string) => Promise<string | null>;
  markVoteOtpAsSent: (studentId: string) => Promise<boolean>;
  rejectVoteOtpRequest: (studentId: string, note?: string) => Promise<boolean>;
  clearVoteOtpRequest: (studentId: string) => Promise<boolean>;
  faceRequired: boolean;
  setFaceRequired: (required: boolean) => Promise<boolean>;
  setStudentFace: (studentId: string, faceCode: string) => Promise<boolean>;
  clearStudentFace: (studentId: string) => Promise<boolean>;
  verifyStudentFace: (studentId: string, faceCode: string) => Promise<boolean>;
  isFaceVerified: (studentId: string) => boolean;
  getFaceEnrollmentStatus: (studentIds: string[]) => Promise<Record<string, boolean>>;

  // Backward-compatible fingerprint API
  fingerprintRequired: boolean;
  castVote: (candidateId: string, position: Position) => Promise<boolean>;
  getResults: () => Map<Position, Candidate[]>;
  hasVotedForPosition: (position: Position) => boolean;
  addCandidate: (candidate: Omit<Candidate, 'id' | 'votes'>) => Promise<boolean>;
  updateCandidate: (candidateId: string, candidateData: Partial<Candidate>) => Promise<boolean>;
  deleteCandidate: (candidateId: string) => Promise<boolean>;
  verifyStudentId: (scannedId: string, expectedId: string) => Promise<boolean>;
  isIdVerified: (studentId: string) => boolean;
  resetSecurityVerification: (studentId: string) => void;
  setFingerprintRequired: (required: boolean) => Promise<boolean>;
  setStudentFingerprint: (studentId: string, fingerprintCode: string) => Promise<boolean>;
  clearStudentFingerprint: (studentId: string) => Promise<boolean>;
  verifyStudentFingerprint: (studentId: string, fingerprintCode: string) => Promise<boolean>;
  isFingerprintVerified: (studentId: string) => boolean;
  getFingerprintEnrollmentStatus: (studentIds: string[]) => Promise<Record<string, boolean>>;
}