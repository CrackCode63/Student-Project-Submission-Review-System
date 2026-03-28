import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CalendarClock,
  FileClock,
  FolderKanban,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { PageHeader } from '../../components/PageHeader';
import { PageTransition } from '../../components/PageTransition';
import { RecentActivityList } from '../../components/RecentActivityList';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { notificationApi, profileApi, projectApi, teamApi } from '../../services/api';
import { formatDate, formatDateTime, getDeadlineState } from '../../utils/formatters';

export function StudentDashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [team, setTeam] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadDashboard = async () => {
      try {
        const [projectList, teamList, nextProfile, nextNotifications] = await Promise.all([
          projectApi.list(),
          teamApi.list(),
          profileApi.get(user),
          notificationApi.list().catch(() => []),
        ]);

        if (!isActive) {
          return;
        }

        setProjects(projectList);
        setTeam(teamList[0] || null);
        setProfile(nextProfile);
        setNotifications(nextNotifications);
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message || 'Unable to load dashboard data.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      isActive = false;
    };
  }, [user]);

  const visibleProjects = projects.filter((project) => !project.is_deleted);
  const pendingProjects = visibleProjects.filter((project) => project.latest_submission?.status === 'Pending');
  const approvedProjects = visibleProjects.filter((project) => project.latest_submission?.status === 'Approved');
  const latestPending = pendingProjects[0];
  const deadlineAt = latestPending?.latest_submission?.submitted_at
    ? new Date(new Date(latestPending.latest_submission.submitted_at).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
    : null;
  const deadlineState = getDeadlineState(deadlineAt);
  const activityItems = [
    ...visibleProjects
      .filter((project) => project.latest_submission)
      .map((project) => ({
        title: `${project.title} ${project.latest_submission.version_label} is ${project.latest_submission.status.toLowerCase()}`,
        meta: formatDateTime(project.latest_submission.submitted_at),
        status: project.latest_submission.status,
      })),
  ].slice(0, 5);

  const stats = [
    {
      title: 'Active Projects',
      value: String(visibleProjects.length).padStart(2, '0'),
      trend: visibleProjects.length ? 'Projects currently visible in your workspace' : 'No projects submitted yet',
      icon: FolderKanban,
      accent: 'from-primary to-secondary',
    },
    {
      title: 'Pending Reviews',
      value: String(pendingProjects.length).padStart(2, '0'),
      trend: pendingProjects.length ? 'Waiting for mentor review' : 'Nothing pending right now',
      icon: FileClock,
      accent: 'from-warning to-orange-400',
    },
    {
      title: 'Approved Projects',
      value: String(approvedProjects.length).padStart(2, '0'),
      trend: approvedProjects.length ? 'Approved latest submissions' : 'No approved submissions yet',
      icon: BadgeCheck,
      accent: 'from-success to-emerald-400',
    },
  ];

  return (
    <PageTransition>
      <PageHeader
        eyebrow='Student Dashboard'
        title='Submit with confidence and stay review-ready.'
        description='Track project status, your assigned mentor, verification progress, and the latest activity across your submission workspace.'
        actions={
          <Link to='/student/submit'>
            <Button>
              New Submission
              <ArrowRight className='h-4 w-4' />
            </Button>
          </Link>
        }
      />

      <div className='grid gap-5 xl:grid-cols-3'>
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <LoadingSkeleton key={index} className='h-[170px] rounded-[28px]' />
            ))
          : stats.map((item) => <StatCard key={item.title} {...item} />)}
      </div>

      {error ? <Card className='mt-6 text-sm text-danger'>{error}</Card> : null}

      <div className='mt-6 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]'>
        {isLoading ? (
          <LoadingSkeleton className='h-[360px] rounded-[30px]' />
        ) : activityItems.length ? (
          <RecentActivityList
            title='Activity timeline'
            description='Recent submission movement and review updates.'
            items={activityItems}
          />
        ) : (
          <Card className='flex items-center justify-center rounded-[30px] text-center text-sm text-slate-500 dark:text-slate-300'>
            Your timeline will fill in as soon as you start submitting projects.
          </Card>
        )}

        <div className='space-y-6'>
          <Card className='space-y-4'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Workspace snapshot</h3>
                <p className='mt-1 text-sm text-slate-500 dark:text-slate-300'>A quick summary of the essentials.</p>
              </div>
              <ShieldCheck className='h-5 w-5 text-primary' />
            </div>
            <div className='space-y-3'>
              <div className='surface-panel rounded-[24px] p-4'>
                <p className='text-sm text-slate-500 dark:text-slate-300'>Assigned mentor</p>
                <p className='mt-1 font-semibold text-slate-900 dark:text-white'>{user?.mentor_name || 'Not assigned yet'}</p>
              </div>
              <div className='surface-panel rounded-[24px] p-4'>
                <p className='text-sm text-slate-500 dark:text-slate-300'>Work mode</p>
                <div className='mt-2'>
                  <StatusBadge status={team ? 'Team' : 'Individual'} />
                </div>
                <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>
                  {team ? `${team.name} with ${team.member_count} member(s)` : 'No active team yet. You can still submit individually.'}
                </p>
              </div>
              <div className='surface-panel rounded-[24px] p-4'>
                <p className='text-sm text-slate-500 dark:text-slate-300'>Profile verification</p>
                <div className='mt-2'>
                  <StatusBadge status={profile?.verificationStatus || 'Not Requested'} />
                </div>
              </div>
            </div>
          </Card>

          <Card className='space-y-4'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Deadline indicator</h3>
                <p className='mt-1 text-sm text-slate-500 dark:text-slate-300'>Closest review deadline based on your latest pending version.</p>
              </div>
              <CalendarClock className='h-5 w-5 text-warning' />
            </div>
            <div className='surface-panel rounded-[24px] p-4'>
              <div className='flex items-center justify-between gap-3'>
                <p className='font-semibold text-slate-900 dark:text-white'>{latestPending?.title || 'No pending review'}</p>
                <span className={`text-sm font-semibold ${deadlineState.tone}`}>{deadlineState.label}</span>
              </div>
              <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>{deadlineState.detail}</p>
              {deadlineAt ? <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>Target date: {formatDate(deadlineAt)}</p> : null}
            </div>
          </Card>
        </div>
      </div>

      <div className='mt-6 grid gap-6 lg:grid-cols-3'>
        <Card className='space-y-4'>
          <div className='inline-flex rounded-2xl bg-accent/10 p-3 text-accent'>
            <BellRing className='h-5 w-5' />
          </div>
          <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Notifications</h3>
          <p className='text-sm leading-7 text-slate-500 dark:text-slate-300'>
            {notifications.length
              ? `${notifications.filter((item) => !item.is_read).length} unread update(s) are waiting in the navbar dropdown.`
              : 'No recent notifications. Project submitted, reviewed, and marks events will appear here.'}
          </p>
        </Card>
        <Card className='space-y-4'>
          <div className='inline-flex rounded-2xl bg-primary/10 p-3 text-primary'>
            <Users className='h-5 w-5' />
          </div>
          <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Team status</h3>
          <p className='text-sm leading-7 text-slate-500 dark:text-slate-300'>
            {team
              ? `Your active team is ${team.name}. Share join code ${team.join_code} if another teammate still needs access.`
              : 'You are currently working in individual mode. Create or join a team anytime from the team page.'}
          </p>
        </Card>
        <Card className='space-y-4'>
          <div className='inline-flex rounded-2xl bg-success/10 p-3 text-success'>
            <ShieldCheck className='h-5 w-5' />
          </div>
          <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Verification readiness</h3>
          <p className='text-sm leading-7 text-slate-500 dark:text-slate-300'>
            {profile?.verificationStatus === 'Verified'
              ? 'Your profile is already verified, so mentor review flow is fully ready.'
              : 'Complete your details on the profile page and send a verification request when you are ready.'}
          </p>
        </Card>
      </div>
    </PageTransition>
  );
}
