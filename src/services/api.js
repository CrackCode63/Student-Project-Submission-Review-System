import axios from 'axios';
import { getStoredToken } from '../utils/session';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const LOCAL_STATE_KEY = 'student-project-frontend-overrides-v1';

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

function createApiError(error) {
  const nextError = new Error(
    error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Something went wrong while talking to the server.',
  );
  nextError.status = error.response?.status;
  nextError.code = error.code;
  return nextError;
}

async function request(handler) {
  try {
    return await handler();
  } catch (error) {
    throw createApiError(error);
  }
}

function loadLocalState() {
  const raw = localStorage.getItem(LOCAL_STATE_KEY);

  if (!raw) {
    return {
      profiles: {},
      verificationRequests: [],
      deletedProjects: {},
    };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      profiles: parsed.profiles || {},
      verificationRequests: parsed.verificationRequests || [],
      deletedProjects: parsed.deletedProjects || {},
    };
  } catch {
    return {
      profiles: {},
      verificationRequests: [],
      deletedProjects: {},
    };
  }
}

function saveLocalState(nextState) {
  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(nextState));
  return nextState;
}

function defaultProfile(user) {
  const isStudent = user?.role === 'student';

  return {
    section: isStudent ? 'Section A' : '',
    department: 'Computer Science',
    year: isStudent ? 'Final Year' : 'Faculty',
    phone: '',
    bio: '',
    skills: '',
    teamPreference: 'team',
    verificationStatus: isStudent ? 'Not Requested' : 'Verified',
    verifiedAt: null,
    lastUpdatedAt: null,
  };
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    ...user,
    mentor_id: user.mentor_id ?? user.mentorId ?? null,
    mentor_name: user.mentor_name ?? user.mentorName ?? null,
    roll_no: user.roll_no ?? user.rollNo ?? null,
  };
}

export const authApi = {
  login: (payload) =>
    request(() =>
      http.post('/auth/login', payload).then((response) => ({
        ...response.data,
        user: sanitizeUser(response.data.user),
      })),
    ),
  register: (payload) =>
    request(() =>
      http.post('/auth/register', payload).then((response) => ({
        ...response.data,
        user: sanitizeUser(response.data.user),
      })),
    ),
  me: () => request(() => http.get('/auth/me').then((response) => sanitizeUser(response.data))),
  mentors: () =>
    request(() =>
      http.get('/auth/mentors').then((response) =>
        response.data.map((mentor) => ({
          ...mentor,
          role: 'mentor',
          roll_no: null,
          mentor_id: null,
          mentor_name: null,
        })),
      ),
    ),
};

export const teamApi = {
  list: () => request(() => http.get('/teams').then((response) => response.data)),
  create: (payload) => request(() => http.post('/teams', payload).then((response) => response.data)),
  join: (payload) => request(() => http.post('/teams/join', payload).then((response) => response.data)),
};

