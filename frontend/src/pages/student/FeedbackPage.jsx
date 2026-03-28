import { useEffect, useState } from 'react';
import { ClipboardList, MessageSquareText } from 'lucide-react';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { PageTransition } from '../../components/PageTransition';
import { SearchInput } from '../../components/SearchInput';
import { StatusBadge } from '../../components/StatusBadge';
import { feedbackApi, marksApi, projectApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

export function FeedbackPage() {
  const [projects, setProjects] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [marks, setMarks] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadFeedbackPage = async () => {
      try {
        const [projectList, feedbackList, markList] = await Promise.all([
          projectApi.list(),
          feedbackApi.list(),
          marksApi.list(),
        ]);

        if (!isActive) {
          return;
        }

        setProjects(projectList);
        setFeedback(feedbackList);
        setMarks(markList);
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message || 'Unable to load feedback and marks.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadFeedbackPage();
    return () => {
      isActive = false;
    };
  }, []);

  const rows = projects
    .filter((project) => !project.is_deleted)
    .map((project) => ({
      project,
      feedbackItems: feedback.filter((item) => item.project_id === project.id),
      mark: marks.find((item) => item.project_id === project.id) || null,
    }))
    .filter((row) => `${row.project.title} ${row.project.category}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageTransition>
      <PageHeader
        eyebrow='Feedback & Marks'
        title='Review mentor comments and published scores.'
        description='Every project shows its latest comments, current mark sheet, and the submission status that produced them.'
      />

      {error ? <Card className='mb-6 text-sm text-danger'>{error}</Card> : null}

      <Card className='mb-6'>
        <SearchInput
          label='Search projects'
          placeholder='Search by project title or category'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </Card>

      {isLoading ? (
        <Card className='text-sm text-slate-500 dark:text-slate-300'>Loading feedback...</Card>
      ) : !rows.length ? (
        <EmptyState
          icon={MessageSquareText}
          title='No feedback yet'
          description='Feedback and marks will appear here after your mentor starts reviewing submissions.'
        />
      ) : (
        <div className='space-y-6'>
          {rows.map(({ project, feedbackItems, mark }) => (
            <Card key={project.id} className='space-y-5'>
              <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                <div>
                  <div className='flex flex-wrap items-center gap-3'>
                    <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>{project.title}</h3>
                    <StatusBadge status={project.latest_submission?.status || 'Pending'} />
                  </div>
                  <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>
                    {project.category} • Mentor: {project.mentor_name || 'Not assigned'}
                  </p>
                </div>
                {mark ? (
                  <div className='rounded-[24px] bg-primary/10 px-4 py-3 text-sm text-primary'>
                    Total Marks: <span className='font-semibold'>{mark.total}</span>
                  </div>
                ) : null}
              </div>

              <div className='grid gap-6 xl:grid-cols-2'>
                <div className='space-y-4'>
                  <div className='flex items-center gap-2'>
                    <MessageSquareText className='h-4 w-4 text-primary' />
                    <p className='font-semibold text-slate-900 dark:text-white'>Mentor feedback</p>
                  </div>
                  {feedbackItems.length ? (
                    feedbackItems.map((item) => (
                      <div key={item.id} className='surface-panel rounded-[24px] p-4'>
                        <p className='font-semibold text-slate-900 dark:text-white'>{item.mentor_name}</p>
                        <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>{item.comment}</p>
                        <p className='mt-2 text-xs text-slate-500 dark:text-slate-400'>{formatDateTime(item.created_at)}</p>
                      </div>
                    ))
                  ) : (
                    <div className='surface-panel rounded-[24px] p-4 text-sm text-slate-500 dark:text-slate-300'>
                      No mentor comments have been added yet.
                    </div>
                  )}
                </div>

                <div className='space-y-4'>
                  <div className='flex items-center gap-2'>
                    <ClipboardList className='h-4 w-4 text-success' />
                    <p className='font-semibold text-slate-900 dark:text-white'>Marks</p>
                  </div>
                  {mark ? (
                    <div className='surface-panel rounded-[24px] p-4 text-sm text-slate-500 dark:text-slate-300'>
                      <p>Innovation: <span className='font-semibold text-slate-900 dark:text-white'>{mark.innovation}</span></p>
                      <p className='mt-2'>Execution: <span className='font-semibold text-slate-900 dark:text-white'>{mark.execution}</span></p>
                      <p className='mt-2'>Presentation: <span className='font-semibold text-slate-900 dark:text-white'>{mark.presentation}</span></p>
                      <p className='mt-2'>Total: <span className='font-semibold text-slate-900 dark:text-white'>{mark.total}</span></p>
                      <p className='mt-2'>Remarks: {mark.remarks || 'No remarks added.'}</p>
                      <p className='mt-2 text-xs text-slate-500 dark:text-slate-400'>Updated {formatDateTime(mark.updated_at)}</p>
                    </div>
                  ) : (
                    <div className='surface-panel rounded-[24px] p-4 text-sm text-slate-500 dark:text-slate-300'>
                      Marks have not been published for this project yet.
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
