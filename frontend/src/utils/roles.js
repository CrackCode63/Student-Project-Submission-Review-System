import {
  BadgeCheck,
  ClipboardCheck,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  MessageSquareText,
  PenSquare,
  ShieldCheck,
  UserRoundCog,
  Users,
} from 'lucide-react';

export const USER_ROLES = {
  student: 'student',
  mentor: 'mentor',
  admin: 'admin',
};

export const ROLE_LABELS = {
  student: 'Student',
  mentor: 'Mentor',
  admin: 'Admin',
};

export function getHomePathForRole(role) {
  if (role === USER_ROLES.mentor) {
    return '/mentor';
  }

  if (role === USER_ROLES.admin) {
    return '/admin';
  }

  return '/student';
}

export function getProfilePathForRole(role) {
  if (role === USER_ROLES.mentor) {
    return '/mentor/profile';
  }

  if (role === USER_ROLES.admin) {
    return '/admin/profile';
  }

  return '/student/profile';
}

export function getNavigationForRole(role) {
  if (role === USER_ROLES.mentor) {
    return [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/mentor' },
      { label: 'Students', icon: Users, to: '/mentor/students' },
      { label: 'Review Queue', icon: ClipboardCheck, to: '/mentor/reviews' },
      { label: 'Verification', icon: ShieldCheck, to: '/mentor/verification' },
      { label: 'Marks', icon: ClipboardList, to: '/mentor/marks' },
      { label: 'Profile', icon: UserRoundCog, to: '/mentor/profile' },
    ];
  }

  if (role === USER_ROLES.admin) {
    return [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
      { label: 'Users', icon: Users, to: '/admin/users' },
      { label: 'Teams', icon: ShieldCheck, to: '/admin/teams' },
      { label: 'Projects', icon: FolderKanban, to: '/admin/projects' },
      { label: 'Profile', icon: UserRoundCog, to: '/admin/profile' },
    ];
  }

  return [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/student' },
    { label: 'Profile', icon: BadgeCheck, to: '/student/profile' },
    { label: 'Team', icon: Users, to: '/student/team' },
    { label: 'Submit Project', icon: PenSquare, to: '/student/submit' },
    { label: 'My Submissions', icon: FolderKanban, to: '/student/submissions' },
    { label: 'Feedback & Marks', icon: MessageSquareText, to: '/student/feedback' },
  ];
}
