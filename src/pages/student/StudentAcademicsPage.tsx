import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Send,
  Calculator,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import {
  ApiResponse,
  SubjectMarkResponse,
  SubjectMarkEntry,
} from '../../types';
import { SEMESTERS } from '../../lib/utils';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { CatalogAutocomplete } from '../../components/ui/CatalogAutocomplete';
import { LoadingAnimation } from '../../components/ui/LoadingAnimation';
import { STATIC_DOMAIN_CATALOGS } from '../../lib/catalog';
import { ensureStudentProfile } from '../../lib/studentProfileHelper';

export const StudentAcademicsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [markRows, setMarkRows] = useState<SubjectMarkEntry[]>([
    { subjectName: '', marksObtained: '' as any, semester: 'Semester 4' },
  ]);

  // Make sure profile exists on page mount
  useEffect(() => {
    ensureStudentProfile();
  }, []);

  // Fetch academic marks
  const { data: marks, isLoading } = useQuery({
    queryKey: ['studentMarks'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<SubjectMarkResponse[]>>('/students/marks');
        return res.data.data;
      } catch (err: any) {
        if (err.response?.status === 404 || err.response?.status === 400) {
          await ensureStudentProfile();
          return [];
        }
        throw err;
      }
    },
  });

  // Calculate live projected aggregate
  const projectedAggregate = useMemo(() => {
    const validMarks = markRows.filter(
      (r) =>
        r.marksObtained !== undefined &&
        r.marksObtained !== ('' as any) &&
        !isNaN(Number(r.marksObtained)) &&
        Number(r.marksObtained) >= 0 &&
        Number(r.marksObtained) <= 100
    );
    if (validMarks.length === 0) return 0;
    const total = validMarks.reduce((acc, curr) => acc + Number(curr.marksObtained), 0);
    return Math.round((total / validMarks.length) * 10) / 10;
  }, [markRows]);

  // Mutation to self-report marks
  const submitMarksMutation = useMutation({
    mutationFn: async (rows: SubjectMarkEntry[]) => {
      // 1. Ensure student profile exists in backend DB
      await ensureStudentProfile();

      const formattedRows = rows.map((r) => ({
        ...r,
        marksObtained: Number(r.marksObtained),
      }));
      const res = await apiClient.post<ApiResponse<SubjectMarkResponse[]>>(
        '/students/marks/self-report',
        { marks: formattedRows }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success(
        'Marks Submitted Successfully',
        'Academic records saved. Verification by faculty is now requested.'
      );
      queryClient.invalidateQueries({ queryKey: ['studentMarks'] });
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
      queryClient.invalidateQueries({ queryKey: ['studentMatches'] });
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
      queryClient.invalidateQueries({ queryKey: ['systemDiagnostics'] });
      setMarkRows([{ subjectName: '', marksObtained: '' as any, semester: 'Semester 4' }]);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to submit marks';
      toast.error('Submission Failed', msg);
    },
  });

  const handleAddRow = () => {
    setMarkRows((prev) => [
      ...prev,
      { subjectName: '', marksObtained: '' as any, semester: 'Semester 4' },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (markRows.length <= 1) {
      toast.info('Notice', 'At least one subject mark row is required');
      return;
    }
    setMarkRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof SubjectMarkEntry, value: any) => {
    setMarkRows((prev) =>
      prev.map((row, i) => {
        if (i === index) {
          if (field === 'marksObtained') {
            if (value === '') return { ...row, marksObtained: '' as any };
            const num = parseFloat(value);
            return { ...row, marksObtained: isNaN(num) ? ('' as any) : Math.min(100, Math.max(0, num)) };
          }
          return { ...row, [field]: value };
        }
        return row;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invalidRows = markRows.filter(
      (r) =>
        !r.subjectName.trim() ||
        r.marksObtained === ('' as any) ||
        isNaN(Number(r.marksObtained)) ||
        Number(r.marksObtained) < 0 ||
        Number(r.marksObtained) > 100
    );

    if (invalidRows.length > 0) {
      toast.error('Validation Error', 'Please ensure all subjects have valid names and marks between 0-100');
      return;
    }

    submitMarksMutation.mutate(markRows);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Academic Marks Ingestion & Audit Tracker
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Self-report semester course scores across any branch, batch, or curriculum and track official faculty audits
        </p>
      </div>

      {/* Dynamic Multi-Row Ingestion Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Self-Report Semester Subject Scores
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                1000+ catalog subjects supported or enter any custom course
              </p>
            </div>
          </div>

          {/* Real-Time Aggregate Preview Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 shrink-0">
            <Calculator className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <div className="text-xs">
              <span className="text-slate-500 dark:text-slate-400">Projected Batch Avg: </span>
              <strong className="text-brand-700 dark:text-brand-300 font-mono text-sm">
                {projectedAggregate.toFixed(1)}%
              </strong>
            </div>
          </div>
        </div>

        {/* Branch / Course Fast-Filter Selector */}
        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Layers className="w-4 h-4 text-brand-500" />
              <span>Select Engineering Domain / Course Filter:</span>
            </div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Free-form typing is always enabled for unlisted courses
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setSelectedBranch('ALL')}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${
                selectedBranch === 'ALL'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              All Domains (1000+ Subjects)
            </button>
            {STATIC_DOMAIN_CATALOGS.map((d) => (
              <button
                key={d.domainCode}
                type="button"
                onClick={() => setSelectedBranch(d.domainCode)}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  selectedBranch === d.domainCode
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {d.domainName.split(' ')[0]} ({d.domainCode})
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {markRows.map((row, idx) => (
              <div
                key={idx}
                className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              >
                {/* Subject Name Input with Multi-Domain Catalog Combobox */}
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Subject Name #{idx + 1}
                  </label>
                  <CatalogAutocomplete
                    type="subject"
                    value={row.subjectName}
                    onChange={(val) => handleRowChange(idx, 'subjectName', val)}
                    selectedDomain={selectedBranch}
                    placeholder="Search catalog or type custom course name..."
                    required
                  />
                </div>

                {/* Semester Selector */}
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Semester
                  </label>
                  <select
                    value={row.semester}
                    onChange={(e) => handleRowChange(idx, 'semester', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {SEMESTERS.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Score Input (0-100) */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Score (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={row.marksObtained}
                    onChange={(e) => handleRowChange(idx, 'marksObtained', e.target.value)}
                    placeholder="e.g. 85"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                {/* Remove Row Button */}
                <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Remove row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Another Subject Row
            </button>

            <button
              type="submit"
              disabled={submitMarksMutation.isPending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all"
            >
              {submitMarksMutation.isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Marks for Verification</span>
                </>
              )}
            </button>
          </div>
        </form>

        {submitMarksMutation.isPending && (
          <LoadingAnimation
            message="Saving Academic Scores..."
            subMessage="Transmitting marks to secure server and requesting faculty verification audit"
            variant="compact"
          />
        )}
      </div>

      {/* Official Academic Records Table */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Official Academic Mark Sheet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified scores are audited by university faculty with digital audit trails
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Total Records: {marks?.length || 0}
          </span>
        </div>

        {isLoading ? (
          <LoadingAnimation message="Retrieving Official Academic Records..." variant="card" />
        ) : !marks || marks.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-xs text-slate-500">No academic marks recorded yet. Self-report your course scores above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Subject Name</th>
                  <th className="py-3 px-3">Semester</th>
                  <th className="py-3 px-3">Self-Reported</th>
                  <th className="py-3 px-3">Verified Score</th>
                  <th className="py-3 px-3">Verification Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
                {marks.map((mark) => (
                  <tr key={mark.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {mark.subjectName}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      {mark.semester || 'Semester 4'}
                    </td>
                    <td className="py-3 px-3 font-mono font-medium">
                      {mark.selfReportedMarks?.toFixed(1) || '0.0'}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      {mark.verifiedMarks !== null ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {mark.verifiedMarks.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {mark.isVerified ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-semibold text-[11px] border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Officially Verified
                          </span>
                          <p className="text-[10px] text-slate-400">
                            By {mark.verifiedByTeacherName || 'Faculty Member'} ({mark.verifiedByTeacherId || 'FAC-100'})
                          </p>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-medium text-[11px] border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          Verification by Teacher is Required
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
