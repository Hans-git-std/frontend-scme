import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Mail,
  Globe,
  MapPin,
  FileText,
  Image,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { ApiResponse, CompanyProfileResponse, CompanyProfileRequest } from '../../types';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { getVerificationStatusBadge } from '../../lib/utils';

export const CompanyProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['companyProfile'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<CompanyProfileResponse>>('/companies/profile');
      return res.data.data;
    },
  });

  const [formData, setFormData] = useState<CompanyProfileRequest>({
    companyName: '',
    industry: '',
    websiteUrl: '',
    location: '',
    description: '',
    logoUrl: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        companyName: profile.companyName || '',
        industry: profile.industry || '',
        websiteUrl: profile.websiteUrl || '',
        location: profile.location || '',
        description: profile.description || '',
        logoUrl: profile.logoUrl || '',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (payload: CompanyProfileRequest) => {
      // Sanitize payload to avoid backend @URL validation failures on empty strings
      let cleanWebsite = payload.websiteUrl?.trim();
      if (cleanWebsite) {
        if (!/^https?:\/\//i.test(cleanWebsite)) {
          cleanWebsite = `https://${cleanWebsite}`;
        }
      } else {
        cleanWebsite = undefined;
      }

      let cleanLogo = payload.logoUrl?.trim();
      if (cleanLogo) {
        if (!/^https?:\/\//i.test(cleanLogo)) {
          cleanLogo = `https://${cleanLogo}`;
        }
      } else {
        cleanLogo = undefined;
      }

      const cleanPayload = {
        companyName: payload.companyName?.trim() || '',
        industry: payload.industry?.trim() || undefined,
        location: payload.location?.trim() || undefined,
        description: payload.description?.trim() || undefined,
        websiteUrl: cleanWebsite,
        logoUrl: cleanLogo,
      };

      const res = await apiClient.put<ApiResponse<CompanyProfileResponse>>(
        '/companies/profile',
        cleanPayload
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Profile Saved', 'Company profile details have been updated.');
      queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update company profile';
      toast.error('Error', msg);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName?.trim()) {
      toast.error('Validation Error', 'Company Name is mandatory');
      return;
    }
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <CardSkeleton />;
  }

  const statusBadge = getVerificationStatusBadge(
    profile?.verificationStatus || 'NOT_VERIFIED'
  );

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Corporate Profile & Branding
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Manage how your company appears in student matches and the public employer directory
        </p>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Verification Status Header */}
        <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="text-slate-700 dark:text-slate-300">
                Contact: <strong>{profile?.email}</strong>
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Active Criteria Roles: {profile?.activeCriteriaCount || 0}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.className}`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            Verification Status: {statusBadge.label}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Company Name *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Industry Sector
              </label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder="Software & Cloud Infrastructure"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Corporate Location / Headquarters
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="San Francisco, CA, USA"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Website URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  placeholder="https://company.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Logo Image URL
            </label>
            <div className="relative">
              <Image className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                name="logoUrl"
                value={formData.logoUrl}
                onChange={handleChange}
                placeholder="https://company.com/logo.png"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Company Description & Technical Culture
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your engineering teams, technical challenges, and perks..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-sky-500/20 disabled:opacity-50 transition-all"
            >
              {updateMutation.isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Corporate Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
