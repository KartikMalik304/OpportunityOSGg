import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  Check,
  UserPlus,
  LogIn,
  Sparkles,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';

interface AuthModalProps {
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onLoginEmail: (email: string, password?: string) => Promise<void>;
  onSignupProfile: (payload: Record<string, any>) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  onQuickRoleLogin: (role: 'STUDENT' | 'ADMIN' | 'ORGANIZATION') => void;
}

const SKILL_OPTIONS = [
  'Python',
  'TypeScript',
  'JavaScript',
  'React',
  'Next.js',
  'Node.js',
  'C++',
  'Java',
  'Go',
  'Rust',
  'SQL',
  'PostgreSQL',
  'Machine Learning',
  'Deep Learning',
  'PyTorch',
  'TensorFlow',
  'NLP',
  'Data Science',
  'Docker',
  'Kubernetes',
  'AWS',
  'Linux',
  'Data Structures',
  'Algorithms',
  'Git',
];

const GOAL_OPTIONS = [
  'Internship',
  'Hackathon',
  'Open source',
  'Scholarship',
  'Research',
  'Coding Contest',
  'Full-time job',
];

const INTEREST_OPTIONS = [
  'Web Development',
  'AI/ML',
  'Open Source',
  'Competitive Programming',
  'Cloud',
  'Data Science',
  'Cybersecurity',
  'DevOps',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'signup',
  onClose,
  onLoginEmail,
  onSignupProfile,
  onGoogleLogin,
  onQuickRoleLogin,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login State (Empty by default — no pre-filled email or password)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'ORGANIZATION'>('STUDENT');
  const [college, setCollege] = useState('Indian Institute of Technology');
  const [degree, setDegree] = useState('B.Tech');
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [graduationYear, setGraduationYear] = useState(2027);
  const [cgpa, setCgpa] = useState('8.8');
  const [country, setCountry] = useState('India');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'Python',
    'TypeScript',
    'React',
    'Data Structures',
    'Git',
  ]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'Internship',
    'Hackathon',
    'Open source',
  ]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Web Development',
    'AI/ML',
    'Open Source',
  ]);

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((x) => x !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onLoginEmail(loginEmail, loginPassword);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Unable to sign in. Please verify your email or create a new account.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError('Please enter your full name and email address.');
      return;
    }
    setLoading(true);
    try {
      await onSignupProfile({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        college,
        degree,
        branch,
        graduationYear,
        cgpa,
        country,
        experienceLevel,
        skills: selectedSkills,
        careerGoals: selectedGoals,
        interests: selectedInterests,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden my-8">
        {/* Top Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-600 dark:text-blue-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>OpportunityOS Account & Personalization Engine</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {mode === 'signup'
                ? 'Create Your Account for Personalized Opportunities'
                : 'Sign In to Your OpportunityOS Workspace'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50/40 dark:bg-slate-900/20">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              mode === 'login'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Log In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create New Account (Sign Up)</span>
          </button>
        </div>

        <div className="p-6 max-h-[78vh] overflow-y-auto space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-xs text-rose-600 dark:text-rose-300">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <div className="max-w-md mx-auto space-y-4">
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Account Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{loading ? 'Signing In & Matching Opportunities...' : 'Sign In to Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-200 dark:border-slate-800" />
                <span className="shrink mx-3 text-[11px] text-slate-400">OR</span>
                <div className="grow border-t border-slate-200 dark:border-slate-800" />
              </div>

              <button
                type="button"
                onClick={async () => {
                  await onGoogleLogin();
                  onClose();
                }}
                className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue with Google OAuth</span>
              </button>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  New to OpportunityOS?
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Create a personalized student account to unlock real-time eligibility checks and match scores tailored to your skills and graduation year.
                </p>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                >
                  Create a New Account →
                </button>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onQuickRoleLogin('ORGANIZATION');
                    onClose();
                  }}
                  className="w-full px-3 py-2 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer text-center"
                >
                  Sign In as Recruiter / Organization Portal
                </button>
              </div>
            </div>
          ) : (
            /* SIGN UP / CREATE NEW ACCOUNT FORM */
            <form onSubmit={handleSignupSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@college.edu"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Academic & Eligibility Profile Section */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                    <GraduationCap className="w-4 h-4 text-blue-500" />
                    <span>Academic & Eligibility Profile (Used to Match Your Opportunities)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setRole('STUDENT')}
                      className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                        role === 'STUDENT'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-500 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('ORGANIZATION')}
                      className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                        role === 'ORGANIZATION'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-500 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Recruiter / Org
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">College / University</label>
                    <input
                      type="text"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Degree</label>
                    <select
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      {['B.Tech', 'B.E.', 'M.Tech', 'B.Sc', 'BCA', 'MCA', 'MS', 'PhD'].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Branch / Major</label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Graduation Year</label>
                    <select
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      {[2025, 2026, 2027, 2028, 2029].map((yr) => (
                        <option key={yr} value={yr}>
                          Class of {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Current CGPA (out of 10)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Experience Level</label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      <option value="Beginner">Beginner (1st/2nd Year)</option>
                      <option value="Intermediate">Intermediate (Projects & DSA)</option>
                      <option value="Advanced">Advanced (Internships & Production)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Select Technical Skills */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-900 dark:text-white">
                    Select Your Skills ({selectedSkills.length} selected)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Used for 30% Skill Match & Gap Analysis
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SKILL_OPTIONS.map((sk) => {
                    const active = selectedSkills.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => toggleItem(selectedSkills, sk, setSelectedSkills)}
                        className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                            : 'border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                        }`}
                      >
                        {active ? `✓ ${sk}` : sk}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Select Target Opportunity Types & Domains */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
                    Target Opportunities
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {GOAL_OPTIONS.map((g) => {
                      const active = selectedGoals.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => toggleItem(selectedGoals, g, setSelectedGoals)}
                          className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                            active
                              ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                              : 'border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {active ? `✓ ${g}` : g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
                    Domain Interests
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {INTEREST_OPTIONS.map((intr) => {
                      const active = selectedInterests.includes(intr);
                      return (
                        <button
                          key={intr}
                          type="button"
                          onClick={() => toggleItem(selectedInterests, intr, setSelectedInterests)}
                          className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                            active
                              ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                              : 'border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {active ? `✓ ${intr}` : intr}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Saved to Cloud SQL PostgreSQL · Instant personalized feed</span>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {loading
                      ? 'Creating Account & Computing Matches...'
                      : 'Create Account & Show Relevant Opportunities'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
