import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LayoutDashboard,
  Compass,
  Briefcase,
  Terminal,
  GitBranch,
  Trophy,
  Award,
  BookOpen,
  Kanban,
  Calendar as CalendarIcon,
  User as UserIcon,
  Bell,
  Settings,
  Search,
  Bookmark,
  ExternalLink,
  Sun,
  Moon,
  Sparkles,
  LogOut,
  Check,
  Filter,
  ShieldCheck,
  Building2,
  Menu,
  X,
  MessageSquare,
  Send,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { DashboardBundle, EnrichedOpportunity, ApplicationItem } from './types/opportunity.ts';
import { LandingPage } from './components/LandingPage.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';
import { OpportunityDetailsModal } from './components/OpportunityDetailsModal.tsx';
import {
  RoadmapsView,
  CodingAggregatorView,
  DeveloperProfileView,
} from './components/RoadmapsAndCodingView.tsx';
import {
  ApplicationTrackerView,
  CalendarAndDeadlinesView,
  AdminAndOrgView,
} from './components/TrackerAndAdminView.tsx';

type NavTab =
  | 'Dashboard'
  | 'Discover'
  | 'Internships'
  | 'Hackathons'
  | 'Open Source'
  | 'Coding'
  | 'Scholarships'
  | 'Research'
  | 'Jobs'
  | 'Saved'
  | 'Roadmaps'
  | 'Applications'
  | 'Calendar'
  | 'Profile'
  | 'Notifications'
  | 'Admin'
  | 'Organization'
  | 'Settings';

const SIDEBAR_ITEMS: Array<{ id: NavTab; label: string; icon: React.ComponentType<any>; categoryFilter?: string }> = [
  { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'Discover', label: 'Discover Feed', icon: Compass },
  { id: 'Internships', label: 'Internships', icon: Briefcase, categoryFilter: 'Internship' },
  { id: 'Hackathons', label: 'Hackathons', icon: Terminal, categoryFilter: 'Hackathon' },
  { id: 'Open Source', label: 'Open Source', icon: GitBranch, categoryFilter: 'Open Source' },
  { id: 'Coding', label: 'Coding & Profiles', icon: Trophy },
  { id: 'Scholarships', label: 'Scholarships', icon: Award, categoryFilter: 'Scholarship' },
  { id: 'Research', label: 'Research', icon: BookOpen, categoryFilter: 'Research' },
  { id: 'Jobs', label: 'Jobs & Grad Roles', icon: Briefcase, categoryFilter: 'Job' },
  { id: 'Saved', label: 'Saved Opportunities', icon: Bookmark },
  { id: 'Roadmaps', label: 'Roadmaps', icon: BookOpen },
  { id: 'Applications', label: 'Applications', icon: Kanban },
  { id: 'Calendar', label: 'Calendar & Deadlines', icon: CalendarIcon },
  { id: 'Profile', label: 'Developer Profile', icon: UserIcon },
  { id: 'Notifications', label: 'Notifications', icon: Bell },
  { id: 'Organization', label: 'Organization Portal', icon: Building2 },
  { id: 'Admin', label: 'Admin Console', icon: ShieldCheck },
  { id: 'Settings', label: 'Settings', icon: Settings },
];

