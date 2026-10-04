import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  username: text('username').notNull().unique(),
  role: text('role').notNull().default('STUDENT'), // STUDENT | ADMIN | ORGANIZATION
  avatar: text('avatar').notNull().default(''),
  points: integer('points').notNull().default(180),
  streakDays: integer('streak_days').notNull().default(7),
  leaderboardOptOut: boolean('leaderboard_opt_out').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const studentProfiles = pgTable('student_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  country: text('country').notNull().default('India'),
  state: text('state').notNull().default('Karnataka'),
  city: text('city').notNull().default('Bengaluru'),
  college: text('college').notNull().default('Indian Institute of Technology'),
  degree: text('degree').notNull().default('B.Tech'),
  branch: text('branch').notNull().default('Computer Science & Engineering'),
  graduationYear: integer('graduation_year').notNull().default(2027),
  currentYear: integer('current_year').notNull().default(3),
  cgpa: text('cgpa').notNull().default('8.8'),
  backlogs: integer('backlogs').notNull().default(0),
  bio: text('bio').notNull().default('Full-stack & AI systems student building distributed applications and contributing to open-source infrastructure.'),
  interests: text('interests').notNull().default('["Web Development","AI/ML","Open Source","Competitive Programming","Cloud"]'),
  careerGoals: text('career_goals').notNull().default('["Internship","Open source","Full-time job","Research"]'),
  preferredWorkModes: text('preferred_work_modes').notNull().default('["Remote","Hybrid","On-site"]'),
  preferredLocations: text('preferred_locations').notNull().default('["India","International"]'),
  experienceLevel: text('experience_level').notNull().default('Intermediate'),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  resumeText: text('resume_text').notNull().default(''),
  resumeSkills: text('resume_skills').notNull().default('[]'),
  resumeSummary: text('resume_summary').notNull().default(''),
  projectsJson: text('projects_json').notNull().default('[]'),
  achievementsJson: text('achievements_json').notNull().default('[]'),
  notificationEmail: boolean('notification_email').notNull().default(true),
  notificationInApp: boolean('notification_in_app').notNull().default(true),
  notificationFrequency: text('notification_frequency').notNull().default('Immediate'),
  savedSearchesJson: text('saved_searches_json').notNull().default('[]'),
  badgesJson: text('badges_json').notNull().default('["First Application","Consistent Learner","Open Source Contributor"]'),
});

export const skills = pgTable('skills', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  category: text('category').notNull(),
});

export const userSkills = pgTable('user_skills', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  skillId: integer('skill_id')
    .references(() => skills.id, { onDelete: 'cascade' })
    .notNull(),
  proficiency: text('proficiency').notNull().default('Intermediate'),
});

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  logo: text('logo').notNull().default(''),
  website: text('website').notNull().default(''),
  description: text('description').notNull().default(''),
  verified: boolean('verified').notNull().default(true),
  ownerUserId: integer('owner_user_id'),
});

