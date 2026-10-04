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
