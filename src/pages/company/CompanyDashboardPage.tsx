import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Sliders,
  Users,
  ShieldCheck,
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  Sparkles,
  MapPin,
  Globe,
  Edit3,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { ApiResponse, CompanyProfileResponse, HiringCriteriaResponse } from '../../types';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { getVerificationStatusBadge } from '../../lib/utils';

export const CompanyDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);
  const [websiteInput, setWebsiteInput] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['companyProfile'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<CompanyProfileResponse>>('/companies/profile');
      return res.data.data;
    },
  });

  const updateWebsiteMutation = useMutation({
    mutationFn: async (websiteUrl: string) => {
      let cleanWebsite = websiteUrl.trim();
      if (cleanWebsite && !/^https?:\/\//i.test(cleanWebsite)) {
        cleanWebsite = `https://${cleanWebsite}`;
      }

      let cleanLogo = profile?.logoUrl?.trim();
      if (cleanLogo && !/^https?:\/\//i.test(cleanLogo)) {
        cleanLogo = `https://${cleanLogo}`;
      }

      const payload: any = {
        companyName: profile?.companyName?.trim() || 'Corporate Partner',
        websiteUrl: cleanWebsite || undefined,
      };
      if (profile?.industry?.trim()) payload.industry = profile.industry.trim();
      if (profile?.location?.trim()) payload.location = profile.location.trim();
      if (profile?.description?.trim()) payload.description = profile.description.trim();
      if (cleanLogo) payload.logoUrl = cleanLogo;

      const res = await apiClient.put<ApiResponse<CompanyProfileResponse>>('/companies/profile', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Website Configured', 'Corporate portal URL updated successfully.');
      setIsWebsiteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to save website URL';
      toast.error('Update Error', msg);
    },
  });

  const handleOpenWebsiteModal = () => {
    setWebsiteInput(profile?.websiteUrl || '');
    setIsWebsiteModalOpen(true);
  };

  const handleSaveWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    let url = websiteInput.trim();
    if (!url) {
      toast.error('Validation Error', 'Please enter a valid website URL');
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    updateWebsiteMutation.mutate(url);
  };

  const { data: criteriaList, isLoading: isCriteriaLoading } = useQuery({
    queryKey: ['companyCriteria'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<HiringCriteriaResponse[]>>('/companies/criteria');
      return res.data.data;
    },
  });

  if (isLoading) {
    return <CardSkeleton />;
  }

  const statusBadge = getVerificationStatusBadge(
    profile?.verificationStatus || 'NOT_VERIFIED'
  );

  return (
    <div className="space-y-8">
      {/* Company Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-700 text-white p-6 sm:p-8 shadow-lg shadow-sky-500/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-extrabold text-2xl overflow-hidden shrink-0">
              {profile?.logoUrl ? (
                <img src={profile.logoUrl} alt={profile.companyName} className="w-full h-full object-cover" />
              ) : (
                profile?.companyName?.charAt(0) || 'C'
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-extrabold tracking-tight">
                  {profile?.companyName}
                </h2>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${statusBadge.className}`}>
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-xs text-sky-100 flex items-center gap-3">
                <span>{profile?.industry || 'Technology'}</span>
                {profile?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {profile.location}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/company/criteria"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs sm:text-sm font-bold shadow-md transition-all"
            >
              <PlusCircle className="w-4 h-4 text-sky-600" />
              <span>Define Hiring Criteria</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Verification Notice if Not Verified */}
      {profile?.verificationStatus === 'NOT_VERIFIED' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">Pending Administrative Review</h4>
            <p className="leading-relaxed">
              Your company registration is currently pending verification by the platform administrator. You can configure your hiring criteria now, and matched candidates will begin seeing your positions once verified.
            </p>
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Active Job Roles & Criteria
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {criteriaList?.length || 0}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Configured hiring criteria</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Sliders className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Verification State
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 capitalize">
              {profile?.verificationStatus?.toLowerCase().replace('_', ' ') || 'Pending'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Admin approval status</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={handleOpenWebsiteModal}
          className="glass-card rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:border-indigo-500/40 transition-all group"
          role="button"
          tabIndex={0}
          title="Click to configure or update website URL"
        >
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Company Website</span>
              <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate max-w-[160px]">
              {profile?.websiteUrl ? (
                <span className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-400/40">
                  {profile.websiteUrl.replace(/^https?:\/\//i, '')}
                </span>
              ) : (
                <span className="text-slate-400 italic">Not configured</span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <span>{profile?.websiteUrl ? 'Click to edit URL' : 'Click to add website'}</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <Globe className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Active Criteria List Preview */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Active Job Criteria & Cutoff Profiles
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rules used by the AI engine to evaluate student fit
            </p>
          </div>
          <Link
            to="/company/criteria"
            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            Manage All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isCriteriaLoading ? (
          <CardSkeleton />
        ) : !criteriaList || criteriaList.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Sliders className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-xs text-slate-500">No hiring criteria defined yet.</p>
            <Link
              to="/company/criteria"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Your First Role
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criteriaList.map((crit) => (
              <div
                key={crit.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {crit.roleTitle}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {crit.jobDescription || 'No description provided.'}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 shrink-0">
                    Min {crit.minOverallPercentage}%
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Required Skills ({crit.requiredSkills?.length || 0}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {crit.requiredSkills?.map((s) => (
                      <span
                        key={s.id}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                          s.isMandatory
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {s.skillName} ({s.minProficiency})
                      </span>
                    ))}
                  </div>
                </div>

                {crit.subjectCutoffs && crit.subjectCutoffs.length > 0 && (
                  <div className="space-y-1 text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Subject Cutoffs:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {crit.subjectCutoffs.map((c) => (
                        <span
                          key={c.id}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/60"
                        >
                          {c.subjectName}: ≥{c.minMarksCutoff}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configure Website Modal */}
      {isWebsiteModalOpen && (
        <Modal
          isOpen={isWebsiteModalOpen}
          onClose={() => setIsWebsiteModalOpen(false)}
          title="Configure Corporate Website"
        >
          <form onSubmit={handleSaveWebsite} className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Provide your official company website or career portal URL. This link will be displayed to matched candidates and on the public employer directory once verified.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Corporate Website URL *
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={websiteInput}
                  onChange={(e) => setWebsiteInput(e.target.value)}
                  placeholder="https://company.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                to="/company/profile"
                onClick={() => setIsWebsiteModalOpen(false)}
                className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline"
              >
                Go to full profile settings →
              </Link>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsWebsiteModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateWebsiteMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-md shadow-sky-500/20 disabled:opacity-50 transition-all"
                >
                  {updateWebsiteMutation.isPending ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Website</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
