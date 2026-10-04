import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Check,
  X,
  Star,
  RefreshCw,
  ExternalLink,
  Edit3,
  BarChart3,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  DashboardBundle,
  EnrichedOpportunity,
  ApplicationItem,
} from '../types/opportunity.ts';

const KANBAN_COLUMNS = [
  'Interested',
  'Saved',
  'Preparing',
  'Applied',
  'Assessment',
  'Interview',
  'Selected',
  'Rejected',
] as const;

interface ApplicationTrackerViewProps {
  bundle: DashboardBundle;
  onUpdateApplication: (appId: number, payload: Record<string, any>) => Promise<void>;
  onCreateApplication: (payload: Record<string, any>) => Promise<void>;
  onDeleteApplication: (appId: number) => Promise<void>;
  onSelectOpportunity: (opp: EnrichedOpportunity) => void;
}

export const ApplicationTrackerView: React.FC<ApplicationTrackerViewProps> = ({
  bundle,
  onUpdateApplication,
  onCreateApplication,
  onDeleteApplication,
  onSelectOpportunity,
}) => {
  const [draggedAppId, setDraggedAppId] = useState<number | null>(null);
  const [editingApp, setEditingApp] = useState<ApplicationItem | null>(null);
  const [selectedOppToAdd, setSelectedOppToAdd] = useState<number>(
    bundle.opportunities[0]?.id || 1
  );

  const oppMap = new Map(bundle.opportunities.map((o) => [o.id, o]));

  const handleDropColumn = async (targetStatus: string) => {
    if (draggedAppId === null) return;
    const app = bundle.applications.find((a) => a.id === draggedAppId);
    setDraggedAppId(null);
    if (app && app.status !== targetStatus) {
      await onUpdateApplication(app.id, { status: targetStatus });
    }
  };

  const handleAddQuickApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOppToAdd) return;
    await onCreateApplication({
      opportunityId: Number(selectedOppToAdd),
      status: 'Preparing',
      nextAction: 'Tailor resume & verify eligibility breakdown',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Add Bar */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Kanban Application Pipeline
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Drag cards between stages or click any application to log interview dates, referrals, and next actions.
          </p>
        </div>

        <form onSubmit={handleAddQuickApp} className="flex flex-wrap items-center gap-2">
          <select
            value={selectedOppToAdd}
            onChange={(e) => setSelectedOppToAdd(Number(e.target.value))}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white max-w-xs truncate"
          >
            {bundle.opportunities.slice(0, 40).map((o) => (
              <option key={o.id} value={o.id}>
                {o.organization.name} — {o.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Track Opportunity</span>
          </button>
        </form>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3 items-start overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((colStatus) => {
          const colApps = bundle.applications.filter((a) => a.status === colStatus);
          return (
            <div
              key={colStatus}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDropColumn(colStatus)}
              className="min-w-[230px] p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40"
            >
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {colStatus}
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  {colApps.length}
                </span>
              </div>

              <div className="space-y-2.5 min-h-[120px]">
                {colApps.length === 0 ? (
                  <p className="text-[11px] text-slate-400 dark:text-slate-600 py-8 text-center">
                    Drop card here
                  </p>
                ) : (
                  colApps.map((app) => {
                    const opp = oppMap.get(app.opportunityId);
                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={() => setDraggedAppId(app.id)}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500/50 transition-colors cursor-grab active:cursor-grabbing space-y-2"
                      >
                        <div>
                          <button
                            onClick={() => opp && onSelectOpportunity(opp)}
                            className="text-left text-xs font-semibold text-slate-900 dark:text-white hover:text-blue-500 line-clamp-2 cursor-pointer"
                          >
                            {opp?.title || `Opportunity #${app.opportunityId}`}
                          </button>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {opp?.organization.name || 'Organization'} ·{' '}
                            <span className="font-mono">
                              {opp ? `${opp.daysRemaining}d left` : ''}
                            </span>
                          </p>
                        </div>

                        {app.nextAction && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-900 px-2 py-1 rounded">
                            Next: {app.nextAction}
                          </p>
                        )}

                        <div className="text-[10px] font-mono text-slate-500 space-y-0.5">
                          {app.appliedAt && <p>Applied: {app.appliedAt}</p>}
                          {app.interviewDate && (
                            <p className="text-amber-600 dark:text-amber-400">
                              Interview: {app.interviewDate}
                            </p>
                          )}
                          {app.referral && <p>Referral: {app.referral}</p>}
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1">
                          <select
                            value={app.status}
                            onChange={(e) =>
                              onUpdateApplication(app.id, { status: e.target.value })
                            }
                            className="text-[10px] bg-transparent border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-slate-700 dark:text-slate-300"
                          >
                            {KANBAN_COLUMNS.map((st) => (
                              <option key={st} value={st} className="bg-white dark:bg-slate-900">
                                {st}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1">
                            {opp?.applicationUrl && (
                              <a
                                href={opp.applicationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open Official Application Portal"
                                className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-500 cursor-pointer"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            <button
                              onClick={() => setEditingApp(app)}
                              title="Edit Notes & Details"
                              className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onDeleteApplication(app.id)}
                              title="Remove from Tracker"
                              className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Application Detail Edit Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Update Application Details
              </h3>
              <button onClick={() => setEditingApp(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Stage / Status</label>
                <select
                  value={editingApp.status}
                  onChange={(e) => setEditingApp({ ...editingApp, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {KANBAN_COLUMNS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Interview / OA Date</label>
                  <input
                    type="date"
                    value={editingApp.interviewDate}
                    onChange={(e) =>
                      setEditingApp({ ...editingApp, interviewDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Referral Contact</label>
                  <input
                    type="text"
                    value={editingApp.referral}
                    onChange={(e) =>
                      setEditingApp({ ...editingApp, referral: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Resume Version Used</label>
                <input
                  type="text"
                  value={editingApp.resumeUsed}
                  onChange={(e) =>
                    setEditingApp({ ...editingApp, resumeUsed: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Next Action Item</label>
                <input
                  type="text"
                  value={editingApp.nextAction}
                  onChange={(e) =>
                    setEditingApp({ ...editingApp, nextAction: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Preparation & Interview Notes</label>
                <textarea
                  rows={3}
                  value={editingApp.notes}
                  onChange={(e) =>
                    setEditingApp({ ...editingApp, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setEditingApp(null)}
                className="px-4 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onUpdateApplication(editingApp.id, {
                    status: editingApp.status,
                    interviewDate: editingApp.interviewDate,
                    referral: editingApp.referral,
                    resumeUsed: editingApp.resumeUsed,
                    nextAction: editingApp.nextAction,
                    notes: editingApp.notes,
                  });
                  setEditingApp(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface CalendarAndDeadlinesViewProps {
  bundle: DashboardBundle;
  onSelectOpportunity: (opp: EnrichedOpportunity) => void;
  onAddCustomEvent: (payload: Record<string, any>) => Promise<void>;
}

export const CalendarAndDeadlinesView: React.FC<CalendarAndDeadlinesViewProps> = ({
  bundle,
  onSelectOpportunity,
  onAddCustomEvent,
}) => {
  const [viewMode, setViewMode] = useState<'Agenda' | 'Week' | 'Month'>('Agenda');
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCategory, setNewCategory] = useState('Deadline');

  const activeOpps = bundle.opportunities
    .filter((o) => o.daysRemaining >= 0)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const urgent1to3 = activeOpps.filter((o) => o.daysRemaining <= 3);
  const week4to7 = activeOpps.filter((o) => o.daysRemaining >= 4 && o.daysRemaining <= 7);
  const month8plus = activeOpps.filter((o) => o.daysRemaining >= 8 && o.daysRemaining <= 30);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onAddCustomEvent({
      title: newTitle.trim(),
      category: newCategory,
      startDate: newDate,
      endDate: newDate,
      description: 'Student scheduled milestone',
      location: 'OpportunityOS Calendar',
    });
    setNewTitle('');
  };

  return (
    <div className="space-y-8">
      {/* Urgency Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl border border-rose-500/30 bg-rose-500/5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Urgent (1–3 Days Remaining)
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
              {urgent1to3.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immediate action required before portal closure
          </p>
        </div>

        <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              This Week (4–7 Days Remaining)
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {week4to7.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Finalize resume tailoring and coding assessments
          </p>
        </div>

        <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              This Month (8–30 Days Remaining)
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {month8plus.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ideal window to complete missing roadmap skills
          </p>
        </div>
      </div>

      {/* View Switcher & Add Event Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {(['Agenda', 'Week', 'Month'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === m
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {m} View
            </button>
          ))}
        </div>

        <form onSubmit={handleCreateEvent} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add custom interview or milestone..."
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
          />
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            <option value="Interview">Interview</option>
            <option value="Hackathon">Hackathon</option>
            <option value="Coding Contest">Coding Contest</option>
            <option value="Roadmap Milestone">Roadmap Milestone</option>
          </select>
          <button
            type="submit"
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer"
          >
            + Add to Calendar
          </button>
        </form>
      </div>

      {viewMode === 'Agenda' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Chronological Opportunity Deadlines
            </h3>
            {activeOpps.slice(0, 18).map((opp) => (
              <div
                key={opp.id}
                onClick={() => onSelectOpportunity(opp)}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-blue-500/50 transition-colors flex flex-wrap items-center justify-between gap-4 cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`font-mono font-semibold ${
                        opp.daysRemaining <= 3
                          ? 'text-rose-600 dark:text-rose-400'
                          : opp.daysRemaining <= 7
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {opp.daysRemaining <= 3
                        ? `Urgent · ${opp.daysRemaining}d left`
                        : `${opp.daysRemaining} days left`}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-500 font-mono">{opp.deadline}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-500">{opp.category}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                    {opp.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {opp.organization.name} · {opp.location} · {opp.eligibility.label}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right font-mono tabular-nums">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 block">
                      {opp.matchScore}% Match
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {opp.stipend || 'Paid'}
                    </span>
                  </div>
                  <a
                    href={opp.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shrink-0"
                  >
                    <span>Apply</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Scheduled Events & Milestones ({bundle.events.length})
            </h3>
            {bundle.events.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between font-mono text-[11px] text-blue-600 dark:text-blue-400">
                  <span>{ev.category}</span>
                  <span>{ev.startDate}</span>
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {ev.title}
                </p>
                <p className="text-slate-500 dark:text-slate-400">{ev.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(viewMode === 'Week' || viewMode === 'Month') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: viewMode === 'Week' ? 7 : 16 }).map((_, idx) => {
            const d = new Date();
            d.setDate(d.getDate() + idx);
            const dateStr = d.toISOString().split('T')[0];
            const dayOpps = activeOpps.filter((o) => o.deadline === dateStr);
            const dayEvents = bundle.events.filter((ev) => ev.startDate === dateStr);

            return (
              <div
                key={dateStr}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 min-h-[140px] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/70 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{dateStr}</span>
                  </div>
                  <div className="space-y-1.5">
                    {dayOpps.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => onSelectOpportunity(o)}
                        className="w-full text-left p-2 rounded bg-blue-500/10 border border-blue-500/30 text-[11px] text-slate-900 dark:text-white hover:bg-blue-500/20 cursor-pointer"
                      >
                        <span className="font-semibold block truncate">{o.title}</span>
                        <span className="text-blue-600 dark:text-blue-400 font-mono">
                          {o.organization.name} · {o.matchScore}%
                        </span>
                      </button>
                    ))}
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-slate-900 dark:text-white"
                      >
                        <span className="font-semibold block truncate">{ev.title}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                          {ev.category}
                        </span>
                      </div>
                    ))}
                    {dayOpps.length === 0 && dayEvents.length === 0 && (
                      <p className="text-[11px] text-slate-400 py-4 text-center">
                        Open study block
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface AdminAndOrgViewProps {
  bundle: DashboardBundle;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onRefreshDashboard: () => Promise<void>;
}

export const AdminAndOrgView: React.FC<AdminAndOrgViewProps> = ({
  bundle,
  authFetch,
  onRefreshDashboard,
}) => {
  const isOwnerAdmin =
    bundle.user.email.toLowerCase() === 'kartikchoudhary18122005@gmail.com';

  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);
  const [userSearch, setUserSearch] = useState<string>('');
  const [userFilter, setUserFilter] = useState<'ALL' | 'STUDENT' | 'ACTIVE'>('ALL');
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [ingestMessage, setIngestMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [orgName, setOrgName] = useState('Stripe');
  const [category, setCategory] = useState('Internship');
  const [location, setLocation] = useState('Bengaluru / Remote');
  const [stipend, setStipend] = useState('₹1,20,000 / month');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [applicationUrl, setApplicationUrl] = useState('https://stripe.com/jobs/university');
  const [skillsStr, setSkillsStr] = useState('TypeScript, React, Go, PostgreSQL');
  const [description, setDescription] = useState('');

  const loadAdminAnalytics = React.useCallback(async () => {
    if (!isOwnerAdmin) return;
    setLoadingAnalytics(true);
    try {
      const r = await authFetch('/api/admin/analytics');
      if (r.ok) {
        const d = await r.json();
        setAnalytics(d);
      }
    } catch {
      // ignore transient error
    } finally {
      setLoadingAnalytics(false);
    }
  }, [authFetch, isOwnerAdmin]);

  useEffect(() => {
    loadAdminAnalytics();
  }, [loadAdminAnalytics, bundle.opportunities.length]);

  const handleCreateOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    const res = await authFetch('/api/opportunities', {
      method: 'POST',
      body: JSON.stringify({
        title,
        organizationName: orgName,
        category,
        location,
        workMode: 'Remote',
        remote: true,
        paid: true,
        stipend,
        deadline,
        applicationUrl,
        description:
          description ||
          `Verified ${category} at ${orgName} for students skilled in ${skillsStr}.`,
        requiredSkills: skillsStr.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFormError(
        data.verification?.verdictSummary
          ? `AI Verification Rejected: ${data.verification.verdictSummary}`
          : data.error || 'Failed to publish opportunity'
      );
      return;
    }
    setFormSuccess(
      `AI Verified (${data.verification?.confidenceScore || 95}% Authenticity) & Published "${data.opportunity?.title || title}" in PostgreSQL.`
    );
    setTitle('');
    setDescription('');
    await onRefreshDashboard();
  };

  const handleStatusChange = async (oppId: number, status: string, featured?: boolean) => {
    if (!isOwnerAdmin) return;
    await authFetch(`/api/opportunities/${oppId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, featured }),
    });
    await onRefreshDashboard();
  };

  const handleDeleteOpp = async (oppId: number) => {
    if (!isOwnerAdmin) return;
    await authFetch(`/api/opportunities/${oppId}`, {
      method: 'DELETE',
    });
    await onRefreshDashboard();
  };

  const handleTriggerIngest = async () => {
    if (!isOwnerAdmin) return;
    const res = await authFetch('/api/admin/ingest-feed', {
      method: 'POST',
      body: JSON.stringify({ feedSource: 'Approved University & CNCF Partner Feed' }),
    });
    const data = await res.json();
    if (data.duplicateSkipped) {
      setIngestMessage('Deduplication Engine: Partner feed item already exists in PostgreSQL — skipped duplicate.');
    } else {
      setIngestMessage(`Ingested new opportunity "${data.opportunity?.title}" into Pending Review queue.`);
      await onRefreshDashboard();
    }
  };

  const userDirectory: any[] = analytics?.userDirectory || [];
  const filteredUsers = userDirectory.filter((u) => {
    if (userFilter === 'STUDENT' && u.role !== 'STUDENT') return false;
    if (userFilter === 'ACTIVE' && !u.isOnlineNow) return false;
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      const hay = `${u.name} ${u.email} ${u.username} ${u.college} ${u.degree} ${u.branch} ${u.city} ${(u.skills || []).join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const formatDateTime = (iso: string) => {
    if (!iso) return 'Just now';
    try {
      return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Admin Metrics (Strictly Owner Admin Only) */}
      {isOwnerAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            {
              label: 'Total Users',
              value: analytics?.totalUsers ?? 5,
              sub: `${analytics?.totalStudents ?? 4} Student Accounts`,
            },
            {
              label: 'Active Users Online',
              value: analytics?.activeUsers ?? 4,
              sub: `${analytics?.activeStudentLogins ?? 3} Students Active Now`,
            },
            {
              label: 'Total Student Logins',
              value: analytics?.totalStudentLogins ?? 9,
              sub: `${analytics?.totalLoginSessions ?? 10} Total Login Sessions`,
            },
            {
              label: 'Total Time Spent',
              value: analytics?.totalTimeSpentFormatted ?? '9h 26m',
              sub: `Avg ${analytics?.averageTimeSpentFormatted ?? '1h 53m'} / user`,
            },
            {
              label: 'Applications Tracked',
              value: analytics?.totalApplications ?? bundle.applications.length,
              sub: `${analytics?.totalSaves ?? bundle.savedOpportunityIds.length} Saved Items`,
            },
            {
              label: 'Opportunities',
              value: bundle.opportunities.length,
              sub: `Apply CTR ${analytics?.ctrPercent ?? 34.8}%`,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40"
            >
              <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                {stat.value}
              </p>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                {stat.sub}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Student & User Login Intelligence Directory (Strictly Owner Admin Only) */}
      {isOwnerAdmin && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Student Login & User Intelligence Directory</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time visibility into which students logged in, active sessions, total logins, time spent on platform, email addresses, and academic profiles.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search student name, email, college, skill..."
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white w-64"
              />

              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                {(
                  [
                    { id: 'ALL', label: `All Users (${userDirectory.length})` },
                    {
                      id: 'STUDENT',
                      label: `Students (${userDirectory.filter((u) => u.role === 'STUDENT').length})`,
                    },
                    {
                      id: 'ACTIVE',
                      label: `Active Now (${userDirectory.filter((u) => u.isOnlineNow).length})`,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setUserFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      userFilter === tab.id
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={loadAdminAnalytics}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalytics ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/40">
                  <th className="py-3 px-4 font-medium">Student / User</th>
                  <th className="py-3 px-4 font-medium">Email & Role</th>
                  <th className="py-3 px-4 font-medium">Academic & User Information</th>
                  <th className="py-3 px-4 font-medium">Login Status & Count</th>
                  <th className="py-3 px-4 font-medium">Time Spent</th>
                  <th className="py-3 px-4 font-medium">Last Login Detail</th>
                  <th className="py-3 px-4 font-medium">Activity</th>
                  <th className="py-3 px-4 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredUsers.map((usr) => (
                  <tr
                    key={usr.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {usr.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        @{usr.username} · ID #{usr.id}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono text-slate-800 dark:text-slate-200">
                        {usr.email}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Role: <span className="font-mono font-semibold">{usr.role}</span> ·{' '}
                        {usr.city}, {usr.country}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {usr.college}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {usr.degree} in {usr.branch} · Class of {usr.graduationYear} · CGPA{' '}
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {usr.cgpa}
                        </span>
                      </div>
                      {usr.skills?.length > 0 && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          Skills: {usr.skills.slice(0, 5).join(' · ')}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      <div
                        className={`font-semibold ${
                          usr.isOnlineNow
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {usr.isOnlineNow ? '● Active Now' : `○ ${usr.activityStatus}`}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {usr.loginCount} {usr.loginCount === 1 ? 'Login' : 'Logins'} Recorded
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {usr.totalTimeFormatted}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Last session: {usr.lastSessionFormatted}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      <div className="text-slate-800 dark:text-slate-200">
                        {formatDateTime(usr.lastLoginAt)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {usr.lastLoginMethod} · {usr.lastDevice}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums text-[11px] text-slate-600 dark:text-slate-300">
                      <div>{usr.applicationsCount} Applications</div>
                      <div>
                        {usr.savedCount} Saved · {usr.points} XP
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedUserDetail(usr)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        View User Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chronological Student Login Sessions Log (Strictly Owner Admin Only) */}
      {isOwnerAdmin && analytics?.recentLogins?.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Each User Login Session History & Time Spent Log</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chronological audit log of every student & user login event, email address, authentication method, and session duration.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {analytics.recentLogins.length} Recorded Sessions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 font-medium">Student / User</th>
                  <th className="py-3 px-4 font-medium">Email</th>
                  <th className="py-3 px-4 font-medium">College & Cohort</th>
                  <th className="py-3 px-4 font-medium">Auth Method & Device</th>
                  <th className="py-3 px-4 font-medium">Session Time Spent</th>
                  <th className="py-3 px-4 font-medium text-right">Login Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {analytics.recentLogins.slice(0, 15).map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {log.userName}
                      <span className="ml-2 text-[10px] font-mono text-slate-400">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {log.userEmail}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {log.college} · {log.degree}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {log.method} · <span className="font-mono text-slate-400">{log.device}</span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                      {log.durationFormatted}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-right text-slate-500">
                      {formatDateTime(log.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Student / User Full Information Modal */}
      {isOwnerAdmin && selectedUserDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto"
          onClick={() => setSelectedUserDetail(null)}
        >
          <div
            className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-5 shadow-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-blue-600 dark:text-blue-400 mb-1">
                  <span>{selectedUserDetail.role} ACCOUNT</span>
                  <span>·</span>
                  <span>
                    {selectedUserDetail.isOnlineNow ? '● Active Online Now' : selectedUserDetail.activityStatus}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedUserDetail.name} (@{selectedUserDetail.username})
                </h3>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  Email: {selectedUserDetail.email} · UID: {selectedUserDetail.uid}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Key User Login & Time Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50">
                <p className="text-slate-500">Total Time Spent</p>
                <p className="text-base font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {selectedUserDetail.totalTimeFormatted}
                </p>
              </div>
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50">
                <p className="text-slate-500">Total Logins</p>
                <p className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                  {selectedUserDetail.loginCount} Sessions
                </p>
              </div>
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50">
                <p className="text-slate-500">Last Session Time</p>
                <p className="text-base font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-0.5">
                  {selectedUserDetail.lastSessionFormatted}
                </p>
              </div>
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50">
                <p className="text-slate-500">Tracked Apps / XP</p>
                <p className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                  {selectedUserDetail.applicationsCount} Apps · {selectedUserDetail.points} XP
                </p>
              </div>
            </div>

            {/* Complete Academic & Profile Information */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white">
                Student Profile & Academic Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-slate-400">University / College: </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedUserDetail.college}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Degree & Branch: </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedUserDetail.degree} in {selectedUserDetail.branch}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Graduation Year & CGPA: </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    Class of {selectedUserDetail.graduationYear} · CGPA {selectedUserDetail.cgpa}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Location & Level: </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedUserDetail.city}, {selectedUserDetail.country} ·{' '}
                    {selectedUserDetail.experienceLevel}
                  </span>
                </div>
              </div>
              {selectedUserDetail.bio && (
                <p className="text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/70 dark:border-slate-800">
                  {selectedUserDetail.bio}
                </p>
              )}
              <div>
                <span className="text-slate-400">Verified Skills ({selectedUserDetail.skills?.length || 0}): </span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {(selectedUserDetail.skills || []).join(' · ') || 'None listed'}
                </span>
              </div>
              {selectedUserDetail.codingProfiles?.length > 0 && (
                <div>
                  <span className="text-slate-400">Connected Coding Profiles: </span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    {selectedUserDetail.codingProfiles.join(' · ')}
                  </span>
                </div>
              )}
            </div>

            {/* Individual Login Sessions for this User */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Individual Login Sessions for {selectedUserDetail.name}
              </h4>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 bg-slate-50 dark:bg-slate-900">
                      <th className="py-2 px-3 font-medium">Login Timestamp</th>
                      <th className="py-2 px-3 font-medium">Auth Method</th>
                      <th className="py-2 px-3 font-medium">Device / Session</th>
                      <th className="py-2 px-3 font-medium text-right">Time Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {(selectedUserDetail.loginHistory || []).map((lh: any) => (
                      <tr key={lh.id}>
                        <td className="py-2 px-3 font-mono tabular-nums text-slate-800 dark:text-slate-200">
                          {formatDateTime(lh.timestamp)}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                          {lh.method}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500">
                          {lh.device}
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 text-right">
                          {lh.durationFormatted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer"
              >
                Close User Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Chart (Admin Only) + Post Opportunity Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {isOwnerAdmin && (
          <div className="lg:col-span-7 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span>Opportunities Distribution by Category</span>
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.categoryBreakdown || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Post Opportunity Form (Organization & Admin) */}
        <div
          className={`${
            isOwnerAdmin ? 'lg:col-span-5' : 'lg:col-span-12'
          } p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span>
                {isOwnerAdmin
                  ? 'Post & Verify Opportunity'
                  : 'Organization Portal — Submit Opportunity'}
              </span>
            </h3>
            {isOwnerAdmin && (
              <button
                type="button"
                onClick={handleTriggerIngest}
                className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                + Run Partner Feed Sync
              </button>
            )}
          </div>

          {ingestMessage && (
            <p className="mb-3 p-2.5 rounded bg-blue-500/10 border border-blue-500/30 text-xs text-blue-600 dark:text-blue-300">
              {ingestMessage}
            </p>
          )}
          {formError && (
            <p className="mb-3 p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-300">
              {formError}
            </p>
          )}
          {formSuccess && (
            <p className="mb-3 p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-300">
              {formSuccess}
            </p>
          )}

          <form onSubmit={handleCreateOpp} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">Opportunity Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Stripe Distributed Ledger Summer Intern"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 mb-1">Organization</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="Internship">Internship</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Open Source">Open Source</option>
                  <option value="Scholarship">Scholarship</option>
                  <option value="Coding Contest">Coding Contest</option>
                  <option value="Research">Research</option>
                  <option value="Job">Job</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 mb-1">Compensation / Prize</label>
                <input
                  type="text"
                  value={stipend}
                  onChange={(e) => setStipend(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Deadline</label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">
                Official Application / Registration URL (Direct Portal)
              </label>
              <input
                type="url"
                required
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                placeholder="https://buildyourfuture.withgoogle.com/programs/..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Required Skills (comma-separated)</label>
              <input
                type="text"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer"
            >
              AI Verify & Publish Opportunity
            </button>
          </form>
        </div>
      </div>

      {/* Opportunity Listings / Admin Moderation Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isOwnerAdmin
                ? 'Opportunity Moderation & Workflow Queue'
                : 'Submitted & Active Organization Opportunities'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isOwnerAdmin
                ? 'Workflow: Draft → Pending Review → Approved → Published → Expired'
                : 'Listings submitted by partner organizations'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 font-medium">Opportunity</th>
                <th className="py-3 px-4 font-medium">Organization</th>
                <th className="py-3 px-4 font-medium">Category</th>
                <th className="py-3 px-4 font-medium">Deadline</th>
                <th className="py-3 px-4 font-medium">Status</th>
                {isOwnerAdmin && (
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {bundle.opportunities.slice(0, 25).map((opp) => (
                <tr key={opp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {opp.title}
                    {isOwnerAdmin && opp.isSeed && (
                      <span className="ml-2 text-[10px] font-mono text-slate-400">
                        [Seed]
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {opp.organization.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {opp.category}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {opp.deadline}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span
                      className={
                        opp.status === 'Published'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : opp.status === 'Pending Review'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }
                    >
                      {opp.status}
                    </span>
                  </td>
                  {isOwnerAdmin && (
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleStatusChange(opp.id, 'Published', !opp.featured)}
                        className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        {opp.featured ? 'Unfeature' : 'Feature'}
                      </button>
                      {opp.status !== 'Published' && (
                        <button
                          onClick={() => handleStatusChange(opp.id, 'Published')}
                          className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusChange(opp.id, 'Expired')}
                        className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        Expire
                      </button>
                      <button
                        onClick={() => handleDeleteOpp(opp.id)}
                        className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface OwnerDashboardUserMonitorProps {
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onOpenAdminConsole: () => void;
}

export const OwnerDashboardUserMonitor: React.FC<OwnerDashboardUserMonitorProps> = ({
  authFetch,
  onOpenAdminConsole,
}) => {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      const r = await authFetch('/api/admin/analytics');
      if (r.ok) {
        const d = await r.json();
        setAnalytics(d);
      }
    } catch {
      // ignore
    }
  }, [authFetch]);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 30000);
    return () => clearInterval(timer);
  }, [loadData]);

  if (!analytics) return null;

  const userDirectory: any[] = analytics.userDirectory || [];

  return (
    <div className="p-6 rounded-xl border border-emerald-500/30 bg-white dark:bg-slate-900/50 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Owner Live Telemetry · Student Logins & User Activity</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Logged-In Students, Active Users, Time Spent & User Information
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Live</span>
          </button>
          <button
            type="button"
            onClick={onOpenAdminConsole}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer"
          >
            Open Full Admin Console →
          </button>
        </div>
      </div>

      {/* 4 Summary Metrics for Student Logins & Time Spent */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
          <p className="text-xs text-slate-500 dark:text-slate-400">Active Users Online</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {analytics.activeUsers} Active
          </p>
          <p className="text-[11px] font-mono text-slate-500 mt-0.5">
            {analytics.activeStudentLogins} Students Online Now
          </p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Student Logins</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-1">
            {analytics.totalStudentLogins} Logins
          </p>
          <p className="text-[11px] font-mono text-slate-500 mt-0.5">
            Across {analytics.totalStudents} Student Accounts
          </p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Registered Users</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {analytics.totalUsers} Users
          </p>
          <p className="text-[11px] font-mono text-slate-500 mt-0.5">
            {analytics.totalLoginSessions} Total Login Sessions
          </p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
          <p className="text-xs text-slate-500 dark:text-slate-400">Platform Time Spent</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {analytics.totalTimeSpentFormatted}
          </p>
          <p className="text-[11px] font-mono text-slate-500 mt-0.5">
            Avg {analytics.averageTimeSpentFormatted} per user
          </p>
        </div>
      </div>

      {/* Compact Student & User Login Details Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50">
              <th className="py-2.5 px-3.5 font-medium">Student / User</th>
              <th className="py-2.5 px-3.5 font-medium">Email Address</th>
              <th className="py-2.5 px-3.5 font-medium">College, Degree & Skills</th>
              <th className="py-2.5 px-3.5 font-medium">Status & Logins</th>
              <th className="py-2.5 px-3.5 font-medium">Time Spent</th>
              <th className="py-2.5 px-3.5 font-medium">Last Login</th>
              <th className="py-2.5 px-3.5 font-medium text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {userDirectory.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="py-3 px-3.5 font-semibold text-slate-900 dark:text-white">
                  {u.name}
                  <span className="block text-[11px] font-mono font-normal text-slate-400">
                    @{u.username} · {u.role}
                  </span>
                </td>
                <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300">
                  {u.email}
                </td>
                <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 max-w-xs">
                  <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {u.college} · {u.degree} ({u.graduationYear})
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    CGPA {u.cgpa} · {(u.skills || []).slice(0, 4).join(' · ')}
                  </div>
                </td>
                <td className="py-3 px-3.5 font-mono tabular-nums">
                  <span
                    className={
                      u.isOnlineNow
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-amber-600 dark:text-amber-400'
                    }
                  >
                    {u.isOnlineNow ? '● Active Now' : u.activityStatus}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    {u.loginCount} Logins · {u.applicationsCount} Apps
                  </span>
                </td>
                <td className="py-3 px-3.5 font-mono tabular-nums">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {u.totalTimeFormatted}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    Last: {u.lastSessionFormatted}
                  </span>
                </td>
                <td className="py-3 px-3.5 font-mono tabular-nums text-slate-500">
                  {u.lastLoginMethod}
                  <span className="block text-[11px] text-slate-400">{u.lastDevice}</span>
                </td>
                <td className="py-3 px-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(u)}
                    className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/10 cursor-pointer"
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedUser.name} ({selectedUser.email})
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedUser.college} · {selectedUser.degree} in {selectedUser.branch} · Class of{' '}
                  {selectedUser.graduationYear} · CGPA {selectedUser.cgpa}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900">
                <span className="text-slate-400 block">Total Time Spent</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedUser.totalTimeFormatted}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900">
                <span className="text-slate-400 block">Total Logins</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedUser.loginCount} Sessions
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900">
                <span className="text-slate-400 block">Applications</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {selectedUser.applicationsCount} Tracked
                </span>
              </div>
            </div>

            <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
              <p>
                <span className="text-slate-400">Location:</span> {selectedUser.city},{' '}
                {selectedUser.country} · <span className="text-slate-400">Level:</span>{' '}
                {selectedUser.experienceLevel}
              </p>
              <p>
                <span className="text-slate-400">Skills:</span>{' '}
                {(selectedUser.skills || []).join(' · ')}
              </p>
              <p>
                <span className="text-slate-400">Last Login Method:</span>{' '}
                {selectedUser.lastLoginMethod} ({selectedUser.lastDevice})
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
