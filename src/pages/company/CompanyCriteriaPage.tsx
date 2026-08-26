import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sliders,
  Plus,
  Trash2,
  CheckCircle2,
  Code,
  BookOpen,
  Briefcase,
  Percent,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import {
  ApiResponse,
  HiringCriteriaResponse,
  HiringCriteriaRequest,
  RequiredSkillEntry,
  SubjectCutoffEntry,
} from '../../types';
import { CatalogAutocomplete } from '../../components/ui/CatalogAutocomplete';
import { LoadingAnimation } from '../../components/ui/LoadingAnimation';
import { Modal } from '../../components/ui/Modal';
import { STATIC_DOMAIN_CATALOGS } from '../../lib/catalog';

interface SkillFormRow {
  skillName: string;
  minProficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  weightage: number | string;
  isMandatory: boolean;
}

interface CutoffFormRow {
  subjectName: string;
  minMarksCutoff: number | string;
  isMandatory: boolean;
}

export const CompanyCriteriaPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [roleTitle, setRoleTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [minOverallPercentage, setMinOverallPercentage] = useState<number | string>(70.0);
  const [deleteTarget, setDeleteTarget] = useState<HiringCriteriaResponse | null>(null);

  const [skills, setSkills] = useState<SkillFormRow[]>([
    { skillName: '', minProficiency: 'INTERMEDIATE', weightage: 1, isMandatory: false },
  ]);

  const [cutoffs, setCutoffs] = useState<CutoffFormRow[]>([
    { subjectName: '', minMarksCutoff: '', isMandatory: false },
  ]);

  const { data: criteriaList, isLoading } = useQuery({
    queryKey: ['companyCriteria'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<HiringCriteriaResponse[]>>('/companies/criteria');
      return res.data.data;
    },
  });

  const createCriteriaMutation = useMutation({
    mutationFn: async (payload: HiringCriteriaRequest) => {
      const res = await apiClient.post<ApiResponse<HiringCriteriaResponse>>(
        '/companies/criteria',
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Hiring Criteria Saved', 'Recruitment criteria configured and activated in AI engine.');
      queryClient.invalidateQueries({ queryKey: ['companyCriteria'] });
      queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
      setIsFormOpen(false);
      setRoleTitle('');
      setJobDescription('');
      setMinOverallPercentage(70.0);
      setSkills([{ skillName: '', minProficiency: 'INTERMEDIATE', weightage: 1, isMandatory: false }]);
      setCutoffs([{ subjectName: '', minMarksCutoff: '', isMandatory: false }]);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to save criteria';
      toast.error('Error', msg);
    },
  });

  const deleteCriteriaMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete<ApiResponse<string>>(`/companies/criteria/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Criteria Removed', 'Recruitment criteria profile has been removed.');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['companyCriteria'] });
      queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to remove criteria';
      toast.error('Removal Error', msg);
    },
  });

  const handleAddSkillRow = () => {
    setSkills([
      ...skills,
      { skillName: '', minProficiency: 'BEGINNER', weightage: 1, isMandatory: false },
    ]);
  };

  const handleRemoveSkillRow = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSkillChange = (index: number, field: keyof SkillFormRow, value: any) => {
    setSkills(
      skills.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleAddCutoffRow = () => {
    setCutoffs([
      ...cutoffs,
      { subjectName: '', minMarksCutoff: '', isMandatory: false },
    ]);
  };

  const handleRemoveCutoffRow = (index: number) => {
    setCutoffs(cutoffs.filter((_, i) => i !== index));
  };

  const handleCutoffChange = (index: number, field: keyof CutoffFormRow, value: any) => {
    setCutoffs(
      cutoffs.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTitle.trim()) {
      toast.error('Validation Error', 'Please enter a job role title');
      return;
    }

    const minOverall = Number(minOverallPercentage);
    if (minOverallPercentage === '' || isNaN(minOverall) || minOverall < 0 || minOverall > 100) {
      toast.error('Validation Error', 'Please enter a valid aggregate percentage between 0% and 100%');
      return;
    }

    const validSkills: RequiredSkillEntry[] = [];
    for (const s of skills) {
      if (s.skillName.trim()) {
        const wt = s.weightage === '' ? 1 : Number(s.weightage);
        if (isNaN(wt) || wt <= 0) {
          toast.error('Validation Error', `Invalid weight for skill "${s.skillName}"`);
          return;
        }
        validSkills.push({
          skillName: s.skillName.trim(),
          minProficiency: s.minProficiency,
          weightage: wt,
          isMandatory: !!s.isMandatory,
        });
      }
    }

    const validCutoffs: SubjectCutoffEntry[] = [];
    for (const c of cutoffs) {
      if (c.subjectName.trim()) {
        if (c.minMarksCutoff === '' || isNaN(Number(c.minMarksCutoff))) {
          toast.error('Validation Error', `Subject cutoff % for "${c.subjectName}" is mandatory. Please enter a valid percentage.`);
          return;
        }
        const cutoffVal = Number(c.minMarksCutoff);
        if (cutoffVal < 0 || cutoffVal > 100) {
          toast.error('Validation Error', `Cutoff for "${c.subjectName}" must be between 0% and 100%`);
          return;
        }
        validCutoffs.push({
          subjectName: c.subjectName.trim(),
          minMarksCutoff: cutoffVal,
          isMandatory: !!c.isMandatory,
        });
      }
    }

    createCriteriaMutation.mutate({
      roleTitle: roleTitle.trim(),
      jobDescription: jobDescription.trim() || undefined,
      minOverallPercentage: minOverall,
      requiredSkills: validSkills,
      subjectCutoffs: validCutoffs,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Hiring Criteria & Matching Rules
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Define multi-domain technical skills, mandatory qualifications, and academic subject cutoffs across 1000+ disciplines
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-sky-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isFormOpen ? 'Close Criteria Builder' : 'Create New Job Criteria'}</span>
        </button>
      </div>

      {/* Interactive Criteria Builder Form */}
      {isFormOpen && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border-sky-200 dark:border-sky-900/50 animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Configure Multi-Domain Recruitment Criteria
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select from standard catalog suggestions or type any custom engineering skill / course
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 text-sky-500" />
              <span>Supports all branches & specializations</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Job Role / Position Title *
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g. Mechanical Design Engineer, Full Stack Dev, VLSI Engineer..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Minimum Overall Aggregate % *
                </label>
                <div className="relative">
                  <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={minOverallPercentage}
                    onChange={(e) => setMinOverallPercentage(e.target.value)}
                    onFocus={(e) => {
                      if (e.target.value === '0') setMinOverallPercentage('');
                    }}
                    placeholder="e.g. 70"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Job Description & Qualifications
              </label>
              <textarea
                rows={2}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Overview of day-to-day responsibilities, requirements, and tech stack..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Required Skills Matrix */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-indigo-500" />
                  Required Technical Skills & Weightages (60% Match Weight)
                </label>
                <button
                  type="button"
                  onClick={handleAddSkillRow}
                  className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Skill
                </button>
              </div>

              <div className="space-y-2">
                {skills.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    <div className="sm:col-span-4">
                      <CatalogAutocomplete
                        type="skill"
                        value={s.skillName}
                        onChange={(val) => handleSkillChange(idx, 'skillName', val)}
                        placeholder="Search skill or type custom..."
                        required
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <select
                        value={s.minProficiency}
                        onChange={(e) => handleSkillChange(idx, 'minProficiency', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="BEGINNER">Beginner</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="ADVANCED">Advanced</option>
                        <option value="EXPERT">Expert</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">Wt:</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        step="0.5"
                        value={s.weightage}
                        onChange={(e) => handleSkillChange(idx, 'weightage', e.target.value)}
                        onFocus={(e) => {
                          if (e.target.value === '1') handleSkillChange(idx, 'weightage', '');
                        }}
                        placeholder="1"
                        className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={s.isMandatory}
                          onChange={(e) => handleSkillChange(idx, 'isMandatory', e.target.checked)}
                          className="w-4 h-4 text-sky-600 rounded"
                        />
                        <span>Mandatory</span>
                      </label>
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveSkillRow(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject Cutoffs Matrix */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-500" />
                  Academic Subject Cutoffs (40% Match Weight)
                </label>
                <button
                  type="button"
                  onClick={handleAddCutoffRow}
                  className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Subject Cutoff
                </button>
              </div>

              <div className="space-y-2">
                {cutoffs.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    <div className="sm:col-span-6">
                      <CatalogAutocomplete
                        type="subject"
                        value={c.subjectName}
                        onChange={(val) => handleCutoffChange(idx, 'subjectName', val)}
                        placeholder="Search 1000+ courses or enter custom..."
                        required
                      />
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">Min %:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={c.minMarksCutoff}
                        onChange={(e) => handleCutoffChange(idx, 'minMarksCutoff', e.target.value)}
                        onFocus={(e) => {
                          if (e.target.value === '0') handleCutoffChange(idx, 'minMarksCutoff', '');
                        }}
                        placeholder="e.g. 70"
                        className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={c.isMandatory}
                          onChange={(e) => handleCutoffChange(idx, 'isMandatory', e.target.checked)}
                          className="w-4 h-4 text-sky-600 rounded"
                        />
                        <span>Strict Cutoff</span>
                      </label>
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveCutoffRow(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createCriteriaMutation.isPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-sky-500/20 disabled:opacity-50 transition-all"
              >
                {createCriteriaMutation.isPending ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save & Publish Criteria</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {createCriteriaMutation.isPending && (
            <LoadingAnimation
              message="Activating Criteria..."
              subMessage="Distributing requirements to matching algorithm across verified student profiles"
              variant="compact"
            />
          )}
        </div>
      )}

      {/* Active Criteria Display */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Published Criteria Profiles ({criteriaList?.length || 0})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Actively evaluated against student profiles across the university
            </p>
          </div>
        </div>

        {isLoading ? (
          <LoadingAnimation message="Retrieving Corporate Criteria..." variant="card" />
        ) : !criteriaList || criteriaList.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Sliders className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-xs text-slate-500">No criteria defined yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criteriaList.map((crit) => (
              <div
                key={crit.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 hover:border-sky-500/40 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {crit.roleTitle}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {crit.jobDescription || 'Standard engineering candidate profile.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                      Min {crit.minOverallPercentage}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(crit)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Remove / Deactivate Criteria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Skills ({crit.requiredSkills?.length || 0}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {crit.requiredSkills?.map((s) => (
                      <span
                        key={s.id}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 ${
                          s.isMandatory
                            ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 font-bold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {s.skillName} ({s.minProficiency})
                        {s.isMandatory && <span className="text-[10px] text-rose-500">*Mandatory</span>}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cutoffs */}
                {crit.subjectCutoffs && crit.subjectCutoffs.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Subject Cutoffs ({crit.subjectCutoffs.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {crit.subjectCutoffs.map((c) => (
                        <span
                          key={c.id}
                          className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"
                        >
                          {c.subjectName} ≥ {c.minMarksCutoff}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Remove Criteria Confirmation Modal */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Remove Hiring Criteria"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Are you sure you want to remove the criteria for role <strong>"{deleteTarget.roleTitle}"</strong>?
            </p>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300">
              ⚠️ Students will no longer be evaluated or matched against this criteria profile in the AI placement engine.
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteCriteriaMutation.mutate(deleteTarget.id)}
                disabled={deleteCriteriaMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-md disabled:opacity-50"
              >
                {deleteCriteriaMutation.isPending ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
