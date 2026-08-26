import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  GraduationCap,
  CheckSquare,
  Search,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  ListChecks,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import {
  ApiResponse,
  TeacherProfileResponse,
  PendingVerificationStudentResponse,
} from '../../types';
import { CardSkeleton } from '../../components/ui/Skeleton';

export const TeacherDashboardPage: React.FC = () => {
  const [rollNumber, setRollNumber] = useState('');
  const navigate = useNavigate();

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacherProfile'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<TeacherProfileResponse>>('/teachers/profile');
      return res.data.data;
    },
  });

  // Call the official backend endpoint for pending student mark verifications
  const { data: pendingVerifications, isLoading: isPendingLoading } = useQuery({
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

  const handleSearchStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (rollNumber.trim()) {
      navigate(`/teacher/verify?rollNumber=${encodeURIComponent(rollNumber.trim())}`);
    }
  };

  if (isLoading) {
    return <CardSkeleton />;
  }

  const isTeacherApproved = teacher?.approvalStatus === 'APPROVED';
  const assignedSubs = teacher?.assignedSubjects || [];

  return (
    <div className="space-y-8">
      {/* Approval Status Banner if Pending */}
      {!isTeacherApproved && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Faculty Application Under Review</h4>
            <p className="mt-0.5 text-amber-800 dark:text-amber-300">
              Your teacher account is currently in <strong>{teacher?.approvalStatus || 'PENDING'}</strong> status. The University Administrator must approve your account before your verified marks can be signed to the ledger.
            </p>
          </div>
        </div>
      )}

      {/* Faculty Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-brand-700 text-white p-6 sm:p-8 shadow-lg shadow-indigo-500/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Official University Marks Verification Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {teacher?.fullName ? `Welcome, ${teacher.fullName}` : 'Faculty Workspace'}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
              {teacher?.department || 'Department of Engineering'} • Designation: {teacher?.designation || 'Faculty Member'} • Employee ID: <span className="font-mono font-bold text-amber-300">{teacher?.employeeId || 'N/A'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/teacher/verify"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs sm:text-sm font-bold shadow-md transition-all"
            >
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <span>Verify Marks by Roll No</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Pending Student Marks Verification Queue */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Students Awaiting Mark Verification ({pendingVerifications?.length || 0})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Candidates who have self-reported marks matching your assigned teaching subjects
            </p>
          </div>
          <Link
            to="/teacher/verify"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>Open Verification Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isPendingLoading ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading pending verification queue...</div>
        ) : !pendingVerifications || pendingVerifications.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              No Pending Verifications in Your Subjects
            </h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              All submitted student marks in your assigned courses are audited and up to date!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {pendingVerifications.map((p) => (
              <button
                key={p.studentId || p.rollNumber}
                onClick={() => navigate(`/teacher/verify?rollNumber=${encodeURIComponent(p.rollNumber || '')}`)}
                className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-500/70 text-left transition-all group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {p.studentName || 'Student Candidate'}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-lg">
                    {p.rollNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>{p.email}</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {p.unverifiedCount} unverified course{p.unverifiedCount === 1 ? '' : 's'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Roll Number Lookup Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Direct Student Marksheet Search
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter any roll number to audit marks or verify scores
            </p>
          </div>
        </div>

        <form onSubmit={handleSearchStudent} className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="e.g. CS-2026-089 or STU-849201..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <span>Audit Marksheet</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Assigned Subjects Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Your Assigned Teaching Subjects ({assignedSubs.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Subjects you are authorized to verify and audit
            </p>
          </div>
          <Link
            to="/teacher/profile"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Update Subjects
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {assignedSubs.length > 0 ? (
            assignedSubs.map((sub, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                  {i + 1}
                </div>
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  {sub}
                </span>
              </div>
            ))
          ) : (
            <div className="col-span-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                No teaching subjects assigned yet.
              </p>
              <Link to="/teacher/profile" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold underline">
                Configure your assigned subjects in profile →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
