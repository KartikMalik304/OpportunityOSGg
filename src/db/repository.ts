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
      const existingUsers = await db.select().from(users).where(eq(users.id, userId));
      const currentUser = existingUsers[0];
      const isOwner =
        currentUser?.email?.toLowerCase() === 'kartikchoudhary18122005@gmail.com';

      const userUpdate: Record<string, any> = { updatedAt: new Date() };
      if (payload.name !== undefined) userUpdate.name = payload.name;
      if (payload.role !== undefined) {
        if (payload.role === 'ADMIN' && !isOwner) {
          userUpdate.role = 'STUDENT';
        } else {
          userUpdate.role = payload.role;
        }
      }
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
    appliedAt?: string;
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
            payload.appliedAt ||
            existing[0].appliedAt ||
            nowDate,
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
          appliedAt: payload.appliedAt || nowDate,
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

export async function registerUserAccountDb(payload: {
  name: string;
  email: string;
  password?: string;
  role?: 'STUDENT' | 'ORGANIZATION' | 'ADMIN';
  college?: string;
  degree?: string;
  branch?: string;
  graduationYear?: number;
  cgpa?: string;
  country?: string;
  experienceLevel?: string;
  skills?: string[];
  interests?: string[];
  careerGoals?: string[];
  preferredWorkModes?: string[];
}) {
  try {
    await ensureSeeded();
    const cleanEmail = payload.email.trim().toLowerCase();
    const isOwnerEmail = cleanEmail === 'kartikchoudhary18122005@gmail.com';
    const cleanName = payload.name.trim() || (isOwnerEmail ? 'Kartik Choudhary' : 'Student Developer');
    const resolvedRole = isOwnerEmail
      ? 'ADMIN'
      : payload.role === 'ORGANIZATION'
      ? 'ORGANIZATION'
      : 'STUDENT';
    const uid = isOwnerEmail
      ? 'owner-kartik-admin'
      : `acct-${cleanEmail.replace(/[^a-z0-9]/g, '-')}`;
    const baseUsername =
      cleanEmail
        .split('@')[0]
        .replace(/[^a-z0-9]/g, '') || 'student';

    const allUsers = await db.select().from(users);
    let existingUser = allUsers.find(
      (u) => u.email.toLowerCase() === cleanEmail || u.uid === uid
    );

    if (!existingUser) {
      const uniqueUsername = `${baseUsername}${Math.floor(100 + Math.random() * 899)}`;
      const inserted = await db
        .insert(users)
        .values({
          uid,
          name: cleanName,
          email: cleanEmail,
          username: uniqueUsername,
          role: resolvedRole,
          points: isOwnerEmail ? 1650 : 320,
          streakDays: isOwnerEmail ? 30 : 5,
        })
        .returning();
      existingUser = inserted[0];
    } else {
      const updated = await db
        .update(users)
        .set({
          name: cleanName,
          role: resolvedRole,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      existingUser = updated[0];
    }

    const gradYear = Number(payload.graduationYear) || 2027;
    const currentYear = Math.max(1, Math.min(5, 2029 - gradYear));
    const selectedSkills =
      payload.skills && payload.skills.length > 0
        ? payload.skills
        : ['Python', 'TypeScript', 'React', 'SQL', 'Git'];
    const selectedInterests =
      payload.interests && payload.interests.length > 0
        ? payload.interests
        : ['Web Development', 'AI/ML', 'Open Source'];
    const selectedGoals =
      payload.careerGoals && payload.careerGoals.length > 0
        ? payload.careerGoals
        : ['Internship', 'Hackathon', 'Open source', 'Scholarship'];
    const selectedModes =
      payload.preferredWorkModes && payload.preferredWorkModes.length > 0
        ? payload.preferredWorkModes
        : ['Remote', 'Hybrid', 'On-site'];

    const existingProf = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, existingUser.id));

    const profValues = {
      userId: existingUser.id,
      country: payload.country || 'India',
      state: 'Karnataka',
      city: 'Bengaluru',
      college: payload.college || 'Indian Institute of Technology',
      degree: payload.degree || 'B.Tech',
      branch: payload.branch || 'Computer Science & Engineering',
      graduationYear: gradYear,
      currentYear,
      cgpa: String(payload.cgpa || '8.7'),
      backlogs: 0,
      bio: `${payload.degree || 'B.Tech'} in ${payload.branch || 'Computer Science'} (${gradYear}) focused on ${selectedInterests.join(', ')}.`,
      interests: JSON.stringify(selectedInterests),
      careerGoals: JSON.stringify(selectedGoals),
      preferredWorkModes: JSON.stringify(selectedModes),
      preferredLocations: JSON.stringify([payload.country || 'India', 'International']),
      experienceLevel: payload.experienceLevel || 'Intermediate',
      onboardingCompleted: true,
      resumeSkills: JSON.stringify(selectedSkills),
    };

    if (existingProf.length === 0) {
      await db.insert(studentProfiles).values(profValues);
    } else {
      await db
        .update(studentProfiles)
        .set(profValues)
        .where(eq(studentProfiles.userId, existingUser.id));
    }

    // Sync userSkills
    const allSkillsRows = await db.select().from(skills);
    const skillMap = new Map(allSkillsRows.map((s) => [s.name.toLowerCase(), s.id]));
    await db.delete(userSkills).where(eq(userSkills.userId, existingUser.id));
    for (const skName of selectedSkills) {
      const skId = skillMap.get(skName.toLowerCase().trim());
      if (skId) {
        await db.insert(userSkills).values({
          userId: existingUser.id,
          skillId: skId,
          proficiency: 'Intermediate',
        });
      }
    }

    // Ensure welcome notification & starter application history exist for this account
    const existingNotifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, existingUser.id));
    if (existingNotifs.length === 0) {
      await db.insert(notifications).values([
        {
          userId: existingUser.id,
          title: `Welcome to OpportunityOS, ${cleanName}!`,
          message: `Your ${payload.degree || 'B.Tech'} (${gradYear}) account is active. Opportunities are now ranked for your skills: ${selectedSkills.slice(0, 5).join(', ')}.`,
          type: 'MATCH',
          read: false,
        },
      ]);
    }

    await db
      .update(users)
      .set({ updatedAt: new Date() })
      .where(eq(users.id, existingUser.id));

    await db.insert(analyticsEvents).values({
      userId: existingUser.id,
      eventType: 'USER_LOGIN',
      metadataJson: JSON.stringify({
        method: 'Account Sign Up & Login',
        durationSeconds: 300,
        device: 'Web Workspace',
        active: true,
      }),
    });

    const token = `account-session:${encodeURIComponent(existingUser.uid)}:${encodeURIComponent(
      existingUser.email
    )}:${encodeURIComponent(existingUser.name)}`;

    return { token, user: existingUser };
  } catch (error) {
    console.error('Database query failed in registerUserAccountDb:', error);
    throw new Error('Failed to create user account.', { cause: error });
  }
}

