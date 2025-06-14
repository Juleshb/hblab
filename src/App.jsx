import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
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
const App = () => {
  return (
    <div className="font-Poppins bg-Solitude text-sm">
      <Router>
        <Routes>
          <Route path='/' element={<ContainerPage/>}/>
          <Route path='/landing' element={<ContainerPage/>}/>
          <Route path='/draft' element={<Draft/>}/>
          <Route path='/leadership' element={<LeadershipTeam/>}/>
          <Route path="/get-started" element={<GetStartedForm />} />
          <Route path="/terms-of-use" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/carrier" element={<Carrier />} />
          <Route path="/apply/:id" element={<ApplyCarrier />} />
          <Route path="/AddCarrier" element={<AddCarrier/>}/>
          <Route path="/AdminCarrier" element={<AdminCarrier/>} />
          <Route path="/LoginForm" element = {<LoginForm />} />
          <Route path="/SignUpForm" element = {<SignUpForm />} />
          <Route path="/CertificateModal" element={<HBLCertificateModal />} />
          <Route path="/CertificateGenerator" element= {<HBLCertificateGenerator />} />
          <Route path="/Certficates" element={<Certificates />} />
          <Route path="/CertificateCheck" element={<CertificateCheck />}/>
        </Routes>
      </Router>
    </div>
  )
}

export default App