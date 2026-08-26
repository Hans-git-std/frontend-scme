import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  User,
  BadgeCheck,
  Building,
  Phone,
  BookOpen,
  Plus,
  X,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { ApiResponse, TeacherProfileResponse } from '../../types';
import { COMMON_SUBJECTS } from '../../lib/utils';

export const TeacherRegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  const handleAddSubject = (subjectToAdd: string) => {
    const trimmed = subjectToAdd.trim();
    if (!trimmed) return;
    if (!assignedSubjects.includes(trimmed)) {
      setAssignedSubjects([...assignedSubjects, trimmed]);
    }
    setCustomSubject('');
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    setAssignedSubjects(assignedSubjects.filter((s) => s !== subjectToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !employeeId.trim()) {
      toast.error('Required Fields', 'Please complete all required faculty details');
      return;
    }
    if (assignedSubjects.length === 0) {
      toast.error('Assigned Subjects', 'Please assign at least one subject to teach/verify');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post<ApiResponse<TeacherProfileResponse>>('/teachers/register', {
        fullName: fullName.trim(),
        email: email.trim(),
        employeeId: employeeId.trim(),
        department: department.trim(),
        designation: designation.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        assignedSubjects,
      });

      toast.success('Registration Submitted', 'Your faculty application is pending admin approval.');
      setRegisteredSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Faculty registration failed';
      toast.error('Submission Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  if (registeredSuccess) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center space-y-5 animate-in fade-in max-w-md mx-auto">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Registration Submitted!
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            Your faculty account for <strong>{email}</strong> has been registered with status <span className="font-semibold text-amber-600">PENDING</span>.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 text-left space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Next Steps</span>
          </div>
          <p>
            An administrator will review your employee ID and assigned subjects. Once approved, you can log in directly using your email OTP.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <span>Proceed to Login Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Faculty Self-Registration
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Register your academic profile to officially audit and verify student marks
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Alan Turing"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Faculty Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="faculty@university.edu"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Employee ID *
              </label>
              <div className="relative">
                <BadgeCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="EMP-FAC-1002"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 555-0144"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Designation
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Associate Professor"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          {/* Assigned Subjects Multi-Select */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Assigned Subjects for Marks Verification *
            </label>

            {/* Selected Subject Chips */}
            <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl">
              {assignedSubjects.map((sub) => (
                <span
                  key={sub}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 text-xs font-medium border border-indigo-200 dark:border-indigo-800"
                >
                  {sub}
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(sub)}
                    className="hover:text-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {assignedSubjects.length === 0 && (
                <span className="text-xs text-slate-400 self-center">No subjects selected yet</span>
              )}
            </div>

            {/* Common Subject Suggestions */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Quick suggestions:</span>
              <div className="flex flex-wrap gap-1">
                {COMMON_SUBJECTS.slice(0, 6).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => handleAddSubject(sub)}
                    disabled={assignedSubjects.includes(sub)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 disabled:opacity-40 transition-colors"
                  >
                    + {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Subject Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubject(customSubject);
                  }
                }}
                placeholder="Or type custom subject name..."
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={() => handleAddSubject(customSubject)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <GraduationCap className="w-4 h-4" />
                <span>Submit Faculty Registration</span>
              </>
            )}
          </button>
        </form>
      </div>

      <div className="text-center text-xs text-slate-500">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
          Sign In with Email OTP
        </Link>
      </div>
    </div>
  );
};
