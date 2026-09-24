import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  KeyRound,
  Copy,
  Check,
  Clock,
  Trash2,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Ban,
  CheckCircle2,
  Sparkles,
  Search,
  X,
  Activity,
  History,
  Radio,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { ApiResponse, AdminOtpRecord } from '../../types';

export const AdminOtpMonitor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'RECENT'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const queryClient = useQueryClient();
  const toast = useToast();

  // Smooth real-time 1-second ticker for accurate countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch active OTP challenges (polls every 6 seconds)
  const {
    data: activeOtps = [],
    isLoading: isActiveLoading,
    refetch: refetchActive,
    isFetching: isActiveFetching,
  } = useQuery<AdminOtpRecord[]>({
    queryKey: ['adminOtpsActive'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>('/admin/otps/active');
        const raw = res.data;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        if (Array.isArray(raw?.data?.content)) return raw.data.content;
        return [];
      } catch (err: any) {
        console.warn('[AdminOtpMonitor] Failed to fetch active OTPs:', err?.message);
        return [];
      }
    },
    refetchInterval: 4000, // Real-time polling every 4 seconds (within 3-5s specification)
  });

  // Fetch recent 50 OTP attempts for audit log
  const {
    data: recentOtps = [],
    isLoading: isRecentLoading,
    refetch: refetchRecent,
    isFetching: isRecentFetching,
  } = useQuery<AdminOtpRecord[]>({
    queryKey: ['adminOtpsRecent'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>('/admin/otps/recent');
        const raw = res.data;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        if (Array.isArray(raw?.data?.content)) return raw.data.content;
        return [];
      } catch (err: any) {
        console.warn('[AdminOtpMonitor] Failed to fetch recent OTPs:', err?.message);
        return [];
      }
    },
    refetchInterval: activeTab === 'RECENT' ? 10000 : false,
    enabled: activeTab === 'RECENT',
  });

  // Revoke OTP mutation
  const revokeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete<ApiResponse<any>>(`/admin/otps/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('OTP Revoked', 'Verification code has been revoked and invalidated.');
      queryClient.invalidateQueries({ queryKey: ['adminOtpsActive'] });
      queryClient.invalidateQueries({ queryKey: ['adminOtpsRecent'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to revoke OTP';
      toast.error('Revocation Error', msg);
    },
  });

  // Prune expired OTPs mutation
  const pruneExpiredMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.delete<ApiResponse<any>>('/admin/otps/expired');
      return res.data;
    },
    onSuccess: (data: any) => {
      const msg = data?.message || 'Expired and used verification tokens purged.';
      toast.success('Purge Completed', msg);
      queryClient.invalidateQueries({ queryKey: ['adminOtpsActive'] });
      queryClient.invalidateQueries({ queryKey: ['adminOtpsRecent'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to prune expired OTPs';
      toast.error('Cleanup Error', msg);
    },
  });

  const handleCopy = (id: number, code: string, email: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedId(id);
      toast.success('OTP Copied', `Copied ${code} for ${email}`);
      setTimeout(() => {
        setCopiedId((curr) => (curr === id ? null : curr));
      }, 2000);
    } catch {
      toast.info('OTP Code', code);
    }
  };

  const handleManualRefresh = () => {
    if (activeTab === 'ACTIVE') {
      refetchActive();
    } else {
      refetchRecent();
    }
  };

  // Compute remaining seconds live with fallback to backend remainingSeconds
  const getSecondsLeft = (otp: AdminOtpRecord) => {
    if (otp.expiresAt) {
      const targetTime = new Date(otp.expiresAt).getTime();
      if (!isNaN(targetTime)) {
        return Math.max(0, Math.floor((targetTime - now) / 1000));
      }
    }
    return Math.max(0, otp.remainingSeconds || 0);
  };

  const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const currentList = activeTab === 'ACTIVE' ? activeOtps : recentOtps;
  const isLoading = activeTab === 'ACTIVE' ? isActiveLoading : isRecentLoading;
  const isFetching = activeTab === 'ACTIVE' ? isActiveFetching : isRecentFetching;

  // Filter list by search query (email or code)
  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return currentList;
    return currentList.filter(
      (item) =>
        (item.email || '').toLowerCase().includes(q) ||
        (item.otpCode || '').toLowerCase().includes(q) ||
        (item.status || '').toLowerCase().includes(q)
    );
  }, [currentList, searchQuery]);

  // Count active pending OTPs
  const activePendingCount = useMemo(() => {
    return activeOtps.filter((o) => {
      const secs = getSecondsLeft(o);
      const isExpired = o.status === 'EXPIRED' || secs <= 0;
      return !o.isUsed && !isExpired;
    }).length;
  }, [activeOtps, now]);

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border-amber-200/80 dark:border-amber-900/50 shadow-md">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Live OTP Verification Monitor
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Stream
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time audit log of email OTP challenges for live evaluation assistance & security monitoring
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Prune Expired Button */}
          <button
            type="button"
            onClick={() => pruneExpiredMutation.mutate()}
            disabled={pruneExpiredMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50"
            title="Purge expired & consumed OTP tokens from database"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{pruneExpiredMutation.isPending ? 'Pruning...' : 'Prune Expired'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50"
            title="Refresh active verification challenges"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tab Pills */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'ACTIVE'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-amber-500" />
            <span>Active Challenges</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'ACTIVE'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {activePendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RECENT')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'RECENT'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Recent Audit Log</span>
            <span className="text-[10px] text-slate-400 font-mono">Last 50</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by email or code..."
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="py-12 text-center space-y-3">
          <span className="inline-block w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Loading verification stream...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="py-12 px-4 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {activeTab === 'ACTIVE'
              ? 'No Active Verification Challenges'
              : 'No Recent OTP Records'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {activeTab === 'ACTIVE'
              ? 'When any student, faculty, or recruiter requests a login code, the 6-digit OTP will display here in real time.'
              : 'Audit history is empty or has been cleaned up.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">User Email</th>
                <th className="py-3 px-4">6-Digit Code</th>
                <th className="py-3 px-4">Issued At</th>
                <th className="py-3 px-4">Time Remaining</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-950/40 text-slate-800 dark:text-slate-200">
              {filteredList.map((otp) => {
                const secondsLeft = getSecondsLeft(otp);
                const isExpired = otp.status === 'EXPIRED' || (!otp.isUsed && secondsLeft <= 0);
                const isVerified = otp.isUsed || otp.status === 'VERIFIED';
                const isPending = !isVerified && !isExpired;

                const isCopied = copiedId === otp.id;

                return (
                  <tr
                    key={otp.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    {/* Email */}
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs">{otp.email}</span>
                      </div>
                    </td>

                    {/* 6-Digit Code with 1-Click Copy */}
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 tracking-wider">
                          {otp.otpCode || '••••••'}
                        </span>
                        {otp.otpCode && (
                          <button
                            type="button"
                            onClick={() => handleCopy(otp.id, otp.otpCode, otp.email)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                            title="Copy OTP Code to clipboard"
                          >
                            {isCopied ? (
                              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Issued At */}
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {formatTimestamp(otp.createdAt)}
                    </td>

                    {/* Time Remaining Countdown */}
                    <td className="py-3 px-4 font-mono font-bold">
                      {isVerified ? (
                        <span className="text-slate-400 text-[11px]">Consumed</span>
                      ) : isExpired ? (
                        <span className="text-rose-500 text-[11px]">00:00 (Expired)</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Clock className={`w-3.5 h-3.5 ${secondsLeft <= 60 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`} />
                          <span
                            className={
                              secondsLeft <= 60
                                ? 'text-rose-600 dark:text-rose-400 animate-pulse'
                                : secondsLeft <= 180
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }
                          >
                            {formatCountdown(secondsLeft)}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <CheckCircle2 className="w-3 h-3 text-sky-500" />
                          <span>VERIFIED</span>
                        </span>
                      ) : isExpired ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>EXPIRED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span>PENDING</span>
                        </span>
                      )}
                    </td>

                    {/* Action Button: Revoke */}
                    <td className="py-3 px-4 text-right">
                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => revokeMutation.mutate(otp.id)}
                          disabled={revokeMutation.isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/80 text-[11px] font-semibold transition-all disabled:opacity-50"
                          title="Revoke / Cancel this OTP challenge"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">None</span>
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
  );
};
