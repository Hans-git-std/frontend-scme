import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Search,
  Plus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Globe,
  MapPin,
  Sliders,
  PlusCircle,
  Eye,
  Edit3,
  Mail,
  ExternalLink,
  BookOpen,
  Code,
  Save,
  X,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import {
  ApiResponse,
  CompanyProfileResponse,
  CompanyRegisterRequest,
  CompanyVerificationStatus,
  CompanyStatusUpdateRequest,
  HiringCriteriaResponse,
  SkillProficiency,
} from '../../types';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { getVerificationStatusBadge, COMMON_SUBJECTS, COMMON_SKILLS } from '../../lib/utils';

interface CriteriaSkillRow {
  skillName: string;
  minProficiency: SkillProficiency;
  isMandatory: boolean;
  weightage: string | number;
}

interface CriteriaCutoffRow {
  subjectName: string;
  minMarksCutoff: string | number;
  isMandatory: boolean;
}

export const AdminCompaniesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CompanyVerificationStatus>('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusModalCompany, setStatusModalCompany] = useState<any | null>(null);
  const [inspectCompany, setInspectCompany] = useState<any | null>(null);
  const [editCompany, setEditCompany] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  // Criteria Management for Admin
  const [criteriaModalCompany, setCriteriaModalCompany] = useState<any | null>(null);
  const [editingCriteriaId, setEditingCriteriaId] = useState<number | null>(null);
  const [criteriaForm, setCriteriaForm] = useState({
    roleTitle: '',
    jobDescription: '',
    minOverallPercentage: '' as string | number,
    requiredSkills: [] as CriteriaSkillRow[],
    subjectCutoffs: [] as CriteriaCutoffRow[],
  });

  const [newStatus, setNewStatus] = useState<CompanyVerificationStatus>('VERIFIED');
  const [adminRemarks, setAdminRemarks] = useState('Manually verified by Master Admin');

  // Clean initial state for Direct Provisioning
  const [newCompany, setNewCompany] = useState<CompanyRegisterRequest>({
    companyName: '',
    email: '',
    industry: '',
    location: '',
    websiteUrl: '',
    description: '',
    logoUrl: '',
  });

  // Edit Company Profile Form State
  const [editFormData, setEditFormData] = useState({
    companyName: '',
    email: '',
    industry: '',
    location: '',
    websiteUrl: '',
    description: '',
    logoUrl: '',
  });

  // Main Data Query: Aggregates /admin/companies, /admin/companies/pending, /companies/public
  const { data: companies, isLoading } = useQuery({
    queryKey: ['adminCompanies'],
    queryFn: async () => {
      const companyMap = new Map<string | number, any>();

      const addItems = (raw: any) => {
        let list: any[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.data)) list = raw.data;
        else if (Array.isArray(raw?.data?.content)) list = raw.data.content;
        else if (Array.isArray(raw?.content)) list = raw.content;

        for (const item of list) {
          if (!item) continue;
          const key = item.id ?? item.companyId ?? item.email;
          if (key !== undefined && key !== null) {
            const existing = companyMap.get(key);
            companyMap.set(key, {
              ...existing,
              ...item,
              id: item.id ?? item.companyId ?? existing?.id,
              companyName: item.companyName || existing?.companyName || 'Corporate Partner',
              email: item.email || existing?.email || '',
              verificationStatus: item.verificationStatus || existing?.verificationStatus || 'NOT_VERIFIED',
              hiringCriteria: item.hiringCriteria || existing?.hiringCriteria || item.activeCriteria || [],
            });
          }
        }
      };

      // 1. Fetch /admin/companies
      try {
        const res = await apiClient.get<any>('/admin/companies');
        addItems(res.data);
      } catch (err) {
        console.warn('[AdminCompanies] /admin/companies error:', err);
      }

      // 2. Fetch /admin/companies/pending
      try {
        const resPending = await apiClient.get<any>('/admin/companies/pending');
        addItems(resPending.data);
      } catch (err) {
        console.warn('[AdminCompanies] /admin/companies/pending error:', err);
      }

      // 3. Fetch /companies/public
      try {
        const resPub = await apiClient.get<any>('/companies/public');
        addItems(resPub.data);
      } catch (err) {
        console.warn('[AdminCompanies] /companies/public error:', err);
      }

      return Array.from(companyMap.values());
    },
    refetchInterval: 10000,
  });

  // 1. Provision Company Mutation (POST /admin/companies)
  const createCompanyMutation = useMutation({
    mutationFn: async (payload: CompanyRegisterRequest) => {
      const res = await apiClient.post<ApiResponse<CompanyProfileResponse>>(
        '/admin/companies',
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Company Provisioned', 'Pre-verified corporate account created successfully');
      queryClient.invalidateQueries({ queryKey: ['adminCompanies'] });
      queryClient.invalidateQueries({ queryKey: ['systemDiagnostics'] });
      setIsCreateModalOpen(false);
      setNewCompany({
        companyName: '',
        email: '',
        industry: '',
        location: '',
        websiteUrl: '',
        description: '',
        logoUrl: '',
      });
    },
    onError: (err: any) => {
      toast.error('Creation Error', err.response?.data?.message || err.message);
    },
  });

  // 2. Update Company Profile Mutation (PUT /admin/companies/{companyId})
  const updateCompanyProfileMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await apiClient.put<ApiResponse<CompanyProfileResponse>>(
        `/admin/companies/${id}`,
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Profile Saved', 'Company details updated by administrator');
      setEditCompany(null);
      queryClient.invalidateQueries({ queryKey: ['adminCompanies'] });
    },
    onError: (err: any) => {
      toast.error('Update Error', err.response?.data?.message || err.message);
    },
  });

  // 3. Update Status Mutation (PATCH /admin/companies/{companyId}/status)
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: CompanyStatusUpdateRequest;
    }) => {
      try {
        const res = await apiClient.patch<ApiResponse<CompanyProfileResponse>>(
          `/admin/companies/${id}/status`,
          payload
        );
        return res.data;
      } catch (err: any) {
        if (err.response?.status === 405 || err.response?.status === 404) {
          const putRes = await apiClient.put<ApiResponse<CompanyProfileResponse>>(
            `/admin/companies/${id}/status`,
            payload
          );
          return putRes.data;
        }
        throw err;
      }
    },
    onSuccess: () => {
      toast.success('Status Updated', 'Company verification status modified');
      setStatusModalCompany(null);
      queryClient.invalidateQueries({ queryKey: ['adminCompanies'] });
      queryClient.invalidateQueries({ queryKey: ['systemDiagnostics'] });
    },
    onError: (err: any) => {
      toast.error('Update Error', err.response?.data?.message || err.message);
    },
  });

  // 4. Delete Company Mutation (DELETE /admin/companies/{companyId})
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete<ApiResponse<string>>(`/admin/companies/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Deleted', 'Company removed from platform');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['adminCompanies'] });
    },
    onError: (err: any) => {
      toast.error('Deletion Error', err.response?.data?.message || err.message);
    },
  });

  // 5. Admin Criteria Mutations
  const saveCriteriaMutation = useMutation({
    mutationFn: async ({ companyId, criteriaId, payload }: { companyId: number; criteriaId?: number; payload: any }) => {
      if (criteriaId) {
        return (await apiClient.put<ApiResponse<HiringCriteriaResponse>>(`/admin/companies/${companyId}/criteria/${criteriaId}`, payload)).data;
      } else {
        return (await apiClient.post<ApiResponse<HiringCriteriaResponse>>(`/admin/companies/${companyId}/criteria`, payload)).data;
      }
    },
    onSuccess: () => {
      toast.success('Criteria Saved', 'Job role hiring criteria saved successfully');
      setCriteriaModalCompany(null);
      setEditingCriteriaId(null);
      queryClient.invalidateQueries({ queryKey: ['adminCompanies'] });
    },
    onError: (err: any) => {
      toast.error('Criteria Error', err.response?.data?.message || err.message);
    },
  });

  const deleteCriteriaMutation = useMutation({
    mutationFn: async ({ companyId, criteriaId }: { companyId: number; criteriaId: number }) => {
      return (await apiClient.delete<ApiResponse<string>>(`/admin/companies/${companyId}/criteria/${criteriaId}`)).data;
    },
    onSuccess: () => {
      toast.success('Criteria Removed', 'Job criteria removed for company');
      queryClient.invalidateQueries({ queryKey: ['adminCompanies'] });
    },
    onError: (err: any) => {
      toast.error('Deletion Error', err.response?.data?.message || err.message);
    },
  });

  // Status Tab Counts
  const { verifiedCount, notVerifiedCount, rejectedCount } = useMemo(() => {
    if (!companies || !Array.isArray(companies)) {
      return { verifiedCount: 0, notVerifiedCount: 0, rejectedCount: 0 };
    }
    let verified = 0;
    let notVerified = 0;
    let rejected = 0;
    for (const c of companies) {
      if (c.verificationStatus === 'VERIFIED') verified++;
      else if (c.verificationStatus === 'REJECTED') rejected++;
      else notVerified++;
    }
    return { verifiedCount: verified, notVerifiedCount: notVerified, rejectedCount: rejected };
  }, [companies]);

  // Filter & Search
  const filteredCompanies = useMemo(() => {
    if (!companies || !Array.isArray(companies)) return [];
    const query = search.toLowerCase().trim();
    return companies.filter((c) => {
      if (!c) return false;
      const nameMatch = (c.companyName || '').toLowerCase().includes(query);
      const emailMatch = (c.email || '').toLowerCase().includes(query);
      const indMatch = (c.industry || '').toLowerCase().includes(query);
      const locMatch = (c.location || '').toLowerCase().includes(query);
      const matchesSearch = !query || nameMatch || emailMatch || indMatch || locMatch;
      const currentStatus = c.verificationStatus || 'NOT_VERIFIED';
      const matchesStatus = statusFilter === 'ALL' || currentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [companies, search, statusFilter]);

  // Form Handlers
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.companyName.trim() || !newCompany.email.trim()) {
      toast.error('Validation Error', 'Company Name and Email are mandatory');
      return;
    }
    let website = newCompany.websiteUrl?.trim();
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
    let logo = newCompany.logoUrl?.trim();
    if (logo && !/^https?:\/\//i.test(logo)) logo = `https://${logo}`;

    createCompanyMutation.mutate({
      companyName: newCompany.companyName.trim(),
      email: newCompany.email.trim(),
      industry: newCompany.industry?.trim() || undefined,
      location: newCompany.location?.trim() || undefined,
      websiteUrl: website || undefined,
      description: newCompany.description?.trim() || undefined,
      logoUrl: logo || undefined,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompany) return;
    const companyId = editCompany.id || editCompany.companyId;
    let website = editFormData.websiteUrl?.trim();
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
    let logo = editFormData.logoUrl?.trim();
    if (logo && !/^https?:\/\//i.test(logo)) logo = `https://${logo}`;

    updateCompanyProfileMutation.mutate({
      id: companyId,
      payload: {
        companyName: editFormData.companyName.trim() || 'Corporate Partner',
        industry: editFormData.industry?.trim() || undefined,
        location: editFormData.location?.trim() || undefined,
        websiteUrl: website || undefined,
        description: editFormData.description?.trim() || undefined,
        logoUrl: logo || undefined,
      },
    });
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalCompany) return;
    const companyId = statusModalCompany.id || statusModalCompany.companyId;
    updateStatusMutation.mutate({
      id: companyId,
      payload: { status: newStatus, adminRemarks },
    });
  };

  const handleCriteriaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!criteriaModalCompany) return;
    const companyId = criteriaModalCompany.id || criteriaModalCompany.companyId;
    const overallPct = parseFloat(String(criteriaForm.minOverallPercentage));
    if (isNaN(overallPct) || overallPct < 0 || overallPct > 100) {
      toast.error('Validation Error', 'Please specify a valid aggregate percentage between 0 and 100');
      return;
    }

    const payload = {
      roleTitle: criteriaForm.roleTitle.trim(),
      jobDescription: criteriaForm.jobDescription.trim(),
      minOverallPercentage: overallPct,
      requiredSkills: criteriaForm.requiredSkills.map((s) => ({
        skillName: s.skillName.trim(),
        minProficiency: s.minProficiency,
        isMandatory: s.isMandatory,
        weightage: parseFloat(String(s.weightage)) || 1.0,
      })),
      subjectCutoffs: criteriaForm.subjectCutoffs.map((c) => ({
        subjectName: c.subjectName.trim(),
        minMarksCutoff: parseFloat(String(c.minMarksCutoff)) || 0,
        isMandatory: c.isMandatory,
      })),
    };

    saveCriteriaMutation.mutate({
      companyId,
      criteriaId: editingCriteriaId || undefined,
      payload,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Corporate Hiring Partners Administration
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Verify employer accounts, edit full company profiles, provision directly, and manage job criteria
          </p>
        </div>

        <button
          onClick={() => {
            setNewCompany({
              companyName: '',
              email: '',
              industry: '',
              location: '',
              websiteUrl: '',
              description: '',
              logoUrl: '',
            });
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-sky-500/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Provision Company Directly</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name, email, industry, or location..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl shrink-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All ({companies?.length || 0})
          </button>
          <button
            onClick={() => setStatusFilter('VERIFIED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'VERIFIED'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Verified ({verifiedCount})
          </button>
          <button
            onClick={() => setStatusFilter('NOT_VERIFIED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'NOT_VERIFIED'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Not Verified ({notVerifiedCount})
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'REJECTED'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>
      </div>

      {/* Companies Table */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No company records found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No corporate accounts match your filter criteria or search keyword.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Company Name</th>
                  <th className="py-3 px-3">Recruiter Email</th>
                  <th className="py-3 px-3">Industry & Location</th>
                  <th className="py-3 px-3">Hiring Criteria</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
                {filteredCompanies.map((c) => {
                  const statusBadge = getVerificationStatusBadge(c.verificationStatus || 'NOT_VERIFIED');
                  const companyId = c.id || c.companyId;

                  return (
                    <tr key={companyId || c.email} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-extrabold text-slate-700 dark:text-slate-300 overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                            {c.logoUrl ? (
                              <img src={c.logoUrl} alt={c.companyName} className="w-full h-full object-cover" />
                            ) : (
                              (c.companyName || 'C').charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="font-bold">{c.companyName || 'Corporate Partner'}</p>
                            {c.websiteUrl && (
                              <a
                                href={c.websiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-sky-600 hover:underline flex items-center gap-0.5"
                              >
                                <span>{c.websiteUrl.replace(/^https?:\/\//i, '')}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {c.email}
                      </td>
                      <td className="py-3 px-3">
                        <p>{c.industry || 'General Industry'}</p>
                        <p className="text-[10px] text-slate-400">{c.location || 'Location Unset'}</p>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                        {c.hiringCriteria?.length || c.activeCriteriaCount || 0} Roles
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.verificationStatus !== 'VERIFIED' && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: companyId,
                                  payload: { status: 'VERIFIED', adminRemarks: 'Manually verified by Master Admin' },
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                              title="1-Click Verify and activate company"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verify</span>
                            </button>
                          )}
                          <button
                            onClick={() => setInspectCompany(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                            title="Inspect details & criteria"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Inspect
                          </button>
                          <button
                            onClick={() => {
                              setEditCompany(c);
                              setEditFormData({
                                companyName: c.companyName || '',
                                email: c.email || '',
                                industry: c.industry || '',
                                location: c.location || '',
                                websiteUrl: c.websiteUrl || '',
                                description: c.description || '',
                                logoUrl: c.logoUrl || '',
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800"
                            title="Edit full corporate details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setStatusModalCompany(c);
                              setNewStatus(c.verificationStatus || 'VERIFIED');
                              setAdminRemarks(c.adminRemarks || 'Manually verified by Master Admin');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 text-xs font-semibold border border-sky-200 dark:border-sky-800"
                            title="Update status"
                          >
                            Status
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Delete company"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Company Modal */}
      <Modal
        isOpen={!!inspectCompany}
        onClose={() => setInspectCompany(null)}
        title={inspectCompany?.companyName || 'Company Profile'}
        description={`Recruiter: ${inspectCompany?.email} • Status: ${inspectCompany?.verificationStatus || 'NOT_VERIFIED'}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-400">Industry:</span>
              <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{inspectCompany?.industry || 'Not configured'}</p>
            </div>
            <div>
              <span className="text-slate-400">Location:</span>
              <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{inspectCompany?.location || 'Not configured'}</p>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400">Website:</span>
              <p className="font-mono text-sky-600 mt-0.5">{inspectCompany?.websiteUrl || 'Not configured'}</p>
            </div>
            {inspectCompany?.description && (
              <div className="col-span-2">
                <span className="text-slate-400">Company Overview:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">{inspectCompany.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-sky-500" />
                Configured Job Roles & Criteria ({inspectCompany?.hiringCriteria?.length || 0})
              </h4>
              <button
                onClick={() => {
                  setCriteriaModalCompany(inspectCompany);
                  setEditingCriteriaId(null);
                  setCriteriaForm({
                    roleTitle: '',
                    jobDescription: '',
                    minOverallPercentage: '',
                    requiredSkills: [],
                    subjectCutoffs: [],
                  });
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold shadow-sm"
              >
                <Plus className="w-3 h-3" />
                <span>Add Job Role</span>
              </button>
            </div>

            {inspectCompany?.hiringCriteria && inspectCompany.hiringCriteria.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {inspectCompany.hiringCriteria.map((hc: HiringCriteriaResponse) => (
                  <div key={hc.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{hc.roleTitle}</span>
                        {hc.jobDescription && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{hc.jobDescription}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-lg border border-sky-200 text-xs">
                          Min {hc.minOverallPercentage}%
                        </span>
                        <button
                          onClick={() => {
                            const companyId = inspectCompany.id || inspectCompany.companyId;
                            deleteCriteriaMutation.mutate({ companyId, criteriaId: hc.id });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Delete role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {hc.requiredSkills && hc.requiredSkills.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Required Skills:</span>
                        <div className="flex flex-wrap gap-1">
                          {hc.requiredSkills.map((s: any) => (
                            <span
                              key={s.id || s.skillName}
                              className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                                s.isMandatory
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {s.skillName} ({s.minProficiency}) • Wt: {s.weightage || 1}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {hc.subjectCutoffs && hc.subjectCutoffs.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Subject Cutoffs:</span>
                        <div className="flex flex-wrap gap-1">
                          {hc.subjectCutoffs.map((sub: any) => (
                            <span
                              key={sub.id || sub.subjectName}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60"
                            >
                              {sub.subjectName} ≥ {sub.minMarksCutoff}%
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-xs italic py-2">No active job roles or criteria configured yet.</p>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setInspectCompany(null)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Company Profile Modal (Admin) */}
      <Modal
        isOpen={!!editCompany}
        onClose={() => setEditCompany(null)}
        title={`Edit Profile: ${editCompany?.companyName || 'Company'}`}
        description={`Update corporate credentials for ${editCompany?.email}`}
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                value={editFormData.companyName}
                onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Industry Sector
              </label>
              <input
                type="text"
                value={editFormData.industry}
                onChange={(e) => setEditFormData({ ...editFormData, industry: e.target.value })}
                placeholder="e.g. Software & Cloud"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location / Headquarters
              </label>
              <input
                type="text"
                value={editFormData.location}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                placeholder="e.g. San Francisco, CA"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Corporate Website URL
              </label>
              <input
                type="text"
                value={editFormData.websiteUrl}
                onChange={(e) => setEditFormData({ ...editFormData, websiteUrl: e.target.value })}
                placeholder="https://company.com"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Logo Image URL
            </label>
            <input
              type="text"
              value={editFormData.logoUrl}
              onChange={(e) => setEditFormData({ ...editFormData, logoUrl: e.target.value })}
              placeholder="https://company.com/logo.png"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company Description
            </label>
            <textarea
              rows={3}
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              placeholder="Technical environment, products, and hiring goals..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditCompany(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateCompanyProfileMutation.isPending}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={!!statusModalCompany}
        onClose={() => setStatusModalCompany(null)}
        title="Update Verification Status"
        description={`Set administrative verification status for ${statusModalCompany?.companyName}`}
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Verification Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as CompanyVerificationStatus)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            >
              <option value="VERIFIED">VERIFIED (Active on Public Directory & Matching)</option>
              <option value="NOT_VERIFIED">NOT_VERIFIED (Pending Review)</option>
              <option value="REJECTED">REJECTED (Disabled)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Administrative Remarks / Feedback
            </label>
            <textarea
              rows={2}
              value={adminRemarks}
              onChange={(e) => setAdminRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStatusModalCompany(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateStatusMutation.isPending}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md"
            >
              Save Status
            </button>
          </div>
        </form>
      </Modal>

      {/* Direct Provisioning Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Direct Company Provisioning"
        description="Create a pre-verified corporate account directly from Master Admin"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                value={newCompany.companyName}
                onChange={(e) => setNewCompany({ ...newCompany, companyName: e.target.value })}
                placeholder="e.g. Acme Corporation"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Recruiter Email *
              </label>
              <input
                type="email"
                value={newCompany.email}
                onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                placeholder="recruiter@acme.com"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Industry Sector
              </label>
              <input
                type="text"
                value={newCompany.industry}
                onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                placeholder="e.g. Software & Cloud"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location / Headquarters
              </label>
              <input
                type="text"
                value={newCompany.location}
                onChange={(e) => setNewCompany({ ...newCompany, location: e.target.value })}
                placeholder="e.g. San Francisco, CA"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Corporate Website URL
              </label>
              <input
                type="text"
                value={newCompany.websiteUrl}
                onChange={(e) => setNewCompany({ ...newCompany, websiteUrl: e.target.value })}
                placeholder="https://acme.com"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Logo Image URL
              </label>
              <input
                type="text"
                value={newCompany.logoUrl}
                onChange={(e) => setNewCompany({ ...newCompany, logoUrl: e.target.value })}
                placeholder="https://acme.com/logo.png"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company Description
            </label>
            <textarea
              rows={2}
              value={newCompany.description}
              onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
              placeholder="Enterprise overview, engineering focus..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            />
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
              disabled={createCompanyMutation.isPending}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md"
            >
              Provision Company
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin Criteria Builder Modal */}
      <Modal
        isOpen={!!criteriaModalCompany}
        onClose={() => setCriteriaModalCompany(null)}
        title={`Add Job Role & Criteria: ${criteriaModalCompany?.companyName || 'Company'}`}
        description="Configure required skills, weightages, and subject cutoff percentages"
        maxWidth="lg"
      >
        <form onSubmit={handleCriteriaSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Job Role Title *
              </label>
              <input
                type="text"
                value={criteriaForm.roleTitle}
                onChange={(e) => setCriteriaForm({ ...criteriaForm, roleTitle: e.target.value })}
                placeholder="e.g. Junior Software Engineer"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Min Overall Aggregate % *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={criteriaForm.minOverallPercentage}
                onChange={(e) => setCriteriaForm({ ...criteriaForm, minOverallPercentage: e.target.value })}
                placeholder="e.g. 70"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Role Description
            </label>
            <textarea
              rows={2}
              value={criteriaForm.jobDescription}
              onChange={(e) => setCriteriaForm({ ...criteriaForm, jobDescription: e.target.value })}
              placeholder="Candidate responsibilities and qualification criteria..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            />
          </div>

          {/* Technical Skills Section */}
          <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 dark:text-slate-200">Required Skills & Weightages</span>
              <button
                type="button"
                onClick={() =>
                  setCriteriaForm({
                    ...criteriaForm,
                    requiredSkills: [
                      ...criteriaForm.requiredSkills,
                      { skillName: 'Java', minProficiency: 'INTERMEDIATE', isMandatory: true, weightage: '' },
                    ],
                  })
                }
                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:underline"
              >
                <Plus className="w-3 h-3" /> Add Skill
              </button>
            </div>

            {criteriaForm.requiredSkills.map((s, idx) => (
              <div key={idx} className="flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  value={s.skillName}
                  onChange={(e) => {
                    const updated = [...criteriaForm.requiredSkills];
                    updated[idx].skillName = e.target.value;
                    setCriteriaForm({ ...criteriaForm, requiredSkills: updated });
                  }}
                  placeholder="Skill name"
                  className="flex-1 min-w-[120px] px-2 py-1.5 bg-white dark:bg-slate-800 border rounded-lg text-xs"
                  required
                />
                <select
                  value={s.minProficiency}
                  onChange={(e) => {
                    const updated = [...criteriaForm.requiredSkills];
                    updated[idx].minProficiency = e.target.value as SkillProficiency;
                    setCriteriaForm({ ...criteriaForm, requiredSkills: updated });
                  }}
                  className="px-2 py-1.5 bg-white dark:bg-slate-800 border rounded-lg text-xs"
                >
                  <option value="BEGINNER">BEGINNER</option>
                  <option value="INTERMEDIATE">INTERMEDIATE</option>
                  <option value="ADVANCED">ADVANCED</option>
                  <option value="EXPERT">EXPERT</option>
                </select>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={s.weightage}
                  onChange={(e) => {
                    const updated = [...criteriaForm.requiredSkills];
                    updated[idx].weightage = e.target.value;
                    setCriteriaForm({ ...criteriaForm, requiredSkills: updated });
                  }}
                  placeholder="Wt (1.0)"
                  className="w-16 px-2 py-1.5 bg-white dark:bg-slate-800 border rounded-lg text-xs font-mono text-center"
                />
                <label className="flex items-center gap-1 text-[11px]">
                  <input
                    type="checkbox"
                    checked={s.isMandatory}
                    onChange={(e) => {
                      const updated = [...criteriaForm.requiredSkills];
                      updated[idx].isMandatory = e.target.checked;
                      setCriteriaForm({ ...criteriaForm, requiredSkills: updated });
                    }}
                    className="rounded"
                  />
                  Mandatory
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const updated = criteriaForm.requiredSkills.filter((_, i) => i !== idx);
                    setCriteriaForm({ ...criteriaForm, requiredSkills: updated });
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Subject Cutoffs Section */}
          <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 dark:text-slate-200">Academic Subject Cutoffs (%)</span>
              <button
                type="button"
                onClick={() =>
                  setCriteriaForm({
                    ...criteriaForm,
                    subjectCutoffs: [
                      ...criteriaForm.subjectCutoffs,
                      { subjectName: 'Data Structures & Algorithms', minMarksCutoff: '', isMandatory: true },
                    ],
                  })
                }
                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:underline"
              >
                <Plus className="w-3 h-3" /> Add Cutoff
              </button>
            </div>

            {criteriaForm.subjectCutoffs.map((c, idx) => (
              <div key={idx} className="flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  value={c.subjectName}
                  onChange={(e) => {
                    const updated = [...criteriaForm.subjectCutoffs];
                    updated[idx].subjectName = e.target.value;
                    setCriteriaForm({ ...criteriaForm, subjectCutoffs: updated });
                  }}
                  placeholder="Subject name"
                  className="flex-1 min-w-[140px] px-2 py-1.5 bg-white dark:bg-slate-800 border rounded-lg text-xs"
                  required
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={c.minMarksCutoff}
                  onChange={(e) => {
                    const updated = [...criteriaForm.subjectCutoffs];
                    updated[idx].minMarksCutoff = e.target.value;
                    setCriteriaForm({ ...criteriaForm, subjectCutoffs: updated });
                  }}
                  placeholder="Min %"
                  className="w-20 px-2 py-1.5 bg-white dark:bg-slate-800 border rounded-lg text-xs font-mono text-center"
                  required
                />
                <label className="flex items-center gap-1 text-[11px]">
                  <input
                    type="checkbox"
                    checked={c.isMandatory}
                    onChange={(e) => {
                      const updated = [...criteriaForm.subjectCutoffs];
                      updated[idx].isMandatory = e.target.checked;
                      setCriteriaForm({ ...criteriaForm, subjectCutoffs: updated });
                    }}
                    className="rounded"
                  />
                  Mandatory
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const updated = criteriaForm.subjectCutoffs.filter((_, i) => i !== idx);
                    setCriteriaForm({ ...criteriaForm, subjectCutoffs: updated });
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCriteriaModalCompany(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveCriteriaMutation.isPending}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md"
            >
              Save Job Criteria
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Company Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Company Deletion"
        description={`Are you sure you want to delete ${deleteTarget?.companyName}?`}
      >
        <div className="space-y-4">
          <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900">
            ⚠️ This will remove the corporate profile, user account, and all attached hiring criteria from the AI matchmaking engine.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id || deleteTarget.companyId)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
            >
              Delete Company
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
