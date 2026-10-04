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

export interface MatchResult {
  matchScore: number;
  explanation: string;
  reasons: string[];
  matchedSkills: string[];
  missingSkills: string[];
  daysRemaining: number;
  urgencyLevel: 'CRITICAL' | 'SOON' | 'NORMAL' | 'EXPIRED';
  eligibility: EligibilityEvaluation;
}

export interface StudentContext {
  degree: string;
  branch: string;
  graduationYear: number;
  cgpa: number;
  backlogs: number;
  country: string;
  interests: string[];
  careerGoals: string[];
  preferredWorkModes: string[];
  preferredLocations: string[];
  experienceLevel: string;
  skills: string[];
  resumeSkills: string[];
  githubLanguages: string[];
  codingProblemsSolved: number;
}

export interface OpportunityRuleInput {
  ruleType: string;
  ruleValue: string;
}

export interface OpportunityContext {
  id: number;
  title: string;
  category: string;
  location: string;
  workMode: string;
  remote: boolean;
  paid: boolean;
  difficulty: string;
  beginnerFriendly: boolean;
  deadline: string;
  requiredSkills: string[];
  rules: OpportunityRuleInput[];
  organizationName?: string;
}

export function calculateDaysRemaining(deadlineStr: string): number {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineDate = new Date(deadlineStr);
  if (isNaN(deadlineDate.getTime())) return 14;
  const diffMs = deadlineDate.getTime() - todayStart.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function evaluateEligibility(
  student: StudentContext,
  opp: OpportunityContext
): EligibilityEvaluation {
  const breakdown: EligibilityBreakdownItem[] = [];
  let hardFailures = 0;
  let softWarnings = 0;

  // 1. Education / Degree check
  const degreeRule = opp.rules.find((r) => r.ruleType === 'DEGREE');
  if (degreeRule && degreeRule.ruleValue !== 'Any') {
    const allowedDegrees = degreeRule.ruleValue.split(',').map((s) => s.trim().toLowerCase());
    const studentDeg = (student.degree || 'B.Tech').toLowerCase();
    const degMatched = allowedDegrees.some(
      (d) => studentDeg.includes(d) || d.includes(studentDeg) || d === 'b.tech' && studentDeg.includes('b.e')
    );
    if (degMatched) {
      breakdown.push({
        criterion: 'Education',
        passed: true,
        detail: `${student.degree} (${student.branch}) satisfies ${degreeRule.ruleValue}`,
      });
    } else {
      hardFailures++;
      breakdown.push({
        criterion: 'Education',
        passed: false,
        detail: `Requires ${degreeRule.ruleValue} (Your profile: ${student.degree})`,
      });
    }
  } else {
    breakdown.push({
      criterion: 'Education',
      passed: true,
      detail: `${student.degree} in ${student.branch} is eligible`,
    });
  }

  // 2. Graduation Year check
  const minYearRule = opp.rules.find((r) => r.ruleType === 'GRAD_YEAR_MIN');
  const maxYearRule = opp.rules.find((r) => r.ruleType === 'GRAD_YEAR_MAX');
  const minYear = minYearRule ? parseInt(minYearRule.ruleValue, 10) : 2024;
  const maxYear = maxYearRule ? parseInt(maxYearRule.ruleValue, 10) : 2030;

  if (student.graduationYear >= minYear && student.graduationYear <= maxYear) {
    breakdown.push({
      criterion: 'Graduation Year',
      passed: true,
      detail: `Class of ${student.graduationYear} is within ${minYear}–${maxYear} cohort`,
    });
  } else {
    hardFailures++;
    breakdown.push({
      criterion: 'Graduation Year',
      passed: false,
      detail: `Requires graduation between ${minYear} and ${maxYear} (Yours: ${student.graduationYear})`,
    });
  }

  // 3. Location check
  const locRule = opp.rules.find((r) => r.ruleType === 'LOCATION');
  const allowedLoc = locRule ? locRule.ruleValue : opp.location;
  const isGlobalOrRemote =
    opp.remote ||
    allowedLoc.toLowerCase().includes('global') ||
    allowedLoc.toLowerCase().includes('remote') ||
    allowedLoc.toLowerCase().includes('international') ||
    allowedLoc.toLowerCase().includes(student.country.toLowerCase());

  if (isGlobalOrRemote) {
    breakdown.push({
      criterion: 'Location',
      passed: true,
      detail: opp.remote ? `Remote / ${opp.location} open to ${student.country}` : `Eligible for ${student.country}`,
    });
  } else {
    softWarnings++;
    breakdown.push({
      criterion: 'Location',
      passed: false,
      partial: true,
      detail: `Primary location is ${allowedLoc} (may require relocation/visa from ${student.country})`,
    });
  }

  // 4. CGPA / Academic check
  const cgpaRule = opp.rules.find((r) => r.ruleType === 'MIN_CGPA');
  if (cgpaRule) {
    const minCgpa = parseFloat(cgpaRule.ruleValue);
    if (!isNaN(minCgpa) && student.cgpa < minCgpa) {
      hardFailures++;
      breakdown.push({
        criterion: 'Academic CGPA',
        passed: false,
        detail: `Minimum CGPA ${minCgpa} required (Your CGPA: ${student.cgpa})`,
      });
    } else {
      breakdown.push({
        criterion: 'Academic CGPA',
        passed: true,
        detail: `CGPA ${student.cgpa} exceeds minimum ${minCgpa} requirement`,
      });
    }
  }

  // 5. Skills check
  const allStudentSkills = new Set(
    [...student.skills, ...student.resumeSkills, ...student.githubLanguages].map((s) =>
      s.toLowerCase().trim()
    )
  );
  const reqSkills = opp.requiredSkills || [];
  const matched = reqSkills.filter((s) => allStudentSkills.has(s.toLowerCase().trim()));
  const missing = reqSkills.filter((s) => !allStudentSkills.has(s.toLowerCase().trim()));

  if (reqSkills.length === 0 || matched.length === reqSkills.length) {
    breakdown.push({
      criterion: 'Skills',
      passed: true,
      detail:
        reqSkills.length > 0
          ? `All ${reqSkills.length} required skills verified (${matched.join(', ')})`
          : 'Open to all technical skill levels',
    });
  } else if (matched.length >= Math.ceil(reqSkills.length * 0.5)) {
    softWarnings++;
    breakdown.push({
      criterion: 'Skills',
      passed: true,
      partial: true,
      detail: `Matched ${matched.length}/${reqSkills.length} skills · Learn ${missing.slice(0, 2).join(', ')} to strengthen application`,
    });
  } else {
    softWarnings++;
    breakdown.push({
      criterion: 'Skills',
      passed: false,
      partial: true,
      detail: `Matched ${matched.length}/${reqSkills.length} required skills · Missing ${missing.slice(0, 3).join(', ')}`,
    });
  }

  if (hardFailures > 0) {
    const failedReasons = breakdown
      .filter((b) => !b.passed && !b.partial)
      .map((b) => b.detail)
      .join('; ');
    return {
      status: 'NOT_ELIGIBLE',
      label: 'Not eligible',
      explanation: `You may not be eligible: ${failedReasons}.`,
      breakdown,
    };
  }

  if (softWarnings > 0 && matched.length < reqSkills.length) {
    return {
      status: 'PARTIALLY_ELIGIBLE',
      label: 'Partially eligible',
      explanation: `Academic and cohort criteria match (${student.degree}, ${student.graduationYear}), with ${missing.length} skill gap${missing.length > 1 ? 's' : ''} (${missing.slice(0, 2).join(', ')}) you can bridge before the deadline.`,
      breakdown,
    };
  }

  return {
    status: 'ELIGIBLE',
    label: 'Eligible',
    explanation: `Your ${student.degree} (${student.graduationYear}) profile, ${student.country} location, and core skills satisfy all requirements.`,
    breakdown,
  };
}

export function computeOpportunityMatch(
  student: StudentContext,
  opp: OpportunityContext
): MatchResult {
  const eligibility = evaluateEligibility(student, opp);
  const daysRemaining = calculateDaysRemaining(opp.deadline);

  const allStudentSkills = new Set(
    [...student.skills, ...student.resumeSkills, ...student.githubLanguages].map((s) =>
      s.toLowerCase().trim()
    )
  );

  const reqSkills = opp.requiredSkills || [];
  const matchedSkills = reqSkills.filter((s) => allStudentSkills.has(s.toLowerCase().trim()));
  const missingSkills = reqSkills.filter((s) => !allStudentSkills.has(s.toLowerCase().trim()));

  // 1. Skill Match (30%)
  const skillRatio =
    reqSkills.length === 0
      ? 0.88
      : matchedSkills.length / reqSkills.length;
  const skillScore = Math.min(1, skillRatio + (matchedSkills.length >= 2 ? 0.12 : 0)) * 30;

  // 2. Eligibility (25%)
  const eligibilityScore =
    eligibility.status === 'ELIGIBLE'
      ? 25
      : eligibility.status === 'PARTIALLY_ELIGIBLE'
      ? 18
      : 6;

  // 3. Career Interest & Goal Alignment (15%)
  const interestKeywords = [...student.interests, ...student.careerGoals].map((i) =>
    i.toLowerCase()
  );
  const oppCategoryLower = opp.category.toLowerCase();
  const titleLower = opp.title.toLowerCase();
  const hasCategoryInterest = interestKeywords.some(
    (k) =>
      oppCategoryLower.includes(k) ||
      k.includes(oppCategoryLower) ||
      titleLower.includes(k) ||
      (k.includes('ai') && (titleLower.includes('ai') || titleLower.includes('machine learning') || titleLower.includes('llm'))) ||
      (k.includes('web') && (titleLower.includes('frontend') || titleLower.includes('full stack') || titleLower.includes('software'))) ||
      (k.includes('open source') && oppCategoryLower.includes('open source')) ||
      (k.includes('competitive') && oppCategoryLower.includes('coding'))
  );
  const interestScore = hasCategoryInterest ? 15 : 10.5;

  // 4. Experience Level Alignment (10%)
  const expMatch =
    opp.difficulty.toLowerCase() === student.experienceLevel.toLowerCase() ||
    opp.beginnerFriendly;
  const experienceScore = expMatch ? 10 : 7.5;

  // 5. Location & Work Mode Preference (5%)
  const modeMatch =
    student.preferredWorkModes.some(
      (m) => m.toLowerCase() === opp.workMode.toLowerCase()
    ) || opp.remote;
  const locationScore = modeMatch ? 5 : 3.5;

  // 6. Profile Similarity: GitHub & Coding Activity (10%)
  const hasGitHubMatch = matchedSkills.some((s) =>
    student.githubLanguages.map((g) => g.toLowerCase()).includes(s.toLowerCase())
  );
  const hasStrongCoding = student.codingProblemsSolved >= 100;
  const profileSimilarityScore =
    hasGitHubMatch && hasStrongCoding ? 9.5 : hasGitHubMatch || hasStrongCoding ? 8.2 : 6.8;

  // 7. Deadline Relevance (5%)
  let deadlineScore = 4.0;
  let urgencyLevel: 'CRITICAL' | 'SOON' | 'NORMAL' | 'EXPIRED' = 'NORMAL';
  if (daysRemaining < 0) {
    deadlineScore = 1.0;
    urgencyLevel = 'EXPIRED';
  } else if (daysRemaining <= 3) {
    deadlineScore = 5.0;
    urgencyLevel = 'CRITICAL';
  } else if (daysRemaining <= 7) {
    deadlineScore = 4.8;
    urgencyLevel = 'SOON';
  } else if (daysRemaining <= 21) {
    deadlineScore = 4.5;
    urgencyLevel = 'NORMAL';
  }

  const rawTotal =
    skillScore +
    eligibilityScore +
    interestScore +
    experienceScore +
    locationScore +
    profileSimilarityScore +
    deadlineScore;

  const matchScore = Math.max(42, Math.min(99, Math.round(rawTotal)));

  // Construct personalized reasons
  const reasons: string[] = [];
  if (matchedSkills.length > 0) {
    reasons.push(`You know ${matchedSkills.slice(0, 3).join(', ')}`);
  }
  reasons.push(`Graduating in ${student.graduationYear} satisfies cohort eligibility`);
  if (opp.remote) {
    reasons.push(`Matches your Remote work preference`);
  } else {
    reasons.push(`Location (${opp.location}) aligns with your preferences`);
  }
  if (hasGitHubMatch) {
    reasons.push(`Verified GitHub activity in ${matchedSkills[0] || 'core stack'}`);
  }
  if (eligibility.status === 'ELIGIBLE') {
    reasons.push(`Your profile satisfies all eligibility rules`);
  }

  const skillPhrase =
    matchedSkills.length > 0
      ? `you have ${matchedSkills.slice(0, 3).join(', ')} experience`
      : `it aligns with your ${student.branch} background`;

  const explanation = `Recommended because ${skillPhrase} and this ${opp.category.toLowerCase()} accepts ${student.degree} students graduating in ${student.graduationYear}.`;

  return {
    matchScore,
    explanation,
    reasons,
    matchedSkills,
    missingSkills,
    daysRemaining,
    urgencyLevel,
    eligibility,
  };
}
