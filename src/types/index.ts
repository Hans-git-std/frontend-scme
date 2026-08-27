// ==========================================
// Standard API Envelope & Error Contracts
// ==========================================

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  status: number;
  error: string;
  message: string;
  timestamp: string;
  path?: string;
}

// ==========================================
// Enums & Literal Unions
// ==========================================

export type UserRole = 'ROLE_STUDENT' | 'ROLE_TEACHER' | 'ROLE_COMPANY' | 'ROLE_ADMIN';

export type SkillProficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export type MatchType = 'STRICT' | 'RELAXED_WEIGHTED';

export type CompanyVerificationStatus = 'VERIFIED' | 'NOT_VERIFIED' | 'REJECTED';

export type TeacherApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// ==========================================
// Authentication & Session Models
// ==========================================

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  email: string;
  role: UserRole;
}

export interface OtpSendRequest {
  email: string;
  role: UserRole;
}

export interface AdminOtpSendRequest {
  email: string;
  password: string;
  sendToRecoveryEmail?: boolean;
}

export interface OtpVerifyRequest {
  email: string;
  otp: string;
}

export interface TokenRefreshRequest {
  refreshToken: string;
}

// ==========================================
// Student Domain Models
// ==========================================

export interface SubjectMarkResponse {
  id: number;
  subjectName: string;
  selfReportedMarks: number;
  verifiedMarks: number | null;
  isVerified: boolean;
  semester: string;
  verifiedByTeacherId: string | null;
  verifiedByTeacherName: string | null;
  verifiedAt: string | null;
  verificationRemark: string | null;
}

export interface StudentSkillResponse {
  id: number;
  skillName: string;
  proficiency: SkillProficiency;
  yearsOfExperience: number;
}

export interface StudentProfileResponse {
  id: number;
  email: string;
  fullName: string;
  rollNumber: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  aggregatePercentage: number;
  allMarksVerified: boolean;
  verificationRemark: string;
  academicMarks: SubjectMarkResponse[];
  skills: StudentSkillResponse[];
}

export interface SubjectMarkEntry {
  subjectName: string;
  marksObtained: number;
  semester: string;
}

export interface SelfReportMarksRequest {
  marks: SubjectMarkEntry[];
}

export interface StudentSkillRequest {
  skillName: string;
  proficiency: SkillProficiency;
  yearsOfExperience?: number;
}

