import React, { useState } from 'react';
import {
  X,
  Check,
  FileText,
  Upload,
  Sparkles,
  PlusCircle,
  Search,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { DashboardBundle, EnrichedOpportunity } from '../types/opportunity.ts';

interface QuickLogApplicationModalProps {
  opportunities: EnrichedOpportunity[];
  onClose: () => void;
  onSaveApplication: (payload: {
    opportunityId: number;
    status: string;
    appliedAt?: string;
    interviewDate?: string;
    resumeUsed?: string;
    referral?: string;
    notes?: string;
    nextAction?: string;
  }) => Promise<void>;
  onOpenKanban: () => void;
}

export const QuickLogApplicationModal: React.FC<QuickLogApplicationModalProps> = ({
  opportunities,
  onClose,
  onSaveApplication,
  onOpenKanban,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [searchFilter, setSearchFilter] = useState('');
  const [opportunityId, setOpportunityId] = useState<number>(
    opportunities[0]?.id || 1
  );
  const [status, setStatus] = useState<string>('Applied');
  const [appliedAt, setAppliedAt] = useState<string>(todayStr);
  const [interviewDate, setInterviewDate] = useState<string>('');
  const [resumeUsed, setResumeUsed] = useState<string>(
    'Software_Engineering_Resume_2027.pdf'
  );
  const [referral, setReferral] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [nextAction, setNextAction] = useState<string>(
    'Complete online coding assessment & review company tagged problems'
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const filteredOpps = opportunities.filter((o) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      o.title.toLowerCase().includes(q) ||
      o.organization.name.toLowerCase().includes(q) ||
      o.category.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveApplication({
        opportunityId: Number(opportunityId),
        status,
        appliedAt,
        interviewDate,
        resumeUsed,
        referral,
        notes,
        nextAction,
      });
      setSavedSuccess(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Log a New Application
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Application Logged to PostgreSQL (+35 XP)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your Dashboard metrics, 3-month application progress trends chart, and Kanban board have been updated.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenKanban();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Open Kanban Tracker</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-500 mb-1">
                Search & Select Opportunity
              </label>
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => {
                    setSearchFilter(e.target.value);
                    const first = opportunities.find(
                      (o) =>
                        o.title.toLowerCase().includes(e.target.value.toLowerCase()) ||
                        o.organization.name
                          .toLowerCase()
                          .includes(e.target.value.toLowerCase())
                    );
                    if (first) setOpportunityId(first.id);
                  }}
                  placeholder="Filter by company, role, or category..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                />
              </div>
              <select
                value={opportunityId}
                onChange={(e) => setOpportunityId(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {filteredOpps.slice(0, 60).map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.organization.name} — {opp.title} ({opp.matchScore}% Match)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-500 mb-1">
                  Application Stage
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {[
                    'Saved',
                    'Preparing',
                    'Applied',
                    'Assessment',
                    'Interview',
                    'Selected',
                    'Rejected',
                  ].map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-500 mb-1">
                  Date Logged / Applied
                </label>
                <input
                  type="date"
                  value={appliedAt}
                  onChange={(e) => setAppliedAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-500 mb-1">
                  Resume Version Used
                </label>
                <input
                  type="text"
                  value={resumeUsed}
                  onChange={(e) => setResumeUsed(e.target.value)}
                  placeholder="e.g. SWE_Internship_Resume.pdf"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-500 mb-1">
                  Referral / Contact (Optional)
                </label>
                <input
                  type="text"
                  value={referral}
                  onChange={(e) => setReferral(e.target.value)}
                  placeholder="e.g. Alumni referral or Direct portal"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-500 mb-1">
                Preparation Notes & Next Action
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Online assessment link, recruiter notes, or interview prep checklist..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-medium rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer"
              >
                {saving ? 'Logging Application...' : 'Save Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

interface QuickUploadResumeModalProps {
  bundle: DashboardBundle;
  onClose: () => void;
  onAnalyzeResume: (resumeText: string) => Promise<any>;
  onOpenProfile: () => void;
}

export const QuickUploadResumeModal: React.FC<QuickUploadResumeModalProps> = ({
  bundle,
  onClose,
  onAnalyzeResume,
  onOpenProfile,
}) => {
  const [resumeText, setResumeText] = useState(
    bundle.profile.resumeText ||
      `${bundle.user.name} — ${bundle.profile.degree} in ${bundle.profile.branch} (${bundle.profile.graduationYear}), CGPA ${bundle.profile.cgpa}
Technical Skills: Python, TypeScript, React, Next.js, Node.js, PostgreSQL, Docker, AWS, Git, Data Structures, Algorithms, Machine Learning.
Projects:
1. Distributed Task Queue & Telemetry Engine (Go, PostgreSQL, Docker)
2. Citation-Grounded AI Research Assistant (Python, PyTorch, Next.js)`
  );
  const [fileName, setFileName] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      if (content.trim()) {
        setResumeText(content.slice(0, 6000));
      }
    };
    reader.readAsText(file);
  };

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim()) return;
    setAnalyzing(true);
    try {
      const data = await onAnalyzeResume(resumeText);
      setResult(data);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Upload Resume & AI Skill Extractor
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleRunAnalysis} className="p-6 space-y-4 text-xs">
          {/* File Dropzone / Picker */}
          <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 transition-colors bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer">
            <Upload className="w-5 h-5 text-blue-500 mb-1.5" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {fileName
                ? `Loaded File: ${fileName}`
                : 'Click to upload resume file (.txt, .md, .json) or paste below'}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Automatically extracts technical skills and updates your PostgreSQL eligibility profile
            </span>
            <input
              type="file"
              accept=".txt,.md,.json,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <div>
            <label className="block font-medium text-slate-500 mb-1">
              Resume Content (Editable)
            </label>
            <textarea
              rows={5}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume skills, education, projects, and internship experience..."
              className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white font-mono text-xs"
            />
          </div>

          {result && (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ✓ Resume Parsed & Synced to Account
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {result.internshipReadinessPercent || 88}% Match Readiness
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                {result.summary}
              </p>
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Extracted Skills Added to Profile:{' '}
                </span>
                <span className="font-mono text-blue-600 dark:text-blue-400">
                  {(result.extractedSkills || []).join(' · ')}
                </span>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenProfile();
              }}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
            >
              Open Full Developer Profile →
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-medium rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={analyzing}
                className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {analyzing ? 'Extracting Skills & Updating Matches...' : 'Extract Skills & Update Matches'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

interface QuickSubmitOpportunityModalProps {
  initialCategory?: string;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onClose: () => void;
  onSuccess: (createdOpp: any) => Promise<void>;
}

const REAL_OPPORTUNITY_PRESETS = [
  {
    label: 'Hackathon: Devpost Global AI & Cloud Challenge',
    title: 'Global AI Agents & Cloud Native Hackathon 2026',
    organizationName: 'Google',
    category: 'Hackathon',
    location: 'Global Online',
    workMode: 'Remote',
    stipend: '$50,000 Prize Pool + Cloud Credits',
    duration: '48 Hours',
    applicationUrl: 'https://googlecloud.devpost.com/',
    requiredSkills: 'Python, TypeScript, React, Generative AI, GCP',
    description:
      'Build production-ready multi-modal AI agents and cloud-native web applications with official mentorship and direct prize awards on Devpost.',
  },
  {
    label: 'Internship: Stripe University SWE Intern',
    title: 'Stripe Software Engineering Summer Intern — Core Payments',
    organizationName: 'Stripe',
    category: 'Internship',
    location: 'Bengaluru / Remote',
    workMode: 'Remote',
    stipend: '₹1,40,000 / month',
    duration: '12 Weeks',
    applicationUrl: 'https://stripe.com/jobs/university',
    requiredSkills: 'TypeScript, React, Go, PostgreSQL, REST APIs',
    description:
      'Build programmable financial infrastructure, low-latency payment APIs, and merchant analytics systems with Stripe university engineering mentors.',
  },
  {
    label: 'Hackathon: ETHGlobal Web3 & AI Buildathon',
    title: 'ETHGlobal Autonomous Systems & Cryptography Hackathon',
    organizationName: 'ETHGlobal',
    category: 'Hackathon',
    location: 'Global Online',
    workMode: 'Remote',
    stipend: '$250,000 Prize Pool',
    duration: '36 Hours',
    applicationUrl: 'https://ethglobal.com/events',
    requiredSkills: 'TypeScript, Rust, Next.js, Node.js',
    description:
      'Global hackathon for student builders creating decentralized protocols, zero-knowledge proofs, and verifiable AI applications.',
  },
];

export const QuickSubmitOpportunityModal: React.FC<QuickSubmitOpportunityModalProps> = ({
  initialCategory = 'Hackathon',
  authFetch,
  onClose,
  onSuccess,
}) => {
  const defaultDeadline = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().split('T')[0];
  })();

  const [title, setTitle] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [category, setCategory] = useState(
    ['Internship', 'Hackathon', 'Scholarship', 'Open Source', 'Coding Contest', 'Research', 'Job'].includes(
      initialCategory
    )
      ? initialCategory
      : 'Hackathon'
  );
  const [applicationUrl, setApplicationUrl] = useState('');
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [location, setLocation] = useState('Remote (Global)');
  const [workMode, setWorkMode] = useState('Remote');
  const [stipend, setStipend] = useState('');
  const [duration, setDuration] = useState(initialCategory === 'Hackathon' ? '48 Hours' : '12 Weeks');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [beginnerFriendly, setBeginnerFriendly] = useState(true);
  const [requiredSkills, setRequiredSkills] = useState('Python, TypeScript, React, Git');
  const [gradYearMin, setGradYearMin] = useState(2025);
  const [gradYearMax, setGradYearMax] = useState(2030);
  const [degree, setDegree] = useState('B.Tech, B.E., M.Tech, B.Sc, MS');
  const [description, setDescription] = useState('');

  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publishedOpportunity, setPublishedOpportunity] = useState<any | null>(null);

  const handleLoadPreset = (preset: (typeof REAL_OPPORTUNITY_PRESETS)[0]) => {
    setTitle(preset.title);
    setOrganizationName(preset.organizationName);
    setCategory(preset.category);
    setLocation(preset.location);
    setWorkMode(preset.workMode);
    setStipend(preset.stipend);
    setDuration(preset.duration);
    setApplicationUrl(preset.applicationUrl);
    setRequiredSkills(preset.requiredSkills);
    setDescription(preset.description);
    setVerificationResult(null);
    setErrorMessage(null);
  };

  const handlePreVerifyWithAI = async () => {
    if (!title.trim() || !organizationName.trim() || !applicationUrl.trim()) {
      setErrorMessage('Please enter the Opportunity Title, Organization Name, and Official Application URL first.');
      return;
    }
    setVerifying(true);
    setErrorMessage(null);
    try {
      const res = await authFetch('/api/ai/verify-opportunity', {
        method: 'POST',
        body: JSON.stringify({
          title,
          organizationName,
          category,
          applicationUrl,
          deadline,
          location,
          workMode,
          stipend,
          description,
          requiredSkills: requiredSkills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      setVerificationResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to run AI verification check.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmitOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !organizationName.trim() || !applicationUrl.trim() || !deadline) {
      setErrorMessage('Title, Organization, Deadline, and Direct Application URL are required.');
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await authFetch('/api/opportunities', {
        method: 'POST',
        body: JSON.stringify({
          title,
          organizationName,
          category,
          location,
          workMode,
          remote: workMode === 'Remote',
          paid: true,
          stipend,
          duration,
          deadline,
          applicationUrl,
          difficulty,
          beginnerFriendly,
          description,
          requiredSkills: requiredSkills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          gradYearMin,
          gradYearMax,
          degree,
        }),
      });
      const data = await res.json();
      if (data.verification) {
        setVerificationResult(data.verification);
      }
      if (!res.ok) {
        setErrorMessage(
          data.error ||
            'AI Verification blocked this opportunity. Please check the URL and details below.'
        );
        return;
      }
      setPublishedOpportunity(data.opportunity || data);
      await onSuccess(data.opportunity || data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit opportunity.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Add Hackathon / Internship (AI Verified)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Every submission is verified by Gemini AI & live URL reachability before appearing in the feed.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {publishedOpportunity ? (
          <div className="p-6 space-y-5 text-xs">
            <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <Check className="w-5 h-5" />
                  <span>AI Verified & Published Live (+50 XP)</span>
                </div>
                {verificationResult?.confidenceScore && (
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {verificationResult.confidenceScore}% AI Confidence
                  </span>
                )}
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {verificationResult?.verificationSummary ||
                  `Your ${category} submission has been verified as authentic and added to the live OpportunityOS feed.`}
              </p>

              <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {publishedOpportunity.title || title}
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    {organizationName} · {category} · Deadline: {deadline}
                  </p>
                </div>
                <a
                  href={applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  <span>Test Direct Apply Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer"
              >
                Done & View in Feed
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitOpportunity} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
            {/* Quick Fill Real Presets */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
                Quick-fill a real opportunity template to test AI Verification, or enter your own below:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {REAL_OPPORTUNITY_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleLoadPreset(p)}
                    className="px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 font-medium cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Verification / Submission Notice</p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-500 mb-1">
                  Opportunity Type *
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (e.target.value === 'Hackathon') setDuration('48 Hours');
                    else if (e.target.value === 'Internship') setDuration('12 Weeks');
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="Hackathon">Hackathon</option>
                  <option value="Internship">Internship</option>
                  <option value="Scholarship">Scholarship</option>
                  <option value="Open Source">Open Source Program</option>
                  <option value="Coding Contest">Coding Contest</option>
                  <option value="Research">Research</option>
                  <option value="Job">Grad Job / Fellowship</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-500 mb-1">
                  Official Opportunity Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. ETHGlobal Autonomous Agents Hackathon or Stripe SWE Intern"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-500 mb-1">
                  Host Organization / Company *
                </label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g. Google, Microsoft, MLH, ETHGlobal, Stripe..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-500 mb-1">
                  Direct Official Apply / Registration URL *
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    required
                    value={applicationUrl}
                    onChange={(e) => setApplicationUrl(e.target.value)}
                    placeholder="https://careers.company.com/... or https://event.devpost.com"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-500 mb-1">
                  Application Deadline *
                </label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-500 mb-1">
                  Stipend / Prize Pool
                </label>
                <input
                  type="text"
                  value={stipend}
                  onChange={(e) => setStipend(e.target.value)}
                  placeholder="e.g. ₹1,00,000/mo or $25,000 Prizes"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-500 mb-1">
                  Work Mode & Location
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value)}
                    className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Bengaluru / Global"
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-500 mb-1">
                  Required Skills (Comma-Separated)
                </label>
                <input
                  type="text"
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  placeholder="Python, TypeScript, React, Next.js, Docker"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-500 mb-1">
                  Target Grad Cohort
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={gradYearMin}
                    onChange={(e) => setGradYearMin(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white font-mono"
                  />
                  <span>–</span>
                  <input
                    type="number"
                    value={gradYearMax}
                    onChange={(e) => setGradYearMax(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-500 mb-1">
                Opportunity Description & Application Instructions
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what students will build or work on, eligibility criteria, and official application steps..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
              />
            </div>

            {/* AI Verification Result Report Card */}
            {verificationResult && (
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  verificationResult.isValid
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-rose-500/40 bg-rose-500/5'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {verificationResult.isValid ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                    )}
                    <span
                      className={`font-bold text-xs ${
                        verificationResult.isValid
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {verificationResult.isValid
                        ? '✓ AI Verification Passed — Authentic Opportunity'
                        : '✕ AI Verification Rejected — Invalid or Unverified Opportunity'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                    Confidence: {verificationResult.confidenceScore}%
                  </span>
                </div>

                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {verificationResult.verificationSummary}
                </p>

                {Array.isArray(verificationResult.checks) && verificationResult.checks.length > 0 && (
                  <div className="divide-y divide-slate-200/70 dark:divide-slate-800/70 border-t border-slate-200/70 dark:border-slate-800/70 pt-1">
                    {verificationResult.checks.map((chk: any, idx: number) => (
                      <div key={idx} className="py-1.5 flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {chk.passed ? '✓' : '✕'} {chk.label}
                        </span>
                        <span
                          className={`font-mono truncate max-w-xs ${
                            chk.passed
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {chk.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {!verificationResult.isValid &&
                  Array.isArray(verificationResult.suggestedFixes) &&
                  verificationResult.suggestedFixes.length > 0 && (
                    <div className="pt-2 border-t border-rose-500/20 text-[11px] text-rose-600 dark:text-rose-300">
                      <p className="font-semibold mb-1">How to fix:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {verificationResult.suggestedFixes.map((fix: string, i: number) => (
                          <li key={i}>{fix}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                disabled={verifying || submitting}
                onClick={handlePreVerifyWithAI}
                className="px-3.5 py-2 font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/40 hover:bg-blue-500/10 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{verifying ? 'Verifying URL & Details with AI...' : 'Pre-Check Validity with AI'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 font-medium rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || verifying}
                  className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {submitting
                      ? 'Verifying with AI & Publishing...'
                      : `Verify with AI & Add ${category}`}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
