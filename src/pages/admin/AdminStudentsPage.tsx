import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  Search,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Mail,
  BookOpen,
  Code,
  Github,
  Linkedin,
  Phone,
  Calendar,
  Edit3,
  Save,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { ApiResponse, StudentProfileResponse } from '../../types';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { formatPercentage, getProficiencyBadge } from '../../lib/utils';

export const AdminStudentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfileResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentProfileResponse | null>(null);

  const { data: students, isLoading } = useQuery({
    queryKey: ['adminStudents'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>('/admin/students');
        const raw = res.data;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        if (Array.isArray(raw?.data?.content)) return raw.data.content;
        if (Array.isArray(raw?.content)) return raw.content;
      } catch (err) {
        console.warn('[AdminStudents] Fetch error:', err);
      }
      return [];
    },
  });

  const [editStudent, setEditStudent] = useState<StudentProfileResponse | null>(null);
  const [editStudentForm, setEditStudentForm] = useState<any>({
    fullName: '',
    rollNumber: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    bio: '',
    githubUrl: '',
    linkedinUrl: '',
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      let github = payload.githubUrl?.trim();
      if (github && !/^https?:\/\//i.test(github)) github = `https://${github}`;
      let linkedin = payload.linkedinUrl?.trim();
      if (linkedin && !/^https?:\/\//i.test(linkedin)) linkedin = `https://${linkedin}`;

      const res = await apiClient.put<ApiResponse<StudentProfileResponse>>(
        `/admin/students/${id}`,
        {
          fullName: payload.fullName?.trim() || undefined,
          rollNumber: payload.rollNumber?.trim() || undefined,
          phoneNumber: payload.phoneNumber?.trim() || undefined,
          dateOfBirth: payload.dateOfBirth?.trim() || undefined,
          gender: payload.gender?.trim() || undefined,
          address: payload.address?.trim() || undefined,
          bio: payload.bio?.trim() || undefined,
          githubUrl: github || undefined,
          linkedinUrl: linkedin || undefined,
        }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Student Saved', 'Student profile updated by administrator');
      setEditStudent(null);
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
    },
    onError: (err: any) => {
      toast.error('Update Error', err.response?.data?.message || err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete<ApiResponse<string>>(`/admin/students/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Student Deleted', 'Student profile and academic records removed');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
      queryClient.invalidateQueries({ queryKey: ['systemDiagnostics'] });
    },
    onError: (err: any) => {
      toast.error('Deletion Error', err.response?.data?.message || err.message);
    },
  });

  const filteredStudents = useMemo(() => {
    if (!students || !Array.isArray(students)) return [];
    const query = search.toLowerCase().trim();
    return students.filter((s) => {
      if (!s) return false;
      const nameMatch = (s.fullName || '').toLowerCase().includes(query);
      const emailMatch = (s.email || '').toLowerCase().includes(query);
      const rollMatch = (s.rollNumber || '').toLowerCase().includes(query);
      return !query || nameMatch || emailMatch || rollMatch;
    });
  }, [students, search]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          University Student Records Database
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Inspect student academic performance, aggregate metrics, and technical competencies
        </p>
      </div>

      {/* Search Bar */}
      <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll number, or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Total: {filteredStudents.length} Students
        </span>
      </div>

      {/* Students Table */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <GraduationCap className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-xs text-slate-500">No student profiles found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Roll Number & Email</th>
                  <th className="py-3 px-3">Aggregate Score</th>
                  <th className="py-3 px-3">Academic Marks</th>
                  <th className="py-3 px-3">Registered Skills</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {s.fullName || 'Student'}
                    </td>
                    <td className="py-3 px-3 space-y-0.5">
                      <p className="font-mono font-bold text-brand-600 dark:text-brand-400">
                        {s.rollNumber || 'N/A'}
                      </p>
                      <p className="text-[10px] text-slate-400">{s.email}</p>
                    </td>
                    <td className="py-3 px-3 font-mono font-extrabold text-slate-900 dark:text-white">
                      {formatPercentage(s.aggregatePercentage)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[11px] text-slate-500">
                        {s.academicMarks?.length || 0} subjects recorded
                      </span>
                      <div className="text-[10px]">
                        {s.allMarksVerified ? (
                          <span className="text-emerald-600 font-semibold">✔ 100% Verified</span>
                        ) : (
                          <span className="text-amber-600">Pending audit</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                        {s.skills?.length || 0} Skills
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedStudent(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect
                        </button>
                        <button
                          onClick={() => {
                            setEditStudent(s);
                            setEditStudentForm({
                              fullName: s.fullName || '',
                              rollNumber: s.rollNumber || '',
                              phoneNumber: s.phoneNumber || '',
                              dateOfBirth: s.dateOfBirth || '',
                              gender: s.gender || '',
                              address: s.address || '',
                              bio: s.bio || '',
                              githubUrl: s.githubUrl || '',
                              linkedinUrl: s.linkedinUrl || '',
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete student"
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

      {/* Detail Inspection Modal */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={selectedStudent?.fullName || 'Student Details'}
        description={`Roll Number: ${selectedStudent?.rollNumber} • ${selectedStudent?.email}`}
        maxWidth="xl"
      >
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <span className="text-slate-400">Aggregate Percentage:</span>
              <p className="text-xl font-bold text-brand-600 dark:text-brand-400 font-mono mt-0.5">
                {formatPercentage(selectedStudent?.aggregatePercentage)}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Audit Status:</span>
              <p className="mt-1">
                {selectedStudent?.allMarksVerified ? (
                  <span className="text-emerald-600 font-semibold">✔ All Marks Verified</span>
                ) : (
                  <span className="text-amber-600 font-semibold">⚠️ Pending Teacher Audit</span>
                )}
              </p>
            </div>
          </div>

          {/* Academic Records */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-brand-500" />
              Academic Mark Sheet ({selectedStudent?.academicMarks?.length || 0})
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {selectedStudent?.academicMarks && selectedStudent.academicMarks.length > 0 ? (
                selectedStudent.academicMarks.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{m.subjectName}</p>
                      <p className="text-[10px] text-slate-400">{m.semester}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold">
                        {m.verifiedMarks !== null && m.verifiedMarks !== undefined
                          ? `${m.verifiedMarks} (Verified)`
                          : `${m.selfReportedMarks} (Self)`}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 p-2">No academic marks submitted yet.</p>
              )}
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Code className="w-4 h-4 text-indigo-500" />
              Registered Skills ({selectedStudent?.skills?.length || 0})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {selectedStudent?.skills && selectedStudent.skills.length > 0 ? (
                selectedStudent.skills.map((s) => {
                  const badge = getProficiencyBadge(s.proficiency);
                  return (
                    <span
                      key={s.id}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${badge.className}`}
                    >
                      {s.skillName} ({badge.label} • {s.yearsOfExperience}y)
                    </span>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400">No technical skills registered yet.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setSelectedStudent(null)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Student Profile Modal (Admin) */}
      <Modal
        isOpen={!!editStudent}
        onClose={() => setEditStudent(null)}
        title={`Edit Student Record: ${editStudent?.fullName || 'Student'}`}
        description={`Modify academic & personal identity credentials for ${editStudent?.email}`}
        maxWidth="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!editStudent) return;
            updateStudentMutation.mutate({
              id: editStudent.id,
              payload: editStudentForm,
            });
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={editStudentForm.fullName}
                onChange={(e) => setEditStudentForm({ ...editStudentForm, fullName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                University Roll Number *
              </label>
              <input
                type="text"
                value={editStudentForm.rollNumber}
                onChange={(e) => setEditStudentForm({ ...editStudentForm, rollNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={editStudentForm.phoneNumber}
                onChange={(e) => setEditStudentForm({ ...editStudentForm, phoneNumber: e.target.value })}
                placeholder="+1234567890"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={editStudentForm.dateOfBirth}
                onChange={(e) => setEditStudentForm({ ...editStudentForm, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gender
              </label>
              <select
                value={editStudentForm.gender}
                onChange={(e) => setEditStudentForm({ ...editStudentForm, gender: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              >
                <option value="">Unspecified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GitHub Profile URL
              </label>
              <input
                type="text"
                value={editStudentForm.githubUrl}
                onChange={(e) => setEditStudentForm({ ...editStudentForm, githubUrl: e.target.value })}
                placeholder="https://github.com/username"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                LinkedIn Profile URL
              </label>
              <input
                type="text"
                value={editStudentForm.linkedinUrl}
                onChange={(e) => setEditStudentForm({ ...editStudentForm, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Residential Address
            </label>
            <input
              type="text"
              value={editStudentForm.address}
              onChange={(e) => setEditStudentForm({ ...editStudentForm, address: e.target.value })}
              placeholder="e.g. 123 University Campus, Hall 4"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Short Bio
            </label>
            <textarea
              rows={2}
              value={editStudentForm.bio}
              onChange={(e) => setEditStudentForm({ ...editStudentForm, bio: e.target.value })}
              placeholder="Academic goals and career aspirations..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditStudent(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateStudentMutation.isPending}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Student Account Deletion"
        description={`Are you sure you want to permanently delete student ${deleteTarget?.fullName} (${deleteTarget?.rollNumber})?`}
      >
        <div className="space-y-4">
          <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900">
            ⚠️ This will remove all associated self-reported marks, verified faculty audits, and skillset records.
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
              Delete Student
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
