import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  X,
  Building2,
  MapPin,
  Briefcase,
  Code,
  ArrowRight,
  Sparkles,
  Command,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { CompanyPublicResponse } from '../../types';
import { CompanyLogo } from './CompanyLogo';
import { getVerificationStatusBadge } from '../../lib/utils';

interface CompanySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const CompanySearchModal: React.FC<CompanySearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialQuery]);

  // Fetch companies (shared cache with publicCompanies)
  const { data: companies = [], isLoading } = useQuery<CompanyPublicResponse[]>({
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
  });

  const domains = [
    { id: 'ALL', label: 'All Roles & Domains' },
    { id: 'CSE', label: 'Computer Science & IT', keywords: ['software', 'developer', 'python', 'java', 'cloud', 'web', 'data', 'full stack', 'backend', 'frontend', 'security', 'devops'] },
    { id: 'MECH', label: 'Mechanical & Auto', keywords: ['mechanical', 'cad', 'solidworks', 'catia', 'brake', 'engine', 'automotive', 'thermal', 'harness', 'manufacturing'] },
    { id: 'ECE', label: 'Electronics & VLSI', keywords: ['electronics', 'vlsi', 'embedded', 'telematics', 'circuit', 'verilog', 'fpga', 'iot'] },
    { id: 'CIVIL', label: 'Civil & Infra', keywords: ['civil', 'structural', 'staad', 'autocad', 'bridge', 'tunnel', 'metro', 'construction'] },
    { id: 'AI', label: 'AI & Data Science', keywords: ['machine learning', 'ai', 'data science', 'deep learning', 'pytorch', 'tensorflow', 'nlp', 'vision'] },
  ];

  // Comprehensive multi-factor search
  const filteredResults = useMemo(() => {
    if (!companies.length) return [];
    const q = query.toLowerCase().trim();

    return companies.filter((c: CompanyPublicResponse) => {
      // 1. Domain filter
      if (selectedDomain !== 'ALL') {
        const domainDef = domains.find((d) => d.id === selectedDomain);
        if (domainDef?.keywords) {
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

      // If no query string, return all for this domain
      if (!q) return true;

      // 2. Query search across ALL properties:
      const nameMatch = (c.companyName || '').toLowerCase().includes(q);
      const industryMatch = (c.industry || '').toLowerCase().includes(q);
      const locationMatch = (c.location || '').toLowerCase().includes(q);
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

      return nameMatch || industryMatch || locationMatch || descMatch || criteriaMatch;
    });
  }, [companies, query, selectedDomain]);

  // Keyboard navigation inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        if (filteredResults.length > 0 && selectedIndex < filteredResults.length) {
          e.preventDefault();
          const target = filteredResults[selectedIndex];
          if (target) {
            onClose();
            navigate(`/companies/${target.id}`);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, onClose, navigate]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-12 flex items-start justify-center animate-in fade-in duration-150"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Window */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col z-10 max-h-[85vh]">
        {/* Search Header Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search companies by name, skill (Python, CAD, Java...), role, or city..."
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <span className="text-[10px]">ESC</span>
          </button>
        </div>

        {/* Domain Filter Pills */}
        <div className="px-4 py-2 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
          {domains.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setSelectedDomain(d.id);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDomain === d.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60">
          {isLoading ? (
            <div className="p-8 text-center space-y-3">
              <span className="inline-block w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500">Querying verified employer directory...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                No matching corporate partners
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No companies match &quot;{query}&quot;. Try searching for &quot;Python&quot;, &quot;Java&quot;, &quot;Mechanical&quot;, &quot;Tata&quot;, &quot;Bengaluru&quot;, or switch domains.
              </p>
            </div>
          ) : (
            filteredResults.map((c: CompanyPublicResponse, idx: number) => {
              const isSelected = idx === selectedIndex;
              const statusBadge = getVerificationStatusBadge(c.verificationStatus);
              const criteriaList = c.activeCriteria || c.criteria || c.hiringCriteria || [];

              // Find matched skills or roles for highlight badges
              const q = query.toLowerCase().trim();
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
                  onClick={() => {
                    onClose();
                    navigate(`/companies/${c.id}`);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-2xl cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CompanyLogo
                      logoUrl={c.logoUrl}
                      companyName={c.companyName}
                      size="sm"
                    />

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {c.companyName}
                        </h4>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold border ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {c.industry || 'Technology'} • {c.location || 'India'}
                      </p>

                      {/* Matched Pill Highlights */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {matchedRole && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                            Role: {matchedRole}
                          </span>
                        )}
                        {matchedSkill && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200">
                            Skill: {matchedSkill}
                          </span>
                        )}
                        {!matchedRole && !matchedSkill && criteriaList.length > 0 && (
                          <span className="text-[10px] font-medium text-slate-500">
                            {criteriaList.length} open role{criteriaList.length === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hidden sm:inline flex items-center gap-1">
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <strong className="text-slate-900 dark:text-white">{filteredResults.length}</strong> companies found
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Use ↑↓ arrows to navigate, Enter to view</span>
          </div>

          <button
            onClick={() => {
              onClose();
              navigate(`/companies${query ? `?q=${encodeURIComponent(query)}` : ''}`);
            }}
            className="inline-flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400 hover:underline"
          >
            <span>View in Full Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
