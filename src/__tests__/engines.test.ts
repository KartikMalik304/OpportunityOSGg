import {
  evaluateEligibility,
  computeOpportunityMatch,
  StudentContext,
  OpportunityContext,
} from '../services/recommendationEngine.ts';
import { calculateReadinessScore } from '../services/codingIntegration.ts';

/**
 * Unit & Integration Test Suite for OpportunityOS Recommendation, Eligibility, and Readiness Engines
 */
export function runOpportunityOsUnitTests() {
  const sampleStudent: StudentContext = {
    degree: 'B.Tech',
    branch: 'Computer Science & Engineering',
    graduationYear: 2027,
    cgpa: 8.9,
    backlogs: 0,
    country: 'India',
    interests: ['Web Development', 'AI/ML', 'Open Source'],
    careerGoals: ['Internship', 'Open source'],
    preferredWorkModes: ['Remote', 'Hybrid'],
    preferredLocations: ['India', 'International'],
    experienceLevel: 'Intermediate',
    skills: ['Python', 'React', 'TypeScript', 'PostgreSQL'],
    resumeSkills: ['Docker', 'Git'],
    githubLanguages: ['TypeScript', 'Python'],
    codingProblemsSolved: 412,
  };

  const eligibleOpp: OpportunityContext = {
    id: 1,
    title: 'Google Software Engineering Summer Internship 2027',
    category: 'Internship',
    location: 'Bengaluru, India',
    workMode: 'Hybrid',
    remote: false,
    paid: true,
    difficulty: 'Intermediate',
    beginnerFriendly: false,
    deadline: '2026-10-20',
    requiredSkills: ['Python', 'React', 'TypeScript'],
    rules: [
      { ruleType: 'DEGREE', ruleValue: 'B.Tech, B.E., M.Tech' },
      { ruleType: 'GRAD_YEAR_MIN', ruleValue: '2026' },
      { ruleType: 'GRAD_YEAR_MAX', ruleValue: '2028' },
      { ruleType: 'MIN_CGPA', ruleValue: '7.5' },
      { ruleType: 'LOCATION', ruleValue: 'India' },
    ],
  };

  const evalResult = evaluateEligibility(sampleStudent, eligibleOpp);
  if (evalResult.status !== 'ELIGIBLE') {
    throw new Error(`Expected ELIGIBLE status, got ${evalResult.status}`);
  }

  const matchResult = computeOpportunityMatch(sampleStudent, eligibleOpp);
  if (matchResult.matchScore < 85) {
    throw new Error(`Expected high match score >= 85, got ${matchResult.matchScore}`);
  }

  const readiness = calculateReadinessScore(
    [
      {
        platform: 'GitHub',
        rating: 0,
        problemsSolved: 0,
        repositories: 24,
        contributions: 700,
        stars: 95,
      },
      {
        platform: 'LeetCode',
        rating: 1845,
        problemsSolved: 412,
        repositories: 0,
        contributions: 0,
        stars: 0,
      },
    ],
    4,
    3
  );

  if (readiness.overall < 70 || readiness.overall > 100) {
    throw new Error(`Readiness score out of expected bounds: ${readiness.overall}`);
  }

  return {
    passed: true,
    eligibilityStatus: evalResult.status,
    matchScore: matchResult.matchScore,
    readinessOverall: readiness.overall,
  };
}
