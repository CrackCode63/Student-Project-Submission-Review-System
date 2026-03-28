import {
  ClipboardCheck,
  FolderKanban,
  LayoutDashboard,
  MessageSquareText,
  PenSquare,
  GraduationCap,
  Users,
  ClipboardList,
  BadgeCheck,
  BellRing,
  FileClock,
} from 'lucide-react';

export const THEME_STORAGE_KEY = 'student-project-theme';
export const SESSION_STORAGE_KEY = 'student-project-session';

export const studentNavigation = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/student' },
  { label: 'Team', icon: Users, to: '/student/team' },
  { label: 'Submit Project', icon: PenSquare, to: '/student/submit' },
  { label: 'My Submissions', icon: FolderKanban, to: '/student/submissions' },
  { label: 'Feedback', icon: MessageSquareText, to: '/student/feedback' },
];

export const mentorNavigation = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/mentor' },
  { label: 'Review Projects', icon: ClipboardCheck, to: '/mentor/reviews' },
  { label: 'Student List', icon: GraduationCap, to: '/mentor/students' },
  { label: 'Marks', icon: ClipboardList, to: '/mentor/marks' },
];

export const adminNavigation = [{ label: 'Dashboard', icon: LayoutDashboard, to: '/admin' }];

export const landingStats = [
  { label: 'Projects Reviewed', value: '2,400+' },
  { label: 'Mentor Teams', value: '180+' },
  { label: 'Student Satisfaction', value: '96%' },
];

export const studentStats = [
  {
    title: 'Total Projects',
    value: '06',
    trend: '+2 this month',
    icon: FolderKanban,
    accent: 'from-primary to-secondary',
  },
  {
    title: 'Pending Reviews',
    value: '02',
    trend: 'Mentor feedback in progress',
    icon: FileClock,
    accent: 'from-warning to-orange-400',
  },
  {
    title: 'Approved Projects',
    value: '04',
    trend: '67% approval rate',
    icon: BadgeCheck,
    accent: 'from-success to-emerald-400',
  },
];

export const mentorStats = [
  {
    title: 'Pending Reviews',
    value: '14',
    trend: '5 due today',
    icon: ClipboardCheck,
    accent: 'from-warning to-orange-400',
  },
  {
    title: 'Approved Projects',
    value: '39',
    trend: '+6 this week',
    icon: BadgeCheck,
    accent: 'from-success to-emerald-400',
  },
  {
    title: 'Student Teams',
    value: '27',
    trend: 'Across 4 active cohorts',
    icon: Users,
    accent: 'from-primary to-accent',
  },
];

export const studentActivity = [
  {
    title: 'Version 3.1 uploaded for Smart Campus App',
    meta: '10 minutes ago',
    status: 'Pending',
  },
  {
    title: 'Mentor approved UI refinement checklist',
    meta: 'Yesterday',
    status: 'Approved',
  },
  {
    title: 'Feedback received on API integration report',
    meta: '2 days ago',
    status: 'Changes Required',
  },
];

export const mentorActivity = [
  {
    title: 'Reviewed Team Nova submission',
    meta: '12 minutes ago',
    status: 'Approved',
  },
  {
    title: 'Flagged analytics dashboard for revisions',
    meta: '1 hour ago',
    status: 'Changes Required',
  },
  {
    title: 'New submission received from Team Pixel',
    meta: '2 hours ago',
    status: 'Pending',
  },
];

export const notifications = {
  student: [
    { title: 'Mentor commented on your latest submission', time: '8m ago' },
    { title: 'Demo review scheduled for Friday, 3:00 PM', time: '1h ago' },
    { title: 'Version tags were updated successfully', time: 'Yesterday' },
  ],
  mentor: [
    { title: '3 new projects need review before tonight', time: '12m ago' },
    { title: 'Marks sheet published for Section B', time: '2h ago' },
    { title: 'Weekly mentor sync starts tomorrow', time: 'Yesterday' },
  ],
};

