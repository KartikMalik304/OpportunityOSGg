import { db } from './index.ts';
import {
  users,
  studentProfiles,
  skills,
  userSkills,
  organizations,
  opportunities,
  opportunitySkills,
  eligibilityRules,
  savedOpportunities,
  applications,
  roadmaps,
  roadmapSteps,
  userRoadmapProgress,
  codingProfiles,
  notifications,
  events,
  analyticsEvents,
} from './schema.ts';
import { and, desc, eq, asc } from 'drizzle-orm';
import { ensureSeeded, ensureUserInitialized } from './seed.ts';
import {
  computeOpportunityMatch,
  type StudentContext,
  type OpportunityContext,
} from '../services/recommendationEngine.ts';
import { calculateReadinessScore } from '../services/codingIntegration.ts';

function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

export async function getFullUserBundle(uid: string, email: string, name?: string) {
  try {
    const userRecord = await ensureUserInitialized(uid, email, name);

    const [profileRows, uSkillsRows, allSkillsRows, cProfiles, savedRows, appRows, notifRows, progressRows] =
      await Promise.all([
        db.select().from(studentProfiles).where(eq(studentProfiles.userId, userRecord.id)),
        db.select().from(userSkills).where(eq(userSkills.userId, userRecord.id)),
        db.select().from(skills),
        db.select().from(codingProfiles).where(eq(codingProfiles.userId, userRecord.id)),
        db.select().from(savedOpportunities).where(eq(savedOpportunities.userId, userRecord.id)),
        db.select().from(applications).where(eq(applications.userId, userRecord.id)),
        db
          .select()
          .from(notifications)
          .where(eq(notifications.userId, userRecord.id))
          .orderBy(desc(notifications.createdAt)),
        db.select().from(userRoadmapProgress).where(eq(userRoadmapProgress.userId, userRecord.id)),
      ]);

    const profile = profileRows[0];
    const skillById = new Map(allSkillsRows.map((s) => [s.id, s]));

    const resolvedSkills = uSkillsRows
      .map((us) => {
        const sk = skillById.get(us.skillId);
        return sk ? { id: sk.id, name: sk.name, category: sk.category, proficiency: us.proficiency } : null;
      })
      .filter(Boolean) as Array<{ id: number; name: string; category: string; proficiency: string }>;

    const ghProfile = cProfiles.find((c) => c.platform === 'GitHub');
    const githubLanguages = ghProfile ? safeJsonParse<string[]>(ghProfile.topLanguagesJson, []) : [];
    const totalCodingSolved = cProfiles.reduce((sum, c) => sum + (c.problemsSolved || 0), 0);

    const completedStepsCount = progressRows.filter((p) => p.status === 'Completed').length;
    const readiness = calculateReadinessScore(
      cProfiles,
      completedStepsCount,
      appRows.length
    );

    const studentContext: StudentContext = {
      degree: profile?.degree || 'B.Tech',
      branch: profile?.branch || 'Computer Science & Engineering',
      graduationYear: profile?.graduationYear || 2027,
      cgpa: parseFloat(profile?.cgpa || '8.8') || 8.8,
      backlogs: profile?.backlogs || 0,
      country: profile?.country || 'India',
      interests: safeJsonParse<string[]>(profile?.interests, ['Web Development', 'AI/ML', 'Open Source']),
      careerGoals: safeJsonParse<string[]>(profile?.careerGoals, ['Internship', 'Open source']),
      preferredWorkModes: safeJsonParse<string[]>(profile?.preferredWorkModes, ['Remote', 'Hybrid']),
      preferredLocations: safeJsonParse<string[]>(profile?.preferredLocations, ['India', 'International']),
      experienceLevel: profile?.experienceLevel || 'Intermediate',
      skills: resolvedSkills.map((s) => s.name),
      resumeSkills: safeJsonParse<string[]>(profile?.resumeSkills, []),
      githubLanguages,
      codingProblemsSolved: totalCodingSolved,
    };

    return {
      user: userRecord,
      profile: {
        ...profile,
        interests: studentContext.interests,
        careerGoals: studentContext.careerGoals,
        preferredWorkModes: studentContext.preferredWorkModes,
        preferredLocations: studentContext.preferredLocations,
        resumeSkills: studentContext.resumeSkills,
        projects: safeJsonParse<any[]>(profile?.projectsJson, []),
        achievements: safeJsonParse<string[]>(profile?.achievementsJson, []),
        savedSearches: safeJsonParse<any[]>(profile?.savedSearchesJson, []),
        badges: safeJsonParse<string[]>(profile?.badgesJson, []),
      },
      skills: resolvedSkills,
      allAvailableSkills: allSkillsRows,
      codingProfiles: cProfiles.map((cp) => ({
        ...cp,
        topLanguages: safeJsonParse<string[]>(cp.topLanguagesJson, []),
        badges: safeJsonParse<string[]>(cp.badgesJson, []),
        extraData: safeJsonParse<Record<string, any>>(cp.extraDataJson, {}),
      })),
      readiness,
      savedOpportunityIds: savedRows.map((r) => r.opportunityId),
      applications: appRows,
      notifications: notifRows,
      roadmapProgress: progressRows,
      studentContext,
    };
  } catch (error) {
    console.error('Database query failed in getFullUserBundle:', error);
    throw new Error('Failed to load user profile data.', { cause: error });
  }
}

