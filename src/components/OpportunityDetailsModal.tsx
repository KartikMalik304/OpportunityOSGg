import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  AlertTriangle,
  ExternalLink,
  Bookmark,
  Calendar,
  BookOpen,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { EnrichedOpportunity } from '../types/opportunity.ts';

interface OpportunityDetailsModalProps {
  opportunity: EnrichedOpportunity;
  similarOpportunities: EnrichedOpportunity[];
  onClose: () => void;
  onSelectOpportunity: (opp: EnrichedOpportunity) => void;
  onToggleSave: (oppId: number, currentSaved: boolean) => Promise<void>;
  onTrackApplication: (oppId: number, status: string) => Promise<void>;
  onAddToCalendar: (opp: EnrichedOpportunity) => Promise<void>;
  onOpenRoadmap: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const OpportunityDetailsModal: React.FC<OpportunityDetailsModalProps> = ({
  opportunity,
  similarOpportunities,
  onClose,
  onSelectOpportunity,
  onToggleSave,
  onTrackApplication,
  onAddToCalendar,
  onOpenRoadmap,
  authFetch,
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<{
    whyApply: string;
    eligibilityPlainEnglish: string;
    preparationStrategy: string;
    skillGapActionPlan: string[];
  } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingAi(true);
    authFetch('/api/ai/explain-opportunity', {
      method: 'POST',
      body: JSON.stringify({
        opportunityTitle: opportunity.title,
        organizationName: opportunity.organization.name,
        category: opportunity.category,
        requiredSkills: opportunity.requiredSkills,
        matchedSkills: opportunity.matchedSkills,
        missingSkills: opportunity.missingSkills,
        eligibilityStatus: opportunity.eligibility.status,
        deadline: opportunity.deadline,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (active && data.whyApply) {
          setAiAnalysis(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingAi(false);
      });
    return () => {
      active = false;
    };
  }, [opportunity.id, authFetch]);

  const handleCalendarClick = async () => {
    await onAddToCalendar(opportunity);
    setCalendarAdded(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-3xl h-full overflow-y-auto bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-5 mb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {opportunity.organization.name}
              </span>
              <span aria-hidden="true">·</span>
              <span>{opportunity.category}</span>
              <span aria-hidden="true">·</span>
              <span>{opportunity.location}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-blue-600 dark:text-blue-400 font-semibold">
                {opportunity.matchScore}% Match
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {opportunity.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={opportunity.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onTrackApplication(opportunity.id, 'Applied')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap"
            >
              <span>
                Apply Directly on{' '}
                {(() => {
                  try {
                    return new URL(opportunity.applicationUrl).hostname.replace(/^www\./, '');
                  } catch {
                    return opportunity.organization.name;
                  }
                })()}
              </span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() =>
                onTrackApplication(
                  opportunity.id,
                  opportunity.applicationStatus ? opportunity.applicationStatus : 'Preparing'
                )
              }
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              {opportunity.applicationStatus
                ? `Tracked: ${opportunity.applicationStatus}`
                : 'Add to Application Tracker'}
            </button>

            <button
              onClick={() => onToggleSave(opportunity.id, opportunity.isSaved)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                opportunity.isSaved
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/10'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{opportunity.isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={handleCalendarClick}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{calendarAdded ? 'Added to Calendar ✓' : 'Add Deadline to Calendar'}</span>
            </button>
          </div>

          <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            Deadline: {opportunity.deadline} ({opportunity.daysRemaining}d left)
          </div>
        </div>

        {/* Overview & Key Metadata */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
            Overview
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            {opportunity.description}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs">
            <div>
              <p className="text-slate-500 dark:text-slate-400">Compensation</p>
              <p className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                {opportunity.stipend || opportunity.salary || 'Paid'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Duration</p>
              <p className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                {opportunity.duration}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Work Mode</p>
              <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                {opportunity.workMode}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Difficulty</p>
              <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                {opportunity.difficulty}
              </p>
            </div>
          </div>
        </div>

        {/* Automatic Eligibility Checker */}
        <div className="mb-8 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Automatic Eligibility Verification
            </h3>
            <span
              className={`text-xs font-mono font-semibold ${
                opportunity.eligibility.status === 'ELIGIBLE'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : opportunity.eligibility.status === 'PARTIALLY_ELIGIBLE'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {opportunity.eligibility.status === 'ELIGIBLE' && '✓ You are eligible'}
              {opportunity.eligibility.status === 'PARTIALLY_ELIGIBLE' && '⚠ Partially eligible'}
              {opportunity.eligibility.status === 'NOT_ELIGIBLE' && '✕ Not eligible'}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
            {opportunity.eligibility.explanation}
          </p>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800">
            {opportunity.eligibility.breakdown.map((item) => (
              <div
                key={item.criterion}
                className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {item.criterion}{' '}
                  {item.passed && !item.partial ? '✓' : item.partial ? '⚠' : '✕'}
                </span>
                <span
                  className={`font-mono ${
                    item.passed && !item.partial
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : item.partial
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {item.detail}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Gap Analysis & Roadmap Recommendation */}
        <div className="mb-8 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Skill Gap Analysis & Preparation Roadmap
            </h3>
            <button
              onClick={onOpenRoadmap}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Open Preparation Roadmap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                You already have ({opportunity.matchedSkills.length}):
              </p>
              {opportunity.matchedSkills.length > 0 ? (
                <ul className="space-y-1.5 font-mono text-emerald-600 dark:text-emerald-400">
                  {opportunity.matchedSkills.map((sk) => (
                    <li key={sk}>✓ {sk}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500">Foundational CS skills</p>
              )}
            </div>

            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                You should learn ({opportunity.missingSkills.length}):
              </p>
              {opportunity.missingSkills.length > 0 ? (
                <ul className="space-y-1.5 font-mono text-amber-600 dark:text-amber-400">
                  {opportunity.missingSkills.map((sk) => (
                    <li key={sk}>○ {sk}</li>
                  ))}
                </ul>
              ) : (
                <p className="font-mono text-emerald-600 dark:text-emerald-400">
                  ✓ 100% of required skills verified in your profile!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* AI Opportunity Explanation */}
        <div className="mb-8 p-5 rounded-xl border border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>AI Career Intelligence Analysis</span>
            </h3>
            {loadingAi && (
              <span className="text-xs font-mono text-slate-500">Synthesizing...</span>
            )}
          </div>
          {aiAnalysis ? (
            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white mb-0.5">
                  Why should I apply?
                </p>
                <p>{aiAnalysis.whyApply}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white mb-0.5">
                  Preparation Strategy:
                </p>
                <p>{aiAnalysis.preparationStrategy}</p>
              </div>
              {aiAnalysis.skillGapActionPlan?.length > 0 && (
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">
                    Recommended Next Steps:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    {aiAnalysis.skillGapActionPlan.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {opportunity.matchExplanation}
            </p>
          )}
        </div>

        {/* Benefits, Timeline & Application Process */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-2.5">
              Benefits & Perks
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              {opportunity.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-2.5">
              Timeline & Application Process
            </h4>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 mb-3">
              {opportunity.timeline.map((t, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span>{t.stage}</span>
                  <span className="font-mono tabular-nums">{t.date}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-[11px] text-slate-500">
              {opportunity.process.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Similar Opportunities */}
        {similarOpportunities.length > 0 && (
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-3">
              Students who saved this also viewed
            </h4>
            <div className="space-y-2">
              {similarOpportunities.slice(0, 3).map((sim) => (
                <button
                  key={sim.id}
                  onClick={() => onSelectOpportunity(sim)}
                  className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {sim.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {sim.organization.name} · {sim.category} · {sim.daysRemaining}d left
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                    {sim.matchScore}% Match
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
