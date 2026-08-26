import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Code,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  User,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { ApiResponse, StudentProfileResponse, CompanyMatchResponse } from '../../types';
import { ScoreGauge } from '../../components/ui/ScoreGauge';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { formatPercentage, getProficiencyBadge } from '../../lib/utils';
import { ensureStudentProfile } from '../../lib/studentProfileHelper';

export const StudentDashboardPage: React.FC = () => {
  // Ensure profile on page load
  useEffect(() => {
    ensureStudentProfile();
  }, []);

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['studentProfile'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<StudentProfileResponse>>('/students/profile');
        return res.data.data;
      } catch (err: any) {
        if (err.response?.status === 404 || err.response?.status === 400) {
          const created = await ensureStudentProfile();
          if (created) return created;
        }
        throw err;
      }
    },
  });

  const { data: matches, isLoading: isMatchesLoading } = useQuery({
    queryKey: ['studentMatches'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<CompanyMatchResponse[]>>('/students/matches');
        return res.data.data;
      } catch {
        return [];
      }
    },
  });

  if (isProfileLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const isProfileIncomplete = !profile?.fullName || !profile?.rollNumber;
  const verifiedMarksCount =
    profile?.academicMarks?.filter((m) => m.isVerified).length || 0;
  const totalMarksCount = profile?.academicMarks?.length || 0;
  const skillsCount = profile?.skills?.length || 0;
  const topMatches = matches?.slice(0, 3) || [];

  return (
    <div className="space-y-8">
      {/* Incomplete Profile Setup Banner */}
      {isProfileIncomplete && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Complete Your Student Profile</h4>
              <p className="text-amber-800/90 dark:text-amber-300/90 text-xs mt-0.5">
                Add your full name, university roll number, and bio so faculty can audit your semester marks and companies can identify you.
              </p>
            </div>
          </div>
          <Link
            to="/student/profile"
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-sm transition-all text-center"
          >
            Complete Profile Now →
          </Link>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-sky-600 to-indigo-700 text-white p-6 sm:p-8 shadow-lg shadow-brand-500/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Placement Matchmaking Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {profile?.fullName ? `Hello, ${profile.fullName}` : 'Welcome, Student'}
            </h2>
            <p className="text-xs sm:text-sm text-brand-100 leading-relaxed">
              Your profile is matched with corporate requirements based on 60% skills proficiency and 40% verified academic performance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/student/matches"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs sm:text-sm font-bold shadow-md transition-all"
            >
              <Briefcase className="w-4 h-4 text-brand-600" />
              <span>Explore Matches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/student/academics"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs sm:text-sm font-semibold transition-all backdrop-blur-md"
            >
              <BookOpen className="w-4 h-4" />
              <span>Add Marks</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Aggregate Percentage Card */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Aggregate Score
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {formatPercentage(profile?.aggregatePercentage)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Across {totalMarksCount} subject{totalMarksCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Verification Status Card */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Marks Verification
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {verifiedMarksCount}/{totalMarksCount}
            </h3>
            <p className="text-[11px] mt-0.5">
              {profile?.allMarksVerified ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  100% Faculty Verified
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  {totalMarksCount - verifiedMarksCount} Pending Review
                </span>
              )}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            profile?.allMarksVerified
              ? 'bg-emerald-500/10 text-emerald-600'
              : 'bg-amber-500/10 text-amber-600'
          }`}>
            {profile?.allMarksVerified ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
        </div>

        {/* Technical Skills Card */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Technical Skillset
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {skillsCount}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Registered skills
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Code className="w-6 h-6" />
          </div>
        </div>

        {/* Company Matches Card */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Qualified Matches
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {matches?.length || 0}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Active company fits
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Top Company Matches Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Top Qualified Corporate Matches
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calculated based on 60% skill proficiency + 40% academic cutoffs
              </p>
            </div>
            <Link
              to="/student/matches"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              View All ({matches?.length || 0})
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isMatchesLoading ? (
            <div className="space-y-3">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : topMatches.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Briefcase className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                No Company Matches Yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Submit your semester subject marks and add your technical skills to begin generating automated matches.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Link
                  to="/student/academics"
                  className="px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-semibold"
                >
                  Add Academic Marks
                </Link>
                <Link
                  to="/student/skills"
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold"
                >
                  Add Skills
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {topMatches.map((match, idx) => (
                <div
                  key={`${match.companyId}-${idx}`}
                  className="glass-card rounded-2xl p-5 hover:border-brand-500/40 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 font-bold text-base overflow-hidden border border-slate-200 dark:border-slate-700">
                        {match.logoUrl ? (
                          <img src={match.logoUrl} alt={match.companyName} className="w-full h-full object-cover" />
                        ) : (
                          match.companyName.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {match.companyName}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              match.matchType === 'STRICT'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                            }`}
                          >
                            {match.matchType === 'STRICT' ? 'STRICT MATCH' : 'RELAXED FIT'}
                          </span>
                        </div>
                        <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                          {match.roleTitle}
                        </p>
                      </div>
                    </div>

                    <ScoreGauge score={match.matchScore} size={64} strokeWidth={6} />
                  </div>

                  {/* Matched Skills Chips */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      {match.matchedSkills?.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {skill}
                        </span>
                      ))}
                      {match.missingSkills?.slice(0, 2).map((skill, mIdx) => (
                        <span
                          key={mIdx}
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                        >
                          Missing: {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Primary Gap Feedback Notice */}
                  {match.academicGapSummary && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{match.academicGapSummary}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Registered Skills & Academic Status */}
        <div className="space-y-6">
          {/* Registered Skills Quick Card */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-500" />
                Technical Skills ({skillsCount})
              </h4>
              <Link
                to="/student/skills"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Edit
              </Link>
            </div>

            {profile?.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill) => {
                  const badge = getProficiencyBadge(skill.proficiency);
                  return (
                    <span
                      key={skill.id}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 ${badge.className}`}
                    >
                      {skill.skillName}
                      <span className="text-[10px] opacity-75">
                        ({skill.yearsOfExperience}y)
                      </span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400">
                No skills added yet.{' '}
                <Link to="/student/skills" className="text-brand-600 underline">
                  Add skills
                </Link>
              </div>
            )}
          </div>

          {/* Academic Mark Sheet Snippet */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-500" />
                Academic Records ({totalMarksCount})
              </h4>
              <Link
                to="/student/academics"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Manage
              </Link>
            </div>

            {profile?.academicMarks && profile.academicMarks.length > 0 ? (
              <div className="space-y-2.5">
                {profile.academicMarks.slice(0, 4).map((mark) => (
                  <div
                    key={mark.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="truncate mr-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {mark.subjectName}
                      </p>
                      <p className="text-[10px] text-slate-400">{mark.semester}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {mark.verifiedMarks !== null ? mark.verifiedMarks : mark.selfReportedMarks}
                      </span>
                      <div className="text-[10px]">
                        {mark.isVerified ? (
                          <span className="text-emerald-600 font-semibold">✔ Verified</span>
                        ) : (
                          <span className="text-amber-600">Pending</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400">
                No marks submitted yet.{' '}
                <Link to="/student/academics" className="text-brand-600 underline">
                  Self-report marks
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
