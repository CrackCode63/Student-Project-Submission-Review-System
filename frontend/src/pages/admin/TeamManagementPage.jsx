import { useEffect, useState } from 'react';
import { ShieldCheck, Users } from 'lucide-react';
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
import { adminApi, authApi } from '../../services/api';

export function TeamManagementPage() {
  const { pushToast } = useToast();
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [bulkMentorId, setBulkMentorId] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadTeams = async () => {
      try {
        const [teamList, studentList, mentorList] = await Promise.all([
          adminApi.teams(),
          adminApi.students(),
          authApi.mentors(),
        ]);
        if (!isActive) {
          return;
        }

        setTeams(teamList);
        setStudents(studentList);
        setMentors(mentorList);
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message || 'Unable to load teams.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadTeams();
    return () => {
      isActive = false;
    };
  }, []);

  const filteredTeams = teams.filter((team) => `${team.name} ${team.description || ''}`.toLowerCase().includes(search.toLowerCase()));
  const { currentPage, totalPages, setPage, paginatedItems } = usePagination(filteredTeams, 5);

  const mentorOptions = mentors.map((mentor) => ({ label: mentor.name, value: String(mentor.id) }));

  const handleTeamMentorChange = (teamId, mentorId) => {
    const mentor = mentors.find((item) => item.id === Number(mentorId));
    setTeams((current) =>
      current.map((team) =>
        team.id === teamId
          ? { ...team, mentor_id: mentor?.id || null, mentor_name: mentor?.name || 'Not assigned' }
          : team,
      ),
    );
  };

  const handleToggleMember = (teamId, student) => {
    setTeams((current) =>
      current.map((team) => {
        if (team.id !== teamId) {
          return team;
        }

        const exists = team.members.some((member) => member.user_id === student.id);
        const nextMembers = exists
          ? team.members.filter((member) => member.user_id !== student.id)
          : [
              ...team.members,
              {
                user_id: student.id,
                name: student.name,
                email: student.email,
                role: student.role,
                roll_no: student.roll_no,
                mentor_id: student.mentor_id,
                mentor_name: student.mentor_name,
                is_lead: false,
                joined_at: new Date().toISOString(),
              },
            ];

        return {
          ...team,
          members: nextMembers,
          member_count: nextMembers.length,
        };
      }),
    );
  };

  const handleBulkAssign = () => {
    if (!bulkMentorId || !selectedTeamIds.length) {
      return;
    }

    const mentor = mentors.find((item) => item.id === Number(bulkMentorId));
    setTeams((current) =>
      current.map((team) =>
        selectedTeamIds.includes(team.id)
          ? { ...team, mentor_id: mentor?.id || null, mentor_name: mentor?.name || 'Not assigned' }
          : team,
      ),
    );
    pushToast({
      title: 'Bulk mentor assignment saved locally',
      message: 'These team mentor updates are reflected in the frontend immediately.',
      tone: 'success',
    });
    setSelectedTeamIds([]);
    setBulkMentorId('');
  };

  return (
    <PageTransition>
      <PageHeader
        eyebrow='Team Management'
        title='Adjust members and mentor coverage for every team.'
        description='Update team composition, assign mentors to one or many teams, and keep collaboration data organized.'
      />

      {error ? <Card className='mb-6 text-sm text-danger'>{error}</Card> : null}

      <Card className='mb-6 space-y-4'>
        <div className='grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end'>
          <SearchInput
            label='Search teams'
            placeholder='Search by team name'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <label className='block space-y-2'>
            <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Bulk assign mentor</span>
            <select
              value={bulkMentorId}
              onChange={(event) => setBulkMentorId(event.target.value)}
              className='w-full rounded-2xl border border-primary/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition dark:border-white/10 dark:bg-slate-950/50 dark:text-white'
            >
              <option value=''>Select mentor</option>
              {mentorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <Button onClick={handleBulkAssign} disabled={!bulkMentorId || !selectedTeamIds.length}>
            <ShieldCheck className='h-4 w-4' />
            Apply to Selected
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <Card className='text-sm text-slate-500 dark:text-slate-300'>Loading teams...</Card>
      ) : !filteredTeams.length ? (
        <EmptyState icon={Users} title='No teams found' description='Teams will appear here once students create them.' />
      ) : (
        <div className='space-y-6'>
          {paginatedItems.map((team) => (
            <Card key={team.id} className='space-y-5'>
              <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                <div>
                  <div className='flex flex-wrap items-center gap-3'>
                    <input
                      type='checkbox'
                      checked={selectedTeamIds.includes(team.id)}
                      onChange={(event) =>
                        setSelectedTeamIds((current) =>
                          event.target.checked ? [...current, team.id] : current.filter((id) => id !== team.id),
                        )
                      }
                    />
                    <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>{team.name}</h3>
                    <StatusBadge status='Team' />
                  </div>
                  <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>{team.description || 'No description provided.'}</p>
                  <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>Join code: {team.join_code}</p>
                </div>
                <div className='min-w-[220px]'>
                  <label className='block space-y-2'>
                    <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Mentor</span>
                    <select
                      value={team.mentor_id ? String(team.mentor_id) : ''}
                      onChange={(event) => handleTeamMentorChange(team.id, event.target.value)}
                      className='w-full rounded-2xl border border-primary/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition dark:border-white/10 dark:bg-slate-950/50 dark:text-white'
                    >
                      <option value=''>Not assigned</option>
                      {mentorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className='grid gap-6 xl:grid-cols-2'>
                <div className='space-y-3'>
                  <p className='font-semibold text-slate-900 dark:text-white'>Current members</p>
                  {team.members.map((member) => (
                    <div key={member.user_id} className='surface-panel rounded-[24px] p-4 text-sm text-slate-500 dark:text-slate-300'>
                      <p className='font-semibold text-slate-900 dark:text-white'>{member.name}</p>
                      <p className='mt-1'>{member.roll_no || member.email}</p>
                    </div>
                  ))}
                </div>
                <div className='space-y-3'>
                  <p className='font-semibold text-slate-900 dark:text-white'>Modify members</p>
                  <div className='grid gap-3 sm:grid-cols-2'>
                    {students.map((student) => {
                      const checked = team.members.some((member) => member.user_id === student.id);
                      return (
                        <label key={student.id} className='surface-panel flex items-start gap-3 rounded-[24px] p-4 text-sm text-slate-500 dark:text-slate-300'>
                          <input type='checkbox' checked={checked} onChange={() => handleToggleMember(team.id, student)} />
                          <span>
                            <span className='block font-semibold text-slate-900 dark:text-white'>{student.name}</span>
                            <span className='mt-1 block'>{student.roll_no || student.email}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          <Card className='py-4'>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </Card>
        </div>
      )}
    </PageTransition>
  );
}
