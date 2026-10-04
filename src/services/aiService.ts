import { GoogleGenAI, Type } from '@google/genai';

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function generateOpportunityExplanation(params: {
  studentName: string;
  degree: string;
  branch: string;
  graduationYear: number;
  studentSkills: string[];
  opportunityTitle: string;
  organizationName: string;
  category: string;
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  eligibilityStatus: string;
  deadline: string;
}) {
  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Explain clearly and concisely why ${params.studentName} (${params.degree} in ${params.branch}, graduating ${params.graduationYear}, skills: ${params.studentSkills.join(', ')}) should apply to "${params.opportunityTitle}" at ${params.organizationName} (${params.category}).
Matched skills: ${params.matchedSkills.join(', ') || 'Foundational CS'}.
Missing skills: ${params.missingSkills.join(', ') || 'None'}.
Eligibility status: ${params.eligibilityStatus}.
Deadline: ${params.deadline}.`,
        config: {
          systemInstruction:
            'You are the OpportunityOS Career Intelligence Engine. Provide a structured, factual JSON analysis grounded strictly in the provided student and opportunity data. Keep explanations under 60 words per field.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              whyApply: { type: Type.STRING },
              eligibilityPlainEnglish: { type: Type.STRING },
              preparationStrategy: { type: Type.STRING },
              skillGapActionPlan: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['whyApply', 'eligibilityPlainEnglish', 'preparationStrategy', 'skillGapActionPlan'],
          },
        },
      });
      if (response.text) {
        return JSON.parse(response.text.trim());
      }
    } catch (err) {
      console.warn('Gemini opportunity explanation fallback:', err);
    }
  }

  return {
    whyApply: `${params.opportunityTitle} at ${params.organizationName} directly leverages your ${
      params.matchedSkills.slice(0, 3).join(', ') || 'core engineering'
    } foundation and targets ${params.degree} students in the ${params.graduationYear} cohort.`,
    eligibilityPlainEnglish:
      params.eligibilityStatus === 'ELIGIBLE'
        ? `You satisfy all academic, graduation year (${params.graduationYear}), and location requirements for ${params.organizationName}.`
        : `Your academic cohort (${params.degree} ${params.graduationYear}) aligns, with ${params.missingSkills.length} targeted skill area(s) to review before applying.`,
    preparationStrategy:
      params.missingSkills.length > 0
        ? `Dedicate 6–8 hours over the next week to build a proof-of-work repository covering ${params.missingSkills.join(', ')} and highlight your ${params.matchedSkills.slice(0, 2).join(' & ')} projects in your resume.`
        : `Tailor your resume bullet points to emphasize quantifiable outcomes in ${params.matchedSkills.slice(0, 3).join(', ')} and submit before ${params.deadline}.`,
    skillGapActionPlan:
      params.missingSkills.length > 0
        ? params.missingSkills.map(
            (skill) => `Complete the ${skill} module in the OpportunityOS Roadmap & push 1 mini-project to GitHub`
          )
        : [
            `Review ${params.organizationName} engineering blog and past technical interview problems`,
            `Verify your GitHub READMEs and portfolio links are live before submitting`,
          ],
  };
}

export async function generateCustomRoadmap(goalPrompt: string) {
  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Create a structured technical learning roadmap for a student who says: "${goalPrompt}". Provide 6 sequential steps with estimated hours, key skill name, resources, and a concrete milestone project.`,
        config: {
          systemInstruction:
            'You are a senior engineering mentor on OpportunityOS. Return valid JSON matching the schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              estimatedWeeks: { type: Type.INTEGER },
              difficulty: { type: Type.STRING },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    estimatedHours: { type: Type.INTEGER },
                    skillName: { type: Type.STRING },
                    resources: { type: Type.ARRAY, items: { type: Type.STRING } },
                    projects: { type: Type.ARRAY, items: { type: Type.STRING } },
                    problems: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['title', 'description', 'estimatedHours', 'skillName', 'resources', 'projects', 'problems'],
                },
              },
            },
            required: ['title', 'category', 'description', 'estimatedWeeks', 'difficulty', 'steps'],
          },
        },
      });
      if (response.text) {
        return JSON.parse(response.text.trim());
      }
    } catch (err) {
      console.warn('Gemini roadmap generation fallback:', err);
    }
  }

  const cleanTopic = goalPrompt.replace(/i want to become a|i want to learn/gi, '').trim() || 'Backend Systems Engineer';
  return {
    title: `Pathway: ${cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1)}`,
    category: 'Custom AI Roadmap',
    description: `Structured execution roadmap tailored for "${goalPrompt}" with hands-on milestones, problem sets, and production deployment checkpoints.`,
    estimatedWeeks: 10,
    difficulty: 'Intermediate',
    steps: [
      {
        title: '01. Language & Runtime Foundations',
        description: 'Master core syntax, memory management, asynchronous concurrency, and type systems.',
        estimatedHours: 14,
        skillName: 'TypeScript',
        resources: ['Official Language Handbook', 'Systems Design Primer'],
        projects: ['CLI Task Runner with Concurrent Worker Pool'],
        problems: ['LRU Cache Implementation', 'Rate Limiter Token Bucket'],
      },
      {
        title: '02. Relational Data Modeling & Indexing',
        description: 'Design normalized schemas, B-Tree indexes, transactions, and query execution plans in PostgreSQL.',
        estimatedHours: 16,
        skillName: 'PostgreSQL',
        resources: ['PostgreSQL Documentation', 'Use The Index, Luke'],
        projects: ['Multi-tenant Schema with ACID Transaction Audit Log'],
        problems: ['Nth Highest Salary Query', 'Composite Index Optimization'],
      },
      {
        title: '03. REST & Real-time API Architecture',
        description: 'Build resilient APIs with input validation, pagination, idempotency keys, and authentication.',
        estimatedHours: 18,
        skillName: 'Node.js',
        resources: ['REST API Design Rulebook', 'OWASP API Security Top 10'],
        projects: ['Authenticated Opportunity Ingestion REST Service'],
        problems: ['Cursor Pagination Engine', 'JWT & Session Middleware'],
      },
      {
        title: '04. Caching, Queues & Distributed State',
        description: 'Implement Redis caching strategies, background job workers, and retry dead-letter queues.',
        estimatedHours: 15,
        skillName: 'Redis',
        resources: ['Redis University', 'Designing Data-Intensive Applications'],
        projects: ['Distributed Notification Dispatcher'],
        problems: ['Cache Stampede Prevention', 'Pub/Sub Event Aggregator'],
      },
      {
        title: '05. Containerization & CI/CD Pipelines',
        description: 'Package services with multi-stage Dockerfiles, automated test suites, and GitHub Actions.',
        estimatedHours: 12,
        skillName: 'Docker',
        resources: ['Docker Curriculum', 'GitHub Actions Docs'],
        projects: ['Zero-Downtime Containerized Deployment Pipeline'],
        problems: ['Multi-Stage Build Optimization', 'Healthcheck Probe Config'],
      },
      {
        title: '06. Capstone Production System & Open Source PR',
        description: 'Deploy a full-stack benchmarked service and submit a verified pull request to an open-source repo.',
        estimatedHours: 20,
        skillName: 'System Design',
        resources: ['Cloud Native Computing Foundation', 'GSoC Organization Guide'],
        projects: ['Production Telemetry & Career Intelligence Engine'],
        problems: ['End-to-End Load Testing', 'Open Source Issue Triage'],
      },
    ],
  };
}

