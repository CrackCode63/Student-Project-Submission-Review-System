import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { InputField } from '../../components/InputField';
import { PageTransition } from '../../components/PageTransition';
import { useAuth } from '../../hooks/useAuth';
import { getHomePathForRole } from '../../utils/roles';

const roles = [
  { label: 'Student', value: 'student' },
  { label: 'Mentor', value: 'mentor' },
  { label: 'Admin', value: 'admin' },
];

export function LoginPage() {
  const { isAuthenticated, user, isInitializing, login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isInitializing && isAuthenticated && user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const nextSession = await login({
        email: form.email,
        password: form.password,
        expectedRole: role,
      });
      navigate(getHomePathForRole(nextSession.user.role));
    } catch (requestError) {
      setError(requestError.message || 'Unable to sign in right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition className='relative z-10 mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-7xl items-center px-4 pb-12 sm:px-6 lg:px-8'>
      <div className='grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr]'>
        <Card className='rounded-[34px] p-8 lg:p-10'>
          <p className='text-sm font-semibold uppercase tracking-[0.24em] text-primary/70'>Access Portal</p>
          <h1 className='mt-4 font-display text-4xl font-bold text-slate-900 dark:text-white'>
            Welcome back
          </h1>
          <p className='mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300'>
            Sign in to continue with your submissions, reviews, activity stream, and dashboard insights.
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
              label='Email Address'
              type='email'
              icon={Mail}
              placeholder={
                role === 'mentor' ? 'mentor@campus.io' : role === 'admin' ? 'admin@campus.io' : 'student@campus.io'
              }
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
            />
            <InputField
              label='Password'
              type='password'
              icon={LockKeyhole}
              placeholder='Enter your password'
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              required
            />
            {error ? <p className='text-sm text-danger'>{error}</p> : null}
            <Button type='submit' size='lg' className='w-full' disabled={isSubmitting}>
              {isSubmitting
                ? 'Signing in...'
                : `Sign In to ${
                    role === 'mentor' ? 'Mentor Dashboard' : role === 'admin' ? 'Admin Console' : 'Student Dashboard'
                  }`}
            </Button>
          </form>

          <p className='mt-6 text-sm text-slate-500 dark:text-slate-300'>
            New here?{' '}
            <Link to='/register' className='font-semibold text-primary'>
              Create an account
            </Link>
          </p>
        </Card>

        <Card className='rounded-[34px] bg-hero-mesh p-8 lg:p-10'>
          <div className='rounded-[28px] border border-white/30 bg-white/70 p-6 backdrop-blur-xl dark:bg-slate-950/45'>
            <p className='text-sm font-semibold uppercase tracking-[0.22em] text-primary/75'>Why teams love it</p>
            <h2 className='mt-4 font-display text-3xl font-bold text-slate-900 dark:text-white'>
              A calmer, cleaner review workflow
            </h2>
            <div className='mt-8 space-y-4'>
              {[
                'Track versions with clarity and status-aware visuals.',
                'Move from login to protected dashboards with zero friction.',
                'Switch between student and mentor views for realistic demos.',
              ].map((item) => (
                <div key={item} className='surface-panel rounded-[24px] px-4 py-4 text-sm text-slate-600 dark:text-slate-300'>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
