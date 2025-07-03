import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './assets/context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute'
import ContainerPage from './components/ContainerPage'
import Draft from './components/Footer'
import LeadershipTeam from './components/LeadershipTeam'
import GetStartedForm from "./components/GetStartedForm";
import TermsAndConditions from './components/Terms&Conditions'
import PrivacyPolicy from './components/PrivacyPolicy'
import Carrier from './components/Carrier'
import ApplyCarrier from './components/ApplyCarrier'
import AddCarrier from './components/AddCarrier'
import AdminCarrier from './components/AdminCarrier'
import LoginForm from './components/LoginForm'
import SignUpForm from './components/SignUpForm'
import HBLCertificateGenerator from './components/HBLCertificateGenerator'
import HBLCertificateModal from './components/HBLCertificateModal'
import Certificates from './components/Certificate'
import CertificateCheck from './components/CertificateCheck'
import Verify from './components/VerifyCertificate'
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

const App = () => {
  return (
    <div className="font-Poppins bg-Solitude text-sm">
      <Router>
        <AuthProvider>
        <Routes>
            {/* Public routes */}
          <Route path='/' element={<ContainerPage/>}/>
          <Route path='/landing' element={<ContainerPage/>}/>
          <Route path='/draft' element={<Draft/>}/>
          <Route path='/leadership' element={<LeadershipTeam/>}/>
          <Route path="/get-started" element={<GetStartedForm />} />
          <Route path="/terms-of-use" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/carrier" element={<Carrier />} />
          <Route path="/apply/:id" element={<ApplyCarrier />} />
            <Route path="/LoginForm" element={<LoginForm />} />
            <Route path="/SignUpForm" element={<SignUpForm />} />
          <Route path="/CertificateCheck" element={<CertificateCheck />}/>
          <Route path="/modal-demo" element={<ModalDemo />} />
        
            {/* Protected routes - Admin only */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardHome />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UsersManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/trainers" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <TrainersManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/careers" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <CareersManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/certificates" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <CertificatesManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/applications" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ApplicationsManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/projects" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ProjectsManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <SettingsManagement />
              </ProtectedRoute>
            } />
            
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
        </Routes>
        </AuthProvider>
      </Router>
    </div>
  )
}

export default App