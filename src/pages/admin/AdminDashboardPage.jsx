import { useEffect, useState } from 'react';
import { ArrowRight, FolderKanban, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { PageHeader } from '../../components/PageHeader';
import { PageTransition } from '../../components/PageTransition';
import { StatCard } from '../../components/StatCard';
import { adminApi, authApi } from '../../services/api';

export function AdminDashboardPage() {
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadDashboard = async () => {
      try {
        const [studentList, projectList, teamList, mentorList] = await Promise.all([
          adminApi.students(),
          adminApi.projects(),
          adminApi.teams(),
          authApi.mentors(),
        ]);

        if (!isActive) {
          return;
        }

        setStudents(studentList);
        setProjects(projectList);
        setTeams(teamList);
        setMentors(mentorList);
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message || 'Unable to load the admin console.');
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
  }, []);

  const stats = [
    {
      title: 'Students',
      value: String(students.length).padStart(2, '0'),
      trend: `${students.filter((student) => student.mentor_id).length} linked to mentors`,
      icon: Users,
      accent: 'from-primary to-accent',
    },
    {
      title: 'Mentors',
      value: String(mentors.length).padStart(2, '0'),
      trend: 'Available for assignment and review coverage',
      icon: ShieldCheck,
      accent: 'from-success to-emerald-400',
    },
    {
      title: 'Teams',
      value: String(teams.length).padStart(2, '0'),
      trend: 'Active team workspaces currently tracked',
      icon: FolderKanban,
      accent: 'from-warning to-orange-400',
    },
    {
      title: 'Projects',
      value: String(projects.length).padStart(2, '0'),
      trend: `${projects.filter((project) => project.latest_submission).length} with submissions`,
      icon: FolderKanban,
      accent: 'from-secondary to-primary',
    },
  ];

  return (
    <PageTransition>
      <PageHeader
        eyebrow='Admin Console'
        title='Oversee the full project system from one place.'
        description='Track students, mentors, teams, and project health, then jump directly into management pages for the next action.'
      />

      {error ? <Card className='mb-6 text-sm text-danger'>{error}</Card> : null}

      <div className='grid gap-5 xl:grid-cols-4'>
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <LoadingSkeleton key={index} className='h-[170px] rounded-[28px]' />
            ))
          : stats.map((item) => <StatCard key={item.title} {...item} />)}
      </div>

      <div className='mt-6 grid gap-6 xl:grid-cols-3'>
        <Card className='space-y-4'>
          <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>User management</h3>
          <p className='text-sm leading-7 text-slate-500 dark:text-slate-300'>Review all users, assign mentors, and create new mentor accounts from one clean screen.</p>
          <Link to='/admin/users'>
            <Button>
              Open Users
              <ArrowRight className='h-4 w-4' />
            </Button>
          </Link>
        </Card>
        <Card className='space-y-4'>
          <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Team management</h3>
          <p className='text-sm leading-7 text-slate-500 dark:text-slate-300'>Adjust team members, assign mentors to one or many teams, and keep collaboration data tidy.</p>
          <Link to='/admin/teams'>
            <Button>
              Open Teams
              <ArrowRight className='h-4 w-4' />
            </Button>
          </Link>
        </Card>
        <Card className='space-y-4'>
          <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Project control</h3>
          <p className='text-sm leading-7 text-slate-500 dark:text-slate-300'>Inspect all project submissions, bulk actions, video previews, and IDE-ready handoff controls.</p>
          <Link to='/admin/projects'>
            <Button>
              Open Projects
              <ArrowRight className='h-4 w-4' />
            </Button>
          </Link>
        </Card>
      </div>
    </PageTransition>
  );
}