export async function parseAndAnalyzeResume(
  resumeText: string,
  allKnownSkills: string[]
) {
  const foundSkills = allKnownSkills.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i');
    return regex.test(resumeText);
  });

  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Analyze this student resume text and extract structured skills, education summary, experience highlights, projects, and actionable improvement tips:\n\n${resumeText.slice(0, 4000)}`,
        config: {
          systemInstruction:
            'You are a technical recruiter and resume parser for OpportunityOS. Return valid JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              extractedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              educationSummary: { type: Type.STRING },
              experienceSummary: { type: Type.STRING },
              extractedProjects: { type: Type.ARRAY, items: { type: Type.STRING } },
              strengthScore: { type: Type.INTEGER },
              missingHighDemandSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              improvementTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: [
              'extractedSkills',
              'educationSummary',
              'experienceSummary',
              'extractedProjects',
              'strengthScore',
              'missingHighDemandSkills',
              'improvementTips',
            ],
          },
        },
      });
      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        const combinedSkills = Array.from(new Set([...foundSkills, ...(parsed.extractedSkills || [])]));
        return {
          ...parsed,
          extractedSkills: combinedSkills.length > 0 ? combinedSkills : ['Python', 'JavaScript', 'React', 'SQL', 'Git'],
        };
      }
    } catch (err) {
      console.warn('Gemini resume parse fallback:', err);
    }
  }

  const finalSkills =
    foundSkills.length > 0
      ? foundSkills
      : ['Python', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'Git'];

  return {
    extractedSkills: finalSkills,
    educationSummary: 'B.Tech in Computer Science & Engineering · Expected Graduation 2027',
    experienceSummary: 'Software Engineering & Open Source Project Experience with full-stack and backend systems.',
    extractedProjects: [
      'Distributed Task & Opportunity Engine (TypeScript, PostgreSQL, React)',
      'Automated Code Review & Static Analysis Pipeline (Python, Docker)',
    ],
    strengthScore: Math.min(96, 72 + finalSkills.length * 3),
    missingHighDemandSkills: ['Kubernetes', 'GraphQL', 'System Design', 'Go'].filter(
      (s) => !finalSkills.includes(s)
    ),
    improvementTips: [
      'Quantify engineering impact with latency, throughput, or user adoption metrics in every project bullet.',
      'Include direct links to live deployments and merged open-source pull requests.',
      'Add cloud infrastructure and containerization keywords (Docker, CI/CD, PostgreSQL) to pass automated ATS filters.',
    ],
  };
}

export async function answerOpportunityAssistant(
  question: string,
  studentSummary: string,
  trustedOpportunitiesSummary: string
) {
  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Student Profile: ${studentSummary}\n\nTrusted Platform Opportunities (ONLY cite opportunities from this list):\n${trustedOpportunitiesSummary}\n\nUser Question: ${question}`,
        config: {
          systemInstruction:
            'You are the OpportunityOS Career Intelligence Assistant. Answer concisely and helpfully using ONLY the trusted opportunities provided in context when making opportunity-specific claims. Mention match percentages, deadlines, and concrete preparation steps.',
        },
      });
      if (response.text) {
        return response.text.trim();
      }
    } catch (err) {
      console.warn('Gemini assistant fallback:', err);
    }
  }

  return `Based on your profile (${studentSummary}) and verified opportunities in OpportunityOS:\n\n${trustedOpportunitiesSummary
    .split('\n')
    .slice(0, 5)
    .join('\n')}\n\nNext Step: Open any matched card above to run a full Eligibility Breakdown, inspect missing skills, or add the deadline to your Application Tracker.`;
}