function ApplicationProgressTrendsSection({
  applications,
  onOpenTracker,
}: {
  applications: ApplicationItem[];
  onOpenTracker: () => void;
}) {
  const [chartType, setChartType] = useState<'area' | 'bar' | 'cumulative'>('area');
  const [granularity, setGranularity] = useState<'monthly' | 'biweekly'>('monthly');

  const trendData = useMemo(() => {
    const now = new Date();

    const parseAppDate = (app: ApplicationItem): Date => {
      if (app.appliedAt) {
        const parsed = new Date(app.appliedAt);
        if (!isNaN(parsed.getTime())) return parsed;
      }
      if (app.updatedAt) {
        const parsed = new Date(app.updatedAt);
        if (!isNaN(parsed.getTime())) return parsed;
      }
      return now;
    };

    const rawBuckets =
      granularity === 'monthly'
        ? [2, 1, 0].map((monthsAgo) => {
            const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            return {
              key: monthKey,
              startMs: d.getTime(),
              endMs: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime(),
              period: label,
              Preparing: 0,
              Applied: 0,
              Interviewing: 0,
              Total: 0,
              CumulativeTotal: 0,
              CumulativeSubmitted: 0,
              CumulativeInterviews: 0,
            };
          })
        : [5, 4, 3, 2, 1, 0].map((idx) => {
            const end = new Date(now.getTime() - idx * 15 * 24 * 60 * 60 * 1000);
            const start = new Date(end.getTime() - 15 * 24 * 60 * 60 * 1000);
            const label = `${start.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}–${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            return {
              key: label,
              startMs: start.getTime(),
              endMs: end.getTime(),
              period: label,
              Preparing: 0,
              Applied: 0,
              Interviewing: 0,
              Total: 0,
              CumulativeTotal: 0,
              CumulativeSubmitted: 0,
              CumulativeInterviews: 0,
            };
          });

    for (const app of applications) {
      const dt = parseAppDate(app);
      let bucket = rawBuckets[rawBuckets.length - 1];

      if (granularity === 'monthly') {
        const appMonthKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        bucket =
          rawBuckets.find((b) => b.key === appMonthKey) ||
          (dt.getTime() < rawBuckets[0].startMs
            ? rawBuckets[0]
            : rawBuckets[rawBuckets.length - 1]);
      } else {
        const dtMs = dt.getTime();
        bucket =
          rawBuckets.find((b) => dtMs >= b.startMs && dtMs <= b.endMs) ||
          (dtMs < rawBuckets[0].startMs ? rawBuckets[0] : rawBuckets[rawBuckets.length - 1]);
      }

      if (['Interested', 'Saved', 'Preparing'].includes(app.status)) {
        bucket.Preparing += 1;
      } else if (['Applied', 'Assessment', 'Rejected'].includes(app.status)) {
        bucket.Applied += 1;
      } else if (['Interview', 'Selected'].includes(app.status)) {
        bucket.Interviewing += 1;
      } else {
        bucket.Applied += 1;
      }
      bucket.Total += 1;
    }

    let runningTotal = 0;
    let runningSubmitted = 0;
    let runningInterviews = 0;
    for (const b of rawBuckets) {
      runningTotal += b.Total;
      runningSubmitted += b.Applied + b.Interviewing;
      runningInterviews += b.Interviewing;
      b.CumulativeTotal = runningTotal;
      b.CumulativeSubmitted = runningSubmitted;
      b.CumulativeInterviews = runningInterviews;
    }

    return rawBuckets;
  }, [applications, granularity]);

  const totalCount = applications.length;
  const activeAppliedCount = applications.filter((a) =>
    ['Applied', 'Assessment', 'Interview', 'Selected'].includes(a.status)
  ).length;
  const interviewOrOfferCount = applications.filter((a) =>
    ['Interview', 'Selected'].includes(a.status)
  ).length;
  const conversionRate =
    activeAppliedCount > 0
      ? Math.round((interviewOrOfferCount / activeAppliedCount) * 100)
      : 0;

  return (
    <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Application Progress Trends (Last 3 Months)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Historical velocity across Saved/Preparing, Applied/Assessment, and Interview/Selected stages from your application history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Granularity Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setGranularity('monthly')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                granularity === 'monthly'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly (3M)
            </button>
            <button
              onClick={() => setGranularity('biweekly')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                granularity === 'biweekly'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bi-Weekly (90D)
            </button>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                chartType === 'area'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Area Trend
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Stage Bars
            </button>
            <button
              onClick={() => setChartType('cumulative')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                chartType === 'cumulative'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cumulative
            </button>
          </div>

          <button
            onClick={onOpenTracker}
            className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-colors cursor-pointer whitespace-nowrap"
          >
            Open Kanban Tracker →
          </button>
        </div>
      </div>

      {/* Recharts 3-Month Visualization */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={trendData} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gradApplied" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradInterview" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradPreparing" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Area
                type="monotone"
                dataKey="Preparing"
                name="Saved & Preparing"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradPreparing)"
              />
              <Area
                type="monotone"
                dataKey="Applied"
                name="Applied & Assessment"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradApplied)"
              />
              <Area
                type="monotone"
                dataKey="Interviewing"
                name="Interviews & Selected"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradInterview)"
              />
            </AreaChart>
          ) : chartType === 'bar' ? (
            <BarChart data={trendData} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Bar
                dataKey="Preparing"
                name="Saved & Preparing"
                stackId="a"
                fill="#f59e0b"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Applied"
                name="Applied & Assessment"
                stackId="a"
                fill="#2563eb"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Interviewing"
                name="Interviews & Selected"
                stackId="a"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <AreaChart data={trendData} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCumTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradCumSubmitted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradCumInterviews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Area
                type="monotone"
                dataKey="CumulativeTotal"
                name="Cumulative Tracked"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradCumTotal)"
              />
              <Area
                type="monotone"
                dataKey="CumulativeSubmitted"
                name="Cumulative Submitted"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradCumSubmitted)"
              />
              <Area
                type="monotone"
                dataKey="CumulativeInterviews"
                name="Cumulative Interviews & Offers"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradCumInterviews)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* 3-Month Funnel Summary Strip */}
      <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-500 dark:text-slate-400 block">
            3-Month Total Tracked
          </span>
          <span className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {totalCount} Applications
          </span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 block">
            Submitted & Assessments
          </span>
          <span className="text-base font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
            {activeAppliedCount} Active
          </span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 block">
            Interviews & Selected
          </span>
          <span className="text-base font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {interviewOrOfferCount} Advanced
          </span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 block">
            Interview Conversion Rate
          </span>
          <span className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {conversionRate}%
          </span>
        </div>
      </div>
    </div>
  );
}

function OpportunityCard({
  opp,
  onSelect,
  onToggleSave,
  onQuickApply,
}: {
  opp: EnrichedOpportunity;
  onSelect: (opp: EnrichedOpportunity) => void;
  onToggleSave: (id: number, isSaved: boolean) => void;
  onQuickApply: (opp: EnrichedOpportunity) => void;
}) {
  return (
    <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-blue-500/50 transition-colors flex flex-col justify-between gap-4">
      <div>
        {/* Top Row: Clean unboxed metadata + Match Percentage */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {opp.organization.name}
            </span>
            <span aria-hidden="true">·</span>
            <span>{opp.category}</span>
            <span aria-hidden="true">·</span>
            <span>{opp.workMode}</span>
            <span aria-hidden="true">·</span>
            <span>{opp.location}</span>
          </div>

          <div className="flex items-center gap-3 font-mono tabular-nums">
            <span
              className={`font-semibold ${
                opp.eligibility.status === 'ELIGIBLE'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : opp.eligibility.status === 'PARTIALLY_ELIGIBLE'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {opp.eligibility.status === 'ELIGIBLE' && '✓ Eligible'}
              {opp.eligibility.status === 'PARTIALLY_ELIGIBLE' && '⚠ Partial Match'}
              {opp.eligibility.status === 'NOT_ELIGIBLE' && '✕ Ineligible'}
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {opp.matchScore}% Match
            </span>
          </div>
        </div>

        {/* Title */}
        <button
          onClick={() => onSelect(opp)}
          className="text-left text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-2 cursor-pointer"
        >
          {opp.title}
        </button>

        {/* Why this matches you */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800/80 mb-3 text-xs">
          <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
            Why this matches you:
          </p>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {opp.matchExplanation}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            {opp.matchReasons.slice(0, 3).map((reason, idx) => (
              <span key={idx}>✓ {reason}</span>
            ))}
          </div>
        </div>

        {/* Unboxed Skills, Compensation, Difficulty & Deadline */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <span className="text-slate-700 dark:text-slate-300 font-medium">Skills: </span>
            <span>{opp.requiredSkills.join(' · ') || 'Core Engineering'}</span>
          </div>
          <div className="flex items-center gap-2 font-mono tabular-nums">
            {opp.stipend && (
              <>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">
                  {opp.stipend}
                </span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span>{opp.difficulty}</span>
            <span aria-hidden="true">·</span>
            <span
              className={
                opp.daysRemaining <= 3
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                  : opp.daysRemaining <= 7
                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                  : 'text-emerald-600 dark:text-emerald-400'
              }
            >
              {opp.daysRemaining >= 0
                ? `${opp.daysRemaining} days remaining`
                : 'Deadline passed'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSelect(opp)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            View Details & Eligibility
          </button>
          <button
            onClick={() => onToggleSave(opp.id, opp.isSaved)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
              opp.isSaved
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/10'
                : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {opp.isSaved ? 'Saved ✓' : 'Save'}
          </button>
          <button
            onClick={() => onQuickApply(opp)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            {opp.applicationStatus ? `Tracked (${opp.applicationStatus})` : 'Track Application'}
          </button>
        </div>

        <a
          href={opp.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onQuickApply(opp)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
        >
          <span>Apply</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

function WorkspaceApp() {
  const {
    isAuthenticated,
    signInWithGoogle,
    enterWorkspaceAs,
    logout,
    authFetch,
  } = useAuth();

  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('Dashboard');
  const [bundle, setBundle] = useState<DashboardBundle | null>(null);
  const [loadingBundle, setLoadingBundle] = useState(false);
  const [bundleError, setBundleError] = useState<string | null>(null);

  // Modals & Drawers
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<EnrichedOpportunity | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  // AI Assistant Chat State
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<
    Array<{ role: 'user' | 'assistant'; text: string }>
  >([
    {
      role: 'assistant',
      text: 'Hello! I am your OpportunityOS Career Intelligence Assistant. Ask me for beginner-friendly AI internships, hackathons closing this week, or what skills to learn next.',
    },
  ]);

  // Global Search & Advanced Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [workModeFilter, setWorkModeFilter] = useState<string>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [skillFilter, setSkillFilter] = useState<string>('ALL');
  const [onlyEligible, setOnlyEligible] = useState<boolean>(false);
  const [onlyBeginner, setOnlyBeginner] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchDashboard = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingBundle(true);
    setBundleError(null);
    try {
      const res = await authFetch('/api/dashboard');
      if (!res.ok) {
        throw new Error('Failed to load workspace data from PostgreSQL');
      }
      const data: DashboardBundle = await res.json();
      setBundle(data);
      // Keep selected opportunity fresh if open
      if (selectedOpportunity) {
        const refreshed = data.opportunities.find((o) => o.id === selectedOpportunity.id);
        if (refreshed) setSelectedOpportunity(refreshed);
      }
    } catch (err: any) {
      setBundleError(err.message || 'Something went wrong loading your dashboard.');
    } finally {
      setLoadingBundle(false);
    }
  }, [isAuthenticated, authFetch, selectedOpportunity?.id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated]);

  // Sync category filter when user clicks a dedicated category tab in the sidebar
  const handleSelectNavTab = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setPage(1);
    const navMeta = SIDEBAR_ITEMS.find((i) => i.id === tab);
    if (navMeta?.categoryFilter) {
      setCategoryFilter(navMeta.categoryFilter);
    } else if (tab === 'Discover') {
      setCategoryFilter('ALL');
    }
  };

  // Filtered & Ranked Opportunities
  const filteredOpportunities = useMemo(() => {
    if (!bundle) return [];
    return bundle.opportunities
      .filter((opp) => {
        if (activeTab === 'Saved' && !opp.isSaved) return false;
        if (categoryFilter !== 'ALL' && opp.category !== categoryFilter) return false;
        if (workModeFilter !== 'ALL' && opp.workMode !== workModeFilter) return false;
        if (difficultyFilter !== 'ALL' && opp.difficulty !== difficultyFilter) return false;
        if (onlyBeginner && !opp.beginnerFriendly) return false;
        if (onlyEligible && opp.eligibility.status === 'NOT_ELIGIBLE') return false;
        if (
          skillFilter !== 'ALL' &&
          !opp.requiredSkills.some((s) => s.toLowerCase() === skillFilter.toLowerCase())
        ) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const haystack = `${opp.title} ${opp.organization.name} ${opp.category} ${opp.location} ${opp.workMode} ${opp.requiredSkills.join(' ')} ${opp.description}`.toLowerCase();
          const terms = q.split(/\s+/);
          if (!terms.every((t) => haystack.includes(t))) return false;
        }
        return true;
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [
    bundle,
    activeTab,
    categoryFilter,
    workModeFilter,
    difficultyFilter,
    onlyBeginner,
    onlyEligible,
    skillFilter,
    searchQuery,
  ]);

  const paginatedOpportunities = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredOpportunities.slice(start, start + PAGE_SIZE);
  }, [filteredOpportunities, page]);

  const totalPages = Math.max(1, Math.ceil(filteredOpportunities.length / PAGE_SIZE));

  // Action Handlers connected to PostgreSQL APIs
  const handleToggleSave = async (oppId: number, currentSaved: boolean) => {
    await authFetch(`/api/opportunities/${oppId}/save`, {
      method: currentSaved ? 'DELETE' : 'POST',
    });
    await fetchDashboard();
  };

  const handleTrackApplication = async (oppId: number, status = 'Preparing') => {
    await authFetch('/api/applications', {
      method: 'POST',
      body: JSON.stringify({ opportunityId: oppId, status }),
    });
    await fetchDashboard();
  };

  const handleUpdateApplication = async (appId: number, payload: Record<string, any>) => {
    await authFetch(`/api/applications/${appId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    await fetchDashboard();
  };

  const handleDeleteApplication = async (appId: number) => {
    await authFetch(`/api/applications/${appId}`, {
      method: 'DELETE',
    });
    await fetchDashboard();
  };

  const handleSaveProfile = async (payload: Record<string, any>) => {
    await authFetch('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    await fetchDashboard();
  };

  const handleUpdateRoadmapStep = async (
    roadmapId: number,
    stepId: number,
    status: string
  ) => {
    await authFetch(`/api/roadmaps/${roadmapId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ stepId, status }),
    });
    await fetchDashboard();
  };

  const handleGenerateAiRoadmap = async (goalPrompt: string) => {
    await authFetch('/api/roadmaps/generate-ai', {
      method: 'POST',
      body: JSON.stringify({ goalPrompt }),
    });
    await fetchDashboard();
  };

  const handleConnectCodingPlatform = async (platform: string, username: string) => {
    await authFetch('/api/coding-profiles/connect', {
      method: 'POST',
      body: JSON.stringify({ platform, username }),
    });
    await fetchDashboard();
  };

  const handleAnalyzeResume = async (resumeText: string) => {
    const res = await authFetch('/api/ai/parse-resume', {
      method: 'POST',
      body: JSON.stringify({ resumeText }),
    });
    const data = await res.json();
    await fetchDashboard();
    return data;
  };

  const handleAddEventToCalendar = async (payload: Record<string, any>) => {
    await authFetch('/api/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await fetchDashboard();
  };

  const handleMarkNotifRead = async (notifId: number) => {
    await authFetch(`/api/notifications/${notifId}/read`, { method: 'PUT' });
    await fetchDashboard();
  };

  const handleMarkAllNotifsRead = async () => {
    await authFetch('/api/notifications/read-all', { method: 'PUT' });
    await fetchDashboard();
  };

  const handleSaveCurrentSearch = async () => {
    if (!bundle) return;
    const label = searchQuery.trim() || `${categoryFilter} (${workModeFilter})`;
    const nextSearches = [
      ...(bundle.profile.savedSearches || []),
      { name: label, query: searchQuery, category: categoryFilter },
    ];
    await handleSaveProfile({ savedSearches: nextSearches });
  };

  const handleAskAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantInput.trim()) return;
    const question = assistantInput.trim();
    setAssistantInput('');
    setAssistantMessages((prev) => [...prev, { role: 'user', text: question }]);
    setAssistantLoading(true);
    try {
      const res = await authFetch('/api/ai/assistant', {
        method: 'POST',
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAssistantMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.reply || 'Here are your top matched opportunities.' },
      ]);
    } catch {
      setAssistantMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Unable to reach AI assistant right now. Please try again.' },
      ]);
    } finally {
      setAssistantLoading(false);
    }
  };

  // Show Landing Page when not signed into workspace
  if (!isAuthenticated) {
    return (
      <LandingPage
        onGetStarted={() => enterWorkspaceAs('STUDENT')}
        onExploreAs={(role) => {
          enterWorkspaceAs(role);
          if (role === 'ADMIN') setActiveTab('Admin');
          else if (role === 'ORGANIZATION') setActiveTab('Organization');
          else setActiveTab('Dashboard');
        }}
        onGoogleLogin={signInWithGoogle}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />
    );
  }

  const unreadNotifCount = bundle?.notifications.filter((n) => !n.read).length || 0;
  const isFeedTab = [
    'Discover',
    'Internships',
    'Hackathons',
    'Open Source',
    'Scholarships',
    'Research',
    'Jobs',
    'Saved',
  ].includes(activeTab);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar (250px width) */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 h-screen">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => handleSelectNavTab('Dashboard')}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-display cursor-pointer"
          >
            OpportunityOS
          </button>
          <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
            {bundle?.user.role || 'STUDENT'}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectNavTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.id === 'Notifications' && unreadNotifCount > 0 && (
                  <span className="font-mono text-[11px] font-semibold">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom User Summary & Role Switcher */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs px-2">
            <div className="truncate">
              <p className="font-semibold text-slate-900 dark:text-white truncate">
                {bundle?.user.name || 'Alex Verma'}
              </p>
              <p className="text-[11px] text-slate-500 font-mono truncate">
                {bundle?.profile.degree} ’{String(bundle?.profile.graduationYear || 2027).slice(-2)} · {bundle?.readiness.overall || 84}/100
              </p>
            </div>
            <button
              onClick={logout}
              title="Back to Landing Page"
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 h-full flex flex-col p-4">
            <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-base font-bold font-display">OpportunityOS</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNavTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg ${
                      activeTab === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Workspace Top Header (Contextual Breadcrumb on Left, Actions on Right) */}
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-800"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Workspace</span>
              <span className="mx-2">/</span>
              <span className="text-slate-900 dark:text-white font-semibold">
                {activeTab}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Global Search Input */}
            <div className="relative hidden sm:block w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!isFeedTab) setActiveTab('Discover');
                }}
                placeholder="Search React internships, GSoC..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <button
              onClick={() => setAssistantOpen(!assistantOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/40 rounded-lg hover:bg-blue-500/10 cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Assistant</span>
            </button>

            <button
              onClick={() => setShowOnboarding(true)}
              className="hidden md:inline-flex px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer whitespace-nowrap"
            >
              Onboarding Wizard
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Body Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
          {bundleError && (
            <div className="mb-6 p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 flex items-center justify-between text-xs text-rose-600 dark:text-rose-300">
              <span>{bundleError}</span>
              <button
                onClick={fetchDashboard}
                className="px-3 py-1 font-semibold bg-rose-600 text-white rounded-md cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {loadingBundle && !bundle ? (
            <div className="space-y-4">
              <div className="h-24 rounded-xl bg-slate-200/60 dark:bg-slate-900 animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-44 rounded-xl bg-slate-200/60 dark:bg-slate-900 animate-pulse" />
                <div className="h-44 rounded-xl bg-slate-200/60 dark:bg-slate-900 animate-pulse" />
                <div className="h-44 rounded-xl bg-slate-200/60 dark:bg-slate-900 animate-pulse" />
              </div>
            </div>
          ) : bundle ? (
            <>
              {/* 1. STUDENT DASHBOARD HOME */}
              {activeTab === 'Dashboard' && (
                <div className="space-y-8">
                  {/* Greeting & Top Metrics */}
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                        Good morning, {bundle.user.name.split(' ')[0]}
                      </h1>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Here are opportunities selected and verified for your {bundle.profile.degree} ({bundle.profile.graduationYear}) profile.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setShowOnboarding(true)}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
                      >
                        Update Eligibility Profile
                      </button>
                      <button
                        onClick={() => handleSelectNavTab('Discover')}
                        className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer"
                      >
                        Explore All {bundle.opportunities.length} Opportunities
                      </button>
                    </div>
                  </div>

                  {/* 5 Key Student Metrics Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Profile Completeness</p>
                      <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                        94%
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                      <p className="text-xs text-slate-500 dark:text-slate-400">High-Match Eligible</p>
                      <p className="text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-1">
                        {bundle.opportunities.filter((o) => o.matchScore >= 80).length}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Tracked Applications</p>
                      <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                        {bundle.applications.length}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Deadlines This Week</p>
                      <p className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
                        {bundle.opportunities.filter((o) => o.daysRemaining >= 0 && o.daysRemaining <= 7).length}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Readiness Score</p>
                      <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                        {bundle.readiness.overall}/100
                      </p>
                    </div>
                  </div>

                  {/* 3-Month Application Progress Trends Visualization (Recharts) */}
                  <ApplicationProgressTrendsSection
                    applications={bundle.applications}
                    onOpenTracker={() => handleSelectNavTab('Applications')}
                  />

                  {/* Main Dashboard 2-Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left 8 Cols: Top Recommended Opportunities */}
                    <div className="lg:col-span-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                          Recommended for You
                        </h2>
                        <button
                          onClick={() => handleSelectNavTab('Discover')}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          View Full Personalized Feed →
                        </button>
                      </div>

                      {bundle.opportunities.slice(0, 5).map((opp) => (
                        <OpportunityCard
                          key={opp.id}
                          opp={opp}
                          onSelect={setSelectedOpportunity}
                          onToggleSave={handleToggleSave}
                          onQuickApply={(o) => handleTrackApplication(o.id, 'Applied')}
                        />
                      ))}
                    </div>

                    {/* Right 4 Cols: Deadlines, Roadmap Progress, Coding Summary & Suggested Actions */}
                    <div className="lg:col-span-4 space-y-6">
                      {/* Suggested Next Actions */}
                      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                          Suggested Actions
                        </h3>
                        <div className="space-y-2 text-xs">
                          <button
                            onClick={() => handleSelectNavTab('Hackathons')}
                            className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span>Apply to MLH AI & Cloud Hackathon (3d left)</span>
                            <span className="font-mono text-blue-600 dark:text-blue-400">94%</span>
                          </button>
                          <button
                            onClick={() => handleSelectNavTab('Roadmaps')}
                            className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span>Complete React 19 & State Architecture step</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400">+25 XP</span>
                          </button>
                          <button
                            onClick={() => handleSelectNavTab('Coding')}
                            className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span>Sync GitHub & Codeforces before Global Round 32</span>
                            <span className="font-mono text-amber-600 dark:text-amber-400">2d left</span>
                          </button>
                        </div>
                      </div>

                      {/* Upcoming Deadlines */}
                      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Approaching Deadlines
                          </h3>
                          <button
                            onClick={() => handleSelectNavTab('Calendar')}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            Calendar
                          </button>
                        </div>
                        <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                          {bundle.opportunities
                            .filter((o) => o.daysRemaining >= 0)
                            .sort((a, b) => a.daysRemaining - b.daysRemaining)
                            .slice(0, 5)
                            .map((opp) => (
                              <button
                                key={opp.id}
                                onClick={() => setSelectedOpportunity(opp)}
                                className="w-full py-2.5 text-left flex items-center justify-between gap-2 hover:text-blue-500 cursor-pointer"
                              >
                                <div className="truncate">
                                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                                    {opp.title}
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    {opp.organization.name} · {opp.category}
                                  </p>
                                </div>
                                <span
                                  className={`font-mono tabular-nums shrink-0 font-semibold ${
                                    opp.daysRemaining <= 3
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : opp.daysRemaining <= 7
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-emerald-600 dark:text-emerald-400'
                                  }`}
                                >
                                  {opp.daysRemaining}d left
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* Continue Your Roadmaps */}
                      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Continue Your Roadmaps
                          </h3>
                          <button
                            onClick={() => handleSelectNavTab('Roadmaps')}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            All Roadmaps
                          </button>
                        </div>
                        <div className="space-y-3 text-xs">
                          {bundle.roadmaps.slice(0, 3).map((rm) => (
                            <div key={rm.id}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                  {rm.title}
                                </span>
                                <span className="font-mono tabular-nums text-blue-600 dark:text-blue-400">
                                  {rm.progressPercent}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-blue-600"
                                  style={{ width: `${rm.progressPercent}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. PERSONALIZED DISCOVER & CATEGORY FEEDS */}
              {isFeedTab && (
                <div className="space-y-6">
                  {/* Feed Header & Filter Controls */}
                  <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                          {activeTab === 'Discover'
                            ? 'Personalized Opportunity Feed'
                            : activeTab === 'Saved'
                            ? 'Saved Opportunities'
                            : `${activeTab} Directory`}
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Showing {filteredOpportunities.length} opportunities ranked by skill match, cohort eligibility, and deadline urgency.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveCurrentSearch}
                          className="px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Save Current Search
                        </button>
                      </div>
                    </div>

                    {/* Search & Multi-Filter Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setPage(1);
                        }}
                        placeholder="Search keywords, skills, company..."
                        className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                      />

                      <select
                        value={categoryFilter}
                        onChange={(e) => {
                          setCategoryFilter(e.target.value);
                          setPage(1);
                        }}
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        <option value="ALL">All Categories</option>
                        <option value="Internship">Internships</option>
                        <option value="Hackathon">Hackathons</option>
                        <option value="Open Source">Open Source</option>
                        <option value="Coding Contest">Coding Contests</option>
                        <option value="Scholarship">Scholarships</option>
                        <option value="Research">Research</option>
                        <option value="Job">Jobs</option>
                      </select>

                      <select
                        value={workModeFilter}
                        onChange={(e) => {
                          setWorkModeFilter(e.target.value);
                          setPage(1);
                        }}
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        <option value="ALL">All Work Modes</option>
                        <option value="Remote">Remote Only</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="On-site">On-site</option>
                      </select>

                      <select
                        value={skillFilter}
                        onChange={(e) => {
                          setSkillFilter(e.target.value);
                          setPage(1);
                        }}
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        <option value="ALL">All Skills</option>
                        {bundle.allAvailableSkills.slice(0, 30).map((sk) => (
                          <option key={sk.id} value={sk.name}>
                            {sk.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={difficultyFilter}
                        onChange={(e) => {
                          setDifficultyFilter(e.target.value);
                          setPage(1);
                        }}
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        <option value="ALL">Any Difficulty</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>

                    {/* Toggle Filters & Saved Searches */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-800/70 text-xs">
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={onlyEligible}
                            onChange={(e) => {
                              setOnlyEligible(e.target.checked);
                              setPage(1);
                            }}
                            className="rounded border-slate-300"
                          />
                          <span>Hide Ineligible Opportunities</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={onlyBeginner}
                            onChange={(e) => {
                              setOnlyBeginner(e.target.checked);
                              setPage(1);
                            }}
                            className="rounded border-slate-300"
                          />
                          <span>Beginner Friendly Only</span>
                        </label>
                      </div>

                      {bundle.profile.savedSearches?.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-slate-400">Saved Searches:</span>
                          {bundle.profile.savedSearches.slice(-3).map((s, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setSearchQuery(s.query);
                                setCategoryFilter(s.category);
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              {s.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Opportunity Cards List or Empty State */}
                  {paginatedOpportunities.length === 0 ? (
                    <div className="p-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-center space-y-3">
                      <p className="text-base font-bold text-slate-900 dark:text-white">
                        {activeTab === 'Saved'
                          ? 'No saved opportunities yet.'
                          : 'No opportunities matched your current filters.'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Explore opportunities matched to your profile or reset active filters.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setCategoryFilter('ALL');
                          setWorkModeFilter('ALL');
                          setDifficultyFilter('ALL');
                          setSkillFilter('ALL');
                          setOnlyEligible(false);
                          setOnlyBeginner(false);
                          setActiveTab('Discover');
                        }}
                        className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer"
                      >
                        Discover Opportunities
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {paginatedOpportunities.map((opp) => (
                        <OpportunityCard
                          key={opp.id}
                          opp={opp}
                          onSelect={setSelectedOpportunity}
                          onToggleSave={handleToggleSave}
                          onQuickApply={(o) => handleTrackApplication(o.id, 'Applied')}
                        />
                      ))}

                      {/* Pagination Bar */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                          <span className="font-mono text-slate-500">
                            Page {page} of {totalPages} ({filteredOpportunities.length} total)
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              disabled={page <= 1}
                              onClick={() => setPage((p) => Math.max(1, p - 1))}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                            >
                              Previous
                            </button>
                            <button
                              disabled={page >= totalPages}
                              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3. ROADMAPS VIEW */}
              {activeTab === 'Roadmaps' && (
                <RoadmapsView
                  roadmaps={bundle.roadmaps}
                  opportunities={bundle.opportunities}
                  onUpdateStep={handleUpdateRoadmapStep}
                  onGenerateAiRoadmap={handleGenerateAiRoadmap}
                  onSelectOpportunity={setSelectedOpportunity}
                />
              )}

              {/* 4. CODING PROFILE AGGREGATOR & GITHUB INTEGRATION */}
              {activeTab === 'Coding' && (
                <CodingAggregatorView
                  bundle={bundle}
                  onConnectPlatform={handleConnectCodingPlatform}
                  onSelectOpportunity={setSelectedOpportunity}
                />
              )}

              {/* 5. KANBAN APPLICATION TRACKER */}
              {activeTab === 'Applications' && (
                <ApplicationTrackerView
                  bundle={bundle}
                  onUpdateApplication={handleUpdateApplication}
                  onCreateApplication={(p) =>
                    handleTrackApplication(p.opportunityId, p.status)
                  }
                  onDeleteApplication={handleDeleteApplication}
                  onSelectOpportunity={setSelectedOpportunity}
                />
              )}

              {/* 6. CALENDAR & DEADLINE MANAGEMENT */}
              {activeTab === 'Calendar' && (
                <CalendarAndDeadlinesView
                  bundle={bundle}
                  onSelectOpportunity={setSelectedOpportunity}
                  onAddCustomEvent={handleAddEventToCalendar}
                />
              )}

              {/* 7. DEVELOPER PROFILE, RESUME INTEGRATION & LEADERBOARD */}
              {activeTab === 'Profile' && (
                <DeveloperProfileView
                  bundle={bundle}
                  onOpenOnboarding={() => setShowOnboarding(true)}
                  onAnalyzeResume={handleAnalyzeResume}
                  onSaveProfile={handleSaveProfile}
                />
              )}

              {/* 8. NOTIFICATIONS CENTER */}
              {activeTab === 'Notifications' && (
                <div className="max-w-3xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        Notifications & Deadline Alerts
                      </h2>
                      <p className="text-xs text-slate-500">
                        Real-time alerts for new high-match opportunities, approaching deadlines, and contest reminders.
                      </p>
                    </div>
                    <button
                      onClick={handleMarkAllNotifsRead}
                      className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-lg cursor-pointer"
                    >
                      Mark All as Read
                    </button>
                  </div>

                  <div className="space-y-3">
                    {bundle.notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 rounded-xl border transition-colors flex items-start justify-between gap-4 ${
                          n.read
                            ? 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/20 opacity-75'
                            : 'border-blue-500/40 bg-blue-500/5'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 text-xs font-mono text-blue-600 dark:text-blue-400 mb-1">
                            <span>{n.type}</span>
                            {!n.read && <span>· Unread</span>}
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                            {n.title}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            {n.message}
                          </p>
                        </div>
                        {!n.read && (
                          <button
                            onClick={() => handleMarkNotifRead(n.id)}
                            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. ADMIN CONSOLE & ORGANIZATION PORTAL */}
              {(activeTab === 'Admin' || activeTab === 'Organization') && (
                <AdminAndOrgView
                  bundle={bundle}
                  authFetch={authFetch}
                  onRefreshDashboard={fetchDashboard}
                />
              )}

              {/* 10. SETTINGS & RBAC ROLE SWITCHER */}
              {activeTab === 'Settings' && (
                <div className="max-w-2xl space-y-6">
                  <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-4">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Notification & Digest Preferences
                    </h2>
                    <div className="space-y-3 text-xs">
                      <label className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800">
                        <span>Email Alerts for 90%+ Match Opportunities</span>
                        <input
                          type="checkbox"
                          checked={bundle.profile.notificationEmail}
                          onChange={(e) =>
                            handleSaveProfile({ notificationEmail: e.target.checked })
                          }
                        />
                      </label>
                      <label className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800">
                        <span>In-App Urgent Deadline Reminders (1–3 days)</span>
                        <input
                          type="checkbox"
                          checked={bundle.profile.notificationInApp}
                          onChange={(e) =>
                            handleSaveProfile({ notificationInApp: e.target.checked })
                          }
                        />
                      </label>
                      <div className="flex items-center justify-between py-2">
                        <span>Alert Frequency</span>
                        <select
                          value={bundle.profile.notificationFrequency}
                          onChange={(e) =>
                            handleSaveProfile({ notificationFrequency: e.target.value })
                          }
                          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        >
                          <option value="Immediate">Immediate Real-Time</option>
                          <option value="Daily Digest">Daily Digest</option>
                          <option value="Weekly Summary">Weekly Summary</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-4">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Role-Based Access Control (RBAC) Switcher
                    </h2>
                    <p className="text-xs text-slate-500">
                      Switch your active role in PostgreSQL to test Student, Organization/Recruiter, or Admin permissions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(['STUDENT', 'ORGANIZATION', 'ADMIN'] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => handleSaveProfile({ role: r })}
                          className={`px-4 py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                            bundle.user.role === r
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {r} Role
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </main>
      </div>

      {/* AI Opportunity Assistant Slide-over Drawer */}
      {assistantOpen && (
        <div className="fixed bottom-4 right-4 z-40 w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col h-[480px]">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                AI Opportunity Assistant
              </span>
            </div>
            <button
              onClick={() => setAssistantOpen(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {assistantMessages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg whitespace-pre-wrap leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white ml-8'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 mr-4'
                }`}
              >
                {m.text}
              </div>
            ))}
            {assistantLoading && (
              <p className="text-xs font-mono text-slate-400">
                Querying trusted PostgreSQL opportunities...
              </p>
            )}
          </div>

          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5">
            {[
              'Beginner-friendly AI internships',
              'Hackathons closing this week',
              'Open source programs for Python/TypeScript',
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => setAssistantInput(prompt)}
                className="text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-blue-500 cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleAskAssistant}
            className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2"
          >
            <input
              type="text"
              value={assistantInput}
              onChange={(e) => setAssistantInput(e.target.value)}
              placeholder="Ask about deadlines, eligibility, roadmaps..."
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={assistantLoading}
              className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Multi-step Student Onboarding Modal */}
      {showOnboarding && bundle && (
        <OnboardingModal
          bundle={bundle}
          onClose={() => setShowOnboarding(false)}
          onSaveProfile={handleSaveProfile}
        />
      )}

      {/* Opportunity Details & Eligibility Breakdown Drawer */}
      {selectedOpportunity && bundle && (
        <OpportunityDetailsModal
          opportunity={selectedOpportunity}
          similarOpportunities={bundle.opportunities.filter(
            (o) =>
              o.id !== selectedOpportunity.id &&
              o.category === selectedOpportunity.category
          )}
          onClose={() => setSelectedOpportunity(null)}
          onSelectOpportunity={setSelectedOpportunity}
          onToggleSave={handleToggleSave}
          onTrackApplication={handleTrackApplication}
          onAddToCalendar={(opp) =>
            handleAddEventToCalendar({
              title: `${opp.title} Deadline`,
              description: `${opp.organization.name} (${opp.category}) application deadline`,
              category: opp.category,
              startDate: opp.deadline,
              endDate: opp.deadline,
              location: opp.location,
              registrationUrl: opp.applicationUrl,
              opportunityId: opp.id,
            })
          }
          onOpenRoadmap={() => {
            setSelectedOpportunity(null);
            setActiveTab('Roadmaps');
          }}
          authFetch={authFetch}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceApp />
    </AuthProvider>
  );
}
