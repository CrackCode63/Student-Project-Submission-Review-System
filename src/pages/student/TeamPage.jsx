import { useEffect, useState } from 'react';
import { Plus, UserPlus, Users } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { InputField } from '../../components/InputField';
import { PageHeader } from '../../components/PageHeader';
import { PageTransition } from '../../components/PageTransition';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { profileApi, teamApi } from '../../services/api';

export function TeamPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [team, setTeam] = useState(null);
  const [profile, setProfile] = useState(null);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isSavingMode, setIsSavingMode] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadTeamPage = async () => {
      try {
        const [teamList, nextProfile] = await Promise.all([teamApi.list(), profileApi.get(user)]);
        if (!isActive) {
          return;
        }

        setTeam(teamList[0] || null);
        setProfile(nextProfile);
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message || 'Unable to load team information.');
        }
      }
    };

    loadTeamPage();
    return () => {
      isActive = false;
    };
  }, [user]);

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    setIsCreating(true);
    setError('');

    try {
      const nextTeam = await teamApi.create(createForm);
      setTeam(nextTeam);
      setCreateForm({ name: '', description: '' });
      pushToast({
        title: 'Team created',
        message: `${nextTeam.name} is now ready for project submissions.`,
        tone: 'success',
      });
    } catch (requestError) {
      setError(requestError.message || 'Unable to create the team right now.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinTeam = async (event) => {
    event.preventDefault();
    setIsJoining(true);
    setError('');

    try {
      const nextTeam = await teamApi.join({ join_code: joinCode.trim().toUpperCase() });
      setTeam(nextTeam);
      setJoinCode('');
      pushToast({
        title: 'Joined team',
        message: `You are now part of ${nextTeam.name}.`,
        tone: 'success',
      });
    } catch (requestError) {
      setError(requestError.message || 'Unable to join that team right now.');
    } finally {
      setIsJoining(false);
    }
  };

  const handlePreferenceChange = async (value) => {
    setIsSavingMode(true);
    setError('');

    try {
      const nextProfile = await profileApi.update(user, { ...profile, teamPreference: value });
      setProfile(nextProfile);
      pushToast({
        title: 'Preference saved',
        message: `Preferred work mode updated to ${value}.`,
        tone: 'success',
      });
    } catch (requestError) {
      setError(requestError.message || 'Unable to save your preference.');
    } finally {
      setIsSavingMode(false);
    }
  };

  return (
    <PageTransition>
      <PageHeader
        eyebrow='Team Workspace'
        title='Choose how you want to collaborate.'
        description='Create a team, join one with a code, or stay in individual mode. Your submission flow can support both.'
      />

      {error ? <Card className='mb-6 text-sm text-danger'>{error}</Card> : null}

      <div className='grid gap-6 xl:grid-cols-[1.06fr_0.94fr]'>
        <Card className='space-y-5'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Preferred mode</h3>
              <p className='mt-1 text-sm text-slate-500 dark:text-slate-300'>Set the mode that best fits your workflow.</p>
            </div>
            <StatusBadge status={team ? 'Team' : 'Individual'} />
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            {['team', 'individual'].map((mode) => (
              <button
                key={mode}
                type='button'
                onClick={() => handlePreferenceChange(mode)}
                disabled={isSavingMode}
                className={`surface-panel rounded-[24px] border px-4 py-4 text-left transition ${
                  profile?.teamPreference === mode ? 'border-primary/40 ring-2 ring-primary/20' : 'border-transparent'
                }`}
              >
                <p className='font-semibold capitalize text-slate-900 dark:text-white'>{mode}</p>
                <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>
                  {mode === 'team' ? 'Ideal when you are sharing ownership and review responsibility.' : 'Best when you want full individual ownership.'}
                </p>
              </button>
            ))}
          </div>
        </Card>

        {team ? (
          <Card className='space-y-4'>
            <div className='inline-flex rounded-2xl bg-primary/10 p-3 text-primary'>
              <Users className='h-5 w-5' />
            </div>
            <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Current team</h3>
            <div className='surface-panel rounded-[24px] p-4'>
              <p className='font-semibold text-slate-900 dark:text-white'>{team.name}</p>
              <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>{team.description || 'No description added yet.'}</p>
              <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>Join code: {team.join_code}</p>
              <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>Mentor: {team.mentor_name || user.mentor_name || 'Not assigned yet'}</p>
            </div>
          </Card>
        ) : null}
      </div>

      <div className='mt-6 grid gap-6 xl:grid-cols-2'>
        {team ? (
          <Card className='space-y-4'>
            <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Members</h3>
            <div className='space-y-3'>
              {team.members.map((member) => (
                <div key={member.user_id} className='surface-panel rounded-[24px] p-4'>
                  <div className='flex items-center justify-between gap-3'>
                    <div>
                      <p className='font-semibold text-slate-900 dark:text-white'>{member.name}</p>
                      <p className='mt-1 text-sm text-slate-500 dark:text-slate-300'>
                        {member.roll_no || member.email}
                      </p>
                    </div>
                    <StatusBadge status={member.is_lead ? 'Active' : 'Available'} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <EmptyState
            icon={Users}
            title='No team yet'
            description='You can keep working individually or set up a team workspace for collaborative submissions.'
          />
        )}

        <div className='space-y-6'>
          {!team ? (
            <>
              <Card className='space-y-5'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-2xl bg-primary/10 p-3 text-primary'>
                    <Plus className='h-5 w-5' />
                  </div>
                  <div>
                    <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Create team</h3>
                    <p className='text-sm text-slate-500 dark:text-slate-300'>Start a new team and invite members with a join code.</p>
                  </div>
                </div>
                <form className='space-y-4' onSubmit={handleCreateTeam}>
                  <InputField
                    label='Team Name'
                    value={createForm.name}
                    onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
                    required
                  />
                  <InputField
                    label='Description'
                    textarea
                    value={createForm.description}
                    onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
                  />
                  <Button type='submit' disabled={isCreating || !createForm.name.trim()}>
                    <Plus className='h-4 w-4' />
                    {isCreating ? 'Creating...' : 'Create Team'}
                  </Button>
                </form>
              </Card>

              <Card className='space-y-5'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-2xl bg-accent/10 p-3 text-accent'>
                    <UserPlus className='h-5 w-5' />
                  </div>
                  <div>
                    <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Join team</h3>
                    <p className='text-sm text-slate-500 dark:text-slate-300'>Use a join code shared by your teammate.</p>
                  </div>
                </div>
                <form className='space-y-4' onSubmit={handleJoinTeam}>
                  <InputField
                    label='Join Code'
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                    required
                  />
                  <Button type='submit' variant='secondary' disabled={isJoining || !joinCode.trim()}>
                    <UserPlus className='h-4 w-4' />
                    {isJoining ? 'Joining...' : 'Join Team'}
                  </Button>
                </form>
              </Card>
            </>
          ) : (
            <Card className='space-y-4'>
              <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Team tips</h3>
              <div className='space-y-3 text-sm text-slate-500 dark:text-slate-300'>
                <div className='surface-panel rounded-[24px] p-4'>Share your join code only with teammates assigned to the same mentor.</div>
                <div className='surface-panel rounded-[24px] p-4'>Use team submission mode for shared projects so feedback and marks stay visible to everyone.</div>
                <div className='surface-panel rounded-[24px] p-4'>You can still switch your preferred work mode anytime from this page.</div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
