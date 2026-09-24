import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Building2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  Users,
  Briefcase,
  ChevronRight,
  UserPlus,
  LogIn,
  Layers,
  Cpu,
  ExternalLink,
  Code,
  Search,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [heroSearch, setHeroSearch] = useState('');
  const navigate = useNavigate();

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/companies?q=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/companies');
    }
  };
  return (
    <div className="space-y-20 pb-16 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-10 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-500/20 via-sky-400/20 to-indigo-500/20 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold shadow-sm animate-in fade-in zoom-in duration-500">
            <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
            <span>AI-Driven Universal Placement Matcher across All Engineering Branches</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Connect Your Academic Excellence with{' '}
            <span className="bg-gradient-to-r from-brand-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent">
              Top Corporate Careers
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate placement ambiguity. Our intelligent engine evaluates verified academic scores across 1000+ courses, multi-domain skill profiles (CSE, Mechanical, ECE, Electrical, Civil, Chemical, AI/DS), and corporate requirements.
          </p>

          {/* Interactive Company Search Bar */}
          <form onSubmit={handleHeroSearch} className="max-w-2xl mx-auto pt-2">
            <div className="glass-card rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-sky-500/5">
              <Search className="w-5 h-5 text-sky-600 dark:text-sky-400 ml-2.5 shrink-0" />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search 200+ companies by name, skill (Python, CAD, Java...), role, or city..."
                className="flex-1 px-2 py-2 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-500/20 transition-all shrink-0 flex items-center gap-1.5"
              >
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Keyword Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2.5 text-xs text-slate-500">
              <span className="text-[11px] text-slate-400">Popular:</span>
              {['Python', 'Mechanical', 'Java', 'SolidWorks', 'Civil', 'Tata', 'Bengaluru'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => navigate(`/companies?q=${encodeURIComponent(term)}`)}
                  className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-sky-50 dark:bg-slate-800/80 dark:hover:bg-sky-950/60 text-[11px] text-slate-600 dark:text-slate-300 hover:text-sky-600 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </form>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-lg shadow-brand-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <LogIn className="w-5 h-5" />
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/register/student"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <UserPlus className="w-5 h-5" />
              <span>Register as New Student</span>
            </Link>

            <Link
              to="/companies"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl glass-card text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 text-sm font-semibold transition-all shadow-sm"
            >
              <Building2 className="w-5 h-5 text-sky-500" />
              <span>Browse Companies</span>
            </Link>
          </div>

          {/* Mini Trust Metrics */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-2xl glass-card">
              <span className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">
                1000+
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Multi-Branch Subjects & Skills
              </p>
            </div>
            <div className="p-4 rounded-2xl glass-card">
              <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                60 / 40
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Skills & Academics Ratio
              </p>
            </div>
            <div className="p-4 rounded-2xl glass-card">
              <span className="text-2xl font-extrabold text-sky-600 dark:text-sky-400">
                Real-Time
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Intelligent AI Match Engine
              </p>
            </div>
            <div className="p-4 rounded-2xl glass-card">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                100%
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Faculty Verified Integrity
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HansLearn 3D Learning Hub Feature Banner */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-indigo-700 to-sky-700 text-white p-8 sm:p-12 shadow-2xl">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold border border-white/20">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Featured Interactive Learning Hub by Developer Hans Raj</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Master Engineering Concepts with 3D Simulators on HansLearn
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
                Need to bridge skill gaps identified by corporate requirements? Explore interactive 3D simulations, real-time subject visualizers, and interactive experiments built to accelerate your learning.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
              <a
                href="https://hanslearn.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 text-sm font-bold shadow-xl transition-all hover:scale-105"
              >
                <span>Launch HansLearn 3D Hub</span>
                <ExternalLink className="w-4 h-4 text-brand-600" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Match Pipeline */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            How the Placement Engine Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            A trusted end-to-end workflow from self-reporting to corporate selection
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card rounded-3xl p-6 space-y-3 relative group hover:border-brand-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Student Profile
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Students record semester marks and technical skills from 1000+ catalog options or custom entries across all branches.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 space-y-3 relative group hover:border-indigo-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Faculty Audit
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              University teachers audit self-reported marks by roll number and attach official digital verification.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 space-y-3 relative group hover:border-sky-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Smart Matching
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Corporate recruiters publish criteria. The engine evaluates strict qualification and weighted compatibility.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 space-y-3 relative group hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              04
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Growth Feedback
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Students get transparent insights highlighting exact subject mark deficits and missing skills to qualify.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 space-y-8 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
              Universal Engineering Placement
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Empowering Students Across All Engineering Disciplines
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Serving students from Computer Science, Mechanical, Electronics, Electrical, Civil, Chemical, and AI/Data Science.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10 pt-4">
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <ShieldCheck className="w-6 h-6 text-brand-400" />
              <h4 className="text-sm font-bold">Verified Academic Integrity</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Guaranteed genuine marks validated directly by university department faculty before matching.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              <h4 className="text-sm font-bold">Skill-Weighted Evaluation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                60% emphasis on technical skill competencies combined with 40% academic course excellence.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <h4 className="text-sm font-bold">Actionable Improvement Advice</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clear recommendations on exactly which subjects or skills need focus to unlock dream job offers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Portals Callout */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-4 hover:border-brand-500 transition-all">
          <div className="space-y-2">
            <GraduationCap className="w-8 h-8 text-brand-600" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              For University Students
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Explore qualified corporate matches, see where you rank, and discover exact skill improvements.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <Link
              to="/register/student"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline block"
            >
              Register New Student Profile <ChevronRight className="w-4 h-4 inline" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white block"
            >
              Existing Student Sign In →
            </Link>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-4 hover:border-indigo-500 transition-all">
          <div className="space-y-2">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              For University Faculty
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Officially verify semester marks by roll number with digital timestamps to qualify student applications.
            </p>
          </div>
          <Link
            to="/register/teacher"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
          >
            Register Faculty Account <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-4 hover:border-sky-500 transition-all">
          <div className="space-y-2">
            <Building2 className="w-8 h-8 text-sky-600" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              For Corporate Recruiters
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Set customized subject cutoffs and skill requirements to automatically filter top verified graduates.
            </p>
          </div>
          <Link
            to="/register/company"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:underline"
          >
            Register Employer Profile <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
