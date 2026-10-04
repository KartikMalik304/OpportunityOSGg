import React, { useState, useEffect } from 'react';
import {
  Crosshair,
  PlusCircle,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Zap,
  Send,
  ShieldCheck,
  Database,
  ExternalLink,
  Clock,
  Lock,
  Unlock,
} from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  db as firestoreDb,
  auth as firebaseAuth,
  OperationType,
  handleFirestoreError,
} from '../lib/firebase.ts';
import { DashboardBundle } from '../types/opportunity.ts';

export interface FocusFeatureItem {
  id: string;
  title: string;
  category:
    | 'Hackathons'
    | 'Internships'
    | 'Resume & Profile'
    | 'Roadmaps'
    | 'Coding & GitHub'
    | 'Applications'
    | 'Custom Feature';
  description: string;
  priority: 'High' | 'Medium' | 'Critical';
  status: 'active' | 'completed' | 'archived';
  targetMinutes: number;
  completedMinutes: number;
  checklistItems: string[];
  completedChecklistCount: number;
  ownerId: string;
  syncedVia?: 'firestore' | 'postgresql';
}

interface FocusModeStudioProps {
  bundle: DashboardBundle;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  focusModeEnabled: boolean;
  onToggleFocusMode: (enabled: boolean) => void;
  distractionFreeLock: boolean;
  onToggleDistractionFreeLock: (locked: boolean) => void;
  activeFocusedFeature: FocusFeatureItem | null;
  onSelectFocusedFeature: (feature: FocusFeatureItem) => void;
  onLaunchWorkspaceAction: (category: FocusFeatureItem['category']) => void;
  onGoogleLogin: () => Promise<void>;
  timerSecondsLeft: number;
  timerRunning: boolean;
  onStartPauseTimer: () => void;
  onResetTimer: (minutes?: number) => void;
  onCompleteSprint: () => Promise<void>;
}

const PRESET_FEATURE_TEMPLATES: Array<{
  title: string;
  category: FocusFeatureItem['category'];
  description: string;
  priority: FocusFeatureItem['priority'];
  targetMinutes: number;
  checklistItems: string[];
}> = [
  {
    title: 'Add Verified Hackathon / Internship Listing',
    category: 'Hackathons',
    description:
      'Focus on submitting and verifying a live hackathon or internship URL with AI authenticity checks.',
    priority: 'Critical',
    targetMinutes: 25,
    checklistItems: [
      'Locate official registration / application URL (Devpost, MLH, Unstop, or company portal)',
      'Verify application deadline and eligibility cohort requirements',
      'Run AI Authenticity & Live URL Reachability Check in OpportunityOS',
      'Publish verified opportunity to the platform feed (+50 XP)',
    ],
  },
  {
    title: 'Resume AI Skill Extraction & ATS Optimization Sprint',
    category: 'Resume & Profile',
    description:
      'Parse latest resume text, extract technical skills, and boost match scores across all internships.',
    priority: 'High',
    targetMinutes: 25,
    checklistItems: [
      'Paste updated resume text into the AI Resume Parser',
      'Review extracted skills and missing high-demand keywords',
      'Quantify engineering latency/impact metrics in top 2 project bullets',
      'Recalculate eligibility across 80%+ match internships',
    ],
  },
  {
    title: 'High-Match Internship Application & Referral Sprint',
    category: 'Internships',
    description:
      'Complete and log 3 high-match software engineering internship applications without context switching.',
    priority: 'Critical',
    targetMinutes: 45,
    checklistItems: [
      'Filter Discover feed to Eligible + 85%+ Match internships',
      'Tailor resume summary and submit direct application form',
      'Log application status, resume version, and referral in Kanban Tracker',
      'Add deadline & interview follow-up reminder to Calendar',
    ],
  },
  {
    title: 'Custom AI Learning Roadmap & Milestone Builder',
    category: 'Roadmaps',
    description:
      'Generate a structured 6-step engineering roadmap and complete the first hands-on project checkpoint.',
    priority: 'High',
    targetMinutes: 45,
    checklistItems: [
      'Enter target role prompt in the AI Roadmap Generator',
      'Review generated 6-step curriculum and required skills',
      'Complete Step 1 core problem set and push code to GitHub',
      'Mark milestone In Progress / Completed to update Readiness Score',
    ],
  },
];

