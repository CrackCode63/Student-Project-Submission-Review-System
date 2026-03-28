import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageTransition } from '../../components/PageTransition';

export function NotFoundPage() {
  return (
    <PageTransition className='relative z-10 mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-4xl items-center justify-center px-4 pb-12 sm:px-6 lg:px-8'>
      <Card className='max-w-2xl rounded-[34px] p-10 text-center'>
        <p className='text-sm font-semibold uppercase tracking-[0.24em] text-primary/75'>404 Error</p>
        <h1 className='mt-4 font-display text-5xl font-bold text-slate-900 dark:text-white'>Page not found</h1>
        <p className='mt-4 text-sm leading-7 text-slate-500 dark:text-slate-300'>
          The page you requested is not available in this workspace. Head back to the landing page and continue from there.
        </p>
        <Link to='/' className='mt-8 inline-flex'>
          <Button size='lg'>Return Home</Button>
        </Link>
      </Card>
    </PageTransition>
  );
}
