import { AnimatePresence } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PublicLayout } from '../layouts/PublicLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LandingPage } from '../pages/public/LandingPage';
import { LoginPage } from '../pages/public/LoginPage';
import { RegisterPage } from '../pages/public/RegisterPage';
import { NotFoundPage } from '../pages/public/NotFoundPage';
import { ProfilePage } from '../pages/shared/ProfilePage';
import { StudentDashboardPage } from '../pages/student/StudentDashboardPage';
import { TeamPage } from '../pages/student/TeamPage';
import { SubmitProjectPage } from '../pages/student/SubmitProjectPage';
import { MySubmissionsPage } from '../pages/student/MySubmissionsPage';
import { FeedbackPage } from '../pages/student/FeedbackPage';
import { MentorDashboardPage } from '../pages/mentor/MentorDashboardPage';
import { ReviewProjectsPage } from '../pages/mentor/ReviewProjectsPage';
import { StudentListPage } from '../pages/mentor/StudentListPage';
import { MarksPage } from '../pages/mentor/MarksPage';
import { VerificationRequestsPage } from '../pages/mentor/VerificationRequestsPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { TeamManagementPage } from '../pages/admin/TeamManagementPage';
import { ProjectControlPage } from '../pages/admin/ProjectControlPage';
import { getHomePathForRole } from '../utils/roles';

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
  );
}
