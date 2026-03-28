import { useEffect, useState } from 'react';
import { clampNumber, paginateItems } from '../utils/formatters';

export function usePagination(items, pageSize = 6) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [items.length, pageSize]);

  const currentPage = clampNumber(page, 1, totalPages);

  return {
    currentPage,
    totalPages,
    setPage,
    paginatedItems: paginateItems(items, currentPage, pageSize),
  };
}
