import { useEffect, useState } from 'react';
import { Clapperboard, FolderUp, Link2, PenSquare, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { InputField } from '../../components/InputField';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { PageTransition } from '../../components/PageTransition';
import { useToast } from '../../hooks/useToast';
import { projectApi, teamApi } from '../../services/api';

export function SubmitProjectPage() {
  const { pushToast } = useToast();
  const [team, setTeam] = useState(null);
  const [submittedProjectName, setSubmittedProjectName] = useState('');
  const [form, setForm] = useState({
    ownerMode: 'individual',
    project: '',
    category: 'Web Application',
    repository: '',
    videoUrl: '',
    summary: '',
    archiveFile: null,
    folderFiles: [],
    videoFile: null,
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const teams = await teamApi.list();
        const activeTeam = teams[0] || null;
        setTeam(activeTeam);
        setForm((current) => ({
          ...current,
          ownerMode: activeTeam ? 'team' : 'individual',
        }));
      } catch (requestError) {
        setError(requestError.message || 'Unable to verify your team status.');
      }
    };

    loadTeam();
  }, []);

  const backendReadyAsset = Boolean(
    form.archiveFile || form.videoFile || form.repository.trim() || form.videoUrl.trim(),
  );
  const submissionModeOptions = team
    ? [
        { label: `Team submission (${team.name})`, value: 'team' },
        { label: 'Individual submission', value: 'individual' },
      ]
    : [{ label: 'Individual submission', value: 'individual' }];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('owner_mode', form.ownerMode);
      formData.append('title', form.project);
      formData.append('category', form.category);
      formData.append('summary', form.summary);
      if (form.repository.trim()) {
        formData.append('repository_url', form.repository.trim());
      }
      if (form.videoUrl.trim()) {
        formData.append('video_url', form.videoUrl.trim());
      }
      if (form.archiveFile) {
        formData.append('file', form.archiveFile);
      }
      if (form.videoFile) {
        formData.append('video_file', form.videoFile);
      }
      await projectApi.submit(formData);
      setSubmittedProjectName(form.project);
      setShowSuccess(true);
      pushToast({
        title: 'Submission queued',
        message: `${form.project} was submitted successfully for mentor review.`,
        tone: 'success',
      });
      setForm({
        ownerMode: team ? 'team' : 'individual',
        project: '',
        category: 'Web Application',
        repository: '',
        videoUrl: '',
        summary: '',
        archiveFile: null,
        folderFiles: [],
        videoFile: null,
      });
    } catch (requestError) {
      setError(requestError.message || 'Unable to submit the project right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <PageHeader
        eyebrow='Submission Desk'
        title='Create a clean handoff for your mentor.'
        description='Upload your project archive, attach demo links, and optionally preview the folder contents you are about to submit.'
      />

      {error ? <Card className='mb-6 text-sm text-danger'>{error}</Card> : null}

      <div className='grid gap-6 xl:grid-cols-[1.08fr_0.92fr]'>
        <Card className='rounded-[30px]'>
          <form className='space-y-5' onSubmit={handleSubmit}>
            <div className='grid gap-5 md:grid-cols-2'>
              <InputField
                label='Submission Mode'
                options={submissionModeOptions}
                value={form.ownerMode}
                onChange={(event) => setForm((current) => ({ ...current, ownerMode: event.target.value }))}
              />
              <InputField
                label='Category'
                options={[
                  { label: 'Web Application', value: 'Web Application' },
                  { label: 'Mobile App', value: 'Mobile App' },
                  { label: 'AI/ML System', value: 'AI/ML System' },
                  { label: 'Data Platform', value: 'Data Platform' },
                ]}
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              />
            </div>
            <InputField
              label='Project Title'
              icon={PenSquare}
              value={form.project}
              onChange={(event) => setForm((current) => ({ ...current, project: event.target.value }))}
              required
            />
            <InputField
              label='GitHub / Repository Link'
              icon={Link2}
              placeholder='https://github.com/your-team/project'
              value={form.repository}
              onChange={(event) => setForm((current) => ({ ...current, repository: event.target.value }))}
            />
            <InputField
              label='Video URL'
              icon={Clapperboard}
              placeholder='https://drive.google.com/... or public demo video link'
              value={form.videoUrl}
              onChange={(event) => setForm((current) => ({ ...current, videoUrl: event.target.value }))}
            />
            <InputField
              label='Submission Summary'
              textarea
              placeholder='Highlight what changed in this version, what the mentor should review first, and any blockers or notes.'
              value={form.summary}
              onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
              required
            />
            <div className='grid gap-5 md:grid-cols-2'>
              <label className='block space-y-2'>
                <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Project Archive (.zip)</span>
                <input
                  type='file'
                  accept='.zip'
                  className='w-full rounded-2xl border border-primary/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition dark:border-white/10 dark:bg-slate-950/50 dark:text-white'
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      archiveFile: event.target.files?.[0] || null,
                    }))
                  }
                />
                <p className='text-xs text-slate-500 dark:text-slate-400'>Current FastAPI upload flow accepts a ZIP archive.</p>
              </label>
              <label className='block space-y-2'>
                <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Demo Video File</span>
                <input
                  type='file'
                  accept='.mp4,.mov,.avi,.webm,.mkv'
                  className='w-full rounded-2xl border border-primary/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition dark:border-white/10 dark:bg-slate-950/50 dark:text-white'
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      videoFile: event.target.files?.[0] || null,
                    }))
                  }
                />
              </label>
            </div>

            <label className='block space-y-2'>
              <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Project Folder Preview</span>
              <input
                type='file'
                multiple
                webkitdirectory='true'
                className='w-full rounded-2xl border border-primary/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition dark:border-white/10 dark:bg-slate-950/50 dark:text-white'
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    folderFiles: Array.from(event.target.files || []),
                  }))
                }
              />
              <p className='text-xs text-slate-500 dark:text-slate-400'>This preview is frontend-only for now. Add a ZIP or link so the current backend can accept the submission.</p>
            </label>

            {form.folderFiles.length ? (
              <div className='surface-panel rounded-[24px] p-4'>
                <div className='mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white'>
                  <FolderUp className='h-4 w-4 text-primary' />
                  {form.folderFiles.length} file(s) selected in folder preview
                </div>
                <div className='max-h-40 space-y-2 overflow-y-auto pr-2 text-sm text-slate-500 dark:text-slate-300'>
                  {form.folderFiles.slice(0, 10).map((file) => (
                    <p key={`${file.name}-${file.size}`}>{file.webkitRelativePath || file.name}</p>
                  ))}
                  {form.folderFiles.length > 10 ? <p>...and {form.folderFiles.length - 10} more</p> : null}
                </div>
              </div>
            ) : null}

            <div className='flex flex-wrap justify-end gap-3'>
              <Button type='submit' disabled={isSubmitting || !backendReadyAsset || !form.project.trim() || !form.summary.trim()}>
                <UploadCloud className='h-4 w-4' />
                {isSubmitting ? 'Submitting...' : 'Submit Version'}
              </Button>
            </div>
          </form>
        </Card>

        <div className='space-y-6'>
          <Card className='space-y-4'>
            <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Submission checklist</h3>
            <div className='space-y-3 text-sm text-slate-500 dark:text-slate-300'>
              <div className='surface-panel rounded-2xl px-4 py-4'>Attach at least one backend-ready asset: ZIP archive, repository link, video URL, or video file.</div>
              <div className='surface-panel rounded-2xl px-4 py-4'>Use the folder picker to preview the project structure before you upload the final archive.</div>
              <div className='surface-panel rounded-2xl px-4 py-4'>Summarize feature updates and the areas that need mentor attention first.</div>
            </div>
          </Card>
          <Card className='space-y-4'>
            <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Current team</h3>
            <p className='text-sm leading-7 text-slate-500 dark:text-slate-300'>
              {team
                ? `${team.name} is ready for team submissions. Share join code ${team.join_code} with teammates if needed.`
                : 'No active team found yet. You can still submit individually.'}
            </p>
            {!team ? (
              <Link to='/student/team'>
                <Button variant='outline'>Open Team Setup</Button>
              </Link>
            ) : null}
          </Card>
        </div>
      </div>

      <Modal
        open={showSuccess}
        title='Submission queued successfully'
        description='Your latest version is ready for mentor review.'
        onClose={() => setShowSuccess(false)}
        footer={
          <div className='flex justify-end'>
            <Button onClick={() => setShowSuccess(false)}>Close</Button>
          </div>
        }
      >
        <div className='surface-panel rounded-[24px] p-5 text-sm text-slate-500 dark:text-slate-300'>
          {submittedProjectName} has been submitted successfully and will now appear in your project history as a pending review.
        </div>
      </Modal>
    </PageTransition>
  );
}
