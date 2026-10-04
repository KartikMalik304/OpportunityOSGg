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
  roadmaps,
  roadmapSteps,
  userRoadmapProgress,
  codingProfiles,
  applications,
  savedOpportunities,
  notifications,
  events,
} from './schema.ts';
import { count, eq } from 'drizzle-orm';

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

export const INITIAL_SKILLS = [
  // Programming (12)
  { name: 'C', category: 'Programming' },
  { name: 'C++', category: 'Programming' },
  { name: 'Java', category: 'Programming' },
  { name: 'Python', category: 'Programming' },
  { name: 'JavaScript', category: 'Programming' },
  { name: 'TypeScript', category: 'Programming' },
  { name: 'Go', category: 'Programming' },
  { name: 'Rust', category: 'Programming' },
  { name: 'Kotlin', category: 'Programming' },
  { name: 'Swift', category: 'Programming' },
  { name: 'Scala', category: 'Programming' },
  { name: 'Bash', category: 'Programming' },
  // Web (10)
  { name: 'React', category: 'Web' },
  { name: 'Next.js', category: 'Web' },
  { name: 'Node.js', category: 'Web' },
  { name: 'Express', category: 'Web' },
  { name: 'HTML', category: 'Web' },
  { name: 'CSS', category: 'Web' },
  { name: 'Tailwind CSS', category: 'Web' },
  { name: 'GraphQL', category: 'Web' },
  { name: 'REST APIs', category: 'Web' },
  { name: 'WebSockets', category: 'Web' },
  // Data (8)
  { name: 'SQL', category: 'Data' },
  { name: 'PostgreSQL', category: 'Data' },
  { name: 'MongoDB', category: 'Data' },
  { name: 'Redis', category: 'Data' },
  { name: 'Apache Kafka', category: 'Data' },
  { name: 'Spark', category: 'Data' },
  { name: 'Pandas', category: 'Data' },
  { name: 'NumPy', category: 'Data' },
  // AI/ML (8)
  { name: 'Machine Learning', category: 'AI/ML' },
  { name: 'Deep Learning', category: 'AI/ML' },
  { name: 'NLP', category: 'AI/ML' },
  { name: 'Computer Vision', category: 'AI/ML' },
  { name: 'Generative AI', category: 'AI/ML' },
  { name: 'PyTorch', category: 'AI/ML' },
  { name: 'LLMs', category: 'AI/ML' },
  { name: 'RAG', category: 'AI/ML' },
  // Cloud (6)
  { name: 'AWS', category: 'Cloud' },
  { name: 'GCP', category: 'Cloud' },
  { name: 'Azure', category: 'Cloud' },
  { name: 'Cloudflare Workers', category: 'Cloud' },
  { name: 'Serverless', category: 'Cloud' },
  { name: 'Linux', category: 'Cloud' },
  // DevOps & Core CS (8)
  { name: 'Docker', category: 'DevOps' },
  { name: 'Kubernetes', category: 'DevOps' },
  { name: 'GitHub Actions', category: 'DevOps' },
  { name: 'Git', category: 'DevOps' },
  { name: 'Terraform', category: 'DevOps' },
  { name: 'Data Structures', category: 'Core CS' },
  { name: 'Algorithms', category: 'Core CS' },
  { name: 'System Design', category: 'Core CS' },
];

export const INITIAL_ORGS = [
  { name: 'Google', logo: 'G', website: 'https://careers.google.com', description: 'Global technology leader in search, cloud, Android, and AI systems.', verified: true },
  { name: 'Microsoft', logo: 'M', website: 'https://careers.microsoft.com', description: 'Cloud infrastructure, developer platforms, and enterprise AI.', verified: true },
  { name: 'Cloud Native Computing Foundation', logo: 'CN', website: 'https://www.cncf.io', description: 'Open-source foundation hosting Kubernetes, Prometheus, and Envoy.', verified: true },
  { name: 'Linux Foundation', logo: 'LF', website: 'https://mentorship.lfx.linuxfoundation.org', description: 'Non-profit consortium fostering open-source innovation globally.', verified: true },
  { name: 'Stripe', logo: 'S', website: 'https://stripe.com/jobs', description: 'Financial infrastructure and programmable payment networks for the internet.', verified: true },
  { name: 'Vercel', logo: 'V', website: 'https://vercel.com/careers', description: 'Frontend cloud platform and creators of Next.js.', verified: true },
  { name: 'Anthropic', logo: 'A', website: 'https://www.anthropic.com/careers', description: 'AI safety and frontier model research organization.', verified: true },
  { name: 'Major League Hacking', logo: 'MLH', website: 'https://mlh.io', description: 'Official student hackathon league and open-source engineering fellowship.', verified: true },
  { name: 'Outreachy', logo: 'O', website: 'https://www.outreachy.org', description: 'Paid remote open-source internships with free and open-source software communities.', verified: true },
  { name: 'Meta', logo: 'MT', website: 'https://www.metacareers.com', description: 'Social technology, PyTorch AI ecosystem, and distributed systems.', verified: true },
  { name: 'Atlassian', logo: 'AT', website: 'https://www.atlassian.com/company/careers', description: 'Developer collaboration software including Jira, Bitbucket, and Confluence.', verified: true },
  { name: 'Razorpay', logo: 'RZ', website: 'https://razorpay.com/jobs', description: 'Full-stack payments and banking platform for fast-growing businesses.', verified: true },
  { name: 'ETHGlobal', logo: 'ET', website: 'https://ethglobal.com', description: 'Global developer hackathons for decentralized protocols and cryptography.', verified: true },
  { name: 'CERN', logo: 'CR', website: 'https://careers.cern', description: 'European Organization for Nuclear Research and scientific computing.', verified: true },
  { name: 'MITACS', logo: 'MI', website: 'https://www.mitacs.ca', description: 'International research internships across Canadian universities.', verified: true },
  { name: 'Codeforces', logo: 'CF', website: 'https://codeforces.com', description: 'Premier competitive programming platform hosting rated algorithmic contests.', verified: true },
  { name: 'LeetCode', logo: 'LC', website: 'https://leetcode.com', description: 'Technical interview preparation and weekly algorithmic competitions.', verified: true },
  { name: 'Goldman Sachs', logo: 'GS', website: 'https://www.goldmansachs.com/careers', description: 'Global quantitative engineering and financial systems.', verified: true },
  { name: 'NVIDIA', logo: 'NV', website: 'https://www.nvidia.com/en-us/about-nvidia/careers', description: 'Accelerated computing, CUDA architecture, and deep learning systems.', verified: true },
  { name: 'Adobe', logo: 'AD', website: 'https://www.adobe.com/careers.html', description: 'Creative software, generative media research, and cloud document platforms.', verified: true },
  { name: 'Stanford AI Lab', logo: 'SA', website: 'https://ai.stanford.edu', description: 'Academic research laboratory advancing foundational machine learning.', verified: true },
  { name: 'OpenAI', logo: 'OA', website: 'https://openai.com/careers', description: 'AI research and deployment company building general-purpose models.', verified: true },
];

interface SeedOppTemplate {
  title: string;
  org: string;
  category: string;
  location: string;
  workMode: string;
  remote: boolean;
  paid: boolean;
  stipend: string;
  salary: string;
  duration: string;
  daysOffset: number;
  difficulty: string;
  beginnerFriendly: boolean;
  featured: boolean;
  skills: string[];
  gradMin: number;
  gradMax: number;
  degree: string;
  minCgpa?: string;
  description: string;
  url: string;
}

