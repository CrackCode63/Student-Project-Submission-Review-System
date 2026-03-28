import { useEffect, useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { InputField } from '../../components/InputField';
import { PageHeader } from '../../components/PageHeader';
import { PageTransition } from '../../components/PageTransition';
import { Pagination } from '../../components/Pagination';
import { SearchInput } from '../../components/SearchInput';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import { mentorApi, profileApi } from '../../services/api';

export function StudentListPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', rollNo: '', section: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadStudents = async () => {
      try {
        const rows = await mentorApi.students();
        const rowsWithProfile = await Promise.all(
          rows.map(async (student) => {
            const profile = await profileApi.get(student);
            return {
              ...student,
              section: profile.section || 'Section not set',
            };
          }),
        );

        if (isActive) {
          setStudents(rowsWithProfile);
        }
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message || 'Unable to load students.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadStudents();
    return () => {
      isActive = false;
    };
  }, []);

  const filteredStudents = students.filter((student) =>
    `${student.name} ${student.email} ${student.roll_no || ''} ${student.section}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const { currentPage, totalPages, setPage, paginatedItems } = usePagination(filteredStudents, 6);

  const handleAddStudent = (event) => {
    event.preventDefault();
    const nextStudent = {
      id: Date.now(),
      name: form.name,
      email: form.email,
      roll_no: form.rollNo,
      role: 'student',
      mentor_id: user.id,
      mentor_name: user.name,
      section: form.section || 'Section not set',
      team: null,
      projects: [],
    };

    setStudents((current) => [nextStudent, ...current]);
    setForm({ name: '', email: '', rollNo: '', section: '' });
    pushToast({
      title: 'Student added locally',
      message: 'This UI supports temporary roster planning even before a backend add-student endpoint exists.',
      tone: 'success',
    });
  };

  const handleRemoveStudent = (studentId, studentName) => {
    setStudents((current) => current.filter((student) => student.id !== studentId));
    pushToast({
      title: 'Student removed from roster',
      message: `${studentName} was removed from the current mentor view.`,
      tone: 'success',
    });
  };

  return (
    <PageTransition>
      <PageHeader
        eyebrow='Student Management'
        title='Track your assigned students clearly.'
        description='Search the roster, inspect team ownership, and manage a clean mentor-side student view.'
      />

      {error ? <Card className='mb-6 text-sm text-danger'>{error}</Card> : null}

      <div className='grid gap-6 xl:grid-cols-[1.05fr_0.95fr]'>
        <Card className='space-y-4'>
          <SearchInput
            label='Search students'
            placeholder='Search by name, roll number, or section'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {isLoading ? (
            <div className='text-sm text-slate-500 dark:text-slate-300'>Loading roster...</div>
          ) : !filteredStudents.length ? (
            <EmptyState
              icon={Users}
              title='No assigned students'
              description='Students assigned to you will appear here once admin mapping is complete.'
            />
          ) : (
            <div className='space-y-4'>
              {paginatedItems.map((student) => (
                <div key={student.id} className='surface-panel rounded-[24px] p-4'>
                  <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                    <div>
                      <div className='flex flex-wrap items-center gap-3'>
                        <p className='font-semibold text-slate-900 dark:text-white'>{student.name}</p>
                        <StatusBadge status={student.team ? 'Team' : 'Individual'} />
                      </div>
                      <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>
                        Roll No: {student.roll_no || 'Not available'} • Section: {student.section}
                      </p>
                      <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>Email: {student.email}</p>
                      <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>
                        Team: {student.team?.name || 'Individual'} • Projects: {student.projects?.length || 0}
                      </p>
                    </div>
                    <Button variant='outline' size='sm' onClick={() => handleRemoveStudent(student.id, student.name)}>
                      <Trash2 className='h-4 w-4' />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </Card>

        <Card className='space-y-5'>
          <div>
            <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Add student to mentor view</h3>
            <p className='mt-1 text-sm text-slate-500 dark:text-slate-300'>Use this for frontend planning before a dedicated mentor-side invite endpoint is connected.</p>
          </div>
          <form className='space-y-4' onSubmit={handleAddStudent}>
            <InputField
              label='Student Name'
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
            <InputField
              label='Email'
              type='email'
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
            />
            <div className='grid gap-4 md:grid-cols-2'>
              <InputField
                label='Roll Number'
                value={form.rollNo}
                onChange={(event) => setForm((current) => ({ ...current, rollNo: event.target.value }))}
                required
              />
              <InputField
                label='Section'
                value={form.section}
                onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))}
              />
            </div>
            <Button type='submit' disabled={!form.name.trim() || !form.email.trim() || !form.rollNo.trim()}>
              <Plus className='h-4 w-4' />
              Add Student
            </Button>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
}
