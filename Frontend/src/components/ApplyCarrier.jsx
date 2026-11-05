import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../assets/context/AuthContext';
import toast from 'react-hot-toast';
import { apiOrigin } from '../apiOrigin';

const ApplyCarrier = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: '',
    coverLetter: '',
    resume: null,
  });

  // Fetch job details from backend
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await axios.get(`${apiOrigin}/api/careers/${id}`);
        setJob(response.data.career || response.data); // support both formats
        setLoading(false);
      } catch (err) {
        setError('Failed to load job details');
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle resume file change
  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, resume: e.target.files[0] }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let resumeUrl = '';
      if (formData.resume) {
        // Upload resume file (optional, implement endpoint if needed)
        const fileData = new FormData();
        fileData.append('file', formData.resume);
        const uploadRes = await axios.post(`${apiOrigin}/api/upload`, fileData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        resumeUrl = uploadRes.data.url;
      }
      const token = localStorage.getItem('token');
      await axios.post(`${apiOrigin}/api/applications`, {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        coverLetter: formData.coverLetter,
        resumeUrl,
        userId: user.id,
        careerTitle: job.title,
        careerDepartment: job.type,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Application submitted successfully!');
      navigate('/student/career-applications');
    } catch (err) {
      toast.error('Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center py-20">{error}</div>;
  if (!job) return <div className="text-center py-20">Job not found</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow">
          <h2 className="text-2xl font-bold text-green-900 mb-2">Apply for {job.title}</h2>
          <p className="mb-6 text-gray-600">{job.description}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Cover Letter</label>
              <textarea name="coverLetter" value={formData.coverLetter} onChange={handleInputChange} rows={4} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Resume (PDF, optional)</label>
              <input type="file" accept="application/pdf" onChange={handleFileChange} className="w-full" />
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-green-900 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors">
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ApplyCarrier;