import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Github,
  Linkedin,
  Save,
  CheckCircle2,
  BadgeCheck,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { ApiResponse, StudentProfileResponse, StudentProfileRequest } from '../../types';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { ensureStudentProfile } from '../../lib/studentProfileHelper';

export const StudentProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: profile, isLoading } = useQuery({
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

  const [formData, setFormData] = useState<StudentProfileRequest>({
    fullName: '',
    rollNumber: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'Female',
    address: '',
    bio: '',
    githubUrl: '',
    linkedinUrl: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        rollNumber: profile.rollNumber || '',
        phoneNumber: profile.phoneNumber || '',
        dateOfBirth: profile.dateOfBirth || '',
        gender: profile.gender || 'Female',
        address: profile.address || '',
        bio: profile.bio || '',
        githubUrl: profile.githubUrl || '',
        linkedinUrl: profile.linkedinUrl || '',
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: StudentProfileRequest) => {
      const cleanPhone = payload.phoneNumber?.replace(/[\s-]/g, '').trim();
      const sanitizedPayload: StudentProfileRequest = {
        ...payload,
        fullName: (payload.fullName || '').trim(),
        rollNumber: (payload.rollNumber || '').trim().toUpperCase(),
        phoneNumber: cleanPhone && cleanPhone.length >= 10 ? cleanPhone : undefined,
        dateOfBirth: payload.dateOfBirth || undefined,
        address: payload.address?.trim() || undefined,
        bio: payload.bio?.trim() || undefined,
        githubUrl: payload.githubUrl?.trim() || undefined,
        linkedinUrl: payload.linkedinUrl?.trim() || undefined,
      };

      const res = await apiClient.put<ApiResponse<StudentProfileResponse>>(
        '/students/profile',
        sanitizedPayload
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Profile Saved', 'Your student profile information has been updated.');
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
      queryClient.invalidateQueries({ queryKey: ['systemDiagnostics'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      toast.error('Error', msg);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'rollNumber') {
      setFormData({ ...formData, rollNumber: value.toUpperCase() });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(formData.fullName || '').trim() || !(formData.rollNumber || '').trim()) {
      toast.error('Validation Error', 'Full name and Roll number are mandatory');
      return;
    }
    updateProfileMutation.mutate(formData);
  };


  if (isLoading) {
    return <CardSkeleton />;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Student Profile & Contact Details
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Manage your academic identity, portfolio links, and biographical details
        </p>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Readonly Account Email Banner */}
          <div className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span className="text-slate-600 dark:text-slate-300">
                Registered Account Email: <strong>{profile?.email}</strong>
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold text-brand-600 px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/60 border border-brand-200 dark:border-brand-800">
              Active Account
            </span>
          </div>

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
                  onChange={handleChange}
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
                  onChange={handleChange}
                  placeholder="CS-2026-089"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
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
                onChange={handleChange}
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
              Address & Campus Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 University Ave, Silicon Valley, CA"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                GitHub Portfolio URL
              </label>
              <div className="relative">
                <Github className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  name="githubUrl"
                  value={formData.githubUrl}
                  onChange={handleChange}
                  placeholder="https://github.com/username"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                LinkedIn Profile URL
              </label>
              <div className="relative">
                <Linkedin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Professional Bio & Career Objective
            </label>
            <textarea
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Aspiring software engineer with passionate interest in distributed systems, Spring Boot, and cloud databases..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all"
            >
              {updateProfileMutation.isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile Information</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
