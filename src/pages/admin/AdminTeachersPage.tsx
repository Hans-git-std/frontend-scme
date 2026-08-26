import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCheck,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Building,
  BadgeCheck,
  PlusCircle,
  X,
  Eye,
  Edit3,
  Save,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import {
  ApiResponse,
  TeacherProfileResponse,
  CreateTeacherRequest,
  TeacherApprovalStatus,
} from '../../types';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { COMMON_SUBJECTS } from '../../lib/utils';

export const AdminTeachersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TeacherApprovalStatus>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [inspectTeacher, setInspectTeacher] = useState<TeacherProfileResponse | null>(null);
  const [editTeacher, setEditTeacher] = useState<TeacherProfileResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeacherProfileResponse | null>(null);

  // New teacher form state (Zero hardcoded defaults)
  const [newTeacher, setNewTeacher] = useState<CreateTeacherRequest>({
    fullName: '',
    email: '',
    employeeId: '',
    department: '',
    designation: '',
    phoneNumber: '',
    assignedSubjects: [],
  });
  const [customSubject, setCustomSubject] = useState('');

  // Edit teacher form state
  const [editTeacherForm, setEditTeacherForm] = useState<any>({
    fullName: '',
    employeeId: '',
    department: '',
    designation: '',
    phoneNumber: '',
    assignedSubjects: [],
  });
  const [editCustomSubject, setEditCustomSubject] = useState('');

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['adminTeachers'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>('/admin/teachers');
        const raw = res.data;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        if (Array.isArray(raw?.data?.content)) return raw.data.content;
        if (Array.isArray(raw?.content)) return raw.content;
      } catch (err) {
        console.warn('[AdminTeachers] Fetch error:', err);
      }
      return [];
    },
  });

  const createTeacherMutation = useMutation({
    mutationFn: async (payload: CreateTeacherRequest) => {
      const res = await apiClient.post<ApiResponse<TeacherProfileResponse>>(
        '/admin/teachers',
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Faculty Provisioned', 'Active teacher account created and pre-approved.');
      queryClient.invalidateQueries({ queryKey: ['adminTeachers'] });
      queryClient.invalidateQueries({ queryKey: ['pendingTeachers'] });
      queryClient.invalidateQueries({ queryKey: ['systemDiagnostics'] });
      setIsCreateModalOpen(false);
      setNewTeacher({
        fullName: '',
        email: '',
        employeeId: '',
        department: '',
        designation: '',
        phoneNumber: '',
        assignedSubjects: [],
      });
    },
    onError: (err: any) => {
      toast.error('Creation Error', err.response?.data?.message || err.message);
    },
  });

  const updateTeacherMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await apiClient.put<ApiResponse<TeacherProfileResponse>>(
        `/admin/teachers/${id}`,
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Faculty Saved', 'Teacher profile updated by administrator.');
      setEditTeacher(null);
      queryClient.invalidateQueries({ queryKey: ['adminTeachers'] });
      queryClient.invalidateQueries({ queryKey: ['pendingTeachers'] });
    },
    onError: (err: any) => {
      toast.error('Update Error', err.response?.data?.message || err.message);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post<ApiResponse<TeacherProfileResponse>>(`/admin/teachers/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Approved', 'Teacher status updated to APPROVED');
      queryClient.invalidateQueries({ queryKey: ['adminTeachers'] });
      queryClient.invalidateQueries({ queryKey: ['pendingTeachers'] });
      queryClient.invalidateQueries({ queryKey: ['systemDiagnostics'] });
    },
    onError: (err: any) => {
      toast.error('Approval Error', err.response?.data?.message || err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete<ApiResponse<string>>(`/admin/teachers/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Deleted', 'Faculty account removed from platform');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['adminTeachers'] });
      queryClient.invalidateQueries({ queryKey: ['pendingTeachers'] });
      queryClient.invalidateQueries({ queryKey: ['systemDiagnostics'] });
    },
    onError: (err: any) => {
      toast.error('Deletion Error', err.response?.data?.message || err.message);
    },
  });

  const filteredTeachers = useMemo(() => {
    if (!teachers || !Array.isArray(teachers)) return [];
    const query = search.toLowerCase().trim();
    return teachers.filter((t) => {
      if (!t) return false;
      const nameMatch = (t.fullName || '').toLowerCase().includes(query);
      const emailMatch = (t.email || '').toLowerCase().includes(query);
      const empMatch = (t.employeeId || '').toLowerCase().includes(query);
      const deptMatch = (t.department || '').toLowerCase().includes(query);
      const matchesSearch = !query || nameMatch || emailMatch || empMatch || deptMatch;
      const matchesStatus = statusFilter === 'ALL' || t.approvalStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [teachers, search, statusFilter]);

  const handleAddSubject = (sub: string) => {
    const trimmed = sub.trim();
    if (!trimmed) return;
    if (!newTeacher.assignedSubjects.includes(trimmed)) {
      setNewTeacher({
        ...newTeacher,
        assignedSubjects: [...newTeacher.assignedSubjects, trimmed],
      });
    }
    setCustomSubject('');
  };

  const handleRemoveSubject = (sub: string) => {
    setNewTeacher({
      ...newTeacher,
      assignedSubjects: newTeacher.assignedSubjects.filter((s) => s !== sub),
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacher.fullName.trim() || !newTeacher.email.trim() || !newTeacher.employeeId.trim()) {
      toast.error('Validation Error', 'Please complete all required fields');
      return;
    }
    createTeacherMutation.mutate(newTeacher);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Faculty Directory & Verification Administration
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Manage academic verification privileges, employee IDs, and assigned subjects
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Provision Faculty Directly</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, employee ID, or department..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl shrink-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All ({teachers?.length || 0})
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'APPROVED'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'PENDING'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'REJECTED'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Registered Faculty Members ({filteredTeachers.length})
          </h3>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <UserCheck className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-xs text-slate-500">No faculty records match your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Faculty Member</th>
                  <th className="py-3 px-3">Email & Employee ID</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Assigned Subjects</th>
                  <th className="py-3 px-3">Approval Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
                {filteredTeachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {t.fullName || 'Faculty Member'}
                      <p className="text-[10px] text-slate-400 font-normal">{t.designation || 'Professor'}</p>
                    </td>
                    <td className="py-3 px-3 space-y-0.5">
                      <p>{t.email}</p>
                      <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                        {t.employeeId || 'N/A'}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {t.department || 'Engineering'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {t.assignedSubjects?.map((sub: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium"
                          >
                            {sub}
                          </span>
                        ))}
                        {(!t.assignedSubjects || t.assignedSubjects.length === 0) && (
                          <span className="text-[10px] text-slate-400">None assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          t.approvalStatus === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : t.approvalStatus === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {t.approvalStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectTeacher(t)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect
                        </button>
                        <button
                          onClick={() => {
                            setEditTeacher(t);
                            setEditTeacherForm({
                              fullName: t.fullName || '',
                              employeeId: t.employeeId || '',
                              department: t.department || '',
                              designation: t.designation || '',
                              phoneNumber: t.phoneNumber || '',
                              assignedSubjects: [...(t.assignedSubjects || [])],
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        {t.approvalStatus === 'PENDING' && (
                          <button
                            onClick={() => approveMutation.mutate(t.id)}
                            disabled={approveMutation.isPending}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 shadow-sm"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete faculty"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Teacher Modal */}
      <Modal
        isOpen={!!inspectTeacher}
        onClose={() => setInspectTeacher(null)}
        title={inspectTeacher?.fullName || 'Faculty Profile'}
        description={`Employee ID: ${inspectTeacher?.employeeId} • ${inspectTeacher?.email}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-400">Department:</span>
              <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{inspectTeacher?.department || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-400">Designation:</span>
              <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{inspectTeacher?.designation || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-400">Phone:</span>
              <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{inspectTeacher?.phoneNumber || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-400">Approval Status:</span>
              <p className="font-bold text-emerald-600 mt-0.5">{inspectTeacher?.approvalStatus || 'PENDING'}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white">Assigned Teaching Subjects ({inspectTeacher?.assignedSubjects?.length || 0})</h4>
            <div className="flex flex-wrap gap-1.5">
              {inspectTeacher?.assignedSubjects?.map((sub, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium">
                  {sub}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setInspectTeacher(null)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Direct Provisioning Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Direct Faculty Provisioning"
        description="Directly create and activate a pre-approved faculty member"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={newTeacher.fullName}
                onChange={(e) => setNewTeacher({ ...newTeacher, fullName: e.target.value })}
                placeholder="Dr. Alan Turing"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Faculty Email *
              </label>
              <input
                type="email"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                placeholder="turing@faculty.edu"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employee ID *
              </label>
              <input
                type="text"
                value={newTeacher.employeeId}
                onChange={(e) => setNewTeacher({ ...newTeacher, employeeId: e.target.value })}
                placeholder="EMP-FAC-1002"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={newTeacher.designation}
                onChange={(e) => setNewTeacher({ ...newTeacher, designation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Assigned Subjects */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Assigned Teaching Subjects
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              {newTeacher.assignedSubjects.map((sub) => (
                <span
                  key={sub}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 text-xs font-medium"
                >
                  {sub}
                  <button type="button" onClick={() => handleRemoveSubject(sub)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Add custom subject..."
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={() => handleAddSubject(customSubject)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTeacherMutation.isPending}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
            >
              Provision & Activate Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Faculty Modal (Admin) */}
      <Modal
        isOpen={!!editTeacher}
        onClose={() => setEditTeacher(null)}
        title={`Edit Faculty: ${editTeacher?.fullName || 'Faculty Member'}`}
        description={`Modify institutional assignments and profile details for ${editTeacher?.email}`}
        maxWidth="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!editTeacher) return;
            updateTeacherMutation.mutate({
              id: editTeacher.id,
              payload: editTeacherForm,
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={editTeacherForm.fullName}
                onChange={(e) => setEditTeacherForm({ ...editTeacherForm, fullName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employee ID *
              </label>
              <input
                type="text"
                value={editTeacherForm.employeeId}
                onChange={(e) => setEditTeacherForm({ ...editTeacherForm, employeeId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Academic Department
              </label>
              <input
                type="text"
                value={editTeacherForm.department}
                onChange={(e) => setEditTeacherForm({ ...editTeacherForm, department: e.target.value })}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Academic Designation
              </label>
              <input
                type="text"
                value={editTeacherForm.designation}
                onChange={(e) => setEditTeacherForm({ ...editTeacherForm, designation: e.target.value })}
                placeholder="e.g. Assistant Professor"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contact Phone Number
            </label>
            <input
              type="tel"
              value={editTeacherForm.phoneNumber}
              onChange={(e) => setEditTeacherForm({ ...editTeacherForm, phoneNumber: e.target.value })}
              placeholder="+1234567890"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            />
          </div>

          {/* Assigned Subjects in Edit Form */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Assigned Subjects for Grade Audit ({editTeacherForm.assignedSubjects?.length || 0})
            </label>
            <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 min-h-[50px]">
              {editTeacherForm.assignedSubjects?.map((sub: string, i: number) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 text-xs font-medium"
                >
                  {sub}
                  <button
                    type="button"
                    onClick={() => {
                      setEditTeacherForm({
                        ...editTeacherForm,
                        assignedSubjects: editTeacherForm.assignedSubjects.filter((s: string) => s !== sub),
                      });
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={editCustomSubject}
                onChange={(e) => setEditCustomSubject(e.target.value)}
                placeholder="Add assigned subject..."
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  const val = editCustomSubject.trim();
                  if (val && !editTeacherForm.assignedSubjects.includes(val)) {
                    setEditTeacherForm({
                      ...editTeacherForm,
                      assignedSubjects: [...editTeacherForm.assignedSubjects, val],
                    });
                  }
                  setEditCustomSubject('');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditTeacher(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateTeacherMutation.isPending}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Faculty Removal"
        description={`Are you sure you want to delete ${deleteTarget?.fullName} (${deleteTarget?.email})?`}
      >
        <div className="space-y-4">
          <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900">
            ⚠️ This will permanently remove the faculty member's profile and credentials from the system.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
            >
              Delete Faculty
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