export async function getEnrichedOpportunities(
  studentContext: StudentContext,
  savedIds: number[],
  userApps: Array<{ id: number; opportunityId: number; status: string }>,
  includeUnpublished = false
) {
  try {
    await ensureSeeded();

    const [allOpps, allOrgs, allOppSkills, allSkills, allRules] = await Promise.all([
      db.select().from(opportunities).orderBy(desc(opportunities.featured), asc(opportunities.deadline)),
      db.select().from(organizations),
      db.select().from(opportunitySkills),
      db.select().from(skills),
      db.select().from(eligibilityRules),
    ]);

    const orgById = new Map(allOrgs.map((o) => [o.id, o]));
    const skillNameById = new Map(allSkills.map((s) => [s.id, s.name]));

    const skillsByOpp = new Map<number, string[]>();
    for (const os of allOppSkills) {
      const sName = skillNameById.get(os.skillId);
      if (sName) {
        const arr = skillsByOpp.get(os.opportunityId) || [];
        arr.push(sName);
        skillsByOpp.set(os.opportunityId, arr);
      }
    }

    const rulesByOpp = new Map<number, Array<{ ruleType: string; ruleValue: string }>>();
    for (const r of allRules) {
      const arr = rulesByOpp.get(r.opportunityId) || [];
      arr.push({ ruleType: r.ruleType, ruleValue: r.ruleValue });
      rulesByOpp.set(r.opportunityId, arr);
    }

    const savedSet = new Set(savedIds);
    const appByOpp = new Map(userApps.map((a) => [a.opportunityId, a]));

    const filteredOpps = includeUnpublished
      ? allOpps
      : allOpps.filter((o) => o.status === 'Published' || o.status === 'Approved');

    const enriched = filteredOpps.map((opp) => {
      const org = orgById.get(opp.organizationId) || {
        id: 0,
        name: 'Partner Organization',
        logo: 'O',
        website: '',
        description: '',
        verified: true,
      };
      const reqSkills = skillsByOpp.get(opp.id) || [];
      const rules = rulesByOpp.get(opp.id) || [];

      const oppContext: OpportunityContext = {
        id: opp.id,
        title: opp.title,
        category: opp.category,
        location: opp.location,
        workMode: opp.workMode,
        remote: opp.remote,
        paid: opp.paid,
        difficulty: opp.difficulty,
        beginnerFriendly: opp.beginnerFriendly,
        deadline: opp.deadline,
        requiredSkills: reqSkills,
        rules,
        organizationName: org.name,
      };

      const match = computeOpportunityMatch(studentContext, oppContext);
      const existingApp = appByOpp.get(opp.id);

      return {
        ...opp,
        organization: org,
        requiredSkills: reqSkills,
        rules,
        benefits: safeJsonParse<string[]>(opp.benefitsJson, []),
        timeline: safeJsonParse<Array<{ stage: string; date: string }>>(opp.timelineJson, []),
        process: safeJsonParse<string[]>(opp.processJson, []),
        isSaved: savedSet.has(opp.id),
        applicationStatus: existingApp?.status || null,
        applicationId: existingApp?.id || null,
        matchScore: match.matchScore,
        matchExplanation: match.explanation,
        matchReasons: match.reasons,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        daysRemaining: match.daysRemaining,
        urgencyLevel: match.urgencyLevel,
        eligibility: match.eligibility,
      };
    });

    return enriched;
  } catch (error) {
    console.error('Database query failed in getEnrichedOpportunities:', error);
    throw new Error('Failed to fetch opportunities.', { cause: error });
  }
}

