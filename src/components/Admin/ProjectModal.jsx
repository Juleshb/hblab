import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

const ProjectModal = ({ project, mode, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager: '',
    teamSize: '',
    status: 'planning',
    progress: 0,
    startDate: '',
    endDate: '',
    budget: '',
    client: '',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    'Basic Info',
    'Timeline & Budget',
    'Description',
    'Review & Submit'
  ];
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (project && mode !== 'add') {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        manager: project.manager || '',
        teamSize: project.teamSize || '',
        status: project.status || 'planning',
        progress: project.progress || 0,
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
        budget: project.budget || '',
        client: project.client || '',
        priority: project.priority || 'medium'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        manager: '',
        teamSize: '',
        status: 'planning',
        progress: 0,
        startDate: '',
        endDate: '',
        budget: '',
        client: '',
        priority: 'medium'
      });
    }
  }, [project, mode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = mode === 'add' ? '/api/projects' : `/api/projects/${project.id}`;
      const method = mode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSave();
      } else {
        console.error('Error saving project');
      }
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 0) {
      if (!formData.name.trim()) newErrors.name = 'Project name is required';
      if (!formData.manager.trim()) newErrors.manager = 'Manager is required';
      if (!formData.status) newErrors.status = 'Status is required';
      if (!formData.priority) newErrors.priority = 'Priority is required';
    } else if (step === 1) {
      if (!formData.startDate) newErrors.startDate = 'Start date is required';
      if (!formData.endDate) newErrors.endDate = 'End date is required';
      if (!formData.budget) newErrors.budget = 'Budget is required';
      if (!formData.teamSize) newErrors.teamSize = 'Team size is required';
      if (!formData.progress && formData.progress !== 0) newErrors.progress = 'Progress is required';
    } else if (step === 2) {
      if (!formData.description.trim()) newErrors.description = 'Description is required';
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: 'carbon:play' },
      completed: { color: 'bg-purple-100 text-purple-800', icon: 'carbon:checkmark' },
      on_hold: { color: 'bg-yellow-100 text-yellow-800', icon: 'carbon:pause' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: 'carbon:close' },
      planning: { color: 'bg-blue-100 text-blue-800', icon: 'carbon:planning' }
    };

    const config = statusConfig[status] || statusConfig.planning;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon icon={config.icon} className="h-4 w-4 mr-2" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      high: { color: 'bg-red-100 text-red-800', icon: 'carbon:warning' },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: 'carbon:information' },
      low: { color: 'bg-green-100 text-green-800', icon: 'carbon:checkmark' }
    };

    const config = priorityConfig[priority] || priorityConfig.medium;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon icon={config.icon} className="h-3 w-3 mr-1" />
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Enhanced Backdrop with blur effect */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Enhanced Modal with gradient and better styling */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl mx-auto transform transition-all duration-300 ease-out border border-gray-100 overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Icon icon="carbon:project" className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {mode === 'add' ? 'Add New Project' : mode === 'edit' ? 'Edit Project' : 'Project Details'}
                </h2>
                <p className="text-green-100 text-sm mt-1">
                  {mode === 'add' ? 'Create a new project' : mode === 'edit' ? 'Update project information' : 'View project information'}
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

        {/* Enhanced Content */}
        <div className="p-8">
          {mode === 'view' ? (
            // Enhanced View Mode
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Icon icon="carbon:information" className="h-5 w-5 mr-2 text-blue-500" />
                    Project Information
                  </h4>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 space-y-4 border border-gray-200">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Project Name</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{project.name}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                      <p className="text-sm text-gray-700 mt-1 leading-relaxed">{project.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                        <div className="mt-1">{getStatusBadge(project.status)}</div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</label>
                        <div className="mt-1">{getPriorityBadge(project.priority)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Icon icon="carbon:user-multiple" className="h-5 w-5 mr-2 text-green-500" />
                    Team & Management
                  </h4>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 space-y-4 border border-gray-200">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Project Manager</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{project.manager}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Team Size</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{project.teamSize} members</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Icon icon="carbon:calendar" className="h-5 w-5 mr-2 text-purple-500" />
                    Timeline & Budget
                  </h4>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 space-y-4 border border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Start Date</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">End Date</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Budget</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        ${project.budget ? Number(project.budget).toLocaleString() : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{project.client || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Icon icon="carbon:chart-line" className="h-5 w-5 mr-2 text-orange-500" />
                    Progress
                  </h4>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Completion</span>
                      <span className="text-lg font-bold text-gray-900">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Enhanced Form Mode
            <form onSubmit={step === steps.length - 1 ? handleSubmit : handleNext} className="space-y-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Project Name */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Project Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 border-gray-200 hover:border-gray-300 ${errors.name ? 'border-red-300 bg-red-50' : ''}`}
                      placeholder="Enter project name"
                      required
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-2 animate-pulse">{errors.name}</p>}
                  </div>
                  {/* Project Manager */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Project Manager <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="manager"
                      value={formData.manager}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 border-gray-200 hover:border-gray-300 ${errors.manager ? 'border-red-300 bg-red-50' : ''}`}
                      placeholder="Enter manager name"
                      required
                    />
                    {errors.manager && <p className="text-red-500 text-sm mt-2 animate-pulse">{errors.manager}</p>}
                  </div>
                  {/* Status */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Status <span className="text-red-500">*</span></label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 border-gray-200 hover:border-gray-300 appearance-none bg-white ${errors.status ? 'border-red-300 bg-red-50' : ''}`}
                      required
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {errors.status && <p className="text-red-500 text-sm mt-2 animate-pulse">{errors.status}</p>}
                  </div>
                  {/* Priority */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Priority <span className="text-red-500">*</span></label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 border-gray-200 hover:border-gray-300 appearance-none bg-white ${errors.priority ? 'border-red-300 bg-red-50' : ''}`}
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    {errors.priority && <p className="text-red-500 text-sm mt-2 animate-pulse">{errors.priority}</p>}
                  </div>
                </div>
              )}
              {/* Step 2: Timeline & Budget */}
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Start Date */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Start Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 border-gray-200 hover:border-gray-300 ${errors.startDate ? 'border-red-300 bg-red-50' : ''}`}
                      required
                    />
                    {errors.startDate && <p className="text-red-500 text-sm mt-2 animate-pulse">{errors.startDate}</p>}
                  </div>
                  {/* End Date */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">End Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 border-gray-200 hover:border-gray-300 ${errors.endDate ? 'border-red-300 bg-red-50' : ''}`}
                      required
                    />
                    {errors.endDate && <p className="text-red-500 text-sm mt-2 animate-pulse">{errors.endDate}</p>}
                  </div>
                  {/* Budget */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Budget <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 border-gray-200 hover:border-gray-300 ${errors.budget ? 'border-red-300 bg-red-50' : ''}`}
                      placeholder="Enter budget"
                      required
                    />
                    {errors.budget && <p className="text-red-500 text-sm mt-2 animate-pulse">{errors.budget}</p>}
                  </div>
                  {/* Team Size */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Team Size <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      name="teamSize"
                      value={formData.teamSize}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 border-gray-200 hover:border-gray-300 ${errors.teamSize ? 'border-red-300 bg-red-50' : ''}`}
                      placeholder="Enter team size"
                      required
                    />
                    {errors.teamSize && <p className="text-red-500 text-sm mt-2 animate-pulse">{errors.teamSize}</p>}
                  </div>
                  {/* Progress */}
                  <div className="group md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Progress (%) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      name="progress"
                      value={formData.progress}
                      onChange={handleInputChange}
                      min={0}
                      max={100}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 border-gray-200 hover:border-gray-300 ${errors.progress ? 'border-red-300 bg-red-50' : ''}`}
                      placeholder="Enter progress (0-100)"
                      required
                    />
                    {errors.progress && <p className="text-red-500 text-sm mt-2 animate-pulse">{errors.progress}</p>}
                  </div>
                  {/* Client */}
                  <div className="group md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Client</label>
                    <input
                      type="text"
                      name="client"
                      value={formData.client}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 border-gray-200 hover:border-gray-300"
                      placeholder="Enter client name (optional)"
                    />
                  </div>
                </div>
              )}
              {/* Step 3: Description */}
              {step === 2 && (
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Description <span className="text-red-500">*</span></label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 border-gray-200 hover:border-gray-300 ${errors.description ? 'border-red-300 bg-red-50' : ''}`}
                    rows={5}
                    placeholder="Describe the project..."
                    required
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-2 animate-pulse">{errors.description}</p>}
                </div>
              )}
              {/* Step 4: Review & Submit */}
              {step === 3 && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Icon icon="carbon:checkmark" className="h-5 w-5 mr-2 text-green-500" />
                    Review Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700">
                      <Icon icon="carbon:project" className="h-4 w-4 mr-3 text-green-500" />
                      <span className="font-medium">Name:</span>
                      <span className="ml-2">{formData.name}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Icon icon="carbon:user" className="h-4 w-4 mr-3 text-green-500" />
                      <span className="font-medium">Manager:</span>
                      <span className="ml-2">{formData.manager}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Icon icon="carbon:status" className="h-4 w-4 mr-3 text-green-500" />
                      <span className="font-medium">Status:</span>
                      <span className="ml-2">{formData.status}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Icon icon="carbon:warning" className="h-4 w-4 mr-3 text-green-500" />
                      <span className="font-medium">Priority:</span>
                      <span className="ml-2">{formData.priority}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Icon icon="carbon:calendar" className="h-4 w-4 mr-3 text-green-500" />
                      <span className="font-medium">Start Date:</span>
                      <span className="ml-2">{formData.startDate}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Icon icon="carbon:calendar" className="h-4 w-4 mr-3 text-green-500" />
                      <span className="font-medium">End Date:</span>
                      <span className="ml-2">{formData.endDate}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Icon icon="carbon:money" className="h-4 w-4 mr-3 text-green-500" />
                      <span className="font-medium">Budget:</span>
                      <span className="ml-2">${formData.budget}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Icon icon="carbon:user-multiple" className="h-4 w-4 mr-3 text-green-500" />
                      <span className="font-medium">Team Size:</span>
                      <span className="ml-2">{formData.teamSize}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Icon icon="carbon:chart-line" className="h-4 w-4 mr-3 text-green-500" />
                      <span className="font-medium">Progress:</span>
                      <span className="ml-2">{formData.progress}%</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Icon icon="carbon:information" className="h-4 w-4 mr-3 text-green-500" />
                      <span className="font-medium">Client:</span>
                      <span className="ml-2">{formData.client || 'N/A'}</span>
                    </div>
                    <div className="flex items-start text-gray-700">
                      <Icon icon="carbon:document" className="h-4 w-4 mr-3 mt-0.5 text-green-500" />
                      <span className="font-medium">Description:</span>
                      <span className="ml-2">{formData.description}</span>
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
                        Create Project
                      </div>
                    )}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectModal; 