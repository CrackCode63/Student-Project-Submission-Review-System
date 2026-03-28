import { useEffect, useState } from 'react';
import { GraduationCap, Trash2, UserPlus } from 'lucide-react';
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
import { adminApi, authApi } from '../../services/api';

export function UserManagementPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [users, setUsers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [mentorSelections, setMentorSelections] = useState({});
  const [mentorForm, setMentorForm] = useState({ name: '', email: '', password: '' });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState({});
  const [isAddingMentor, setIsAddingMentor] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadUsers = async () => {
      try {
        const [studentList, mentorList] = await Promise.all([adminApi.students(), authApi.mentors()]);
        if (!isActive) {
          return;
        }

        const nextUsers = [
          user,
          ...mentorList.map((mentor) => ({ ...mentor, role: 'mentor', created_at: mentor.created_at || null })),
          ...studentList,
        ].filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index);

        setUsers(nextUsers);
        setMentors(mentorList);
        setMentorSelections(
          studentList.reduce((accumulator, studentRow) => {
            accumulator[studentRow.id] = studentRow.mentor_id ? String(studentRow.mentor_id) : '';
            return accumulator;
          }, {}),
        );
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message || 'Unable to load users.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadUsers();
    return () => {
      isActive = false;
    };
  }, [user]);

  const filteredUsers = users.filter((item) => {
    const matchesSearch = `${item.name} ${item.email} ${item.roll_no || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || item.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const { currentPage, totalPages, setPage, paginatedItems } = usePagination(filteredUsers, 6);

  const handleAssignMentor = async (studentId) => {
    const mentorId = mentorSelections[studentId];
    if (!mentorId) {
      return;
    }

    setIsSaving((current) => ({ ...current, [studentId]: true }));

    try {
      const updatedStudent = await adminApi.assignMentor(studentId, Number(mentorId));
      setUsers((current) => current.map((item) => (item.id === studentId ? updatedStudent : item)));
      pushToast({
        title: 'Mentor assigned',
        message: `Mentor updated for ${updatedStudent.name}.`,
        tone: 'success',
      });
    } catch (requestError) {
      setError(requestError.message || 'Unable to assign mentor right now.');
    } finally {
      setIsSaving((current) => ({ ...current, [studentId]: false }));
    }
  };

  const handleRemoveUser = (userId, userName) => {
    setUsers((current) => current.filter((item) => item.id !== userId));
    pushToast({
      title: 'User removed locally',
      message: `${userName} was removed from the current admin view. Connect a backend delete endpoint to make this permanent.`,
      tone: 'info',
    });
  };

  const handleCreateMentor = async (event) => {
    event.preventDefault();
    setIsAddingMentor(true);
    setError('');

    try {
      const response = await authApi.register({
        name: mentorForm.name,
        email: mentorForm.email,
        password: mentorForm.password,
        role: 'mentor',
      });
      setUsers((current) => [...current, response.user]);
      setMentors((current) => [...current, response.user]);
      setMentorForm({ name: '', email: '', password: '' });
      pushToast({
        title: 'Mentor created',
        message: `${response.user.name} can now be assigned to students and teams.`,
        tone: 'success',
      });
    } catch (requestError) {
      setError(requestError.message || 'Unable to create mentor account.');
    } finally {
      setIsAddingMentor(false);
    }
  };

  const mentorOptions = [{ label: 'Select mentor', value: '' }].concat(
    mentors.map((mentor) => ({
      label: `${mentor.name} (${mentor.email})`,
      value: String(mentor.id),
    })),
  );

  return (
    <PageTransition>
      <PageHeader
        eyebrow='User Management'
        title='Manage students, mentors, and assignments.'
        description='Search all visible users, add new mentor accounts, and update mentor mapping for each student.'
      />

      {error ? <Card className='mb-6 text-sm text-danger'>{error}</Card> : null}

      <div className='grid gap-6 xl:grid-cols-[1.08fr_0.92fr]'>
        <Card className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-[1fr_180px]'>
            <SearchInput
              label='Search users'
              placeholder='Search by name, email, or roll number'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <label className='block space-y-2'>
              <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Role</span>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className='w-full rounded-2xl border border-primary/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition dark:border-white/10 dark:bg-slate-950/50 dark:text-white'
              >
                {['All', 'student', 'mentor', 'admin'].map((item) => (
                  <option key={item} value={item}>
                    {item === 'All' ? 'All roles' : item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading ? (
            <div className='text-sm text-slate-500 dark:text-slate-300'>Loading users...</div>
          ) : !filteredUsers.length ? (
            <EmptyState
              icon={GraduationCap}
              title='No users found'
              description='Try another search or role filter.'
            />
          ) : (
            <div className='space-y-4'>
              {paginatedItems.map((item) => (
                <div key={item.id} className='surface-panel rounded-[24px] p-4'>
                  <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                    <div className='min-w-0 flex-1'>
                      <div className='flex flex-wrap items-center gap-3'>
                        <p className='font-semibold text-slate-900 dark:text-white'>{item.name}</p>
                        <StatusBadge status={item.role === 'student' ? 'Active' : item.role === 'mentor' ? 'Available' : 'Verified'} />
                      </div>
                      <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>{item.email}</p>
                      <p className='mt-2 text-sm capitalize text-slate-500 dark:text-slate-300'>Role: {item.role}</p>
                      {item.role === 'student' ? (
                        <div className='mt-4 grid gap-3 lg:grid-cols-[240px_auto] lg:items-end'>
                          <InputField
                            label='Assigned Mentor'
                            options={mentorOptions}
                            value={mentorSelections[item.id] || ''}
                            onChange={(event) =>
                              setMentorSelections((current) => ({
                                ...current,
                                [item.id]: event.target.value,
                              }))
                            }
                          />
                          <Button onClick={() => handleAssignMentor(item.id)} disabled={isSaving[item.id] || !mentorSelections[item.id]}>
                            {isSaving[item.id] ? 'Saving...' : 'Assign Mentor'}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    {item.id !== user.id ? (
                      <Button variant='outline' size='sm' onClick={() => handleRemoveUser(item.id, item.name)}>
                        <Trash2 className='h-4 w-4' />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </Card>

        <Card className='space-y-5'>
          <div>
            <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Add mentor</h3>
            <p className='mt-1 text-sm text-slate-500 dark:text-slate-300'>Create a mentor account directly from the admin console.</p>
          </div>
          <form className='space-y-4' onSubmit={handleCreateMentor}>
            <InputField
              label='Mentor Name'
              value={mentorForm.name}
              onChange={(event) => setMentorForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
            <InputField
              label='Email'
              type='email'
              value={mentorForm.email}
              onChange={(event) => setMentorForm((current) => ({ ...current, email: event.target.value }))}
              required
            />
            <InputField
              label='Password'
              type='password'
              value={mentorForm.password}
              onChange={(event) => setMentorForm((current) => ({ ...current, password: event.target.value }))}
              required
            />
            <Button type='submit' disabled={isAddingMentor || !mentorForm.name.trim() || !mentorForm.email.trim() || !mentorForm.password.trim()}>
              <UserPlus className='h-4 w-4' />
              {isAddingMentor ? 'Creating...' : 'Create Mentor'}
            </Button>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
}
