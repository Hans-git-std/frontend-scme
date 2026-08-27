import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckSquare,
  Search,
  CheckCircle2,
  AlertTriangle,
  Send,
  BookOpen,
  User,
  ShieldCheck,
  Tag,
  Info,
  Users,
  Filter,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import {
  ApiResponse,
  SubjectMarkResponse,
  VerifyMarksRequest,
  TeacherProfileResponse,
  PendingVerificationStudentResponse,
} from '../../types';
import { LoadingAnimation } from '../../components/ui/LoadingAnimation';

export const TeacherVerifyPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlRoll = searchParams.get('rollNumber') || '';

  const [rollNumber, setRollNumber] = useState(urlRoll);
  const [activeRoll, setActiveRoll] = useState(urlRoll);
  const [filterMySubjectsOnly, setFilterMySubjectsOnly] = useState(true);

  const [verificationRows, setVerificationRows] = useState<
    {
      subjectName: string;
      selfReportedMarks: number;
      verifiedMarks: number;
      semester: string;
      remarks: string;
      isVerified: boolean;
    }[]
  >([]);

  const queryClient = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    if (urlRoll) {
      setRollNumber(urlRoll);
      setActiveRoll(urlRoll);
    }
  }, [urlRoll]);

  // Fetch logged in teacher profile for authorized assigned subjects
  const { data: teacherProfile } = useQuery({
    queryKey: ['teacherProfile'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<TeacherProfileResponse>>('/teachers/profile');
      return res.data.data;
    },
  });

  // Fetch students awaiting verification matching this teacher's subjects
  const { data: pendingStudents, isLoading: isPendingLoading } = useQuery({
    queryKey: ['pendingStudentVerifications'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<PendingVerificationStudentResponse[]>>(
          '/teachers/pending-verifications'
        );
        return res.data.data || [];
      } catch {
        return [];
      }
    },
  });

  // Auto-select first student if no rollNumber specified and pending students exist
  useEffect(() => {
    if (!activeRoll && pendingStudents && pendingStudents.length > 0) {
      const first = pendingStudents[0].rollNumber;
      if (first) {
        setRollNumber(first);
        setActiveRoll(first);
        setSearchParams({ rollNumber: first });
      }
    }
  }, [pendingStudents, activeRoll, setSearchParams]);

  const assignedSubjects = useMemo(() => {
    return teacherProfile?.assignedSubjects || [];
  }, [teacherProfile]);

  const { data: marks, isLoading, isError, refetch } = useQuery({
    queryKey: ['teacherStudentMarks', activeRoll],
    queryFn: async () => {
      if (!activeRoll.trim()) return null;
      const res = await apiClient.get<ApiResponse<SubjectMarkResponse[]>>(
        `/teachers/students/${encodeURIComponent(activeRoll.trim())}/marks`
      );
      return res.data.data || [];
    },
    enabled: !!activeRoll.trim(),
  });

  useEffect(() => {
    if (marks && marks.length > 0) {
      setVerificationRows(
        marks.map((m) => ({
          subjectName: m.subjectName,
          selfReportedMarks: m.selfReportedMarks,
          verifiedMarks: m.verifiedMarks !== null && m.verifiedMarks !== undefined ? m.verifiedMarks : m.selfReportedMarks,
          semester: m.semester || 'Semester 4',
          remarks: m.verificationRemark?.startsWith('Verified')
            ? m.verificationRemark
            : 'Verified against university exam ledger',
          isVerified: m.isVerified,
        }))
      );
    } else {
      setVerificationRows([]);
    }
  }, [marks]);

  const isSubjectAssigned = (subjectName: string) => {
    if (assignedSubjects.length === 0) return true;
    const normalized = subjectName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return assignedSubjects.some((s) => s.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized);
  };

  const verifyMutation = useMutation({
    mutationFn: async (payload: VerifyMarksRequest) => {
      const res = await apiClient.post<ApiResponse<SubjectMarkResponse[]>>(
        `/teachers/students/${encodeURIComponent(activeRoll.trim())}/marks/verify`,
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success(
        'Marks Verified & Signed',
        `Official scores confirmed and audit trail recorded for Roll No: ${activeRoll}`
      );
      queryClient.invalidateQueries({ queryKey: ['teacherStudentMarks', activeRoll] });
      queryClient.invalidateQueries({ queryKey: ['pendingStudentVerifications'] });
      refetch();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Verification submission failed';
      toast.error('Verification Authorization Failed', msg);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber.trim()) {
      toast.error('Search Error', 'Please enter a student roll number');
      return;
    }
    setActiveRoll(rollNumber.trim());
    setSearchParams({ rollNumber: rollNumber.trim() });
  };

  const handleSelectStudent = (selectedRoll: string) => {
    setRollNumber(selectedRoll);
    setActiveRoll(selectedRoll);
    setSearchParams({ rollNumber: selectedRoll });
  };

  const handleScoreChange = (index: number, val: string) => {
    const num = parseFloat(val);
    setVerificationRows((prev) =>
      prev.map((row, i) => {
        if (i === index) {
          return {
            ...row,
            verifiedMarks: isNaN(num) ? 0 : Math.min(100, Math.max(0, num)),
          };
        }
        return row;
      })
    );
  };

  const handleRemarksChange = (index: number, val: string) => {
    setVerificationRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, remarks: val } : row))
    );
  };

  const handleCommitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationRows.length === 0) return;

    // Filter only rows that the teacher is authorized to verify
    const authorizedRows = verificationRows.filter((r) => isSubjectAssigned(r.subjectName));

    if (authorizedRows.length === 0) {
      toast.error('Authorization Error', 'None of the visible subjects are assigned to your faculty profile.');
      return;
    }

    const payload: VerifyMarksRequest = {
      verifiedMarks: authorizedRows.map((r) => ({
        subjectName: r.subjectName,
        verifiedMarks: r.verifiedMarks,
        semester: r.semester,
        remarks: r.remarks || 'Verified against official course ledger',
      })),
    };

    verifyMutation.mutate(payload);
  };

  // Split rows into Teacher's Assigned vs Other Department
  const assignedRowsWithIndex = useMemo(() => {
    return verificationRows
      .map((row, idx) => ({ ...row, originalIndex: idx }))
      .filter((r) => isSubjectAssigned(r.subjectName));
  }, [verificationRows, assignedSubjects]);

  const otherRowsWithIndex = useMemo(() => {
    return verificationRows
      .map((row, idx) => ({ ...row, originalIndex: idx }))
      .filter((r) => !isSubjectAssigned(r.subjectName));
  }, [verificationRows, assignedSubjects]);

  const allAssignedAreVerified = assignedRowsWithIndex.length > 0 && assignedRowsWithIndex.every((r) => r.isVerified);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Official Marks Verification Console
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Audit student self-reported marks and record official faculty signatures for assigned subjects
          </p>
        </div>

        {assignedSubjects.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl text-xs">
            <span className="font-semibold text-indigo-900 dark:text-indigo-200">Your Assigned Subjects:</span>
            {assignedSubjects.map((sub, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-[10px]"
              >
                {sub}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Candidate Selector & Search */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="Enter Student Roll Number (e.g. CS-2026-089 or STU-849201)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Audit Student</span>
          </button>
        </form>

        {/* Quick Students Selection Chips */}
        {pendingStudents && pendingStudents.length > 0 ? (
          <div className="pt-2 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Users className="w-3.5 h-3.5" />
                <span>Students Awaiting Your Verification ({pendingStudents.length}):</span>
              </span>
              <span className="text-[11px]">Click a student to load their marksheet</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {pendingStudents.map((stu) => (
                <button
                  key={stu.rollNumber}
                  type="button"
                  onClick={() => handleSelectStudent(stu.rollNumber || '')}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    activeRoll === stu.rollNumber
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md font-semibold'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{stu.studentName || 'Student'}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      activeRoll === stu.rollNumber ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {stu.unverifiedCount} pending
                    </span>
                  </div>
                  <p className={`text-[11px] font-mono mt-0.5 ${activeRoll === stu.rollNumber ? 'text-indigo-100' : 'text-slate-400'}`}>
                    Roll: {stu.rollNumber}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="pt-1 text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>No pending student submissions in your assigned courses. You can still search any roll number above.</span>
          </div>
        )}
      </div>

      {/* Verification Audit Sheet */}
      {isLoading ? (
        <LoadingAnimation message="Fetching Student Marksheet..." subMessage="Querying verified academic records and faculty audit ledger" variant="card" />
      ) : isError ? (
        <div className="glass-card rounded-2xl p-8 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Student Record Not Found
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No academic marks were found for roll number <strong>{activeRoll}</strong>. Please check the spelling or select a student from the cards above.
          </p>
        </div>
      ) : !activeRoll ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3">
          <CheckSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="text-xs text-slate-500">
            Enter a student roll number or select a candidate above to audit academic marks.
          </p>
        </div>
      ) : verificationRows.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center space-y-3">
          <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            No Submitted Marks for {activeRoll}
          </h4>
          <p className="text-xs text-slate-500">
            The student has not self-reported any semester marks yet.
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                <span>Auditing Roll Number: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{activeRoll}</strong></span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {assignedRowsWithIndex.length} course(s) under your teaching assignment • {otherRowsWithIndex.length} other course(s)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterMySubjectsOnly}
                  onChange={(e) => setFilterMySubjectsOnly(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Focus on My Subjects Only</span>
              </label>

              {allAssignedAreVerified ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-xs font-bold border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Your Subjects Fully Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-500/20">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Verification Action Required
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleCommitVerification} className="space-y-6">
            {/* Section 1: Teacher's Assigned Subjects */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Your Assigned Teaching Subjects ({assignedRowsWithIndex.length})
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-semibold">
                  Authorized for Signature
                </span>
              </div>

              {assignedRowsWithIndex.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-center">
                  This student has not submitted marks for any of your assigned subjects ({assignedSubjects.join(', ')}).
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-3">Subject Name</th>
                        <th className="py-3 px-3">Semester</th>
                        <th className="py-3 px-3">Self-Reported</th>
                        <th className="py-3 px-3 min-w-[120px]">Official Verified Mark</th>
                        <th className="py-3 px-3 min-w-[200px]">Verification Audit Remark</th>
                        <th className="py-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
                      {assignedRowsWithIndex.map((row) => {
                        const idx = row.originalIndex;
                        return (
                          <tr key={idx} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors">
                            <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                              <span>{row.subjectName}</span>
                            </td>
                            <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                              {row.semester}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                              {row.selfReportedMarks?.toFixed(1) || '0.0'}
                            </td>
                            <td className="py-3 px-3">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={row.verifiedMarks}
                                onChange={(e) => handleScoreChange(idx, e.target.value)}
                                className="w-24 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                              />
                            </td>
                            <td className="py-3 px-3">
                              <input
                                type="text"
                                value={row.remarks}
                                onChange={(e) => handleRemarksChange(idx, e.target.value)}
                                placeholder="e.g. Verified against university exam ledger"
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="py-3 px-3">
                              {row.isVerified ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-semibold text-[11px]">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-medium text-[11px]">
                                  Pending Audit
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Section 2: Other Department Subjects (if toggle disabled or present) */}
            {!filterMySubjectsOnly && otherRowsWithIndex.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Other Department Subjects ({otherRowsWithIndex.length})
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    Audited by Respective Course Faculty
                  </span>
                </div>

                <div className="overflow-x-auto opacity-75">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Subject Name</th>
                        <th className="py-2 px-3">Semester</th>
                        <th className="py-2 px-3">Self-Reported</th>
                        <th className="py-2 px-3">Verified Score</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-600 dark:text-slate-400">
                      {otherRowsWithIndex.map((row) => (
                        <tr key={row.originalIndex}>
                          <td className="py-2 px-3 font-medium">{row.subjectName}</td>
                          <td className="py-2 px-3">{row.semester}</td>
                          <td className="py-2 px-3 font-mono">{row.selfReportedMarks?.toFixed(1) || '0.0'}</td>
                          <td className="py-2 px-3 font-mono">{row.verifiedMarks !== null ? row.verifiedMarks.toFixed(1) : 'Not audited'}</td>
                          <td className="py-2 px-3">
                            {row.isVerified ? (
                              <span className="text-emerald-600 font-semibold">✓ Verified</span>
                            ) : (
                              <span className="text-amber-600">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Submit Action */}
            {assignedRowsWithIndex.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400">
                  Submitting attaches your official digital faculty signature to your assigned subjects ({assignedRowsWithIndex.length})
                </span>
                <button
                  type="submit"
                  disabled={verifyMutation.isPending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {verifyMutation.isPending ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Commit Official Verification & Signature</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>

          {verifyMutation.isPending && (
            <LoadingAnimation
              message="Recording Faculty Audit Signature..."
              subMessage="Saving verified scores to university ledger with digital timestamp"
              variant="compact"
            />
          )}
        </div>
      )}
    </div>
  );
};
