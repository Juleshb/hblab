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
        </Routes>
      </Router>
    </div>
  )
}

export default App