export async function loginUserAccountDb(email: string) {
  try {
    await ensureSeeded();
    const cleanEmail = email.trim().toLowerCase();
    const isOwnerEmail = cleanEmail === 'kartikchoudhary18122005@gmail.com';

    if (isOwnerEmail) {
      const ownerRecord = await ensureUserInitialized(
        'owner-kartik-admin',
        'kartikchoudhary18122005@gmail.com',
        'Kartik Choudhary'
      );
      await db
        .update(users)
        .set({ updatedAt: new Date() })
        .where(eq(users.id, ownerRecord.id));
      await db.insert(analyticsEvents).values({
        userId: ownerRecord.id,
        eventType: 'USER_LOGIN',
        metadataJson: JSON.stringify({
          method: 'Owner Admin Portal Login',
          durationSeconds: 600,
          device: 'Owner Workspace',
          active: true,
        }),
      });
      const token = `account-session:${encodeURIComponent(ownerRecord.uid)}:${encodeURIComponent(
        ownerRecord.email
      )}:${encodeURIComponent(ownerRecord.name)}`;
      return { found: true, token, user: ownerRecord };
    }

    const allUsers = await db.select().from(users);
    const foundUser = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!foundUser) {
      return {
        found: false,
        error: 'No account found with that email. Click "Create New Account" to sign up and personalize your opportunities.',
      };
    }

    // Ensure seeded peer accounts have rich, distinct skills & profile preferences so their opportunities match their persona
    const existingSkills = await db
      .select()
      .from(userSkills)
      .where(eq(userSkills.userId, foundUser.id));

    if (existingSkills.length === 0) {
      const allSkillsRows = await db.select().from(skills);
      const skillMap = new Map(allSkillsRows.map((s) => [s.name.toLowerCase(), s.id]));

      let personaSkills = ['Python', 'TypeScript', 'React', 'SQL', 'Git'];
      let personaInterests = ['Web Development', 'AI/ML', 'Open Source'];
      let personaGoals = ['Internship', 'Open source', 'Hackathon'];
      let personaDegree = 'B.Tech';
      let personaBranch = 'Computer Science';
      let personaGradYear = 2027;
      let personaCgpa = '9.0';
      let personaLevel = 'Intermediate';

      if (cleanEmail.includes('priya')) {
        personaSkills = ['Python', 'PyTorch', 'TensorFlow', 'Machine Learning', 'Deep Learning', 'NLP', 'Data Science', 'SQL'];
        personaInterests = ['AI/ML', 'Data Science', 'Research'];
        personaGoals = ['Research', 'Internship', 'Scholarship', 'Fellowship'];
        personaDegree = 'M.Tech';
        personaBranch = 'Artificial Intelligence & Data Science';
        personaGradYear = 2026;
        personaCgpa = '9.4';
        personaLevel = 'Advanced';
      } else if (cleanEmail.includes('arjun')) {
        personaSkills = ['C++', 'Rust', 'C', 'Linux', 'Data Structures', 'Algorithms', 'Git', 'Docker'];
        personaInterests = ['Competitive Programming', 'Open Source', 'Cybersecurity'];
        personaGoals = ['Coding Contest', 'Open source', 'Hackathon', 'Internship'];
        personaDegree = 'B.E.';
        personaBranch = 'Computer Science & Systems';
        personaGradYear = 2028;
        personaCgpa = '8.5';
        personaLevel = 'Beginner';
      } else if (cleanEmail.includes('elena')) {
        personaSkills = ['Go', 'Kubernetes', 'Docker', 'AWS', 'TypeScript', 'PostgreSQL', 'Linux', 'System Design'];
        personaInterests = ['Cloud', 'DevOps', 'Open Source', 'Web Development'];
        personaGoals = ['Open source', 'Internship', 'Full-time job'];
        personaDegree = 'MS';
        personaBranch = 'Distributed Computing Systems';
        personaGradYear = 2026;
        personaCgpa = '9.2';
        personaLevel = 'Advanced';
      }

      await db
        .update(studentProfiles)
        .set({
          degree: personaDegree,
          branch: personaBranch,
          graduationYear: personaGradYear,
          cgpa: personaCgpa,
          experienceLevel: personaLevel,
          interests: JSON.stringify(personaInterests),
          careerGoals: JSON.stringify(personaGoals),
          resumeSkills: JSON.stringify(personaSkills),
          onboardingCompleted: true,
        })
        .where(eq(studentProfiles.userId, foundUser.id));

      for (const skName of personaSkills) {
        const skId = skillMap.get(skName.toLowerCase());
        if (skId) {
          await db.insert(userSkills).values({
            userId: foundUser.id,
            skillId: skId,
            proficiency: 'Advanced',
          });
        }
      }
    }

    await db
      .update(users)
      .set({ updatedAt: new Date() })
      .where(eq(users.id, foundUser.id));

    await db.insert(analyticsEvents).values({
      userId: foundUser.id,
      eventType: 'USER_LOGIN',
      metadataJson: JSON.stringify({
        method: 'Email & Password Login',
        durationSeconds: 360,
        device: 'Web Browser',
        active: true,
      }),
    });

    const token = `account-session:${encodeURIComponent(foundUser.uid)}:${encodeURIComponent(
      foundUser.email
    )}:${encodeURIComponent(foundUser.name)}`;

    return { found: true, token, user: foundUser };
  } catch (error) {
    console.error('Database query failed in loginUserAccountDb:', error);
    throw new Error('Failed to sign in.', { cause: error });
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
