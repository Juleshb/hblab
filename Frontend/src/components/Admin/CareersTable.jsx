import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import CareerCard from '../CareerCard'; // Import the reusable component

const CareersTable = ({ onCareersCount }) => {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const defaultForm = {
    title: '',
    type: 'FULL_TIME',
    location: '',
    description: '',
    requirements: [],
    startDate: '',
    endDate: '',
    applicationLink: '',
    imageFile: null,
    currentRequirement: '',
  };
  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingCareer, setEditingCareer] = useState(null);

  // Multi-step modal state
  const steps = [
    'Basic Info',
    'Details',
    'Requirements',
    'Review & Submit'
  ];
  const [step, setStep] = useState(0);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

  // Per-step validation
  const validateStep = () => {
    if (step === 0) {
      if (!form.title || !form.type || !form.location || !form.startDate || !form.endDate) {
        setFormError('Please fill out all required fields in Basic Info.');
        return false;
      }
    } else if (step === 1) {
      if (!form.description) {
        setFormError('Please provide a job description.');
        return false;
      }
    }
    setFormError('');
    return true;
  };

  const handleStepNext = (e) => {
    e.preventDefault();
    if (validateStep()) nextStep();
  };
  const handleStepBack = (e) => {
    e.preventDefault();
    prevStep();
  };

  const fetchCareers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/careers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCareers(response.data.careers || []);
      if (onCareersCount) onCareersCount((response.data.careers || []).length);
    } catch (err) {
      setError('Failed to load careers.');
      if (onCareersCount) onCareersCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this career?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/careers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCareers(careers.filter(career => career.id !== id));
    } catch (err) {
      alert('Failed to delete career.');
    }
  };

  // Placeholder for edit (modal or inline)
  const handleEdit = (career) => {
    setEditingCareer(career);
    setForm({
      title: career.title || '',
      type: career.type || 'FULL_TIME',
      location: career.location || '',
      description: career.description || '',
      requirements: Array.isArray(career.requirements) ? career.requirements : [],
      startDate: career.startDate ? new Date(career.startDate).toISOString().slice(0, 10) : '',
      endDate: career.endDate ? new Date(career.endDate).toISOString().slice(0, 10) : '',
      applicationLink: career.applicationLink || '',
      imageFile: null,
      currentRequirement: '',
    });
    setFormError('');
    setStep(0);
    setShowModal(true);
  };

  const handleOpenModal = () => {
    setEditingCareer(null);
    setForm(defaultForm);
    setFormError('');
    setStep(0);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormError('');
    setEditingCareer(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          setFormError('Only image files are allowed.');
          toast.error('Only image files are allowed.');
          return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB
          setFormError('Image size must be less than 2MB.');
          toast.error('Image size must be less than 2MB.');
          return;
        }
      }
      setForm({ ...form, imageFile: file });
    } else {
      setForm({ ...form, [name]: value });
    }
    setFormError('');
  };

  const handleAddRequirement = () => {
    if (form.currentRequirement.trim()) {
      setForm({
        ...form,
        requirements: [...form.requirements, form.currentRequirement],
        currentRequirement: '',
      });
    }
  };

  const handleRemoveRequirement = (index) => {
    const updatedRequirements = [...form.requirements];
    updatedRequirements.splice(index, 1);
    setForm({ ...form, requirements: updatedRequirements });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.location || !form.description || !form.startDate || !form.endDate) {
      setFormError('Please fill out all required fields.');
      toast.error('Please fill out all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      let imageUrl = editingCareer ? editingCareer.imageUrl : '';

      // If a new image is uploaded, send it to the upload endpoint
      if (form.imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', form.imageFile);
        const uploadResponse = await axios.post(`${BACKEND_URL}/api/upload`, uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = uploadResponse.data.url; // Get the URL from the server
      }

      const careerData = {
        ...form,
        imageUrl,
      };
      
      let response;
      if (editingCareer) {
        // Update existing career
        response = await axios.put(`http://localhost:3000/api/careers/${editingCareer.id}`, careerData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Use the correct property from the response object
        setCareers(careers.map(c => c.id === editingCareer.id ? response.data.careers : c));
        toast.success('Career updated successfully!');
      } else {
        // Add new career
        response = await axios.post('http://localhost:3000/api/careers', careerData, {
          headers: { Authorization: `Bearer ${token}` }
      });
      setCareers([response.data.career, ...careers]);
        toast.success('Career added successfully!');
      }
      setShowModal(false);
      setForm(defaultForm);
      setEditingCareer(null);
    } catch (err) {
      setFormError('Failed to ' + (editingCareer ? 'update' : 'add') + ' career.');
      toast.error('Failed to ' + (editingCareer ? 'update' : 'add') + ' career.');
    } finally {
      setSubmitting(false);
    }
  };

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">All Careers</h3>
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Icon icon="carbon:add" className="h-5 w-5 mr-2" />
          Add Career
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Icon icon="eos-icons:loading" className="h-8 w-8 animate-spin text-green-700" />
        </div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="p-4">
              {careers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No careers found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {careers.map((career) => (
                <CareerCard
                  key={career.id}
                  career={career}
                  BACKEND_URL={BACKEND_URL}
                  actions={
                    <>
                      <button onClick={() => handleEdit(career)} className="flex-1 text-teal-600 hover:text-teal-900 p-2 rounded-lg bg-teal-50 hover:bg-teal-100 transition-colors text-xs font-semibold flex items-center justify-center">
                        <Icon icon="carbon:edit" className="h-4 w-4 mr-1" /> Edit
                      </button>
                      <button onClick={() => handleDelete(career.id)} className="flex-1 text-red-600 hover:text-red-900 p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors text-xs font-semibold flex items-center justify-center">
                        <Icon icon="carbon:trash-can" className="h-4 w-4 mr-1" /> Delete
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
      {/* Add Career Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-md mx-auto transform transition-all duration-300 ease-out border border-gray-100 overflow-hidden">
            {editingCareer && (
              <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold z-10">Editing</div>
            )}
            {/* Gradient Header with Stepper */}
            <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-2 sm:p-4 text-white flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Icon icon="carbon:briefcase" className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Add New Career</h2>
                    <p className="text-green-100 text-xs mt-1">Step {step + 1} of {steps.length}: {steps[step]}</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
                >
                  <Icon icon="carbon:close" className="h-5 w-5" />
                </button>
              </div>
              {/* Stepper */}
              <div className="flex items-center justify-center gap-1 mt-1">
                {steps.map((s, idx) => (
                  <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${idx <= step ? 'bg-white w-6' : 'bg-white/30 w-3'}`}></div>
                ))}
              </div>
            </div>
            {/* Modal Content - Multi-step Form */}
            <form onSubmit={handleFormSubmit} className="p-2 sm:p-4 space-y-4">
              {step === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Job Title*</label>
                    <input type="text" name="title" value={form.title} onChange={handleFormChange} className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Job Type*</label>
                    <select name="type" value={form.type} onChange={handleFormChange} className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 appearance-none bg-white text-sm" required>
                      <option value="FULL_TIME">Full-time</option>
                      <option value="PART_TIME">Part-time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="INTERNSHIP">Internship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Location*</label>
                    <input type="text" name="location" value={form.location} onChange={handleFormChange} className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date*</label>
                    <input type="date" name="startDate" value={form.startDate} onChange={handleFormChange} className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">End Date*</label>
                    <input type="date" name="endDate" value={form.endDate} onChange={handleFormChange} className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 text-sm" required />
                  </div>
                </div>
              )}
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                  <div className="md:col-span-2">
                     <label className="block text-xs font-semibold text-gray-700 mb-1">Description*</label>
                     <textarea name="description" value={form.description} onChange={handleFormChange} className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 resize-none text-sm" rows={3} required />
                  </div>
                  <div className="md:col-span-2">
                     <label className="block text-xs font-semibold text-gray-700 mb-1">Upload Image</label>
                     <input type="file" accept="image/*" name="imageFile" onChange={handleFormChange} className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 text-sm" />
                     {form.imageFile && (
                       <img src={URL.createObjectURL(form.imageFile)} alt="Preview" className="mt-2 h-20 rounded-lg object-cover border" />
                     )}
                  </div>
                  <div className="md:col-span-2">
                     <label className="block text-xs font-semibold text-gray-700 mb-1">Application Link</label>
                     <input type="text" name="applicationLink" value={form.applicationLink} onChange={handleFormChange} className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 text-sm" />
                  </div>
                </div>
              )}
              {step === 2 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Requirements</label>
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <input type="text" name="currentRequirement" value={form.currentRequirement} onChange={handleFormChange} className="flex-1 px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 text-sm" placeholder="Add a requirement" />
                    <button type="button" onClick={handleAddRequirement} className="px-2 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 w-full sm:w-auto text-xs">Add</button>
                  </div>
                  <ul className="list-disc pl-6">
                    {form.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-center justify-between mb-1">
                        <span>{req}</span>
                        <button type="button" onClick={() => handleRemoveRequirement(idx)} className="text-red-500 hover:text-red-700 ml-2">
                          <Icon icon="carbon:trash-can" className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-gray-900 mb-1">Review & Submit</h4>
                  <div className="bg-gray-50 rounded-xl p-2">
                    <div className="mb-1 text-xs"><span className="font-semibold">Title:</span> {form.title}</div>
                    <div className="mb-1 text-xs"><span className="font-semibold">Type:</span> {form.type}</div>
                    <div className="mb-1 text-xs"><span className="font-semibold">Location:</span> {form.location}</div>
                    <div className="mb-1 text-xs"><span className="font-semibold">Start Date:</span> {form.startDate}</div>
                    <div className="mb-1 text-xs"><span className="font-semibold">End Date:</span> {form.endDate}</div>
                    <div className="mb-1 text-xs"><span className="font-semibold">Description:</span> {form.description}</div>
                    <div className="mb-1 text-xs"><span className="font-semibold">Image:</span> {form.imageFile ? form.imageFile.name : 'No image uploaded'}</div>
                    <div className="mb-1 text-xs"><span className="font-semibold">Application Link:</span> {form.applicationLink}</div>
                    <div className="mb-1 text-xs"><span className="font-semibold">Requirements:</span>
                      <ul className="list-disc pl-6">
                        {form.requirements.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              {formError && <div className="text-red-600 text-xs animate-pulse">{formError}</div>}
              <div className="flex flex-col sm:flex-row justify-between pt-2 border-t border-gray-100 gap-1">
                <button type="button" onClick={handleCloseModal} className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-all duration-200 text-xs">Cancel</button>
                <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
                  {step > 0 && (
                    <button type="button" onClick={handleStepBack} className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-all duration-200 text-xs">Back</button>
                  )}
                  {step < steps.length - 1 ? (
                    <button type="button" onClick={handleStepNext} className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 text-xs">Next</button>
                  ) : (
                    <button type="submit" disabled={submitting} className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-xs">
                      {submitting ? <Icon icon="eos-icons:loading" className="h-4 w-4 animate-spin inline mr-2" /> : null}
                      {editingCareer ? 'Update Career' : 'Add Career'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareersTable; 