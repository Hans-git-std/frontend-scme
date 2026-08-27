import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  MapPin,
  Globe,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Percent,
  Code,
  BookOpen,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { ApiResponse, CompanyPublicResponse } from '../../types';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { getVerificationStatusBadge } from '../../lib/utils';

export const CompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: company, isLoading, isError } = useQuery<CompanyPublicResponse>({
    queryKey: ['publicCompanyDetail', id],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/companies/public/${id}`);
      const raw = res.data;
      if (raw && raw.id) return raw;
      if (raw?.data && raw.data.id) return raw.data;
      return raw?.data || raw;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <CardSkeleton />
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Company Not Found
        </h3>
        <p className="text-xs text-slate-500">
          The requested company ID does not exist or has not been publicly verified.
        </p>
        <Link
          to="/companies"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </Link>
      </div>
    );
  }

  const statusBadge = getVerificationStatusBadge(company.verificationStatus);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Button */}
      <Link
        to="/companies"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Company Directory
      </Link>

      {/* Header Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-extrabold text-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.companyName} className="w-full h-full object-cover" />
              ) : (
                company.companyName.charAt(0)
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {company.companyName}
                </h1>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${statusBadge.className}`}>
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold">
                {company.industry || 'Technology'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1 text-xs text-slate-500">
            {company.location && (
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {company.location}
              </p>
            )}
            {company.websiteUrl && (
              <a
                href={company.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sky-600 hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                {company.websiteUrl}
              </a>
            )}
          </div>
        </div>

        {/* Company Bio */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            About the Company
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {company.description || 'Verified hiring company participating in campus placement.'}
          </p>
        </div>
      </div>

      {/* Active Job Openings & Criteria */}
      {(() => {
        const criteriaList = company.activeCriteria || company.criteria || company.hiringCriteria || [];
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Active Placement Criteria ({criteriaList.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Job requirements evaluated by the Student-Corporate Matcher algorithm
                </p>
              </div>
            </div>

            {criteriaList.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center text-xs text-slate-500">
                No specific criteria records published yet for this company.
              </div>
            ) : (
              <div className="space-y-4">
                {criteriaList.map((crit: any) => (
                  <div
                    key={crit.id}
                    className="glass-card rounded-3xl p-6 sm:p-7 space-y-4 hover:border-sky-500/40 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {crit.roleTitle}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {crit.jobDescription || 'Standard engineering candidate requirements.'}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 shrink-0 border border-sky-200 dark:border-sky-800">
                        Min Aggregate: {crit.minOverallPercentage}%
                      </span>
                    </div>

                    {/* Skills */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-indigo-500" />
                        Required Technical Skills:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {crit.requiredSkills?.map((s: any) => (
                          <span
                            key={s.id || s.skillName || s.name}
                            className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                              s.isMandatory
                                ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 font-bold'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {s.skillName || s.name} ({s.minProficiency})
                            {s.isMandatory && ' *Mandatory'}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Cutoffs */}
                    {crit.subjectCutoffs && crit.subjectCutoffs.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-brand-500" />
                          Academic Cutoffs:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {crit.subjectCutoffs.map((c: any) => (
                            <span
                              key={c.id || c.subjectName}
                              className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200"
                            >
                              {c.subjectName} ≥ {c.minMarksCutoff}%
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
        );
      })()}
    </div>
  );
};
