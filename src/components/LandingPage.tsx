import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Search,
  Calendar,
  GitBranch,
  Terminal,
  BookOpen,
  Compass,
  Sun,
  Moon,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import heroWorkspaceImg from '../assets/images/hero_opportunity_workspace_1791094594224.jpg';
import avatarPriyaImg from '../assets/images/avatar_student_priya_1791094608772.jpg';
import avatarArjunImg from '../assets/images/avatar_student_arjun_1791094619652.jpg';
import avatarElenaImg from '../assets/images/avatar_student_elena_1791094631159.jpg';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onExploreAs: (role: 'STUDENT' | 'ADMIN' | 'ORGANIZATION') => void;
  onGoogleLogin: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const HERO_PREVIEW_CARDS = [
  {
    title: 'Google Software Engineering Summer Internship',
    organization: 'Google',
    category: 'Internship',
    match: 96,
    deadline: '12 days remaining',
    eligibility: 'Eligible ✓',
    skills: 'Python · React · C++ · Data Structures',
    difficulty: 'Intermediate',
    stipend: '₹1,25,000 / mo',
    why: 'Recommended because you know Python & React and graduate in 2027.',
    url: 'https://buildyourfuture.withgoogle.com/programs/software-engineering-internship',
  },
  {
    title: 'Major League Hacking Global AI & Cloud Hackathon',
    organization: 'Major League Hacking',
    category: 'Hackathon',
    match: 94,
    deadline: '3 days remaining',
    eligibility: 'Eligible ✓',
    skills: 'Python · React · Docker · Git',
    difficulty: 'Beginner Friendly',
    stipend: '$15,000 Prize Pool',
    why: 'Matches your full-stack repository activity and remote hackathon preference.',
    url: 'https://mlh.io/seasons/2025/events',
  },
  {
    title: 'Google Summer of Code (GSoC) Open Source Contributor',
    organization: 'Google Open Source',
    category: 'Open Source',
    match: 92,
    deadline: '10 days remaining',
    eligibility: 'Eligible ✓',
    skills: 'TypeScript · Go · Python · Git',
    difficulty: 'Intermediate',
    stipend: '$3,000 – $6,600',
    why: 'Strong alignment with your 26 public GitHub repositories and TypeScript PRs.',
    url: 'https://summerofcode.withgoogle.com/',
  },
  {
    title: 'Microsoft Imagine Cup Global Championship',
    organization: 'Microsoft',
    category: 'Competition',
    match: 91,
    deadline: '8 days remaining',
    eligibility: 'Eligible ✓',
    skills: 'Generative AI · Azure · Next.js',
    difficulty: 'Intermediate',
    stipend: '$100,000 Grand Prize',
    why: 'Your AI/ML interest and B.Tech 2027 cohort satisfy all team rules.',
    url: 'https://imaginecup.microsoft.com/',
  },
  {
    title: 'Codeforces Global Round 32 (Div. 1 + Div. 2)',
    organization: 'Codeforces',
    category: 'Coding Contest',
    match: 89,
    deadline: '2 days remaining',
    eligibility: 'Eligible ✓',
    skills: 'C++ · Algorithms · Graphs · DP',
    difficulty: 'Intermediate',
    stipend: 'Rated + Prizes',
    why: 'Calibrated for your 1542 Codeforces Expert rating and algorithmic streak.',
    url: 'https://codeforces.com/contests',
  },
  {
    title: 'Linux Foundation LFX Kubernetes Mentorship',
    organization: 'Linux Foundation',
    category: 'Fellowship',
    match: 88,
    deadline: '14 days remaining',
    eligibility: 'Eligible ✓',
    skills: 'Go · Docker · Kubernetes · Linux',
    difficulty: 'Intermediate',
    stipend: '$4,500 Stipend',
    why: 'Matches your systems projects and open-source career goal.',
    url: 'https://mentorship.lfx.linuxfoundation.org/',
  },
  {
    title: 'Generation Google Scholarship (Computer Science)',
    organization: 'Google',
    category: 'Scholarship',
    match: 90,
    deadline: '9 days remaining',
    eligibility: 'Eligible ✓',
    skills: 'Python · Algorithms · Academic CGPA 8.9',
    difficulty: 'Intermediate',
    stipend: '$2,500 USD Award',
    why: 'Your 8.9 CGPA in B.Tech CSE exceeds the 8.0 academic requirement.',
    url: 'https://buildyourfuture.withgoogle.com/scholarships/generation-google-scholarship-apac',
  },
];

