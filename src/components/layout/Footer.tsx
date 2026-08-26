import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Sparkles, ExternalLink, Code2, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Platform Bio */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">
                Student-Corporate Matcher
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Intelligent career matchmaking platform connecting verified university students with leading corporate employers across all engineering branches, classes, and batches.
            </p>

            {/* Interactive 3D Learning Hub Feature Link */}
            <div className="pt-2">
              <a
                href="https://hanslearn.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-50 to-sky-50 dark:from-brand-950/40 dark:to-sky-950/40 border border-brand-200/80 dark:border-brand-800/80 text-xs font-semibold text-brand-700 dark:text-brand-300 hover:shadow-md transition-all group"
              >
                <Sparkles className="w-4 h-4 text-brand-500 group-hover:scale-110 transition-transform" />
                <span>HansLearn: Interactive 3D Simulators & Learning</span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
              </a>
            </div>
          </div>

          {/* Students & Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3">
              Students & Portals
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/register/student" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Student Registration
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Student Sign In
                </Link>
              </li>
              <li>
                <Link to="/companies" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Company Directory
                </Link>
              </li>
              <li>
                <a
                  href="https://hanslearn.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1"
                >
                  <span>3D Learning Simulators</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
            </ul>
          </div>

          {/* Faculty & Employers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3">
              Faculty & Employers
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/register/teacher" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Faculty Registration & Audit
                </Link>
              </li>
              <li>
                <Link to="/register/company" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Employer Registration & Criteria
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Partner Portal Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Developer Attribution & Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-center sm:text-left">
            <span>© {new Date().getFullYear()} Student-Corporate Matcher Platform.</span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-brand-500 inline" />
              Developer: <strong className="text-slate-900 dark:text-white font-bold">Hans Raj</strong> (Sole Architect & Full-Stack Developer)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://hanslearn.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1 text-[11px]"
            >
              <span>HansLearn 3D</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <Link
              to="/admin/login"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-[11px] transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
