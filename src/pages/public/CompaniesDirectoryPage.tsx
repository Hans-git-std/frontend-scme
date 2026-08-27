import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Search,
  MapPin,
  Globe,
  Sliders,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { ApiResponse, CompanyPublicResponse } from '../../types';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { getVerificationStatusBadge } from '../../lib/utils';

export const CompaniesDirectoryPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('ALL');

  const { data: companies, isLoading } = useQuery<CompanyPublicResponse[]>({
    queryKey: ['publicCompanies'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>('/companies/public');
        const raw = res.data;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        if (Array.isArray(raw?.data?.content)) return raw.data.content;
        if (Array.isArray(raw?.content)) return raw.content;
      } catch (err) {
        console.warn('[CompaniesDirectoryPage] Fetch error:', err);
      }
      return [];
    },
  });

  const industries = useMemo(() => {
    if (!companies) return [];
    const set = new Set<string>();
    companies.forEach((c: CompanyPublicResponse) => {
      if (c.industry) set.add(c.industry);
    });
    return Array.from(set);
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    if (!companies) return [];
    return companies.filter((c: CompanyPublicResponse) => {
      const matchesSearch =
        c.companyName.toLowerCase().includes(search.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
        (c.location && c.location.toLowerCase().includes(search.toLowerCase()));
      const matchesIndustry = industryFilter === 'ALL' || c.industry === industryFilter;
      return matchesSearch && matchesIndustry;
    });
  }, [companies, search, industryFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-500/20">
          <Building2 className="w-3.5 h-3.5" />
          <span>Employer Directory</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Verified Corporate Hiring Partners
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Browse active tech enterprises recruiting students based on academic competencies and technical skills
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies by name, location, or tech..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {industries.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 shrink-0">Industry:</span>
            <button
              onClick={() => setIndustryFilter('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                industryFilter === 'ALL'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              All
            </button>
            {industries.map((ind) => (
              <button
                key={ind}
                onClick={() => setIndustryFilter(ind)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                  industryFilter === ind
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {ind}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Companies Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            No Companies Match Your Search
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords or industry filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((c: CompanyPublicResponse) => {
            const statusBadge = getVerificationStatusBadge(c.verificationStatus);
            return (
              <div
                key={c.id}
                className="glass-card rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-sky-500/40 transition-all shadow-sm group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                        {c.logoUrl ? (
                          <img src={c.logoUrl} alt={c.companyName} className="w-full h-full object-cover" />
                        ) : (
                          c.companyName.charAt(0)
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors">
                          {c.companyName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {c.industry || 'Tech'}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusBadge.className}`}>
                      {statusBadge.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {c.description || 'Verified hiring partner participating in campus placement and intelligent matchmaking.'}
                  </p>

                  {/* Active Job Roles preview */}
                  {(() => {
                    const criteriaList = c.activeCriteria || c.criteria || c.hiringCriteria || [];
                    if (criteriaList.length === 0) return null;
                    return (
                      <div className="pt-1 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Open Job Roles ({criteriaList.length}):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {criteriaList.slice(0, 3).map((crit) => (
                            <span
                              key={crit.id}
                              className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 text-[10px] font-semibold border border-sky-200/60 dark:border-sky-800/50"
                            >
                              {crit.roleTitle}
                            </span>
                          ))}
                          {criteriaList.length > 3 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{criteriaList.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-1.5 text-xs text-slate-500 pt-1">
                    {c.location && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {c.location}
                      </p>
                    )}
                    {c.websiteUrl && (
                      <a
                        href={c.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>{c.websiteUrl.replace(/^https?:\/\//, '')}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {(() => {
                      const count = (c.activeCriteria || c.criteria || c.hiringCriteria || []).length;
                      return `${count} Open Role${count === 1 ? '' : 's'}`;
                    })()}
                  </span>
                  <Link
                    to={`/companies/${c.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    <span>View Profile & Jobs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
