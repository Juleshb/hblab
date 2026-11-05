import React, { useState, useEffect } from 'react';
import HBLCertificateGenerator from '../HBLCertificateGenerator';
import { buildCertificateHtml } from '../certificate/certificateMarkup';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Icon } from '@iconify/react';
import { apiOrigin } from '../../apiOrigin';
// import HBLCertificate from '../HBLCertificate'; // If needed for row rendering

const CertificatesManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [certsPerPage] = useState(8);
  const [loading, setLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [deletingCertificate, setDeletingCertificate] = useState(null);
  const [editFormData, setEditFormData] = useState({
    recipientName: '',
    email: '',
    courseName: '',
    duration: '',
    dateRange: '',
    completionDate: '',
    skills: []
  });
  const [currentSkill, setCurrentSkill] = useState('');

  useEffect(() => {
    const fetchCertificates = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${apiOrigin}/api/certificates`);
        setCertificates(res.data);
      } catch (err) {
        console.error('Error fetching certificates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  // Pagination logic
  const indexOfLastCert = currentPage * certsPerPage;
  const indexOfFirstCert = indexOfLastCert - certsPerPage;
  const currentCerts = certificates.slice(indexOfFirstCert, indexOfLastCert);
  const totalPages = Math.ceil(certificates.length / certsPerPage);

  // Handle Edit
  const handleEdit = (certificate) => {
    setEditingCertificate(certificate);
    setEditFormData({
      recipientName: certificate.recipientName || '',
      email: certificate.email || '',
      courseName: certificate.courseName || '',
      duration: certificate.duration || '',
      dateRange: certificate.dateRange || '',
      completionDate: certificate.completionDate ? new Date(certificate.completionDate).toISOString().split('T')[0] : '',
      skills: certificate.skills || []
    });
    setShowEditModal(true);
  };

  // Handle Delete
  const handleDelete = (certificate) => {
    setDeletingCertificate(certificate);
    setShowDeleteModal(true);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!deletingCertificate) return;
    
    try {
      await axios.delete(`${apiOrigin}/api/certificates/${deletingCertificate.id}`);
      setCertificates(certificates.filter(cert => cert.id !== deletingCertificate.id));
      setShowDeleteModal(false);
      setDeletingCertificate(null);
    } catch (error) {
      console.error('Error deleting certificate:', error);
    }
  };

  // Handle Edit Form Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCertificate) return;

    try {
      console.log('Updating certificate:', editingCertificate.id);
      console.log('Update data:', editFormData);
      
      const response = await axios.put(`${apiOrigin}/api/certificates/${editingCertificate.id}`, editFormData);
      console.log('Update response:', response.data);
      
      setCertificates(certificates.map(cert => 
        cert.id === editingCertificate.id ? response.data : cert
      ));
      setShowEditModal(false);
      setEditingCertificate(null);
    } catch (error) {
      console.error('Error updating certificate:', error);
      console.error('Error response:', error.response?.data);
      alert(`Failed to update certificate: ${error.response?.data?.error || error.message}`);
    }
  };

  // Handle Edit Form Changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle Add Skill
  const handleAddSkill = () => {
    if (currentSkill.trim()) {
      setEditFormData(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()]
      }));
      setCurrentSkill('');
    }
  };

  // Handle Remove Skill
  const handleRemoveSkill = (index) => {
    setEditFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  // Generate PDF function from CertificateCheck component
  const generatePDF = async (data) => {
    if (!data || isGeneratingPDF) return;

    setIsGeneratingPDF(true);

    try {
      const certificateContainer = document.createElement('div');
      certificateContainer.style.position = 'absolute';
      certificateContainer.style.left = '-9999px';
      certificateContainer.style.width = '1200px';
      certificateContainer.style.padding = '0';
      certificateContainer.style.background = 'white';
      certificateContainer.style.fontFamily = "'Poppins', sans-serif";

      const qrData = `https://www.hblab.rw/verfiy/${data.certificateId}`;
      const encodedData = encodeURIComponent(qrData);
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodedData}`;

      certificateContainer.innerHTML = buildCertificateHtml(data, qrCodeUrl);

      document.body.appendChild(certificateContainer);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const canvas = await html2canvas(certificateContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        allowTaint: true
      });

      document.body.removeChild(certificateContainer);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
      pdf.save(`HB-Lab-Certificate-${data.recipientName.replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
        <main className="flex-1 overflow-y-auto bg-gray-50 p-2 sm:p-4 lg:p-8 w-full">
          {/* Page Header */}
          <div className="mb-4 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="mb-2 sm:mb-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Certificates Management</h1>
                <p className="text-gray-600 mt-1 text-xs sm:text-sm">Manage and generate certificates for your students</p>
              </div>
              <button
                onClick={() => setShowGenerator(true)}
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium transition-all duration-200 shadow-lg hover:shadow-xl text-xs sm:text-sm"
              >
                <Icon icon="carbon:add" className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                Generate Certificate
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <Icon icon="carbon:certificate" className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Certificates</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{certificates.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 flex items-center">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <Icon icon="carbon:user" className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">This Month</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {certificates.filter(cert => {
                      const certDate = new Date(cert.createdAt);
                      const now = new Date();
                      return certDate.getMonth() === now.getMonth() && certDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
              </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 flex items-center">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <Icon icon="carbon:download" className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Downloads</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          {/* Certificates Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">All Certificates</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                    <th className="hidden md:table-cell px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="hidden md:table-cell px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="hidden md:table-cell px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 sm:py-12">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-green-600"></div>
                          <p className="text-gray-500 mt-2">Loading certificates...</p>
                        </div>
                      </td>
                    </tr>
                  ) : currentCerts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 sm:py-12">
                        <div className="flex flex-col items-center">
                          <Icon icon="carbon:certificate" className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mb-4" />
                          <p className="text-gray-500">No certificates found</p>
                          <p className="text-gray-400 text-xs sm:text-sm">Generate your first certificate to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : currentCerts.map((cert) => (
                    <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 sm:px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{cert.recipientName}</div>
                          <div className="md:hidden text-[10px] text-gray-500 mt-1">
                            {cert.email}
                          </div>
                          <div className="md:hidden text-[10px] text-gray-500">
                            {cert.courseName}
                          </div>
                          <div className="md:hidden text-[10px] text-gray-500">
                            {new Date(cert.completionDate).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-2 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">{cert.email}</td>
                      <td className="hidden md:table-cell px-2 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">{cert.courseName}</td>
                      <td className="hidden md:table-cell px-2 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">{new Date(cert.completionDate).toLocaleDateString()}</td>
                      <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button 
                            onClick={() => generatePDF(cert)} 
                            disabled={isGeneratingPDF}
                            className={`inline-flex items-center px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                              isGeneratingPDF 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            <Icon icon="carbon:download" className="h-3 w-3 mr-1" />
                            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                          </button>
                          <button 
                            onClick={() => handleEdit(cert)}
                            className="inline-flex items-center px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all duration-200"
                          >
                            <Icon icon="carbon:edit" className="h-3 w-3 mr-1" />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(cert)}
                            className="inline-flex items-center px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-all duration-200"
                          >
                            <Icon icon="carbon:trash-can" className="h-3 w-3 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="text-xs sm:text-sm text-gray-700">
                    Showing {indexOfFirstCert + 1} to {Math.min(indexOfLastCert, certificates.length)} of {certificates.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                      disabled={currentPage === 1} 
                      className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                      disabled={currentPage === totalPages} 
                      className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
        {/* Certificate Generator Modal */}
        {showGenerator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowGenerator(false)} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out border border-gray-100">
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Icon icon="carbon:add" className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Generate Certificate</h2>
                    <p className="text-green-100 text-sm mt-1">Fill in the details to add a new certificate</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGenerator(false)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
                >
                  <Icon icon="carbon:close" className="h-6 w-6" />
                </button>
              </div>
              {/* Modal Content */}
              <div className="p-8">
                <HBLCertificateGenerator
                  onCreated={(certificate) => {
                    setCertificates((prev) => [certificate, ...prev]);
                    setShowGenerator(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}
        {/* Edit Certificate Modal */}
        {showEditModal && editingCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowEditModal(false); setEditingCertificate(null); }} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out border border-gray-100">
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Icon icon="carbon:certificate" className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Edit Certificate</h2>
                    <p className="text-green-100 text-sm mt-1">Update certificate details</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowEditModal(false); setEditingCertificate(null); }}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
                >
                  <Icon icon="carbon:close" className="h-6 w-6" />
                </button>
              </div>
              {/* Modal Content */}
              <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Name*</label>
                    <input
                      type="text"
                      name="recipientName"
                      value={editFormData.recipientName}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email*</label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Course Name*</label>
                    <input
                      type="text"
                      name="courseName"
                      value={editFormData.courseName}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                    <input
                      type="text"
                      name="duration"
                      value={editFormData.duration}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
                    <input
                      type="text"
                      name="dateRange"
                      value={editFormData.dateRange}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Completion Date*</label>
                    <input
                      type="date"
                      name="completionDate"
                      value={editFormData.completionDate}
                      onChange={handleEditFormChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Skills</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={currentSkill}
                      onChange={(e) => setCurrentSkill(e.target.value)}
                      placeholder="Add a skill"
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editFormData.skills.map((skill, index) => (
                      <span key={index} className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(index)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Icon icon="carbon:close" className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setEditingCertificate(null); }}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Update Certificate
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingCertificate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowDeleteModal(false); setDeletingCertificate(null); }} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto border border-gray-100 overflow-hidden">
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Icon icon="carbon:warning" className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Delete Certificate</h2>
                  </div>
                </div>
                <button
                  onClick={() => { setShowDeleteModal(false); setDeletingCertificate(null); }}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
                >
                  <Icon icon="carbon:close" className="h-6 w-6" />
                </button>
              </div>
              <div className="p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <Icon icon="carbon:warning" className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Certificate</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete the certificate for <strong>{deletingCertificate.recipientName}</strong>? 
                  This action cannot be undone.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => { setShowDeleteModal(false); setDeletingCertificate(null); }}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default CertificatesManagement; 