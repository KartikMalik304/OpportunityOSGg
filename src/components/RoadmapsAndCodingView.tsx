import React, { useState } from 'react';
import {
  Check,
  Sparkles,
  RefreshCw,
  ExternalLink,
  GitBranch,
  Code2,
  Award,
  FileText,
  Share2,
  Copy,
  Trophy,
  Plus,
} from 'lucide-react';
import {
  DashboardBundle,
  EnrichedOpportunity,
  RoadmapItem,
} from '../types/opportunity.ts';

interface RoadmapsViewProps {
  roadmaps: RoadmapItem[];
  opportunities: EnrichedOpportunity[];
  onUpdateStep: (roadmapId: number, stepId: number, status: string) => Promise<void>;
  onGenerateAiRoadmap: (goalPrompt: string) => Promise<void>;
  onSelectOpportunity: (opp: EnrichedOpportunity) => void;
}

export const RoadmapsView: React.FC<RoadmapsViewProps> = ({
  roadmaps,
  opportunities,
  onUpdateStep,
  onGenerateAiRoadmap,
  onSelectOpportunity,
}) => {
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<number>(
    roadmaps[0]?.id || 1
  );
  const [aiGoalPrompt, setAiGoalPrompt] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [updatingStepId, setUpdatingStepId] = useState<number | null>(null);

  const activeRoadmap =
    roadmaps.find((r) => r.id === selectedRoadmapId) || roadmaps[0];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiGoalPrompt.trim()) return;
    setGeneratingAi(true);
    try {
      await onGenerateAiRoadmap(aiGoalPrompt.trim());
      setAiGoalPrompt('');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleStepClick = async (stepId: number, nextStatus: string) => {
    if (!activeRoadmap) return;
    setUpdatingStepId(stepId);
    try {
      await onUpdateStep(activeRoadmap.id, stepId, nextStatus);
    } finally {
      setUpdatingStepId(null);
    }
  };

  const relatedOpportunities = opportunities
    .filter((o) => {
      if (!activeRoadmap) return false;
      const cat = activeRoadmap.category.toLowerCase();
      return (
        o.category.toLowerCase().includes(cat) ||
        cat.includes(o.category.toLowerCase()) ||
        activeRoadmap.steps.some((st) =>
          o.requiredSkills.some((sk) => sk.toLowerCase() === st.skillName.toLowerCase())
        )
      );
    })
    .slice(0, 4);

  return (
    <div className="space-y-8">
      {/* AI Roadmap Generator Bar */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>AI Career Roadmap Generator</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter any target role or program (e.g. “I want to become a backend systems engineer” or “Prepare for Rust GSoC”) to generate a custom step-by-step curriculum.
            </p>
          </div>
        </div>
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={aiGoalPrompt}
            onChange={(e) => setAiGoalPrompt(e.target.value)}
            placeholder="e.g., I want to become a distributed backend & Go engineer..."
            className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={generatingAi || !aiGoalPrompt.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            {generatingAi ? 'Generating Roadmap...' : 'Generate AI Roadmap'}
          </button>
        </form>
      </div>

      {/* Roadmap Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        {roadmaps.map((rm) => {
          const isSelected = rm.id === activeRoadmap?.id;
          return (
            <button
              key={rm.id}
              onClick={() => setSelectedRoadmapId(rm.id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400'
              }`}
            >
              <span>{rm.title}</span>
              <span className="font-mono tabular-nums opacity-85">
                {rm.progressPercent}%
              </span>
            </button>
          );
        })}
      </div>

      {activeRoadmap && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 8 Cols: Steps */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeRoadmap.title}
                </h3>
                <span className="text-xs font-mono tabular-nums text-blue-600 dark:text-blue-400 font-semibold">
                  {activeRoadmap.completedCount}/{activeRoadmap.totalSteps} Completed ({activeRoadmap.progressPercent}%)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                {activeRoadmap.description}
              </p>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-2">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${activeRoadmap.progressPercent}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <span>Category: {activeRoadmap.category}</span>
                <span aria-hidden="true">·</span>
                <span>Estimated: {activeRoadmap.estimatedWeeks} Weeks</span>
                <span aria-hidden="true">·</span>
                <span>Difficulty: {activeRoadmap.difficulty}</span>
              </div>
            </div>

            {activeRoadmap.steps.map((step) => {
              const isBusy = updatingStepId === step.id;
              return (
                <div
                  key={step.id}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {step.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                        <span>Skill Unlock: {step.skillName || 'Core Engineering'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{step.estimatedHours} hrs est.</span>
                      </div>
                    </div>

                    {/* Interactive Status Segmented Control */}
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      {(['Not started', 'In progress', 'Completed'] as const).map((st) => {
                        const active = step.status === st;
                        return (
                          <button
                            key={st}
                            disabled={isBusy}
                            onClick={() => handleStepClick(step.id, st)}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                              active
                                ? st === 'Completed'
                                  ? 'bg-emerald-600 text-white'
                                  : st === 'In progress'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    {step.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200/70 dark:border-slate-800/70 text-xs">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        Resources
                      </p>
                      <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                        {step.resources.map((r, idx) => (
                          <li key={idx}>· {r}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        Milestone Projects
                      </p>
                      <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                        {step.projects.map((p, idx) => (
                          <li key={idx}>· {p}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        Practice Problems
                      </p>
                      <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                        {step.problems.map((pr, idx) => (
                          <li key={idx}>· {pr}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right 4 Cols: Recommended Opportunities for this Roadmap */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                Opportunities Unlocked by This Roadmap
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Completing steps in {activeRoadmap.title} directly increases your match score for these roles:
              </p>
              <div className="space-y-2.5">
                {relatedOpportunities.map((opp) => (
                  <button
                    key={opp.id}
                    onClick={() => onSelectOpportunity(opp)}
                    className="w-full text-left p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {opp.title}
                      </p>
                      <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                        {opp.matchScore}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {opp.organization.name} · {opp.category} · {opp.daysRemaining}d left
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface CodingAggregatorProps {
  bundle: DashboardBundle;
  onConnectPlatform: (platform: string, username: string) => Promise<void>;
  onSelectOpportunity: (opp: EnrichedOpportunity) => void;
}

export const CodingAggregatorView: React.FC<CodingAggregatorProps> = ({
  bundle,
  onConnectPlatform,
  onSelectOpportunity,
}) => {
  const [platformInput, setPlatformInput] = useState('GitHub');
  const [usernameInput, setUsernameInput] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    setSyncing(true);
    setSyncStatusMsg(null);
    try {
      await onConnectPlatform(platformInput, usernameInput.trim());
      setSyncStatusMsg(`Synced ${platformInput} profile (@${usernameInput.trim()}) and updated skill recommendations.`);
      setUsernameInput('');
    } finally {
      setSyncing(false);
    }
  };

  const ghProfile = bundle.codingProfiles.find((c) => c.platform === 'GitHub');
  const ghSkills = ghProfile?.topLanguages || ['TypeScript', 'Python', 'Go'];

  const githubMatchedOpps = bundle.opportunities
    .filter((o) =>
      o.requiredSkills.some((sk) =>
        ghSkills.map((g) => g.toLowerCase()).includes(sk.toLowerCase())
      )
    )
    .slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Unified Opportunity Readiness Score Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
          <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mb-1">
            Unified Developer Score
          </p>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-4xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {bundle.readiness.overall}/100
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Opportunity Readiness Score
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Aggregated across GitHub repositories, open-source pull requests, competitive coding ratings, and roadmap consistency.
          </p>

          <div className="space-y-2.5 text-xs">
            {[
              { label: 'Coding', value: bundle.readiness.breakdown.coding },
              { label: 'Projects', value: bundle.readiness.breakdown.projects },
              { label: 'Open Source', value: bundle.readiness.breakdown.openSource },
              { label: 'Problem Solving', value: bundle.readiness.breakdown.problemSolving },
              { label: 'Consistency', value: bundle.readiness.breakdown.consistency },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                    {item.value}/100
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connect / Sync Platform Form & GitHub-Based Recommendations */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              Connect & Sync Coding Platforms
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              GitHub and Codeforces fetch live public API metrics. Other platforms sync structured developer stats through our unified adapter.
            </p>
            <form onSubmit={handleConnect} className="flex flex-col sm:flex-row gap-2.5">
              <select
                value={platformInput}
                onChange={(e) => setPlatformInput(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="GitHub">GitHub (Live REST API)</option>
                <option value="Codeforces">Codeforces (Live API)</option>
                <option value="LeetCode">LeetCode</option>
                <option value="HackerRank">HackerRank</option>
                <option value="CodeChef">CodeChef</option>
                <option value="AtCoder">AtCoder</option>
              </select>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter username (e.g. torvalds, tourist, alexverma)..."
                className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={syncing || !usernameInput.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync Profile'}</span>
              </button>
            </form>
            {syncStatusMsg && (
              <p className="mt-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                {syncStatusMsg}
              </p>
            )}
          </div>

          {/* GitHub Driven Recommendations Banner */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
            <p className="text-xs font-semibold text-slate-900 dark:text-white mb-1">
              GitHub Activity Recommendations: Strong {ghSkills.slice(0, 3).join(', ')} Activity
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Matched opportunities based on your repository languages and open-source commits:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {githubMatchedOpps.map((opp) => (
                <button
                  key={opp.id}
                  onClick={() => onSelectOpportunity(opp)}
                  className="text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {opp.title}
                    </p>
                    <span className="text-xs font-mono text-blue-600 dark:text-blue-400 shrink-0">
                      {opp.matchScore}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {opp.organization.name} · {opp.category} · {opp.daysRemaining}d left
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Platform Profile Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bundle.codingProfiles.map((cp) => (
          <div
            key={cp.id}
            className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-baseline justify-between gap-2 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {cp.platform}
                  </h4>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    @{cp.username} · {cp.rankTitle}
                  </p>
                </div>
                <a
                  href={cp.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {cp.platform === 'GitHub' ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3 font-mono tabular-nums">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Repositories</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {cp.repositories}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Contributions</span>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {cp.contributions}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Total Stars</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {cp.stars}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Followers / PRs</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {cp.followers} / {cp.extraData?.pullRequests || 38}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Languages: {cp.topLanguages.join(' · ')}
                  </p>
                  {Array.isArray(cp.extraData?.topRepos) && cp.extraData.topRepos.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/70 space-y-1.5">
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Top Repositories:
                      </p>
                      {cp.extraData.topRepos.slice(0, 2).map((repo: any) => (
                        <div key={repo.name} className="text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {repo.name}
                          </span>{' '}
                          ({repo.language} · ★ {repo.stars})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3 font-mono tabular-nums">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Current Rating</span>
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {cp.rating} (Max {cp.maxRating})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Problems Solved</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {cp.problemsSolved}
                      </span>
                    </div>
                  </div>
                  {(cp.easySolved > 0 || cp.mediumSolved > 0) && (
                    <p className="font-mono tabular-nums text-[11px] text-slate-500 dark:text-slate-400">
                      Breakdown: Easy {cp.easySolved} · Med {cp.mediumSolved} · Hard {cp.hardSolved}
                    </p>
                  )}
                  <p className="text-slate-500 dark:text-slate-400">
                    Achievements: {cp.badges.join(' · ')}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 mt-4 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{cp.isLiveApi ? 'Live API Verified' : 'Platform Adapter Synced'}</span>
              <span>Synced</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface DeveloperProfileViewProps {
  bundle: DashboardBundle;
  onOpenOnboarding: () => void;
  onAnalyzeResume: (resumeText: string) => Promise<any>;
  onSaveProfile: (payload: Record<string, any>) => Promise<void>;
}

export const DeveloperProfileView: React.FC<DeveloperProfileViewProps> = ({
  bundle,
  onOpenOnboarding,
  onAnalyzeResume,
  onSaveProfile,
}) => {
  const [resumeInput, setResumeInput] = useState(
    bundle.profile.resumeText ||
      `${bundle.user.name}\n${bundle.profile.degree} in ${bundle.profile.branch}, ${bundle.profile.college} (Class of ${bundle.profile.graduationYear}, CGPA: ${bundle.profile.cgpa})\nSkills: Python, TypeScript, React, Next.js, Node.js, PostgreSQL, Docker, Go, C++, Data Structures, Algorithms\nExperience & Projects:\n- Built Chronos Distributed Task Scheduler in Go, PostgreSQL, and Redis handling 10k jobs/min.\n- Developed Semantic Scholar RAG pipeline in Python and PyTorch.\n- Merged 6 open-source pull requests to Cloud Native & Next.js ecosystems.`
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [resumeResult, setResumeResult] = useState<any | null>(null);
  const [copiedPublicUrl, setCopiedPublicUrl] = useState(false);
  const [showPublicPreview, setShowPublicPreview] = useState(false);

  const publicProfileUrl = `${window.location.origin}/u/${bundle.user.username}`;

  const handleResumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeInput.trim()) return;
    setAnalyzing(true);
    try {
      const res = await onAnalyzeResume(resumeInput);
      setResumeResult(res);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setResumeInput(reader.result);
      }
    };
    reader.readAsText(file);
  };

  const handleCopyUrl = () => {
    navigator.clipboard?.writeText(publicProfileUrl);
    setCopiedPublicUrl(true);
    setTimeout(() => setCopiedPublicUrl(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Top Developer Identity Header */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {bundle.user.name}
            </h2>
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400">
              @{bundle.user.username}
            </span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
              {bundle.user.points} XP · {bundle.user.streakDays}d Streak
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {bundle.profile.degree} in {bundle.profile.branch} · {bundle.profile.college} · Class of {bundle.profile.graduationYear} · CGPA {bundle.profile.cgpa}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {bundle.profile.bio}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Badges Earned:</span>
            {bundle.profile.badges.map((b) => (
              <span key={b} className="font-mono text-slate-800 dark:text-slate-200">
                ★ {b}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyUrl}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedPublicUrl ? 'Copied /u/' + bundle.user.username : 'Share Public Profile'}</span>
          </button>
          <button
            onClick={() => setShowPublicPreview(!showPublicPreview)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{showPublicPreview ? 'Hide Public Preview' : 'Preview Public Portfolio'}</span>
          </button>
          <button
            onClick={onOpenOnboarding}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer"
          >
            Edit Profile & Skills
          </button>
        </div>
      </div>

      {showPublicPreview && (
        <div className="p-6 rounded-xl border border-blue-500/40 bg-blue-500/5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono text-blue-600 dark:text-blue-400">
              Public Portfolio Preview · opportunityos.com/u/{bundle.user.username}
            </p>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
              Readiness Score: {bundle.readiness.overall}/100
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                Featured Engineering Projects
              </h4>
              <div className="space-y-2.5">
                {bundle.profile.projects.map((proj, i) => (
                  <div key={i} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <p className="font-semibold text-slate-900 dark:text-white">{proj.title}</p>
                    <p className="font-mono text-[11px] text-blue-600 dark:text-blue-400 my-0.5">{proj.stack}</p>
                    <p className="text-slate-600 dark:text-slate-400">{proj.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                Verified Achievements & Honours
              </h4>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                {bundle.profile.achievements.map((ach, i) => (
                  <li key={i} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    ✓ {ach}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Resume Analyzer & AI Skill Gap Matcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Resume Integration & AI Skill Extractor</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload or paste your resume to automatically extract skills, projects, and improve recommendation accuracy.
              </p>
            </div>
            <label className="px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
              <span>Upload .txt / .md Resume</span>
              <input type="file" accept=".txt,.md,.json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <form onSubmit={handleResumeSubmit} className="space-y-3">
            <textarea
              rows={7}
              value={resumeInput}
              onChange={(e) => setResumeInput(e.target.value)}
              className="w-full p-3 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={analyzing}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer disabled:opacity-50"
            >
              {analyzing ? 'Extracting & Syncing Resume Skills...' : 'Analyze Resume & Update Matches'}
            </button>
          </form>

          {resumeResult && (
            <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Resume Match Calibration:
                </span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  Your resume matches {resumeResult.strengthScore || 88}% of top SWE & AI internships
                </span>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Extracted & Synced Skills:</p>
                <p className="font-mono text-emerald-600 dark:text-emerald-400">
                  {(resumeResult.extractedSkills || []).join(' · ')}
                </p>
              </div>
              {resumeResult.missingHighDemandSkills?.length > 0 && (
                <div>
                  <p className="text-slate-500 mb-1">High-Demand Skills to Add:</p>
                  <p className="font-mono text-amber-600 dark:text-amber-400">
                    {resumeResult.missingHighDemandSkills.join(' · ')}
                  </p>
                </div>
              )}
              {resumeResult.improvementTips?.length > 0 && (
                <ul className="list-disc pl-4 text-slate-600 dark:text-slate-300 space-y-1">
                  {resumeResult.improvementTips.map((tip: string, i: number) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Right 5 Cols: Community Leaderboard */}
        <div className="lg:col-span-5 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
          <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Cohort Readiness Leaderboard</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ranked by roadmap completions, coding consistency, and open-source activity.
              </p>
            </div>
            <button
              onClick={() =>
                onSaveProfile({ leaderboardOptOut: !bundle.user.leaderboardOptOut })
              }
              className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
            >
              {bundle.user.leaderboardOptOut ? 'Opt In' : 'Opt Out'}
            </button>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {bundle.leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`py-3 flex items-center justify-between gap-3 text-xs ${
                  entry.isCurrentUser ? 'font-semibold text-blue-600 dark:text-blue-400' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono tabular-nums w-5 text-slate-400">
                    #{entry.rank}
                  </span>
                  <div>
                    <p className="text-slate-900 dark:text-white">
                      {entry.name} {entry.isCurrentUser && '(You)'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      @{entry.username} · {entry.streakDays}d streak
                    </p>
                  </div>
                </div>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {entry.points} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