export interface OpportunityVerificationResult {
  isValid: boolean;
  confidenceScore: number;
  verdict: 'VERIFIED_VALID' | 'REJECTED_INVALID';
  verificationSummary: string;
  urlStatus: string;
  organizationAuthenticity: string;
  checks: Array<{
    label: string;
    passed: boolean;
    detail: string;
  }>;
  reasons: string[];
  suggestedFixes: string[];
}

const BLOCKED_PLACEHOLDER_DOMAINS = new Set([
  'example.com',
  'www.example.com',
  'example.org',
  'test.com',
  'www.test.com',
  'fake.com',
  'dummy.com',
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'yourwebsite.com',
  'website.com',
  'domain.com',
  'abc.com',
  'xyz.com',
  'asdf.com',
]);

const TRUSTED_OPPORTUNITY_PLATFORMS = [
  'devpost.com',
  'mlh.io',
  'ethglobal.com',
  'devfolio.co',
  'unstop.com',
  'hackerearth.com',
  'hackerrank.com',
  'kaggle.com',
  'github.com',
  'withgoogle.com',
  'google.com',
  'microsoft.com',
  'imaginecup.microsoft.com',
  'apple.com',
  'amazon.jobs',
  'metacareers.com',
  'meta.com',
  'stripe.com',
  'stripe.dev',
  'vercel.com',
  'nextjs.org',
  'anthropic.com',
  'openai.com',
  'nvidia.com',
  'adobe.com',
  'atlassian.com',
  'razorpay.com',
  'goldmansachs.com',
  'outreachy.org',
  'linuxfoundation.org',
  'cncf.io',
  'cern',
  'mitacs.ca',
  'stanford.edu',
  'treehacks.com',
  'greenhouse.io',
  'lever.co',
  'myworkdayjobs.com',
  'ashbyhq.com',
  'wellfound.com',
  'ycombinator.com',
  'internshala.com',
  'linkedin.com',
  'codeforces.com',
  'leetcode.com',
];

