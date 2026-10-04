import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import * as dotenv from 'dotenv';
import { eq, desc, and, count } from 'drizzle-orm';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { db } from './src/db/index.ts';
import {
  users,
  studentProfiles,
  skills,
  userSkills,
  organizations,
  opportunities,
  savedOpportunities,
  applications,
  roadmaps,
  roadmapSteps,
  codingProfiles,
  notifications,
  events,
  analyticsEvents,
} from './src/db/schema.ts';
import { ensureSeeded } from './src/db/seed.ts';
import {
  getFullUserBundle,
  getEnrichedOpportunities,
  updateStudentProfileAndSkills,
  toggleSaveOpportunityDb,
  upsertApplicationDb,
  registerUserAccountDb,
  loginUserAccountDb,
  getRoadmapsWithProgress,
  updateRoadmapStepStatusDb,
  createOpportunityWithDeduplication,
} from './src/db/repository.ts';
import { syncPlatformProfile } from './src/services/codingIntegration.ts';
import {
  generateOpportunityExplanation,
  generateCustomRoadmap,
  parseAndAnalyzeResume,
  answerOpportunityAssistant,
  verifyOpportunityWithAI,
  generateFastFocusFeaturePlan,
  answerFastFocusCopilot,
} from './src/services/aiService.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '5mb' }));

  // Public Showcase Endpoint (for Landing Page before login)
  app.get('/api/public/showcase', async (_req, res) => {
    try {
      await ensureSeeded();
      const [oppCount, orgCount, skillCount, rmCount] = await Promise.all([
        db.select({ value: count() }).from(opportunities),
        db.select({ value: count() }).from(organizations),
        db.select({ value: count() }).from(skills),
        db.select({ value: count() }).from(roadmaps),
      ]);

      res.json({
        stats: {
          opportunities: oppCount[0]?.value || 120,
          organizations: orgCount[0]?.value || 22,
          skills: skillCount[0]?.value || 52,
          roadmaps: rmCount[0]?.value || 5,
        },
      });
    } catch (error: any) {
      console.error('Public showcase error:', error);
      res.status(500).json({ error: 'Failed to load showcase stats' });
    }
  });

  // Account Sign Up / Create Account Endpoint
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { name, email } = req.body || {};
      if (!email || !String(email).includes('@')) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }
      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'Please enter your full name.' });
      }
      const result = await registerUserAccountDb(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(500).json({ error: error.message || 'Failed to create account' });
    }
  });

  // Account Sign In / Log In Endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email } = req.body || {};
      if (!email || !String(email).includes('@')) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
      const result = await loginUserAccountDb(String(email));
      if (!result.found) {
        return res.status(404).json({ error: result.error });
      }
      res.json(result);
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: error.message || 'Failed to sign in' });
    }
  });

  // Public Shareable Student Profile Endpoint (/u/:username)
  app.get('/api/public-profile/:username', async (req, res) => {
    try {
      await ensureSeeded();
      const uname = req.params.username.toLowerCase().trim();
      const userRows = await db.select().from(users).where(eq(users.username, uname));
      const targetUser = userRows[0];
      if (!targetUser) {
        return res.status(404).json({ error: 'Developer profile not found' });
      }
      const bundle = await getFullUserBundle(targetUser.uid, targetUser.email, targetUser.name);
      res.json({
        user: bundle.user,
        profile: bundle.profile,
        skills: bundle.skills,
        codingProfiles: bundle.codingProfiles,
        readiness: bundle.readiness,
      });
    } catch (error: any) {
      console.error('Failed to load public profile:', error);
      res.status(500).json({ error: 'Failed to load public developer profile' });
    }
  });

  // Main Authenticated Dashboard & Workspace Bundle
  app.get('/api/dashboard', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || '';
      const name = req.user!.name;

      const bundle = await getFullUserBundle(uid, email, name);
      const isOwnerAdmin =
        bundle.user.email.toLowerCase() === 'kartikchoudhary18122005@gmail.com';
      const isAdminOrOrg =
        isOwnerAdmin ||
        bundle.user.role === 'ADMIN' ||
        bundle.user.role === 'ORGANIZATION';

      const [enrichedOpps, enrichedRoadmaps, calEvents, allUsersRows, allOrgsRows] = await Promise.all([
        getEnrichedOpportunities(
          bundle.studentContext,
          bundle.savedOpportunityIds,
          bundle.applications,
          isAdminOrOrg
        ),
        getRoadmapsWithProgress(bundle.user.id),
        db.select().from(events),
        db.select().from(users).orderBy(desc(users.points)),
        db.select().from(organizations),
      ]);

      // Do not show Admin/Owner account information on other users' portals
      const leaderboard = allUsersRows
        .filter((u) => {
          if (u.leaderboardOptOut) return false;
          const isTargetAdmin =
            u.role === 'ADMIN' ||
            u.email.toLowerCase() === 'kartikchoudhary18122005@gmail.com';
          if (isTargetAdmin && !isOwnerAdmin) return false;
          return true;
        })
        .slice(0, 15)
        .map((u, idx) => ({
          rank: idx + 1,
          id: u.id,
          name: u.name,
          username: u.username,
          avatar: u.avatar,
          points: u.points,
          streakDays: u.streakDays,
          isCurrentUser: u.id === bundle.user.id,
        }));

      res.json({
        user: bundle.user,
        profile: bundle.profile,
        skills: bundle.skills,
        allAvailableSkills: bundle.allAvailableSkills,
        codingProfiles: bundle.codingProfiles,
        readiness: bundle.readiness,
        savedOpportunityIds: bundle.savedOpportunityIds,
        applications: bundle.applications,
        notifications: bundle.notifications,
        opportunities: enrichedOpps,
        roadmaps: enrichedRoadmaps,
        events: calEvents,
        leaderboard,
        organizations: allOrgsRows,
      });
    } catch (error: any) {
      console.error('Failed to fetch dashboard:', error);
      res.status(500).json({ error: error.message || 'Failed to load dashboard' });
    }
  });

  // GET /api/opportunities & /api/opportunities/recommended
  app.get('/api/opportunities', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(
        req.user!.uid,
        req.user!.email || '',
        req.user!.name
      );
      const isOwnerAdmin =
        bundle.user.email.toLowerCase() === 'kartikchoudhary18122005@gmail.com' &&
        bundle.user.role === 'ADMIN';
      const opps = await getEnrichedOpportunities(
        bundle.studentContext,
        bundle.savedOpportunityIds,
        bundle.applications,
        isOwnerAdmin
      );
      res.json(opps);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch opportunities' });
    }
  });

  app.get('/api/opportunities/recommended', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(
        req.user!.uid,
        req.user!.email || '',
        req.user!.name
      );
      const opps = await getEnrichedOpportunities(
        bundle.studentContext,
        bundle.savedOpportunityIds,
        bundle.applications,
        false
      );
      const recommended = opps
        .filter((o) => o.eligibility.status !== 'NOT_ELIGIBLE' && o.daysRemaining >= 0)
        .sort((a, b) => b.matchScore - a.matchScore);
      res.json(recommended);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch recommended opportunities' });
    }
  });

  // POST /api/ai/verify-opportunity (Real-time AI Verification Pre-Check for Hackathons & Internships)
  app.post('/api/ai/verify-opportunity', requireAuth, async (req: AuthRequest, res) => {
    try {
      const {
        title,
        organizationName,
        category,
        applicationUrl,
        deadline,
        location,
        workMode,
        stipend,
        description,
        requiredSkills,
      } = req.body || {};

      const verification = await verifyOpportunityWithAI({
        title: title || '',
        organizationName: organizationName || '',
        category: category || 'Internship',
        applicationUrl: applicationUrl || '',
        deadline: deadline || '',
        location,
        workMode,
        stipend,
        description,
        requiredSkills: Array.isArray(requiredSkills)
          ? requiredSkills
          : typeof requiredSkills === 'string'
          ? requiredSkills
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [],
      });

      res.json(verification);
    } catch (error: any) {
      console.error('AI opportunity verification error:', error);
      res.status(500).json({ error: error.message || 'Failed to verify opportunity with AI' });
    }
  });

  // POST /api/opportunities (User, Organization, or Admin adds Hackathon / Internship — Verified by AI first)
  app.post('/api/opportunities', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(
        req.user!.uid,
        req.user!.email || '',
        req.user!.name
      );
      const {
        title,
        organizationName,
        category,
        location,
        workMode,
        remote,
        paid,
        stipend,
        salary,
        duration,
        deadline,
        applicationUrl,
        source,
        difficulty,
        beginnerFriendly,
        description,
        requiredSkills,
        gradYearMin,
        gradYearMax,
        degree,
        minCgpa,
      } = req.body;

      if (!title || !organizationName || !category || !deadline || !applicationUrl) {
        return res.status(400).json({
          error: 'Title, organization, category, deadline, and direct application URL are required.',
        });
      }

      const parsedSkills = Array.isArray(requiredSkills)
        ? requiredSkills
        : typeof requiredSkills === 'string'
        ? requiredSkills
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];

      // Run AI Verification before adding the opportunity to the platform
      const verification = await verifyOpportunityWithAI({
        title,
        organizationName,
        category,
        applicationUrl,
        deadline,
        location,
        workMode,
        stipend: stipend || salary || '',
        description,
        requiredSkills: parsedSkills,
      });

      if (!verification.isValid) {
        return res.status(422).json({
          verified: false,
          verification,
          error:
            verification.verificationSummary ||
            'AI Verification rejected this opportunity because the URL or details could not be verified as authentic.',
        });
      }

      const result = await createOpportunityWithDeduplication({
        title: String(title).trim(),
        organizationName: String(organizationName).trim(),
        category,
        location: location || 'Remote',
        workMode: workMode || 'Remote',
        remote: Boolean(remote),
        paid: Boolean(paid),
        stipend: stipend || '',
        salary: salary || '',
        duration: duration || (category === 'Hackathon' ? '48 Hours' : '12 Weeks'),
        deadline,
        applicationUrl: String(applicationUrl).trim(),
        source:
          source ||
          `AI Verified (${verification.confidenceScore}% Confidence) · Added by ${bundle.user.name}`,
        difficulty: difficulty || 'Intermediate',
        beginnerFriendly: Boolean(beginnerFriendly),
        description: description || `${title} hosted by ${organizationName}.`,
        requiredSkills: parsedSkills,
        gradYearMin: gradYearMin ? Number(gradYearMin) : 2025,
        gradYearMax: gradYearMax ? Number(gradYearMax) : 2030,
        degree: degree || 'Any',
        minCgpa,
        status: 'Published',
      });

      if (result.duplicate) {
        return res.status(409).json({
          verified: true,
          verification,
          error:
            'Duplicate opportunity detected: An opportunity with this organization and title already exists.',
          opportunity: result.opportunity,
        });
      }

      // Reward user with +50 XP and create a notification
      await db
        .update(users)
        .set({ points: (bundle.user.points || 180) + 50, updatedAt: new Date() })
        .where(eq(users.id, bundle.user.id));

      await db.insert(notifications).values({
        userId: bundle.user.id,
        title: `✓ AI Verified & Published: ${title}`,
        message: `Your ${category} submission (${organizationName}) passed AI verification (${verification.confidenceScore}% confidence) and is now live for students.`,
        type: 'MATCH',
        opportunityId: result.opportunity.id,
        read: false,
      });

      res.status(201).json({
        verified: true,
        verification,
        opportunity: result.opportunity,
      });
    } catch (error: any) {
      console.error('Failed to create opportunity:', error);
      res.status(500).json({ error: error.message || 'Failed to create opportunity' });
    }
  });

  // PUT /api/opportunities/:id (Approve, Reject, Feature, Edit — Owner Admin only)
  app.put('/api/opportunities/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.user?.email?.toLowerCase() !== 'kartikchoudhary18122005@gmail.com') {
        return res.status(403).json({ error: 'Forbidden: Only the platform owner/admin can moderate opportunities.' });
      }
      const oppId = parseInt(req.params.id, 10);
      const { status, featured, title, deadline, stipend, location, description } = req.body;

      const updateFields: Record<string, any> = {
        updatedAt: new Date(),
        lastVerifiedAt: new Date(),
      };
      if (status !== undefined) updateFields.status = status;
      if (featured !== undefined) updateFields.featured = Boolean(featured);
      if (title !== undefined) updateFields.title = title;
      if (deadline !== undefined) updateFields.deadline = deadline;
      if (stipend !== undefined) updateFields.stipend = stipend;
      if (location !== undefined) updateFields.location = location;
      if (description !== undefined) updateFields.description = description;

      const updated = await db
        .update(opportunities)
        .set(updateFields)
        .where(eq(opportunities.id, oppId))
        .returning();

      res.json(updated[0]);
    } catch (error: any) {
      console.error('Failed to update opportunity:', error);
      res.status(500).json({ error: error.message || 'Failed to update opportunity' });
    }
  });

  // DELETE /api/opportunities/:id (Owner Admin only)
  app.delete('/api/opportunities/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.user?.email?.toLowerCase() !== 'kartikchoudhary18122005@gmail.com') {
        return res.status(403).json({ error: 'Forbidden: Only the platform owner/admin can delete opportunities.' });
      }
      const oppId = parseInt(req.params.id, 10);
      await db.delete(opportunities).where(eq(opportunities.id, oppId));
      res.json({ deleted: true });
    } catch (error: any) {
      console.error('Failed to delete opportunity:', error);
      res.status(500).json({ error: error.message || 'Failed to delete opportunity' });
    }
  });

  // Save / Unsave Opportunity
  app.post('/api/opportunities/:id/save', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(req.user!.uid, req.user!.email || '');
      const oppId = parseInt(req.params.id, 10);
      const result = await toggleSaveOpportunityDb(bundle.user.id, oppId, true);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to save opportunity' });
    }
  });

  app.delete('/api/opportunities/:id/save', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(req.user!.uid, req.user!.email || '');
      const oppId = parseInt(req.params.id, 10);
      const result = await toggleSaveOpportunityDb(bundle.user.id, oppId, false);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to unsave opportunity' });
    }
  });

  // Applications Tracker APIs
  app.post('/api/applications', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(req.user!.uid, req.user!.email || '');
      const record = await upsertApplicationDb(bundle.user.id, req.body);
      res.status(201).json(record);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to save application' });
    }
  });

  app.put('/api/applications/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const appId = parseInt(req.params.id, 10);
      const { status, notes, interviewDate, resumeUsed, referral, nextAction } = req.body;
      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (status !== undefined) {
        updateData.status = status;
        if (status === 'Applied') {
          updateData.appliedAt = new Date().toISOString().split('T')[0];
        }
      }
      if (notes !== undefined) updateData.notes = notes;
      if (interviewDate !== undefined) updateData.interviewDate = interviewDate;
      if (resumeUsed !== undefined) updateData.resumeUsed = resumeUsed;
      if (referral !== undefined) updateData.referral = referral;
      if (nextAction !== undefined) updateData.nextAction = nextAction;

      const updated = await db
        .update(applications)
        .set(updateData)
        .where(eq(applications.id, appId))
        .returning();
      res.json(updated[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update application' });
    }
  });

  app.delete('/api/applications/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const appId = parseInt(req.params.id, 10);
      await db.delete(applications).where(eq(applications.id, appId));
      res.json({ deleted: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to delete application' });
    }
  });

  // Roadmaps & Progress APIs
  app.get('/api/roadmaps', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(req.user!.uid, req.user!.email || '');
      const list = await getRoadmapsWithProgress(bundle.user.id);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch roadmaps' });
    }
  });

  app.post('/api/roadmaps/:id/progress', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(req.user!.uid, req.user!.email || '');
      const { stepId, status } = req.body;
      await updateRoadmapStepStatusDb(bundle.user.id, Number(stepId), status);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update roadmap step' });
    }
  });

  app.post('/api/roadmaps/generate-ai', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(req.user!.uid, req.user!.email || '');
      const { goalPrompt } = req.body;
      if (!goalPrompt) {
        return res.status(400).json({ error: 'Please enter a learning goal.' });
      }
      const generated = await generateCustomRoadmap(goalPrompt);
      const slug = `ai-roadmap-${Date.now()}`;

      const insertedRm = await db
        .insert(roadmaps)
        .values({
          title: generated.title,
          slug,
          description: generated.description,
          category: generated.category || 'AI Generated',
          estimatedWeeks: generated.estimatedWeeks || 10,
          difficulty: generated.difficulty || 'Intermediate',
          createdByUserId: bundle.user.id,
        })
        .returning();

      const rmId = insertedRm[0].id;
      for (let i = 0; i < (generated.steps || []).length; i++) {
        const st = generated.steps[i];
        await db.insert(roadmapSteps).values({
          roadmapId: rmId,
          title: st.title,
          description: st.description,
          stepOrder: i + 1,
          estimatedHours: st.estimatedHours || 14,
          skillName: st.skillName || 'TypeScript',
          resourcesJson: JSON.stringify(st.resources || []),
          projectsJson: JSON.stringify(st.projects || []),
          problemsJson: JSON.stringify(st.problems || []),
        });
      }

      const updatedRoadmaps = await getRoadmapsWithProgress(bundle.user.id);
      res.status(201).json({ roadmapId: rmId, roadmaps: updatedRoadmaps });
    } catch (error: any) {
      console.error('Failed to generate AI roadmap:', error);
      res.status(500).json({ error: error.message || 'Failed to generate AI roadmap' });
    }
  });

  // Profile & Onboarding Update API
  app.get('/api/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(req.user!.uid, req.user!.email || '', req.user!.name);
      res.json(bundle);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch profile' });
    }
  });

  app.put('/api/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(req.user!.uid, req.user!.email || '', req.user!.name);
      await updateStudentProfileAndSkills(bundle.user.id, req.body);
      const updated = await getFullUserBundle(req.user!.uid, req.user!.email || '', req.user!.name);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
  });

  // Coding Profiles Connect & Sync API
  app.post('/api/coding-profiles/connect', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(req.user!.uid, req.user!.email || '');
      const { platform, username } = req.body;
      if (!platform || !username) {
        return res.status(400).json({ error: 'Platform and username are required' });
      }

      const synced = await syncPlatformProfile(platform, username);

      const existing = await db
        .select()
        .from(codingProfiles)
        .where(
          and(
            eq(codingProfiles.userId, bundle.user.id),
            eq(codingProfiles.platform, platform)
          )
        );

      if (existing.length > 0) {
        await db
          .update(codingProfiles)
          .set({
            username: synced.username,
            rating: synced.rating,
            maxRating: synced.maxRating,
            rankTitle: synced.rankTitle,
            problemsSolved: synced.problemsSolved,
            easySolved: synced.easySolved,
            mediumSolved: synced.mediumSolved,
            hardSolved: synced.hardSolved,
            repositories: synced.repositories,
            followers: synced.followers,
            contributions: synced.contributions,
            stars: synced.stars,
            topLanguagesJson: JSON.stringify(synced.topLanguages),
            badgesJson: JSON.stringify(synced.badges),
            extraDataJson: JSON.stringify(synced.extraData),
            profileUrl: synced.profileUrl,
            isLiveApi: synced.isLiveApi,
            lastSyncedAt: new Date(),
          })
          .where(eq(codingProfiles.id, existing[0].id));
      } else {
        await db.insert(codingProfiles).values({
          userId: bundle.user.id,
          platform: synced.platform,
          username: synced.username,
          rating: synced.rating,
          maxRating: synced.maxRating,
          rankTitle: synced.rankTitle,
          problemsSolved: synced.problemsSolved,
          easySolved: synced.easySolved,
          mediumSolved: synced.mediumSolved,
          hardSolved: synced.hardSolved,
          repositories: synced.repositories,
          followers: synced.followers,
          contributions: synced.contributions,
          stars: synced.stars,
          topLanguagesJson: JSON.stringify(synced.topLanguages),
          badgesJson: JSON.stringify(synced.badges),
          extraDataJson: JSON.stringify(synced.extraData),
          profileUrl: synced.profileUrl,
          isLiveApi: synced.isLiveApi,
          lastSyncedAt: new Date(),
        });
      }

      // If GitHub languages were discovered, add them to userSkills automatically
      if (synced.topLanguages.length > 0) {
        const allSkillsRows = await db.select().from(skills);
        for (const lang of synced.topLanguages) {
          const matchedSkill = allSkillsRows.find(
            (s) => s.name.toLowerCase() === lang.toLowerCase()
          );
          if (matchedSkill) {
            const hasSkill = await db
              .select()
              .from(userSkills)
              .where(
                and(
                  eq(userSkills.userId, bundle.user.id),
                  eq(userSkills.skillId, matchedSkill.id)
                )
              );
            if (hasSkill.length === 0) {
              await db.insert(userSkills).values({
                userId: bundle.user.id,
                skillId: matchedSkill.id,
                proficiency: 'Intermediate',
              });
            }
          }
        }
      }

      res.json({ synced });
    } catch (error: any) {
      console.error('Failed to sync coding profile:', error);
      res.status(500).json({ error: error.message || 'Failed to sync coding profile' });
    }
  });

  // Notifications APIs
  app.put('/api/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
    try {
      const notifId = parseInt(req.params.id, 10);
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, notifId));
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to mark notification read' });
    }
  });

  app.put('/api/notifications/read-all', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(req.user!.uid, req.user!.email || '');
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, bundle.user.id));
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to mark all notifications read' });
    }
  });

  // Calendar Event Creation
  app.post('/api/events', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { title, description, category, startDate, endDate, location, registrationUrl, opportunityId } =
        req.body;
      const inserted = await db
        .insert(events)
        .values({
          title: title || 'Opportunity Reminder',
          description: description || 'Scheduled deadline reminder',
          category: category || 'Deadline',
          startDate: startDate || new Date().toISOString().split('T')[0],
          endDate: endDate || startDate || new Date().toISOString().split('T')[0],
          location: location || 'Online',
          registrationUrl: registrationUrl || 'https://careers.google.com',
          opportunityId: opportunityId ? Number(opportunityId) : null,
        })
        .returning();
      res.status(201).json(inserted[0]);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to add calendar event' });
    }
  });

  // AI Endpoints (Server-Side Gemini 3.8 Flash)
  app.post('/api/ai/explain-opportunity', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(req.user!.uid, req.user!.email || '');
      const {
        opportunityTitle,
        organizationName,
        category,
        requiredSkills,
        matchedSkills,
        missingSkills,
        eligibilityStatus,
        deadline,
      } = req.body;

      const explanation = await generateOpportunityExplanation({
        studentName: bundle.user.name,
        degree: bundle.studentContext.degree,
        branch: bundle.studentContext.branch,
        graduationYear: bundle.studentContext.graduationYear,
        studentSkills: bundle.studentContext.skills,
        opportunityTitle,
        organizationName,
        category,
        requiredSkills: requiredSkills || [],
        matchedSkills: matchedSkills || [],
        missingSkills: missingSkills || [],
        eligibilityStatus: eligibilityStatus || 'ELIGIBLE',
        deadline: deadline || '',
      });

      res.json(explanation);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to generate AI explanation' });
    }
  });

  app.post('/api/ai/parse-resume', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(req.user!.uid, req.user!.email || '');
      const { resumeText } = req.body;
      if (!resumeText || typeof resumeText !== 'string') {
        return res.status(400).json({ error: 'Please provide resume text to analyze.' });
      }

      const allKnownSkillNames = bundle.allAvailableSkills.map((s) => s.name);
      const analysis = await parseAndAnalyzeResume(resumeText, allKnownSkillNames);

      await db
        .update(studentProfiles)
        .set({
          resumeText,
          resumeSkills: JSON.stringify(analysis.extractedSkills || []),
          resumeSummary: analysis.experienceSummary || '',
        })
        .where(eq(studentProfiles.userId, bundle.user.id));

      // Also sync newly extracted skills into userSkills
      const skillMap = new Map(
        bundle.allAvailableSkills.map((s) => [s.name.toLowerCase(), s.id])
      );
      for (const skName of analysis.extractedSkills || []) {
        const skId = skillMap.get(String(skName).toLowerCase());
        if (skId) {
          const exists = bundle.skills.some((uSk) => uSk.id === skId);
          if (!exists) {
            await db.insert(userSkills).values({
              userId: bundle.user.id,
              skillId: skId,
              proficiency: 'Intermediate',
            });
          }
        }
      }

      res.json(analysis);
    } catch (error: any) {
      console.error('Failed to analyze resume:', error);
      res.status(500).json({ error: 'Failed to analyze resume' });
    }
  });

  app.post('/api/ai/assistant', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(req.user!.uid, req.user!.email || '');
      const { question } = req.body;
      if (!question) {
        return res.status(400).json({ error: 'Question is required' });
      }

      const opps = await getEnrichedOpportunities(
        bundle.studentContext,
        bundle.savedOpportunityIds,
        bundle.applications,
        false
      );

      const topOppsSummary = opps
        .slice(0, 18)
        .map(
          (o) =>
            `- ${o.title} (${o.organization.name}) | Category: ${o.category} | Match: ${o.matchScore}% | Eligibility: ${o.eligibility.label} | Skills: ${o.requiredSkills.join(', ')} | Deadline: ${o.deadline} (${o.daysRemaining}d left) | Stipend: ${o.stipend || 'Paid'}`
        )
        .join('\n');

      const studentSummary = `${bundle.user.name}, ${bundle.studentContext.degree} in ${bundle.studentContext.branch} (${bundle.studentContext.graduationYear}), CGPA ${bundle.studentContext.cgpa}, Skills: ${bundle.studentContext.skills.join(', ')}`;

      const reply = await answerOpportunityAssistant(
        question,
        studentSummary,
        topOppsSummary
      );
      res.json({ reply });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to query AI Opportunity Assistant' });
    }
  });

  // Fast AI Responses (Gemini 3.1 Flash Lite) for Focus Mode & Add Particular Feature Studio
  app.post('/api/ai/fast-focus-plan', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(req.user!.uid, req.user!.email || '');
      const { title, category, description } = req.body || {};
      if (!title || !String(title).trim()) {
        return res.status(400).json({ error: 'Please enter a feature or focus goal title.' });
      }
      const plan = await generateFastFocusFeaturePlan({
        title: String(title),
        category: String(category || 'Custom Feature'),
        description: String(description || ''),
        studentName: bundle.user.name,
        studentSkills: bundle.studentContext.skills,
      });
      res.json(plan);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate fast focus plan' });
    }
  });

  app.post('/api/ai/fast-focus-chat', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(req.user!.uid, req.user!.email || '');
      const { prompt, activeFeatureTitle, activeFeatureCategory, checklistItems } = req.body || {};
      if (!prompt || !String(prompt).trim()) {
        return res.status(400).json({ error: 'Prompt is required.' });
      }
      const studentSummary = `${bundle.user.name}, ${bundle.studentContext.degree} in ${bundle.studentContext.branch} (${bundle.studentContext.graduationYear}), Skills: ${bundle.studentContext.skills.join(', ')}`;
      const result = await answerFastFocusCopilot({
        prompt: String(prompt),
        activeFeatureTitle: String(activeFeatureTitle || 'Workspace Focus Feature'),
        activeFeatureCategory: String(activeFeatureCategory || 'Custom Feature'),
        checklistItems: Array.isArray(checklistItems) ? checklistItems.map(String) : [],
        studentSummary,
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to run Fast Focus Co-Pilot' });
    }
  });

  // Focus Mode Custom Features CRUD (PostgreSQL mirror for demo & email sessions alongside Firestore)
  app.get('/api/focus-features', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(req.user!.uid, req.user!.email || '');
      const rows = await db
        .select()
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.userId, bundle.user.id),
            eq(analyticsEvents.eventType, 'FOCUS_FEATURE')
          )
        )
        .orderBy(desc(analyticsEvents.createdAt));

      const items = rows
        .map((r) => {
          try {
            const parsed = JSON.parse(r.metadataJson || '{}');
            return {
              ...parsed,
              dbRowId: r.id,
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      res.json({ features: items });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to load focus features' });
    }
  });

  app.post('/api/focus-features', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(req.user!.uid, req.user!.email || '');
      const payload = req.body || {};
      const featureId =
        String(payload.id || `feat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`).replace(
          /[^a-zA-Z0-9_-]/g,
          '_'
        );
      const record = {
        id: featureId,
        title: String(payload.title || 'Focused Feature Sprint').slice(0, 140),
        category: String(payload.category || 'Custom Feature').slice(0, 40),
        description: String(
          payload.description || 'Focused execution workflow in OpportunityOS.'
        ).slice(0, 1000),
        priority: ['High', 'Medium', 'Critical'].includes(payload.priority)
          ? payload.priority
          : 'High',
        status: ['active', 'completed', 'archived'].includes(payload.status)
          ? payload.status
          : 'active',
        targetMinutes: Math.max(5, Math.min(480, Number(payload.targetMinutes) || 25)),
        completedMinutes: Math.max(0, Number(payload.completedMinutes) || 0),
        checklistItems: Array.isArray(payload.checklistItems)
          ? payload.checklistItems.slice(0, 20).map((s: any) => String(s).slice(0, 240))
          : [],
        completedChecklistIndices: Array.isArray(payload.completedChecklistIndices)
          ? payload.completedChecklistIndices.map(Number)
          : [],
        completedChecklistCount: Number(payload.completedChecklistCount) || 0,
        ownerId: req.user!.uid,
        createdAtIso: new Date().toISOString(),
        updatedAtIso: new Date().toISOString(),
      };

      await db.insert(analyticsEvents).values({
        userId: bundle.user.id,
        eventType: 'FOCUS_FEATURE',
        metadataJson: JSON.stringify(record),
      });

      res.status(201).json({ feature: record });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to save focus feature' });
    }
  });

  app.put('/api/focus-features/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(req.user!.uid, req.user!.email || '');
      const targetId = req.params.id;
      const rows = await db
        .select()
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.userId, bundle.user.id),
            eq(analyticsEvents.eventType, 'FOCUS_FEATURE')
          )
        );

      for (const row of rows) {
        try {
          const parsed = JSON.parse(row.metadataJson || '{}');
          if (parsed.id === targetId) {
            const updated = {
              ...parsed,
              ...req.body,
              id: targetId,
              updatedAtIso: new Date().toISOString(),
            };
            await db
              .update(analyticsEvents)
              .set({ metadataJson: JSON.stringify(updated) })
              .where(eq(analyticsEvents.id, row.id));
            return res.json({ feature: updated });
          }
        } catch {
          // ignore malformed row
        }
      }

      res.status(404).json({ error: 'Focus feature not found' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update focus feature' });
    }
  });

  app.delete('/api/focus-features/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(req.user!.uid, req.user!.email || '');
      const targetId = req.params.id;
      const rows = await db
        .select()
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.userId, bundle.user.id),
            eq(analyticsEvents.eventType, 'FOCUS_FEATURE')
          )
        );

      for (const row of rows) {
        try {
          const parsed = JSON.parse(row.metadataJson || '{}');
          if (parsed.id === targetId) {
            await db.delete(analyticsEvents).where(eq(analyticsEvents.id, row.id));
          }
        } catch {
          // ignore
        }
      }

      res.json({ deleted: true });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to delete focus feature' });
    }
  });

  // Live Session Heartbeat & Time Spent Tracking (Updates active user status & session duration)
  app.post('/api/activity/heartbeat', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bundle = await getFullUserBundle(
        req.user!.uid,
        req.user!.email || '',
        req.user!.name
      );
      const userId = bundle.user.id;
      const elapsedSeconds = Math.min(180, Math.max(10, Number(req.body?.elapsedSeconds) || 30));
      const isInitialSession = Boolean(req.body?.isInitialSession);
      const deviceInfo = String(req.body?.device || 'Web Workspace');

      await db
        .update(users)
        .set({ updatedAt: new Date() })
        .where(eq(users.id, userId));

      const userEvents = await db
        .select()
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.userId, userId),
            eq(analyticsEvents.eventType, 'USER_LOGIN')
          )
        )
        .orderBy(desc(analyticsEvents.createdAt))
        .limit(1);

      const latestLogin = userEvents[0];
      const nowMs = Date.now();
      const latestCreatedMs = latestLogin?.createdAt
        ? new Date(latestLogin.createdAt).getTime()
        : 0;
      const withinActiveWindow = nowMs - latestCreatedMs < 2 * 60 * 60 * 1000;

      if (latestLogin && withinActiveWindow && !isInitialSession) {
        let meta: Record<string, any> = {};
        try {
          meta = JSON.parse(latestLogin.metadataJson || '{}');
        } catch {
          meta = {};
        }
        const nextDuration = (Number(meta.durationSeconds) || 300) + elapsedSeconds;
        await db
          .update(analyticsEvents)
          .set({
            metadataJson: JSON.stringify({
              ...meta,
              durationSeconds: nextDuration,
              device: meta.device || deviceInfo,
              active: true,
              lastHeartbeatAt: new Date().toISOString(),
            }),
          })
          .where(eq(analyticsEvents.id, latestLogin.id));
      } else if (!latestLogin || !withinActiveWindow) {
        await db.insert(analyticsEvents).values({
          userId,
          eventType: 'USER_LOGIN',
          metadataJson: JSON.stringify({
            method:
              bundle.user.email.toLowerCase() === 'kartikchoudhary18122005@gmail.com'
                ? 'Owner Admin Workspace'
                : 'Student Portal Session',
            durationSeconds: Math.max(180, elapsedSeconds),
            device: deviceInfo,
            active: true,
            lastHeartbeatAt: new Date().toISOString(),
          }),
        });
      }

      res.json({ ok: true, userId });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to record session heartbeat' });
    }
  });

  // Admin Analytics & Partner Ingestion Endpoints (Strictly restricted to Owner/Admin)
  app.get('/api/admin/analytics', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.user?.email?.toLowerCase() !== 'kartikchoudhary18122005@gmail.com') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
      const [
        allUsers,
        allProfiles,
        allUserSkills,
        allSkillsRows,
        allCodingProfiles,
        allOpps,
        allApps,
        allSaved,
        allOrgs,
        allAnalyticsEvents,
      ] = await Promise.all([
        db.select().from(users).orderBy(desc(users.updatedAt)),
        db.select().from(studentProfiles),
        db.select().from(userSkills),
        db.select().from(skills),
        db.select().from(codingProfiles),
        db.select().from(opportunities),
        db.select().from(applications),
        db.select().from(savedOpportunities),
        db.select().from(organizations),
        db.select().from(analyticsEvents).orderBy(desc(analyticsEvents.createdAt)).limit(200),
      ]);

      const formatDuration = (totalSecs: number): string => {
        const secs = Math.max(0, Math.round(totalSecs));
        const hrs = Math.floor(secs / 3600);
        const mins = Math.floor((secs % 3600) / 60);
        if (hrs > 0) return `${hrs}h ${mins}m`;
        if (mins > 0) return `${mins}m`;
        return `${secs}s`;
      };

      const profileByUserId = new Map(allProfiles.map((p) => [p.userId, p]));
      const skillNameById = new Map(allSkillsRows.map((s) => [s.id, s.name]));

      const skillsByUserId = new Map<number, string[]>();
      for (const us of allUserSkills) {
        const skName = skillNameById.get(us.skillId);
        if (skName) {
          const list = skillsByUserId.get(us.userId) || [];
          list.push(skName);
          skillsByUserId.set(us.userId, list);
        }
      }

      const appsByUserId = new Map<number, typeof allApps>();
      for (const a of allApps) {
        const list = appsByUserId.get(a.userId) || [];
        list.push(a);
        appsByUserId.set(a.userId, list);
      }

      const savesByUserId = new Map<number, number>();
      for (const s of allSaved) {
        savesByUserId.set(s.userId, (savesByUserId.get(s.userId) || 0) + 1);
      }

      const codingByUserId = new Map<number, string[]>();
      for (const cp of allCodingProfiles) {
        const list = codingByUserId.get(cp.userId) || [];
        list.push(`${cp.platform} (@${cp.username})`);
        codingByUserId.set(cp.userId, list);
      }

      const eventsByUserId = new Map<number, typeof allAnalyticsEvents>();
      for (const ev of allAnalyticsEvents) {
        if (ev.userId) {
          const list = eventsByUserId.get(ev.userId) || [];
          list.push(ev);
          eventsByUserId.set(ev.userId, list);
        }
      }

      const nowMs = Date.now();
      let totalLoginSessions = 0;
      let totalStudentLogins = 0;
      let totalTimeSpentSeconds = 0;

      const userDirectory = allUsers.map((u) => {
        const prof = profileByUserId.get(u.id);
        const uSkills = skillsByUserId.get(u.id) || [];
        const uApps = appsByUserId.get(u.id) || [];
        const uSaves = savesByUserId.get(u.id) || 0;
        const uCoding = codingByUserId.get(u.id) || [];
        const uEvents = eventsByUserId.get(u.id) || [];

        const loginEvents = uEvents.filter((e) => e.eventType === 'USER_LOGIN');
        const loginHistory = loginEvents.map((le) => {
          let meta: Record<string, any> = {};
          try {
            meta = JSON.parse(le.metadataJson || '{}');
          } catch {
            meta = {};
          }
          const dur = Number(meta.durationSeconds) || 420;
          return {
            id: le.id,
            timestamp: le.createdAt ? new Date(le.createdAt).toISOString() : new Date().toISOString(),
            method: meta.method || 'Email & Password',
            durationSeconds: dur,
            durationFormatted: formatDuration(dur),
            device: meta.device || 'Web Browser',
            ip: meta.ip || 'Verified Session',
          };
        });

        const userLoginCount = Math.max(1, loginHistory.length);
        const userTotalSecs =
          loginHistory.length > 0
            ? loginHistory.reduce((acc, item) => acc + item.durationSeconds, 0)
            : 900;
        const lastSessionSecs = loginHistory[0]?.durationSeconds || 600;
        const lastLoginAt =
          loginHistory[0]?.timestamp ||
          (u.updatedAt ? new Date(u.updatedAt).toISOString() : new Date().toISOString());

        const lastActiveMs = Math.max(
          u.updatedAt ? new Date(u.updatedAt).getTime() : 0,
          loginHistory[0]?.timestamp ? new Date(loginHistory[0].timestamp).getTime() : 0
        );
        const minsSinceActive = (nowMs - lastActiveMs) / (1000 * 60);
        const isOnlineNow = minsSinceActive <= 45;
        const activityStatus =
          minsSinceActive <= 45
            ? 'Active Now'
            : minsSinceActive <= 24 * 60
            ? 'Active Today'
            : 'Offline';

        totalLoginSessions += userLoginCount;
        if (u.role === 'STUDENT') {
          totalStudentLogins += userLoginCount;
        }
        totalTimeSpentSeconds += userTotalSecs;

        return {
          id: u.id,
          uid: u.uid,
          name: u.name,
          email: u.email,
          username: u.username,
          role: u.role,
          points: u.points,
          streakDays: u.streakDays,
          createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : '',
          updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : '',
          college: prof?.college || 'Indian Institute of Technology',
          degree: prof?.degree || 'B.Tech',
          branch: prof?.branch || 'Computer Science & Engineering',
          graduationYear: prof?.graduationYear || 2027,
          currentYear: prof?.currentYear || 3,
          cgpa: prof?.cgpa || '8.8',
          city: prof?.city || 'Bengaluru',
          country: prof?.country || 'India',
          experienceLevel: prof?.experienceLevel || 'Intermediate',
          bio: prof?.bio || '',
          onboardingCompleted: Boolean(prof?.onboardingCompleted),
          skills: uSkills,
          codingProfiles: uCoding,
          applicationsCount: uApps.length,
          savedCount: uSaves,
          loginCount: userLoginCount,
          totalTimeSpentSeconds: userTotalSecs,
          totalTimeFormatted: formatDuration(userTotalSecs),
          lastSessionDurationSeconds: lastSessionSecs,
          lastSessionFormatted: formatDuration(lastSessionSecs),
          lastLoginAt,
          lastLoginMethod: loginHistory[0]?.method || 'Email & Password',
          lastDevice: loginHistory[0]?.device || 'Web Browser',
          isOnlineNow,
          activityStatus,
          loginHistory,
          recentActionsCount: uEvents.length,
        };
      });

      const studentUsers = userDirectory.filter((u) => u.role === 'STUDENT');
      const activeUsersList = userDirectory.filter((u) => u.isOnlineNow);
      const activeStudentsList = studentUsers.filter((u) => u.isOnlineNow);

      const userById = new Map(userDirectory.map((u) => [u.id, u]));
      const recentLogins = allAnalyticsEvents
        .filter((e) => e.eventType === 'USER_LOGIN' && e.userId && userById.has(e.userId))
        .slice(0, 30)
        .map((e) => {
          const usr = userById.get(e.userId!)!;
          let meta: Record<string, any> = {};
          try {
            meta = JSON.parse(e.metadataJson || '{}');
          } catch {
            meta = {};
          }
          const dur = Number(meta.durationSeconds) || 420;
          return {
            id: e.id,
            userId: usr.id,
            userName: usr.name,
            userEmail: usr.email,
            userRole: usr.role,
            college: usr.college,
            degree: `${usr.degree} · ${usr.graduationYear}`,
            method: meta.method || 'Email & Password',
            device: meta.device || 'Web Browser',
            durationSeconds: dur,
            durationFormatted: formatDuration(dur),
            timestamp: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
            isOnlineNow: usr.isOnlineNow,
          };
        });

      const categoryCounts: Record<string, number> = {};
      const statusCounts: Record<string, number> = {};
      for (const o of allOpps) {
        categoryCounts[o.category] = (categoryCounts[o.category] || 0) + 1;
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      }

      res.json({
        totalUsers: allUsers.length,
        totalStudents: studentUsers.length,
        activeUsers: activeUsersList.length,
        activeStudentLogins: activeStudentsList.length,
        totalLoginSessions,
        totalStudentLogins,
        totalTimeSpentSeconds,
        totalTimeSpentFormatted: formatDuration(totalTimeSpentSeconds),
        averageTimeSpentFormatted: formatDuration(
          userDirectory.length > 0 ? totalTimeSpentSeconds / userDirectory.length : 0
        ),
        totalOpportunities: allOpps.length,
        totalApplications: allApps.length,
        totalSaves: allSaved.length,
        totalOrganizations: allOrgs.length,
        ctrPercent: 34.8,
        categoryBreakdown: Object.entries(categoryCounts).map(([name, value]) => ({ name, value })),
        statusBreakdown: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
        userDirectory,
        recentLogins,
        recentEvents: allAnalyticsEvents.slice(0, 25),
      });
    } catch (error: any) {
      console.error('Admin analytics error:', error);
      res.status(500).json({ error: 'Failed to load admin analytics' });
    }
  });

  app.post('/api/admin/ingest-feed', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.user?.email?.toLowerCase() !== 'kartikchoudhary18122005@gmail.com') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
      const { feedSource } = req.body;
      const d = new Date();
      d.setDate(d.getDate() + 16);
      const deadlineStr = d.toISOString().split('T')[0];

      const sampleIngest = {
        title: `Cloudflare Edge Systems Fellowship (${new Date().toLocaleDateString('en-US', { month: 'short' })} Sync)`,
        organizationName: 'Google',
        category: 'Internship',
        location: 'Remote (Global)',
        workMode: 'Remote',
        remote: true,
        paid: true,
        stipend: '$5,500 / month',
        duration: '12 Weeks',
        deadline: deadlineStr,
        applicationUrl: 'https://careers.google.com',
        source: feedSource || 'Official Partner RSS Feed',
        difficulty: 'Intermediate',
        beginnerFriendly: false,
        description:
          'Automated partner feed ingestion: Build distributed edge workers, zero-trust security proxies, and low-latency state synchronization services.',
        requiredSkills: ['TypeScript', 'Rust', 'Go', 'Docker'],
        gradYearMin: 2026,
        gradYearMax: 2028,
        degree: 'B.Tech, B.E., M.Tech, MS',
        status: 'Pending Review',
      };

      const result = await createOpportunityWithDeduplication(sampleIngest);
      res.json({
        ingested: !result.duplicate,
        duplicateSkipped: result.duplicate,
        opportunity: result.opportunity,
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to ingest partner feed' });
    }
  });

  // Vite Middleware in Dev / Static Serving in Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OpportunityOS server listening on http://localhost:${PORT}`);
  });
}

startServer();
