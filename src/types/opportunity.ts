export interface EligibilityBreakdownItem {
  criterion: string;
  passed: boolean;
  partial?: boolean;
  detail: string;
}

export interface EligibilityEvaluation {
  status: 'ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'NOT_ELIGIBLE';
  label: string;
  explanation: string;
  breakdown: EligibilityBreakdownItem[];
}

export interface OrganizationItem {
  id: number;
  name: string;
  logo: string;
  website: string;
  description: string;
  verified: boolean;
}

export interface EnrichedOpportunity {
  id: number;
  title: string;
  slug: string;
  description: string;
  organizationId: number;
  organization: OrganizationItem;
  category: string;
  location: string;
  workMode: string;
  remote: boolean;
  paid: boolean;
  stipend: string;
  salary: string;
  duration: string;
  deadline: string;
  startDate: string;
  endDate: string;
  applicationUrl: string;
  source: string;
  sourceUrl: string;
  difficulty: string;
  beginnerFriendly: boolean;
  status: string;
  featured: boolean;
  requiredSkills: string[];
  rules: Array<{ ruleType: string; ruleValue: string }>;
  benefits: string[];
  timeline: Array<{ stage: string; date: string }>;
  process: string[];
  viewsCount: number;
  appliesCount: number;
  isSeed: boolean;
  isSaved: boolean;
  applicationStatus: string | null;
  applicationId: number | null;
  matchScore: number;
  matchExplanation: string;
  matchReasons: string[];
  matchedSkills: string[];
  missingSkills: string[];
  daysRemaining: number;
  urgencyLevel: 'CRITICAL' | 'SOON' | 'NORMAL' | 'EXPIRED';
  eligibility: EligibilityEvaluation;
}

export interface RoadmapStepItem {
  id: number;
  roadmapId: number;
  title: string;
  description: string;
  stepOrder: number;
  estimatedHours: number;
  skillName: string;
  resources: string[];
  projects: string[];
  problems: string[];
  status: 'Not started' | 'In progress' | 'Completed';
}

export interface RoadmapItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: string;
  estimatedWeeks: number;
  difficulty: string;
  steps: RoadmapStepItem[];
  completedCount: number;
  inProgressCount: number;
  totalSteps: number;
  progressPercent: number;
}

export interface CodingProfileItem {
  id: number;
  userId: number;
  platform: string;
  username: string;
  rating: number;
  maxRating: number;
  rankTitle: string;
  problemsSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  repositories: number;
  followers: number;
  contributions: number;
  stars: number;
  topLanguages: string[];
  badges: string[];
  extraData: Record<string, any>;
  profileUrl: string;
  isLiveApi: boolean;
  lastSyncedAt: string;
}

export interface ApplicationItem {
  id: number;
  userId: number;
  opportunityId: number;
  status: string;
  appliedAt: string;
  notes: string;
  interviewDate: string;
  resumeUsed: string;
  referral: string;
  nextAction: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  opportunityId?: number;
  read: boolean;
  createdAt: string;
}

export interface CalendarEventItem {
  id: number;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  location: string;
  registrationUrl: string;
  opportunityId?: number;
}

export interface DashboardBundle {
  user: {
    id: number;
    uid: string;
    name: string;
    email: string;
    username: string;
    role: 'STUDENT' | 'ADMIN' | 'ORGANIZATION';
    avatar: string;
    points: number;
    streakDays: number;
    leaderboardOptOut: boolean;
  };
  profile: {
    country: string;
    state: string;
    city: string;
    college: string;
    degree: string;
    branch: string;
    graduationYear: number;
    currentYear: number;
    cgpa: string;
    backlogs: number;
    bio: string;
    interests: string[];
    careerGoals: string[];
    preferredWorkModes: string[];
    preferredLocations: string[];
    experienceLevel: string;
    onboardingCompleted: boolean;
    resumeText: string;
    resumeSkills: string[];
    resumeSummary: string;
    projects: Array<{ title: string; stack: string; description: string; link: string }>;
    achievements: string[];
    notificationEmail: boolean;
    notificationInApp: boolean;
    notificationFrequency: string;
    savedSearches: Array<{ name: string; query: string; category: string }>;
    badges: string[];
  };
  skills: Array<{ id: number; name: string; category: string; proficiency: string }>;
  allAvailableSkills: Array<{ id: number; name: string; category: string }>;
  codingProfiles: CodingProfileItem[];
  readiness: {
    overall: number;
    breakdown: {
      coding: number;
      projects: number;
      openSource: number;
      problemSolving: number;
      consistency: number;
    };
  };
  savedOpportunityIds: number[];
  applications: ApplicationItem[];
  notifications: NotificationItem[];
  opportunities: EnrichedOpportunity[];
  roadmaps: RoadmapItem[];
  events: CalendarEventItem[];
  leaderboard: Array<{
    rank: number;
    id: number;
    name: string;
    username: string;
    avatar: string;
    points: number;
    streakDays: number;
    isCurrentUser: boolean;
  }>;
  organizations: OrganizationItem[];
}
