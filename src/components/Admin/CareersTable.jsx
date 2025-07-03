import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';

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
    imageUrl: '',
    currentRequirement: '',
  };
  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      const response = await axios.get('http://localhost:3000/api/carriers', {
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
      await axios.delete(`http://localhost:3000/api/carriers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCareers(careers.filter(career => career.id !== id));
    } catch (err) {
      alert('Failed to delete career.');
    }
  };

  // Placeholder for edit (modal or inline)
  const handleEdit = (career) => {
    alert('Edit functionality coming soon!');
  };

  const handleOpenModal = () => {
    setForm(defaultForm);
    setFormError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormError('');
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3000/api/carriers', {
        title: form.title,
        type: form.type,
        location: form.location,
        description: form.description,
        requirements: form.requirements,
        startDate: form.startDate,
        endDate: form.endDate,
        applicationLink: form.applicationLink,
        imageUrl: form.imageUrl,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCareers([response.data.career, ...careers]);
      setShowModal(false);
      setForm(defaultForm);
    } catch (err) {
      setFormError('Failed to add career.');
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {careers.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">No careers found.</td></tr>
              ) : careers.map((career) => (
                <tr key={career.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{career.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate">{career.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{career.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleEdit(career)} className="text-teal-600 hover:text-teal-900 mr-3">
                      <Icon icon="carbon:edit" className="h-4 w-4 inline mr-1" />
                    </button>
                    <button onClick={() => handleDelete(career.id)} className="text-red-600 hover:text-red-900">
                      <Icon icon="carbon:trash-can" className="h-4 w-4 inline mr-1" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Add Career Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-auto transform transition-all duration-300 ease-out border border-gray-100 overflow-hidden">
            {/* Gradient Header with Stepper */}
            <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-6 text-white flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Icon icon="carbon:briefcase" className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Add New Career</h2>
                    <p className="text-green-100 text-sm mt-1">Step {step + 1} of {steps.length}: {steps[step]}</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
                >
                  <Icon icon="carbon:close" className="h-6 w-6" />
                </button>
              </div>
              {/* Stepper */}
              <div className="flex items-center justify-center gap-2 mt-2">
                {steps.map((s, idx) => (
                  <div key={s} className={`h-2 rounded-full transition-all duration-300 ${idx <= step ? 'bg-white w-12' : 'bg-white/30 w-6'}`}></div>
                ))}
              </div>
            </div>
            {/* Modal Content - Multi-step Form */}
            <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
              {step === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title*</label>
                    <input type="text" name="title" value={form.title} onChange={handleFormChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Job Type*</label>
                    <select name="type" value={form.type} onChange={handleFormChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 appearance-none bg-white" required>
                      <option value="FULL_TIME">Full-time</option>
                      <option value="PART_TIME">Part-time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="INTERNSHIP">Internship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location*</label>
                    <input type="text" name="location" value={form.location} onChange={handleFormChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date*</label>
                    <input type="date" name="startDate" value={form.startDate} onChange={handleFormChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date*</label>
                    <input type="date" name="endDate" value={form.endDate} onChange={handleFormChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200" required />
                  </div>
                </div>
              )}
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description*</label>
                    <textarea name="description" value={form.description} onChange={handleFormChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 resize-none" rows={3} required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
                    <input type="text" name="imageUrl" value={form.imageUrl} onChange={handleFormChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Application Link</label>
                    <input type="text" name="applicationLink" value={form.applicationLink} onChange={handleFormChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200" />
                  </div>
                </div>
              )}
              {step === 2 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Requirements</label>
                  <div className="flex gap-2 mb-2">
                    <input type="text" name="currentRequirement" value={form.currentRequirement} onChange={handleFormChange} className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200" placeholder="Add a requirement" />
                    <button type="button" onClick={handleAddRequirement} className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200">Add</button>
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
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Review & Submit</h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="mb-2"><span className="font-semibold">Title:</span> {form.title}</div>
                    <div className="mb-2"><span className="font-semibold">Type:</span> {form.type}</div>
                    <div className="mb-2"><span className="font-semibold">Location:</span> {form.location}</div>
                    <div className="mb-2"><span className="font-semibold">Start Date:</span> {form.startDate}</div>
                    <div className="mb-2"><span className="font-semibold">End Date:</span> {form.endDate}</div>
                    <div className="mb-2"><span className="font-semibold">Description:</span> {form.description}</div>
                    <div className="mb-2"><span className="font-semibold">Image URL:</span> {form.imageUrl}</div>
                    <div className="mb-2"><span className="font-semibold">Application Link:</span> {form.applicationLink}</div>
                    <div className="mb-2"><span className="font-semibold">Requirements:</span>
                      <ul className="list-disc pl-6">
                        {form.requirements.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              {formError && <div className="text-red-600 text-sm animate-pulse">{formError}</div>}
              <div className="flex justify-between pt-4 border-t border-gray-100">
                <button type="button" onClick={handleCloseModal} className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-all duration-200">Cancel</button>
                <div className="flex gap-2">
                  {step > 0 && (
                    <button type="button" onClick={handleStepBack} className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-all duration-200">Back</button>
                  )}
                  {step < steps.length - 1 ? (
                    <button type="button" onClick={handleStepNext} className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">Next</button>
                  ) : (
                    <button type="submit" disabled={submitting} className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                      {submitting ? <Icon icon="eos-icons:loading" className="h-4 w-4 animate-spin inline mr-2" /> : null}
                      Add Career
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