export const SESSION_STORAGE_KEY = 'student-project-session';
export const TOKEN_STORAGE_KEY = 'student-project-token';

export function createAvatar(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function getStoredSession() {
  const rawValue = localStorage.getItem(SESSION_STORAGE_KEY);
  return rawValue ? JSON.parse(rawValue) : null;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function persistSession(session) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}
