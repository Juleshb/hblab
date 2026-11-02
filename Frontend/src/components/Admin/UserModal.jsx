import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

const UserModal = ({ isOpen, onClose, user = null, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditing = !!user;

  const steps = [
    'Basic Info',
    'Account Info',
    'Review & Submit'
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // Don't populate password for editing
        role: user.role || 'STUDENT'
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'STUDENT'
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 0) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    } else if (step === 1) {
      if (!isEditing && !formData.password.trim()) newErrors.password = 'Password is required';
      else if (formData.password && formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (!formData.role) newErrors.role = 'Role is required';
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
    
    if (!validateStep()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData, isEditing);
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Enhanced Backdrop with blur effect */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      {/* Enhanced Modal with gradient and better styling */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-auto transform transition-all duration-300 ease-out border border-gray-100 overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Icon 
                  icon={isEditing ? "carbon:edit" : "carbon:user-add"} 
                  className="h-7 w-7 text-white" 
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {isEditing ? 'Edit User' : 'Add New User'}
                </h2>
                <p className="text-green-100 text-sm mt-1">
                  {isEditing ? 'Update user information' : 'Create a new user account'}
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

        {/* Enhanced Form */}
        {!isEditing ? (
          <form onSubmit={step === steps.length - 1 ? handleSubmit : handleNext} className="p-8 space-y-6">
            {/* Stepper */}
            <div className="flex justify-center items-center py-4 bg-gradient-to-r from-green-50 to-green-100 mb-6">
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
            {/* Step 1: Basic Info */}
            {step === 0 && (
              <>
                {/* Name Field */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-2 flex items-center animate-pulse">
                      <Icon icon="carbon:warning" className="h-4 w-4 mr-2" />
                      {errors.name}
                    </p>
                  )}
                </div>
                {/* Email Field */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Email Address <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-2 flex items-center animate-pulse">
                      <Icon icon="carbon:warning" className="h-4 w-4 mr-2" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </>
            )}
            {/* Step 2: Account Info */}
            {step === 1 && (
              <>
                {/* Password Field */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Password <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                    placeholder="Enter password"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-2 flex items-center animate-pulse">
                      <Icon icon="carbon:warning" className="h-4 w-4 mr-2" />
                      {errors.password}
                    </p>
                  )}
                </div>
                {/* Role Field */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Role <span className="text-red-500">*</span></label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 ${errors.role ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                    required
                  >
                    <option value="STUDENT">Student</option>
                    <option value="ADMIN">Admin</option>
                    <option value="APPLICANT">Applicant</option>
                  </select>
                  {errors.role && (
                    <p className="text-red-500 text-sm mt-2 flex items-center animate-pulse">
                      <Icon icon="carbon:warning" className="h-4 w-4 mr-2" />
                      {errors.role}
                    </p>
                  )}
                </div>
              </>
            )}
            {/* Step 3: Review & Submit */}
            {step === 2 && (
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
                    <Icon icon="carbon:password" className="h-4 w-4 mr-3 text-green-500" />
                    <span className="font-medium">Password:</span>
                    <span className="ml-2">{formData.password ? '••••••' : 'Not set'}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Icon icon="carbon:user-role" className="h-4 w-4 mr-3 text-green-500" />
                    <span className="font-medium">Role:</span>
                    <span className="ml-2">{formData.role}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-4 flex items-center">
                  <Icon icon="carbon:information" className="h-4 w-4 mr-2" />
                  Please review the information before submitting.
                </div>
              </div>
            )}
            {/* Navigation Buttons */}
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
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Icon icon="carbon:add" className="h-4 w-4 mr-2" />
                      Create User
                    </div>
                  )}
                </button>
              )}
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-6">
              {/* Name Field */}
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
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
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

              {/* Email Field */}
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
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
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

              {/* Password Field */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Password {!isEditing && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icon icon="carbon:password" className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                    placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
                  />
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-2 flex items-center animate-pulse">
                    <Icon icon="carbon:warning" className="h-4 w-4 mr-2" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Role Field */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  User Role <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icon icon="carbon:user-role" className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                  </div>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 border-gray-200 hover:border-gray-300 appearance-none bg-white"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="ADMIN">Admin</option>
                    <option value="APPLICANT">Applicant</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Icon icon="carbon:chevron-down" className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Icon icon={isEditing ? "carbon:checkmark" : "carbon:add"} className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update User' : 'Create User'}
                  </div>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserModal; 