export const teamMembers = [
  {
    name: 'Aarav Mehta',
    role: 'Frontend Lead',
    status: 'Active',
    avatar: 'AM',
    accent: 'from-primary/20 to-accent/20',
  },
  {
    name: 'Riya Sharma',
    role: 'Backend Engineer',
    status: 'Available',
    avatar: 'RS',
    accent: 'from-secondary/20 to-primary/10',
  },
  {
    name: 'Kunal Patel',
    role: 'Product Strategist',
    status: 'In Review',
    avatar: 'KP',
    accent: 'from-accent/20 to-sky-200/20',
  },
];

export const teamMilestones = [
  { label: 'Design System', progress: 92 },
  { label: 'Core Modules', progress: 74 },
  { label: 'Demo Preparation', progress: 58 },
];

export const submissionHistory = [
  {
    title: 'Smart Campus App',
    version: 'v3.1',
    status: 'Pending',
    submittedAt: 'Mar 19, 2026',
    tag: 'UI Refresh',
  },
  {
    title: 'Attendance Intelligence',
    version: 'v2.4',
    status: 'Approved',
    submittedAt: 'Mar 12, 2026',
    tag: 'Analytics',
  },
  {
    title: 'Collaborative Notes Hub',
    version: 'v1.9',
    status: 'Changes Required',
    submittedAt: 'Mar 08, 2026',
    tag: 'Backend Sync',
  },
];

export const feedbackItems = [
  {
    title: 'Smart Campus App',
    mentor: 'Dr. Priya Nair',
    comment:
      'Excellent overall polish. Tighten the empty states and add a clearer handoff for the QR check-in flow.',
    status: 'Pending',
  },
  {
    title: 'Attendance Intelligence',
    mentor: 'Dr. Sameer Khan',
    comment:
      'Strong analytics story and thoughtful edge-case handling. Approved for final showcase.',
    status: 'Approved',
  },
  {
    title: 'Collaborative Notes Hub',
    mentor: 'Prof. Alisha Joseph',
    comment:
      'Realtime sync is promising, but conflict resolution and error recovery need another iteration.',
    status: 'Changes Required',
  },
];

export const reviewQueue = [
  {
    team: 'Team Nova',
    project: 'Smart Campus App',
    submittedAt: 'Today, 5:40 PM',
    priority: 'High',
    status: 'Pending',
  },
  {
    team: 'Team Pixel',
    project: 'Placement Insights Portal',
    submittedAt: 'Today, 3:10 PM',
    priority: 'Medium',
    status: 'Pending',
  },
  {
    team: 'Team Quartz',
    project: 'Hostel Automation Suite',
    submittedAt: 'Yesterday',
    priority: 'Normal',
    status: 'Changes Required',
  },
];

export const studentRoster = [
  {
    name: 'Team Nova',
    members: '4 Students',
    focus: 'Campus Experience',
    score: '92%',
    status: 'On Track',
  },
  {
    name: 'Team Pixel',
    members: '3 Students',
    focus: 'Data Platform',
    score: '87%',
    status: 'Review Due',
  },
  {
    name: 'Team Quartz',
    members: '5 Students',
    focus: 'Automation',
    score: '81%',
    status: 'Needs Support',
  },
  {
    name: 'Team Orbit',
    members: '4 Students',
    focus: 'AI Assistant',
    score: '95%',
    status: 'Excellent',
  },
];

export const marksBoard = [
  {
    team: 'Team Nova',
    innovation: 24,
    execution: 28,
    presentation: 18,
    total: 70,
  },
  {
    team: 'Team Pixel',
    innovation: 22,
    execution: 25,
    presentation: 17,
    total: 64,
  },
  {
    team: 'Team Quartz',
    innovation: 20,
    execution: 23,
    presentation: 15,
    total: 58,
  },
  {
    team: 'Team Orbit',
    innovation: 26,
    execution: 29,
    presentation: 19,
    total: 74,
  },
];

export const landingFeatures = [
  {
    title: 'Submission Intelligence',
    description:
      'Track versions, milestones, and approvals with a polished workflow built for project-based learning.',
    icon: FolderKanban,
  },
  {
    title: 'Mentor Review Console',
    description:
      'Prioritize pending work, review faster, and give structured feedback without losing context.',
    icon: ClipboardCheck,
  },
  {
    title: 'Live Coordination',
    description:
      'Keep teams, mentors, and progress aligned through activity streams, marks, and review-ready dashboards.',
    icon: BellRing,
  },
];
