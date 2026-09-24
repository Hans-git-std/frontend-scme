import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Search,
  MapPin,
  Globe,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  X,
  Sparkles,
  Command,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  Briefcase,
  Code,
  Layers,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { CompanyPublicResponse } from '../../types';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { getVerificationStatusBadge } from '../../lib/utils';
import { CompanyLogo } from '../../components/ui/CompanyLogo';
import { CompanySearchModal } from '../../components/ui/CompanySearchModal';

const ITEMS_PER_PAGE = 12;

interface DomainDefinition {
  id: string;
  label: string;
  shortLabel: string;
  keywords: string[];
}

const DOMAIN_FILTERS: DomainDefinition[] = [
  { id: 'ALL', label: 'All Disciplines', shortLabel: 'All', keywords: [] },
  {
    id: 'CSE',
    label: 'Computer Science & IT',
    shortLabel: 'CSE & IT',
    keywords: ['software', 'developer', 'python', 'java', 'cloud', 'web', 'data', 'full stack', 'backend', 'frontend', 'security', 'devops', 'it', 'qa', 'network'],
  },
  {
    id: 'AI',
    label: 'AI, Data Science & ML',
    shortLabel: 'AI & Data',
    keywords: ['machine learning', 'ai', 'data science', 'deep learning', 'pytorch', 'tensorflow', 'nlp', 'vision', 'analytics', 'big data'],
  },
  {
    id: 'MECH',
    label: 'Mechanical & Automotive',
    shortLabel: 'Mechanical',
    keywords: ['mechanical', 'cad', 'solidworks', 'catia', 'brake', 'engine', 'automotive', 'thermal', 'harness', 'manufacturing', 'chassis', 'vehicle'],
  },
  {
    id: 'ECE',
    label: 'Electronics & VLSI',
    shortLabel: 'ECE & VLSI',
    keywords: ['electronics', 'vlsi', 'embedded', 'telematics', 'circuit', 'verilog', 'fpga', 'iot', 'hardware', 'semiconductor'],
  },
  {
    id: 'CIVIL',
    label: 'Civil & Infrastructure',
    shortLabel: 'Civil & Infra',
    keywords: ['civil', 'structural', 'staad', 'autocad', 'bridge', 'tunnel', 'metro', 'construction', 'concrete', 'geotechnical'],
  },
  {
    id: 'CHEM',
    label: 'Chemical & Process',
    shortLabel: 'Chemical',
    keywords: ['chemical', 'benzene', 'intermediates', 'process', 'refinery', 'petrochemical', 'pharma', 'polymer', 'biochemical'],
  },
  {
    id: 'ENERGY',
    label: 'Energy & Renewables',
    shortLabel: 'Energy',
    keywords: ['solar', 'wind', 'renewables', 'power', 'grid', 'battery', 'electric', 'clean energy'],
  },
];

