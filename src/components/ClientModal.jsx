import React, { useEffect } from 'react';
import { Icon } from '@iconify/react';

const ClientModal = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  type = 'info', // 'info', 'success', 'warning', 'error', 'form'
  size = 'medium', // 'small', 'medium', 'large', 'full'
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  loading = false,
  actions = null
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  // Modal size classes
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    full: 'max-w-4xl'
  };

  // Modal type configurations
  const typeConfig = {
    info: {
      icon: 'carbon:information',
      color: 'blue',
      bgGradient: 'from-blue-500 via-blue-600 to-blue-700',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    success: {
      icon: 'carbon:checkmark',
      color: 'green',
      bgGradient: 'from-green-500 via-green-600 to-green-700',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    warning: {
      icon: 'carbon:warning',
      color: 'yellow',
      bgGradient: 'from-yellow-500 via-yellow-600 to-yellow-700',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    error: {
      icon: 'carbon:close',
      color: 'red',
      bgGradient: 'from-red-500 via-red-600 to-red-700',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    form: {
      icon: 'carbon:document',
      color: 'purple',
      bgGradient: 'from-purple-500 via-purple-600 to-purple-700',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  };

  const config = typeConfig[type];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Enhanced backdrop with blur effect */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      {/* Modal container */}
      <div className={`relative bg-white rounded-3xl shadow-2xl w-full ${sizeClasses[size]} mx-auto transform transition-all duration-300 ease-out border border-gray-100 overflow-hidden`}>
        {/* Government-style header */}
        <div className={`bg-gradient-to-r ${config.bgGradient} p-6 text-white relative overflow-hidden`}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Icon container */}
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Icon icon={config.icon} className="h-7 w-7 text-white" />
              </div>
              
              {/* Title and subtitle */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-white/90 text-sm mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            
            {/* Close button */}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
                disabled={loading}
              >
                <Icon icon="carbon:close" className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Processing...</p>
            </div>
          </div>
        )}

        {/* Modal content */}
        <div className="p-6">
          {children}
        </div>

        {/* Action buttons */}
        {actions && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-end space-x-3">
              {actions}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Predefined modal types for common use cases
export const InfoModal = ({ isOpen, onClose, title, subtitle, children, ...props }) => (
  <ClientModal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    subtitle={subtitle}
    type="info"
    {...props}
  >
    {children}
  </ClientModal>
);

export const SuccessModal = ({ isOpen, onClose, title, subtitle, children, ...props }) => (
  <ClientModal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    subtitle={subtitle}
    type="success"
    {...props}
  >
    {children}
  </ClientModal>
);

export const WarningModal = ({ isOpen, onClose, title, subtitle, children, ...props }) => (
  <ClientModal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    subtitle={subtitle}
    type="warning"
    {...props}
  >
    {children}
  </ClientModal>
);

export const ErrorModal = ({ isOpen, onClose, title, subtitle, children, ...props }) => (
  <ClientModal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    subtitle={subtitle}
    type="error"
    {...props}
  >
    {children}
  </ClientModal>
);

export const FormModal = ({ isOpen, onClose, title, subtitle, children, ...props }) => (
  <ClientModal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    subtitle={subtitle}
    type="form"
    {...props}
  >
    {children}
  </ClientModal>
);

// Confirmation modal component
export const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  onConfirm,
  type = "warning",
  loading = false
}) => {
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    onClose();
  };

  return (
    <ClientModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      type={type}
      size="small"
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      showCloseButton={!loading}
    >
      <div className="text-center py-4">
        <p className="text-gray-700 mb-6">{message}</p>
        
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-all duration-200 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-6 py-2 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
              type === 'error' 
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                : type === 'warning'
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </ClientModal>
  );
};

export default ClientModal; 