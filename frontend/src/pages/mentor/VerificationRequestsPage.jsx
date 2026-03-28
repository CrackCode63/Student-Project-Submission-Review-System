import { useEffect, useState } from 'react';
import { BadgeCheck, XCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { PageTransition } from '../../components/PageTransition';
import { Pagination } from '../../components/Pagination';
import { SearchInput } from '../../components/SearchInput';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import { mentorApi, verificationApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

export function VerificationRequestsPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [students, setStudents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadRequests = async () => {
      try {
        const studentList = await mentorApi.students();
        const requestList = await verificationApi.listForMentor(user.id, studentList);
        if (!isActive) {
          return;
        }

        setStudents(studentList);
        setRequests(requestList);
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message || 'Unable to load verification requests.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadRequests();
    return () => {
      isActive = false;
    };
  }, [user.id]);

  const filteredRequests = requests.filter((request) =>
    `${request.studentName} ${request.rollNo} ${request.section}`.toLowerCase().includes(search.toLowerCase()),
  );
  const { currentPage, totalPages, setPage, paginatedItems } = usePagination(filteredRequests, 6);

  const handleReview = async (requestId, status) => {
    try {
      await verificationApi.review(requestId, status, user.name, students);
      const nextRequests = await verificationApi.listForMentor(user.id, students);
      setRequests(nextRequests);
      pushToast({
        title: status === 'Verified' ? 'Verification approved' : 'Verification rejected',
        message: 'The student profile status has been updated.',
        tone: status === 'Verified' ? 'success' : 'info',
      });
    } catch (requestError) {
      setError(requestError.message || 'Unable to update the verification request.');
    }
  };

  return (
    <PageTransition>
      <PageHeader
        eyebrow='Profile Verification'
        title='Approve or reject student verification requests.'
        description='Review student profile requests and update their verification badge without leaving the mentor dashboard.'
      />

      {error ? <Card className='mb-6 text-sm text-danger'>{error}</Card> : null}

      <Card className='mb-6'>
        <SearchInput
          label='Search requests'
          placeholder='Search by name, roll number, or section'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </Card>

      {isLoading ? (
        <Card className='text-sm text-slate-500 dark:text-slate-300'>Loading requests...</Card>
      ) : !filteredRequests.length ? (
        <EmptyState
          icon={BadgeCheck}
          title='No verification requests'
          description='Student requests will appear here after they submit them from the profile page.'
        />
      ) : (
        <Card className='space-y-4'>
          {paginatedItems.map((request) => (
            <div key={request.id} className='surface-panel rounded-[24px] p-4'>
              <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                <div>
                  <div className='flex flex-wrap items-center gap-3'>
                    <p className='font-semibold text-slate-900 dark:text-white'>{request.studentName}</p>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>
                    Roll No: {request.rollNo} • {request.section} • {request.department}
                  </p>
                  <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>Requested {formatDateTime(request.requestedAt)}</p>
                  <p className='mt-2 text-sm text-slate-500 dark:text-slate-300'>Note: {request.note || 'No note provided.'}</p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button size='sm' onClick={() => handleReview(request.id, 'Verified')} disabled={request.status !== 'Pending'}>
                    <BadgeCheck className='h-4 w-4' />
                    Approve
                  </Button>
                  <Button variant='outline' size='sm' onClick={() => handleReview(request.id, 'Rejected')} disabled={request.status !== 'Pending'}>
                    <XCircle className='h-4 w-4' />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </Card>
      )}
    </PageTransition>
  );
}