export async function updateStudentProfileAndSkills(
  userId: number,
  payload: {
    name?: string;
    role?: string;
    leaderboardOptOut?: boolean;
    country?: string;
    state?: string;
    city?: string;
    college?: string;
    degree?: string;
    branch?: string;
    graduationYear?: number;
    currentYear?: number;
    cgpa?: string;
    backlogs?: number;
    bio?: string;
    interests?: string[];
    careerGoals?: string[];
    preferredWorkModes?: string[];
    preferredLocations?: string[];
    experienceLevel?: string;
    onboardingCompleted?: boolean;
    skillNames?: string[];
    projects?: any[];
    achievements?: string[];
    notificationEmail?: boolean;
    notificationInApp?: boolean;
    notificationFrequency?: string;
    savedSearches?: any[];
  }
) {
  try {
    if (payload.name !== undefined || payload.role !== undefined || payload.leaderboardOptOut !== undefined) {
      const userUpdate: Record<string, any> = { updatedAt: new Date() };
      if (payload.name !== undefined) userUpdate.name = payload.name;
      if (payload.role !== undefined) userUpdate.role = payload.role;
      if (payload.leaderboardOptOut !== undefined) userUpdate.leaderboardOptOut = payload.leaderboardOptOut;
      await db.update(users).set(userUpdate).where(eq(users.id, userId));
    }

    const profUpdate: Record<string, any> = {};
    if (payload.country !== undefined) profUpdate.country = payload.country;
    if (payload.state !== undefined) profUpdate.state = payload.state;
    if (payload.city !== undefined) profUpdate.city = payload.city;
    if (payload.college !== undefined) profUpdate.college = payload.college;
    if (payload.degree !== undefined) profUpdate.degree = payload.degree;
    if (payload.branch !== undefined) profUpdate.branch = payload.branch;
    if (payload.graduationYear !== undefined) profUpdate.graduationYear = Number(payload.graduationYear);
    if (payload.currentYear !== undefined) profUpdate.currentYear = Number(payload.currentYear);
    if (payload.cgpa !== undefined) profUpdate.cgpa = String(payload.cgpa);
    if (payload.backlogs !== undefined) profUpdate.backlogs = Number(payload.backlogs);
    if (payload.bio !== undefined) profUpdate.bio = payload.bio;
    if (payload.interests !== undefined) profUpdate.interests = JSON.stringify(payload.interests);
    if (payload.careerGoals !== undefined) profUpdate.careerGoals = JSON.stringify(payload.careerGoals);
    if (payload.preferredWorkModes !== undefined)
      profUpdate.preferredWorkModes = JSON.stringify(payload.preferredWorkModes);
    if (payload.preferredLocations !== undefined)
      profUpdate.preferredLocations = JSON.stringify(payload.preferredLocations);
    if (payload.experienceLevel !== undefined) profUpdate.experienceLevel = payload.experienceLevel;
    if (payload.onboardingCompleted !== undefined)
      profUpdate.onboardingCompleted = Boolean(payload.onboardingCompleted);
    if (payload.projects !== undefined) profUpdate.projectsJson = JSON.stringify(payload.projects);
    if (payload.achievements !== undefined) profUpdate.achievementsJson = JSON.stringify(payload.achievements);
    if (payload.notificationEmail !== undefined) profUpdate.notificationEmail = Boolean(payload.notificationEmail);
    if (payload.notificationInApp !== undefined) profUpdate.notificationInApp = Boolean(payload.notificationInApp);
    if (payload.notificationFrequency !== undefined) profUpdate.notificationFrequency = payload.notificationFrequency;
    if (payload.savedSearches !== undefined) profUpdate.savedSearchesJson = JSON.stringify(payload.savedSearches);

    if (Object.keys(profUpdate).length > 0) {
      await db.update(studentProfiles).set(profUpdate).where(eq(studentProfiles.userId, userId));
    }

    if (Array.isArray(payload.skillNames)) {
      const allSkillsRows = await db.select().from(skills);
      const skillMap = new Map(allSkillsRows.map((s) => [s.name.toLowerCase(), s.id]));

      await db.delete(userSkills).where(eq(userSkills.userId, userId));
      for (const skName of payload.skillNames) {
        const skId = skillMap.get(skName.toLowerCase());
        if (skId) {
          await db.insert(userSkills).values({
            userId,
            skillId: skId,
            proficiency: 'Intermediate',
          });
        }
      }
    }

    await db.insert(analyticsEvents).values({
      userId,
      eventType: 'PROFILE_UPDATE',
      metadataJson: JSON.stringify({ onboardingCompleted: payload.onboardingCompleted }),
    });
  } catch (error) {
    console.error('Database query failed in updateStudentProfileAndSkills:', error);
    throw new Error('Failed to update student profile.', { cause: error });
  }
}

