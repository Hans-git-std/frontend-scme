import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import {
  ApiResponse,
  SubjectMarkResponse,
  VerifyMarksRequest,
  TeacherProfileResponse,
  StudentProfileResponse,
} from '../../types';
import { LoadingAnimation } from '../../components/ui/LoadingAnimation';

export const TeacherVerifyPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlRoll = searchParams.get('rollNumber') || '';

  const [rollNumber, setRollNumber] = useState(urlRoll);
  const [activeRoll, setActiveRoll] = useState(urlRoll);
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

  // Fetch student candidates list
  const { data: studentsList } = useQuery({
    queryKey: ['adminStudents'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<StudentProfileResponse[]>>('/admin/students');
        return res.data.data || [];
      } catch {
        return [];
      }
    },
  });

  const assignedSubjects = teacherProfile?.assignedSubjects || [];

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
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
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

  const isSubjectAssigned = (subjectName: string) => {
    if (assignedSubjects.length === 0) return true;
    const normalized = subjectName.toLowerCase().replace(/\s+/g, ' ').trim();
    return assignedSubjects.some((s) => s.toLowerCase().replace(/\s+/g, ' ').trim() === normalized);
  };

  const handleCommitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationRows.length === 0) return;

    const payload: VerifyMarksRequest = {
      verifiedMarks: verificationRows.map((r) => ({
        subjectName: r.subjectName,
        verifiedMarks: r.verifiedMarks,
        semester: r.semester,
        remarks: r.remarks,
      })),
    };

    verifyMutation.mutate(payload);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Official Student Marks Verification Console
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Audit student self-reported marks across 1000+ course catalogs and record official faculty signatures
        </p>
      </div>

      {/* Roll Number Search Card */}
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
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>Fetch Marksheet</span>
          </button>
        </form>

        {/* Quick Students Selection Chips */}
        {studentsList && studentsList.length > 0 && (
          <div className="pt-2 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Quick select candidate roll number:</span>
            <div className="flex flex-wrap gap-1.5">
              {studentsList.map((stu) => (
                <button
                  key={stu.id}
                  type="button"
                  onClick={() => handleSelectStudent(stu.rollNumber || '')}
                  className={`text-xs px-2.5 py-1 rounded-xl font-mono transition-all ${
                    activeRoll === stu.rollNumber
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  {stu.fullName ? `${stu.fullName} (${stu.rollNumber})` : stu.rollNumber}
                </button>
              ))}
            </div>
          </div>
        )}

        {assignedSubjects.length > 0 && (
          <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Your Assigned Subjects:</span>
            {assignedSubjects.map((sub, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium border border-indigo-200/60 dark:border-indigo-800/40"
              >
                {sub}
              </span>
            ))}
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
            No academic marks were found for roll number <strong>{activeRoll}</strong>. Please check the spelling or select a student from the chips above.
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                Student Roll No: <span className="font-mono text-indigo-600 dark:text-indigo-400">{activeRoll}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Auditing {verificationRows.length} course mark records
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Faculty Verified Audit Access
            </div>
          </div>

          <form onSubmit={handleCommitVerification} className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3">Subject Name</th>
                    <th className="py-3 px-3">Semester</th>
                    <th className="py-3 px-3">Self-Reported</th>
                    <th className="py-3 px-3 min-w-[120px]">Official Verified Mark</th>
                    <th className="py-3 px-3 min-w-[200px]">Verification Audit Remark</th>
                    <th className="py-3 px-3">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
                  {verificationRows.map((row, idx) => {
                    const isAssigned = isSubjectAssigned(row.subjectName);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 space-y-1">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {row.subjectName}
                          </span>
                          {isAssigned ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-medium">
                              Your Assigned Subject
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              Other Faculty Department
                            </span>
                          )}
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
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400">
                Submitting records attaches your digital signature to verified course marks
              </span>
              <button
                type="submit"
                disabled={verifyMutation.isPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
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
