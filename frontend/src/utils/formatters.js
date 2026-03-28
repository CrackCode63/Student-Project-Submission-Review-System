export function formatDateTime(value) {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export function formatRelativeTime(value) {
  if (!value) {
    return 'Just now';
  }

  const timestamp = new Date(value).getTime();
  const deltaMs = Date.now() - timestamp;
  const deltaMinutes = Math.round(deltaMs / 60000);

  if (Math.abs(deltaMinutes) < 1) {
    return 'Just now';
  }

  if (Math.abs(deltaMinutes) < 60) {
    return `${Math.abs(deltaMinutes)}m ${deltaMinutes >= 0 ? 'ago' : 'from now'}`;
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  if (Math.abs(deltaHours) < 24) {
    return `${Math.abs(deltaHours)}h ${deltaHours >= 0 ? 'ago' : 'from now'}`;
  }

  const deltaDays = Math.round(deltaHours / 24);
  return `${Math.abs(deltaDays)}d ${deltaDays >= 0 ? 'ago' : 'from now'}`;
}

export function toSentenceCase(value = '') {
  if (!value) {
    return '';
  }

  return value
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function paginateItems(items, page, pageSize) {
  const safePage = clampNumber(page, 1, Math.max(1, Math.ceil(items.length / pageSize)));
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function getDeadlineState(deadlineAt) {
  if (!deadlineAt) {
    return {
      label: 'Flexible',
      tone: 'text-slate-500 dark:text-slate-300',
      detail: 'No active deadline',
    };
  }

  const remainingMs = new Date(deadlineAt).getTime() - Date.now();
  const remainingHours = Math.round(remainingMs / 3600000);

  if (remainingHours <= 24) {
    return {
      label: 'Urgent',
      tone: 'text-danger',
      detail: remainingHours > 0 ? `${remainingHours}h left` : 'Deadline passed',
    };
  }

  if (remainingHours <= 72) {
    return {
      label: 'Due Soon',
      tone: 'text-warning',
      detail: `${Math.round(remainingHours / 24)} day(s) left`,
    };
  }

  return {
    label: 'On Track',
    tone: 'text-success',
    detail: `${Math.round(remainingHours / 24)} day(s) left`,
  };
}
