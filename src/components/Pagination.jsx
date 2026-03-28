import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className='flex flex-wrap items-center justify-between gap-3'>
      <p className='text-sm text-slate-500 dark:text-slate-300'>
        Page {currentPage} of {totalPages}
      </p>
      <div className='flex items-center gap-2'>
        <Button variant='secondary' size='sm' onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          <ChevronLeft className='h-4 w-4' />
          Previous
        </Button>
        <Button variant='secondary' size='sm' onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          Next
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
