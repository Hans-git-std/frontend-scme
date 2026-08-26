import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Code,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import {
  ApiResponse,
  StudentProfileResponse,
  SkillProficiency,
} from '../../types';
import { getProficiencyBadge } from '../../lib/utils';
import { CatalogAutocomplete } from '../../components/ui/CatalogAutocomplete';
import { LoadingAnimation } from '../../components/ui/LoadingAnimation';
import { STATIC_DOMAIN_CATALOGS } from '../../lib/catalog';
import { ensureStudentProfile } from '../../lib/studentProfileHelper';

export const StudentSkillsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [skillName, setSkillName] = useState('');
  const [proficiency, setProficiency] = useState<SkillProficiency>('INTERMEDIATE');
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(1);
  const [activeDomainFilter, setActiveDomainFilter] = useState<string>('ALL');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['studentProfile'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<StudentProfileResponse>>('/students/profile');
        return res.data.data;
      } catch (err: any) {
        if (err.response?.status === 404 || err.response?.status === 400) {
          // Transparently provision initial student profile in the database
          const created = await ensureStudentProfile();
          if (created) return created;
        }
        throw err;
      }
    },
  });

  // Make sure profile exists on page mount
  useEffect(() => {
    ensureStudentProfile();
  }, []);

  const addSkillMutation = useMutation({
    mutationFn: async (payload: {
      skillName: string;
      proficiency: SkillProficiency;
      yearsOfExperience: number;
    }) => {
      // 1. Ensure student profile exists in backend DB first
      await ensureStudentProfile();

      // 2. Add or update skill
      const res = await apiClient.post<ApiResponse<string>>('/students/skills', payload);
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success('Skill Saved', `Recorded ${variables.skillName} (${variables.proficiency})`);
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
      queryClient.invalidateQueries({ queryKey: ['studentMatches'] });
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
      queryClient.invalidateQueries({ queryKey: ['systemDiagnostics'] });
      setSkillName('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to save skill';
      toast.error('Error Saving Skill', msg);
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiClient.delete<ApiResponse<string>>(`/students/skills/${encodeURIComponent(name)}`);
      return res.data;
    },
    onSuccess: (_, name) => {
      toast.success('Skill Removed', `${name} removed from your profile`);
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
      queryClient.invalidateQueries({ queryKey: ['studentMatches'] });
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
      queryClient.invalidateQueries({ queryKey: ['systemDiagnostics'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to remove skill';
      toast.error('Error Removing Skill', msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) {
      toast.error('Required', 'Please specify a skill name');
      return;
    }
    addSkillMutation.mutate({
      skillName: skillName.trim(),
      proficiency,
      yearsOfExperience,
    });
  };

  const proficiencyLevels: { id: SkillProficiency; label: string; desc: string }[] = [
    { id: 'BEGINNER', label: 'Beginner', desc: 'Basic conceptual understanding / academic projects' },
    { id: 'INTERMEDIATE', label: 'Intermediate', desc: 'Capable of writing production code with guidance' },
    { id: 'ADVANCED', label: 'Advanced', desc: 'Strong competence, design patterns & performance' },
    { id: 'EXPERT', label: 'Expert', desc: 'Deep architectural mastery & industry expertise' },
  ];

  // Current domain skills for quick chips
  const filteredQuickSkills = React.useMemo<string[]>(() => {
    if (activeDomainFilter === 'ALL') {
      return ['Java', 'Python', 'React', 'SolidWorks', 'AutoCAD', 'MATLAB', 'Docker', 'PyTorch', 'STAAD.Pro', 'Verilog', 'Aspen Plus', 'AWS'];
    }
    const found = STATIC_DOMAIN_CATALOGS.find((d) => d.domainCode === activeDomainFilter);
    return found ? found.skills.slice(0, 12) : [];
  }, [activeDomainFilter]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Technical Skillset & Multi-Domain Experience
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Match with employer criteria across Software, AI/ML, Mechanical CAD/FEA, Embedded VLSI, Civil, and Chemical disciplines
        </p>
      </div>

      {/* HansLearn 3D Callout */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-brand-50 via-sky-50 to-indigo-50 dark:from-brand-950/40 dark:via-sky-950/40 dark:to-indigo-950/40 border border-brand-200/80 dark:border-brand-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-800 dark:text-brand-300">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Improve Skills with Interactive 3D Simulators</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Use HansLearn to visualize algorithms, dynamic physical models, and complex circuits.
          </p>
        </div>
        <a
          href="https://hanslearn.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all shrink-0"
        >
          <span>Open HansLearn 3D</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Add / Update Skill Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Add or Upgrade Technical Skill
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The matching engine weights skills at 60% of the overall candidate fit score
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Skill / Technology Name *
              </label>
              <CatalogAutocomplete
                type="skill"
                value={skillName}
                onChange={setSkillName}
                placeholder="e.g. Java, Python, AutoCAD, SolidWorks, PyTorch, Verilog..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Years of Practical Experience
              </label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.5"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Quick Domain Filter Chips for Skills */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Explore suggestions by branch:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setActiveDomainFilter('ALL')}
                className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors ${
                  activeDomainFilter === 'ALL'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Top Universal
              </button>
              {STATIC_DOMAIN_CATALOGS.map((d) => (
                <button
                  key={d.domainCode}
                  type="button"
                  onClick={() => setActiveDomainFilter(d.domainCode)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors ${
                    activeDomainFilter === d.domainCode
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {d.domainCode}
                </button>
              ))}
            </div>

            {/* Quick Skill Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {filteredQuickSkills.map((s: string) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSkillName(s)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/40 transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* Proficiency Tier Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Proficiency Level *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {proficiencyLevels.map((lvl) => {
                const isSelected = proficiency === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setProficiency(lvl.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-500/10 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {lvl.label}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {lvl.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={addSkillMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
            >
              {addSkillMutation.isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Save Skill to Profile</span>
                </>
              )}
            </button>
          </div>
        </form>

        {addSkillMutation.isPending && (
          <LoadingAnimation
            message="Saving Skill Record..."
            subMessage="Updating candidate skill matrix and recalculating corporate compatibility scores"
            variant="compact"
          />
        )}
      </div>

      {/* Registered Skills Display */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Registered Skills ({profile?.skills?.length || 0})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active technical competencies attached to your candidate profile
            </p>
          </div>
        </div>

        {isLoading ? (
          <LoadingAnimation message="Retrieving Candidate Skill Profile..." variant="card" />
        ) : !profile?.skills || profile.skills.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Code className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-xs text-slate-500">No skills registered yet. Add your first technical skill above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {profile.skills.map((skill) => {
              const badge = getProficiencyBadge(skill.proficiency);
              return (
                <div
                  key={skill.id || skill.skillName}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-indigo-500/40 transition-all"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {skill.skillName}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${badge.className}`}>
                        {badge.label}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {skill.yearsOfExperience} yrs
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteSkillMutation.mutate(skill.skillName)}
                    disabled={deleteSkillMutation.isPending}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors opacity-70 group-hover:opacity-100"
                    title={`Delete ${skill.skillName}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
