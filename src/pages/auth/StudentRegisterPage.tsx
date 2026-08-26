import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  User,
  Mail,
  BadgeCheck,
  Phone,
  Calendar,
  MapPin,
  FileText,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { apiClient } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { ApiResponse, AuthResponse, StudentProfileResponse } from '../../types';

interface StudentRegistrationFormState {
  fullName: string;
  rollNumber: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  bio: string;
  githubUrl: string;
  linkedinUrl: string;
}

export const StudentRegisterPage: React.FC = () => {
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  const [formData, setFormData] = useState<StudentRegistrationFormState>({
    fullName: '',
    rollNumber: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'Female',
    address: '',
    bio: '',
    githubUrl: '',
    linkedinUrl: '',
  });

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'rollNumber') {
      setFormData({ ...formData, rollNumber: value.toUpperCase() });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.rollNumber.trim() || !formData.email.trim()) {
      toast.error('Required Fields Missing', 'Please fill in your Full Name, Roll Number, and Email');
      return;
    }

    setLoading(true);
    try {
      // 1. Send OTP for student role
      await apiClient.post<ApiResponse<string>>('/auth/otp/send', {
        email: formData.email.trim().toLowerCase(),
        role: 'ROLE_STUDENT',
      });

      // Save email in storage
      localStorage.setItem('scme_last_email', formData.email.trim().toLowerCase());
      localStorage.setItem('scme_last_role', 'ROLE_STUDENT');

      toast.success(
        'Verification Code Dispatched',
        `A 6-digit OTP code was sent to ${formData.email.trim().toLowerCase()}`
      );
      setStep('OTP');
      setCooldown(60);
    } catch (err: any) {
      toast.error('Registration Error', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error('Invalid OTP', 'Please enter the 6-digit code sent to your email');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify OTP and authenticate session
      const authRes = await apiClient.post<ApiResponse<AuthResponse>>('/auth/otp/verify', {
        email: formData.email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      const authData = authRes.data.data;
      login(authData);

      // Clean phone number: remove spaces and non-standard characters
      const cleanPhone = formData.phoneNumber?.replace(/[\s-]/g, '').trim();

      // 2. Automatically save student profile details
      try {
        await apiClient.put<ApiResponse<StudentProfileResponse>>('/students/profile', {
          fullName: formData.fullName.trim(),
          rollNumber: formData.rollNumber.trim().toUpperCase(),
          phoneNumber: cleanPhone && cleanPhone.length >= 10 ? cleanPhone : undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          gender: formData.gender,
          address: formData.address?.trim() || undefined,
          bio: formData.bio?.trim() || undefined,
          githubUrl: formData.githubUrl?.trim() || undefined,
          linkedinUrl: formData.linkedinUrl?.trim() || undefined,
        });
      } catch (profileErr: any) {
        console.warn('Initial profile sync note:', profileErr);
      }

      toast.success(
        'Student Profile Created',
        'Welcome! Your student workspace is ready. You can now add your marks and skills.'
      );
      navigate('/student/dashboard');
    } catch (err: any) {
      toast.error('Verification Error', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 text-xs font-bold border border-brand-200 dark:border-brand-800 mb-2">
          <GraduationCap className="w-4 h-4" />
          <span>New Student Onboarding</span>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Create Your Student Placement Profile
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Register your identity to qualify for verified faculty audits and corporate job matching
        </p>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        {step === 'FORM' ? (
          /* Step 1: Student Information Form */
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleFormChange}
                    placeholder="Alex Morgan"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  University Roll Number *
                </label>
                <div className="relative">
                  <BadgeCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleFormChange}
                    placeholder="CS-2026-089"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                University Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="alex.morgan@university.edu"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                A verification code will be sent to this email to activate your account.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleFormChange}
                    placeholder="+1234567890"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Professional Bio & Career Objective
              </label>
              <textarea
                name="bio"
                rows={2}
                value={formData.bio}
                onChange={handleFormChange}
                placeholder="Aspiring software engineer interested in full-stack web, cloud, and distributed systems..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Continue to Email Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: OTP Verification & Auto-Save */
          <form onSubmit={handleVerifyAndComplete} className="space-y-4">
            <div className="p-3 rounded-xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/50 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                Email: <strong>{formData.email}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setStep('FORM');
                  setShowTroubleshoot(false);
                }}
                className="text-brand-600 dark:text-brand-400 font-semibold hover:underline shrink-0"
              >
                Edit Info
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Enter 6-Digit Verification Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-center tracking-widest text-lg font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  autoFocus
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Email & Activate Profile</span>
                </>
              )}
            </button>

            {/* Resend & Troubleshoot Row */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-brand-500" />
                  <span>Didn't receive code?</span>
                  {showTroubleshoot ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={handleRequestOtp}
                  className="font-semibold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-40"
                >
                  {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend Code'}
                </button>
              </div>

              {/* Troubleshoot Accordion */}
              {showTroubleshoot && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2 animate-in fade-in">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    Troubleshooting Checklist:
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 list-disc list-inside">
                    <li>
                      Check your <strong>Spam, Junk, or Promotions</strong> folder.
                    </li>
                    <li>
                      Verify your email address: <strong className="font-mono text-slate-800 dark:text-slate-200">{formData.email}</strong>.
                    </li>
                    <li>
                      Delivery usually takes 5 to 20 seconds. OTP code remains valid for <strong>5 minutes</strong>.
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="text-center text-xs text-slate-500 dark:text-slate-400">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
          Sign In to Your Student Dashboard
        </Link>
      </div>
    </div>
  );
};
