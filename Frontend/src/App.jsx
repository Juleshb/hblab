import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import ContainerPage from './components/ContainerPage'
import Draft from './components/Footer'
import LeadershipTeam from './components/LeadershipTeam'
import StudioHero from './components/Studio/StudioHero'
import StudioPortfolio from './components/Studio/StudioPortfolio'
import GetStartedForm from "./components/GetStartedForm";
import TermsAndConditions from './components/Terms&Conditions'
import PrivacyPolicy from './components/PrivacyPolicy'
import Carrier from './components/Carrier'
import ApplyCarrier from './components/ApplyCarrier'
import AddCarrier from './components/AddCarrier'
import AdminCarrier from './components/AdminCarrier'
import LoginForm from './components/LoginForm'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import SignUpForm from './components/SignUpForm'
import HBLCertificateGenerator from './components/HBLCertificateGenerator'
import HBLCertificateModal from './components/HBLCertificateModal'
import Certificates from './components/Certificate'
import CertificateCheck from './components/CertificateCheck'
import AdminDashboard from './components/Admin/AdminDashboard'
import DashboardHome from './components/Admin/DashboardHome'
import UsersManagement from './components/Admin/UsersManagement'
import TrainersManagement from './components/Admin/TrainersManagement'
import CareersManagement from './components/Admin/CareersManagement'
import CertificatesManagement from './components/Admin/CertificatesManagement'
import ApplicationsManagement from './components/Admin/ApplicationsManagement'
import ProjectsManagement from './components/Admin/ProjectsManagement'
import SettingsManagement from './components/Admin/SettingsManagement'
import ModalDemo from './components/ModalDemo'
import { UserDashboard } from './components/User'
import { StudentDashboard, CareerApplications } from './components/Student';
import StudentCertificates from './components/Student/StudentCertificates'
import LessonsManagement from './components/Admin/LessonsManagement'
import StudentLessons from './components/Student/StudentLessons';
import StudentProgress from './components/Student/StudentProgress';
import StudentProfile from './components/Student/StudentProfile';
import { Toaster } from 'react-hot-toast';
import LessonDetailsView from './components/Admin/LessonDetailsView';
import HbmsLayout from './components/Admin/HBMS/HbmsLayout';
import HbmsOverview from './components/Admin/HBMS/HbmsOverview';
import HbmsOrganization from './components/Admin/HBMS/HbmsOrganization';
import HbmsWorkers from './components/Admin/HBMS/HbmsWorkers';
import HbmsWorkerProfile from './components/Admin/HBMS/HbmsWorkerProfile';
import HbmsProjects from './components/Admin/HBMS/HbmsProjects';
import HbmsProjectDetail from './components/Admin/HBMS/HbmsProjectDetail';
import HbmsTasks from './components/Admin/HBMS/HbmsTasks';
import HbmsPrograms from './components/Admin/HBMS/HbmsPrograms';
import HbmsProgramDetail from './components/Admin/HBMS/HbmsProgramDetail';
import HbmsAttendance from './components/Admin/HBMS/HbmsAttendance';
import HbmsMessages from './components/Admin/HBMS/HbmsMessages';
import HbmsDocuments from './components/Admin/HBMS/HbmsDocuments';
import HbmsReports from './components/Admin/HBMS/HbmsReports';
import HbmsRoles from './components/Admin/HBMS/HbmsRoles';
import HbmsSettings from './components/Admin/HBMS/HbmsSettings';
import AdminGate from './components/Admin/AdminGate';
import StudentLessonDetail from './components/Student/StudentLessonDetail';
import ChatPage from './components/Chat/ChatPage';
import ChatButton from './components/Chat/ChatButton';
import DeskCall from './components/Chat/DeskCall';

const App = () => {

  return (
    <div className="font-Poppins bg-Solitude text-sm">
      <Toaster position="top-right" />
      <ChatButton />
      <DeskCall />
      <Routes>
        {/* Public routes */}
        <Route path='/' element={<ContainerPage/>}/>
        <Route path='/landing' element={<ContainerPage/>}/>
        <Route path='/draft' element={<Draft/>}/>
        <Route path='/leadership' element={<LeadershipTeam/>}/>
        <Route path='/studio' element={<StudioHero/>}/>
        <Route path='/portfolio' element={<StudioPortfolio/>}/>
        <Route path="/get-started" element={<GetStartedForm />} />
        <Route path="/terms-of-use" element={<TermsAndConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/carrier" element={<Carrier />} />
        <Route path="/apply/:id" element={<ApplyCarrier />} />
        <Route path="/LoginForm" element={<LoginForm />} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/SignUpForm" element={<SignUpForm />} />
        <Route path="/CertificateCheck" element={<CertificateCheck />}/>
        <Route path="/modal-demo" element={<ModalDemo />} />
        {/* Protected routes - Admin only, nested under /admin */}
        <Route path="/admin" element={<AdminGate />}>
          <Route index element={<DashboardHome />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="trainers" element={<TrainersManagement />} />
          <Route path="careers" element={<CareersManagement />} />
          <Route path="certificates" element={<CertificatesManagement />} />
          <Route path="applications" element={<ApplicationsManagement />} />
          <Route path="projects" element={<ProjectsManagement />} />
          <Route path="hbms" element={<HbmsLayout />}>
            <Route index element={<HbmsOverview />} />
            <Route path="organization" element={<HbmsOrganization />} />
            <Route path="workers" element={<HbmsWorkers />} />
            <Route path="workers/:id" element={<HbmsWorkerProfile />} />
            <Route path="projects" element={<HbmsProjects />} />
            <Route path="projects/:id" element={<HbmsProjectDetail />} />
            <Route path="programs" element={<HbmsPrograms />} />
            <Route path="programs/:id" element={<HbmsProgramDetail />} />
            <Route path="tasks" element={<HbmsTasks />} />
            <Route path="attendance" element={<HbmsAttendance />} />
            <Route path="messages" element={<HbmsMessages />} />
            <Route path="documents" element={<HbmsDocuments />} />
            <Route path="reports" element={<HbmsReports />} />
            <Route path="roles" element={<HbmsRoles />} />
            <Route path="settings" element={<HbmsSettings />} />
          </Route>
          <Route path="settings" element={<SettingsManagement />} />
          <Route path="lessons" element={<LessonsManagement />} />
          <Route path="lessons/:id" element={<LessonDetailsView />} />
        </Route>
        {/* Protected routes - Admin and Student */}
        <Route path="/AddCarrier" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'STUDENT']}>
            <AddCarrier/>
          </ProtectedRoute>
        }/>
        <Route path="/AdminCarrier" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminCarrier/>
          </ProtectedRoute>
        } />
        <Route path="/CertificateModal" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'STUDENT']}>
            <HBLCertificateModal />
          </ProtectedRoute>
        } />
        <Route path="/CertificateGenerator" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'STUDENT']}>
            <HBLCertificateGenerator />
          </ProtectedRoute>
        } />
        <Route path="/Certficates" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'STUDENT']}>
            <Certificates />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/certificates" element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentCertificates />
          </ProtectedRoute>
        } />
        <Route path="/student/career-applications" element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <CareerApplications />
          </ProtectedRoute>
        } />
        <Route path="/student/lessons" element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentLessons />
          </ProtectedRoute>
        } />
        <Route path="/student/lessons/:lessonId" element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentLessonDetail />
          </ProtectedRoute>
        } />
        <Route path="/student/progress" element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentProgress />
          </ProtectedRoute>
        } />
        <Route path="/student/profile" element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentProfile />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  )
}

export default App