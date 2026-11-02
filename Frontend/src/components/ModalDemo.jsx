import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ClientModal, { 
  InfoModal, 
  SuccessModal, 
  WarningModal, 
  ErrorModal, 
  FormModal, 
  ConfirmationModal 
} from './ClientModal';
import LoadingSpinner, { 
  InlineSpinner, 
  ButtonSpinner, 
  PageSpinner 
} from './LoadingSpinner';

const ModalDemo = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState({});
  const [showLoading, setShowLoading] = useState(false);
  const [loadingType, setLoadingType] = useState('spinner');

  const openModal = (type, data = {}) => {
    setActiveModal(type);
    setModalData(data);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData({});
  };

  const showLoadingExample = (type) => {
    setLoadingType(type);
    setShowLoading(true);
    setTimeout(() => setShowLoading(false), 3000);
  };

  const handleConfirm = async () => {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    closeModal();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Modal & Loader Components Demo
          </h1>
          <p className="text-xl text-gray-600">
            Irembo-inspired design system for HB-LAB
          </p>
        </div>

        {/* Modal Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Info Modal */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Info Modal</h3>
              <p className="text-blue-100">Display informational content</p>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Perfect for displaying helpful information, tips, or general announcements.
              </p>
              <button
                onClick={() => openModal('info', {
                  title: 'Information',
                  subtitle: 'This is an informational modal',
                  content: 'This modal is designed to display helpful information to users. It uses a blue color scheme to indicate informational content.'
                })}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
              >
                Show Info Modal
              </button>
            </div>
          </motion.div>

          {/* Success Modal */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Success Modal</h3>
              <p className="text-green-100">Display success messages</p>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Use this modal to confirm successful actions, completions, or positive outcomes.
              </p>
              <button
                onClick={() => openModal('success', {
                  title: 'Success!',
                  subtitle: 'Your action was completed successfully',
                  content: 'The operation has been completed successfully. You can now proceed with your next steps.'
                })}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200"
              >
                Show Success Modal
              </button>
            </div>
          </motion.div>

          {/* Warning Modal */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Warning Modal</h3>
              <p className="text-yellow-100">Display warning messages</p>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Ideal for displaying warnings, cautions, or important notices to users.
              </p>
              <button
                onClick={() => openModal('warning', {
                  title: 'Warning',
                  subtitle: 'Please review this information',
                  content: 'This action may have consequences. Please review the information carefully before proceeding.'
                })}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200"
              >
                Show Warning Modal
              </button>
            </div>
          </motion.div>

          {/* Error Modal */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Error Modal</h3>
              <p className="text-red-100">Display error messages</p>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Use this modal to display error messages, failures, or issues that need attention.
              </p>
              <button
                onClick={() => openModal('error', {
                  title: 'Error Occurred',
                  subtitle: 'Something went wrong',
                  content: 'An error has occurred while processing your request. Please try again or contact support if the problem persists.'
                })}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200"
              >
                Show Error Modal
              </button>
            </div>
          </motion.div>

          {/* Form Modal */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Form Modal</h3>
              <p className="text-purple-100">Display forms and inputs</p>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Perfect for displaying forms, input fields, or data entry interfaces.
              </p>
              <button
                onClick={() => openModal('form', {
                  title: 'Contact Form',
                  subtitle: 'Send us a message',
                  content: 'form'
                })}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
              >
                Show Form Modal
              </button>
            </div>
          </motion.div>

          {/* Confirmation Modal */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Confirmation Modal</h3>
              <p className="text-orange-100">Confirm user actions</p>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Use this modal to confirm important actions, deletions, or irreversible operations.
              </p>
              <button
                onClick={() => openModal('confirmation', {
                  title: 'Confirm Action',
                  message: 'Are you sure you want to delete this item? This action cannot be undone.',
                  confirmText: 'Delete',
                  cancelText: 'Cancel',
                  type: 'warning'
                })}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
              >
                Show Confirmation Modal
              </button>
            </div>
          </motion.div>
        </div>

        {/* Loading Examples */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Loading Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <h3 className="font-semibold text-gray-700 mb-3">Full Screen Spinner</h3>
              <button
                onClick={() => showLoadingExample('spinner')}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200"
              >
                Show Loading Spinner
              </button>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-700 mb-3">Page Spinner</h3>
              <button
                onClick={() => showLoadingExample('page')}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
              >
                Show Page Spinner
              </button>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-700 mb-3">Inline Spinner</h3>
              <div className="flex items-center justify-center space-x-2">
                <InlineSpinner size="medium" />
                <span className="text-gray-600">Loading...</span>
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-700 mb-3">Button Spinner</h3>
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg flex items-center space-x-2">
                <ButtonSpinner size="small" />
                <span>Processing...</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Size Examples */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Modal Sizes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => openModal('size', { size: 'small', title: 'Small Modal' })}
              className="py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-200"
            >
              Small Modal
            </button>
            <button
              onClick={() => openModal('size', { size: 'medium', title: 'Medium Modal' })}
              className="py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
            >
              Medium Modal
            </button>
            <button
              onClick={() => openModal('size', { size: 'large', title: 'Large Modal' })}
              className="py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200"
            >
              Large Modal
            </button>
            <button
              onClick={() => openModal('size', { size: 'full', title: 'Full Modal' })}
              className="py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
            >
              Full Modal
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'info' && (
        <InfoModal
          isOpen={true}
          onClose={closeModal}
          title={modalData.title}
          subtitle={modalData.subtitle}
        >
          <div className="py-4">
            <p className="text-gray-700">{modalData.content}</p>
          </div>
        </InfoModal>
      )}

      {activeModal === 'success' && (
        <SuccessModal
          isOpen={true}
          onClose={closeModal}
          title={modalData.title}
          subtitle={modalData.subtitle}
        >
          <div className="py-4">
            <p className="text-gray-700">{modalData.content}</p>
          </div>
        </SuccessModal>
      )}

      {activeModal === 'warning' && (
        <WarningModal
          isOpen={true}
          onClose={closeModal}
          title={modalData.title}
          subtitle={modalData.subtitle}
        >
          <div className="py-4">
            <p className="text-gray-700">{modalData.content}</p>
          </div>
        </WarningModal>
      )}

      {activeModal === 'error' && (
        <ErrorModal
          isOpen={true}
          onClose={closeModal}
          title={modalData.title}
          subtitle={modalData.subtitle}
        >
          <div className="py-4">
            <p className="text-gray-700">{modalData.content}</p>
          </div>
        </ErrorModal>
      )}

      {activeModal === 'form' && (
        <FormModal
          isOpen={true}
          onClose={closeModal}
          title={modalData.title}
          subtitle={modalData.subtitle}
          size="large"
        >
          <div className="py-4">
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 resize-none"
                  placeholder="Enter your message"
                ></textarea>
              </div>
            </form>
          </div>
        </FormModal>
      )}

      {activeModal === 'confirmation' && (
        <ConfirmationModal
          isOpen={true}
          onClose={closeModal}
          title={modalData.title}
          message={modalData.message}
          confirmText={modalData.confirmText}
          cancelText={modalData.cancelText}
          type={modalData.type}
          onConfirm={handleConfirm}
        />
      )}

      {activeModal === 'size' && (
        <ClientModal
          isOpen={true}
          onClose={closeModal}
          title={modalData.title}
          subtitle={`This is a ${modalData.size} modal`}
          size={modalData.size}
          type="info"
        >
          <div className="py-4">
            <p className="text-gray-700">
              This modal demonstrates the {modalData.size} size variant. 
              Modal sizes can be: small, medium, large, or full.
            </p>
          </div>
        </ClientModal>
      )}

      {/* Loading States */}
      {showLoading && loadingType === 'spinner' && (
        <LoadingSpinner message="Processing your request..." />
      )}

      {showLoading && loadingType === 'page' && (
        <PageSpinner 
          title="Loading Application" 
          subtitle="Please wait while we prepare your dashboard"
        />
      )}
    </div>
  );
};

export default ModalDemo; 