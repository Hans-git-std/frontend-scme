import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Mail,
  Building,
  BadgeCheck,
  Phone,
  BookOpen,
  Plus,
  X,
  Save,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { ApiResponse, TeacherProfileResponse, TeacherProfileRequest } from '../../types';
import { STATIC_DOMAIN_CATALOGS } from '../../lib/catalog';
import { CardSkeleton } from '../../components/ui/Skeleton';

export const TeacherProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['teacherProfile'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<TeacherProfileResponse>>('/teachers/profile');
      return res.data.data;
    },
  });

  const [formData, setFormData] = useState<TeacherProfileRequest>({
    fullName: '',
    employeeId: '',
    department: '',
    designation: '',
    phoneNumber: '',
    assignedSubjects: [],
  });

  const [selectedBranch, setSelectedBranch] = useState<string>('CSE');
  const [customSubject, setCustomSubject] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        employeeId: profile.employeeId || '',
        department: profile.department || '',
        designation: profile.designation || '',
        phoneNumber: profile.phoneNumber || '',
        assignedSubjects: profile.assignedSubjects || [],
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (payload: TeacherProfileRequest) => {
      const cleanPhone = payload.phoneNumber?.replace(/[\s-]/g, '').trim();
      const empId = (payload.employeeId || profile?.employeeId || 'EMP-FAC-100').trim();

      const res = await apiClient.put<ApiResponse<TeacherProfileResponse>>(
        '/teachers/profile',
        {
          ...payload,
          fullName: (payload.fullName || '').trim(),
          employeeId: empId,
          department: (payload.department || '').trim(),
          designation: (payload.designation || '').trim(),
          phoneNumber: cleanPhone && cleanPhone.length >= 10 ? cleanPhone : undefined,
          assignedSubjects: payload.assignedSubjects || [],
        }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Profile Updated', 'Faculty profile and assigned subjects saved successfully.');
      queryClient.invalidateQueries({ queryKey: ['teacherProfile'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      toast.error('Profile Save Failed', msg);
    },
  });

  const handleAddSubject = (subject: string) => {
    const trimmed = subject.trim();
    if (!trimmed) return;
    if (!formData.assignedSubjects?.includes(trimmed)) {
      setFormData({
        ...formData,
        assignedSubjects: [...(formData.assignedSubjects || []), trimmed],
      });
    }
    setCustomSubject('');
  };

  const handleRemoveSubject = (subToRemove: string) => {
    setFormData({
      ...formData,
      assignedSubjects: (formData.assignedSubjects || []).filter((s) => s !== subToRemove),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const currentBranchSubjects = React.useMemo(() => {
    const found = STATIC_DOMAIN_CATALOGS.find((d) => d.domainCode === selectedBranch);
    return found ? found.subjects.slice(0, 15) : [];
  }, [selectedBranch]);

  if (isLoading) {
    return <CardSkeleton />;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Faculty Profile & Assigned Subject Matrix
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Manage your academic credentials and verified subject teaching assignments
        </p>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Account Info Banner */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-slate-700 dark:text-slate-300">
                Email: <strong>{profile?.email}</strong>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Official Employee ID: <strong className="text-indigo-600 dark:text-indigo-400">{profile?.employeeId}</strong>
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-semibold border border-emerald-200 text-xs self-start sm:self-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Approved Status: {profile?.approvalStatus || 'APPROVED'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Employee ID *
              </label>
              <div className="relative">
                <BadgeCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder="e.g. EMP-FAC-1002"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Department *
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Designation *
              </label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+1234567890"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Assigned Subjects Manager */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Assigned Subjects for Student Mark Audits ({formData.assignedSubjects?.length || 0})
              </label>
              <span className="text-[11px] text-slate-400">Authorized verification courses</span>
            </div>

            {/* Selected Chips */}
            <div className="flex flex-wrap gap-1.5 min-h-[44px] p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl">
              {formData.assignedSubjects?.map((sub) => (
                <span
                  key={sub}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 text-xs font-medium border border-indigo-200 dark:border-indigo-800"
                >
                  {sub}
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(sub)}
                    className="hover:text-rose-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {(!formData.assignedSubjects || formData.assignedSubjects.length === 0) && (
                <span className="text-xs text-slate-400 self-center">No subjects assigned yet. Select from below or type custom course names.</span>
              )}
            </div>

            {/* Branch Filter Chips for Quick Subject Addition */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Browse subjects from engineering catalogs:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {STATIC_DOMAIN_CATALOGS.map((d) => (
                  <button
                    key={d.domainCode}
                    type="button"
                    onClick={() => setSelectedBranch(d.domainCode)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors ${
                      selectedBranch === d.domainCode
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {d.domainCode}
                  </button>
                ))}
              </div>

              {/* Subject Suggestions from Selected Branch */}
              <div className="flex flex-wrap gap-1 pt-1">
                {currentBranchSubjects.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => handleAddSubject(sub)}
                    disabled={formData.assignedSubjects?.includes(sub)}
                    className="text-[11px] px-2.5 py-0.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/40 disabled:opacity-30 transition-colors"
                  >
                    + {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Add Input */}
            <div className="flex gap-2 pt-2">
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
                placeholder="Type any custom course name (e.g. Advanced Nanomaterials, Fluid Mechanics II)..."
                className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleAddSubject(customSubject)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Add Subject
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
            >
              {updateMutation.isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Faculty Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