export const CompaniesDirectoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || searchParams.get('search') || '';
  const urlDomain = searchParams.get('domain') || 'ALL';

  const [search, setSearch] = useState(urlQuery);
  const [domainFilter, setDomainFilter] = useState(urlDomain);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const gridTopRef = useRef<HTMLDivElement>(null);

  // Sync state if URL search params change externally
  useEffect(() => {
    if (urlQuery !== search) {
      setSearch(urlQuery);
      setCurrentPage(1);
    }
  }, [urlQuery]);

  useEffect(() => {
    if (urlDomain !== domainFilter) {
      setDomainFilter(urlDomain);
      setCurrentPage(1);
    }
  }, [urlDomain]);

  // Global Ctrl+K / Cmd+K listener to open Search Window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch companies with proper error propagation & retry
  const {
    data: companies = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<CompanyPublicResponse[]>({
    queryKey: ['publicCompanies'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/companies/public');
      const raw = res.data;
      if (Array.isArray(raw)) return raw;
      if (Array.isArray(raw?.data)) return raw.data;
      if (Array.isArray(raw?.data?.content)) return raw.data.content;
      if (Array.isArray(raw?.content)) return raw.content;
      return [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  // Calculate domain counts across the full dataset
  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: companies.length };
    DOMAIN_FILTERS.forEach((d) => {
      if (d.id === 'ALL') return;
      const count = companies.filter((c) => {
        const rawCr = c.activeCriteria || c.criteria;
        const criteriaArr: any[] = Array.isArray(rawCr) ? rawCr : [];
        const text = [
          c.companyName,
          c.industry,
          c.description,
          ...criteriaArr.flatMap((cr: any) => {
            const skillsList = Array.isArray(cr?.requiredSkills)
              ? cr.requiredSkills
              : typeof cr?.requiredSkills === 'string' && cr.requiredSkills.trim()
              ? [cr.requiredSkills]
              : [];
            return [
              cr?.roleTitle,
              cr?.jobDescription,
              ...skillsList.map((s: any) => (typeof s === 'string' ? s : s.skillName || s.name || '')),
            ];
          }),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return d.keywords.some((kw) => text.includes(kw));
      }).length;
      counts[d.id] = count;
    });
    return counts;
  }, [companies]);

  // Comprehensive multi-factor filtering:
  const filteredCompanies = useMemo(() => {
    const q = search.toLowerCase().trim();

    return companies.filter((c: CompanyPublicResponse) => {
      // 1. Status Filter
      if (statusFilter === 'VERIFIED' && c.verificationStatus !== 'VERIFIED') {
        return false;
      }

      // 2. Domain Filter
      if (domainFilter !== 'ALL') {
        const domainDef = DOMAIN_FILTERS.find((d) => d.id === domainFilter);
        if (domainDef && domainDef.keywords.length > 0) {
          const rawCr = c.activeCriteria || c.criteria;
          const criteriaArr: any[] = Array.isArray(rawCr) ? rawCr : [];
          const companyText = [
            c.companyName,
            c.industry,
            c.description,
            ...criteriaArr.flatMap((cr: any) => {
              const skillsList = Array.isArray(cr?.requiredSkills)
                ? cr.requiredSkills
                : typeof cr?.requiredSkills === 'string' && cr.requiredSkills.trim()
                ? [cr.requiredSkills]
                : [];
              return [
                cr?.roleTitle,
                cr?.jobDescription,
                ...skillsList.map((s: any) => (typeof s === 'string' ? s : s.skillName || s.name || '')),
              ];
            }),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          const matchesDomain = domainDef.keywords.some((kw) => companyText.includes(kw));
          if (!matchesDomain) return false;
        }
      }

      // 3. Search Query Filter across ALL fields:
      if (!q) return true;

      const nameMatch = (c.companyName || '').toLowerCase().includes(q);
      const industryMatch = (c.industry || '').toLowerCase().includes(q);
      const locMatch = (c.location || '').toLowerCase().includes(q);
      const descMatch = (c.description || '').toLowerCase().includes(q);

      const rawList = c.activeCriteria || c.criteria || c.hiringCriteria;
      const criteriaList: any[] = Array.isArray(rawList) ? rawList : [];
      const criteriaMatch = criteriaList.some((crit: any) => {
        const roleMatch = (crit.roleTitle || '').toLowerCase().includes(q);
        const jobDescMatch = (crit.jobDescription || '').toLowerCase().includes(q);

        const skillsList = Array.isArray(crit.requiredSkills)
          ? crit.requiredSkills
          : typeof crit.requiredSkills === 'string' && crit.requiredSkills.trim()
          ? [crit.requiredSkills]
          : [];
        const skillsMatch = skillsList.some((s: any) => {
          const sName = typeof s === 'string' ? s : s.skillName || s.name || '';
          return sName.toLowerCase().includes(q);
        });

        const cutoffsList = Array.isArray(crit.subjectCutoffs)
          ? crit.subjectCutoffs
          : typeof crit.subjectCutoffs === 'string' && crit.subjectCutoffs.trim()
          ? [crit.subjectCutoffs]
          : [];
        const cutoffsMatch = cutoffsList.some((sub: any) => {
          const subName = typeof sub === 'string' ? sub : sub.subjectName || sub.name || '';
          return subName.toLowerCase().includes(q);
        });
        return roleMatch || jobDescMatch || skillsMatch || cutoffsMatch;
      });

      return nameMatch || industryMatch || locMatch || descMatch || criteriaMatch;
    });
  }, [companies, search, domainFilter, statusFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE) || 1;
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCompanies.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCompanies, currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSearchChange = (newVal: string) => {
    setSearch(newVal);
    setCurrentPage(1);
    if (newVal.trim()) {
      setSearchParams({ q: newVal.trim(), domain: domainFilter });
    } else {
      setSearchParams({ domain: domainFilter });
    }
  };

  const handleDomainChange = (newDomain: string) => {
    setDomainFilter(newDomain);
    setCurrentPage(1);
    if (search.trim()) {
      setSearchParams({ q: search.trim(), domain: newDomain });
    } else {
      setSearchParams({ domain: newDomain });
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setDomainFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
    setSearchParams({});
  };

  const isFiltered = search.trim() !== '' || domainFilter !== 'ALL' || statusFilter !== 'ALL';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Quick Search Window Modal */}
      <CompanySearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        initialQuery={search}
      />

      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-500/20">
          <Building2 className="w-3.5 h-3.5" />
          <span>Employer Placement Directory</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Verified Corporate Hiring Partners
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Explore tech enterprises actively recruiting across Software, AI/ML, Mechanical, Electronics, Civil, and Chemical disciplines evaluated against verified student competencies.
        </p>
      </div>

      {/* Primary Search Bar & Control Console */}
      <div className="glass-card rounded-3xl p-4 sm:p-6 space-y-4 shadow-sm" ref={gridTopRef}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-sky-600 dark:text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search companies by name, skill (Python, CAD, Java...), role, or city..."
              className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all shadow-inner"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Search Window Trigger Button */}
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs sm:text-sm font-semibold transition-all shrink-0"
            title="Open Instant Search Window (Ctrl+K)"
          >
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Search Window</span>
            <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 rounded-md">
              Ctrl K
            </kbd>
          </button>

          {/* Verified Only Toggle */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'VERIFIED' ? 'ALL' : 'VERIFIED')}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold border transition-all shrink-0 ${
              statusFilter === 'VERIFIED'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verified Only</span>
          </button>
        </div>

        {/* Engineering Domain Filter Chips */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-500" />
              Filter by Domain / Branch:
            </span>

            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {DOMAIN_FILTERS.map((d) => {
              const isSelected = domainFilter === d.id;
              const count = domainCounts[d.id] ?? 0;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleDomainChange(d.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-sm font-bold'
                      : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{d.shortLabel}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Info Banner */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800/60">
          <div>
            Showing <strong className="text-slate-900 dark:text-white">{filteredCompanies.length}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white">{companies.length}</strong> registered corporate partners
            {search.trim() && (
              <span>
                {' '}matching &quot;<span className="text-sky-600 font-semibold">{search.trim()}</span>&quot;
              </span>
            )}
            {domainFilter !== 'ALL' && (
              <span>
                {' '}in <span className="text-sky-600 font-semibold">{DOMAIN_FILTERS.find((d) => d.id === domainFilter)?.label}</span>
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-400">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>

      {/* Error State with Retry Button */}
      {isError && (
        <div className="glass-card rounded-3xl p-8 text-center space-y-4 border-rose-200 dark:border-rose-900/50">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Unable to Connect to Live Directory
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {(error as any)?.message || 'The server may be waking up from cold-start sleep. Please click below to retry the connection.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{isFetching ? 'Reconnecting to Database...' : 'Retry Connection Now'}</span>
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !isError && (
        <div className="space-y-4">
          <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-300 flex items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sky-600 animate-ping" />
            <span>Connecting to live cloud corporate database...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      )}

      {/* No Companies Found State */}
      {!isLoading && !isError && filteredCompanies.length === 0 && (
        <div className="glass-card rounded-3xl p-12 text-center space-y-4">
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Companies Match Your Search
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              No corporate accounts matched your criteria for &quot;{search}&quot;. Try searching for general keywords like &quot;Python&quot;, &quot;Java&quot;, &quot;Mechanical&quot;, &quot;Civil&quot;, &quot;Bengaluru&quot;, or click below to clear filters.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-sm transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters & Show All</span>
          </button>
        </div>
      )}

      {/* Companies Grid */}
      {!isLoading && !isError && filteredCompanies.length > 0 && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedCompanies.map((c: CompanyPublicResponse) => {
              const statusBadge = getVerificationStatusBadge(c.verificationStatus);
              const criteriaList = c.activeCriteria || c.criteria || c.hiringCriteria || [];

              // Calculate match previews for search query
              const q = search.toLowerCase().trim();
              const matchedRole = q
                ? criteriaList.find((cr: any) => (cr.roleTitle || '').toLowerCase().includes(q))?.roleTitle
                : null;

              const matchedSkill = q
                ? criteriaList
                    .flatMap((cr: any) =>
                      Array.isArray(cr.requiredSkills)
                        ? cr.requiredSkills
                        : typeof cr.requiredSkills === 'string' && cr.requiredSkills.trim()
                        ? [cr.requiredSkills]
                        : []
                    )
                    .map((s: any) => (typeof s === 'string' ? s : s.skillName || s.name || ''))
                    .find((sName: string) => sName.toLowerCase().includes(q))
                : null;

              return (
                <div
                  key={c.id}
                  className="glass-card rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-sky-500/40 transition-all shadow-xs group"
                >
                  <div className="space-y-4">
                    {/* Card Top: Logo, Name & Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <CompanyLogo
                          logoUrl={c.logoUrl}
                          companyName={c.companyName}
                          size="md"
                        />
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors truncate">
                            {c.companyName}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {c.industry || 'Technology'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border shrink-0 ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>

                    {/* Query Match Pill if Matched */}
                    {(matchedRole || matchedSkill) && (
                      <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/80 flex items-center gap-2 text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate">
                          Matched: <strong className="text-sky-700 dark:text-sky-300">{matchedRole || matchedSkill}</strong>
                        </span>
                      </div>
                    )}

                    {/* Bio Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {c.description || 'Verified hiring partner participating in university placement and intelligent skill matchmaking.'}
                    </p>

                    {/* Open Roles Preview */}
                    {criteriaList.length > 0 && (
                      <div className="pt-1 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-sky-500" />
                          Open Roles ({criteriaList.length}):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {criteriaList.slice(0, 3).map((crit: any) => (
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
                    )}

                    {/* Meta: Location & Website */}
                    <div className="space-y-1.5 text-xs text-slate-500 pt-1">
                      {c.location && (
                        <p className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{c.location}</span>
                        </p>
                      )}
                      {c.websiteUrl && (
                        <a
                          href={c.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 hover:underline truncate"
                        >
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{c.websiteUrl.replace(/^https?:\/\//i, '')}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Role count and View Profile link */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {criteriaList.length} Open Role{criteriaList.length === 1 ? '' : 's'}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Showing{' '}
                <strong className="text-slate-900 dark:text-white">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredCompanies.length)}
                </strong>{' '}
                of <strong className="text-slate-900 dark:text-white">{filteredCompanies.length}</strong> companies
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1 text-slate-400 text-xs">...</span>}
                        <button
                          type="button"
                          onClick={() => handlePageChange(p)}
                          className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all ${
                            currentPage === p
                              ? 'bg-sky-600 text-white font-bold shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
