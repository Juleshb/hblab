import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const ApplyCarrier = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    location: '',
    description: '',
    requirements: [],
    startDate: '',
    endDate: '',
    ApplicationLink: ''
  });

  // Fetch job details from backend
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await axios.get(`https://umuhuza.store/api/carriers/${id}`);
        setJob(response.data);
        console.log(response.data)
        setFormData(response.data);
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

  // Handle requirements changes
  const handleRequirementChange = (index, value) => {
    const newRequirements = [...formData.requirements];
    newRequirements[index] = value;
    setFormData(prev => ({ ...prev, requirements: newRequirements }));
  };

  // Add new requirement field
  const addRequirement = () => {
    setFormData(prev => ({ 
      ...prev, 
      requirements: [...prev.requirements, ''] 
    }));
  };

  // Remove requirement
  const removeRequirement = (index) => {
    const newRequirements = formData.requirements.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, requirements: newRequirements }));
  };

  // Handle form submission (update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`https://umuhuza.store/jobs/${id}`, formData);
      setJob(formData);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update job');
    }
  };

  // Handle job deletion
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        await axios.delete(`https://umuhuza.store/jobs/${id}`);
        navigate('/careers');
      } catch (err) {
        setError('Failed to delete job');
      }
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center py-20">{error}</div>;
  if (!job) return <div className="text-center py-20">Job not found</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto">
          {/* Admin controls */}
          {/* <div className="flex justify-end mb-4 space-x-2">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Job'}
            </button>
            <button 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Delete Job
            </button>
          </div> */}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold text-green-900 mb-6">Edit Job Posting</h2>
              
              <div className="grid gap-6 mb-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">Job Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">Job Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">Application Link</label>
                  <input
                    type="url"
                    name="ApplicationLink"
                    value={formData.ApplicationLink}
                    onChange={handleInputChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-900">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  required
                ></textarea>
              </div>
              
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-900">Requirements</label>
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => handleRequirementChange(index, e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRequirement}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Requirement
                </button>
              </div>
              
              <div className="grid gap-6 mb-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              >
                Update Job Posting
              </button>
            </form>
          ) : (
            <div className="grid gap-12 lg:grid-cols-3">
              {/* Job Details */}
              <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-2xl font-bold text-green-900 mb-4">{job.title}</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Job Type</h3>
                    <p className="text-gray-600">{job.type}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Location</h3>
                    <p className="text-gray-600">{job.location}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Application Period</h3>
                    <p className="text-gray-600">
                      {new Date(job.startDate).toLocaleDateString()} - {new Date(job.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Job Requirements and Application */}
              <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Job Description</h3>
                  <p className="text-gray-600">{job.description}</p>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Requirements</h3>
                  <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    {job.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="py-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">How to Apply</h3>
                  <a 
                    href={job.ApplicationLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  >
                    Apply Now
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ApplyCarrier;