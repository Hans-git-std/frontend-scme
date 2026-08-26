import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Cpu,
  Mail,
  Database,
  ShieldCheck,
  Zap,
  RefreshCw,
  Server,
  Clock,
  CheckCircle2,
  HardDrive,
  Info,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { ApiResponse, SystemDiagnostics } from '../../types';
import { LoadingAnimation } from '../../components/ui/LoadingAnimation';
import { formatUptime } from '../../lib/utils';
import { PING_URL } from '../../config/env';

export const AdminDiagnosticsPage: React.FC = () => {
  const toast = useToast();

  const { data: diagnostics, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['systemDiagnostics'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<SystemDiagnostics>>('/admin/system/diagnostics');
      return res.data.data;
    },
    refetchInterval: 10000,
  });

  const handleManualPing = async () => {
    try {
      const start = performance.now();
      await fetch(PING_URL, { method: 'GET', mode: 'cors' });
      const latency = Math.round(performance.now() - start);
      toast.success('Micro-Ping Acknowledged', `Server response received in ${latency}ms`);
    } catch {
      toast.error('Ping Failed', 'Server micro-ping failed to respond');
    }
  };

  if (isLoading) {
    return <LoadingAnimation message="Connecting to Live System Telemetry..." subMessage="Querying JVM heap gauge, TiDB Cloud pool, and SMTP quota metrics" variant="card" />;
  }

  const memory = diagnostics?.memoryUsage;
  const memoryPercent = memory
    ? Math.round((memory.usedMemoryMb / memory.totalAllocatedMemoryMb) * 100)
    : 0;

  // Daily mail quota: fixed 300 Gmail SMTP quota
  const dailyMailQuotaLimit = 300;
  const dailyDispatches = diagnostics?.mailQuotaStats?.dailyDispatchesCount || 0;
  const mailPercent = Math.min(100, Math.round((dailyDispatches / 300) * 100));
  const remainingMailQuota = Math.max(0, 300 - dailyDispatches);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Cloud Telemetry (10s Auto-Poll)
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Real-Time System Diagnostics & Container Health
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Live telemetry for low-RAM Spring Boot 3 container, TiDB Cloud database, and 300/day SMTP mailer
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualPing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Trigger Micro-Ping</span>
          </button>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Poll Now</span>
          </button>
        </div>
      </div>

      {/* Primary Server Status Hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-3xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Container Health</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            {diagnostics?.serverStatus || 'HEALTHY'}
          </h3>
          <p className="text-[11px] text-slate-400">
            Alpine Linux + Eclipse Temurin 21 LTS
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Continuous Uptime</span>
            <Clock className="w-5 h-5 text-brand-500" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {formatUptime(diagnostics?.uptimeSeconds || 0)}
          </h3>
          <p className="text-[11px] text-slate-400">
            Since last zero-downtime deployment
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Available Processors</span>
            <Cpu className="w-5 h-5 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {diagnostics?.memoryUsage?.jvmAvailableProcessors || 2} Cores
          </h3>
          <p className="text-[11px] text-slate-400">
            Tier 1 C1 JIT Compiler Execution
          </p>
        </div>
      </div>

      {/* Deep Memory & Heap Analysis */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Low-RAM JVM Memory Allocation Telemetry
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Serial Garbage Collector (-XX:+UseSerialGC) disabling multi-threaded worker stack overhead
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Container Heap Usage Gauge:
            </span>
            <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
              {memory?.usedMemoryMb} MB / {memory?.totalAllocatedMemoryMb} MB ({memoryPercent}%)
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                memoryPercent > 80 ? 'bg-rose-500' : 'bg-gradient-to-r from-brand-500 to-sky-400'
              }`}
              style={{ width: `${Math.min(100, memoryPercent)}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">Used Memory</span>
              <strong className="font-mono text-sm text-slate-900 dark:text-white">
                {memory?.usedMemoryMb || 0} MB
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">Free Memory</span>
              <strong className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                {memory?.freeMemoryMb || 0} MB
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">Total Allocated</span>
              <strong className="font-mono text-sm text-slate-900 dark:text-white">
                {memory?.totalAllocatedMemoryMb || 256} MB
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">Max Heap (-Xmx)</span>
              <strong className="font-mono text-sm text-indigo-600 dark:text-indigo-400">
                {memory?.maxAvailableHeapMb || 256} MB
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Database & SMTP Quota 2-Col Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TiDB Cloud Database Stats */}
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Database className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                TiDB Cloud Serverless MySQL
              </h3>
              <p className="text-[11px] text-slate-400">Hikari Connection Pool (Max: 3 connections)</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Total User Accounts:</span>
              <strong className="font-mono">{diagnostics?.databaseStats?.totalUsers || 0}</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Student Profiles:</span>
              <strong className="font-mono">{diagnostics?.databaseStats?.totalStudents || 0}</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Faculty Profiles:</span>
              <strong className="font-mono">{diagnostics?.databaseStats?.totalTeachers || 0}</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Corporate Enterprises:</span>
              <strong className="font-mono">{diagnostics?.databaseStats?.totalCompanies || 0}</strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Pending Approvals:</span>
              <strong className="font-mono text-amber-600">
                {diagnostics?.databaseStats?.pendingTeacherApprovals || 0}
              </strong>
            </div>
          </div>
        </div>

        {/* Gmail SMTP Dispatch Quota (Updated to 300 Limit) */}
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Mail className="w-5 h-5 text-sky-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                SMTP Quota & Dispatch Limiter (300 Daily Cap)
              </h3>
              <p className="text-[11px] text-slate-400">Daily quota auto-resets at 00:00 UTC</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Dispatches Today:</span>
                <strong className="font-mono text-sky-600">
                  {dailyDispatches} / {dailyMailQuotaLimit}
                </strong>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, mailPercent)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-500 pt-2">
              <p className="flex justify-between">
                <span>Remaining Quota:</span>
                <strong className="font-mono text-emerald-600">
                  {remainingMailQuota}
                </strong>
              </p>
              <p className="flex justify-between">
                <span>Master Admin Inbox:</span>
                <strong className="font-mono text-[11px]">{diagnostics?.adminEmail}</strong>
              </p>
              <p className="flex justify-between">
                <span>Recovery Backup Inbox:</span>
                <strong className="font-mono text-[11px]">{diagnostics?.adminRecoveryEmail}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