export const projectApi = {
  list: async () => {
    const projects = await request(() => http.get('/projects').then((response) => response.data));
    const localState = loadLocalState();

    return projects.map((project) => ({
      ...project,
      is_deleted: Boolean(localState.deletedProjects[project.id]),
    }));
  },
  reviewQueue: () => request(() => http.get('/projects/review-queue').then((response) => response.data)),
  details: (projectId) =>
    request(() => http.get(`/projects/${projectId}/submissions`).then((response) => response.data)),
  submit: (formData) =>
    request(() =>
      http.post('/projects/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((response) => response.data),
    ),
  resubmit: (projectId, formData) =>
    request(() =>
      http.post(`/projects/${projectId}/resubmit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((response) => response.data),
    ),
  updateStatus: (submissionId, status) =>
    request(() =>
      http.patch(`/projects/submissions/${submissionId}/status`, { status }).then((response) => response.data),
    ),
  fetchUploadedVideoUrl: async (submissionId) => {
    const response = await request(() =>
      http.get(`/projects/submissions/${submissionId}/video`, {
        responseType: 'blob',
      }),
    );
    return URL.createObjectURL(response.data);
  },
  deleteLocally: async (projectId, deletedById) => {
    const localState = loadLocalState();
    localState.deletedProjects[projectId] = {
      deletedAt: new Date().toISOString(),
      deletedById,
    };
    saveLocalState(localState);
    return localState.deletedProjects[projectId];
  },
};

export const feedbackApi = {
  list: (params) => request(() => http.get('/feedback', { params }).then((response) => response.data)),
  create: (payload) => request(() => http.post('/feedback', payload).then((response) => response.data)),
};

export const marksApi = {
  list: (params) => request(() => http.get('/marks', { params }).then((response) => response.data)),
  assign: (payload) => request(() => http.post('/marks', payload).then((response) => response.data)),
};

export const mentorApi = {
  students: () => request(() => http.get('/mentor/students').then((response) => response.data)),
};

export const adminApi = {
  students: () => request(() => http.get('/admin/students').then((response) => response.data)),
  projects: () => request(() => http.get('/admin/projects').then((response) => response.data)),
  teams: () => request(() => http.get('/admin/teams').then((response) => response.data)),
  assignMentor: (studentId, mentorId) =>
    request(() =>
      http.patch(`/admin/students/${studentId}/mentor`, { mentor_id: mentorId }).then((response) => response.data),
    ),
};

function getWebSocketBaseUrl() {
  return API_BASE_URL.replace(/\/+$/, '').replace(/^http/i, 'ws');
}

export const notificationApi = {
  list: () => request(() => http.get('/notifications').then((response) => response.data)),
  markRead: (notificationId) =>
    request(() => http.patch(`/notifications/${notificationId}/read`).then((response) => response.data)),
  socketUrl: (userId, token = getStoredToken()) => {
    if (!userId || !token) {
      return null;
    }

    return `${getWebSocketBaseUrl()}/ws/notifications/${userId}?token=${encodeURIComponent(token)}`;
  },
};

export const profileApi = {
  get: async (user) => {
    const localState = loadLocalState();
    return {
      ...defaultProfile(user),
      ...(localState.profiles?.[user.id] || {}),
    };
  },
  update: async (user, payload) => {
    const localState = loadLocalState();
    localState.profiles[user.id] = {
      ...defaultProfile(user),
      ...(localState.profiles?.[user.id] || {}),
      ...payload,
      lastUpdatedAt: new Date().toISOString(),
    };
    saveLocalState(localState);
    return localState.profiles[user.id];
  },
};

export const verificationApi = {
  request: async (user, note) => {
    const localState = loadLocalState();
    const existingPending = localState.verificationRequests.find(
      (requestItem) => requestItem.studentId === user.id && requestItem.status === 'Pending',
    );
    const now = new Date().toISOString();

    if (existingPending) {
      existingPending.note = note || existingPending.note;
      existingPending.requestedAt = now;
    } else {
      localState.verificationRequests.unshift({
        id: Date.now(),
        studentId: user.id,
        studentName: user.name,
        mentorId: user.mentor_id,
        mentorName: user.mentor_name,
        status: 'Pending',
        note,
        requestedAt: now,
        reviewedAt: null,
        reviewedBy: null,
      });
    }

    localState.profiles[user.id] = {
      ...defaultProfile(user),
      ...(localState.profiles?.[user.id] || {}),
      verificationStatus: 'Pending',
      lastUpdatedAt: now,
    };

    saveLocalState(localState);
    return localState.verificationRequests.find(
      (requestItem) => requestItem.studentId === user.id && requestItem.status === 'Pending',
    );
  },
  listForMentor: async (mentorId, students = []) => {
    const localState = loadLocalState();
    const studentMap = new Map(students.map((student) => [student.id, student]));

    return localState.verificationRequests
      .filter((requestItem) => requestItem.mentorId === mentorId)
      .map((requestItem) => {
        const student = studentMap.get(requestItem.studentId);
        const profile = {
          ...defaultProfile(student),
          ...(localState.profiles?.[requestItem.studentId] || {}),
        };

        return {
          ...requestItem,
          rollNo: student?.roll_no || 'Not available',
          section: profile.section || 'Section not set',
          department: profile.department || 'Department not set',
        };
      })
      .sort((left, right) => new Date(right.requestedAt).getTime() - new Date(left.requestedAt).getTime());
  },
  review: async (requestId, status, reviewerName, students = []) => {
    const localState = loadLocalState();
    const requestItem = localState.verificationRequests.find((item) => item.id === requestId);

    if (!requestItem) {
      throw new Error('Verification request not found.');
    }

    const student = students.find((item) => item.id === requestItem.studentId);
    const now = new Date().toISOString();

    requestItem.status = status;
    requestItem.reviewedAt = now;
    requestItem.reviewedBy = reviewerName;

    localState.profiles[requestItem.studentId] = {
      ...defaultProfile(student),
      ...(localState.profiles?.[requestItem.studentId] || {}),
      verificationStatus: status,
      verifiedAt: status === 'Verified' ? now : null,
      lastUpdatedAt: now,
    };

    saveLocalState(localState);
    return requestItem;
  },
};

export const frontendControlApi = {
  openInIde: async () => ({
    success: true,
    message: 'The UI trigger is ready. Connect this action to your backend or desktop bridge when available.',
  }),
};
