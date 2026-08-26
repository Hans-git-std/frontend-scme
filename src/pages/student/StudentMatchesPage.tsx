import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  TrendingUp,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { ApiResponse, CompanyMatchResponse } from '../../types';
import { ScoreGauge } from '../../components/ui/ScoreGauge';
import { LoadingAnimation } from '../../components/ui/LoadingAnimation';
import { getVerificationStatusBadge } from '../../lib/utils';

export const StudentMatchesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'STRICT' | 'RELAXED_WEIGHTED'>('ALL');

  const { data: matches, isLoading, error } = useQuery({
    queryKey: ['studentMatches'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<CompanyMatchResponse[]>>('/students/matches');
      return res.data.data;
    },
  });

  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    return matches.filter((m) => {
      const matchesFilter =
        filterType === 'ALL' || m.matchType === filterType;
      const matchesSearch =
        m.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.location && m.location.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [matches, filterType, searchQuery]);

  const strictCount = matches?.filter((m) => m.matchType === 'STRICT').length || 0;
  const relaxedCount = matches?.filter((m) => m.matchType === 'RELAXED_WEIGHTED').length || 0;

  return (
    <div className="space-y-8">
      {/* Header & Match Engine Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold border border-brand-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI Placement Match Engine
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Corporate Matches & Recruitment Fits
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Intelligent scoring evaluated against corporate required skills (60%) and subject cutoffs (40%) across all engineering disciplines
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/student/academics"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Update Marks
          </Link>
        </div>
      </div>

      {/* Controls Bar: Search & Filter Tabs */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company, role, or location..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl shrink-0">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterType === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Matches ({matches?.length || 0})
          </button>
          <button
            onClick={() => setFilterType('STRICT')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              filterType === 'STRICT'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Strict ({strictCount})
          </button>
          <button
            onClick={() => setFilterType('RELAXED_WEIGHTED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              filterType === 'RELAXED_WEIGHTED'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Relaxed Fit ({relaxedCount})
          </button>
        </div>
      </div>

      {/* Match Results List */}
      {isLoading ? (
        <LoadingAnimation message="Computing Match Compatibility..." subMessage="Evaluating student academic scores and skills against active corporate requirements" variant="card" />
      ) : error ? (
        <div className="glass-card rounded-2xl p-8 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Unable to Load Matches
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Please make sure you have submitted at least one academic mark and registered your technical skills.
          </p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Matching Positions Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Try adjusting your search criteria, or add additional semester marks and technical skills to qualify for active hiring roles.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredMatches.map((match, idx) => {
            const isStrict = match.matchType === 'STRICT';
            const statusBadge = getVerificationStatusBadge(
              match.companyVerificationStatus || 'NOT_VERIFIED'
            );

            return (
              <div
                key={`${match.companyId}-${idx}`}
                className="glass-card rounded-3xl p-6 sm:p-7 hover:border-brand-500/40 transition-all space-y-5 shadow-sm"
              >
                {/* Top Row: Company Info, Score Gauge & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-extrabold text-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                      {match.logoUrl ? (
                        <img
                          src={match.logoUrl}
                          alt={match.companyName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        match.companyName.charAt(0)
                      )}
                    </div>

                    {/* Titles & Details */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                          {match.companyName}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            isStrict
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                          }`}
                        >
                          {isStrict ? 'STRICT DIRECT MATCH' : 'RELAXED WEIGHTED FIT'}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                        {match.roleTitle}
                      </p>

                      {match.location && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 pt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {match.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Radial Score Gauge */}
                  <div className="flex items-center gap-3 self-end sm:self-start shrink-0">
                    <ScoreGauge score={match.matchScore} size={76} strokeWidth={7} />
                  </div>
                </div>

                {/* Verification Warning Alert */}
                {match.isVerificationPending && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Provisional Evaluation:</strong> {match.verificationRemark || 'Verification by Faculty is Required'}. Match score may adjust once officially confirmed.
                    </span>
                  </div>
                )}

                {/* Skills Analysis Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Matched Skills */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        Matched Skills ({match.matchedSkills?.length || 0})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {match.matchedSkills && match.matchedSkills.length > 0 ? (
                        match.matchedSkills.map((s, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No overlapping skills</span>
                      )}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-4 h-4" />
                        Missing Required Skills ({match.missingSkills?.length || 0})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {match.missingSkills && match.missingSkills.length > 0 ? (
                        match.missingSkills.map((s, mIdx) => (
                          <span
                            key={mIdx}
                            className="text-xs px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          All required skills satisfied!
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Academic Subject Gaps Breakdown & HansLearn Callout */}
                {match.subjectGaps && match.subjectGaps.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                        <TrendingUp className="w-4 h-4 text-brand-500" />
                        <span>Academic Cutoff Deficit & Actionable Advice</span>
                      </div>
                      <a
                        href="https://hanslearn.netlify.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                      >
                        <span>Learn via 3D Simulators</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="space-y-2">
                      {match.subjectGaps.map((gap, gIdx) => (
                        <div
                          key={gIdx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs gap-1.5"
                        >
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {gap.subjectName}
                            </span>
                            <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                              💡 {gap.gapRemark}
                            </p>
                          </div>
                          <div className="text-right text-[11px] shrink-0 font-mono">
                            <span className="text-slate-400">Score: </span>
                            <span className="text-slate-800 dark:text-slate-200 font-bold">
                              {gap.actualScore.toFixed(1)}
                            </span>
                            <span className="text-slate-400"> / Cutoff: </span>
                            <span className="text-brand-600 dark:text-brand-400 font-bold">
                              {gap.requiredScore.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
