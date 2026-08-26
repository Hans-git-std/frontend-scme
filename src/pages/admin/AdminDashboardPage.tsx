import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Cpu,
  Mail,
  Users,
  GraduationCap,
  Building2,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  ArrowRight,
  RefreshCw,
  Clock,
  Server,
  Eye,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import {
  ApiResponse,
  SystemDiagnostics,
  TeacherProfileResponse,
  CompanyProfileResponse,
  AdminDashboardStats,
} from '../../types';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { LoadingAnimation } from '../../components/ui/LoadingAnimation';
import { Modal } from '../../components/ui/Modal';
import { formatUptime } from '../../lib/utils';

export const AdminDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [selectedRejectTeacher, setSelectedRejectTeacher] = useState<TeacherProfileResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('Qualifications or employee verification required.');

  // Real-time diagnostics query
  const { data: diagnostics, isLoading: isDiagLoading, refetch: refetchDiag, isFetching } = useQuery({
    queryKey: ['systemDiagnostics'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<SystemDiagnostics>>('/admin/system/diagnostics');
      return res.data.data;
    },
    refetchInterval: 10000,
  });

  // Pending teachers queue
  const { data: pendingTeachers, isLoading: isTeachersLoading } = useQuery({
    queryKey: ['pendingTeachers'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>('/admin/teachers/pending');
        const raw = res.data;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        if (Array.isArray(raw?.data?.content)) return raw.data.content;
        return [];
      } catch {
        return [];
      }
    },
  });

  // Pending companies queue (checks /admin/companies/pending, with fallback filtering NOT_VERIFIED from /admin/companies or public)
  const { data: pendingCompanies, isLoading: isCompaniesLoading } = useQuery({
    queryKey: ['pendingCompanies'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>('/admin/companies/pending');
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
        if (list.length > 0) return list;
      } catch {
        // Continue to fallback
      }

      try {
        const resAll = await apiClient.get<any>('/admin/companies');
        const rawAll = resAll.data;
        const list = Array.isArray(rawAll) ? rawAll : (Array.isArray(rawAll?.data) ? rawAll.data : []);
        const unverified = list.filter((c: any) => c && (c.verificationStatus === 'NOT_VERIFIED' || c.verificationStatus === 'PENDING'));
        if (unverified.length > 0) return unverified;
      } catch {
        // Continue to fallback
      }

      try {
        const resPub = await apiClient.get<any>('/companies/public');
        const rawPub = resPub.data;
        const listPub = Array.isArray(rawPub) ? rawPub : (Array.isArray(rawPub?.data) ? rawPub.data : []);
        return listPub.filter((c: any) => c && (c.verificationStatus === 'NOT_VERIFIED' || c.verificationStatus === 'PENDING'));
      } catch {
        return [];
      }
    },
  });

  // Approve Teacher Mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post<ApiResponse<TeacherProfileResponse>>(`/admin/teachers/${id}/approve`);
      return res.data;
    },
    onSuccess: (_, id) => {
      toast.success('Faculty Approved', `Teacher application ID ${id} approved successfully`);
      queryClient.invalidateQueries({ queryKey: ['pendingTeachers'] });
      queryClient.invalidateQueries({ queryKey: ['adminTeachers'] });
      queryClient.invalidateQueries({ queryKey: ['systemDiagnostics'] });
    },
    onError: (err: any) => {
      toast.error('Approval Error', err.response?.data?.message || err.message);
    },
  });

  // Approve Company Mutation
  const approveCompanyMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        const res = await apiClient.patch<ApiResponse<CompanyProfileResponse>>(
          `/admin/companies/${id}/status`,
          { status: 'VERIFIED', adminRemarks: 'Approved by administrator' }
        );
        return res.data;
      } catch (err: any) {
        if (err.response?.status === 405 || err.response?.status === 404) {
          try {
            const putRes = await apiClient.put<ApiResponse<CompanyProfileResponse>>(
              `/admin/companies/${id}/status`,
              { status: 'VERIFIED', adminRemarks: 'Approved by administrator' }
            );
            return putRes.data;
          } catch {
            const postRes = await apiClient.post<ApiResponse<CompanyProfileResponse>>(
              `/admin/companies/${id}/approve`
            );
            return postRes.data;
          }
        }
        throw err;
      }
    },
    onSuccess: (_, id) => {
      toast.success('Company Verified', `Corporate partner ID ${id} is now verified and active.`);
      queryClient.invalidateQueries({ queryKey: ['pendingCompanies'] });
      queryClient.invalidateQueries({ queryKey: ['adminCompanies'] });
      queryClient.invalidateQueries({ queryKey: ['publicCompanies'] });
      queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
      queryClient.invalidateQueries({ queryKey: ['systemDiagnostics'] });
    },
    onError: (err: any) => {
      toast.error('Verification Error', err.response?.data?.message || err.message);
    },
  });

  // Reject Teacher Mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await apiClient.post<ApiResponse<TeacherProfileResponse>>(`/admin/teachers/${id}/reject`, {
        reason,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.info('Faculty Rejected', 'Application was rejected and recorded in audit log');
      setSelectedRejectTeacher(null);
      queryClient.invalidateQueries({ queryKey: ['pendingTeachers'] });
      queryClient.invalidateQueries({ queryKey: ['systemDiagnostics'] });
    },
    onError: (err: any) => {
      toast.error('Rejection Error', err.response?.data?.message || err.message);
    },
  });

  const memory = diagnostics?.memoryUsage;
  const memoryPercent = memory
    ? Math.round((memory.usedMemoryMb / memory.totalAllocatedMemoryMb) * 100)
    : 0;

  // Daily mail quota baseline 300 (Gmail SMTP production cap)
  const dailyMailQuotaLimit = 300;
  const dailyDispatches = diagnostics?.mailQuotaStats?.dailyDispatchesCount || 0;
  const mailPercent = Math.min(100, Math.round((dailyDispatches / 300) * 100));
  const remainingMailQuota = Math.max(0, 300 - dailyDispatches);

  return (
    <div className="space-y-8">
      {/* Root Admin Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-950 text-white p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Master Admin Security Perimeter</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Platform Diagnostics & Command Console
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Server: <span className="font-mono text-emerald-400 font-bold">{diagnostics?.serverStatus || 'HEALTHY'}</span> • JVM: {diagnostics?.jvmVersion || '21.0.7'} • Live Uptime: <span className="font-mono text-amber-300">{formatUptime(diagnostics?.uptimeSeconds || 0)}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => refetchDiag()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold border border-slate-700 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
            <Link
              to="/admin/diagnostics"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-bold shadow-md transition-all"
            >
              <Activity className="w-4 h-4" />
              <span>Full Telemetry</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Real-Time System Telemetry Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* JVM RAM Progress Card */}
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Low-RAM JVM Memory Allocation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target 256MB JVM Container on 500MB Host (Serial GC + C1 JIT)
                </p>
              </div>
            </div>
            <span className="font-mono text-sm font-extrabold text-brand-600 dark:text-brand-400">
              {memoryPercent}%
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  memoryPercent > 80 ? 'bg-rose-500' : 'bg-gradient-to-r from-brand-500 to-sky-400'
                }`}
                style={{ width: `${Math.min(100, memoryPercent)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Used: {memory?.usedMemoryMb || 0} MB</span>
              <span>Free: {memory?.freeMemoryMb || 0} MB</span>
              <span>Allocated: {memory?.totalAllocatedMemoryMb || 256} MB</span>
            </div>
          </div>
        </div>

        {/* Daily SMTP Email Quota Card */}
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Daily SMTP Quota Counter (300 Daily Cap)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Resets daily at 00:00 UTC with anti-abuse 60s cooldown
                </p>
              </div>
            </div>
            <span className="font-mono text-sm font-extrabold text-sky-600 dark:text-sky-400">
              {dailyDispatches} / {dailyMailQuotaLimit}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-teal-400 transition-all duration-700"
                style={{ width: `${Math.min(100, mailPercent)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Dispatches Today: {dailyDispatches}</span>
              <span>Remaining: {remainingMailQuota}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Entity Totals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card rounded-2xl p-5 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Accounts
            </span>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {diagnostics?.databaseStats?.totalUsers ?? ((diagnostics?.databaseStats?.totalStudents || 0) + (diagnostics?.databaseStats?.totalTeachers || 0) + (diagnostics?.databaseStats?.totalCompanies || 0) + 1)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Registered auth accounts
          </p>
        </div>

        <Link
          to="/admin/students"
          className="glass-card rounded-2xl p-5 hover:border-brand-500/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Students
            </span>
            <GraduationCap className="w-5 h-5 text-brand-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {diagnostics?.databaseStats?.totalStudents || 0}
          </h3>
          <p className="text-[11px] text-brand-600 font-semibold mt-0.5 flex items-center gap-1">
            <span>Manage records</span> <ArrowRight className="w-3 h-3" />
          </p>
        </Link>

        <Link
          to="/admin/teachers"
          className="glass-card rounded-2xl p-5 hover:border-indigo-500/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Faculty
            </span>
            <UserCheck className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {diagnostics?.databaseStats?.totalTeachers || 0}
          </h3>
          <p className="text-[11px] text-indigo-600 font-semibold mt-0.5 flex items-center gap-1">
            <span>View faculty list</span> <ArrowRight className="w-3 h-3" />
          </p>
        </Link>

        <Link
          to="/admin/companies"
          className="glass-card rounded-2xl p-5 hover:border-sky-500/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Hiring Companies
            </span>
            <Building2 className="w-5 h-5 text-sky-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {diagnostics?.databaseStats?.totalCompanies || 0}
          </h3>
          <p className="text-[11px] text-sky-600 font-semibold mt-0.5 flex items-center gap-1">
            <span>Corporate directory</span> <ArrowRight className="w-3 h-3" />
          </p>
        </Link>

        <div className="glass-card rounded-2xl p-5 border-amber-300 dark:border-amber-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Pending Approvals
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {(pendingTeachers?.length || 0) + (pendingCompanies?.length || 0)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {pendingTeachers?.length || 0} Faculty • {pendingCompanies?.length || 0} Company
          </p>
        </div>
      </div>

      {/* Pending Unverified Companies Queue */}
      {pendingCompanies && pendingCompanies.length > 0 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4 border-amber-200/80 dark:border-amber-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-500" />
                Pending Employer Verification Queue ({pendingCompanies.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Self-registered companies waiting for admin verification to enable placement matching
              </p>
            </div>
            <Link to="/admin/companies" className="text-xs font-semibold text-sky-600 hover:underline">
              All Companies
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Company Name</th>
                  <th className="py-3 px-3">Recruiter Email</th>
                  <th className="py-3 px-3">Industry & Location</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
                {pendingCompanies.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {c.companyName}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {c.email}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {c.industry || 'Technology'} • {c.location || 'Global'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => approveCompanyMutation.mutate(c.id || c.companyId)}
                        disabled={approveCompanyMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify & Approve</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Faculty Approval Queue */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-500" />
              Pending Faculty Verification Queue ({pendingTeachers?.length || 0})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Self-registered teachers waiting for admin validation before marks verification access is enabled
            </p>
          </div>
          <Link
            to="/admin/teachers"
            className="text-xs font-semibold text-brand-600 hover:underline"
          >
            All Teachers
          </Link>
        </div>

        {isTeachersLoading ? (
          <TableSkeleton rows={3} cols={5} />
        ) : !pendingTeachers || pendingTeachers.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs text-slate-500">
              Zero pending faculty registrations. All applications are up to date!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Faculty Name</th>
                  <th className="py-3 px-3">Email & Employee ID</th>
                  <th className="py-3 px-3">Department & Designation</th>
                  <th className="py-3 px-3">Assigned Subjects</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
                {pendingTeachers.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {t.fullName}
                    </td>
                    <td className="py-3 px-3 space-y-0.5">
                      <p>{t.email}</p>
                      <p className="text-[10px] font-mono text-slate-400">{t.employeeId}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p>{t.department}</p>
                      <p className="text-[10px] text-slate-400">{t.designation}</p>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {t.assignedSubjects?.map((sub: string, sIdx: number) => (
                          <span
                            key={sIdx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => approveMutation.mutate(t.id)}
                          disabled={approveMutation.isPending}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => setSelectedRejectTeacher(t)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-semibold transition-all border border-rose-200 dark:border-rose-800"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={!!selectedRejectTeacher}
        onClose={() => setSelectedRejectTeacher(null)}
        title="Reject Faculty Registration"
        description={`Specify rejection reason for ${selectedRejectTeacher?.fullName} (${selectedRejectTeacher?.email})`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason for Rejection
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setSelectedRejectTeacher(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selectedRejectTeacher) {
                  rejectMutation.mutate({ id: selectedRejectTeacher.id, reason: rejectReason });
                }
              }}
              disabled={rejectMutation.isPending}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
