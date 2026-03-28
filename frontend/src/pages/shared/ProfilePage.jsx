import { useEffect, useState } from 'react';
import { BadgeCheck, Save, Send } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { InputField } from '../../components/InputField';
import { PageHeader } from '../../components/PageHeader';
import { PageTransition } from '../../components/PageTransition';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { profileApi, verificationApi } from '../../services/api';
import { ROLE_LABELS } from '../../utils/roles';
import { formatDateTime } from '../../utils/formatters';

function getCopy(role) {
  if (role === 'mentor') {
    return {
      eyebrow: 'Mentor Profile',
      title: 'Keep your review identity current.',
      description: 'Update the details students and admins rely on when assigning reviews and verification work.',
    };
  }

  if (role === 'admin') {
    return {
      eyebrow: 'Admin Profile',
      title: 'Manage your admin workspace details.',
      description: 'Store the information that appears across the dashboard and future audit workflows.',
    };
  }

  return {
    eyebrow: 'Student Profile',
    title: 'Keep your submission profile review-ready.',
    description: 'Update your academic details, choose your preferred work mode, and request verification from your mentor.',
  };
}

export function ProfilePage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [verificationNote, setVerificationNote] = useState('Please verify my profile for upcoming project reviews.');
  const [isSaving, setIsSaving] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      try {
        const nextProfile = await profileApi.get(user);
        if (isActive) {
          setProfile(nextProfile);
        }
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message || 'Unable to load your profile right now.');
        }
      }
    };

    if (user) {
      loadProfile();
    }

    return () => {
      isActive = false;
    };
  }, [user]);

  if (!user || !profile) {
    return (
      <PageTransition>
        <Card className='text-sm text-slate-500 dark:text-slate-300'>Loading profile...</Card>
      </PageTransition>
    );
  }

  const copy = getCopy(user.role);

  const handleChange = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      const nextProfile = await profileApi.update(user, profile);
      setProfile(nextProfile);
      pushToast({
        title: 'Profile updated',
        message: 'Your profile details were saved successfully.',
        tone: 'success',
      });
    } catch (requestError) {
      setError(requestError.message || 'Unable to save your profile right now.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerificationRequest = async () => {
    setIsRequesting(true);
    setError('');

    try {
      await verificationApi.request(user, verificationNote.trim());
      const nextProfile = await profileApi.get(user);
      setProfile(nextProfile);
      pushToast({
        title: 'Verification requested',
        message: 'Your mentor can now review your verification request.',
        tone: 'success',
      });
    } catch (requestError) {
      setError(requestError.message || 'Unable to send the verification request right now.');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <PageTransition>
      <PageHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />

      {error ? <Card className='mb-6 text-sm text-danger'>{error}</Card> : null}

      <div className='grid gap-6 xl:grid-cols-[1.08fr_0.92fr]'>
        <Card className='space-y-5'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Profile details</h3>
              <p className='mt-1 text-sm text-slate-500 dark:text-slate-300'>
                Basic information used throughout your {ROLE_LABELS[user.role].toLowerCase()} dashboard.
              </p>
            </div>
            <StatusBadge status={profile.verificationStatus} />
          </div>

          <div className='grid gap-5 md:grid-cols-2'>
            <InputField label='Full Name' value={user.name} disabled />
            <InputField label='Email Address' value={user.email} disabled />
            {user.role === 'student' ? (
              <InputField label='Roll Number' value={user.roll_no || 'Not available'} disabled />
            ) : null}
            <InputField
              label='Section'
              value={profile.section}
              onChange={(event) => handleChange('section', event.target.value)}
            />
            <InputField
              label='Department'
              value={profile.department}
              onChange={(event) => handleChange('department', event.target.value)}
            />
            <InputField
              label='Year / Cohort'
              value={profile.year}
              onChange={(event) => handleChange('year', event.target.value)}
            />
            <InputField
              label='Phone'
              value={profile.phone}
              onChange={(event) => handleChange('phone', event.target.value)}
            />
            <InputField
              label='Skills'
              value={profile.skills}
              onChange={(event) => handleChange('skills', event.target.value)}
              hint='Comma-separated skills or focus areas.'
            />
            {user.role === 'student' ? (
              <InputField
                label='Preferred Work Mode'
                options={[
                  { label: 'Team', value: 'team' },
                  { label: 'Individual', value: 'individual' },
                ]}
                value={profile.teamPreference}
                onChange={(event) => handleChange('teamPreference', event.target.value)}
              />
            ) : null}
          </div>

          <InputField
            label='Bio'
            textarea
            value={profile.bio}
            onChange={(event) => handleChange('bio', event.target.value)}
            placeholder='Write a short profile summary for your dashboard.'
          />

          <div className='flex justify-end'>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className='h-4 w-4' />
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </Card>

        <div className='space-y-6'>
          <Card className='space-y-4'>
            <div className='inline-flex rounded-2xl bg-success/10 p-3 text-success'>
              <BadgeCheck className='h-5 w-5' />
            </div>
            <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Status summary</h3>
            <div className='surface-panel rounded-[24px] p-4 text-sm text-slate-500 dark:text-slate-300'>
              <p>
                Current verification status: <span className='font-semibold text-slate-900 dark:text-white'>{profile.verificationStatus}</span>
              </p>
              <p className='mt-2'>Assigned mentor: {user.mentor_name || 'Not assigned yet'}</p>
              <p className='mt-2'>Last profile update: {formatDateTime(profile.lastUpdatedAt)}</p>
              <p className='mt-2'>Verified at: {formatDateTime(profile.verifiedAt)}</p>
            </div>
          </Card>

          {user.role === 'student' ? (
            <Card className='space-y-4'>
              <h3 className='font-display text-xl font-semibold text-slate-900 dark:text-white'>Verification request</h3>
              <p className='text-sm leading-7 text-slate-500 dark:text-slate-300'>
                Send a quick verification request to your assigned mentor once your profile details are complete.
              </p>
              <InputField
                label='Request Note'
                textarea
                value={verificationNote}
                onChange={(event) => setVerificationNote(event.target.value)}
              />
              <Button onClick={handleVerificationRequest} disabled={isRequesting || profile.verificationStatus === 'Pending'}>
                <Send className='h-4 w-4' />
                {isRequesting ? 'Sending...' : profile.verificationStatus === 'Pending' ? 'Request Pending' : 'Send Verification Request'}
              </Button>
            </Card>
          ) : null}
        </div>
      </div>
    </PageTransition>
  );
}
