import { useEffect, useState } from 'react';
import { ClipboardCheck, Download, Laptop2, MessageSquarePlus, PlayCircle, RefreshCcw } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { InputField } from '../../components/InputField';
import { PageHeader } from '../../components/PageHeader';
import { PageTransition } from '../../components/PageTransition';
import { SearchInput } from '../../components/SearchInput';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../hooks/useToast';
import { feedbackApi, frontendControlApi, projectApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

export function ReviewProjectsPage() {
  const { pushToast } = useToast();
  const [reviewQueue, setReviewQueue] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [comment, setComment] = useState('');
  const [statusValue, setStatusValue] = useState('Pending');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [videoSrc, setVideoSrc] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [error, setError] = useState('');

  const loadQueue = async (preserveSelection = true) => {
    const queueList = await projectApi.reviewQueue();
    setReviewQueue(queueList);

    if (!preserveSelection || !selectedProjectId) {
      setSelectedProjectId(queueList[0]?.project_id || null);
      return;
    }

    const selectedStillExists = queueList.find((item) => item.project_id === selectedProjectId);
    if (!selectedStillExists) {
      setSelectedProjectId(queueList[0]?.project_id || null);
    }
  };

  useEffect(() => {
    let isActive = true;

    const bootstrap = async () => {
      try {
        const queueList = await projectApi.reviewQueue();
        if (!isActive) {
          return;
        }

        setReviewQueue(queueList);
        setSelectedProjectId(queueList[0]?.project_id || null);
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message || 'Unable to load the review queue.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    bootstrap();
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
        setStatusValue(details.submissions[0]?.status || 'Pending');
        setVideoSrc('');
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message || 'Unable to load review details.');
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

  const filteredQueue = reviewQueue.filter((item) => {
    const matchesSearch = `${item.project_title} ${item.owner_display_name} ${item.team_name || ''}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedSubmission = selectedDetails?.submissions?.[0] || null;

  const handleDownload = () => {
    const url = selectedSubmission?.repository_url || selectedDetails?.project?.repository_url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    pushToast({
      title: 'Download endpoint needed',
      message: 'A direct project-download route can be connected here when the backend exposes one.',
      tone: 'info',
    });
  };

  const handleOpenIde = async () => {
    const response = await frontendControlApi.openInIde();
    pushToast({
      title: 'Open in IDE',
      message: response.message,
      tone: 'info',
    });
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
      setError(requestError.message || 'Unable to load the uploaded video.');
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedSubmission || !comment.trim()) {
      return;
    }

    setIsSubmittingComment(true);
    setError('');

    try {
      await feedbackApi.create({
        submission_id: selectedSubmission.id,
        comment: comment.trim(),
      });
      const nextDetails = await projectApi.details(selectedProjectId);
      setSelectedDetails(nextDetails);
      setComment('');
      pushToast({
        title: 'Feedback added',
        message: 'Your comment is now visible to the student team.',
        tone: 'success',
      });
    } catch (requestError) {
      setError(requestError.message || 'Unable to add feedback right now.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedSubmission) {
      return;
    }

    setIsUpdatingStatus(true);
    setError('');

    try {
      await projectApi.updateStatus(selectedSubmission.id, statusValue);
      await loadQueue();
      const nextDetails = await projectApi.details(selectedProjectId);
      setSelectedDetails(nextDetails);
      pushToast({
        title: 'Status updated',
        message: `Submission status changed to ${statusValue}.`,
        tone: 'success',
      });
    } catch (requestError) {
      setError(requestError.message || 'Unable to update project status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <PageTransition>
      <PageHeader
        eyebrow='Project Review'
        title='Review files, comment clearly, and move status forward.'
        description='Use the queue to inspect latest versions, load uploaded videos, and publish review decisions without leaving the dashboard.'
      />

      {error ? <Card className='mb-6 text-sm text-danger'>{error}</Card> : null}

      <Card className='mb-6 space-y-4'>
        <div className='grid gap-4 md:grid-cols-[1fr_220px]'>
          <SearchInput
            label='Search queue'
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
        <Card className='text-sm text-slate-500 dark:text-slate-300'>Loading review queue...</Card>
      ) : !filteredQueue.length ? (
        <EmptyState
          icon={RefreshCcw}
          title='Review queue is empty'
          description='New submissions assigned to you will appear here once students upload them.'
        />
      ) : (
        <div className='grid gap-6 xl:grid-cols-[0.92fr_1.08fr]'>
          <div className='space-y-4'>
            {filteredQueue.map((item) => (
              <Card key={item.submission_id} className='space-y-3'>
                <button type='button' className='w-full text-left' onClick={() => setSelectedProjectId(item.project_id)}>
                  <div className='flex items-start justify-between gap-4'>
                    <div>
                      <p className='font-semibold text-slate-900 dark:text-white'>{item.project_title}</p>
                      <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>{item.owner_display_name}</p>
                      <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>{formatDateTime(item.submitted_at)}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </button>
              </Card>
            ))}
          </div>

          <Card className='space-y-5'>
            {isDetailLoading ? (
              <div className='text-sm text-slate-500 dark:text-slate-300'>Loading review details...</div>
            ) : !selectedDetails ? (
              <EmptyState
                icon={ClipboardCheck}
                title='Select a project'
                description='Choose a queue item to inspect versions, files, and feedback.'
              />
            ) : (
              <>
                <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                  <div>
                    <div className='flex flex-wrap items-center gap-3'>
                      <h3 className='font-display text-2xl font-semibold text-slate-900 dark:text-white'>
                        {selectedDetails.project.title}
                      </h3>
                      <StatusBadge status={selectedSubmission?.status || 'Pending'} />
                    </div>
                    <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>
                      Owner: {selectedDetails.project.owner_display_name} • Version {selectedSubmission?.version_label}
                    </p>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Button variant='secondary' size='sm' onClick={handleDownload}>
                      <Download className='h-4 w-4' />
                      Download
                    </Button>
                    <Button variant='secondary' size='sm' onClick={handleOpenIde}>
                      <Laptop2 className='h-4 w-4' />
                      Open in IDE
                    </Button>
                  </div>
                </div>

                <div className='grid gap-6 xl:grid-cols-[1fr_0.92fr]'>
                  <div className='space-y-4'>
                    <div className='surface-panel rounded-[24px] p-4 text-sm text-slate-500 dark:text-slate-300'>
                      <p className='font-semibold text-slate-900 dark:text-white'>Submission summary</p>
                      <p className='mt-3'>{selectedSubmission?.summary}</p>
                    </div>
                    <div className='surface-panel rounded-[24px] p-4'>
                      <p className='font-semibold text-slate-900 dark:text-white'>Video</p>
                      {selectedSubmission?.video_url ? (
                        <a className='mt-3 inline-flex text-sm font-semibold text-primary' href={selectedSubmission.video_url} target='_blank' rel='noreferrer'>
                          Open external demo video
                        </a>
                      ) : selectedSubmission?.video_file_path ? (
                        <div className='mt-3 space-y-3'>
                          <Button variant='secondary' size='sm' onClick={handleLoadVideo} disabled={isLoadingVideo}>
                            <PlayCircle className='h-4 w-4' />
                            {isLoadingVideo ? 'Loading video...' : 'Load uploaded video'}
                          </Button>
                          {videoSrc ? <video controls className='w-full rounded-2xl' src={videoSrc} /> : null}
                        </div>
                      ) : (
                        <p className='mt-3 text-sm text-slate-500 dark:text-slate-300'>No video attached.</p>
                      )}
                    </div>
                    <div className='surface-panel rounded-[24px] p-4'>
                      <p className='font-semibold text-slate-900 dark:text-white'>Feedback history</p>
                      <div className='mt-3 space-y-3'>
                        {(selectedSubmission?.feedback || []).length ? (
                          selectedSubmission.feedback.map((item) => (
                            <div key={item.id} className='rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-600 dark:bg-slate-950/40 dark:text-slate-300'>
                              <span className='font-semibold text-slate-900 dark:text-white'>{item.mentor_name}: </span>
                              {item.comment}
                            </div>
                          ))
                        ) : (
                          <p className='text-sm text-slate-500 dark:text-slate-300'>No feedback added yet.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <Card className='space-y-4' hover={false}>
                      <p className='font-semibold text-slate-900 dark:text-white'>Add feedback</p>
                      <InputField
                        label='Comment'
                        textarea
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        placeholder='Add a clear review comment for the student team.'
                      />
                      <Button onClick={handleAddComment} disabled={isSubmittingComment || !comment.trim()}>
                        <MessageSquarePlus className='h-4 w-4' />
                        {isSubmittingComment ? 'Saving...' : 'Add Comment'}
                      </Button>
                    </Card>

                    <Card className='space-y-4' hover={false}>
                      <p className='font-semibold text-slate-900 dark:text-white'>Update status</p>
                      <label className='block space-y-2'>
                        <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Decision</span>
                        <select
                          value={statusValue}
                          onChange={(event) => setStatusValue(event.target.value)}
                          className='w-full rounded-2xl border border-primary/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition dark:border-white/10 dark:bg-slate-950/50 dark:text-white'
                        >
                          {['Pending', 'Approved', 'Changes Required'].map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Button onClick={handleUpdateStatus} disabled={isUpdatingStatus}>
                        {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                      </Button>
                    </Card>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </PageTransition>
  );
}