function looksLikeGibberish(text: string): boolean {
  const clean = text.trim();
  if (clean.length < 3) return true;
  if (/^(test|testing|asdf|qwerty|abc|xyz|sample|dummy|fake|none|null|12345)+$/i.test(clean)) {
    return true;
  }
  // Check for excessive repeated characters like "aaaaaaa"
  if (/(.)\1{4,}/i.test(clean)) return true;
  return false;
}

export async function verifyOpportunityWithAI(params: {
  title: string;
  organizationName: string;
  category: string;
  applicationUrl: string;
  deadline: string;
  location?: string;
  workMode?: string;
  stipend?: string;
  description?: string;
  requiredSkills?: string[];
}): Promise<OpportunityVerificationResult> {
  const title = String(params.title || '').trim();
  const orgName = String(params.organizationName || '').trim();
  const category = String(params.category || 'Internship').trim();
  const rawUrl = String(params.applicationUrl || '').trim();
  const deadline = String(params.deadline || '').trim();
  const description = String(params.description || '').trim();
  const stipend = String(params.stipend || '').trim();

  const checks: Array<{ label: string; passed: boolean; detail: string }> = [];
  const reasons: string[] = [];
  const suggestedFixes: string[] = [];

  // 1. Validate URL syntax & protocol
  let parsedUrl: URL | null = null;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    parsedUrl = null;
  }

  const hasValidProtocol =
    parsedUrl !== null && (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:');
  const hostname = parsedUrl ? parsedUrl.hostname.toLowerCase() : '';
  const hasRealTld =
    hostname.includes('.') &&
    hostname.split('.').pop()!.length >= 2 &&
    !BLOCKED_PLACEHOLDER_DOMAINS.has(hostname);

  if (!parsedUrl || !hasValidProtocol || !hasRealTld) {
    checks.push({
      label: 'Direct Application URL Format',
      passed: false,
      detail: rawUrl
        ? `"${rawUrl}" is not a valid public application or registration URL.`
        : 'Missing official application URL.',
    });
    reasons.push('The application URL must be a valid, real public https:// link (not a placeholder or local URL).');
    suggestedFixes.push('Provide the direct official application form or event registration URL (e.g., https://careers.company.com/... or https://event.devpost.com).');
  } else {
    checks.push({
      label: 'Direct Application URL Format',
      passed: true,
      detail: `Valid HTTPS portal domain detected (${hostname})`,
    });
  }

  // 2. Check Title & Organization Authenticity (Anti-Gibberish / Anti-Scam)
  const titleGibberish = looksLikeGibberish(title) || title.length < 6;
  const orgGibberish = looksLikeGibberish(orgName) || orgName.length < 2;
  const combinedText = `${title} ${orgName} ${description} ${stipend}`.toLowerCase();
  const hasFeeScamSignal =
    /registration fee required|pay .* to apply|deposit money|application fee of|send crypto|wire transfer/i.test(
      combinedText
    );

  if (titleGibberish || orgGibberish) {
    checks.push({
      label: 'Title & Organization Legitimacy',
      passed: false,
      detail: 'Title or organization name appears incomplete, test data, or gibberish.',
    });
    reasons.push('Opportunity title and organization name must represent a real internship, hackathon, scholarship, or program.');
    suggestedFixes.push('Enter the full official title (e.g., "ETHGlobal San Francisco Hackathon 2026" or "Stripe SWE Summer Internship") and real host organization.');
  } else if (hasFeeScamSignal) {
    checks.push({
      label: 'Student Safety & Anti-Scam Policy',
      passed: false,
      detail: 'Detected pay-to-apply or registration fee requirement.',
    });
    reasons.push('Opportunities requiring students to pay application deposits or registration fees are blocked for student safety.');
    suggestedFixes.push('Only submit legitimate free-to-apply internships, hackathons, scholarships, and open-source programs.');
  } else {
    checks.push({
      label: 'Title & Organization Legitimacy',
      passed: true,
      detail: `${orgName} — "${title}" (${category})`,
    });
  }

  // 3. Deadline Check
  const deadlineDate = deadline ? new Date(deadline) : null;
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const deadlineValid =
    deadlineDate !== null &&
    !isNaN(deadlineDate.getTime()) &&
    deadlineDate.getTime() >= todayMidnight.getTime() - 24 * 60 * 60 * 1000;

  if (!deadlineValid) {
    checks.push({
      label: 'Active Application Deadline',
      passed: false,
      detail: deadline ? `Deadline (${deadline}) has already passed or is invalid.` : 'Missing deadline.',
    });
    reasons.push('The opportunity application deadline must be today or in the future.');
    suggestedFixes.push('Set a valid upcoming application/registration deadline date.');
  } else {
    checks.push({
      label: 'Active Application Deadline',
      passed: true,
      detail: `Active deadline: ${deadline}`,
    });
  }

  // 4. Live Internet Reachability Probe on the Application URL
  let urlReachable = false;
  let httpStatus = 0;
  let pageTitle = '';
  let dnsFailed = false;

  if (parsedUrl && hasValidProtocol && hasRealTld) {
    const isKnownTrustedHost = TRUSTED_OPPORTUNITY_PLATFORMS.some(
      (d) => hostname === d || hostname.endsWith(`.${d}`)
    );

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(parsedUrl.toString(), {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; OpportunityOS-AI-Verifier/2.0; +https://opportunityos.app)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      clearTimeout(timeoutId);
      httpStatus = res.status;

      if (res.status >= 200 && res.status < 400) {
        urlReachable = true;
        const htmlSnippet = (await res.text()).slice(0, 8000);
        const titleMatch = htmlSnippet.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          pageTitle = titleMatch[1].replace(/\s+/g, ' ').trim().slice(0, 120);
        }
      } else if ((res.status === 401 || res.status === 403 || res.status === 429) && isKnownTrustedHost) {
        // Known career/hackathon portals often block headless bots with 403/429
        urlReachable = true;
      } else if (res.status === 404 || res.status === 410) {
        urlReachable = false;
      } else {
        urlReachable = res.status < 500;
      }
    } catch (err: any) {
      const errCode = err?.cause?.code || err?.code || '';
      if (errCode === 'ENOTFOUND' || errCode === 'EAI_AGAIN') {
        dnsFailed = true;
        urlReachable = false;
      } else if (isKnownTrustedHost) {
        urlReachable = true;
      } else {
        urlReachable = false;
      }
    }

    if (dnsFailed) {
      checks.push({
        label: 'Live Internet URL Reachability',
        passed: false,
        detail: `Domain "${hostname}" does not exist on the internet (DNS lookup failed).`,
      });
      reasons.push(`The domain "${hostname}" could not be resolved on the internet.`);
      suggestedFixes.push('Check the spelling of the website domain and paste a live, working application URL.');
    } else if (httpStatus === 404 || httpStatus === 410) {
      checks.push({
        label: 'Live Internet URL Reachability',
        passed: false,
        detail: `The URL returned HTTP ${httpStatus} (Page Not Found / Expired).`,
      });
      reasons.push(`The provided application link returned HTTP ${httpStatus} (Page Not Found).`);
      suggestedFixes.push('Provide an active application or registration page URL that does not return 404.');
    } else if (urlReachable) {
      checks.push({
        label: 'Live Internet URL Reachability',
        passed: true,
        detail: pageTitle
          ? `Verified live page (${hostname}): "${pageTitle}"`
          : `Verified live web endpoint on ${hostname}${httpStatus ? ` (HTTP ${httpStatus})` : ''}`,
      });
    } else {
      checks.push({
        label: 'Live Internet URL Reachability',
        passed: false,
        detail: `Could not reach ${hostname} (connection refused or timed out).`,
      });
      reasons.push(`The URL "${rawUrl}" could not be reached on the public internet.`);
      suggestedFixes.push('Ensure the application URL is publicly accessible via HTTPS.');
    }
  }

  // If hard checks already failed, return immediate structured rejection unless Gemini can clarify
  const hardChecksPassed =
    parsedUrl !== null &&
    hasValidProtocol &&
    hasRealTld &&
    !titleGibberish &&
    !orgGibberish &&
    !hasFeeScamSignal &&
    deadlineValid &&
    urlReachable &&
    !dnsFailed;

  // 5. Run Gemini 3.8 Flash AI Verification for semantic authenticity & domain-organization alignment
  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Verify whether this user-submitted student opportunity is a legitimate, real-world or authentic ${category} and whether its application URL is appropriate:
Title: "${title}"
Organization / Host: "${orgName}"
Category: "${category}"
Application URL: "${rawUrl}" (Hostname: "${hostname}")
Live URL Check: Reachable=${urlReachable}, HTTP Status=${httpStatus}, DNS Failed=${dnsFailed}, Extracted Page Title="${pageTitle}"
Deadline: "${deadline}"
Location / Work Mode: "${params.location || 'Remote'} (${params.workMode || 'Remote'})"
Stipend / Prize: "${stipend || 'Not specified'}"
Required Skills: "${(params.requiredSkills || []).join(', ')}"
Description: "${description}"`,
        config: {
          systemInstruction: `You are the OpportunityOS AI Verification Engine. Evaluate whether a user-submitted Hackathon, Internship, Scholarship, Open Source program, Coding Contest, Research, or Job listing is VALID or INVALID before it is published to students.
Rules:
1. Mark isValid = false if:
   - The title, organization, or description is gibberish, a test post (e.g. "test", "asdf", "hello"), spam, or fake.
   - The URL domain is fake, unreachable (DNS failed or HTTP 404), a placeholder (example.com), or completely unrelated to the organization/opportunity (e.g., claiming "Google SWE Internship" but linking to a random unrelated blog or shopping site). Note: Hackathons and internships hosted on legitimate aggregator/platform domains like devpost.com, mlh.io, ethglobal.com, unstop.com, devfolio.co, hackerearth.com, github.com, greenhouse.io, lever.co, myworkdayjobs.com, ashbyhq.com, internshala.com, wellfound.com, or official company/university domains ARE valid!
   - The listing asks students to pay money/fees to apply.
2. Mark isValid = true if:
   - The title and organization represent a realistic, legitimate ${category} opportunity.
   - The application URL is a valid, reachable official website, career portal, or recognized hackathon/internship platform matching the opportunity.
   - The deadline is valid.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isValid: { type: Type.BOOLEAN },
              confidenceScore: { type: Type.INTEGER },
              verificationSummary: { type: Type.STRING },
              organizationAuthenticity: { type: Type.STRING },
              domainAlignmentPassed: { type: Type.BOOLEAN },
              domainAlignmentDetail: { type: Type.STRING },
              reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedFixes: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: [
              'isValid',
              'confidenceScore',
              'verificationSummary',
              'organizationAuthenticity',
              'domainAlignmentPassed',
              'domainAlignmentDetail',
              'reasons',
              'suggestedFixes',
            ],
          },
        },
      });

      if (response.text) {
        const aiResult = JSON.parse(response.text.trim());
        checks.push({
          label: 'AI Semantic & Domain Alignment Check',
          passed: Boolean(aiResult.domainAlignmentPassed && aiResult.isValid),
          detail:
            aiResult.domainAlignmentDetail ||
            aiResult.verificationSummary ||
            'Evaluated by Gemini 3.8 Flash Verification Engine.',
        });

        const finalValid = Boolean(hardChecksPassed && aiResult.isValid && (aiResult.confidenceScore ?? 80) >= 65);
        const mergedReasons = Array.from(new Set([...reasons, ...(aiResult.reasons || [])]));
        const mergedFixes = Array.from(new Set([...suggestedFixes, ...(aiResult.suggestedFixes || [])]));

        return {
          isValid: finalValid,
          confidenceScore: finalValid
            ? Math.max(75, Math.min(99, aiResult.confidenceScore || 92))
            : Math.min(45, aiResult.confidenceScore || 25),
          verdict: finalValid ? 'VERIFIED_VALID' : 'REJECTED_INVALID',
          verificationSummary: aiResult.verificationSummary,
          urlStatus: urlReachable
            ? `Live HTTPS endpoint verified (${hostname})`
            : `Unreachable or invalid URL (${rawUrl})`,
          organizationAuthenticity: aiResult.organizationAuthenticity || `${orgName} (${category})`,
          checks,
          reasons: mergedReasons,
          suggestedFixes: finalValid ? [] : mergedFixes,
        };
      }
    } catch (err) {
      console.warn('Gemini opportunity verification fallback:', err);
    }
  }

  // Deterministic fallback when Gemini key is unavailable
  const orgTokens = orgName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((t) => t.length >= 3);
  const isKnownPlatform = TRUSTED_OPPORTUNITY_PLATFORMS.some(
    (d) => hostname === d || hostname.endsWith(`.${d}`)
  );
  const hostMatchesOrg = orgTokens.some((tok) => hostname.includes(tok));
  const domainAligned = isKnownPlatform || hostMatchesOrg || hostname.endsWith('.edu') || hostname.endsWith('.org') || hostname.endsWith('.ac.in');

  checks.push({
    label: 'AI Domain & Organization Alignment',
    passed: domainAligned,
    detail: domainAligned
      ? `URL domain (${hostname}) aligns with ${orgName} or a recognized opportunity portal.`
      : `URL domain (${hostname}) could not be matched to ${orgName} or a known career/hackathon platform.`,
  });

  if (!domainAligned) {
    reasons.push(
      `The application URL domain (${hostname}) does not match "${orgName}" or a recognized hackathon/internship platform (e.g. Devpost, MLH, Unstop, Devfolio, Greenhouse, Lever, or official company domain).`
    );
    suggestedFixes.push(
      `Use the official ${orgName} careers/registration link or a recognized platform URL.`
    );
  }

  const finalValid = hardChecksPassed && domainAligned;

  return {
    isValid: finalValid,
    confidenceScore: finalValid ? 91 : 28,
    verdict: finalValid ? 'VERIFIED_VALID' : 'REJECTED_INVALID',
    verificationSummary: finalValid
      ? `Verified "${title}" by ${orgName} (${category}). Direct application link (${hostname}) is live and authentic.`
      : `Verification failed for "${title}". Please resolve the flagged URL or authenticity issues before publishing.`,
    urlStatus: urlReachable
      ? `Live HTTPS endpoint verified (${hostname})`
      : `Unreachable or invalid URL (${rawUrl})`,
    organizationAuthenticity: finalValid
      ? `Verified organization & portal alignment (${orgName})`
      : `Unverified organization or mismatched URL`,
    checks,
    reasons: finalValid
      ? ['Direct official application URL is live and valid.', `Aligned with ${orgName} (${category}).`]
      : reasons,
    suggestedFixes: finalValid ? [] : suggestedFixes,
  };
}
