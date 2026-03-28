import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { GraduationCap, Hash, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { InputField } from '../../components/InputField';
import { PageTransition } from '../../components/PageTransition';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/api';
import { getHomePathForRole } from '../../utils/roles';

const roles = [
  { label: 'Student', value: 'student' },
  { label: 'Mentor', value: 'mentor' },
  { label: 'Admin', value: 'admin' },
];

export function RegisterPage() {
  const { isAuthenticated, user, isInitializing, register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ name: '', email: '', password: '', rollNo: '', mentorId: '' });
  const [mentors, setMentors] = useState([]);
  const [isLoadingMentors, setIsLoadingMentors] = useState(true);
  const [mentorError, setMentorError] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isInitializing && isAuthenticated && user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  useEffect(() => {
    let isActive = true;

    const loadMentors = async () => {
      try {
        const mentorList = await authApi.mentors();
        if (!isActive) {
          return;
        }

        setMentors(mentorList);
        setMentorError('');
      } catch (requestError) {
        if (!isActive) {
          return;
        }

        setMentors([]);
        setMentorError(requestError.message || 'Unable to load mentors right now.');
      } finally {
        if (isActive) {
          setIsLoadingMentors(false);
        }
      }
    };

    loadMentors();
    return () => {
      isActive = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role,
      };

      if (role === 'student') {
        payload.roll_no = form.rollNo.trim();
        payload.mentor_id = Number(form.mentorId);
      }

      const nextSession = await register(payload);
      navigate(getHomePathForRole(nextSession.user.role));
    } catch (requestError) {
      setError(requestError.message || 'Unable to create your account right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mentorOptions = [
    { label: isLoadingMentors ? 'Loading mentors...' : 'Select your mentor', value: '' },
    ...mentors.map((mentor) => ({
      label: `${mentor.name} (${mentor.email})`,
      value: String(mentor.id),
    })),
  ];
  const isStudentRegistrationBlocked =
    role === 'student' && (isLoadingMentors || !mentors.length || !form.rollNo.trim() || !form.mentorId);

  return (
    <PageTransition className='relative z-10 mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-7xl items-center px-4 pb-12 sm:px-6 lg:px-8'>
      <div className='grid w-full gap-8 lg:grid-cols-[1.02fr_0.98fr]'>
        <Card className='rounded-[34px] p-8 lg:p-10'>
          <p className='text-sm font-semibold uppercase tracking-[0.24em] text-primary/70'>Launch Workspace</p>
          <h1 className='mt-4 font-display text-4xl font-bold text-slate-900 dark:text-white'>
            Create your account
          </h1>
          <p className='mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300'>
            Set up a clean role-based dashboard for students, mentors, and admins in a few seconds.
          </p>

          <div className='mt-8 grid grid-cols-3 gap-3 rounded-[24px] bg-slate-100/70 p-1.5 dark:bg-white/5'>
            {roles.map((item) => (
              <button
                key={item.value}
                type='button'
                onClick={() => setRole(item.value)}
                className={`rounded-[20px] px-4 py-3 text-sm font-semibold transition ${
                  role === item.value
                    ? 'bg-brand-gradient text-white shadow-glow'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form className='mt-8 space-y-5' onSubmit={handleSubmit}>
            <InputField
              label='Full Name'
              icon={UserRound}
              placeholder='Enter your full name'
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
            <InputField
              label='Email Address'
              type='email'
              icon={Mail}
              placeholder='yourname@campus.io'
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
            />
            <InputField
              label='Password'
              type='password'
              icon={LockKeyhole}
              placeholder='Choose a strong password'
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              required
            />
            {role === 'student' ? (
              <>
                <InputField
                  label='Roll Number'
                  icon={Hash}
                  placeholder='Enter your roll number'
                  value={form.rollNo}
                  onChange={(event) => setForm((current) => ({ ...current, rollNo: event.target.value }))}
                  required
                />
                <InputField
                  label='Assigned Mentor'
                  icon={GraduationCap}
                  options={mentorOptions}
                  value={form.mentorId}
                  onChange={(event) => setForm((current) => ({ ...current, mentorId: event.target.value }))}
                  required
                  disabled={isLoadingMentors || !mentors.length}
                  hint={
                    mentorError ||
                    (!isLoadingMentors && !mentors.length
                      ? 'No mentors are available yet. Please create a mentor account first.'
                      : 'Choose the mentor who will review your projects.')
                  }
                />
              </>
            ) : null}
            {error ? <p className='text-sm text-danger'>{error}</p> : null}
            <Button type='submit' size='lg' className='w-full' disabled={isSubmitting || isStudentRegistrationBlocked}>
              {isSubmitting ? 'Creating workspace...' : `Create ${role.charAt(0).toUpperCase() + role.slice(1)} Workspace`}
            </Button>
          </form>

          <p className='mt-6 text-sm text-slate-500 dark:text-slate-300'>
            Already have an account?{' '}
            <Link to='/login' className='font-semibold text-primary'>
              Sign in
            </Link>
          </p>
        </Card>

        <Card className='rounded-[34px] bg-hero-mesh p-8 lg:p-10'>
          <div className='grid gap-4'>
            {[
              ['Fast onboarding', 'Create a student, mentor, or admin workspace without leaving the main flow.'],
              ['Dark and light mode', 'Theme preference stays saved locally so the experience feels polished on repeat visits.'],
              ['Scalable frontend', 'Reusable layouts, shared services, and route-based role separation keep the code easy to extend.'],
            ].map(([title, copy]) => (
              <div key={title} className='surface-panel rounded-[26px] p-5'>
                <div className='mb-3 inline-flex rounded-2xl bg-primary/10 p-3 text-primary'>
                  {title === 'Fast onboarding' ? <UserRound className='h-5 w-5' /> : title === 'Dark and light mode' ? <ShieldCheck className='h-5 w-5' /> : <GraduationCap className='h-5 w-5' />}
                </div>
                <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>{title}</h3>
                <p className='mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300'>{copy}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