export async function toggleSaveOpportunityDb(userId: number, opportunityId: number, save: boolean) {
  try {
    const existing = await db
      .select()
      .from(savedOpportunities)
      .where(
        and(
          eq(savedOpportunities.userId, userId),
          eq(savedOpportunities.opportunityId, opportunityId)
        )
      );

    if (save && existing.length === 0) {
      await db.insert(savedOpportunities).values({ userId, opportunityId });
      await db.insert(analyticsEvents).values({
        userId,
        eventType: 'SAVE_OPPORTUNITY',
        metadataJson: JSON.stringify({ opportunityId }),
      });
    } else if (!save && existing.length > 0) {
      await db
        .delete(savedOpportunities)
        .where(
          and(
            eq(savedOpportunities.userId, userId),
            eq(savedOpportunities.opportunityId, opportunityId)
          )
        );
    }
    return { saved: save };
  } catch (error) {
    console.error('Database query failed in toggleSaveOpportunityDb:', error);
    throw new Error('Failed to update saved opportunity.', { cause: error });
  }
}

export async function upsertApplicationDb(
  userId: number,
  payload: {
    opportunityId: number;
    status: string;
    notes?: string;
    interviewDate?: string;
    resumeUsed?: string;
    referral?: string;
    nextAction?: string;
  }
) {
  try {
    const existing = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.userId, userId),
          eq(applications.opportunityId, payload.opportunityId)
        )
      );

    const nowDate = new Date().toISOString().split('T')[0];

    if (existing.length > 0) {
      const updated = await db
        .update(applications)
        .set({
          status: payload.status,
          appliedAt:
            payload.status === 'Applied' && !existing[0].appliedAt
              ? nowDate
              : existing[0].appliedAt,
          notes: payload.notes !== undefined ? payload.notes : existing[0].notes,
          interviewDate:
            payload.interviewDate !== undefined ? payload.interviewDate : existing[0].interviewDate,
          resumeUsed: payload.resumeUsed !== undefined ? payload.resumeUsed : existing[0].resumeUsed,
          referral: payload.referral !== undefined ? payload.referral : existing[0].referral,
          nextAction: payload.nextAction !== undefined ? payload.nextAction : existing[0].nextAction,
          updatedAt: new Date(),
        })
        .where(eq(applications.id, existing[0].id))
        .returning();
      return updated[0];
    } else {
      const inserted = await db
        .insert(applications)
        .values({
          userId,
          opportunityId: payload.opportunityId,
          status: payload.status || 'Applied',
          appliedAt: payload.status === 'Applied' ? nowDate : '',
          notes: payload.notes || '',
          interviewDate: payload.interviewDate || '',
          resumeUsed: payload.resumeUsed || 'Software_Engineering_Resume_2027.pdf',
          referral: payload.referral || '',
          nextAction: payload.nextAction || 'Prepare for online technical assessment',
        })
        .returning();

      // Award gamification XP
      const u = await db.select().from(users).where(eq(users.id, userId));
      if (u[0]) {
        await db
          .update(users)
          .set({ points: (u[0].points || 100) + 35 })
          .where(eq(users.id, userId));
      }

      await db.insert(analyticsEvents).values({
        userId,
        eventType: 'CREATE_APPLICATION',
        metadataJson: JSON.stringify({ opportunityId: payload.opportunityId, status: payload.status }),
      });

      return inserted[0];
    }
  } catch (error) {
    console.error('Database query failed in upsertApplicationDb:', error);
    throw new Error('Failed to save application.', { cause: error });
  }
}