export interface StudentProfileRequest {
  fullName?: string;
  rollNumber?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

// ==========================================
// Matching Engine Models
// ==========================================

export interface SubjectGapDetail {
  subjectName: string;
  actualScore: number;
  requiredScore: number;
  deficit: number;
  gapRemark: string;
}

export interface CompanyMatchResponse {
  companyId: number;
  companyName: string;
  logoUrl?: string;
  location?: string;
  companyVerificationStatus: CompanyVerificationStatus;
  roleTitle: string;
  matchScore: number;
  matchType: MatchType;
  isVerificationPending: boolean;
  verificationRemark?: string;
  matchedSkills: string[];
  missingSkills: string[];
  subjectGaps: SubjectGapDetail[];
  academicGapSummary?: string;
}

// ==========================================
// Teacher Domain Models
// ==========================================

export interface TeacherProfileResponse {
  id: number;
  email: string;
  fullName: string;
  employeeId: string;
  department: string;
  designation: string;
  phoneNumber?: string;
  approvalStatus: TeacherApprovalStatus;
  rejectionReason?: string;
  assignedSubjects: string[];
  verifiedByAdminAt?: string;
}

export interface TeacherRegisterRequest {
  fullName: string;
  email: string;
  employeeId: string;
  department: string;
  designation: string;
  phoneNumber?: string;
  assignedSubjects: string[];
}

export interface TeacherProfileRequest {
  fullName?: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  phoneNumber?: string;
  assignedSubjects?: string[];
}

export interface PendingVerificationStudentResponse {
  studentId: number;
  studentName: string;
  rollNumber: string;
  email: string;
  unverifiedCount: number;
  pendingMarks?: SubjectMarkResponse[];
}

export interface TeacherMarkVerificationEntry {
  subjectName: string;
  verifiedMarks: number;
  semester?: string;
  remarks?: string;
}

export interface VerifyMarksRequest {
  verifiedMarks: TeacherMarkVerificationEntry[];
}

export interface TeacherRejectRequest {
  reason: string;
}

export interface CreateTeacherRequest {
  fullName: string;
  email: string;
  employeeId: string;
  department: string;
  designation: string;
  phoneNumber?: string;
  assignedSubjects: string[];
}

// ==========================================
// Company Domain Models
// ==========================================

export interface RequiredSkillEntry {
  skillName: string;
  minProficiency: SkillProficiency;
  weightage?: number;
  isMandatory?: boolean;
}

export interface SubjectCutoffEntry {
  subjectName: string;
  minMarksCutoff: number;
  isMandatory?: boolean;
}

export interface HiringCriteriaRequest {
  roleTitle: string;
  jobDescription?: string;
  minOverallPercentage?: number;
  requiredSkills: RequiredSkillEntry[];
  subjectCutoffs: SubjectCutoffEntry[];
}

export interface HiringCriteriaResponse {
  id: number;
  roleTitle: string;
  jobDescription?: string;
  minOverallPercentage: number;
  requiredSkills: {
    id: number;
    skillName: string;
    minProficiency: SkillProficiency;
    weightage: number;
    isMandatory: boolean;
  }[];
  subjectCutoffs: {
    id: number;
    subjectName: string;
    minMarksCutoff: number;
    isMandatory: boolean;
  }[];
}

export interface CompanyProfileResponse {
  id: number;
  email: string;
  companyName: string;
  industry?: string;
  websiteUrl?: string;
  location?: string;
  description?: string;
  logoUrl?: string;
  verificationStatus: CompanyVerificationStatus;
  adminRemarks?: string;
  activeCriteriaCount?: number;
  criteriaList?: HiringCriteriaResponse[];
  hiringCriteria?: HiringCriteriaResponse[];
}

export interface CompanyPublicResponse {
  id: number;
  companyName: string;
  industry?: string;
  websiteUrl?: string;
  location?: string;
  description?: string;
  logoUrl?: string;
  verificationStatus: CompanyVerificationStatus;
  verificationBadge?: string;
  activeCriteria?: HiringCriteriaResponse[];
  criteria?: HiringCriteriaResponse[];
  hiringCriteria?: HiringCriteriaResponse[];
}

export interface CompanyRegisterRequest {
  companyName: string;
  email: string;
  industry?: string;
  websiteUrl?: string;
  location?: string;
  description?: string;
  logoUrl?: string;
}

export interface CompanyProfileRequest {
  companyName?: string;
  industry?: string;
  websiteUrl?: string;
  location?: string;
  description?: string;
  logoUrl?: string;
}

export interface CompanyStatusUpdateRequest {
  status: CompanyVerificationStatus;
  adminRemarks?: string;
}

// ==========================================
// Admin Operations & Diagnostics Models
// ==========================================

export interface AdminDashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalCompanies: number;
  pendingTeacherApprovals: number;
  totalMatchesCalculated?: number;
}

export interface SystemDiagnostics {
  serverStatus: string;
  jvmVersion: string;
  uptimeSeconds: number;
  memoryUsage: {
    usedMemoryMb: number;
    freeMemoryMb: number;
    totalAllocatedMemoryMb: number;
    maxAvailableHeapMb: number;
    jvmAvailableProcessors?: number;
  };
  databaseStats: {
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalCompanies: number;
    pendingTeacherApprovals: number;
  };
  mailQuotaStats: {
    dailyDispatchesCount: number;
    dailyQuotaLimit: number;
    remainingDailyQuota: number;
  };
  adminEmail: string;
  adminRecoveryEmail: string;
}

// ==========================================
// Multi-Domain Catalog Models
// ==========================================

export interface DomainCatalog {
  domainCode: 'CSE' | 'MECH' | 'ECE' | 'EE' | 'CHEM' | 'CIVIL' | 'AI_DS' | string;
  domainName: string;
  description: string;
  subjects: string[];
  skills: string[];
}

