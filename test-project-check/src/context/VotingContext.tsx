import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FirebaseStorage } from '../firebase';
import { Candidate, Position, PositionInfo, ElectionState, VotingContextType, FaceTemplate, VoteOtpRequest } from '../types';
import { CANDIDATES, POSITIONS } from '../data/mockData';
import { isCameraFaceMatch, isCameraFaceTemplate } from '../utils/faceCamera';
import { useAuth } from './AuthContext';

// Firebase cloud storage ব্যবহার করা হচ্ছে - app uninstall করলেও data থাকবে
const Storage = FirebaseStorage;

const VotingContext = createContext<VotingContextType | undefined>(undefined);

interface VotingProviderProps {
  children: ReactNode;
}

// Increment this version whenever CANDIDATES data in mockData.ts is updated
const CANDIDATES_DATA_VERSION = '6';
const OTP_REQUESTS_KEY = 'manualVoteOtpRequests';
const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

export const VotingProvider: React.FC<VotingProviderProps> = ({ children }) => {
  const { user, registeredStudentsCount } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>(CANDIDATES);
  const [positions] = useState<PositionInfo[]>(POSITIONS);
  const [faceRequired, setFaceRequiredState] = useState(false);
  const [otpRequired, setOtpRequiredState] = useState(false);
  const [faceTemplates, setFaceTemplates] = useState<Record<string, FaceTemplate>>({});
  const [otpRequests, setOtpRequests] = useState<VoteOtpRequest[]>([]);
  const [electionState, setElectionState] = useState<ElectionState>({
    isActive: true,
    startTime: new Date('2026-02-10T08:00:00'),
    endTime: new Date('2026-02-10T18:00:00'),
    totalVoters: 0,
    votedCount: 0,
  });

  useEffect(() => {
    loadCandidatesFromStorage();
    loadElectionState();
    loadFaceData();
    loadOtpSettings();
    loadOtpRequests();
  }, []);

  useEffect(() => {
    if (registeredStudentsCount > 0) {
      setElectionState(prev => {
        if (prev.totalVoters === registeredStudentsCount) return prev;
        const nextState = { ...prev, totalVoters: registeredStudentsCount };
        void Storage.setItem('electionState', JSON.stringify(nextState));
        return nextState;
      });
    }
  }, [registeredStudentsCount]);

  useEffect(() => {
    // New login/session should not reuse previous OTP verification state.
    setVerifiedOtps(new Set());
  }, [user?.studentId]);

  const normalizeStudentId = (studentId: string): string => studentId.slice(-9);

  const findStoredFace = (studentId: string): FaceTemplate | null => {
    const direct = faceTemplates[studentId];
    if (direct) return direct;

    const targetLast9 = normalizeStudentId(studentId);
    for (const [storedId, template] of Object.entries(faceTemplates)) {
      if (normalizeStudentId(storedId) === targetLast9) {
        return template;
      }
    }
    return null;
  };

  const resolveStoredFaceKey = (studentId: string): string | null => {
    if (faceTemplates[studentId]) return studentId;
    const targetLast9 = normalizeStudentId(studentId);
    for (const storedId of Object.keys(faceTemplates)) {
      if (normalizeStudentId(storedId) === targetLast9) {
        return storedId;
      }
    }
    return null;
  };

  const loadCandidatesFromStorage = async () => {
    try {
      const storedVersion = await Storage.getItem('candidatesDataVersion');
      if (storedVersion !== CANDIDATES_DATA_VERSION) {
        // Data version changed, use fresh mock data and clear old cache
        await Storage.setItem('candidates', JSON.stringify(CANDIDATES));
        await Storage.setItem('candidatesDataVersion', CANDIDATES_DATA_VERSION);
        setCandidates(CANDIDATES);
        return;
      }
      const storedCandidates = await Storage.getItem('candidates');
      if (storedCandidates) {
        setCandidates(JSON.parse(storedCandidates));
      }
    } catch (error) {
      console.error('Error loading candidates:', error);
    }
  };

  const loadElectionState = async () => {
    try {
      const storedState = await Storage.getItem('electionState');
      if (storedState) {
        setElectionState(JSON.parse(storedState));
      }
    } catch (error) {
      console.error('Error loading election state:', error);
    }
  };

  const loadFaceData = async () => {
    try {
      // Migrate from old fingerprint keys if face keys are empty.
      const requiredRaw = await Storage.getItem('faceRequired');
      const fallbackRequiredRaw = await Storage.getItem('fingerprintRequired');
      const resolvedRequired = requiredRaw ?? fallbackRequiredRaw;
      setFaceRequiredState(resolvedRequired === 'true');

      const templatesRaw = await Storage.getItem('faceTemplates');
      const fallbackTemplatesRaw = await Storage.getItem('fingerprintTemplates');
      const resolvedTemplatesRaw = templatesRaw ?? fallbackTemplatesRaw;
      const templates = resolvedTemplatesRaw ? JSON.parse(resolvedTemplatesRaw) : {};
      setFaceTemplates(templates);

      if (!requiredRaw && fallbackRequiredRaw) {
        await Storage.setItem('faceRequired', fallbackRequiredRaw);
      }

      if (!templatesRaw && fallbackTemplatesRaw) {
        await Storage.setItem('faceTemplates', fallbackTemplatesRaw);
      }
    } catch (error) {
      console.error('Error loading face data:', error);
    }
  };

  const loadOtpSettings = async () => {
    try {
      const requiredRaw = await Storage.getItem('otpRequired');
      setOtpRequiredState(requiredRaw === 'true');
    } catch (error) {
      console.error('Error loading OTP settings:', error);
    }
  };

  const loadOtpRequests = async () => {
    try {
      const raw = await Storage.getItem(OTP_REQUESTS_KEY);
      if (!raw) {
        setOtpRequests([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setOtpRequests(parsed as VoteOtpRequest[]);
      } else {
        setOtpRequests([]);
      }
    } catch (error) {
      console.error('Error loading OTP requests:', error);
      setOtpRequests([]);
    }
  };

  const saveOtpRequests = async (nextRequests: VoteOtpRequest[]): Promise<void> => {
    setOtpRequests(nextRequests);
    await Storage.setItem(OTP_REQUESTS_KEY, JSON.stringify(nextRequests));
  };

  const normalizeWithFallback = (studentId: string): string => normalizeStudentId(studentId);

  const findOtpRequest = (studentId: string): VoteOtpRequest | null => {
    const target = normalizeWithFallback(studentId);
    const request = otpRequests.find((item) => normalizeWithFallback(item.studentId) === target);
    return request || null;
  };

  const upsertOtpRequest = async (request: VoteOtpRequest): Promise<void> => {
    const target = normalizeWithFallback(request.studentId);
    const nextRequests = otpRequests.filter((item) => normalizeWithFallback(item.studentId) !== target);
    nextRequests.push(request);
    await saveOtpRequests(nextRequests);
  };

  const generateOtpCode = (): string => {
    const min = 10 ** (OTP_LENGTH - 1);
    const max = (10 ** OTP_LENGTH) - 1;
    return String(Math.floor(min + Math.random() * (max - min + 1)));
  };

  const saveCandidates = async (updatedCandidates: Candidate[]) => {
    try {
      await Storage.setItem('candidates', JSON.stringify(updatedCandidates));
      setCandidates(updatedCandidates);
    } catch (error) {
      console.error('Error saving candidates:', error);
    }
  };

  const addCandidate = async (candidateData: Omit<Candidate, 'id' | 'votes'>): Promise<boolean> => {
    try {
      const newCandidate: Candidate = {
        ...candidateData,
        id: `cand_${Date.now()}`,
        votes: 0,
      };
      const updatedCandidates = [...candidates, newCandidate];
      await saveCandidates(updatedCandidates);
      return true;
    } catch (error) {
      console.error('Error adding candidate:', error);
      return false;
    }
  };

  const updateCandidate = async (candidateId: string, candidateData: Partial<Candidate>): Promise<boolean> => {
    try {
      const updatedCandidates = candidates.map(candidate => 
        candidate.id === candidateId ? { ...candidate, ...candidateData } : candidate
      );
      await saveCandidates(updatedCandidates);
      return true;
    } catch (error) {
      console.error('Error updating candidate:', error);
      return false;
    }
  };

  const deleteCandidate = async (candidateId: string): Promise<boolean> => {
    try {
      const updatedCandidates = candidates.filter(candidate => candidate.id !== candidateId);
      await saveCandidates(updatedCandidates);
      return true;
    } catch (error) {
      console.error('Error deleting candidate:', error);
      return false;
    }
  };

  // Track ID verification for voting
  const [verifiedVoters, setVerifiedVoters] = useState<Set<string>>(new Set());
  const [verifiedFaces, setVerifiedFaces] = useState<Set<string>>(new Set());
  const [verifiedOtps, setVerifiedOtps] = useState<Set<string>>(new Set());

  // Check if user has verified their ID for voting
  const isIdVerified = (studentId: string): boolean => {
    // Check both the exact studentId and variations with/without prefixes
    const last9 = studentId.slice(-9);
    
    // Check if any verified voter has the same last 9 digits
    for (const verifiedId of verifiedVoters) {
      if (verifiedId.slice(-9) === last9) {
        return true;
      }
    }
    
    return false;
  };

  const isFaceVerified = (studentId: string): boolean => {
    const last9 = normalizeStudentId(studentId);
    for (const verifiedId of verifiedFaces) {
      if (normalizeStudentId(verifiedId) === last9) {
        return true;
      }
    }
    return false;
  };

  const isOtpVerified = (studentId: string): boolean => {
    const last9 = normalizeStudentId(studentId);
    for (const verifiedId of verifiedOtps) {
      if (normalizeStudentId(verifiedId) === last9) {
        return true;
      }
    }
    return false;
  };

  const resetSecurityVerification = (studentId: string): void => {
    const target = normalizeStudentId(studentId);

    setVerifiedVoters(prev => {
      const next = new Set(prev);
      for (const id of Array.from(next)) {
        if (normalizeStudentId(id) === target) {
          next.delete(id);
        }
      }
      return next;
    });

    setVerifiedFaces(prev => {
      const next = new Set(prev);
      for (const id of Array.from(next)) {
        if (normalizeStudentId(id) === target) {
          next.delete(id);
        }
      }
      return next;
    });

    setVerifiedOtps(prev => {
      const next = new Set(prev);
      for (const id of Array.from(next)) {
        if (normalizeStudentId(id) === target) {
          next.delete(id);
        }
      }
      return next;
    });
  };

  const setOtpRequired = async (required: boolean): Promise<boolean> => {
    try {
      setOtpRequiredState(required);
      await Storage.setItem('otpRequired', required ? 'true' : 'false');
      if (!required) {
        setVerifiedOtps(new Set());
      }
      return true;
    } catch (error) {
      console.error('Error updating otp requirement:', error);
      return false;
    }
  };

  const requestVoteOtp = async (studentId: string, phoneNumber: string): Promise<boolean> => {
    try {
      const trimmedPhone = phoneNumber.trim();
      if (!trimmedPhone) return false;

      const now = new Date().toISOString();
      const current = findOtpRequest(studentId);
      const nextRequest: VoteOtpRequest = {
        studentId,
        phoneNumber: trimmedPhone,
        status: 'pending',
        requestedAt: now,
        note: current?.note,
      };

      await upsertOtpRequest(nextRequest);
      setVerifiedOtps(prev => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
      return true;
    } catch (error) {
      console.error('Error requesting vote OTP:', error);
      return false;
    }
  };

  const verifyVoteOtp = async (studentId: string, otpCode: string): Promise<boolean> => {
    try {
      const request = findOtpRequest(studentId);
      if (!request || !request.otpCode) return false;
      if (request.status !== 'approved' && request.status !== 'sent') return false;

      const nowMs = Date.now();
      const expiresAtMs = request.expiresAt ? new Date(request.expiresAt).getTime() : 0;
      if (!expiresAtMs || Number.isNaN(expiresAtMs) || nowMs > expiresAtMs) {
        await upsertOtpRequest({
          ...request,
          status: 'expired',
          otpCode: undefined,
          note: 'OTP expired',
        });
        return false;
      }

      const attemptsLeft = request.attemptsLeft ?? OTP_MAX_ATTEMPTS;
      const normalizedInput = otpCode.trim();
      if (normalizedInput !== request.otpCode) {
        const nextAttempts = attemptsLeft - 1;
        await upsertOtpRequest({
          ...request,
          attemptsLeft: nextAttempts,
          status: nextAttempts <= 0 ? 'rejected' : request.status,
          note: nextAttempts <= 0 ? 'Maximum attempts exceeded' : request.note,
        });
        return false;
      }

      await upsertOtpRequest({
        ...request,
        status: 'verified',
        verifiedAt: new Date().toISOString(),
        otpCode: undefined,
        attemptsLeft: undefined,
      });

      setVerifiedOtps(prev => {
        const next = new Set(prev);
        next.add(studentId);
        return next;
      });
      return true;
    } catch (error) {
      console.error('Error verifying vote OTP:', error);
      return false;
    }
  };

  const getVoteOtpRequest = (studentId: string): VoteOtpRequest | null => {
    return findOtpRequest(studentId);
  };

  const approveVoteOtpRequest = async (studentId: string): Promise<string | null> => {
    try {
      const request = findOtpRequest(studentId);
      if (!request) return null;

      const otpCode = generateOtpCode();
      const approvedAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

      await upsertOtpRequest({
        ...request,
        status: 'approved',
        otpCode,
        approvedAt,
        expiresAt,
        attemptsLeft: OTP_MAX_ATTEMPTS,
        note: undefined,
      });

      setVerifiedOtps(prev => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });

      return otpCode;
    } catch (error) {
      console.error('Error approving OTP request:', error);
      return null;
    }
  };

  const markVoteOtpAsSent = async (studentId: string): Promise<boolean> => {
    try {
      const request = findOtpRequest(studentId);
      if (!request || !request.otpCode) return false;

      await upsertOtpRequest({
        ...request,
        status: 'sent',
        sentAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('Error marking OTP as sent:', error);
      return false;
    }
  };

  const rejectVoteOtpRequest = async (studentId: string, note: string = 'Rejected by admin'): Promise<boolean> => {
    try {
      const request = findOtpRequest(studentId);
      if (!request) return false;

      await upsertOtpRequest({
        ...request,
        status: 'rejected',
        otpCode: undefined,
        attemptsLeft: undefined,
        note,
      });

      setVerifiedOtps(prev => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
      return true;
    } catch (error) {
      console.error('Error rejecting OTP request:', error);
      return false;
    }
  };

  const clearVoteOtpRequest = async (studentId: string): Promise<boolean> => {
    try {
      const target = normalizeWithFallback(studentId);
      const nextRequests = otpRequests.filter((item) => normalizeWithFallback(item.studentId) !== target);
      await saveOtpRequests(nextRequests);
      return true;
    } catch (error) {
      console.error('Error clearing OTP request:', error);
      return false;
    }
  };

  const setFaceRequired = async (required: boolean): Promise<boolean> => {
    try {
      setFaceRequiredState(required);
      await Storage.setItem('faceRequired', required ? 'true' : 'false');
      await Storage.setItem('fingerprintRequired', required ? 'true' : 'false');
      if (!required) {
        setVerifiedFaces(new Set());
      }
      return true;
    } catch (error) {
      console.error('Error updating face requirement:', error);
      return false;
    }
  };

  const setStudentFace = async (studentId: string, faceCode: string): Promise<boolean> => {
    const cleanCode = faceCode.trim();
    if (!cleanCode) return false;

    try {
      const updatedTemplates = {
        ...faceTemplates,
        [studentId]: {
          code: cleanCode,
          updatedAt: new Date().toISOString(),
        },
      };
      setFaceTemplates(updatedTemplates);
      await Storage.setItem('faceTemplates', JSON.stringify(updatedTemplates));
      await Storage.setItem('fingerprintTemplates', JSON.stringify(updatedTemplates));
      return true;
    } catch (error) {
      console.error('Error saving face template:', error);
      return false;
    }
  };

  const clearStudentFace = async (studentId: string): Promise<boolean> => {
    try {
      const key = resolveStoredFaceKey(studentId);
      if (!key) return true;

      const updatedTemplates = { ...faceTemplates };
      delete updatedTemplates[key];

      setFaceTemplates(updatedTemplates);
      await Storage.setItem('faceTemplates', JSON.stringify(updatedTemplates));
      await Storage.setItem('fingerprintTemplates', JSON.stringify(updatedTemplates));

      setVerifiedFaces(prev => {
        const next = new Set(prev);
        next.delete(studentId);
        next.delete(key);
        return next;
      });

      return true;
    } catch (error) {
      console.error('Error clearing face template:', error);
      return false;
    }
  };

  const verifyStudentFace = async (studentId: string, faceCode: string): Promise<boolean> => {
    if (!faceRequired) return true;

    const template = findStoredFace(studentId);
    if (!template) return false;

    const incomingCode = faceCode.trim();
    const isMatch = isCameraFaceTemplate(template.code)
      ? isCameraFaceMatch(template.code, incomingCode)
      : template.code === incomingCode;

    if (isMatch) {
      setVerifiedFaces(prev => {
        const next = new Set(prev);
        next.add(studentId);
        return next;
      });
    }

    return isMatch;
  };

  const getFaceEnrollmentStatus = async (studentIds: string[]): Promise<Record<string, boolean>> => {
    const status: Record<string, boolean> = {};
    studentIds.forEach((studentId) => {
      status[studentId] = !!findStoredFace(studentId);
    });
    return status;
  };

  // Backward-compatible aliases
  const setFingerprintRequired = setFaceRequired;
  const setStudentFingerprint = setStudentFace;
  const clearStudentFingerprint = clearStudentFace;
  const verifyStudentFingerprint = verifyStudentFace;
  const isFingerprintVerified = isFaceVerified;
  const getFingerprintEnrollmentStatus = getFaceEnrollmentStatus;
  const fingerprintRequired = faceRequired;

  // Verify student ID for voting - just checks if ID matches, allows entry anytime
  const verifyStudentId = async (scannedId: string, expectedId: string): Promise<boolean> => {
    // Admin's QR code is B210305051 (app developer)
    const actualExpectedId = expectedId === 'admin' ? 'B210305051' : expectedId;
    // Extract last 9 digits from both IDs for comparison
    const scannedLast9 = scannedId.slice(-9);
    const expectedLast9 = actualExpectedId.slice(-9);
    
    console.log('Verifying ID:', {
      scanned: scannedId,
      expected: expectedId,
      scannedLast9,
      expectedLast9,
      match: scannedLast9 === expectedLast9
    });
    
    if (scannedLast9 === expectedLast9) {
      // ID matches - allow entry (voting restriction will be checked during vote casting)
      // Mark this ID as verified for this session
      setVerifiedVoters(prev => {
        const newSet = new Set(prev);
        newSet.add(expectedId);
        console.log('Added to verified voters:', expectedId);
        console.log('Current verified voters:', Array.from(newSet));
        return newSet;
      });
      return true;
    }
    console.log('ID verification failed: last 9 digits do not match');
    return false;
  };

  const castVote = async (candidateId: string, position: Position): Promise<boolean> => {
    if (!user) return false;

    try {
      // Check if user ID is verified
      if (!isIdVerified(user.studentId)) {
        console.error('User ID not verified for voting');
        return false;
      }

      if (faceRequired && !isFaceVerified(user.studentId)) {
        console.error('User face not verified for voting');
        return false;
      }

      if (otpRequired && !isOtpVerified(user.studentId)) {
        console.error('User OTP not verified for voting');
        return false;
      }

      // Check global voting record to prevent duplicate voting
      const globalVotingRecord = await Storage.getItem('globalVotingRecord');
      const votingRecord = globalVotingRecord ? JSON.parse(globalVotingRecord) : {};

      if (votingRecord[user.studentId]?.hasCompletedVoting) {
        console.error('This ID has already completed all voting');
        return false;
      }

      // Check if user already voted for this specific position via global record
      if (votingRecord[user.studentId]?.positions?.includes(position)) {
        console.error('This ID has already voted for this position');
        return false;
      }

      // Check if user already voted for this position
      const storedVotingData = await Storage.getItem(`voter_${user.studentId}`);
      const votingData = storedVotingData ? JSON.parse(storedVotingData) : { votedPositions: [] };

      if (votingData.votedPositions.includes(position)) {
        return false; // Already voted for this position
      }

      // Update candidate votes
      const updatedCandidates = candidates.map(candidate => {
        if (candidate.id === candidateId) {
          return { ...candidate, votes: candidate.votes + 1 };
        }
        return candidate;
      });

      setCandidates(updatedCandidates);
      await saveCandidates(updatedCandidates);

      // Update user voting record
      votingData.votedPositions.push(position);
      votingData.hasVoted = votingData.votedPositions.length === positions.length;
      await Storage.setItem(`voter_${user.studentId}`, JSON.stringify(votingData));

      // Update global voting record to prevent reuse of this ID
      votingRecord[user.studentId] = {
        timestamp: new Date().toISOString(),
        positions: votingData.votedPositions,
        hasCompletedVoting: votingData.hasVoted
      };
      await Storage.setItem('globalVotingRecord', JSON.stringify(votingRecord));

      // If user has completed all voting, clear session verifications and OTP request state.
      if (votingData.hasVoted) {
        setVerifiedVoters(prev => {
          const newSet = new Set(prev);
          newSet.delete(user.studentId);
          return newSet;
        });
        setVerifiedFaces(prev => {
          const newSet = new Set(prev);
          newSet.delete(user.studentId);
          return newSet;
        });
        setVerifiedOtps(prev => {
          const newSet = new Set(prev);
          newSet.delete(user.studentId);
          return newSet;
        });
        await clearVoteOtpRequest(user.studentId);
      }

      // Update election state
      const newState = {
        ...electionState,
        votedCount: electionState.votedCount + 1,
      };
      setElectionState(newState);
      await Storage.setItem('electionState', JSON.stringify(newState));

      return true;
    } catch (error) {
      console.error('Error casting vote:', error);
      return false;
    }
  };

  const hasVotedForPosition = (position: Position): boolean => {
    if (!user) return false;
    return user.votedPositions?.includes(position) || false;
  };

  const getResults = (): Map<Position, Candidate[]> => {
    const results = new Map<Position, Candidate[]>();

    positions.forEach(pos => {
      const positionCandidates = candidates
        .filter(c => c.position === pos.id)
        .sort((a, b) => b.votes - a.votes);
      results.set(pos.id, positionCandidates);
    });

    return results;
  };

  return (
    <VotingContext.Provider
      value={{
        candidates,
        positions,
        electionState,
        otpRequired,
        otpRequests,
        setOtpRequired,
        requestVoteOtp,
        verifyVoteOtp,
        isOtpVerified,
        getVoteOtpRequest,
        approveVoteOtpRequest,
        markVoteOtpAsSent,
        rejectVoteOtpRequest,
        clearVoteOtpRequest,
        faceRequired,
        setFaceRequired,
        setStudentFace,
        clearStudentFace,
        verifyStudentFace,
        isFaceVerified,
        getFaceEnrollmentStatus,
        fingerprintRequired,
        castVote,
        getResults,
        hasVotedForPosition,
        addCandidate,
        updateCandidate,
        deleteCandidate,
        verifyStudentId,
        isIdVerified,
        resetSecurityVerification,
        setFingerprintRequired,
        setStudentFingerprint,
        clearStudentFingerprint,
        verifyStudentFingerprint,
        isFingerprintVerified,
        getFingerprintEnrollmentStatus,
      }}
    >
      {children}
    </VotingContext.Provider>
  );
};

export const useVoting = (): VotingContextType => {
  const context = useContext(VotingContext);
  if (!context) {
    throw new Error('useVoting must be used within a VotingProvider');
  }
  return context;
};
