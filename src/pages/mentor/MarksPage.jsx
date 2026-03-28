import { useEffect, useState } from 'react';
import { ClipboardList, Save } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { InputField } from '../../components/InputField';
import { PageHeader } from '../../components/PageHeader';
import { PageTransition } from '../../components/PageTransition';
import { SearchInput } from '../../components/SearchInput';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../hooks/useToast';
import { marksApi, projectApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

const defaultForm = {
  innovation: 20,
  execution: 20,
  presentation: 20,
  remarks: '',
};

export function MarksPage() {
  const { pushToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [marks, setMarks] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadMarks = async () => {
      try {
        const [projectList, markList] = await Promise.all([projectApi.list(), marksApi.list()]);
        if (!isActive) {
          return;
        }

        setProjects(projectList.filter((project) => !project.is_deleted));
        setMarks(markList);
        setSelectedProjectId(projectList[0]?.id || null);
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message || 'Unable to load projects and marks.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadMarks();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const existingMark = marks.find((item) => item.project_id === selectedProjectId);
    if (existingMark) {
      setForm({
        innovation: existingMark.innovation,
        execution: existingMark.execution,
        presentation: existingMark.presentation,
        remarks: existingMark.remarks || '',
      });
    } else {
      setForm(defaultForm);
    }
  }, [marks, selectedProjectId]);

  const filteredProjects = projects.filter((project) =>
    `${project.title} ${project.owner_display_name}`.toLowerCase().includes(search.toLowerCase()),
  );
  const selectedProject = filteredProjects.find((project) => project.id === selectedProjectId) || projects.find((project) => project.id === selectedProjectId) || null;
  const total = Number(form.innovation) + Number(form.execution) + Number(form.presentation);

  const handleSave = async () => {
    if (!selectedProjectId) {
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const nextMark = await marksApi.assign({
        project_id: selectedProjectId,
        innovation: Number(form.innovation),
        execution: Number(form.execution),
        presentation: Number(form.presentation),
        remarks: form.remarks,
      });
      setMarks((current) => {
        const remaining = current.filter((item) => item.project_id !== selectedProjectId);
        return [nextMark, ...remaining];
      });
      pushToast({
        title: 'Marks saved',
        message: `Marks for ${selectedProject?.title || 'the selected project'} were published successfully.`,
        tone: 'success',
      });
    } catch (requestError) {
      setError(requestError.message || 'Unable to save marks right now.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageTransition>
      <PageHeader
        eyebrow='Marks Console'
        title='Publish structured marks with less friction.'
        description='Select a project, fill in rubric scores, and save remarks so students can immediately see the published result.'
      />

      {error ? <Card className='mb-6 text-sm text-danger'>{error}</Card> : null}

      <div className='grid gap-6 xl:grid-cols-[0.95fr_1.05fr]'>
        <Card className='space-y-4'>
          <SearchInput
            label='Search projects'
            placeholder='Search by project or owner name'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {isLoading ? (
            <div className='text-sm text-slate-500 dark:text-slate-300'>Loading projects...</div>
          ) : !filteredProjects.length ? (
            <EmptyState
              icon={ClipboardList}
              title='No projects found'
              description='Projects assigned to you will appear here once submissions are available.'
            />
          ) : (
            <div className='space-y-3'>
              {filteredProjects.map((project) => {
                const projectMark = marks.find((item) => item.project_id === project.id);
                return (
                  <button
                    key={project.id}
                    type='button'
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`surface-panel w-full rounded-[24px] p-4 text-left transition ${
                      selectedProjectId === project.id ? 'ring-2 ring-primary/20' : ''
                    }`}
                  >
                    <div className='flex items-start justify-between gap-4'>
                      <div>
                        <p className='font-semibold text-slate-900 dark:text-white'>{project.title}</p>
                        <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>{project.owner_display_name}</p>
                      </div>
                      {projectMark ? <StatusBadge status='Approved' /> : <StatusBadge status='Pending' />}
                    </div>
                    {projectMark ? (
                      <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>Last updated {formatDateTime(projectMark.updated_at)}</p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card className='space-y-5'>
          {selectedProject ? (
            <>
              <div>
                <div className='flex flex-wrap items-center gap-3'>
                  <h3 className='font-display text-2xl font-semibold text-slate-900 dark:text-white'>{selectedProject.title}</h3>
                  <StatusBadge status={selectedProject.latest_submission?.status || 'Pending'} />
                </div>
                <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>
                  {selectedProject.owner_display_name} • Mentor {selectedProject.mentor_name || 'Not assigned'}
                </p>
              </div>

              <div className='grid gap-4 md:grid-cols-3'>
                <InputField
                  label='Innovation'
                  type='number'
                  min='0'
                  max='30'
                  value={form.innovation}
                  onChange={(event) => setForm((current) => ({ ...current, innovation: event.target.value }))}
                />
                <InputField
                  label='Execution'
                  type='number'
                  min='0'
                  max='40'
                  value={form.execution}
                  onChange={(event) => setForm((current) => ({ ...current, execution: event.target.value }))}
                />
                <InputField
                  label='Presentation'
                  type='number'
                  min='0'
                  max='30'
                  value={form.presentation}
                  onChange={(event) => setForm((current) => ({ ...current, presentation: event.target.value }))}
                />
              </div>

              <InputField
                label='Remarks'
                textarea
                value={form.remarks}
                onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))}
              />

              <div className='surface-panel rounded-[24px] p-4 text-sm text-slate-500 dark:text-slate-300'>
                Total marks: <span className='font-semibold text-slate-900 dark:text-white'>{total}</span>
              </div>

              <Button onClick={handleSave} disabled={isSaving}>
                <Save className='h-4 w-4' />
                {isSaving ? 'Saving...' : 'Save Marks'}
              </Button>
            </>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title='Select a project'
              description='Choose a project from the list to publish or update marks.'
            />
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
