import { useEffect, useState } from 'react';
import { Download, FolderKanban, Laptop2, PlayCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { PageTransition } from '../../components/PageTransition';
import { Pagination } from '../../components/Pagination';
import { SearchInput } from '../../components/SearchInput';
import { StatusBadge } from '../../components/StatusBadge';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import { adminApi, frontendControlApi, projectApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

export function ProjectControlPage() {
  const { pushToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [videoSrc, setVideoSrc] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadProjects = async () => {
      try {
        const projectList = await adminApi.projects();
        if (!isActive) {
          return;
        }

        setProjects(projectList);
        setSelectedProjectId(projectList[0]?.id || null);
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message || 'Unable to load projects.');
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
    if (!selectedProjectId) {
      setSelectedDetails(null);
      return;
    }

    let isActive = true;

    const loadDetails = async () => {
      setIsDetailLoading(true);
      try {
        const details = await projectApi.details(selectedProjectId);
        if (!isActive) {
          return;
        }

        setSelectedDetails(details);
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message || 'Unable to load project details.');
        }
      } finally {
        if (isActive) {
          setIsDetailLoading(false);
        }
      }
    };

    loadDetails();
    return () => {
      isActive = false;
      if (videoSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [selectedProjectId]);

  const filteredProjects = projects.filter((project) => {
    const status = project.latest_submission?.status || 'Pending';
    const matchesSearch = `${project.title} ${project.owner_display_name}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const { currentPage, totalPages, setPage, paginatedItems } = usePagination(filteredProjects, 6);
  const selectedSubmission = selectedDetails?.submissions?.[0] || null;

  const handleBulkDownload = () => {
    pushToast({
      title: 'Bulk download ready for integration',
      message: 'The UI is ready. Connect a backend archive endpoint to download all project packages at once.',
      tone: 'info',
    });
  };

  const handleProjectDownload = () => {
    const url = selectedSubmission?.repository_url || selectedDetails?.project?.repository_url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    pushToast({
      title: 'Download endpoint needed',
      message: 'Expose a direct project download API to make this control fully active.',
      tone: 'info',
    });
  };

  const handleOpenIde = async () => {
    const response = await frontendControlApi.openInIde();
    pushToast({ title: 'Open in IDE', message: response.message, tone: 'info' });
  };

  const handleLoadVideo = async () => {
    if (!selectedSubmission?.video_file_path) {
      return;
    }

    setIsLoadingVideo(true);
    try {
      const src = await projectApi.fetchUploadedVideoUrl(selectedSubmission.id);
      setVideoSrc((current) => {
        if (current?.startsWith('blob:')) {
          URL.revokeObjectURL(current);
        }
        return src;
      });
    } catch (requestError) {
      setError(requestError.message || 'Unable to load video preview.');
    } finally {
      setIsLoadingVideo(false);
    }
  };

  return (
    <PageTransition>
      <PageHeader
        eyebrow='Project Control'
        title='Inspect every project from the admin side.'
        description='Search across all projects, preview submission assets, and use bulk actions when you need operational control.'
        actions={
          <Button onClick={handleBulkDownload}>
            <Download className='h-4 w-4' />
            Bulk Download
          </Button>
        }
      />

      {error ? <Card className='mb-6 text-sm text-danger'>{error}</Card> : null}

      <Card className='mb-6 space-y-4'>
        <div className='grid gap-4 md:grid-cols-[1fr_220px]'>
          <SearchInput
            label='Search projects'
            placeholder='Search by project or owner name'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <label className='block space-y-2'>
            <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className='w-full rounded-2xl border border-primary/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition dark:border-white/10 dark:bg-slate-950/50 dark:text-white'
            >
              {['All', 'Pending', 'Approved', 'Changes Required'].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {isLoading ? (
        <Card className='text-sm text-slate-500 dark:text-slate-300'>Loading projects...</Card>
      ) : !filteredProjects.length ? (
        <EmptyState icon={FolderKanban} title='No projects found' description='Projects will appear here once students begin submitting work.' />
      ) : (
        <div className='grid gap-6 xl:grid-cols-[0.94fr_1.06fr]'>
          <div className='space-y-4'>
            {paginatedItems.map((project) => (
              <Card key={project.id} className='space-y-3'>
                <button type='button' className='w-full text-left' onClick={() => setSelectedProjectId(project.id)}>
                  <div className='flex items-start justify-between gap-4'>
                    <div>
                      <p className='font-semibold text-slate-900 dark:text-white'>{project.title}</p>
                      <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>{project.owner_display_name}</p>
                      <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>Mentor: {project.mentor_name || 'Not assigned'}</p>
                    </div>
                    <StatusBadge status={project.latest_submission?.status || 'Pending'} />
                  </div>
                </button>
              </Card>
            ))}
            <Card className='py-4'>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </Card>
          </div>

          <Card className='space-y-5'>
            {isDetailLoading ? (
              <div className='text-sm text-slate-500 dark:text-slate-300'>Loading details...</div>
            ) : !selectedDetails ? (
              <EmptyState icon={FolderKanban} title='Select a project' description='Choose a project from the list to inspect its assets and latest version.' />
            ) : (
              <>
                <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                  <div>
                    <div className='flex flex-wrap items-center gap-3'>
                      <h3 className='font-display text-2xl font-semibold text-slate-900 dark:text-white'>{selectedDetails.project.title}</h3>
                      <StatusBadge status={selectedSubmission?.status || 'Pending'} />
                    </div>
                    <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>
                      Owner: {selectedDetails.project.owner_display_name} • Mentor: {selectedDetails.project.mentor_name || 'Not assigned'}
                    </p>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Button variant='secondary' size='sm' onClick={handleProjectDownload}>
                      <Download className='h-4 w-4' />
                      Download
                    </Button>
                    <Button variant='secondary' size='sm' onClick={handleOpenIde}>
                      <Laptop2 className='h-4 w-4' />
                      Open in IDE
                    </Button>
                  </div>
                </div>

                <div className='surface-panel rounded-[24px] p-4 text-sm text-slate-500 dark:text-slate-300'>
                  <p className='font-semibold text-slate-900 dark:text-white'>Latest submission</p>
                  <p className='mt-3'>Version: {selectedSubmission?.version_label || 'Not available'}</p>
                  <p className='mt-2'>Submitted at: {formatDateTime(selectedSubmission?.submitted_at)}</p>
                  <p className='mt-2'>Summary: {selectedSubmission?.summary || 'No summary provided.'}</p>
                </div>

                <div className='surface-panel rounded-[24px] p-4'>
                  <p className='font-semibold text-slate-900 dark:text-white'>Video preview</p>
                  {selectedSubmission?.video_url ? (
                    <a className='mt-3 inline-flex text-sm font-semibold text-primary' href={selectedSubmission.video_url} target='_blank' rel='noreferrer'>
                      Open external video
                    </a>
                  ) : selectedSubmission?.video_file_path ? (
                    <div className='mt-3 space-y-3'>
                      <Button variant='secondary' size='sm' onClick={handleLoadVideo} disabled={isLoadingVideo}>
                        <PlayCircle className='h-4 w-4' />
                        {isLoadingVideo ? 'Loading video...' : 'Load Uploaded Video'}
                      </Button>
                      {videoSrc ? <video controls className='w-full rounded-2xl' src={videoSrc} /> : null}
                    </div>
                  ) : (
                    <p className='mt-3 text-sm text-slate-500 dark:text-slate-300'>No video attached.</p>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </PageTransition>
  );
}
