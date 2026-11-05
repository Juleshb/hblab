import { apiOrigin } from '../../apiOrigin';
// components/AddTrainerModal.jsx
import { useState } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';

const steps = [
  'Basic Info',
  'Professional Info',
  'Review & Submit'
];

const AddTrainerModal = ({ isOpen, onClose, onAddTrainer }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    specialization: '',
    bio: '',
    status: 'Active'
  });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 0) {
      if (!formData.name.trim()) newErrors.name = 'Full name is required';
      if (!formData.email.trim()) newErrors.email = 'Email address is required';
      else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
      if (!formData.password.trim()) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    } else if (step === 1) {
      if (!formData.specialization.trim()) newErrors.specialization = 'Specialization is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validateStep()) setStep(step + 1);
  };
  const handleBack = (e) => {
    e.preventDefault();
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Token being sent (AddTrainerModal):', token);
      const response = await axios.post(`${apiOrigin}/api/admin/users`, {
        ...formData,
        role: 'ADMIN'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onAddTrainer(response.data);
      onClose();
      setFormData({ name: '', email: '', password: '', specialization: '', bio: '', status: 'Active' });
      setStep(0);
      setErrors({});
    } catch (error) {
      if (error.response?.data?.error) setErrors({ submit: error.response.data.error });
      else setErrors({ submit: 'Failed to add trainer. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Enhanced Backdrop with blur effect */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Enhanced Modal with gradient and better styling */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-auto transform transition-all duration-300 ease-out border border-gray-100 overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Icon icon="carbon:user-certification" className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Add New Trainer
                </h2>
                <p className="text-green-100 text-sm mt-1">
                  Step {step + 1} of {steps.length}: {steps[step]}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
            >
              <Icon icon="carbon:close" className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Enhanced Stepper */}
        <div className="flex justify-center items-center py-4 bg-gradient-to-r from-green-50 to-green-100">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                i === step 
                  ? 'bg-green-600 text-white shadow-lg' 
                  : i < step 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {i < step ? <Icon icon="carbon:checkmark" className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-12 h-1 mx-2 transition-all duration-300 ${
                  i < step ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Enhanced Form Steps */}
        <form onSubmit={step === steps.length - 1 ? handleSubmit : handleNext} className="p-8 space-y-6">
          {step === 0 && (
            <>
              {/* Full Name */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icon icon="carbon:user" className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`} 
                    placeholder="Enter full name" 
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-2 flex items-center animate-pulse">
                    <Icon icon="carbon:warning" className="h-4 w-4 mr-2" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icon icon="carbon:email" className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                  </div>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`} 
                    placeholder="Enter email address" 
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-2 flex items-center animate-pulse">
                    <Icon icon="carbon:warning" className="h-4 w-4 mr-2" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icon icon="carbon:password" className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                  </div>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`} 
                    placeholder="Enter password" 
                  />
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-2 flex items-center animate-pulse">
                    <Icon icon="carbon:warning" className="h-4 w-4 mr-2" />
                    {errors.password}
                  </p>
                )}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              {/* Specialization */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Specialization <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icon icon="carbon:skill-level" className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                  </div>
                  <select 
                    name="specialization" 
                    value={formData.specialization} 
                    onChange={handleChange} 
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 appearance-none bg-white ${
                      errors.specialization ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <option value="">Select specialization</option>
                    <option value="Frontend Development">Frontend Development</option>
                    <option value="Backend Development">Backend Development</option>
                    <option value="Data Science">Data Science</option>
                    <option value="DevOps">DevOps</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Cloud Computing">Cloud Computing</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Icon icon="carbon:chevron-down" className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                {errors.specialization && (
                  <p className="text-red-500 text-sm mt-2 flex items-center animate-pulse">
                    <Icon icon="carbon:warning" className="h-4 w-4 mr-2" />
                    {errors.specialization}
                  </p>
                )}
              </div>

              {/* Bio */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Bio
                </label>
                <textarea 
                  name="bio" 
                  value={formData.bio} 
                  onChange={handleChange} 
                  className="w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 resize-none border-gray-200 hover:border-gray-300" 
                  rows="4" 
                  placeholder="Brief introduction about the trainer..." 
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="relative">
                    <input 
                      type="radio" 
                      name="status" 
                      value="Active" 
                      checked={formData.status === 'Active'} 
                      onChange={handleChange} 
                      className="sr-only" 
                    />
                    <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      formData.status === 'Active' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          formData.status === 'Active' 
                            ? 'border-green-500 bg-green-500' 
                            : 'border-gray-300'
                        }`}>
                          {formData.status === 'Active' && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                        <span className="font-medium">Active</span>
                      </div>
                    </div>
                  </label>
                  <label className="relative">
                    <input 
                      type="radio" 
                      name="status" 
                      value="Inactive" 
                      checked={formData.status === 'Inactive'} 
                      onChange={handleChange} 
                      className="sr-only" 
                    />
                    <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      formData.status === 'Inactive' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          formData.status === 'Inactive' 
                            ? 'border-green-500 bg-green-500' 
                            : 'border-gray-300'
                        }`}>
                          {formData.status === 'Inactive' && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                        <span className="font-medium">Inactive</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Icon icon="carbon:checkmark" className="h-5 w-5 mr-2 text-green-500" />
                  Review Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-700">
                    <Icon icon="carbon:user" className="h-4 w-4 mr-3 text-green-500" />
                    <span className="font-medium">Name:</span>
                    <span className="ml-2">{formData.name}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Icon icon="carbon:email" className="h-4 w-4 mr-3 text-green-500" />
                    <span className="font-medium">Email:</span>
                    <span className="ml-2">{formData.email}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Icon icon="carbon:skill-level" className="h-4 w-4 mr-3 text-green-500" />
                    <span className="font-medium">Specialization:</span>
                    <span className="ml-2">{formData.specialization}</span>
                  </div>
                  <div className="flex items-start text-gray-700">
                    <Icon icon="carbon:information" className="h-4 w-4 mr-3 mt-0.5 text-green-500" />
                    <span className="font-medium">Bio:</span>
                    <span className="ml-2">{formData.bio || 'No bio provided'}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Icon icon="carbon:status" className="h-4 w-4 mr-3 text-green-500" />
                    <span className="font-medium">Status:</span>
                    <span className="ml-2">{formData.status}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-4 flex items-center">
                  <Icon icon="carbon:information" className="h-4 w-4 mr-2" />
                  Please review the information before submitting.
                </div>
              </div>
            </>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm flex items-center">
                <Icon icon="carbon:warning" className="h-4 w-4 mr-2" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Enhanced Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-100">
            {step > 0 && (
              <button 
                type="button" 
                onClick={handleBack} 
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                <Icon icon="carbon:arrow-left" className="h-4 w-4 mr-2" />
                Back
              </button>
            )}
            {step < steps.length - 1 && (
              <button 
                type="submit" 
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Icon icon="carbon:arrow-right" className="h-4 w-4 mr-2" />
                Next
              </button>
            )}
            {step === steps.length - 1 && (
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Icon icon="carbon:add" className="h-4 w-4 mr-2" />
                    Create Trainer
                  </div>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTrainerModal;