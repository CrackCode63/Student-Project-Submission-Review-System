import { useEffect, useState } from 'react';
import { ArrowRight, BellRing, ClipboardCheck, ShieldCheck, Users } from 'lucide-react';
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
import { mentorApi, notificationApi, projectApi, verificationApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

export function MentorDashboardPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadDashboard = async () => {
      try {
        const [studentList, queueList, notificationList] = await Promise.all([
          mentorApi.students(),
          projectApi.reviewQueue(),
          notificationApi.list().catch(() => []),
        ]);
        const requestList = await verificationApi.listForMentor(user.id, studentList);

        if (!isActive) {
          return;
        }

        setStudents(studentList);
        setReviewQueue(queueList);
        setNotifications(notificationList);
        setVerificationRequests(requestList.filter((request) => request.status === 'Pending'));
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message || 'Unable to load mentor dashboard data.');
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
  }, [user.id]);

  const stats = [
    {
      title: 'Assigned Students',
      value: String(students.length).padStart(2, '0'),
      trend: students.length ? 'Students currently mapped to your mentor queue' : 'No students assigned yet',
      icon: Users,
      accent: 'from-primary to-accent',
    },
    {
      title: 'Pending Reviews',
      value: String(reviewQueue.filter((item) => item.status === 'Pending').length).padStart(2, '0'),
      trend: reviewQueue.length ? 'Projects waiting for feedback or status updates' : 'Review queue is currently empty',
      icon: ClipboardCheck,
      accent: 'from-warning to-orange-400',
    },
    {
      title: 'Verification Requests',
      value: String(verificationRequests.length).padStart(2, '0'),
      trend: verificationRequests.length ? 'Student profiles waiting for your decision' : 'No pending requests right now',
      icon: ShieldCheck,
      accent: 'from-success to-emerald-400',
    },
  ];

  const activityItems = reviewQueue.slice(0, 5).map((item) => ({
    title: `${item.project_title} ${item.version_label} from ${item.owner_display_name}`,
    meta: formatDateTime(item.submitted_at),
    status: item.status,
  }));

  return (
    <PageTransition>
      <PageHeader
        eyebrow='Mentor Dashboard'
        title='Review faster without losing clarity.'
        description='Keep track of your student roster, priority review queue, and the verification tasks that need approval.'
        actions={
          <Link to='/mentor/reviews'>
            <Button>
              Open Review Queue
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
            title='Review activity'
            description='The latest submissions currently visible in your queue.'
            items={activityItems}
          />
        ) : (
          <Card className='flex items-center justify-center rounded-[30px] text-center text-sm text-slate-500 dark:text-slate-300'>
            No projects are waiting in your review queue yet.
          </Card>
        )}

        <div className='space-y-6'>
          <Card className='space-y-4'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Verification approvals</h3>
                <p className='mt-1 text-sm text-slate-500 dark:text-slate-300'>Profiles that still need your sign-off.</p>
              </div>
              <ShieldCheck className='h-5 w-5 text-success' />
            </div>
            {verificationRequests.length ? (
              <div className='space-y-3'>
                {verificationRequests.slice(0, 3).map((request) => (
                  <div key={request.id} className='surface-panel rounded-[24px] p-4'>
                    <div className='flex items-center justify-between gap-3'>
                      <p className='font-semibold text-slate-900 dark:text-white'>{request.studentName}</p>
                      <StatusBadge status={request.status} />
                    </div>
                    <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>{request.section}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className='surface-panel rounded-[24px] p-4 text-sm text-slate-500 dark:text-slate-300'>
                No pending verification requests.
              </div>
            )}
          </Card>

          <Card className='space-y-4'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Live notifications</h3>
                <p className='mt-1 text-sm text-slate-500 dark:text-slate-300'>Recent project updates arriving through the notification system.</p>
              </div>
              <BellRing className='h-5 w-5 text-primary' />
            </div>
            <div className='space-y-3'>
              {notifications.slice(0, 3).map((item) => (
                <div key={item.id} className='surface-panel rounded-[24px] p-4'>
                  <p className='font-medium text-slate-900 dark:text-white'>{item.message}</p>
                  <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>{formatDateTime(item.timestamp)}</p>
                </div>
              ))}
              {!notifications.length ? (
                <div className='surface-panel rounded-[24px] p-4 text-sm text-slate-500 dark:text-slate-300'>
                  No notifications yet.
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
