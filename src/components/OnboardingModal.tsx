import React, { useState } from 'react';
import { X, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { DashboardBundle } from '../types/opportunity.ts';

interface OnboardingModalProps {
  bundle: DashboardBundle;
  onClose: () => void;
  onSaveProfile: (payload: Record<string, any>) => Promise<void>;
}

const INTEREST_OPTIONS = [
  'Web Development',
  'App Development',
  'AI/ML',
  'Data Science',
  'Cybersecurity',
  'Blockchain',
  'Cloud',
  'DevOps',
  'Open Source',
  'Competitive Programming',
  'Research',
  'Product',
  'Design',
  'Entrepreneurship',
];

const GOAL_OPTIONS = [
  'Internship',
  'Full-time job',
  'Open source',
  'Competitive programming',
  'Research',
  'Startup',
  'Higher studies',
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  bundle,
  onClose,
  onSaveProfile,
}) => {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(bundle.user.name || '');
  const [country, setCountry] = useState(bundle.profile.country || 'India');
  const [stateName, setStateName] = useState(bundle.profile.state || 'Maharashtra');
  const [city, setCity] = useState(bundle.profile.city || 'Mumbai');
  const [bio, setBio] = useState(bundle.profile.bio || '');

  const [college, setCollege] = useState(bundle.profile.college || 'Indian Institute of Technology Bombay');
  const [degree, setDegree] = useState(bundle.profile.degree || 'B.Tech');
  const [branch, setBranch] = useState(bundle.profile.branch || 'Computer Science & Engineering');
  const [graduationYear, setGraduationYear] = useState(bundle.profile.graduationYear || 2027);
  const [currentYear, setCurrentYear] = useState(bundle.profile.currentYear || 3);
  const [cgpa, setCgpa] = useState(bundle.profile.cgpa || '8.9');
  const [backlogs, setBacklogs] = useState(bundle.profile.backlogs || 0);

  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    bundle.skills.map((s) => s.name)
  );
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [interests, setInterests] = useState<string[]>(bundle.profile.interests || []);
  const [careerGoals, setCareerGoals] = useState<string[]>(bundle.profile.careerGoals || []);
  const [preferredWorkModes, setPreferredWorkModes] = useState<string[]>(
    bundle.profile.preferredWorkModes || ['Remote', 'Hybrid', 'On-site']
  );
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    bundle.profile.preferredLocations || ['India', 'International']
  );
  const [experienceLevel, setExperienceLevel] = useState(
    bundle.profile.experienceLevel || 'Intermediate'
  );

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleAddCustomSkill = () => {
    const rawParts = customSkillInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (rawParts.length === 0) return;

    const existingKnown = new Set(
      [...bundle.allAvailableSkills.map((s) => s.name), ...customSkills].map((s) =>
        s.toLowerCase()
      )
    );
    const nextCustom = [...customSkills];
    const nextSelected = [...selectedSkills];

    for (const part of rawParts) {
      const cleaned = part.slice(0, 45);
      if (!existingKnown.has(cleaned.toLowerCase())) {
        nextCustom.push(cleaned);
        existingKnown.add(cleaned.toLowerCase());
      }
      if (!nextSelected.some((k) => k.toLowerCase() === cleaned.toLowerCase())) {
        nextSelected.push(cleaned);
      }
    }

    setCustomSkills(nextCustom);
    setSelectedSkills(nextSelected);
    setCustomSkillInput('');
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await onSaveProfile({
        name,
        country,
        state: stateName,
        city,
        bio,
        college,
        degree,
        branch,
        graduationYear: Number(graduationYear),
        currentYear: Number(currentYear),
        cgpa,
        backlogs: Number(backlogs),
        skillNames: selectedSkills,
        interests,
        careerGoals,
        preferredWorkModes,
        preferredLocations,
        experienceLevel,
        onboardingCompleted: true,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const skillsByCategory: Record<string, string[]> = {};
  for (const sk of bundle.allAvailableSkills) {
    if (!skillsByCategory[sk.category]) skillsByCategory[sk.category] = [];
    skillsByCategory[sk.category].push(sk.name);
  }
  if (customSkills.length > 0) {
    if (!skillsByCategory['Custom']) skillsByCategory['Custom'] = [];
    for (const csk of customSkills) {
      if (!skillsByCategory['Custom'].includes(csk)) {
        skillsByCategory['Custom'].push(csk);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 sm:p-8 shadow-2xl my-8">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-xs font-mono text-blue-600 dark:text-blue-400">
              Student Opportunity Profile Wizard · Step {step} of 4
            </p>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {step === 1 && 'Personal & Geographic Profile'}
              {step === 2 && 'Academic & Cohort Eligibility'}
              {step === 3 && 'Technical Stack & Verified Skills'}
              {step === 4 && 'Career Goals, Interests & Work Preferences'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  State / Province
                </label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Developer Headline / Bio
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  University / College Name
                </label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Degree Program
                </label>
                <select
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="B.Tech">B.Tech</option>
                  <option value="B.E.">B.E.</option>
                  <option value="M.Tech">M.Tech</option>
                  <option value="B.Sc">B.Sc</option>
                  <option value="MS">MS</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Branch / Major
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Expected Graduation Year
                </label>
                <select
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {[2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Current Year of Study
                </label>
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {[1, 2, 3, 4, 5].map((yr) => (
                    <option key={yr} value={yr}>
                      Year {yr}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Current CGPA (out of 10)
                </label>
                <input
                  type="text"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Active Backlogs
                </label>
                <input
                  type="number"
                  min={0}
                  value={backlogs}
                  onChange={(e) => setBacklogs(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select all languages, frameworks, and tools in your active toolkit ({selectedSkills.length} selected):
              </p>
              {selectedSkills.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSkills([])}
                  className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Clear All Selected
                </button>
              )}
            </div>

            {/* Add Custom Skill Bar */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Add Customized Skill (if not listed below):
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSkill();
                    }
                  }}
                  placeholder="Type custom skill (e.g. Solidity, Flutter, Spring Boot, MATLAB)..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  disabled={!customSkillInput.trim()}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer whitespace-nowrap disabled:opacity-40"
                >
                  + Add Skill
                </button>
              </div>
            </div>

            {Object.entries(skillsByCategory).map(([category, skillList]) => (
              <div key={category} className="pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  {category}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {skillList.map((sk) => {
                    const active = selectedSkills.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => toggleItem(selectedSkills, setSelectedSkills, sk)}
                        className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600 font-medium'
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                        }`}
                      >
                        {active ? `✓ ${sk}` : sk}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5 max-h-96 overflow-y-auto pr-1">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Domain Interests
              </p>
              <div className="flex flex-wrap gap-1.5">
                {INTEREST_OPTIONS.map((item) => {
                  const active = interests.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleItem(interests, setInterests, item)}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600 font-medium'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Primary Career Goals
              </p>
              <div className="flex flex-wrap gap-1.5">
                {GOAL_OPTIONS.map((goal) => {
                  const active = careerGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleItem(careerGoals, setCareerGoals, goal)}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600 font-medium'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {goal}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Work Mode Preference
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Remote', 'Hybrid', 'On-site'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => toggleItem(preferredWorkModes, setPreferredWorkModes, mode)}
                      className={`px-2.5 py-1 text-xs rounded-md border cursor-pointer ${
                        preferredWorkModes.includes(mode)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Geography Preference
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['India', 'International'].map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => toggleItem(preferredLocations, setPreferredLocations, loc)}
                      className={`px-2.5 py-1 text-xs rounded-md border cursor-pointer ${
                        preferredLocations.includes(loc)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Experience Level
                </p>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleFinish}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Generating Profile...' : 'Save & Recalculate Matches'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