export const opportunities = pgTable('opportunities', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  organizationId: integer('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  category: text('category').notNull(), // Internship | Hackathon | Open Source | Coding Contest | Scholarship | Fellowship | Research | Job | Competition | Event
  location: text('location').notNull(),
  workMode: text('work_mode').notNull().default('Remote'), // Remote | Hybrid | On-site
  remote: boolean('remote').notNull().default(true),
  paid: boolean('paid').notNull().default(true),
  stipend: text('stipend').notNull().default(''),
  salary: text('salary').notNull().default(''),
  duration: text('duration').notNull().default('3 Months'),
  deadline: text('deadline').notNull(), // YYYY-MM-DD
  startDate: text('start_date').notNull().default(''),
  endDate: text('end_date').notNull().default(''),
  applicationUrl: text('application_url').notNull(),
  source: text('source').notNull().default('Official Portal'),
  sourceUrl: text('source_url').notNull().default(''),
  externalId: text('external_id').notNull().default(''),
  difficulty: text('difficulty').notNull().default('Intermediate'), // Beginner | Intermediate | Advanced
  beginnerFriendly: boolean('beginner_friendly').notNull().default(false),
  status: text('status').notNull().default('Published'), // Draft | Pending Review | Approved | Published | Expired | Rejected
  featured: boolean('featured').notNull().default(false),
  benefitsJson: text('benefits_json').notNull().default('[]'),
  timelineJson: text('timeline_json').notNull().default('[]'),
  processJson: text('process_json').notNull().default('[]'),
  viewsCount: integer('views_count').notNull().default(0),
  appliesCount: integer('applies_count').notNull().default(0),
  isSeed: boolean('is_seed').notNull().default(true),
  lastVerifiedAt: timestamp('last_verified_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const opportunitySkills = pgTable('opportunity_skills', {
  id: serial('id').primaryKey(),
  opportunityId: integer('opportunity_id')
    .references(() => opportunities.id, { onDelete: 'cascade' })
    .notNull(),
  skillId: integer('skill_id')
    .references(() => skills.id, { onDelete: 'cascade' })
    .notNull(),
  required: boolean('required').notNull().default(true),
  importance: integer('importance').notNull().default(5),
});

export const eligibilityRules = pgTable('eligibility_rules', {
  id: serial('id').primaryKey(),
  opportunityId: integer('opportunity_id')
    .references(() => opportunities.id, { onDelete: 'cascade' })
    .notNull(),
  ruleType: text('rule_type').notNull(), // DEGREE | GRAD_YEAR_MIN | GRAD_YEAR_MAX | MIN_CGPA | LOCATION | MAX_BACKLOGS
  ruleValue: text('rule_value').notNull(),
});

export const savedOpportunities = pgTable('saved_opportunities', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  opportunityId: integer('opportunity_id')
    .references(() => opportunities.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  opportunityId: integer('opportunity_id')
    .references(() => opportunities.id, { onDelete: 'cascade' })
    .notNull(),
  status: text('status').notNull().default('Saved'), // Interested | Saved | Preparing | Applied | Assessment | Interview | Selected | Rejected
  appliedAt: text('applied_at').notNull().default(''),
  notes: text('notes').notNull().default(''),
  interviewDate: text('interview_date').notNull().default(''),
  resumeUsed: text('resume_used').notNull().default('Software_Engineering_Resume_2026.pdf'),
  referral: text('referral').notNull().default(''),
  nextAction: text('next_action').notNull().default('Complete technical preparation & submit'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const roadmaps = pgTable('roadmaps', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  estimatedWeeks: integer('estimated_weeks').notNull().default(12),
  difficulty: text('difficulty').notNull().default('Intermediate'),
  createdByUserId: integer('created_by_user_id'),
});

export const roadmapSteps = pgTable('roadmap_steps', {
  id: serial('id').primaryKey(),
  roadmapId: integer('roadmap_id')
    .references(() => roadmaps.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  stepOrder: integer('step_order').notNull(),
  estimatedHours: integer('estimated_hours').notNull().default(12),
  resourcesJson: text('resources_json').notNull().default('[]'),
  projectsJson: text('projects_json').notNull().default('[]'),
  problemsJson: text('problems_json').notNull().default('[]'),
  skillName: text('skill_name').notNull().default(''),
});

export const userRoadmapProgress = pgTable('user_roadmap_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  roadmapStepId: integer('roadmap_step_id')
    .references(() => roadmapSteps.id, { onDelete: 'cascade' })
    .notNull(),
  status: text('status').notNull().default('Not started'), // Not started | In progress | Completed
  completedAt: timestamp('completed_at'),
});

export const codingProfiles = pgTable('coding_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  platform: text('platform').notNull(), // GitHub | LeetCode | Codeforces | HackerRank | CodeChef | AtCoder
  username: text('username').notNull(),
  rating: integer('rating').notNull().default(0),
  maxRating: integer('max_rating').notNull().default(0),
  rankTitle: text('rank_title').notNull().default(''),
  problemsSolved: integer('problems_solved').notNull().default(0),
  easySolved: integer('easy_solved').notNull().default(0),
  mediumSolved: integer('medium_solved').notNull().default(0),
  hardSolved: integer('hard_solved').notNull().default(0),
  repositories: integer('repositories').notNull().default(0),
  followers: integer('followers').notNull().default(0),
  contributions: integer('contributions').notNull().default(0),
  stars: integer('stars').notNull().default(0),
  topLanguagesJson: text('top_languages_json').notNull().default('[]'),
  badgesJson: text('badges_json').notNull().default('[]'),
  extraDataJson: text('extra_data_json').notNull().default('{}'),
  profileUrl: text('profile_url').notNull().default(''),
  isLiveApi: boolean('is_live_api').notNull().default(false),
  lastSyncedAt: timestamp('last_synced_at').defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(), // MATCH | DEADLINE | ELIGIBILITY | APPLICATION | ROADMAP | CONTEST
  opportunityId: integer('opportunity_id'),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull().default('Hackathon'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  location: text('location').notNull(),
  registrationUrl: text('registration_url').notNull(),
  opportunityId: integer('opportunity_id'),
});

export const analyticsEvents = pgTable('analytics_events', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  eventType: text('event_type').notNull(),
  metadataJson: text('metadata_json').notNull().default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
  skills: many(userSkills),
  savedOpportunities: many(savedOpportunities),
  applications: many(applications),
  roadmapProgress: many(userRoadmapProgress),
  codingProfiles: many(codingProfiles),
  notifications: many(notifications),
}));

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [opportunities.organizationId],
    references: [organizations.id],
  }),
  skills: many(opportunitySkills),
  eligibilityRules: many(eligibilityRules),
}));
