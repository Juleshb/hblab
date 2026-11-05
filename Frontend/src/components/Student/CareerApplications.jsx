import React, { useEffect, useState } from 'react';
import { StudentLayout } from './index';
import { useAuth } from '../../assets/context/AuthContext';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import ClientModal from '../ClientModal';
import toast from 'react-hot-toast';
import CareerCard from '../CareerCard'; // Import the new component
import { apiOrigin } from '../../apiOrigin';

const CareerApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [careers, setCareers] = useState([]);
  const [careersLoading, setCareersLoading] = useState(false);
  const [careersError, setCareersError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [applying, setApplying] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: '',
    coverLetter: '',
    resume: null,
  });
  // Pagination for careers (already present)
  const [careersPage, setCareersPage] = useState(1);
  const careersPerPage = 8;
  const totalCareersPages = Math.ceil(careers.length / careersPerPage);
  const paginatedCareers = careers.slice((careersPage - 1) * careersPerPage, careersPage * careersPerPage);

  // Pagination for applications
  const [applicationsPage, setApplicationsPage] = useState(1);
  const applicationsPerPage = 4;
  const totalApplicationsPages = Math.ceil(applications.length / applicationsPerPage);
  const paginatedApplications = applications.slice((applicationsPage - 1) * applicationsPerPage, applicationsPage * applicationsPerPage);

  // Multi-step form state for modal
  const [formStep, setFormStep] = useState(0);
  const formSteps = [
    'Personal Info',
    'Location & Cover Letter',
    'Resume Upload',
    'Review & Submit',
  ];

  const BACKEND_URL = apiOrigin;

  // Fetch all careers
  useEffect(() => {
    const fetchCareers = async () => {
      setCareersLoading(true);
      setCareersError(null);
      try {
        const res = await fetch(`${apiOrigin}/api/careers`);
        if (!res.ok) throw new Error('Failed to fetch careers');
        const data = await res.json();
        setCareers(data.careers || []);
      } catch (err) {
        setCareersError('Failed to load careers.');
      } finally {
        setCareersLoading(false);
      }
    };
    fetchCareers();
  }, []);

  // Add fetchWithTimeout helper
  const fetchWithTimeout = (url, options, timeout = 10000) =>
    Promise.race([
      fetch(url, options),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
    ]);

  // Update fetchApplications to use fetchWithTimeout
  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithTimeout(`${apiOrigin}/api/applications/by-user/${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch applications');
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err) {
      setError('Failed to load applications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchApplications();
  }, [user]);

  // Open modal and set selected career
  const handleOpenModal = (career) => {
    setSelectedCareer(career);
    setFormData({
      fullName: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: '',
      coverLetter: '',
      resume: null,
    });
    setFormStep(0);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCareer(null);
    setApplying(false);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, resume: e.target.files[0] }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      let resumeUrl = '';
      if (formData.resume) {
        const fileData = new FormData();
        fileData.append('file', formData.resume);
        const uploadRes = await fetch(`${BACKEND_URL}/api/upload`, {
          method: 'POST',
          body: fileData,
        });
        const uploadData = await uploadRes.json();
        resumeUrl = uploadData.url;
      }
      const token = localStorage.getItem('token');
      await fetch(`${apiOrigin}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          coverLetter: formData.coverLetter,
          resumeUrl,
          userId: user.id,
          careerTitle: selectedCareer.title,
          careerDepartment: selectedCareer.type,
        }),
      });
      toast.success('Application submitted successfully!');
      handleCloseModal();
      // Refresh applications list after applying
      fetchApplications();
    } catch (err) {
      toast.error('Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <StudentLayout title="My Career Applications">
      <h1 className="text-base font-bold text-green-900 mb-2 tracking-tight">Available Careers</h1>
      <div className="bg-white rounded-lg shadow border border-green-100 p-2 sm:p-4 mt-0 mb-8">
        {careersLoading ? (
          <div className="flex justify-center items-center h-32">
            <Icon icon="eos-icons:loading" className="h-8 w-8 animate-spin text-teal-700" />
          </div>
        ) : careersError ? (
          <div className="text-center text-red-500 py-8">{careersError}</div>
        ) : careers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Icon icon="carbon:document" className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-base text-gray-500 mb-1 font-semibold">No careers found.</p>
          </div>
        ) : (
          <div className="p-2 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {paginatedCareers.map(career => (
                <CareerCard 
                  key={career.id}
                  career={career}
                  BACKEND_URL={BACKEND_URL}
                  actions={
                    <button
                      onClick={() => handleOpenModal(career)}
                      className="w-full bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      View & Apply
                    </button>
                  }
                />
              ))}
            </div>
            {/* Pagination controls */}
            <div className="flex flex-wrap justify-center items-center gap-3 mt-8">
              <button
                onClick={() => setCareersPage(p => Math.max(1, p - 1))}
                disabled={careersPage === 1}
                className="px-3 py-1 rounded bg-green-100 text-green-800 font-semibold disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-green-900 font-semibold">Page {careersPage} of {totalCareersPages}</span>
              <button
                onClick={() => setCareersPage(p => Math.min(totalCareersPages, p + 1))}
                disabled={careersPage === totalCareersPages}
                className="px-3 py-1 rounded bg-green-100 text-green-800 font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Only show My Career Applications section if loading or there are applications (robust check) */}
      {(loading || (Array.isArray(applications) && applications.length > 0)) && (
        <>
          <h1 className="text-base font-bold text-green-900 mb-2 tracking-tight">My Career Applications</h1>
          <div className="bg-white rounded-lg shadow border border-green-100 p-2 sm:p-4 mt-0">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Icon icon="eos-icons:loading" className="h-8 w-8 animate-spin text-teal-700" />
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">{error}</div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-green-100 text-xs rounded-xl overflow-hidden">
                  <thead className="bg-green-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold text-green-700 uppercase tracking-wider">Career</th>
                      <th className="px-2 py-2 text-left font-semibold text-green-700 uppercase tracking-wider">Department</th>
                      <th className="px-2 py-2 text-left font-semibold text-green-700 uppercase tracking-wider">Status</th>
                      <th className="px-2 py-2 text-left font-semibold text-green-700 uppercase tracking-wider">Applied</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-green-50">
                    {paginatedApplications.map(app => (
                      <tr key={app.id} className="hover:bg-green-50/60 transition">
                        <td className="px-2 py-2 whitespace-nowrap font-medium text-gray-900">{app.careerTitle}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-gray-700">{app.careerDepartment || '-'}</td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${app.status === 'approved' ? 'bg-green-100 text-green-800' : app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{app.status}</span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-gray-500">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="pt-4">
                        <div className="flex flex-wrap justify-center items-center gap-2">
                          <button
                            onClick={() => setApplicationsPage(p => Math.max(1, p - 1))}
                            disabled={applicationsPage === 1}
                            className="px-3 py-1 rounded bg-green-100 text-green-800 font-semibold disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <span className="text-green-900 font-semibold">Page {applicationsPage} of {totalApplicationsPages}</span>
                          <button
                            onClick={() => setApplicationsPage(p => Math.min(totalApplicationsPages, p + 1))}
                            disabled={applicationsPage === totalApplicationsPages}
                            className="px-3 py-1 rounded bg-green-100 text-green-800 font-semibold disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal for career details and application */}
      {modalOpen && selectedCareer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-auto transform transition-all duration-300 ease-out border border-gray-100 overflow-hidden">
            {/* Green Gradient Header with Stepper and Close Button */}
            <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 p-4 text-white flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 01-8 0m8 0a4 4 0 00-8 0m8 0V5a4 4 0 00-8 0v2m8 0a4 4 0 01-8 0" /></svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Apply for {selectedCareer.title}</h2>
                    <p className="text-green-100 text-xs mt-1 font-medium">{selectedCareer.location}</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {/* Stepper */}
              <div className="flex items-center justify-center gap-1 mt-1">
                {formSteps.map((label, idx) => (
                  <div key={label} className={`h-1.5 rounded-full transition-all duration-300 ${idx <= formStep ? 'bg-white w-7' : 'bg-white/30 w-3'}`}></div>
                ))}
              </div>
            </div>
            {/* Divider */}
            <div className="h-1 bg-gradient-to-r from-green-200 via-green-50 to-green-200 w-full" />
            {/* Content Area */}
            <div className="bg-white rounded-b-3xl shadow-lg p-3 sm:p-6 mt-0 mb-4 -mt-2">
              <div className="mb-4">
                <p className="text-green-900 text-base font-semibold mb-1">{selectedCareer.title}</p>
                <p className="text-gray-700 mb-2 leading-relaxed text-xs">{selectedCareer.description}</p>
                {selectedCareer.requirements && selectedCareer.requirements.length > 0 && (
                  <div className="mb-2">
                    <span className="font-semibold text-green-700">Requirements:</span>
                    <ul className="list-disc pl-5 text-gray-600 text-xs space-y-0.5 mt-1">
                      {selectedCareer.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Step 1: Personal Info */}
                {formStep === 0 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium">Full Name</label>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Email</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Phone</label>
                      <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500" />
                    </div>
                  </>
                )}
                {/* Step 2: Location & Cover Letter */}
                {formStep === 1 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium">Location</label>
                      <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Cover Letter</label>
                      <textarea name="coverLetter" value={formData.coverLetter} onChange={handleInputChange} rows={4} className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500" />
                    </div>
                  </>
                )}
                {/* Step 3: Resume Upload */}
                {formStep === 2 && (
                  <div>
                    <label className="block text-sm font-medium">Resume (PDF, optional)</label>
                    <input type="file" accept="application/pdf" onChange={handleFileChange} className="w-full" />
                  </div>
                )}
                {/* Step 4: Review & Submit */}
                {formStep === 3 && (
                  <div className="space-y-2">
                    <div className="text-green-900 font-semibold">Review your application:</div>
                    <div><span className="font-medium">Full Name:</span> {formData.fullName}</div>
                    <div><span className="font-medium">Email:</span> {formData.email}</div>
                    <div><span className="font-medium">Phone:</span> {formData.phone}</div>
                    <div><span className="font-medium">Location:</span> {formData.location}</div>
                    <div><span className="font-medium">Cover Letter:</span> <span className="whitespace-pre-line">{formData.coverLetter}</span></div>
                    <div><span className="font-medium">Resume:</span> {formData.resume ? formData.resume.name : 'Not uploaded'}</div>
                  </div>
                )}
                {/* Pagination controls for form */}
                <div className="flex justify-between items-center pt-3">
                  <button
                    type="button"
                    onClick={() => setFormStep(s => Math.max(0, s - 1))}
                    disabled={formStep === 0 || applying}
                    className="px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold disabled:opacity-50 hover:bg-green-200 transition-all duration-200 text-sm"
                  >
                    Previous
                  </button>
                  <div className="text-green-900 font-semibold text-sm">
                    Step {formStep + 1} of {formSteps.length}
                  </div>
                  {formStep < formSteps.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setFormStep(s => Math.min(formSteps.length - 1, s + 1))}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold hover:from-green-700 hover:to-green-800 shadow hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 text-sm"
                      disabled={applying}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={applying}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-900 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                    >
                      {applying ? 'Submitting...' : 'Submit Application'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
};

export default CareerApplications; 