export const FocusModeStudio: React.FC<FocusModeStudioProps> = ({
  bundle,
  authFetch,
  focusModeEnabled,
  onToggleFocusMode,
  distractionFreeLock,
  onToggleDistractionFreeLock,
  activeFocusedFeature,
  onSelectFocusedFeature,
  onLaunchWorkspaceAction,
  onGoogleLogin,
  timerSecondsLeft,
  timerRunning,
  onStartPauseTimer,
  onResetTimer,
  onCompleteSprint,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(() => firebaseAuth.currentUser);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [features, setFeatures] = useState<FocusFeatureItem[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState<boolean>(true);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // "+ Add Particular Feature" Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FocusFeatureItem['category']>('Hackathons');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<FocusFeatureItem['priority']>('High');
  const [targetMinutes, setTargetMinutes] = useState<number>(25);
  const [checklistInput, setChecklistInput] = useState('');
  const [draftChecklist, setDraftChecklist] = useState<string[]>([
    'Define core objective and deliverables for this feature',
    'Execute primary action in a distraction-free 25m sprint',
    'Verify output and sync progress to database',
  ]);
  const [generatingFastPlan, setGeneratingFastPlan] = useState(false);
  const [fastAiTip, setFastAiTip] = useState<string | null>(null);
  const [savingFeature, setSavingFeature] = useState(false);

  // Fast AI Co-Pilot State (gemini-3.1-flash-lite)
  const [copilotPrompt, setCopilotPrompt] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<
    Array<{ role: 'user' | 'assistant'; text: string; model?: string }>
  >([
    {
      role: 'assistant',
      text: 'Fast Focus Co-Pilot ready (Gemini 3.1 Flash Lite). Select or add a particular feature to break down tasks, draft submissions, or get instant execution tips.',
      model: 'gemini-3.1-flash-lite',
    },
  ]);

  // New checklist item input for the active feature
  const [newActiveStepText, setNewActiveStepText] = useState('');

  // Track Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      setFirebaseUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Load Focus Features: Real-time Firestore listener when Firebase user is verified, plus PostgreSQL API sync
  useEffect(() => {
    let unsubFirestore: (() => void) | null = null;

    async function loadFromPostgres() {
      setLoadingFeatures(true);
      try {
        const res = await authFetch('/api/focus-features');
        if (res.ok) {
          const data = await res.json();
          const loaded: FocusFeatureItem[] = (data.features || []).map((f: any) => ({
            id: String(f.id),
            title: String(f.title || 'Focused Feature'),
            category: f.category || 'Custom Feature',
            description: String(f.description || ''),
            priority: f.priority || 'High',
            status: f.status || 'active',
            targetMinutes: Number(f.targetMinutes) || 25,
            completedMinutes: Number(f.completedMinutes) || 0,
            checklistItems: Array.isArray(f.checklistItems) ? f.checklistItems : [],
            completedChecklistCount: Number(f.completedChecklistCount) || 0,
            ownerId: String(f.ownerId || bundle.user.uid),
            syncedVia: 'postgresql',
          }));
          if (loaded.length > 0) {
            setFeatures(loaded);
            if (!activeFocusedFeature) {
              onSelectFocusedFeature(loaded[0]);
            }
          } else {
            // Seed default starter features in UI if none exist yet
            const defaults: FocusFeatureItem[] = PRESET_FEATURE_TEMPLATES.map((tpl, idx) => ({
              id: `default_feat_${idx + 1}`,
              title: tpl.title,
              category: tpl.category,
              description: tpl.description,
              priority: tpl.priority,
              status: 'active',
              targetMinutes: tpl.targetMinutes,
              completedMinutes: 0,
              checklistItems: tpl.checklistItems,
              completedChecklistCount: 0,
              ownerId: bundle.user.uid,
              syncedVia: 'postgresql',
            }));
            setFeatures(defaults);
            if (!activeFocusedFeature) {
              onSelectFocusedFeature(defaults[0]);
            }
          }
        }
      } catch {
        // ignore
      } finally {
        setLoadingFeatures(false);
      }
    }

    if (authReady && firebaseUser && firebaseUser.emailVerified) {
      const path = 'focus_features';
      const q = query(
        collection(firestoreDb, path),
        where('ownerId', '==', firebaseUser.uid)
      );
      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          const firestoreItems: FocusFeatureItem[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: String(data.title || ''),
              category: (data.category as FocusFeatureItem['category']) || 'Custom Feature',
              description: String(data.description || ''),
              priority: (data.priority as FocusFeatureItem['priority']) || 'High',
              status: (data.status as FocusFeatureItem['status']) || 'active',
              targetMinutes: Number(data.targetMinutes) || 25,
              completedMinutes: Number(data.completedMinutes) || 0,
              checklistItems: Array.isArray(data.checklistItems)
                ? data.checklistItems.map(String)
                : [],
              completedChecklistCount: Number(data.completedChecklistCount) || 0,
              ownerId: String(data.ownerId || firebaseUser.uid),
              syncedVia: 'firestore',
            };
          });
          if (firestoreItems.length > 0) {
            setFeatures(firestoreItems);
            setLoadingFeatures(false);
            if (!activeFocusedFeature) {
              onSelectFocusedFeature(firestoreItems[0]);
            }
          } else {
            loadFromPostgres();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, path);
        }
      );
    } else if (authReady) {
      loadFromPostgres();
    }

    return () => {
      if (unsubFirestore) unsubFirestore();
    };
  }, [authReady, firebaseUser?.uid, firebaseUser?.emailVerified]);

  const showTemporaryNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3500);
  };

  // Fast AI Blueprint Generator (gemini-3.1-flash-lite)
  const handleGenerateFastAiPlan = async () => {
    const targetTitle = title.trim() || `${category} Focus Feature`;
    setGeneratingFastPlan(true);
    try {
      const res = await authFetch('/api/ai/fast-focus-plan', {
        method: 'POST',
        body: JSON.stringify({
          title: targetTitle,
          category,
          description,
        }),
      });
      const data = await res.json();
      if (data.summary) setDescription(String(data.summary).slice(0, 1000));
      if (Array.isArray(data.checklistItems) && data.checklistItems.length > 0) {
        setDraftChecklist(
          data.checklistItems.slice(0, 20).map((s: any) => String(s).slice(0, 240))
        );
      }
      if (data.suggestedDurationMinutes) {
        setTargetMinutes(
          Math.max(5, Math.min(480, Number(data.suggestedDurationMinutes) || 25))
        );
      }
      if (data.quickTip) {
        setFastAiTip(String(data.quickTip));
      }
      if (!title.trim()) {
        setTitle(targetTitle);
      }
      showTemporaryNotice('⚡ Fast AI (Gemini 3.1 Flash Lite) generated your feature blueprint!');
    } catch {
      showTemporaryNotice('Unable to generate Fast AI plan right now.');
    } finally {
      setGeneratingFastPlan(false);
    }
  };

  // Add a Particular Feature & Activate Focus Mode
  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSavingFeature(true);

    // Defensive payload sanitization matching firebase-blueprint.json
    const safeId = `feat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`.replace(
      /[^a-zA-Z0-9_-]/g,
      '_'
    );
    const safeTitle = title.trim().slice(0, 140);
    const safeDescription = (
      description.trim() || `Focused execution workflow for ${safeTitle} in ${category}.`
    ).slice(0, 1000);
    const safeTargetMinutes = Math.max(5, Math.min(480, Number(targetMinutes) || 25));
    const safeChecklist = draftChecklist
      .map((item) => item.trim().slice(0, 240))
      .filter(Boolean)
      .slice(0, 20);

    const newFeature: FocusFeatureItem = {
      id: safeId,
      title: safeTitle,
      category,
      description: safeDescription,
      priority,
      status: 'active',
      targetMinutes: safeTargetMinutes,
      completedMinutes: 0,
      checklistItems:
        safeChecklist.length > 0
          ? safeChecklist
          : [`Complete core execution for ${safeTitle}`],
      completedChecklistCount: 0,
      ownerId: firebaseUser?.uid || bundle.user.uid,
      syncedVia: firebaseUser && firebaseUser.emailVerified ? 'firestore' : 'postgresql',
    };

    try {
      // 1. Write to Firebase Firestore if signed in with verified Firebase Auth
      if (firebaseUser && firebaseUser.emailVerified) {
        const path = `focus_features/${safeId}`;
        try {
          await setDoc(doc(firestoreDb, 'focus_features', safeId), {
            title: newFeature.title,
            category: newFeature.category,
            description: newFeature.description,
            priority: newFeature.priority,
            status: newFeature.status,
            targetMinutes: newFeature.targetMinutes,
            completedMinutes: 0,
            checklistItems: newFeature.checklistItems,
            completedChecklistCount: 0,
            ownerId: firebaseUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }

      // 2. Mirror to PostgreSQL backend so all sessions stay in sync
      await authFetch('/api/focus-features', {
        method: 'POST',
        body: JSON.stringify(newFeature),
      });

      setFeatures((prev) => [newFeature, ...prev]);
      onSelectFocusedFeature(newFeature);
      onToggleFocusMode(true);
      onResetTimer(newFeature.targetMinutes);

      // Reset form
      setTitle('');
      setDescription('');
      setFastAiTip(null);
      showTemporaryNotice(
        `✓ Added "${newFeature.title}" & activated Focus Mode (${
          newFeature.syncedVia === 'firestore' ? 'Synced to Firebase Firestore' : 'Synced to Database'
        })`
      );
    } finally {
      setSavingFeature(false);
    }
  };

  // Increment/Toggle Checklist Progress on Active Feature
  const handleToggleChecklistStep = async (feature: FocusFeatureItem, stepIndex: number) => {
    const currentDone = feature.completedChecklistCount;
    const nextDone =
      stepIndex < currentDone
        ? Math.max(0, stepIndex)
        : Math.min(feature.checklistItems.length, stepIndex + 1);
    const nextStatus: FocusFeatureItem['status'] =
      nextDone >= feature.checklistItems.length && feature.checklistItems.length > 0
        ? 'completed'
        : 'active';

    const updatedFeature: FocusFeatureItem = {
      ...feature,
      completedChecklistCount: nextDone,
      status: nextStatus,
    };

    setFeatures((prev) =>
      prev.map((f) => (f.id === feature.id ? updatedFeature : f))
    );
    if (activeFocusedFeature?.id === feature.id) {
      onSelectFocusedFeature(updatedFeature);
    }

    if (firebaseUser && firebaseUser.emailVerified && feature.syncedVia === 'firestore') {
      const path = `focus_features/${feature.id}`;
      try {
        await updateDoc(doc(firestoreDb, 'focus_features', feature.id), {
          completedMinutes: updatedFeature.completedMinutes,
          checklistItems: updatedFeature.checklistItems,
          completedChecklistCount: updatedFeature.completedChecklistCount,
          status: updatedFeature.status,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }

    await authFetch(`/api/focus-features/${feature.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        completedChecklistCount: updatedFeature.completedChecklistCount,
        status: updatedFeature.status,
      }),
    }).catch(() => {});
  };

  // Add a sub-step to the currently focused feature
  const handleAddStepToActiveFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFocusedFeature || !newActiveStepText.trim()) return;
    if (activeFocusedFeature.checklistItems.length >= 20) {
      showTemporaryNotice('Maximum 20 checklist steps reached for this feature.');
      return;
    }

    const cleanStep = newActiveStepText.trim().slice(0, 240);
    const updatedChecklist = [...activeFocusedFeature.checklistItems, cleanStep].slice(0, 20);
    const updatedFeature: FocusFeatureItem = {
      ...activeFocusedFeature,
      checklistItems: updatedChecklist,
      status: 'active',
    };

    setNewActiveStepText('');
    setFeatures((prev) =>
      prev.map((f) => (f.id === updatedFeature.id ? updatedFeature : f))
    );
    onSelectFocusedFeature(updatedFeature);

    if (
      firebaseUser &&
      firebaseUser.emailVerified &&
      updatedFeature.syncedVia === 'firestore'
    ) {
      const path = `focus_features/${updatedFeature.id}`;
      try {
        await updateDoc(doc(firestoreDb, 'focus_features', updatedFeature.id), {
          completedMinutes: updatedFeature.completedMinutes,
          checklistItems: updatedFeature.checklistItems,
          completedChecklistCount: updatedFeature.completedChecklistCount,
          status: updatedFeature.status,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }

    await authFetch(`/api/focus-features/${updatedFeature.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        checklistItems: updatedFeature.checklistItems,
        status: updatedFeature.status,
      }),
    }).catch(() => {});
  };

  const handleDeleteFeature = async (feature: FocusFeatureItem) => {
    setFeatures((prev) => prev.filter((f) => f.id !== feature.id));
    if (activeFocusedFeature?.id === feature.id) {
      const remaining = features.filter((f) => f.id !== feature.id);
      if (remaining.length > 0) onSelectFocusedFeature(remaining[0]);
    }

    if (firebaseUser && firebaseUser.emailVerified && feature.syncedVia === 'firestore') {
      const path = `focus_features/${feature.id}`;
      try {
        await deleteDoc(doc(firestoreDb, 'focus_features', feature.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }

    await authFetch(`/api/focus-features/${feature.id}`, {
      method: 'DELETE',
    }).catch(() => {});
    showTemporaryNotice(`Removed "${feature.title}" from Focus Mode.`);
  };

  const handleAskFastCopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotPrompt.trim()) return;
    const qText = copilotPrompt.trim();
    setCopilotPrompt('');
    setCopilotMessages((prev) => [...prev, { role: 'user', text: qText }]);
    setCopilotLoading(true);
    try {
      const res = await authFetch('/api/ai/fast-focus-chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: qText,
          activeFeatureTitle: activeFocusedFeature?.title || 'OpportunityOS Feature',
          activeFeatureCategory: activeFocusedFeature?.category || category,
          checklistItems: activeFocusedFeature?.checklistItems || draftChecklist,
        }),
      });
      const data = await res.json();
      setCopilotMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || 'Stay focused on your current checklist milestone.',
          model: data.modelUsed || 'gemini-3.1-flash-lite',
        },
      ]);
    } catch {
      setCopilotMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Unable to reach Fast Focus Co-Pilot right now.',
        },
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      {/* Top Status Banner */}
      {statusNotice && (
        <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
          <span>{statusNotice}</span>
          <button
            onClick={() => setStatusNotice(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Focus Mode Master Control Bar */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-blue-600 dark:text-blue-400">
              <Crosshair className="w-3.5 h-3.5" />
              <span>FOCUS MODE STUDIO · DEEP-WORK & PARTICULAR FEATURE BUILDER</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Database className="w-3 h-3" />
                {firebaseUser && firebaseUser.emailVerified
                  ? 'Firebase Firestore Live Sync Active'
                  : 'PostgreSQL + Firebase Ready'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Focus Mode: Lock On & Add a Particular Feature
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
              Activate Focus Mode to isolate a single OpportunityOS feature or add your own custom feature workflow with sub-second Gemini 3.1 Flash Lite checklists and real-time Firebase Firestore persistence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!firebaseUser && (
              <button
                type="button"
                onClick={onGoogleLogin}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>Connect Google for Firestore Cloud Sync</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onToggleDistractionFreeLock(!distractionFreeLock)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                distractionFreeLock
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-300'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {distractionFreeLock ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sidebar Hidden (Isolated)</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Hide Sidebar Distractions</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onToggleFocusMode(!focusModeEnabled)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs ${
                focusModeEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              <Crosshair className="w-4 h-4" />
              <span>{focusModeEnabled ? 'Focus Mode: ON (Active)' : 'Turn Focus Mode ON'}</span>
            </button>
          </div>
        </div>

        {/* Quick Preset Feature Selector Bar */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Quick-Focus a Particular Feature:
            </span>
            {PRESET_FEATURE_TEMPLATES.map((tpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  const existing = features.find((f) => f.title === tpl.title);
                  if (existing) {
                    onSelectFocusedFeature(existing);
                  } else {
                    const created: FocusFeatureItem = {
                      id: `preset_${idx + 1}`,
                      title: tpl.title,
                      category: tpl.category,
                      description: tpl.description,
                      priority: tpl.priority,
                      status: 'active',
                      targetMinutes: tpl.targetMinutes,
                      completedMinutes: 0,
                      checklistItems: tpl.checklistItems,
                      completedChecklistCount: 0,
                      ownerId: firebaseUser?.uid || bundle.user.uid,
                    };
                    onSelectFocusedFeature(created);
                  }
                  onToggleFocusMode(true);
                  onResetTimer(tpl.targetMinutes);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                  activeFocusedFeature?.title === tpl.title
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-blue-500/50'
                }`}
              >
                {tpl.category}: {tpl.title.split(' ').slice(0, 3).join(' ')}…
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 12-Column Focus Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT 7 COLS: Active Focused Feature Execution Canvas + "+ Add Particular Feature" Builder */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Active Focused Feature Workspace Card */}
          {activeFocusedFeature && (
            <div className="p-6 rounded-xl border-2 border-blue-500/60 bg-white dark:bg-slate-900/60 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      ACTIVE FOCUSED FEATURE
                    </span>
                    <span>·</span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {activeFocusedFeature.category}
                    </span>
                    <span>·</span>
                    <span
                      className={
                        activeFocusedFeature.priority === 'Critical'
                          ? 'text-rose-600 dark:text-rose-400 font-semibold'
                          : activeFocusedFeature.priority === 'High'
                          ? 'text-amber-600 dark:text-amber-400 font-semibold'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }
                    >
                      {activeFocusedFeature.priority} Priority
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {activeFocusedFeature.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeFocusedFeature.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onLaunchWorkspaceAction(activeFocusedFeature.category)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Open {activeFocusedFeature.category} Feature</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Deep-Work Focus Timer Strip */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {formatTimer(timerSecondsLeft)}
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Deep-Work Sprint Timer
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      Target: {activeFocusedFeature.targetMinutes}m · Completed:{' '}
                      {activeFocusedFeature.completedMinutes}m
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[15, 25, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => onResetTimer(mins)}
                      className="px-2.5 py-1 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      {mins}m
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={onStartPauseTimer}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg cursor-pointer ${
                      timerRunning
                        ? 'bg-amber-600 hover:bg-amber-500'
                        : 'bg-blue-600 hover:bg-blue-500'
                    }`}
                  >
                    {timerRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Focus</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onResetTimer(activeFocusedFeature.targetMinutes)}
                    title="Reset Timer"
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={onCompleteSprint}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete Sprint</span>
                  </button>
                </div>
              </div>

              {/* Interactive Checklist for the Active Focused Feature */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Focused Execution Checklist ({activeFocusedFeature.completedChecklistCount}/
                    {activeFocusedFeature.checklistItems.length} Completed)
                  </span>
                  <span className="font-mono tabular-nums text-blue-600 dark:text-blue-400">
                    {activeFocusedFeature.checklistItems.length > 0
                      ? Math.round(
                          (activeFocusedFeature.completedChecklistCount /
                            activeFocusedFeature.checklistItems.length) *
                            100
                        )
                      : 0}
                    % Done
                  </span>
                </div>

                <div className="space-y-2">
                  {activeFocusedFeature.checklistItems.map((step, idx) => {
                    const isDone = idx < activeFocusedFeature.completedChecklistCount;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleToggleChecklistStep(activeFocusedFeature, idx)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors flex items-start gap-3 text-xs cursor-pointer ${
                          isDone
                            ? 'border-emerald-500/40 bg-emerald-500/5 text-slate-500 dark:text-slate-400 line-through'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 text-slate-900 dark:text-white hover:border-blue-500/50'
                        }`}
                      >
                        <span
                          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center text-[10px] font-mono shrink-0 ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : 'border border-slate-400 dark:border-slate-600 text-slate-500'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Add Sub-Step to Active Feature */}
                <form onSubmit={handleAddStepToActiveFeature} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newActiveStepText}
                    onChange={(e) => setNewActiveStepText(e.target.value)}
                    maxLength={240}
                    placeholder="Add a specific sub-step or requirement to this focused feature..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    + Add Step
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 2. "+ Add Particular Feature" Builder Form */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  + Add Particular Feature to Focus Mode
                </h3>
              </div>
              <button
                type="button"
                onClick={handleGenerateFastAiPlan}
                disabled={generatingFastPlan}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  {generatingFastPlan
                    ? 'Generating with Gemini 3.1 Flash Lite…'
                    : '⚡ Fast AI Auto-Fill Steps'}
                </span>
              </button>
            </div>

            <form onSubmit={handleCreateFeature} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Particular Feature / Focus Goal Title *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={140}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Add Hackathon Team Matcher, Stripe SWE Prep, GSoC Proposal..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Target Module
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as FocusFeatureItem['category'])
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="Hackathons">Hackathons</option>
                    <option value="Internships">Internships</option>
                    <option value="Resume & Profile">Resume & Profile</option>
                    <option value="Roadmaps">Roadmaps</option>
                    <option value="Coding & GitHub">Coding & GitHub</option>
                    <option value="Applications">Applications</option>
                    <option value="Custom Feature">Custom Feature</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as FocusFeatureItem['priority'])
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="Critical">Critical Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Focus Sprint Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={targetMinutes}
                    onChange={(e) => setTargetMinutes(Number(e.target.value) || 25)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Feature Specification / Objective
                </label>
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the exact feature workflow or milestone you want to focus on..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                />
              </div>

              {fastAiTip && (
                <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5 text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    ⚡ Fast AI Tip:{' '}
                  </span>
                  {fastAiTip}
                </div>
              )}

              {/* Draft Checklist Preview & Editor */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Actionable Checklist Steps ({draftChecklist.length}/20)
                </label>
                <div className="space-y-1.5">
                  {draftChecklist.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    >
                      <span className="truncate">
                        {i + 1}. {item}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftChecklist((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={240}
                    value={checklistInput}
                    onChange={(e) => setChecklistInput(e.target.value)}
                    placeholder="Add custom checklist step..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!checklistInput.trim() || draftChecklist.length >= 20) return;
                      setDraftChecklist((prev) => [
                        ...prev,
                        checklistInput.trim().slice(0, 240),
                      ]);
                      setChecklistInput('');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Add Step
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={savingFeature || !title.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Crosshair className="w-4 h-4" />
                  <span>
                    {savingFeature
                      ? 'Saving & Activating Focus Mode…'
                      : 'Add Feature & Lock Focus Mode ON'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT 5 COLS: Saved Focus Features Queue + Fast AI Co-Pilot (Gemini 3.1 Flash Lite) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Fast AI Focus Co-Pilot (gemini-3.1-flash-lite) */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex flex-col h-[390px]">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Fast AI Focus Co-Pilot
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">
                    Powered by gemini-3.1-flash-lite · Low-Latency Responses
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 text-xs">
              {copilotMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg whitespace-pre-wrap leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white ml-6'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 mr-4 border border-slate-200/70 dark:border-slate-800'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {copilotLoading && (
                <p className="text-[11px] font-mono text-blue-600 dark:text-blue-400 animate-pulse">
                  ⚡ Gemini 3.1 Flash Lite generating instant response…
                </p>
              )}
            </div>

            <div className="py-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5">
              {[
                'Break this feature into 3 10-minute tasks',
                'Write a winning hackathon pitch for this feature',
                'What blockers should I watch out for?',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCopilotPrompt(preset)}
                  className="text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-blue-500 cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            <form onSubmit={handleAskFastCopilot} className="pt-2 flex gap-2">
              <input
                type="text"
                value={copilotPrompt}
                onChange={(e) => setCopilotPrompt(e.target.value)}
                placeholder="Ask Fast AI about your focused feature..."
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={copilotLoading}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* 2. Your Added Focus Features Queue (Firestore + PostgreSQL) */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Your Particular Features Queue ({features.length})
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                Click any item to focus
              </span>
            </div>

            {loadingFeatures ? (
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-slate-200/60 dark:bg-slate-900 animate-pulse" />
                <div className="h-16 rounded-lg bg-slate-200/60 dark:bg-slate-900 animate-pulse" />
              </div>
            ) : features.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No custom features added yet. Use the "+ Add Particular Feature" form to create one.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {features.map((feat) => {
                  const isSelected = activeFocusedFeature?.id === feat.id;
                  return (
                    <div
                      key={feat.id}
                      className={`p-3.5 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-500/5'
                          : 'border-slate-200 dark:border-slate-800 hover:border-blue-500/40'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectFocusedFeature(feat);
                          onToggleFocusMode(true);
                          onResetTimer(feat.targetMinutes);
                        }}
                        className="text-left flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-500 mb-0.5">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">
                            {feat.category}
                          </span>
                          <span>·</span>
                          <span>{feat.priority}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {feat.targetMinutes}m
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {feat.title}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-1">
                          Checklist: {feat.completedChecklistCount}/{feat.checklistItems.length} steps ·{' '}
                          {feat.status === 'completed' ? '✓ Completed' : 'In Progress'}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFeature(feat)}
                        title="Remove feature"
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