export async function getRoadmapsWithProgress(userId: number) {
  try {
    await ensureSeeded();
    const [allRoadmaps, allSteps, userProg] = await Promise.all([
      db.select().from(roadmaps).orderBy(asc(roadmaps.id)),
      db.select().from(roadmapSteps).orderBy(asc(roadmapSteps.stepOrder)),
      db.select().from(userRoadmapProgress).where(eq(userRoadmapProgress.userId, userId)),
    ]);

    const progMap = new Map(userProg.map((p) => [p.roadmapStepId, p.status]));

    return allRoadmaps.map((rm) => {
      const steps = allSteps
        .filter((s) => s.roadmapId === rm.id)
        .map((s) => ({
          ...s,
          resources: safeJsonParse<string[]>(s.resourcesJson, []),
          projects: safeJsonParse<string[]>(s.projectsJson, []),
          problems: safeJsonParse<string[]>(s.problemsJson, []),
          status: progMap.get(s.id) || 'Not started',
        }));

      const completedCount = steps.filter((s) => s.status === 'Completed').length;
      const inProgressCount = steps.filter((s) => s.status === 'In progress').length;
      const progressPercent =
        steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

      return {
        ...rm,
        steps,
        completedCount,
        inProgressCount,
        totalSteps: steps.length,
        progressPercent,
      };
    });
  } catch (error) {
    console.error('Database query failed in getRoadmapsWithProgress:', error);
    throw new Error('Failed to load roadmaps.', { cause: error });
  }
}

export async function updateRoadmapStepStatusDb(
  userId: number,
  stepId: number,
  status: string
) {
  try {
    const existing = await db
      .select()
      .from(userRoadmapProgress)
      .where(
        and(
          eq(userRoadmapProgress.userId, userId),
          eq(userRoadmapProgress.roadmapStepId, stepId)
        )
      );

    if (existing.length > 0) {
      await db
        .update(userRoadmapProgress)
        .set({
          status,
          completedAt: status === 'Completed' ? new Date() : null,
        })
        .where(eq(userRoadmapProgress.id, existing[0].id));
    } else {
      await db.insert(userRoadmapProgress).values({
        userId,
        roadmapStepId: stepId,
        status,
        completedAt: status === 'Completed' ? new Date() : null,
      });
    }

    if (status === 'Completed') {
      // Also add the step's skill to the user's skills if not present, and award XP!
      const stepRows = await db.select().from(roadmapSteps).where(eq(roadmapSteps.id, stepId));
      const step = stepRows[0];
      if (step?.skillName) {
        const skRows = await db.select().from(skills).where(eq(skills.name, step.skillName));
        if (skRows[0]) {
          const existingUs = await db
            .select()
            .from(userSkills)
            .where(and(eq(userSkills.userId, userId), eq(userSkills.skillId, skRows[0].id)));
          if (existingUs.length === 0) {
            await db.insert(userSkills).values({
              userId,
              skillId: skRows[0].id,
              proficiency: 'Intermediate',
            });
          }
        }
      }

      const u = await db.select().from(users).where(eq(users.id, userId));
      if (u[0]) {
        await db
          .update(users)
          .set({ points: (u[0].points || 100) + 25 })
          .where(eq(users.id, userId));
      }
    }
  } catch (error) {
    console.error('Database query failed in updateRoadmapStepStatusDb:', error);
    throw new Error('Failed to update roadmap progress.', { cause: error });
  }
}

