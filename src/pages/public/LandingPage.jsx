import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageTransition } from '../../components/PageTransition';
import { StatusBadge } from '../../components/StatusBadge';
import { landingFeatures, landingStats } from '../../utils/mockData';

export function LandingPage() {
  return (
    <PageTransition className='relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-24'>
      <section className='grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:py-12'>
        <div>
          <div className='inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-4 py-2 text-sm font-medium text-primary shadow-soft backdrop-blur dark:bg-slate-950/40 dark:text-primary-100'>
            <Sparkles className='h-4 w-4' />
            Premium project operations for modern institutions
          </div>
          <h1 className='mt-8 max-w-3xl font-display text-5xl font-bold leading-tight text-slate-950 dark:text-white md:text-6xl'>
            Student Project Submission & Review System built like a real SaaS product.
          </h1>
          <p className='mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300'>
            Deliver polished submissions, accelerate mentor reviews, and keep every team aligned with a premium dashboard experience that feels launch-ready from day one.
          </p>
          <div className='mt-8 flex flex-col gap-4 sm:flex-row'>
            <Link to='/register'>
              <Button size='lg'>
                Start Building
                <ArrowRight className='h-4 w-4' />
              </Button>
            </Link>
            <Link to='/login'>
              <Button variant='secondary' size='lg'>
                Explore Demo Access
              </Button>
            </Link>
          </div>
          <div className='mt-8 grid gap-3 sm:grid-cols-3'>
            {landingStats.map((item) => (
              <Card key={item.label} className='rounded-[24px] p-5'>
                <p className='text-3xl font-bold text-slate-900 dark:text-white'>{item.value}</p>
                <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>{item.label}</p>
              </Card>
            ))}
          </div>
          <div className='mt-8 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300'>
            <span className='inline-flex items-center gap-2'>
              <CheckCircle2 className='h-4 w-4 text-success' />
              Role-based access for students and mentors
            </span>
            <span className='inline-flex items-center gap-2'>
              <ShieldCheck className='h-4 w-4 text-accent' />
              Clean workflows for review and evaluation
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.38, ease: 'easeOut' }}
          className='relative'
        >
          <div className='absolute -left-10 -top-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl dark:bg-primary/25' />
          <div className='absolute -bottom-10 -right-8 h-36 w-36 rounded-full bg-accent/25 blur-3xl dark:bg-accent/20' />
          <Card className='relative overflow-hidden rounded-[36px] p-0 shadow-glass'>
            <div className='grid gap-6 bg-hero-mesh p-6 md:p-8'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-slate-500 dark:text-slate-300'>Live Workspace</p>
                  <h2 className='mt-2 font-display text-2xl font-semibold text-slate-900 dark:text-white'>
                    Review-ready dashboard
                  </h2>
                </div>
                <StatusBadge status='Approved' />
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <div className='surface-panel rounded-[28px] p-5'>
                  <p className='text-sm text-slate-500 dark:text-slate-300'>Submission velocity</p>
                  <p className='mt-3 text-4xl font-bold text-slate-900 dark:text-white'>87%</p>
                  <p className='mt-2 text-sm text-success'>+12% from last review cycle</p>
                </div>
                <div className='surface-panel rounded-[28px] p-5'>
                  <p className='text-sm text-slate-500 dark:text-slate-300'>Mentor turnaround</p>
                  <p className='mt-3 text-4xl font-bold text-slate-900 dark:text-white'>14h</p>
                  <p className='mt-2 text-sm text-primary'>Average response time</p>
                </div>
              </div>

              <div className='space-y-4'>
                {[
                  ['Smart Campus App', 'Version 3.1 submitted', 'Pending'],
                  ['Attendance Intelligence', 'Approved for showcase', 'Approved'],
                  ['Notes Collaboration Hub', 'Revision requested', 'Changes Required'],
                ].map(([title, meta, status]) => (
                  <div key={title} className='surface-panel flex items-center justify-between gap-4 rounded-[24px] px-4 py-4'>
                    <div>
                      <p className='font-medium text-slate-900 dark:text-white'>{title}</p>
                      <p className='mt-1 text-sm text-slate-500 dark:text-slate-300'>{meta}</p>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      <section className='mt-20 grid gap-6 lg:grid-cols-3'>
        {landingFeatures.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 + 0.14, duration: 0.28 }}
            >
              <Card className='h-full rounded-[30px]'>
                <div className='mb-5 inline-flex rounded-2xl bg-brand-gradient p-3 text-white shadow-glow'>
                  <Icon className='h-5 w-5' />
                </div>
                <h3 className='font-display text-2xl font-semibold text-slate-900 dark:text-white'>
                  {feature.title}
                </h3>
                <p className='mt-4 text-sm leading-7 text-slate-500 dark:text-slate-300'>
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          );
        })}
      </section>
    </PageTransition>
  );
}
