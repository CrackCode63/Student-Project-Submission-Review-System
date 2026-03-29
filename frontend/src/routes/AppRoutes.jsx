import { Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ProtectedRoute } from './ProtectedRoute';
import { getHomePathForRole } from '../utils/roles';

const PublicLayout = lazy(() => import('../layouts/PublicLayout').then((module) => ({ default: module.PublicLayout })));
const DashboardLayout = lazy(() =>
  import('../layouts/DashboardLayout').then((module) => ({ default: module.DashboardLayout }))
);

const LandingPage = lazy(() => import('../pages/public/LandingPage').then((module) => ({ default: module.LandingPage })));
const LoginPage = lazy(() => import('../pages/public/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() =>
  import('../pages/public/RegisterPage').then((module) => ({ default: module.RegisterPage }))
);
const NotFoundPage = lazy(() =>
  import('../pages/public/NotFoundPage').then((module) => ({ default: module.NotFoundPage }))
);

const ProfilePage = lazy(() => import('../pages/shared/ProfilePage').then((module) => ({ default: module.ProfilePage })));

const StudentDashboardPage = lazy(() =>
  import('../pages/student/StudentDashboardPage').then((module) => ({ default: module.StudentDashboardPage }))
);
const TeamPage = lazy(() => import('../pages/student/TeamPage').then((module) => ({ default: module.TeamPage })));
const SubmitProjectPage = lazy(() =>
  import('../pages/student/SubmitProjectPage').then((module) => ({ default: module.SubmitProjectPage }))
);
const MySubmissionsPage = lazy(() =>
  import('../pages/student/MySubmissionsPage').then((module) => ({ default: module.MySubmissionsPage }))
);
const FeedbackPage = lazy(() =>
  import('../pages/student/FeedbackPage').then((module) => ({ default: module.FeedbackPage }))
);

const MentorDashboardPage = lazy(() =>
  import('../pages/mentor/MentorDashboardPage').then((module) => ({ default: module.MentorDashboardPage }))
);
const ReviewProjectsPage = lazy(() =>
  import('../pages/mentor/ReviewProjectsPage').then((module) => ({ default: module.ReviewProjectsPage }))
);
const StudentListPage = lazy(() =>
  import('../pages/mentor/StudentListPage').then((module) => ({ default: module.StudentListPage }))
);
const MarksPage = lazy(() => import('../pages/mentor/MarksPage').then((module) => ({ default: module.MarksPage })));
const VerificationRequestsPage = lazy(() =>
  import('../pages/mentor/VerificationRequestsPage').then((module) => ({ default: module.VerificationRequestsPage }))
);

const AdminDashboardPage = lazy(() =>
  import('../pages/admin/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage }))
);
const UserManagementPage = lazy(() =>
  import('../pages/admin/UserManagementPage').then((module) => ({ default: module.UserManagementPage }))
);
const TeamManagementPage = lazy(() =>
  import('../pages/admin/TeamManagementPage').then((module) => ({ default: module.TeamManagementPage }))
);
const ProjectControlPage = lazy(() =>
  import('../pages/admin/ProjectControlPage').then((module) => ({ default: module.ProjectControlPage }))
);

function DashboardRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to='/' replace />;
  }

  return <Navigate to={getHomePathForRole(user.role)} replace />;
}

export function AppRoutes() {
  const location = useLocation();

  return (
    <Suspense fallback={<div className='p-6 text-sm text-slate-500'>Loading...</div>}>
      <AnimatePresence mode='wait'>
        <Routes location={location} key={location.pathname}>
          <Route element={<PublicLayout />}>
            <Route path='/' element={<LandingPage />} />
            <Route path='/login' element={<LoginPage />} />
            <Route path='/register' element={<RegisterPage />} />
            <Route path='/not-found' element={<NotFoundPage />} />
          </Route>

          <Route path='/dashboard' element={<DashboardRedirect />} />

          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route element={<DashboardLayout />}>
              <Route path='/student' element={<StudentDashboardPage />} />
              <Route path='/student/profile' element={<ProfilePage />} />
              <Route path='/student/team' element={<TeamPage />} />
              <Route path='/student/submit' element={<SubmitProjectPage />} />
              <Route path='/student/submissions' element={<MySubmissionsPage />} />
              <Route path='/student/feedback' element={<FeedbackPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['mentor']} />}>
            <Route element={<DashboardLayout />}>
              <Route path='/mentor' element={<MentorDashboardPage />} />
              <Route path='/mentor/profile' element={<ProfilePage />} />
              <Route path='/mentor/reviews' element={<ReviewProjectsPage />} />
              <Route path='/mentor/students' element={<StudentListPage />} />
              <Route path='/mentor/verification' element={<VerificationRequestsPage />} />
              <Route path='/mentor/marks' element={<MarksPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path='/admin' element={<AdminDashboardPage />} />
              <Route path='/admin/profile' element={<ProfilePage />} />
              <Route path='/admin/users' element={<UserManagementPage />} />
              <Route path='/admin/teams' element={<TeamManagementPage />} />
              <Route path='/admin/projects' element={<ProjectControlPage />} />
            </Route>
          </Route>

          <Route path='*' element={<Navigate to='/not-found' replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