export async function createOpportunityWithDeduplication(payload: {
  title: string;
  organizationName: string;
  category: string;
  location: string;
  workMode: string;
  remote: boolean;
  paid: boolean;
  stipend: string;
  salary?: string;
  duration: string;
  deadline: string;
  applicationUrl: string;
  source?: string;
  difficulty: string;
  beginnerFriendly: boolean;
  description: string;
  requiredSkills: string[];
  gradYearMin?: number;
  gradYearMax?: number;
  degree?: string;
  minCgpa?: string;
  status?: string;
}) {
  try {
    // 1. Ensure organization exists
    let orgRows = await db
      .select()
      .from(organizations)
      .where(eq(organizations.name, payload.organizationName.trim()));

    let orgId: number;
    if (orgRows.length === 0) {
      const insertedOrg = await db
        .insert(organizations)
        .values({
          name: payload.organizationName.trim(),
          logo: payload.organizationName.trim().slice(0, 2).toUpperCase(),
          website: payload.applicationUrl,
          description: `${payload.organizationName} engineering & student programs.`,
          verified: true,
        })
        .returning();
      orgId = insertedOrg[0].id;
    } else {
      orgId = orgRows[0].id;
    }

    // 2. Deduplication check: same organization + title + deadline
    const existingOpps = await db
      .select()
      .from(opportunities)
      .where(
        and(
          eq(opportunities.organizationId, orgId),
          eq(opportunities.title, payload.title.trim())
        )
      );

    if (existingOpps.length > 0) {
      return { duplicate: true, opportunity: existingOpps[0] };
    }

    const slug = `${payload.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`;

    const inserted = await db
      .insert(opportunities)
      .values({
        title: payload.title.trim(),
        slug,
        description: payload.description.trim(),
        organizationId: orgId,
        category: payload.category,
        location: payload.location || 'Remote',
        workMode: payload.workMode || (payload.remote ? 'Remote' : 'Hybrid'),
        remote: Boolean(payload.remote),
        paid: Boolean(payload.paid),
        stipend: payload.stipend || '',
        salary: payload.salary || '',
        duration: payload.duration || '12 Weeks',
        deadline: payload.deadline,
        applicationUrl: payload.applicationUrl,
        source: payload.source || 'Organization Portal',
        sourceUrl: payload.applicationUrl,
        externalId: `ext-${Date.now()}`,
        difficulty: payload.difficulty || 'Intermediate',
        beginnerFriendly: Boolean(payload.beginnerFriendly),
        status: payload.status || 'Published',
        featured: false,
        benefitsJson: JSON.stringify([
          `Direct engineering mentorship at ${payload.organizationName}`,
          payload.stipend ? `Compensation: ${payload.stipend}` : 'Certificate & Community Recognition',
        ]),
        timelineJson: JSON.stringify([
          { stage: 'Application Deadline', date: payload.deadline },
        ]),
        processJson: JSON.stringify([
          '1. Check Eligibility & Skill Match on OpportunityOS',
          '2. Submit online application before the deadline',
        ]),
        isSeed: false,
      })
      .returning();

    const opp = inserted[0];

    // Link required skills
    const allSkillsRows = await db.select().from(skills);
    const skillMap = new Map(allSkillsRows.map((s) => [s.name.toLowerCase(), s.id]));

    for (const skName of payload.requiredSkills || []) {
      const skId = skillMap.get(skName.toLowerCase().trim());
      if (skId) {
        await db.insert(opportunitySkills).values({
          opportunityId: opp.id,
          skillId: skId,
          required: true,
          importance: 5,
        });
      }
    }

    // Add eligibility rules
    const rulesToInsert = [
      { opportunityId: opp.id, ruleType: 'DEGREE', ruleValue: payload.degree || 'B.Tech, B.E., M.Tech, MS' },
      { opportunityId: opp.id, ruleType: 'GRAD_YEAR_MIN', ruleValue: String(payload.gradYearMin || 2025) },
      { opportunityId: opp.id, ruleType: 'GRAD_YEAR_MAX', ruleValue: String(payload.gradYearMax || 2029) },
      { opportunityId: opp.id, ruleType: 'LOCATION', ruleValue: payload.remote ? 'Remote / Global' : payload.location },
    ];
    if (payload.minCgpa) {
      rulesToInsert.push({ opportunityId: opp.id, ruleType: 'MIN_CGPA', ruleValue: payload.minCgpa });
    }
    await db.insert(eligibilityRules).values(rulesToInsert);

    return { duplicate: false, opportunity: opp };
  } catch (error) {
    console.error('Database query failed in createOpportunityWithDeduplication:', error);
    throw new Error('Failed to create opportunity.', { cause: error });
  }
}