function build120Opportunities(): SeedOppTemplate[] {
  const list: SeedOppTemplate[] = [];

  // 1. 30 INTERNSHIPS
  const internships: SeedOppTemplate[] = [
    {
      title: 'Google Software Engineering Summer Internship 2027',
      org: 'Google',
      category: 'Internship',
      location: 'Bengaluru / Hyderabad',
      workMode: 'Hybrid',
      remote: false,
      paid: true,
      stipend: '₹1,25,000 / month',
      salary: '',
      duration: '10–12 Weeks',
      daysOffset: 12,
      difficulty: 'Intermediate',
      beginnerFriendly: false,
      featured: true,
      skills: ['Python', 'C++', 'JavaScript', 'React', 'Data Structures', 'Algorithms'],
      gradMin: 2026,
      gradMax: 2028,
      degree: 'B.Tech, B.E., M.Tech, MS',
      minCgpa: '7.5',
      description: 'Join Google Core Systems, Cloud, or Search engineering teams for a 12-week summer internship. Build scalable distributed microservices, optimize frontend web experiences, and collaborate with senior staff engineers on production launches.',
      url: 'https://careers.google.com/students',
    },
    {
      title: 'Google STEP Internship (Second Year Undergraduates)',
      org: 'Google',
      category: 'Internship',
      location: 'Bengaluru, India',
      workMode: 'On-site',
      remote: false,
      paid: true,
      stipend: '₹90,000 / month',
      salary: '',
      duration: '10 Weeks',
      daysOffset: 19,
      difficulty: 'Beginner',
      beginnerFriendly: true,
      featured: true,
      skills: ['Python', 'C++', 'Java', 'Data Structures'],
      gradMin: 2027,
      gradMax: 2029,
      degree: 'B.Tech, B.E.',
      description: 'Student Training in Engineering Program (STEP) designed for first and second-year undergraduate computer science students with mentorship and pair-programming projects.',
      url: 'https://careers.google.com/students',
    },
    {
      title: 'Microsoft Software Engineering Intern — Azure Core',
      org: 'Microsoft',
      category: 'Internship',
      location: 'Hyderabad / Bengaluru / Noida',
      workMode: 'Hybrid',
      remote: false,
      paid: true,
      stipend: '₹1,10,000 / month',
      salary: '',
      duration: '8–12 Weeks',
      daysOffset: 6,
      difficulty: 'Intermediate',
      beginnerFriendly: false,
      featured: true,
      skills: ['C++', 'TypeScript', 'React', 'Azure', 'Algorithms'],
      gradMin: 2026,
      gradMax: 2028,
      degree: 'B.Tech, M.Tech',
      minCgpa: '7.0',
      description: 'Engineer resilient cloud orchestration services, telemetry pipelines, and AI copilot developer integrations inside Microsoft Azure.',
      url: 'https://careers.microsoft.com/students',
    },
    {
      title: 'Stripe Software Engineering Intern — Programmable Payments',
      org: 'Stripe',
      category: 'Internship',
      location: 'Bengaluru / Remote',
      workMode: 'Remote',
      remote: true,
      paid: true,
      stipend: '₹1,40,000 / month',
      salary: '',
      duration: '12 Weeks',
      daysOffset: 9,
      difficulty: 'Intermediate',
      beginnerFriendly: false,
      featured: true,
      skills: ['TypeScript', 'React', 'Node.js', 'SQL', 'REST APIs'],
      gradMin: 2026,
      gradMax: 2028,
      degree: 'B.Tech, B.E., M.Tech',
      description: 'Design low-latency payment routing APIs, idempotency layers, and merchant analytics dashboards handling millions of global transactions.',
      url: 'https://stripe.com/jobs/university',
    },
    {
      title: 'Vercel Frontend Systems & Next.js Engineering Intern',
      org: 'Vercel',
      category: 'Internship',
      location: 'Remote (Global)',
      workMode: 'Remote',
      remote: true,
      paid: true,
      stipend: '$5,800 / month',
      salary: '',
      duration: '12 Weeks',
      daysOffset: 5,
      difficulty: 'Intermediate',
      beginnerFriendly: false,
      featured: true,
      skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'Tailwind CSS'],
      gradMin: 2026,
      gradMax: 2028,
      degree: 'B.Tech, B.Sc, MS',
      description: 'Work directly on Next.js compiler tooling, Edge runtime caching, and developer experience primitives with the global Vercel engineering team.',
      url: 'https://vercel.com/careers',
    },
    {
      title: 'Anthropic AI Systems & Safety Engineering Intern',
      org: 'Anthropic',
      category: 'Internship',
      location: 'San Francisco / Remote',
      workMode: 'Remote',
      remote: true,
      paid: true,
      stipend: '$8,500 / month',
      salary: '',
      duration: '12 Weeks',
      daysOffset: 15,
      difficulty: 'Advanced',
      beginnerFriendly: false,
      featured: true,
      skills: ['Python', 'PyTorch', 'LLMs', 'Machine Learning', 'TypeScript'],
      gradMin: 2026,
      gradMax: 2028,
      degree: 'B.Tech, M.Tech, MS, PhD',
      description: 'Build evaluation harnesses, interpretability visualizations, and high-throughput inference serving systems for frontier AI models.',
      url: 'https://www.anthropic.com/careers',
    },
    {
      title: 'Atlassian Full-Stack Developer Intern',
      org: 'Atlassian',
      category: 'Internship',
      location: 'Bengaluru (Remote-First)',
      workMode: 'Remote',
      remote: true,
      paid: true,
      stipend: '₹1,30,000 / month',
      salary: '',
      duration: '8 Weeks',
      daysOffset: 3,
      difficulty: 'Intermediate',
      beginnerFriendly: false,
      featured: false,
      skills: ['JavaScript', 'TypeScript', 'React', 'Java', 'GraphQL'],
      gradMin: 2026,
      gradMax: 2028,
      degree: 'B.Tech, B.E.',
      minCgpa: '7.5',
      description: 'Contribute to Jira and Compass developer portals under Atlassian’s Team Anywhere remote-first engineering model.',
      url: 'https://www.atlassian.com/company/careers/graduates',
    },
    {
      title: 'Razorpay Backend & Distributed Systems Intern',
      org: 'Razorpay',
      category: 'Internship',
      location: 'Bengaluru, India',
      workMode: 'Hybrid',
      remote: false,
      paid: true,
      stipend: '₹75,000 / month',
      salary: '',
      duration: '6 Months',
      daysOffset: 8,
      difficulty: 'Intermediate',
      beginnerFriendly: false,
      featured: false,
      skills: ['Go', 'PostgreSQL', 'Redis', 'Docker', 'REST APIs'],
      gradMin: 2026,
      gradMax: 2027,
      degree: 'B.Tech, B.E.',
      description: 'Architect high-concurrency settlement pipelines, webhook delivery queues, and fraud detection microservices in Go and PostgreSQL.',
      url: 'https://razorpay.com/jobs',
    },
    {
      title: 'NVIDIA Deep Learning & TensorRT Intern',
      org: 'NVIDIA',
      category: 'Internship',
      location: 'Pune / Bengaluru',
      workMode: 'Hybrid',
      remote: false,
      paid: true,
      stipend: '₹95,000 / month',
      salary: '',
      duration: '6 Months',
      daysOffset: 17,
      difficulty: 'Advanced',
      beginnerFriendly: false,
      featured: false,
      skills: ['C++', 'Python', 'Deep Learning', 'PyTorch', 'Linux'],
      gradMin: 2026,
      gradMax: 2028,
      degree: 'B.Tech, M.Tech',
      description: 'Optimize neural network kernel execution, quantization pipelines, and LLM inference latency on NVIDIA Hopper & Blackwell architectures.',
      url: 'https://www.nvidia.com/en-us/about-nvidia/careers/university-recruiting',
    },
    {
      title: 'Goldman Sachs Summer Analyst — Core Engineering',
      org: 'Goldman Sachs',
      category: 'Internship',
      location: 'Bengaluru / Hyderabad',
      workMode: 'On-site',
      remote: false,
      paid: true,
      stipend: '₹1,00,000 / month',
      salary: '',
      duration: '8–10 Weeks',
      daysOffset: 4,
      difficulty: 'Intermediate',
      beginnerFriendly: false,
      featured: false,
      skills: ['Java', 'C++', 'Python', 'SQL', 'Algorithms'],
      gradMin: 2027,
      gradMax: 2027,
      degree: 'B.Tech, B.E.',
      description: 'Build quantitative risk analytics, low-latency algorithmic execution platforms, and financial data lakes.',
      url: 'https://www.goldmansachs.com/careers/students',
    },
    {
      title: 'Adobe Research & Creative Cloud Engineering Intern',
      org: 'Adobe',
      category: 'Internship',
      location: 'Noida / Bengaluru',
      workMode: 'Hybrid',
      remote: false,
      paid: true,
      stipend: '₹1,00,000 / month',
      salary: '',
      duration: '10–12 Weeks',
      daysOffset: 14,
      difficulty: 'Intermediate',
      beginnerFriendly: false,
      featured: false,
      skills: ['Python', 'Computer Vision', 'Generative AI', 'React', 'C++'],
      gradMin: 2026,
      gradMax: 2028,
      degree: 'B.Tech, M.Tech, Dual Degree',
      description: 'Develop generative imaging pipelines and browser-based creative tools powered by WebAssembly and Firefly models.',
      url: 'https://www.adobe.com/careers/university.html',
    },
    {
      title: 'Meta Production Engineering University Intern',
      org: 'Meta',
      category: 'Internship',
      location: 'London / Remote',
      workMode: 'Hybrid',
      remote: true,
      paid: true,
      stipend: '$6,500 / month',
      salary: '',
      duration: '12 Weeks',
      daysOffset: 21,
      difficulty: 'Intermediate',
      beginnerFriendly: false,
      featured: false,
      skills: ['Python', 'Linux', 'Docker', 'C++', 'System Design'],
      gradMin: 2026,
      gradMax: 2028,
      degree: 'B.Tech, B.E., MS',
      description: 'Ensure reliability, scalability, and performance of Meta’s global container fleet and AI training clusters.',
      url: 'https://www.metacareers.com/students',
    },
  ];

  // Add 18 more varied Internships to reach 30 Internships
  const extraInternships: Array<Partial<SeedOppTemplate> & { title: string; org: string; skills: string[]; daysOffset: number }> = [
    { title: 'OpenAI Applied AI Engineering Intern', org: 'OpenAI', skills: ['Python', 'TypeScript', 'React', 'LLMs', 'RAG'], daysOffset: 11, stipend: '$7,800 / month', remote: true, workMode: 'Remote', location: 'Remote / San Francisco' },
    { title: 'Linux Foundation Cloud Tooling Intern', org: 'Linux Foundation', skills: ['Go', 'Docker', 'Kubernetes', 'Linux'], daysOffset: 16, stipend: '$3,000 Stipend', remote: true, workMode: 'Remote', location: 'Remote (Global)', beginnerFriendly: true, difficulty: 'Beginner' },
    { title: 'CNCF Prometheus Telemetry Engineering Intern', org: 'Cloud Native Computing Foundation', skills: ['Go', 'TypeScript', 'React', 'Kubernetes'], daysOffset: 22, stipend: '$3,000 Stipend', remote: true, workMode: 'Remote', location: 'Remote (Global)' },
    { title: 'Google Research India AI/ML Winter Intern', org: 'Google', skills: ['Python', 'PyTorch', 'NLP', 'Deep Learning'], daysOffset: 25, stipend: '₹1,20,000 / month', remote: false, workMode: 'Hybrid', location: 'Bengaluru, India' },
    { title: 'Microsoft Explore Internship (First & Second Year)', org: 'Microsoft', skills: ['Python', 'JavaScript', 'HTML', 'CSS'], daysOffset: 13, stipend: '₹85,000 / month', remote: false, workMode: 'Hybrid', location: 'Hyderabad, India', beginnerFriendly: true, difficulty: 'Beginner', gradMin: 2028, gradMax: 2029 },
    { title: 'Stripe Data Science & Fraud ML Intern', org: 'Stripe', skills: ['Python', 'SQL', 'Pandas', 'Machine Learning'], daysOffset: 18, stipend: '₹1,35,000 / month', remote: true, workMode: 'Remote', location: 'Remote / Bengaluru' },
    { title: 'Vercel Design Engineering & UI Systems Intern', org: 'Vercel', skills: ['React', 'Next.js', 'Tailwind CSS', 'TypeScript'], daysOffset: 2, stipend: '$5,200 / month', remote: true, workMode: 'Remote', location: 'Remote (Global)', beginnerFriendly: true, difficulty: 'Beginner' },
    { title: 'Razorpay Frontend Design Systems Intern', org: 'Razorpay', skills: ['React', 'TypeScript', 'CSS', 'JavaScript'], daysOffset: 7, stipend: '₹65,000 / month', remote: true, workMode: 'Remote', location: 'Bengaluru / Remote', beginnerFriendly: true, difficulty: 'Beginner' },
    { title: 'Atlassian Cloud Security & DevSecOps Intern', org: 'Atlassian', skills: ['Python', 'AWS', 'Docker', 'GitHub Actions'], daysOffset: 24, stipend: '₹1,25,000 / month', remote: true, workMode: 'Remote', location: 'Remote (India)' },
    { title: 'NVIDIA Autonomous Vehicles Perception Intern', org: 'NVIDIA', skills: ['C++', 'Python', 'Computer Vision', 'PyTorch'], daysOffset: 28, stipend: '₹95,000 / month', remote: false, workMode: 'On-site', location: 'Pune, India', difficulty: 'Advanced' },
    { title: 'Adobe Document Cloud Full-Stack Intern', org: 'Adobe', skills: ['TypeScript', 'React', 'Node.js', 'REST APIs'], daysOffset: 10, stipend: '₹95,000 / month', remote: false, workMode: 'Hybrid', location: 'Bengaluru, India' },
    { title: 'Meta PyTorch Core Compiler Intern', org: 'Meta', skills: ['C++', 'Python', 'PyTorch', 'Deep Learning'], daysOffset: 31, stipend: '$6,800 / month', remote: true, workMode: 'Remote', location: 'Remote / Menlo Park', difficulty: 'Advanced' },
    { title: 'Goldman Sachs Quantitative Strategies Intern', org: 'Goldman Sachs', skills: ['Python', 'C++', 'NumPy', 'Pandas', 'Algorithms'], daysOffset: 20, stipend: '₹1,10,000 / month', remote: false, workMode: 'On-site', location: 'Bengaluru, India' },
    { title: 'MLH Production Engineering Intern Cohort', org: 'Major League Hacking', skills: ['Python', 'Linux', 'Docker', 'Bash', 'Git'], daysOffset: 9, stipend: '$5,000 Stipend', remote: true, workMode: 'Remote', location: 'Remote (Global)', beginnerFriendly: true },
    { title: 'ETHGlobal Protocol Engineering Intern', org: 'ETHGlobal', skills: ['TypeScript', 'Rust', 'Node.js', 'PostgreSQL'], daysOffset: 27, stipend: '$4,500 / month', remote: true, workMode: 'Remote', location: 'Remote (Global)' },
    { title: 'Outreachy Mozilla Web Platform Intern', org: 'Outreachy', skills: ['JavaScript', 'C++', 'Rust', 'HTML', 'CSS'], daysOffset: 14, stipend: '$7,000 Total Stipend', remote: true, workMode: 'Remote', location: 'Remote (Global)', beginnerFriendly: true, difficulty: 'Beginner' },
    { title: 'CERN Openlab Data Pipeline Summer Intern', org: 'CERN', skills: ['Python', 'C++', 'SQL', 'Spark', 'Linux'], daysOffset: 23, stipend: 'CHF 3,300 / month', remote: false, workMode: 'On-site', location: 'Geneva, Switzerland' },
    { title: 'Stanford AI Lab Open-Source LLM Tooling Intern', org: 'Stanford AI Lab', skills: ['Python', 'PyTorch', 'LLMs', 'RAG'], daysOffset: 19, stipend: '$4,200 / month', remote: true, workMode: 'Remote', location: 'Remote (Global)' },
  ];

  list.push(...internships);
  for (const item of extraInternships) {
    list.push({
      title: item.title,
      org: item.org,
      category: 'Internship',
      location: item.location || 'Remote',
      workMode: item.workMode || 'Remote',
      remote: item.remote ?? true,
      paid: true,
      stipend: item.stipend || '₹80,000 / month',
      salary: '',
      duration: '12 Weeks',
      daysOffset: item.daysOffset,
      difficulty: item.difficulty || 'Intermediate',
      beginnerFriendly: item.beginnerFriendly ?? false,
      featured: false,
      skills: item.skills,
      gradMin: item.gradMin || 2026,
      gradMax: item.gradMax || 2028,
      degree: 'B.Tech, B.E., M.Tech, B.Sc',
      description: `Hands-on engineering internship at ${item.org} building production systems with ${item.skills.join(', ')}. Includes 1:1 mentorship, code reviews, and full-time conversion consideration.`,
      url: 'https://careers.google.com',
    });
  }

  // 2. 20 HACKATHONS
  const hackathonsData = [
    { title: 'Microsoft Imagine Cup Global Student Championship 2027', org: 'Microsoft', skills: ['Python', 'Generative AI', 'Azure', 'React', 'Next.js'], daysOffset: 8, stipend: '$100,000 Grand Prize + Mentorship', remote: true, beginnerFriendly: true, featured: true, location: 'Global Online' },
    { title: 'Major League Hacking (MLH) Global Hack Week: AI & Cloud', org: 'Major League Hacking', skills: ['Python', 'JavaScript', 'React', 'Git', 'Docker'], daysOffset: 3, stipend: '$15,000 Prizes + Swag', remote: true, beginnerFriendly: true, featured: true, location: 'Global Online' },
    { title: 'ETHGlobal Autonomous Agents & Zero-Knowledge Hackathon', org: 'ETHGlobal', skills: ['TypeScript', 'Rust', 'Next.js', 'LLMs'], daysOffset: 11, stipend: '$250,000 Prize Pool', remote: true, beginnerFriendly: false, featured: true, location: 'Global Online / Hybrid' },
    { title: 'Google Cloud Vertex AI & Gemini Developer Hackathon', org: 'Google', skills: ['Python', 'TypeScript', 'Generative AI', 'GCP', 'React'], daysOffset: 6, stipend: '$50,000 Prize Pool', remote: true, beginnerFriendly: true, featured: true, location: 'Global Online' },
    { title: 'Vercel Next.js Global Ship-It Hackathon', org: 'Vercel', skills: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'], daysOffset: 14, stipend: '$40,000 + Vercel Pro Credits', remote: true, beginnerFriendly: true, featured: false, location: 'Remote (Global)' },
    { title: 'Anthropic Claude MCP & Agentic Workflows Buildathon', org: 'Anthropic', skills: ['Python', 'TypeScript', 'LLMs', 'RAG', 'Node.js'], daysOffset: 9, stipend: '$35,000 + API Credits', remote: true, beginnerFriendly: false, featured: true, location: 'Remote (Global)' },
    { title: 'Razorpay FinTech & UPI 3.0 Product Hackathon', org: 'Razorpay', skills: ['Node.js', 'Go', 'React', 'PostgreSQL', 'REST APIs'], daysOffset: 5, stipend: '₹10,00,000 Prize Pool + PPIs', remote: false, beginnerFriendly: false, featured: false, location: 'Bengaluru / Hybrid' },
    { title: 'Atlassian Forge Developer App Hackathon', org: 'Atlassian', skills: ['TypeScript', 'React', 'Node.js', 'GraphQL'], daysOffset: 18, stipend: '$30,000 Prize Pool', remote: true, beginnerFriendly: true, featured: false, location: 'Global Online' },
    { title: 'NVIDIA CUDA & Edge AI Robotics Hackathon', org: 'NVIDIA', skills: ['Python', 'C++', 'Computer Vision', 'PyTorch'], daysOffset: 21, stipend: '$25,000 + RTX GPUs', remote: true, beginnerFriendly: false, featured: false, location: 'Global Online' },
    { title: 'Stripe Internet Economy & Autonomous Billing Hackathon', org: 'Stripe', skills: ['TypeScript', 'React', 'Node.js', 'SQL'], daysOffset: 16, stipend: '$20,000 Prize Pool', remote: true, beginnerFriendly: true, featured: false, location: 'Remote (Global)' },
    { title: 'Meta Llama Open-Source Impact Challenge', org: 'Meta', skills: ['Python', 'LLMs', 'RAG', 'PyTorch', 'React'], daysOffset: 12, stipend: '$60,000 Total Grants', remote: true, beginnerFriendly: true, featured: false, location: 'Remote (Global)' },
    { title: 'CNCF Cloud Native Kubernetes Operators Hackathon', org: 'Cloud Native Computing Foundation', skills: ['Go', 'Kubernetes', 'Docker', 'Linux'], daysOffset: 24, stipend: '$12,000 + KubeCon Passes', remote: true, beginnerFriendly: false, featured: false, location: 'Global Online' },
    { title: 'Adobe Creative GenAI & WebAssembly Hack', org: 'Adobe', skills: ['JavaScript', 'TypeScript', 'React', 'Generative AI'], daysOffset: 7, stipend: '₹6,00,000 + Pre-Placement Interviews', remote: true, beginnerFriendly: true, featured: false, location: 'India Online' },
    { title: 'CERN Particle Physics & Open Data Challenge', org: 'CERN', skills: ['Python', 'Pandas', 'NumPy', 'Machine Learning'], daysOffset: 29, stipend: 'CERN Geneva Study Visit', remote: true, beginnerFriendly: true, featured: false, location: 'Global Online' },
    { title: 'Stanford TreeHacks Open Track Challenge', org: 'Stanford AI Lab', skills: ['Python', 'React', 'TypeScript', 'Machine Learning'], daysOffset: 32, stipend: '$75,000 in Prizes', remote: false, beginnerFriendly: true, featured: false, location: 'Stanford, CA / Hybrid' },
    { title: 'OpenAI Reasoning & Multi-Modal Agents Hackathon', org: 'OpenAI', skills: ['Python', 'TypeScript', 'LLMs', 'Next.js'], daysOffset: 13, stipend: '$50,000 + Compute Credits', remote: true, beginnerFriendly: false, featured: false, location: 'Remote (Global)' },
    { title: 'Linux Foundation Open Source Security (OpenSSF) Hack', org: 'Linux Foundation', skills: ['Python', 'Go', 'Rust', 'GitHub Actions'], daysOffset: 20, stipend: '$15,000 Bounties', remote: true, beginnerFriendly: false, featured: false, location: 'Global Online' },
    { title: 'Goldman Sachs India Engineering Campus Hackathon', org: 'Goldman Sachs', skills: ['Java', 'Python', 'Data Structures', 'Algorithms'], daysOffset: 4, stipend: '₹5,00,000 + Summer Intern Offers', remote: true, beginnerFriendly: false, featured: false, location: 'India Online' },
    { title: 'MLH First-Timers Weekend Buildathon', org: 'Major League Hacking', skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Git'], daysOffset: 2, stipend: '$5,000 Beginner Prizes', remote: true, beginnerFriendly: true, featured: false, location: 'Global Online' },
    { title: 'Outreachy Open-Source Documentation & Tooling Sprint', org: 'Outreachy', skills: ['Git', 'Python', 'JavaScript', 'HTML'], daysOffset: 15, stipend: '$3,000 Community Grants', remote: true, beginnerFriendly: true, featured: false, location: 'Global Online' },
  ];

  for (const h of hackathonsData) {
    list.push({
      title: h.title,
      org: h.org,
      category: 'Hackathon',
      location: h.location,
      workMode: h.remote ? 'Remote' : 'Hybrid',
      remote: h.remote,
      paid: true,
      stipend: h.stipend,
      salary: '',
      duration: '48 Hours',
      daysOffset: h.daysOffset,
      difficulty: h.beginnerFriendly ? 'Beginner' : 'Intermediate',
      beginnerFriendly: h.beginnerFriendly,
      featured: h.featured,
      skills: h.skills,
      gradMin: 2025,
      gradMax: 2030,
      degree: 'Any',
      description: `Build and ship a working prototype in ${h.title} hosted by ${h.org}. Open to student teams of 1–4 developers with live mentorship, API credits, and fast-track interview opportunities.`,
      url: 'https://mlh.io',
    });
  }

  // 3. 20 OPEN SOURCE PROGRAMS
  const openSourceData = [
    { title: 'Google Summer of Code (GSoC) — Open Source Contributor', org: 'Google', skills: ['Python', 'TypeScript', 'Go', 'C++', 'Git'], daysOffset: 10, stipend: '$1,500 – $6,600 Stipend', beginnerFriendly: true, featured: true },
    { title: 'Outreachy Open Source Fellowships (May–August Cohort)', org: 'Outreachy', skills: ['Python', 'JavaScript', 'React', 'Linux', 'Git'], daysOffset: 7, stipend: '$7,000 Stipend', beginnerFriendly: true, featured: true },
    { title: 'Linux Foundation LFX Mentorship — Kubernetes & Envoy', org: 'Linux Foundation', skills: ['Go', 'Kubernetes', 'Docker', 'Linux', 'Git'], daysOffset: 14, stipend: '$3,000 – $6,000 Stipend', beginnerFriendly: false, featured: true },
    { title: 'CNCF Cloud Native Mentorship — Cilium & ArgoCD', org: 'Cloud Native Computing Foundation', skills: ['Go', 'Rust', 'Kubernetes', 'Docker'], daysOffset: 16, stipend: '$4,500 Stipend', beginnerFriendly: false, featured: true },
    { title: 'MLH Fellowship — Open Source Software Engineering Track', org: 'Major League Hacking', skills: ['TypeScript', 'React', 'Node.js', 'Python', 'Git'], daysOffset: 5, stipend: '$5,000 Educational Stipend', beginnerFriendly: true, featured: true },
    { title: 'Google Season of Docs — Technical Writing & SDK Engineering', org: 'Google', skills: ['Git', 'REST APIs', 'JavaScript', 'Python'], daysOffset: 22, stipend: '$5,000 Stipend', beginnerFriendly: true, featured: false },
    { title: 'Meta PyTorch Open Source Ecosystem Fellowship', org: 'Meta', skills: ['Python', 'PyTorch', 'C++', 'Deep Learning'], daysOffset: 19, stipend: '$6,000 Grant', beginnerFriendly: false, featured: false },
    { title: 'Vercel Next.js & Turborepo Open Source Maintainer Grant', org: 'Vercel', skills: ['TypeScript', 'Rust', 'Next.js', 'React'], daysOffset: 12, stipend: '$4,000 Sponsorship', beginnerFriendly: false, featured: false },
    { title: 'Stripe Open Source Retreat & SDK Contributor Program', org: 'Stripe', skills: ['TypeScript', 'Go', 'Python', 'REST APIs'], daysOffset: 26, stipend: '$5,500 Grant', beginnerFriendly: false, featured: false },
    { title: 'Anthropic Model Context Protocol (MCP) Open Source Bounty', org: 'Anthropic', skills: ['TypeScript', 'Python', 'LLMs', 'Node.js'], daysOffset: 8, stipend: '$2,500 – $10,000 Grant', beginnerFriendly: true, featured: false },
    { title: 'CERN High-Energy Physics ROOT Open Source Fellowship', org: 'CERN', skills: ['C++', 'Python', 'Linux', 'Git'], daysOffset: 21, stipend: 'CHF 4,500 Fellowship', beginnerFriendly: false, featured: false },
    { title: 'Linux Kernel Mentorship Program (LKMP)', org: 'Linux Foundation', skills: ['C', 'Linux', 'Bash', 'Git'], daysOffset: 17, stipend: '$3,600 Stipend', beginnerFriendly: false, featured: false },
    { title: 'CNCF OpenTelemetry JavaScript & Python SDK Mentorship', org: 'Cloud Native Computing Foundation', skills: ['TypeScript', 'Python', 'Node.js', 'Docker'], daysOffset: 9, stipend: '$3,000 Stipend', beginnerFriendly: true, featured: false },
    { title: 'ETHGlobal Ethereum Core Protocol Fellowship', org: 'ETHGlobal', skills: ['Rust', 'Go', 'TypeScript', 'Algorithms'], daysOffset: 25, stipend: '$10,000 Fellowship Grant', beginnerFriendly: false, featured: false },
    { title: 'Stanford AI DSPy & Stanford NLP Open Source Program', org: 'Stanford AI Lab', skills: ['Python', 'LLMs', 'RAG', 'NLP'], daysOffset: 13, stipend: '$4,000 Research Stipend', beginnerFriendly: true, featured: false },
    { title: 'NVIDIA Open-Source Triton & TensorRT-LLM Contributors', org: 'NVIDIA', skills: ['C++', 'Python', 'Deep Learning', 'Docker'], daysOffset: 28, stipend: '$5,000 Contributor Award', beginnerFriendly: false, featured: false },
    { title: 'Razorpay Blade Design System Open Source Sprint', org: 'Razorpay', skills: ['React', 'TypeScript', 'CSS', 'Tailwind CSS'], daysOffset: 6, stipend: '₹1,50,000 Grant + Internship Interview', beginnerFriendly: true, featured: false },
    { title: 'Adobe Spectrum Web Components Open Source Program', org: 'Adobe', skills: ['HTML', 'CSS', 'TypeScript', 'JavaScript'], daysOffset: 20, stipend: '$3,500 Stipend', beginnerFriendly: true, featured: false },
    { title: 'Microsoft VS Code Extension & TypeScript Compiler Sprint', org: 'Microsoft', skills: ['TypeScript', 'Node.js', 'Git'], daysOffset: 15, stipend: '$4,000 Open Source Bounty', beginnerFriendly: true, featured: false },
    { title: 'OpenAI Evals & Swarm Open Source Maintainer Cohort', org: 'OpenAI', skills: ['Python', 'LLMs', 'Generative AI', 'Git'], daysOffset: 11, stipend: '$5,000 API & Cash Grant', beginnerFriendly: true, featured: false },
  ];

  for (const os of openSourceData) {
    list.push({
      title: os.title,
      org: os.org,
      category: 'Open Source',
      location: 'Remote (Global)',
      workMode: 'Remote',
      remote: true,
      paid: true,
      stipend: os.stipend,
      salary: '',
      duration: '12 Weeks',
      daysOffset: os.daysOffset,
      difficulty: os.beginnerFriendly ? 'Beginner' : 'Intermediate',
      beginnerFriendly: os.beginnerFriendly,
      featured: os.featured,
      skills: os.skills,
      gradMin: 2025,
      gradMax: 2030,
      degree: 'Any',
      description: `Contribute production code to open-source repositories under direct mentorship from ${os.org} maintainers. Build public GitHub proof-of-work while earning a structured contributor stipend.`,
      url: 'https://summerofcode.withgoogle.com',
    });
  }

  // 4. 15 SCHOLARSHIPS
  const scholarshipsData = [
    { title: 'Generation Google Scholarship (APAC & India — Computer Science)', org: 'Google', skills: ['Python', 'Data Structures', 'Algorithms'], daysOffset: 9, stipend: '$2,500 USD Award', minCgpa: '8.0', featured: true },
    { title: 'Adobe India Women-in-Technology Scholarship', org: 'Adobe', skills: ['Python', 'Machine Learning', 'C++', 'React'], daysOffset: 14, stipend: 'Full Tuition + Summer Internship + Conference Travel', minCgpa: '8.0', featured: true },
    { title: 'Venkat Panchapakesan Memorial Scholarship by Google', org: 'Google', skills: ['JavaScript', 'Python', 'Git'], daysOffset: 18, stipend: '$2,500 USD + Google Retreat', minCgpa: '7.5', featured: false },
    { title: 'Microsoft Tuition & Diversity in STEM Scholarship', org: 'Microsoft', skills: ['C++', 'Python', 'TypeScript'], daysOffset: 21, stipend: '$5,000 Academic Grant', minCgpa: '7.8', featured: false },
    { title: 'Linux Foundation Dan Kohn KubeCon Scholar Program', org: 'Linux Foundation', skills: ['Linux', 'Docker', 'Kubernetes', 'Git'], daysOffset: 11, stipend: '$3,000 Travel & Registration Grant', minCgpa: '7.0', featured: false },
    { title: 'Goldman Sachs Global Leaders & Engineering Scholar Award', org: 'Goldman Sachs', skills: ['Java', 'Python', 'SQL'], daysOffset: 25, stipend: '$4,000 Merit Award', minCgpa: '8.2', featured: false },
    { title: 'NVIDIA Graduate & Senior Undergrad Hardware/AI Fellowship', org: 'NVIDIA', skills: ['C++', 'PyTorch', 'Deep Learning'], daysOffset: 29, stipend: '$15,000 Research & Tuition Grant', minCgpa: '8.5', featured: false },
    { title: 'Meta AI & Systems Scholars Grant', org: 'Meta', skills: ['Python', 'PyTorch', 'Machine Learning'], daysOffset: 16, stipend: '$5,000 Academic Scholarship', minCgpa: '8.0', featured: false },
    { title: 'CNCF Cloud Native Diversity & Student Scholar Grant', org: 'Cloud Native Computing Foundation', skills: ['Go', 'Docker', 'Kubernetes'], daysOffset: 7, stipend: '$2,000 Stipend + Certification Vouchers', minCgpa: '7.0', featured: false },
    { title: 'ETHGlobal Zero-Knowledge Cryptography Student Grant', org: 'ETHGlobal', skills: ['Rust', 'TypeScript', 'Algorithms'], daysOffset: 13, stipend: '$3,500 Student Grant', minCgpa: '7.5', featured: false },
    { title: 'Atlassian Foundation STEM Excellence Scholarship', org: 'Atlassian', skills: ['JavaScript', 'React', 'Java'], daysOffset: 20, stipend: '₹2,00,000 Academic Grant', minCgpa: '7.5', featured: false },
    { title: 'Stanford HAI Student Travel & Research Micro-Grant', org: 'Stanford AI Lab', skills: ['Python', 'NLP', 'LLMs'], daysOffset: 27, stipend: '$3,000 Academic Grant', minCgpa: '8.0', featured: false },
    { title: 'MITACS Globalink Research Scholar Award', org: 'MITACS', skills: ['Python', 'Machine Learning', 'Data Structures'], daysOffset: 15, stipend: 'CAD $12,000 Fully Funded Grant', minCgpa: '8.0', featured: false },
    { title: 'Stripe Economic Infrastructure Student Fellowship Grant', org: 'Stripe', skills: ['TypeScript', 'Python', 'SQL'], daysOffset: 19, stipend: '$5,000 Fellowship Award', minCgpa: '7.8', featured: false },
    { title: 'Outreachy Community Leadership & Travel Scholarship', org: 'Outreachy', skills: ['Git', 'Python', 'Linux'], daysOffset: 23, stipend: '$2,500 Conference & Learning Grant', minCgpa: '6.5', featured: false },
  ];

  for (const s of scholarshipsData) {
    list.push({
      title: s.title,
      org: s.org,
      category: 'Scholarship',
      location: 'India / International',
      workMode: 'Remote',
      remote: true,
      paid: true,
      stipend: s.stipend,
      salary: '',
      duration: '1 Academic Year',
      daysOffset: s.daysOffset,
      difficulty: 'Intermediate',
      beginnerFriendly: true,
      featured: s.featured,
      skills: s.skills,
      gradMin: 2026,
      gradMax: 2029,
      degree: 'B.Tech, B.E., M.Tech, B.Sc, MS',
      minCgpa: s.minCgpa,
      description: `Merit and impact-based academic scholarship funded by ${s.org} supporting computer science and engineering students demonstrating leadership, technical excellence, and community contribution.`,
      url: 'https://buildyourfuture.withgoogle.com/scholarships',
    });
  }

  // 5. 15 CODING CONTESTS
  const contestsData = [
    { title: 'Codeforces Global Round 32 (Div. 1 + Div. 2 Rated)', org: 'Codeforces', skills: ['C++', 'Python', 'Data Structures', 'Algorithms'], daysOffset: 2, stipend: 'Rated Contest + Top 50 T-Shirts & Prizes', difficulty: 'Intermediate', featured: true },
    { title: 'LeetCode Weekly Contest 438 — Global Algorithmic Arena', org: 'LeetCode', skills: ['C++', 'Python', 'Java', 'Data Structures', 'Algorithms'], daysOffset: 4, stipend: 'LeetCoins + Global Knight Rating + Fast-Track Referrals', difficulty: 'Intermediate', featured: true },
    { title: 'Meta Hacker Cup 2026 — Qualification & Round 1', org: 'Meta', skills: ['C++', 'Python', 'Algorithms', 'Data Structures'], daysOffset: 9, stipend: '$20,000 First Prize + Meta Interview Invites', difficulty: 'Advanced', featured: true },
    { title: 'Codeforces Educational Round 178 (Rated for Div. 2)', org: 'Codeforces', skills: ['C++', 'Python', 'Data Structures', 'Algorithms'], daysOffset: 5, stipend: 'Official Rating Points', difficulty: 'Beginner', featured: false },
    { title: 'LeetCode Biweekly Contest 154', org: 'LeetCode', skills: ['Python', 'C++', 'Java', 'Algorithms'], daysOffset: 7, stipend: 'Global Ranking & Interview Prep Prizes', difficulty: 'Beginner', featured: false },
    { title: 'Google Kick Start / Code Jam Alumni Practice Arena', org: 'Google', skills: ['C++', 'Python', 'Algorithms', 'Data Structures'], daysOffset: 11, stipend: 'Google Recruiter Spotlight', difficulty: 'Intermediate', featured: false },
    { title: 'Goldman Sachs Quant & Algorithmic Coding Championship', org: 'Goldman Sachs', skills: ['C++', 'Python', 'Java', 'Algorithms'], daysOffset: 6, stipend: '₹3,00,000 Prizes + Summer Analyst Interviews', difficulty: 'Intermediate', featured: false },
    { title: 'Atlassian Codegeist & Algorithmic Sprint', org: 'Atlassian', skills: ['Java', 'C++', 'TypeScript', 'Algorithms'], daysOffset: 14, stipend: '$15,000 Prize Pool', difficulty: 'Intermediate', featured: false },
    { title: 'Microsoft Codess & Campus Algorithmic Cup', org: 'Microsoft', skills: ['C++', 'Python', 'Data Structures', 'Algorithms'], daysOffset: 10, stipend: 'Direct Internship Final Round Interviews', difficulty: 'Intermediate', featured: false },
    { title: 'Codeforces Div. 3 Beginner Rated Speed Contest', org: 'Codeforces', skills: ['C++', 'Python', 'Java'], daysOffset: 3, stipend: 'Official Div. 3 Rating', difficulty: 'Beginner', featured: false },
    { title: 'Stripe Capture-The-Bug & Distributed Systems Contest', org: 'Stripe', skills: ['TypeScript', 'Go', 'Python', 'SQL'], daysOffset: 16, stipend: '$10,000 + Stripe Engineering Fast-Track', difficulty: 'Intermediate', featured: false },
    { title: 'NVIDIA Parallel Programming & CUDA Optimization Contest', org: 'NVIDIA', skills: ['C++', 'Python', 'Algorithms'], daysOffset: 22, stipend: 'NVIDIA RTX 5090 + Cash Awards', difficulty: 'Advanced', featured: false },
    { title: 'Razorpay High-Throughput System Design & Coding Challenge', org: 'Razorpay', skills: ['Go', 'Java', 'PostgreSQL', 'System Design'], daysOffset: 8, stipend: '₹2,50,000 + SDE Intern Offers', difficulty: 'Intermediate', featured: false },
    { title: 'Adobe GenSolve Algorithmic & ML Contest', org: 'Adobe', skills: ['Python', 'C++', 'Machine Learning', 'Algorithms'], daysOffset: 13, stipend: '₹4,00,000 + Adobe Internship PPO Track', difficulty: 'Intermediate', featured: false },
    { title: 'LeetCode Dynamic Programming & Graph Theory Cup', org: 'LeetCode', skills: ['C++', 'Python', 'Algorithms', 'Data Structures'], daysOffset: 18, stipend: '$5,000 Prize Pool', difficulty: 'Intermediate', featured: false },
  ];

  for (const c of contestsData) {
    list.push({
      title: c.title,
      org: c.org,
      category: 'Coding Contest',
      location: 'Online (Global)',
      workMode: 'Remote',
      remote: true,
      paid: true,
      stipend: c.stipend,
      salary: '',
      duration: '2.5 Hours',
      daysOffset: c.daysOffset,
      difficulty: c.difficulty,
      beginnerFriendly: c.difficulty === 'Beginner',
      featured: c.featured,
      skills: c.skills,
      gradMin: 2025,
      gradMax: 2030,
      degree: 'Any',
      description: `Timed algorithmic and systems coding contest hosted by ${c.org}. Solve 4–7 competitive programming problems to boost your global rating and unlock direct technical interview referrals.`,
      url: 'https://codeforces.com/contests',
    });
  }

  // 6. 10 RESEARCH OPPORTUNITIES
  const researchData = [
    { title: 'CERN Summer Student Programme — Geneva Scientific Computing', org: 'CERN', skills: ['Python', 'C++', 'Linux', 'Data Structures'], daysOffset: 14, stipend: 'CHF 93 / day + Travel Allowance', location: 'Geneva, Switzerland', remote: false, featured: true },
    { title: 'MITACS Globalink Research Internship (Canadian Universities)', org: 'MITACS', skills: ['Python', 'Machine Learning', 'Deep Learning', 'Pandas'], daysOffset: 11, stipend: 'CAD $12,000 Fully Funded', location: 'Canada (Multiple Universities)', remote: false, featured: true },
    { title: 'Stanford AI Lab (SAIL) Undergraduate Visiting Researcher', org: 'Stanford AI Lab', skills: ['Python', 'PyTorch', 'LLMs', 'RAG', 'NLP'], daysOffset: 19, stipend: '$4,800 / month Stipend', location: 'Stanford / Hybrid', remote: true, featured: true },
    { title: 'Google Research Student Researcher Program — Multimodal AI', org: 'Google', skills: ['Python', 'PyTorch', 'Deep Learning', 'Computer Vision'], daysOffset: 8, stipend: '₹1,30,000 / month', location: 'Bengaluru, India', remote: false, featured: false },
    { title: 'Microsoft Research (MSR India) Research Fellow / Intern', org: 'Microsoft', skills: ['Python', 'LLMs', 'Algorithms', 'Machine Learning'], daysOffset: 15, stipend: '₹1,15,000 / month', location: 'Bengaluru, India', remote: false, featured: false },
    { title: 'Anthropic Mechanistic Interpretability Research Fellowship', org: 'Anthropic', skills: ['Python', 'PyTorch', 'LLMs', 'Deep Learning'], daysOffset: 17, stipend: '$7,500 / month + Compute Cluster', location: 'Remote / San Francisco', remote: true, featured: false },
    { title: 'Adobe Research Undergraduate Mentorship — Generative Vision', org: 'Adobe', skills: ['Python', 'Computer Vision', 'PyTorch', 'Generative AI'], daysOffset: 21, stipend: '₹1,05,000 / month', location: 'Bengaluru, India', remote: false, featured: false },
    { title: 'Meta Fundamental AI Research (FAIR) Student Residency', org: 'Meta', skills: ['Python', 'PyTorch', 'NLP', 'Deep Learning'], daysOffset: 24, stipend: '$7,000 / month', location: 'Remote / London / Paris', remote: true, featured: false },
    { title: 'NVIDIA Research Academic Collaboration — Neural Rendering', org: 'NVIDIA', skills: ['C++', 'Python', 'Computer Vision', 'Deep Learning'], daysOffset: 26, stipend: '$6,200 / month', location: 'Remote / Santa Clara', remote: true, featured: false },
    { title: 'OpenAI Superalignment & Reasoning Research Grant Cohort', org: 'OpenAI', skills: ['Python', 'PyTorch', 'LLMs', 'Machine Learning'], daysOffset: 12, stipend: '$10,000 Research Stipend', location: 'Remote (Global)', remote: true, featured: false },
  ];

  for (const r of researchData) {
    list.push({
      title: r.title,
      org: r.org,
      category: 'Research',
      location: r.location,
      workMode: r.remote ? 'Remote' : 'On-site',
      remote: r.remote,
      paid: true,
      stipend: r.stipend,
      salary: '',
      duration: '10–12 Weeks',
      daysOffset: r.daysOffset,
      difficulty: 'Advanced',
      beginnerFriendly: false,
      featured: r.featured,
      skills: r.skills,
      gradMin: 2026,
      gradMax: 2028,
      degree: 'B.Tech, M.Tech, B.Sc, MS, PhD',
      minCgpa: '8.0',
      description: `Collaborate with principal investigators and research scientists at ${r.org} to co-author peer-reviewed publications and open-source research artifacts in ${r.skills.join(', ')}.`,
      url: 'https://careers.cern',
    });
  }

  // 7. 10 JOBS & FELLOWSHIPS
  const jobsData = [
    { title: 'Google University Graduate Software Engineer — Cloud & AI', org: 'Google', skills: ['C++', 'Python', 'Go', 'Java', 'System Design', 'Algorithms'], daysOffset: 10, salary: '₹32–38 LPA ($145k Global)', location: 'Bengaluru / Hyderabad', remote: false, featured: true },
    { title: 'Stripe New Grad Software Engineer — Core Infrastructure', org: 'Stripe', skills: ['TypeScript', 'Go', 'React', 'PostgreSQL', 'REST APIs'], daysOffset: 13, salary: '₹42 LPA', location: 'Bengaluru / Remote', remote: true, featured: true },
    { title: 'Vercel Junior Systems & Edge Network Engineer', org: 'Vercel', skills: ['TypeScript', 'Rust', 'Next.js', 'React', 'Node.js'], daysOffset: 16, salary: '$130,000 – $155,000 / year', location: 'Remote (Global)', remote: true, featured: true },
    { title: 'Anthropic Entry-Level AI Product Engineer', org: 'Anthropic', skills: ['TypeScript', 'Python', 'React', 'LLMs', 'RAG'], daysOffset: 20, salary: '$165,000 / year', location: 'San Francisco / Remote', remote: true, featured: false },
    { title: 'Razorpay Software Development Engineer I (SDE-1)', org: 'Razorpay', skills: ['Go', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'], daysOffset: 7, salary: '₹24–28 LPA', location: 'Bengaluru, India', remote: false, featured: false },
    { title: 'Atlassian Graduate Software Engineer (2026/2027 Cohort)', org: 'Atlassian', skills: ['TypeScript', 'React', 'Java', 'GraphQL', 'AWS'], daysOffset: 15, salary: '₹34 LPA', location: 'Remote (India)', remote: true, featured: false },
    { title: 'Microsoft Software Engineer I — Copilot Developer Tools', org: 'Microsoft', skills: ['TypeScript', 'C++', 'Python', 'Azure', 'React'], daysOffset: 18, salary: '₹28–34 LPA', location: 'Hyderabad / Bengaluru', remote: false, featured: false },
    { title: 'NVIDIA System Software Engineer — New College Grad', org: 'NVIDIA', skills: ['C', 'C++', 'Python', 'Linux', 'Algorithms'], daysOffset: 22, salary: '₹29 LPA', location: 'Bengaluru / Pune', remote: false, featured: false },
    { title: 'Goldman Sachs Engineering Analyst — Full Time', org: 'Goldman Sachs', skills: ['Java', 'Python', 'SQL', 'React', 'Algorithms'], daysOffset: 11, salary: '₹26 LPA', location: 'Bengaluru / Hyderabad', remote: false, featured: false },
    { title: 'OpenAI Residency Program — Software & ML Engineers', org: 'OpenAI', skills: ['Python', 'PyTorch', 'Deep Learning', 'LLMs', 'C++'], daysOffset: 9, salary: '$210,000 / year pro-rated', location: 'San Francisco / Remote', remote: true, featured: true },
  ];

  for (const j of jobsData) {
    list.push({
      title: j.title,
      org: j.org,
      category: 'Job',
      location: j.location,
      workMode: j.remote ? 'Remote' : 'Hybrid',
      remote: j.remote,
      paid: true,
      stipend: j.salary,
      salary: j.salary,
      duration: 'Full-Time',
      daysOffset: j.daysOffset,
      difficulty: 'Intermediate',
      beginnerFriendly: false,
      featured: j.featured,
      skills: j.skills,
      gradMin: 2025,
      gradMax: 2027,
      degree: 'B.Tech, B.E., M.Tech, MS',
      minCgpa: '7.0',
      description: `Full-time early-career engineering role at ${j.org}. Own end-to-end architecture, production reliability, and feature delivery using ${j.skills.join(', ')}.`,
      url: 'https://careers.google.com',
    });
  }

  return list;
}

export const INITIAL_ROADMAPS = [
  {
    title: 'Become a Full Stack Developer',
    slug: 'full-stack-developer',
    category: 'Web Development',
    estimatedWeeks: 12,
    difficulty: 'Beginner to Intermediate',
    description: 'Master modern web engineering from semantic HTML/CSS and TypeScript to React, Next.js, Node.js APIs, PostgreSQL data modeling, authentication, and cloud deployment.',
    steps: [
      {
        title: '01. Semantic HTML, Modern CSS & Responsive Layouts',
        description: 'Build accessible DOM structures, Flexbox/Grid systems, and Tailwind CSS design tokens.',
        stepOrder: 1,
        estimatedHours: 12,
        skillName: 'HTML',
        resources: ['MDN Web Docs — HTML & CSS', 'Tailwind CSS Architecture Guide'],
        projects: ['Responsive Developer Portfolio with Dark Mode'],
        problems: ['Fluid Grid Layout Challenge', 'WCAG AA Contrast Audit'],
      },
      {
        title: '02. JavaScript & TypeScript Deep Dive',
        description: 'Understand closures, event loop, async/await Promises, generics, and strict TypeScript types.',
        stepOrder: 2,
        estimatedHours: 18,
        skillName: 'TypeScript',
        resources: ['TypeScript Handbook', 'You Don’t Know JS Yet'],
        projects: ['Type-Safe Async Task Queue & Schema Validator'],
        problems: ['Debounce & Promise.all Polyfill', 'Deep Readonly Type Utility'],
      },
      {
        title: '03. Git, GitHub Workflows & Pull Request Discipline',
        description: 'Master branching, interactive rebasing, conflict resolution, and CI check workflows.',
        stepOrder: 3,
        estimatedHours: 8,
        skillName: 'Git',
        resources: ['Pro Git Book', 'GitHub Pull Request Best Practices'],
        projects: ['First Verified Open-Source Documentation or Bugfix PR'],
        problems: ['Interactive Rebase & Bisect Exercise'],
      },
      {
        title: '04. React 19 & State Architecture',
        description: 'Build composable hooks, optimistic UI updates, memoization, and URL-synchronized state.',
        stepOrder: 4,
        estimatedHours: 20,
        skillName: 'React',
        resources: ['React Official Documentation (react.dev)'],
        projects: ['Interactive Kanban Board with Drag-and-Drop & Filters'],
        problems: ['Virtual List Windowing Hook', 'Optimistic Mutation Handler'],
      },
      {
        title: '05. Next.js, Server Actions & Edge Rendering',
        description: 'Architect hybrid SSR/SSG routes, server components, API endpoints, and caching strategies.',
        stepOrder: 5,
        estimatedHours: 18,
        skillName: 'Next.js',
        resources: ['Next.js App Router Documentation'],
        projects: ['Multi-tenant SaaS Analytics Dashboard'],
        problems: ['Dynamic OG Image Generator', 'Streaming Suspense Boundary'],
      },
      {
        title: '06. Node.js, REST APIs & Authentication Security',
        description: 'Implement Express/Node APIs, OAuth2/Firebase token verification, rate limiting, and validation.',
        stepOrder: 6,
        estimatedHours: 16,
        skillName: 'Node.js',
        resources: ['OWASP API Security Guide', 'Node.js Best Practices'],
        projects: ['Authenticated REST API with RBAC Middleware'],
        problems: ['Sliding Window Rate Limiter', 'Idempotent Webhook Consumer'],
      },
      {
        title: '07. PostgreSQL, Drizzle ORM & Production Deployment',
        description: 'Design relational schemas, foreign keys, indexes, migrations, and Dockerized deployments.',
        stepOrder: 7,
        estimatedHours: 20,
        skillName: 'PostgreSQL',
        resources: ['PostgreSQL Official Tutorial', 'Drizzle ORM Docs'],
        projects: ['Full-Stack Opportunity Engine with PostgreSQL & CI/CD'],
        problems: ['Composite Index Query Optimization', 'Zero-Downtime Schema Migration'],
      },
    ],
  },
  {
    title: 'Become an AI Engineer',
    slug: 'ai-engineer',
    category: 'AI/ML',
    estimatedWeeks: 14,
    difficulty: 'Intermediate',
    description: 'Go from Python data science foundations and PyTorch neural networks to LLM architectures, Retrieval-Augmented Generation (RAG), AI Agents, and production inference deployment.',
    steps: [
      {
        title: '01. Python, NumPy, Pandas & Linear Algebra Foundations',
        description: 'Master vectorized matrix computations, probability distributions, gradients, and data pipelines.',
        stepOrder: 1,
        estimatedHours: 16,
        skillName: 'Python',
        resources: ['CS229 Linear Algebra Review', 'NumPy & Pandas User Guide'],
        projects: ['Vectorized Gradient Descent & Feature Pipeline from Scratch'],
        problems: ['Matrix Broadcasting Benchmark', 'Cosine Similarity Engine'],
      },
      {
        title: '02. Classical Machine Learning & Model Evaluation',
        description: 'Train classification, regression, tree ensembles, cross-validation, and precision/recall curves.',
        stepOrder: 2,
        estimatedHours: 18,
        skillName: 'Machine Learning',
        resources: ['Scikit-Learn Documentation', 'Hands-On Machine Learning'],
        projects: ['Student Eligibility & Match Scoring Classifier'],
        problems: ['F1-Score & ROC-AUC Evaluator', 'K-Fold Cross Validation'],
      },
      {
        title: '03. Deep Learning & PyTorch Neural Architectures',
        description: 'Build backpropagation autograd engines, CNNs, attention mechanisms, and GPU training loops.',
        stepOrder: 3,
        estimatedHours: 22,
        skillName: 'PyTorch',
        resources: ['PyTorch Tutorials', 'Andrej Karpathy Neural Networks Zero to Hero'],
        projects: ['Transformer Decoder Trained on Custom Code Corpus'],
        problems: ['Multi-Head Self-Attention Layer', 'Mixed-Precision Training Loop'],
      },
      {
        title: '04. NLP, Embeddings & Semantic Vector Search',
        description: 'Tokenization (BPE), dense embeddings, hybrid BM25 + vector retrieval, and reranking.',
        stepOrder: 4,
        estimatedHours: 16,
        skillName: 'NLP',
        resources: ['Hugging Face NLP Course', 'Stanford CS224N Notes'],
        projects: ['Semantic Technical Resume & Opportunity Matcher'],
        problems: ['Reciprocal Rank Fusion (RRF)', 'Chunking Overlap Optimizer'],
      },
      {
        title: '05. Production RAG Systems & Structured LLM Outputs',
        description: 'Ground LLMs on live PostgreSQL data using JSON schema enforcement, citations, and evals.',
        stepOrder: 5,
        estimatedHours: 20,
        skillName: 'RAG',
        resources: ['Gemini API Structured Outputs Guide', 'RAG Triad Evaluation'],
        projects: ['Hallucination-Free Citation Assistant over Technical Docs'],
        problems: ['Faithfulness & Context Relevance Eval Suite'],
      },
      {
        title: '06. Multi-Step AI Agents, Tool Use & Deployment',
        description: 'Orchestrate function-calling agents, guardrails, streaming responses, and latency monitoring.',
        stepOrder: 6,
        estimatedHours: 20,
        skillName: 'LLMs',
        resources: ['Model Context Protocol (MCP) Spec', 'Building Effective Agents'],
        projects: ['Autonomous Career Preparation & Skill Gap Agent'],
        problems: ['Deterministic Tool-Call Retry Loop', 'Streaming Token Telemetry'],
      },
    ],
  },
  {
    title: 'Become a Competitive Programmer',
    slug: 'competitive-programmer',
    category: 'Competitive Programming',
    estimatedWeeks: 16,
    difficulty: 'Beginner to Advanced',
    description: 'Conquer algorithmic problem solving for Codeforces, LeetCode, ICPC, and FAANG technical interviews — from arrays and binary search to trees, graphs, and dynamic programming.',
    steps: [
      {
        title: '01. Time Complexity, Arrays, Two Pointers & Sliding Window',
        description: 'Analyze asymptotic bounds, prefix sums, monotonic queues, and invariant window techniques.',
        stepOrder: 1,
        estimatedHours: 15,
        skillName: 'Data Structures',
        resources: ['CP-Algorithms', 'CSES Problem Set — Introductory'],
        projects: ['Algorithmic Complexity Visualizer'],
        problems: ['Minimum Window Substring', 'Subarray Sum Equals K', 'Trapping Rain Water'],
      },
      {
        title: '02. Binary Search on Answer, Sorting & Greedy Proofs',
        description: 'Master monotonic predicate binary search, interval scheduling, and exchange arguments.',
        stepOrder: 2,
        estimatedHours: 16,
        skillName: 'Algorithms',
        resources: ['Competitive Programmer’s Handbook (Antti Laaksonen)'],
        projects: ['Contest Rating Predictor CLI'],
        problems: ['Aggressive Cows / Magnetic Force', 'Split Array Largest Sum', 'Merge Intervals'],
      },
      {
        title: '03. Recursion, Backtracking, Linked Lists & Stacks',
        description: 'Prune state-space search trees, monotonic stacks, and pointer manipulation.',
        stepOrder: 3,
        estimatedHours: 16,
        skillName: 'C++',
        resources: ['USACO Guide — Silver & Gold'],
        projects: ['Constraint Satisfaction Sudoku & N-Queens Solver'],
        problems: ['Largest Rectangle in Histogram', 'LRU Cache', 'Reverse Nodes in k-Group'],
      },
      {
        title: '04. Trees, Binary Lifting, Tries & Segment Trees',
        description: 'Lowest Common Ancestor (LCA), prefix trees, Fenwick trees, and lazy propagation.',
        stepOrder: 4,
        estimatedHours: 22,
        skillName: 'Data Structures',
        resources: ['Codeforces EDU — Segment Tree Course'],
        projects: ['High-Speed Range Query Engine in C++'],
        problems: ['Serialize & Deserialize Binary Tree', 'Word Search II', 'Range Sum Query Mutable'],
      },
      {
        title: '05. Graph Algorithms: BFS, DFS, Dijkstra, MST & Topological Sort',
        description: 'Shortest paths, Disjoint Set Union (DSU), bridges/articulation points, and network flow.',
        stepOrder: 5,
        estimatedHours: 24,
        skillName: 'Algorithms',
        resources: ['CSES Graph Algorithms Section'],
        projects: ['Multi-Criteria Route & Dependency Graph Analyzer'],
        problems: ['Course Schedule II', 'Cheapest Flights Within K Stops', 'Accounts Merge (DSU)'],
      },
      {
        title: '06. Dynamic Programming: Knapsack, Intervals, Trees & Bitmask DP',
        description: 'State transition formulation, memoization vs tabulation, and space optimization.',
        stepOrder: 6,
        estimatedHours: 28,
        skillName: 'Algorithms',
        resources: ['AtCoder Educational DP Contest (26 Problems)'],
        projects: ['Automated DP State Transition Graph Generator'],
        problems: ['Edit Distance', 'Burst Balloons', 'Longest Increasing Subsequence O(N log N)'],
      },
    ],
  },
  {
    title: 'Crack Google Summer of Code (GSoC) & Open Source',
    slug: 'gsoc-open-source',
    category: 'Open Source',
    estimatedWeeks: 10,
    difficulty: 'Beginner to Intermediate',
    description: 'Step-by-step playbook to select organizations, navigate large codebases, merge meaningful pull requests, and write an accepted GSoC / LFX / Outreachy engineering proposal.',
    steps: [
      {
        title: '01. Organization Selection & Codebase Architecture Mapping',
        description: 'Filter past GSoC/LFX organizations by your primary stack (Python, TypeScript, Go, Rust) and set up local dev builds.',
        stepOrder: 1,
        estimatedHours: 10,
        skillName: 'Git',
        resources: ['GSoC Contributor Guide', 'First Timers Only'],
        projects: ['Local Build & Architecture Diagram of Target Organization'],
        problems: ['Reproduce & Document 2 Open GitHub Issues'],
      },
      {
        title: '02. First Good-First-Issue & Test Suite Contribution',
        description: 'Write unit/integration tests, follow commit message conventions, and address maintainer review feedback.',
        stepOrder: 2,
        estimatedHours: 16,
        skillName: 'GitHub Actions',
        resources: ['How to Contribute to Open Source — GitHub Guide'],
        projects: ['Merge 3 Pull Requests in Target Upstream Repository'],
        problems: ['Fix Flaky CI Test', 'Add Type Annotations & Unit Coverage'],
      },
      {
        title: '03. Engineering RFC & Proposal Architecture Document',
        description: 'Draft a week-by-week technical specification with deliverables, API contracts, and risk mitigation.',
        stepOrder: 3,
        estimatedHours: 18,
        skillName: 'System Design',
        resources: ['Writing Great GSoC Proposals', 'CNCF Mentoring Templates'],
        projects: ['Complete GSoC Technical Proposal + PoC Prototype PR'],
        problems: ['Mentor Review Iteration & Benchmark Proof'],
      },
    ],
  },
  {
    title: 'Cloud Native, DevOps & Distributed Backend Systems',
    slug: 'cloud-native-devops',
    category: 'Cloud & DevOps',
    estimatedWeeks: 12,
    difficulty: 'Intermediate',
    description: 'Build production reliability skills with Linux internals, Docker containers, Kubernetes orchestration, CI/CD pipelines, Terraform IaC, and distributed observability.',
    steps: [
      {
        title: '01. Linux Systems, Networking & Shell Automation',
        description: 'Processes, file descriptors, TCP/IP, DNS, TLS handshakes, and Bash scripting.',
        stepOrder: 1,
        estimatedHours: 14,
        skillName: 'Linux',
        resources: ['Linux Journey', 'Beej’s Guide to Network Programming'],
        projects: ['Automated Log Analyzer & System Health Daemon'],
        problems: ['Zero-Downtime Reverse Proxy Config'],
      },
      {
        title: '02. Docker Containers & Multi-Stage CI/CD Pipelines',
        description: 'Write minimal distroless Dockerfiles, Docker Compose stacks, and GitHub Actions workflows.',
        stepOrder: 2,
        estimatedHours: 16,
        skillName: 'Docker',
        resources: ['Docker Official Docs', 'GitHub Actions Security Hardening'],
        projects: ['Automated Build, Lint, Test & Container Registry Pipeline'],
        problems: ['Reduce Container Image Size by 80%'],
      },
      {
        title: '03. Kubernetes Orchestration & Cloud Infrastructure',
        description: 'Pods, Deployments, Services, Ingress, Helm charts, and autoscaling on AWS/GCP.',
        stepOrder: 3,
        estimatedHours: 20,
        skillName: 'Kubernetes',
        resources: ['Kubernetes Up & Running', 'CNCF Cloud Native Trail Map'],
        projects: ['High-Availability Microservice Cluster with Prometheus Alerts'],
        problems: ['Rolling Update & Liveness Probe Recovery'],
      },
    ],
  },
];

let isSeeding = false;

export async function ensureSeeded() {
  if (isSeeding) return;
  try {
    const existingCount = await db.select({ value: count() }).from(opportunities);
    if ((existingCount[0]?.value || 0) >= 50) {
      return;
    }

    isSeeding = true;
    console.log('Seeding OpportunityOS PostgreSQL database...');

    // 1. Seed Skills
    for (const s of INITIAL_SKILLS) {
      await db
        .insert(skills)
        .values(s)
        .onConflictDoNothing({ target: skills.name });
    }
    const allSkills = await db.select().from(skills);
    const skillMap = new Map(allSkills.map((s) => [s.name.toLowerCase(), s.id]));

    // 2. Seed Organizations
    for (const org of INITIAL_ORGS) {
      await db
        .insert(organizations)
        .values(org)
        .onConflictDoNothing({ target: organizations.name });
    }
    const allOrgs = await db.select().from(organizations);
    const orgMap = new Map(allOrgs.map((o) => [o.name, o.id]));

    // 3. Seed 120 Opportunities + OpportunitySkills + EligibilityRules
    const templates = build120Opportunities();
    for (let i = 0; i < templates.length; i++) {
      const t = templates[i];
      const slug = `${t.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}-${i + 1}`;
      const orgId = orgMap.get(t.org) || allOrgs[0].id;
      const deadlineStr = futureDate(t.daysOffset);
      const startStr = futureDate(t.daysOffset + 21);
      const endStr = futureDate(t.daysOffset + 105);

      const inserted = await db
        .insert(opportunities)
        .values({
          title: t.title,
          slug,
          description: t.description,
          organizationId: orgId,
          category: t.category,
          location: t.location,
          workMode: t.workMode,
          remote: t.remote,
          paid: t.paid,
          stipend: t.stipend,
          salary: t.salary,
          duration: t.duration,
          deadline: deadlineStr,
          startDate: startStr,
          endDate: endStr,
          applicationUrl: t.url,
          source: 'Verified Partner Feed',
          sourceUrl: t.url,
          externalId: `opp-seed-${i + 1}`,
          difficulty: t.difficulty,
          beginnerFriendly: t.beginnerFriendly,
          status: 'Published',
          featured: t.featured,
          benefitsJson: JSON.stringify([
            `Direct mentorship from senior ${t.org} engineers`,
            t.stipend ? `Competitive compensation: ${t.stipend}` : 'Global recognition & verified certificate',
            'Fast-track consideration for full-time engineering roles',
            'Access to production cloud & compute infrastructure',
          ]),
          timelineJson: JSON.stringify([
            { stage: 'Applications Open', date: futureDate(-10) },
            { stage: 'Application Deadline', date: deadlineStr },
            { stage: 'Technical Evaluation & Shortlist', date: futureDate(t.daysOffset + 7) },
            { stage: 'Program Kickoff', date: startStr },
          ]),
          processJson: JSON.stringify([
            '1. Complete your OpportunityOS Developer Profile & verify eligibility',
            '2. Submit online application with updated resume and GitHub profile link',
            '3. Complete online technical assessment or open-source starter task',
            '4. Final technical & values interview with the team',
          ]),
          viewsCount: 140 + ((i * 37) % 820),
          appliesCount: 24 + ((i * 13) % 190),
          isSeed: true,
        })
        .onConflictDoNothing({ target: opportunities.slug })
        .returning();

      if (inserted.length > 0) {
        const oppId = inserted[0].id;
        for (const skName of t.skills) {
          const skId = skillMap.get(skName.toLowerCase());
          if (skId) {
            await db.insert(opportunitySkills).values({
              opportunityId: oppId,
              skillId: skId,
              required: true,
              importance: 5,
            });
          }
        }

        const rulesToInsert = [
          { opportunityId: oppId, ruleType: 'DEGREE', ruleValue: t.degree },
          { opportunityId: oppId, ruleType: 'GRAD_YEAR_MIN', ruleValue: String(t.gradMin) },
          { opportunityId: oppId, ruleType: 'GRAD_YEAR_MAX', ruleValue: String(t.gradMax) },
          { opportunityId: oppId, ruleType: 'LOCATION', ruleValue: t.remote ? 'Remote / Global' : t.location },
        ];
        if (t.minCgpa) {
          rulesToInsert.push({ opportunityId: oppId, ruleType: 'MIN_CGPA', ruleValue: t.minCgpa });
        }
        await db.insert(eligibilityRules).values(rulesToInsert);
      }
    }

    // 4. Seed Roadmaps & Steps
    for (const rm of INITIAL_ROADMAPS) {
      const insertedRm = await db
        .insert(roadmaps)
        .values({
          title: rm.title,
          slug: rm.slug,
          description: rm.description,
          category: rm.category,
          estimatedWeeks: rm.estimatedWeeks,
          difficulty: rm.difficulty,
        })
        .onConflictDoNothing({ target: roadmaps.slug })
        .returning();

      if (insertedRm.length > 0) {
        const rmId = insertedRm[0].id;
        for (const step of rm.steps) {
          await db.insert(roadmapSteps).values({
            roadmapId: rmId,
            title: step.title,
            description: step.description,
            stepOrder: step.stepOrder,
            estimatedHours: step.estimatedHours,
            skillName: step.skillName,
            resourcesJson: JSON.stringify(step.resources),
            projectsJson: JSON.stringify(step.projects),
            problemsJson: JSON.stringify(step.problems),
          });
        }
      }
    }

    // 5. Seed Calendar Events
    const existingEvents = await db.select({ value: count() }).from(events);
    if ((existingEvents[0]?.value || 0) === 0) {
      await db.insert(events).values([
        {
          title: 'GSoC 2027 Organization & Proposal Workshop',
          description: 'Live maintainer Q&A on structuring winning Google Summer of Code proposals.',
          category: 'Open Source',
          startDate: futureDate(3),
          endDate: futureDate(3),
          location: 'Online Livestream',
          registrationUrl: 'https://summerofcode.withgoogle.com',
        },
        {
          title: 'Codeforces Global Round 32',
          description: '2.5-hour rated algorithmic programming competition.',
          category: 'Coding Contest',
          startDate: futureDate(2),
          endDate: futureDate(2),
          location: 'Codeforces Arena',
          registrationUrl: 'https://codeforces.com/contests',
        },
        {
          title: 'MLH Global Hack Week: AI & Cloud Kickoff',
          description: '48-hour global student buildathon with live workshops.',
          category: 'Hackathon',
          startDate: futureDate(5),
          endDate: futureDate(7),
          location: 'Global Online',
          registrationUrl: 'https://mlh.io',
        },
        {
          title: 'Google SWE Summer Internship Application Deadline',
          description: 'Final submission window for Summer 2027 SWE Intern cohort.',
          category: 'Internship',
          startDate: futureDate(12),
          endDate: futureDate(12),
          location: 'Bengaluru / Hyderabad',
          registrationUrl: 'https://careers.google.com',
        },
      ]);
    }

    // 6. Seed Owner/Admin & Leaderboard Peers
    const peerUsers = [
      {
        uid: 'owner-kartik-admin',
        name: 'Kartik Choudhary',
        email: 'kartikchoudhary18122005@gmail.com',
        username: 'kartikchoudhary',
        role: 'ADMIN',
        avatar: '',
        points: 1650,
        streakDays: 30,
      },
      {
        uid: 'peer-priya-sharma',
        name: 'Priya Sharma',
        email: 'priya.sharma@iitd.ac.in',
        username: 'priyasharma',
        role: 'STUDENT',
        avatar: '/src/assets/images/avatar_student_priya_1791094608772.jpg',
        points: 1480,
        streakDays: 24,
      },
      {
        uid: 'peer-arjun-mehta',
        name: 'Arjun Mehta',
        email: 'arjun.mehta@bits-pilani.ac.in',
        username: 'arjunmehta',
        role: 'STUDENT',
        avatar: '/src/assets/images/avatar_student_arjun_1791094619652.jpg',
        points: 1365,
        streakDays: 19,
      },
      {
        uid: 'peer-elena-rostova',
        name: 'Elena Rostova',
        email: 'elena.r@eth.ch',
        username: 'elenarostova',
        role: 'STUDENT',
        avatar: '/src/assets/images/avatar_student_elena_1791094631159.jpg',
        points: 1290,
        streakDays: 16,
      },
      {
        uid: 'peer-rohan-kulkarni',
        name: 'Rohan Kulkarni',
        email: 'rohan.k@nitk.edu.in',
        username: 'rohankulkarni',
        role: 'STUDENT',
        avatar: '',
        points: 1150,
        streakDays: 12,
      },
    ];

    for (const p of peerUsers) {
      const insertedPeer = await db
        .insert(users)
        .values(p)
        .onConflictDoNothing({ target: users.uid })
        .returning();
      if (insertedPeer.length > 0) {
        await db
          .insert(studentProfiles)
          .values({
            userId: insertedPeer[0].id,
            college: p.email.includes('iitd')
              ? 'IIT Delhi'
              : p.email.includes('bits')
              ? 'BITS Pilani'
              : p.email.includes('eth')
              ? 'ETH Zurich'
              : 'NIT Karnataka',
            degree: 'B.Tech',
            branch: 'Computer Science',
            graduationYear: 2027,
            cgpa: '9.1',
            onboardingCompleted: true,
          })
          .onConflictDoNothing({ target: studentProfiles.userId });
      }
    }

    console.log('OpportunityOS database seed complete.');
  } catch (error) {
    console.error('Error during database seed:', error);
  } finally {
    isSeeding = false;
  }
}

export const OWNER_ADMIN_EMAIL = 'kartikchoudhary18122005@gmail.com';

export async function ensureUserInitialized(
  uid: string,
  email: string,
  displayName?: string
) {
  await ensureSeeded();

  const cleanEmail = (email || 'priya.sharma@iitd.ac.in').trim().toLowerCase();
  const isOwnerEmail = cleanEmail === OWNER_ADMIN_EMAIL;
  const defaultName =
    displayName ||
    (isOwnerEmail
      ? 'Kartik Choudhary'
      : (cleanEmail.split('@')[0] || 'Student Developer')
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()));

  const baseUsername =
    cleanEmail
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') || 'student';

  const resumePrefix = defaultName.replace(/\s+/g, '_');

  const allMatchingUsers = await db.select().from(users);
  let userRecord =
    allMatchingUsers.find((u) => u.uid === uid) ||
    allMatchingUsers.find((u) => u.email.toLowerCase() === cleanEmail);

  if (userRecord && isOwnerEmail && userRecord.role !== 'ADMIN') {
    const promoted = await db
      .update(users)
      .set({ role: 'ADMIN', name: userRecord.name || 'Kartik Choudhary', updatedAt: new Date() })
      .where(eq(users.id, userRecord.id))
      .returning();
    userRecord = promoted[0] || userRecord;
  } else if (userRecord && !isOwnerEmail && userRecord.role === 'ADMIN') {
    // Non-owner accounts must never hold ADMIN role
    const demoted = await db
      .update(users)
      .set({ role: 'STUDENT', updatedAt: new Date() })
      .where(eq(users.id, userRecord.id))
      .returning();
    userRecord = demoted[0] || userRecord;
  }

  if (!userRecord) {
    const suffix = Math.floor(100 + Math.random() * 899);
    const uname = isOwnerEmail
      ? `kartikchoudhary`
      : `${baseUsername}${suffix}`;
    const role = isOwnerEmail
      ? 'ADMIN'
      : uid === 'demo-org-uid'
      ? 'ORGANIZATION'
      : 'STUDENT';

    const inserted = await db
      .insert(users)
      .values({
        uid,
        name: defaultName,
        email: cleanEmail,
        username: uname,
        role,
        points: isOwnerEmail ? 1650 : 1240,
        streakDays: isOwnerEmail ? 30 : 14,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email: cleanEmail },
      })
      .returning();
    userRecord = inserted[0];

    // Create default student profile
    await db
      .insert(studentProfiles)
      .values({
        userId: userRecord.id,
        country: 'India',
        state: 'Maharashtra',
        city: 'Mumbai',
        college: 'Indian Institute of Technology',
        degree: 'B.Tech',
        branch: 'Computer Science & Engineering',
        graduationYear: 2027,
        currentYear: 3,
        cgpa: '8.9',
        backlogs: 0,
        bio: '3rd-year B.Tech CSE student building distributed backend systems, full-stack TypeScript apps, and applied AI pipelines.',
        interests: JSON.stringify([
          'Web Development',
          'AI/ML',
          'Open Source',
          'Competitive Programming',
          'Cloud',
        ]),
        careerGoals: JSON.stringify([
          'Internship',
          'Open source',
          'Full-time job',
          'Research',
        ]),
        preferredWorkModes: JSON.stringify(['Remote', 'Hybrid', 'On-site']),
        preferredLocations: JSON.stringify(['India', 'International']),
        experienceLevel: 'Intermediate',
        onboardingCompleted: true,
        resumeSkills: JSON.stringify([
          'Python',
          'TypeScript',
          'JavaScript',
          'React',
          'Next.js',
          'Node.js',
          'PostgreSQL',
          'Docker',
          'Git',
          'Data Structures',
          'Algorithms',
        ]),
        projectsJson: JSON.stringify([
          {
            title: 'Chronos Distributed Task Scheduler',
            stack: 'Go · PostgreSQL · Redis · Docker',
            description: 'High-throughput job queue with dead-letter retries and real-time latency telemetry.',
            link: 'https://github.com/torvalds',
          },
          {
            title: 'Semantic Scholar RAG Workbench',
            stack: 'Python · PyTorch · Next.js · TypeScript',
            description: 'Hybrid BM25 + dense vector citation engine over 50,000 computer science papers.',
            link: 'https://github.com/torvalds',
          },
        ]),
        achievementsJson: JSON.stringify([
          'Finalist — Smart India Hackathon (Top 1% among 15,000+ teams)',
          'Knight Badge on LeetCode (1845 Rating · 410+ Problems Solved)',
          'Merged 6 Pull Requests to CNCF & Next.js Open Source Repositories',
        ]),
        badgesJson: JSON.stringify([
          'First Application',
          'Open Source Contributor',
          'Problem Solver',
          'Consistent Learner',
        ]),
      })
      .onConflictDoNothing({ target: studentProfiles.userId });

    // Seed initial user skills
    const defaultSkillNames = [
      'Python',
      'TypeScript',
      'JavaScript',
      'React',
      'Next.js',
      'Node.js',
      'PostgreSQL',
      'SQL',
      'Docker',
      'Git',
      'C++',
      'Data Structures',
      'Algorithms',
      'REST APIs',
      'Tailwind CSS',
    ];
    const allSkills = await db.select().from(skills);
    for (const skName of defaultSkillNames) {
      const found = allSkills.find((s) => s.name.toLowerCase() === skName.toLowerCase());
      if (found) {
        await db.insert(userSkills).values({
          userId: userRecord.id,
          skillId: found.id,
          proficiency: ['Python', 'TypeScript', 'React', 'Data Structures'].includes(skName)
            ? 'Advanced'
            : 'Intermediate',
        });
      }
    }

    // Seed initial coding profiles
    await db.insert(codingProfiles).values([
      {
        userId: userRecord.id,
        platform: 'GitHub',
        username: `${baseUsername}-dev`,
        rating: 0,
        maxRating: 0,
        rankTitle: 'Open Source Contributor',
        problemsSolved: 0,
        repositories: 26,
        followers: 64,
        contributions: 748,
        stars: 112,
        topLanguagesJson: JSON.stringify(['TypeScript', 'Python', 'Go', 'C++']),
        badgesJson: JSON.stringify(['Pull Shark x2', 'Arctic Code Vault', 'Open Source Maintainer']),
        extraDataJson: JSON.stringify({
          following: 38,
          pullRequests: 42,
          issuesClosed: 29,
          topRepos: [
            {
              name: 'chronos-distributed-queue',
              stars: 54,
              language: 'Go',
              description: 'Fault-tolerant distributed task scheduler backed by PostgreSQL & Redis',
              url: 'https://github.com',
            },
            {
              name: 'semantic-rag-engine',
              stars: 37,
              language: 'Python',
              description: 'Citation-grounded LLM retrieval pipeline for technical documentation',
              url: 'https://github.com',
            },
            {
              name: 'nextjs-edge-telemetry',
              stars: 21,
              language: 'TypeScript',
              description: 'Lightweight OpenTelemetry SDK for Next.js App Router',
              url: 'https://github.com',
            },
          ],
        }),
        profileUrl: 'https://github.com',
        isLiveApi: false,
      },
      {
        userId: userRecord.id,
        platform: 'LeetCode',
        username: baseUsername,
        rating: 1845,
        maxRating: 1890,
        rankTitle: 'Knight (Top 6.2%)',
        problemsSolved: 412,
        easySolved: 148,
        mediumSolved: 214,
        hardSolved: 50,
        topLanguagesJson: JSON.stringify(['C++', 'Python', 'TypeScript']),
        badgesJson: JSON.stringify(['Knight Badge', '100 Days Badge 2026']),
        extraDataJson: JSON.stringify({ globalRanking: '18,420 / 540,000', contestsAttended: 22 }),
        profileUrl: 'https://leetcode.com',
        isLiveApi: false,
      },
      {
        userId: userRecord.id,
        platform: 'Codeforces',
        username: `${baseUsername}_cp`,
        rating: 1542,
        maxRating: 1610,
        rankTitle: 'EXPERT',
        problemsSolved: 318,
        easySolved: 140,
        mediumSolved: 128,
        hardSolved: 50,
        topLanguagesJson: JSON.stringify(['C++', 'Python']),
        badgesJson: JSON.stringify(['Expert Tier', 'Div. 2 Top 400']),
        extraDataJson: JSON.stringify({ contestsParticipated: 29 }),
        profileUrl: 'https://codeforces.com',
        isLiveApi: false,
      },
      {
        userId: userRecord.id,
        platform: 'HackerRank',
        username: baseUsername,
        rating: 1920,
        maxRating: 1920,
        rankTitle: '6-Star Gold',
        problemsSolved: 195,
        stars: 5,
        topLanguagesJson: JSON.stringify(['Python', 'SQL', 'Java']),
        badgesJson: JSON.stringify(['Problem Solving (Advanced)', 'SQL (Advanced)', 'Rest API (Intermediate)']),
        extraDataJson: JSON.stringify({ certifications: ['Problem Solving (Intermediate)', 'SQL (Advanced)'] }),
        profileUrl: 'https://hackerrank.com',
        isLiveApi: false,
      },
      {
        userId: userRecord.id,
        platform: 'CodeChef',
        username: `${baseUsername}_cc`,
        rating: 1864,
        maxRating: 1912,
        rankTitle: '4-Star (★★★★)',
        problemsSolved: 240,
        stars: 4,
        topLanguagesJson: JSON.stringify(['C++', 'Python']),
        badgesJson: JSON.stringify(['4-Star Coder', 'Starters Div 2 Winner']),
        extraDataJson: JSON.stringify({ contestsParticipated: 31 }),
        profileUrl: 'https://codechef.com',
        isLiveApi: false,
      },
    ]);

    // Seed initial applications & saved opportunities
    const allOpps = await db.select().from(opportunities);
    if (allOpps.length >= 6) {
      await db.insert(savedOpportunities).values([
        { userId: userRecord.id, opportunityId: allOpps[0].id },
        { userId: userRecord.id, opportunityId: allOpps[2].id },
        { userId: userRecord.id, opportunityId: allOpps[3].id },
        { userId: userRecord.id, opportunityId: allOpps[4].id },
      ]);

      await db.insert(applications).values([
        {
          userId: userRecord.id,
          opportunityId: allOpps[0].id,
          status: 'Applied',
          appliedAt: futureDate(-3),
          notes: 'Submitted with referral from university alum on Cloud Core team. Online assessment expected next week.',
          interviewDate: futureDate(9),
          resumeUsed: `${resumePrefix}_SWE_Intern_2027.pdf`,
          referral: 'Siddharth R. (Senior SWE)',
          nextAction: 'Complete 5 Google tagged Graph & DP problems',
        },
        {
          userId: userRecord.id,
          opportunityId: allOpps[2].id,
          status: 'Interview',
          appliedAt: futureDate(-2),
          notes: 'Cleared online coding round (2/2 solved in 38 mins). Technical round scheduled.',
          interviewDate: futureDate(4),
          resumeUsed: `${resumePrefix}_SWE_Intern_2027.pdf`,
          referral: 'Campus Placement Cell',
          nextAction: 'Review Azure distributed caching & system design fundamentals',
        },
        {
          userId: userRecord.id,
          opportunityId: allOpps[3].id,
          status: 'Preparing',
          appliedAt: futureDate(-8),
          notes: 'Tailoring resume to highlight Go and PostgreSQL idempotency project.',
          interviewDate: '',
          resumeUsed: `${resumePrefix}_Backend_Resume.pdf`,
          referral: '',
          nextAction: 'Submit application before deadline in 9 days',
        },
        {
          userId: userRecord.id,
          opportunityId: allOpps[4].id,
          status: 'Assessment',
          appliedAt: futureDate(-13),
          notes: 'Received take-home Next.js App Router performance optimization challenge.',
          interviewDate: futureDate(6),
          resumeUsed: `${resumePrefix}_FullStack_Resume.pdf`,
          referral: 'Open Source PR #14820',
          nextAction: 'Submit Next.js Edge caching take-home before Friday',
        },
        {
          userId: userRecord.id,
          opportunityId: allOpps[5]?.id || allOpps[1].id,
          status: 'Selected',
          appliedAt: futureDate(-19),
          notes: 'Completed technical & research evaluation rounds. Received fellowship offer!',
          interviewDate: futureDate(-9),
          resumeUsed: `${resumePrefix}_AI_Research_Resume.pdf`,
          referral: 'Open Source Maintainer',
          nextAction: 'Review onboarding paperwork',
        },
        {
          userId: userRecord.id,
          opportunityId: allOpps[6]?.id || allOpps[0].id,
          status: 'Interview',
          appliedAt: futureDate(-27),
          notes: 'Passed system architecture screen; final team match interview completed.',
          interviewDate: futureDate(5),
          resumeUsed: `${resumePrefix}_FullStack_Resume.pdf`,
          referral: '',
          nextAction: 'Follow up with university recruiter',
        },
        {
          userId: userRecord.id,
          opportunityId: allOpps[7]?.id || allOpps[2].id,
          status: 'Applied',
          appliedAt: futureDate(-38),
          notes: 'Submitted backend systems portfolio and Go benchmarks.',
          interviewDate: '',
          resumeUsed: `${resumePrefix}_Backend_Resume.pdf`,
          referral: 'Alumni Network',
          nextAction: 'Practice concurrency & PostgreSQL indexing questions',
        },
        {
          userId: userRecord.id,
          opportunityId: allOpps[8]?.id || allOpps[3].id,
          status: 'Assessment',
          appliedAt: futureDate(-46),
          notes: 'Completed 90-minute HackerRank C++ and PyTorch assessment.',
          interviewDate: '',
          resumeUsed: `${resumePrefix}_AI_Research_Resume.pdf`,
          referral: '',
          nextAction: 'Await technical interview scheduling',
        },
        {
          userId: userRecord.id,
          opportunityId: allOpps[9]?.id || allOpps[4].id,
          status: 'Saved',
          appliedAt: futureDate(-57),
          notes: 'Bookmarked early for summer analyst cohort preparation.',
          interviewDate: '',
          resumeUsed: `${resumePrefix}_SWE_Intern_2027.pdf`,
          referral: '',
          nextAction: 'Complete competitive programming roadmap module',
        },
        {
          userId: userRecord.id,
          opportunityId: allOpps[10]?.id || allOpps[1].id,
          status: 'Applied',
          appliedAt: futureDate(-2),
          notes: 'Submitted Creative Cloud WebGL & TypeScript systems portfolio.',
          interviewDate: '',
          resumeUsed: `${resumePrefix}_FullStack_Resume.pdf`,
          referral: 'Research Lab',
          nextAction: 'Prepare frontend systems architecture examples',
        },
        {
          userId: userRecord.id,
          opportunityId: allOpps[11]?.id || allOpps[2].id,
          status: 'Preparing',
          appliedAt: futureDate(-1),
          notes: 'Reviewing Linux kernel internals and distributed systems troubleshooting.',
          interviewDate: '',
          resumeUsed: `${resumePrefix}_Backend_Resume.pdf`,
          referral: '',
          nextAction: 'Finish Production Engineering prep guide',
        },
        {
          userId: userRecord.id,
          opportunityId: allOpps[12]?.id || allOpps[3].id,
          status: 'Interview',
          appliedAt: futureDate(0),
          notes: 'Cleared distributed inference coding screen. Moving to applied AI systems round.',
          interviewDate: futureDate(7),
          resumeUsed: `${resumePrefix}_AI_Research_Resume.pdf`,
          referral: 'GitHub Open Source Maintainer',
          nextAction: 'Prepare RAG latency benchmark walkthrough',
        },
      ]);

      // Seed initial progress on the first roadmap
      const allSteps = await db.select().from(roadmapSteps);
      if (allSteps.length >= 5) {
        await db.insert(userRoadmapProgress).values([
          { userId: userRecord.id, roadmapStepId: allSteps[0].id, status: 'Completed', completedAt: new Date() },
          { userId: userRecord.id, roadmapStepId: allSteps[1].id, status: 'Completed', completedAt: new Date() },
          { userId: userRecord.id, roadmapStepId: allSteps[2].id, status: 'Completed', completedAt: new Date() },
          { userId: userRecord.id, roadmapStepId: allSteps[3].id, status: 'In progress' },
        ]);
      }

      // Seed initial notifications
      await db.insert(notifications).values([
        {
          userId: userRecord.id,
          title: '96% Match: Google SWE Summer Internship 2027',
          message: 'Your TypeScript, React, and Python skills plus 2027 graduation cohort satisfy 100% of requirements. 12 days remaining.',
          type: 'MATCH',
          opportunityId: allOpps[0].id,
          read: false,
        },
        {
          userId: userRecord.id,
          title: 'Urgent Deadline: Atlassian Full-Stack Intern (3 days left)',
          message: 'Applications close in 3 days. You are 100% eligible based on your B.Tech CSE 2027 profile.',
          type: 'DEADLINE',
          opportunityId: allOpps[6]?.id || allOpps[0].id,
          read: false,
        },
        {
          userId: userRecord.id,
          title: 'Coding Contest Reminder: Codeforces Global Round 32',
          message: 'Rated Div. 1 + Div. 2 contest starts in 48 hours. Verify registration on Codeforces.',
          type: 'CONTEST',
          read: false,
        },
        {
          userId: userRecord.id,
          title: 'Roadmap Milestone: 3/7 Full-Stack Steps Completed',
          message: 'You completed Git & TypeScript Foundations (+60 XP). Next up: React 19 & State Architecture.',
          type: 'ROADMAP',
          read: true,
        },
      ]);
    }
  } else {
    // Ensure existing users also have 3-month historical application records for trend analytics
    const existingApps = await db
      .select()
      .from(applications)
      .where(eq(applications.userId, userRecord.id));
    if (existingApps.length > 0 && existingApps.length <= 4) {
      const allOpps = await db.select().from(opportunities);
      if (allOpps.length >= 10) {
        await db.insert(applications).values([
          {
            userId: userRecord.id,
            opportunityId: allOpps[5].id,
            status: 'Selected',
            appliedAt: futureDate(-34),
            notes: 'Completed technical & research evaluation rounds. Received fellowship offer!',
            interviewDate: futureDate(-20),
            resumeUsed: `${resumePrefix}_AI_Research_Resume.pdf`,
            referral: 'Open Source Maintainer',
            nextAction: 'Review onboarding paperwork',
          },
          {
            userId: userRecord.id,
            opportunityId: allOpps[6].id,
            status: 'Interview',
            appliedAt: futureDate(-41),
            notes: 'Passed system architecture screen; final team match interview completed.',
            interviewDate: futureDate(-25),
            resumeUsed: `${resumePrefix}_FullStack_Resume.pdf`,
            referral: '',
            nextAction: 'Follow up with university recruiter',
          },
          {
            userId: userRecord.id,
            opportunityId: allOpps[7].id,
            status: 'Applied',
            appliedAt: futureDate(-49),
            notes: 'Submitted backend systems portfolio and Go benchmarks.',
            interviewDate: '',
            resumeUsed: `${resumePrefix}_Backend_Resume.pdf`,
            referral: 'Alumni Network',
            nextAction: 'Practice concurrency & PostgreSQL indexing questions',
          },
          {
            userId: userRecord.id,
            opportunityId: allOpps[8].id,
            status: 'Assessment',
            appliedAt: futureDate(-63),
            notes: 'Completed 90-minute HackerRank C++ and PyTorch assessment.',
            interviewDate: '',
            resumeUsed: `${resumePrefix}_AI_Research_Resume.pdf`,
            referral: '',
            nextAction: 'Await technical interview scheduling',
          },
          {
            userId: userRecord.id,
            opportunityId: allOpps[9].id,
            status: 'Saved',
            appliedAt: futureDate(-74),
            notes: 'Bookmarked early for summer analyst cohort preparation.',
            interviewDate: '',
            resumeUsed: `${resumePrefix}_SWE_Intern_2027.pdf`,
            referral: '',
            nextAction: 'Complete competitive programming roadmap module',
          },
        ]);
      }
    }
  }

  return userRecord;
}