const CATEGORIES_SUMMARY = [
  { name: 'Internships', count: '30+ Verified', desc: 'Summer & winter SWE, AI/ML, and systems internships at top global tech firms.' },
  { name: 'Hackathons', count: '20+ Active', desc: 'Online and hybrid buildathons with cash prizes, API credits, and recruiter fast-tracks.' },
  { name: 'Open Source', count: '20+ Programs', desc: 'GSoC, Outreachy, Linux Foundation LFX, CNCF, and paid contributor fellowships.' },
  { name: 'Coding Contests', count: '15+ Rated', desc: 'Codeforces, LeetCode, Meta Hacker Cup, CodeChef, and AtCoder algorithmic rounds.' },
  { name: 'Scholarships', count: '15+ Grants', desc: 'Merit, diversity, and research tuition awards for undergraduate & master’s students.' },
  { name: 'Research & Jobs', count: '20+ Roles', desc: 'CERN, MITACS, Stanford AI Lab visiting fellowships and new-grad engineering roles.' },
];

const FAQS = [
  {
    q: 'How does OpportunityOS calculate my personalized match percentage?',
    a: 'Our recommendation engine weights your verified skills (30%), degree & cohort eligibility rules (25%), career interests (15%), experience level (10%), GitHub & competitive coding profile similarity (10%), location/remote preference (5%), and deadline urgency (5%).',
  },
  {
    q: 'How does the automatic Eligibility Checker work?',
    a: 'Every opportunity is structured with explicit rules for degree type, graduation year window, minimum CGPA, location, and required technical stack. OpportunityOS compares your student profile against every rule and shows a transparent pass/fail breakdown before you spend hours applying.',
  },
  {
    q: 'What happens if I am missing 1 or 2 required skills for an internship?',
    a: 'Instead of hiding the opportunity, OpportunityOS flags it as Partially Eligible, highlights the exact skill gap, and links you directly to the step-by-step preparation roadmap and starter project so you can close the gap before the deadline.',
  },
  {
    q: 'Can recruiters and university organizations post opportunities?',
    a: 'Yes. Organizations have a dedicated portal to submit internships, hackathons, or fellowships with structured eligibility criteria. Every submission passes through deduplication and admin verification before publishing.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onSignIn,
  onExploreAs,
  onGoogleLogin,
  darkMode,
  onToggleDarkMode,
}) => {
  const [selectedPreviewIdx, setSelectedPreviewIdx] = useState(0);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const selectedCard = HERO_PREVIEW_CARDS[selectedPreviewIdx];

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* Top Bar Contract: Strictly 3 zones (Brand wordmark | 5 clean nav links | Primary actions) */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 lg:px-12 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-display whitespace-nowrap"
        >
          OpportunityOS
        </a>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-400">
          <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
            How It Works
          </a>
          <a href="#categories" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
            Categories
          </a>
          <a href="#matching-engine" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
            Eligibility Engine
          </a>
          <a href="#roadmaps" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
            Roadmaps
          </a>
          <a href="#faq" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleDarkMode}
            aria-label="Toggle color theme"
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={onSignIn}
            className="hidden sm:inline-flex px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            Sign In / Log In
          </button>
          <button
            onClick={onGetStarted}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="top" className="max-w-7xl mx-auto px-6 lg:px-12 pt-14 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Value Proposition & CTAs */}
          <div className="lg:col-span-5 pt-2">
            <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mb-4 tracking-wide">
              Career Intelligence · 120+ Verified Opportunities · Real-Time Eligibility
            </p>
            <h1
              className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12] mb-6"
              style={{ textWrap: 'balance' }}
            >
              The right opportunity. At the right time.
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-xl">
              Discover internships, hackathons, scholarships, open-source programs, coding contests and career opportunities personalized for you. Automatically verify eligibility, identify missing skills, follow preparation roadmaps, and track every deadline in one workspace.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-8">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>Get Started — Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onSignIn}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>Sign In to Existing Account</span>
              </button>
            </div>

            {/* Quick Account & Portal Launch */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Personalized Workspace Access:
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={onGetStarted}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                >
                  Student Workspace
                </button>
                <button
                  onClick={() => onExploreAs('ORGANIZATION')}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                >
                  Organization Portal
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Personalized Opportunity Dashboard Preview */}
          <div className="lg:col-span-7 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Personalized Opportunity Feed Preview
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Profile: B.Tech CSE · Class of 2027 · CGPA 8.9 · Python, React, TypeScript, Go
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                Readiness Score: 84/100
              </span>
            </div>

            {/* Interactive Detail Highlight of Selected Opportunity */}
            <div className="mb-5 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {selectedCard.title}
                </h2>
                <span className="text-sm font-mono font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                  {selectedCard.match}% Match
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                <span className="font-medium text-slate-700 dark:text-slate-300">{selectedCard.organization}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedCard.category}</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{selectedCard.eligibility}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{selectedCard.deadline}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{selectedCard.stipend}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                {selectedCard.why}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Skills: {selectedCard.skills} · Difficulty: {selectedCard.difficulty}</span>
                <a
                  href={selectedCard.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
                >
                  <span>Apply on Official Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Interactive List of All 7 Hero Cards */}
            <div className="space-y-2">
              {HERO_PREVIEW_CARDS.map((card, idx) => {
                const isSelected = idx === selectedPreviewIdx;
                return (
                  <button
                    key={card.title}
                    onClick={() => setSelectedPreviewIdx(idx)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg border transition-colors flex flex-wrap items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-slate-950 border-blue-600/60 dark:border-blue-500/60'
                        : 'bg-transparent border-slate-200/70 dark:border-slate-800/70 hover:bg-white/60 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {card.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{card.organization}</span>
                        <span aria-hidden="true">·</span>
                        <span>{card.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{card.skills}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-xs font-mono tabular-nums">
                      <span className="text-emerald-600 dark:text-emerald-400">{card.eligibility}</span>
                      <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">{card.deadline}</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{card.match}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Quantitative Proof Bar */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              120+
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Verified Internships, Hackathons, Open Source & Scholarships in PostgreSQL
            </p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              7-Factor
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Weighted Matching Engine (Skills, Cohort, CGPA, GitHub, Location, Urgency)
            </p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              6 Platforms
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              GitHub, LeetCode, Codeforces, HackerRank, CodeChef & AtCoder Profile Sync
            </p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              100% Real-Time
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Rule-by-Rule Eligibility Verification & Skill Gap Preparation Roadmaps
            </p>
          </div>
        </div>
      </section>

      {/* Section 01: How It Works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="max-w-2xl mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
            01. From Scattered Links to Structured Career Execution
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            OpportunityOS replaces chaotic WhatsApp groups, missed college emails, and spreadsheet trackers with a six-stage execution loop: Discover → Understand → Prepare → Apply → Track → Improve.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mb-1">Stage 01 · Discover & Match</p>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                Personalized Opportunity Feed
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Every internship, GSoC program, hackathon, and scholarship is ranked by your exact skill overlap and graduation year.
              </p>
            </div>
            <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mb-1">Stage 02 · Understand Eligibility</p>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                Automatic Eligibility Checker
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Instantly verify Education, Graduation Cohort, Location, CGPA, and Required Stack before investing time in an application.
              </p>
            </div>
            <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mb-1">Stage 03 · Prepare & Close Gaps</p>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                Skill Gap & Interactive Roadmaps
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                See which skills you already have and launch targeted learning roadmaps with curated projects and practice problems.
              </p>
            </div>
            <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mb-1">Stage 04 · Apply & Track</p>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                Kanban Pipeline & Deadline Alerts
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Move applications from Interested to Preparing, Applied, Assessment, Interview, and Selected with calendar reminders.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 aspect-video lg:aspect-4/3">
            <img
              src={heroWorkspaceImg}
              alt="Modern university engineering and innovation lab at golden hour"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-6">
              <p className="text-xs font-mono text-blue-300 mb-1">
                Built for Computer Science & Engineering Cohorts
              </p>
              <p className="text-sm font-semibold text-white">
                Unified visibility across 22+ verified global organizations and research labs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 02: Opportunity Categories */}
      <section id="categories" className="border-t border-slate-200 dark:border-slate-800 py-20 bg-slate-50/40 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                02. Dedicated Opportunity Categories
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Specialized filters for duration, stipend, remote eligibility, prize pools, and beginner-friendliness.
              </p>
            </div>
            <button
              onClick={onGetStarted}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Browse all 120+ opportunities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES_SUMMARY.map((cat) => (
              <div
                key={cat.name}
                onClick={onGetStarted}
                className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-500/50 transition-colors cursor-pointer"
              >
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {cat.name}
                  </h3>
                  <span className="text-xs font-mono tabular-nums text-blue-600 dark:text-blue-400">
                    {cat.count}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {cat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 03: Eligibility & Skill Gap Engine */}
      <section id="matching-engine" className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
              03. Transparent Eligibility & Skill Gap Intelligence
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Never guess why an opportunity was recommended or whether your graduation year qualifies. Every card breaks down exact criteria and compares your current skills against required competencies.
            </p>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Automatic Degree, Graduation Cohort (2025–2029), & CGPA Verification</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Side-by-Side Skill Gap Analysis with 1-Click Roadmap Enrollment</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>AI Resume Parsing & Opportunity Assistant Grounded on Trusted Data</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50">
              <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mb-2">
                Automatic Eligibility Breakdown
              </p>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                Stripe SWE Intern · You are eligible ✓
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-200/70 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Education (B.Tech CSE)</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">Passed ✓</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-200/70 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Graduation Year (2027)</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">2026–2028 ✓</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-200/70 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Location (India / Remote)</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">Passed ✓</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-600 dark:text-slate-400">Required Skills (5/5)</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">100% Match ✓</span>
                </div>
              </div>
            </div>

            <div id="roadmaps" className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50">
              <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mb-2">
                AI Skill Gap & Roadmap Link
              </p>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                Backend & Cloud Native Readiness
              </h3>
              <div className="mb-4">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  You already have:
                </p>
                <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                  ✓ JavaScript · ✓ TypeScript · ✓ React · ✓ Git · ✓ SQL
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Recommended next milestones:
                </p>
                <p className="text-xs font-mono text-amber-600 dark:text-amber-400">
                  ○ Kubernetes · ○ Go Concurrency · ○ Distributed Caching
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 04: Attributable Student Testimonials */}
      <section className="border-t border-slate-200 dark:border-slate-800 py-20 bg-slate-50/40 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-10">
            04. Verified Student Outcomes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                “Before OpportunityOS, I missed the Google STEP and Outreachy deadlines because links were buried in Telegram channels. The eligibility engine matched me to CNCF Mentorship at 94% and the Go roadmap helped me merge 3 PRs before applying.”
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={avatarPriyaImg}
                  alt="Priya Sharma"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Priya Sharma</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    B.Tech CSE ’27, IIT Delhi · CNCF LFX Fellow
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                “Connecting my GitHub and Codeforces profiles immediately surfaced 14 backend internships and algorithmic contests I was 100% eligible for. The Kanban application tracker kept all my OA and interview dates organized in one calendar.”
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={avatarArjunImg}
                  alt="Arjun Mehta"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Arjun Mehta</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    B.E. CS ’27, BITS Pilani · SWE Intern at Stripe
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                “The AI Skill Gap Analyzer showed that adding PyTorch and RAG evaluation projects to my resume would raise my match score from 74% to 93% for research fellowships. I followed the AI Engineer roadmap and secured a summer research spot.”
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={avatarElenaImg}
                  alt="Elena Rostova"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Elena Rostova</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    M.Sc Computer Science ’26 · AI Research Fellow
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 05: FAQ */}
      <section id="faq" className="max-w-4xl mx-auto px-6 lg:px-12 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-8">
          05. Frequently Asked Questions
        </h2>
        <div className="divide-y divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800">
          {FAQS.map((item, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div key={item.q} className="py-4">
                <button
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 text-left text-sm font-semibold text-slate-900 dark:text-white cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-slate-200 dark:border-slate-800 py-16 bg-slate-50/60 dark:bg-slate-900/40">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
            Ready to discover opportunities calibrated to your profile?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Launch your personalized student feed, check eligibility across 120+ programs, and track every application deadline.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
            >
              Launch OpportunityOS Now
            </button>
            <button
              onClick={onGoogleLogin}
              className="px-6 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Sign In with Google OAuth
            </button>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 px-6 lg:px-12 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <span className="font-semibold text-slate-800 dark:text-slate-200 font-display">
            OpportunityOS
          </span>
          <div className="flex flex-wrap items-center gap-6">
            <button onClick={onGetStarted} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
              Student Feed
            </button>
            <button onClick={() => onExploreAs('ORGANIZATION')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
              Organization Portal
            </button>
            <button onClick={onSignIn} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
              Sign In
            </button>
          </div>
          <span>© 2026 OpportunityOS Career Intelligence Platform</span>
        </div>
      </footer>
    </div>
  );
};
