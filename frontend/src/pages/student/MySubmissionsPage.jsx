import { useEffect, useState } from 'react';
import { Download, FileClock, FolderKanban, History, Laptop2, Trash2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { PageTransition } from '../../components/PageTransition';
import { Pagination } from '../../components/Pagination';
import { SearchInput } from '../../components/SearchInput';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import { frontendControlApi, projectApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

export function MySubmissionsPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [projectDetails, setProjectDetails] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadProjects = async () => {
      try {
        const nextProjects = await projectApi.list();
        if (isActive) {
          setProjects(nextProjects);
        }
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message || 'Unable to load submissions.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadProjects();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedProjectId || projectDetails[selectedProjectId]) {
      return;
    }

    const loadDetails = async () => {
      try {
        const details = await projectApi.details(selectedProjectId);
        setProjectDetails((current) => ({ ...current, [selectedProjectId]: details }));
      } catch (requestError) {
        setError(requestError.message || 'Unable to load version history.');
      }
    };

    loadDetails();
  }, [projectDetails, selectedProjectId]);

  const filteredProjects = projects.filter((project) => {
    const status = project.is_deleted ? 'Deleted' : project.latest_submission?.status || 'Draft';
    const matchesSearch = `${project.title} ${project.category} ${project.owner_display_name}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { currentPage, totalPages, setPage, paginatedItems } = usePagination(filteredProjects, 5);
  const selectedDetails = selectedProjectId ? projectDetails[selectedProjectId] : null;

  const handleOpenIde = async (projectTitle) => {
    const response = await frontendControlApi.openInIde();
    pushToast({
      title: 'Open in IDE',
      message: `${projectTitle}: ${response.message}`,
      tone: 'info',
    });
  };

  const handleDownload = (project) => {
    const url = project.latest_submission?.repository_url || project.repository_url;

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    pushToast({
      title: 'Download endpoint needed',
      message: 'The UI is ready, but your backend still needs a direct project-download route.',
      tone: 'info',
    });
  };

  const handleDelete = async () => {
    if (!deleteCandidate) {
      return;
    }

    setIsDeleting(true);

    try {
      await projectApi.deleteLocally(deleteCandidate.id, user.id);
      setProjects((current) =>
        current.map((project) =>
          project.id === deleteCandidate.id ? { ...project, is_deleted: true } : project,
        ),
      );
      pushToast({
        title: 'Project marked deleted',
        message: `${deleteCandidate.title} now shows as deleted in your dashboard.`,
        tone: 'success',
      });
      setDeleteCandidate(null);
    } catch (requestError) {
      setError(requestError.message || 'Unable to mark the project as deleted.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageTransition>
      <PageHeader
        eyebrow='Project Management'
        title='Manage versions, history, and review state.'
        description='Review your submission history, open repository links, and soft-delete projects when they should no longer be active.'
      />

      {error ? <Card className='mb-6 text-sm text-danger'>{error}</Card> : null}

      <Card className='mb-6 space-y-4'>
        <div className='grid gap-4 md:grid-cols-[1fr_220px]'>
          <SearchInput
            label='Search projects'
            placeholder='Search by title or category'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <InputSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} />
        </div>
      </Card>

      {isLoading ? (
        <Card className='text-sm text-slate-500 dark:text-slate-300'>Loading submissions...</Card>
      ) : !filteredProjects.length ? (
        <EmptyState
          icon={FolderKanban}
          title='No submissions yet'
          description='Once you submit a project, it will appear here with version history and mentor review status.'
        />
      ) : (
        <div className='grid gap-6 xl:grid-cols-[1.06fr_0.94fr]'>
          <div className='space-y-4'>
            {paginatedItems.map((project) => {
              const projectStatus = project.is_deleted ? 'Deleted' : project.latest_submission?.status || 'Draft';
              return (
                <Card key={project.id} className='space-y-4'>
                  <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                    <div>
                      <div className='flex flex-wrap items-center gap-3'>
                        <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>{project.title}</h3>
                        <StatusBadge status={projectStatus} />
                      </div>
                      <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>
                        {project.category} • Mentor: {project.mentor_name || 'Not assigned'}
                      </p>
                      <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>
                        {project.total_submissions} version(s) • Latest update {formatDateTime(project.latest_submission?.submitted_at || project.created_at)}
                      </p>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      <Button variant='secondary' size='sm' onClick={() => setSelectedProjectId(project.id)}>
                        <History className='h-4 w-4' />
                        History
                      </Button>
                      <Button variant='secondary' size='sm' onClick={() => handleDownload(project)}>
                        <Download className='h-4 w-4' />
                        Download
                      </Button>
                      <Button variant='secondary' size='sm' onClick={() => handleOpenIde(project.title)}>
                        <Laptop2 className='h-4 w-4' />
                        Open in IDE
                      </Button>
                      <Button variant='outline' size='sm' onClick={() => setDeleteCandidate(project)} disabled={project.is_deleted}>
                        <Trash2 className='h-4 w-4' />
                        {project.is_deleted ? 'Deleted' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}

            <Card className='py-4'>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </Card>
          </div>

          <Card className='space-y-5'>
            <div>
              <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Version history</h3>
              <p className='mt-1 text-sm text-slate-500 dark:text-slate-300'>Select a project to inspect its submissions and mentor comments.</p>
            </div>
            {selectedDetails ? (
              <div className='space-y-4'>
                {selectedDetails.submissions.map((submission) => (
                  <div key={submission.id} className='surface-panel rounded-[24px] p-4'>
                    <div className='flex items-center justify-between gap-3'>
                      <div>
                        <p className='font-semibold text-slate-900 dark:text-white'>{submission.version_label}</p>
                        <p className='mt-1 text-sm text-slate-500 dark:text-slate-300'>{formatDateTime(submission.submitted_at)}</p>
                      </div>
                      <StatusBadge status={submission.status} />
                    </div>
                    <p className='mt-3 text-sm text-slate-500 dark:text-slate-300'>{submission.summary}</p>
                    {submission.feedback?.length ? (
                      <div className='mt-4 space-y-2'>
                        {submission.feedback.map((item) => (
                          <div key={item.id} className='rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-600 dark:bg-slate-950/40 dark:text-slate-300'>
                            <span className='font-semibold text-slate-900 dark:text-white'>{item.mentor_name}: </span>
                            {item.comment}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FileClock}
                title='No project selected'
                description='Pick a project from the list to view version history and feedback.'
              />
            )}
          </Card>
        </div>
      )}

      <Modal
        open={Boolean(deleteCandidate)}
        title='Delete project?'
        description='This frontend currently performs a soft delete so the project shows a deleted status in the dashboard.'
        onClose={() => setDeleteCandidate(null)}
        footer={
          <div className='flex justify-end gap-3'>
            <Button variant='secondary' onClick={() => setDeleteCandidate(null)}>
              Cancel
            </Button>
            <Button variant='outline' onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        }
      >
        <div className='surface-panel rounded-[24px] p-5 text-sm text-slate-500 dark:text-slate-300'>
          {deleteCandidate?.title} will remain visible in history, but it will be marked as deleted across your frontend workspace.
        </div>
      </Modal>
    </PageTransition>
  );
}

function InputSelect({ value, onChange }) {
  return (
    <label className='block space-y-2'>
      <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Status</span>
      <select
        value={value}
        onChange={onChange}
        className='w-full rounded-2xl border border-primary/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition dark:border-white/10 dark:bg-slate-950/50 dark:text-white'
      >
        {['All', 'Pending', 'Approved', 'Changes Required', 'Deleted'].map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}
