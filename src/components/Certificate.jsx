import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import axios from "axios";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { PDFDownloadLink } from "@react-pdf/renderer";
import CertificatePDF from "./CertificatePDF";

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [certificatesPerPage] = useState(10);
  const [selectedCertificates, setSelectedCertificates] = useState([]);
  const navigate = useNavigate();

  // Fetch certificates from API with comprehensive error handling
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component
    
    const fetchCertificates = async () => {
      try {
        console.log("[DEBUG] Attempting to fetch certificates...");
        const response = await axios.get("http://localhost:3000/api/certificates", {
          timeout: 5000 // 5 second timeout
        });
        
        console.log("[DEBUG] API Response:", response);
        
        if (!isMounted) return;
        
        if (!response.data) {
          throw new Error("Server returned empty response");
        }

        if (response.data.length === 0) {
          setError("No certificates found in database");
          console.warn("[DEBUG] Empty certificates array received");
        } else {
          setCertificates(response.data);
          setError("");
        }
      } catch (err) {
        if (!isMounted) return;
        
        console.error("[DEBUG] Fetch error:", err);
        
        // Generate fallback test data
        const fallbackData = [
          {
            _id: "1",
            recipientName: "Test User",
            courseName: "Introduction to Debugging",
            email: "test@example.com",
            completionDate: new Date().toISOString(),
            duration: "4 weeks",
            createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            status: "Completed"
          },
          {
            _id: "2",
            recipientName: "Sample Student",
            courseName: "Advanced React Patterns",
            email: "student@example.com",
            completionDate: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
            duration: "8 weeks",
            createdAt: new Date(Date.now() - 2592000000).toISOString(),
            status: "Verified"
          }
        ];
        
        setCertificates(fallbackData);
        setError(`Failed to load: ${err.message} (Showing sample data)`);
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log("[DEBUG] Fetch completed");
        }
      }
    };

    fetchCertificates();

    return () => {
      isMounted = false; // Cleanup function
    };
  }, []);

  // Filter and search functionality with null checks
  const filteredCertificates = certificates.filter((cert) => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatches = cert.recipientName?.toLowerCase().includes(searchLower) ?? false;
    const courseMatches = cert.courseName?.toLowerCase().includes(searchLower) ?? false;
    const emailMatches = cert.email?.toLowerCase().includes(searchLower) ?? false;
    
    const matchesSearch = nameMatches || courseMatches || emailMatches;
    
    const matchesFilter = 
      filter === "all" || 
      (filter === "recent" && isRecent(cert.createdAt)) ||
      (filter === "course" && cert.courseName?.toLowerCase().includes("computer"));
    
    return matchesSearch && matchesFilter;
  });

  function isRecent(date) {
    if (!date) return false;
    try {
      const certDate = new Date(date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return certDate > thirtyDaysAgo;
    } catch {
      return false;
    }
  }

  // Pagination logic
  const indexOfLastCertificate = currentPage * certificatesPerPage;
  const indexOfFirstCertificate = indexOfLastCertificate - certificatesPerPage;
  const currentCertificates = filteredCertificates.slice(
    indexOfFirstCertificate,
    indexOfLastCertificate
  );
  const totalPages = Math.ceil(filteredCertificates.length / certificatesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Debug render information
  console.log("[RENDER] State snapshot:", {
    loading,
    error,
    certificatesCount: certificates.length,
    filteredCount: filteredCertificates.length,
    currentPage,
    searchTerm,
    filter,
    selectedCertificates
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-lg font-medium text-gray-700">Loading Certificates</h2>
            <p className="text-gray-500 mt-1">Please wait while we load your data...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state (only show if we have no data to display)
  if (error && filteredCertificates.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center p-6 bg-red-50 rounded-lg max-w-md border border-red-100">
            <Icon icon="mdi:alert-circle-outline" className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">Data Load Error</h3>
            <div className="bg-red-100 p-3 rounded mb-4">
              <code className="text-sm text-red-800 break-words">{error}</code>
            </div>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
              >
                <Icon icon="mdi:reload" className="mr-2" />
                Retry
              </button>
              <button
                onClick={() => navigate("/certificates/generate")}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
              >
                <Icon icon="mdi:plus" className="mr-2" />
                Create New
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Empty state (no matching results)
  if (filteredCertificates.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center p-6 bg-white rounded-lg max-w-md border border-gray-200 shadow-sm">
            <Icon icon="mdi:file-document-outline" className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              {searchTerm ? "No Matching Certificates" : "No Certificates Found"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? "Try adjusting your search or filter criteria"
                : error
                  ? "The server returned no certificate data"
                  : "Get started by generating your first certificate"}
            </p>
            <div className="space-y-3">
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilter("all");
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                >
                  Clear Search
                </button>
              )}
              <button
                onClick={() => navigate("/certificates/generate")}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
              >
                <Icon icon="mdi:plus" className="mr-2" />
                Generate Certificate
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Main render
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-gray-600">
                  Showing {filteredCertificates.length} certificate{filteredCertificates.length !== 1 ? "s" : ""}
                </span>
                {error && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center">
                    <Icon icon="mdi:alert" className="mr-1" />
                    {error}
                  </span>
                )}
                {selectedCertificates.length > 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {selectedCertificates.length} selected
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {selectedCertificates.length > 0 && (
                <button
                  onClick={handleBulkDownload}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                  disabled={loading}
                >
                  <Icon icon="mdi:download-multiple" className="mr-2" />
                  Download Selected
                </button>
              )}
              <button
                onClick={() => navigate("/certificates/generate")}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                disabled={loading}
              >
                <Icon icon="mdi:plus" className="mr-2" />
                Generate New
              </button>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon icon="mdi:magnify" className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search certificates..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={loading}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <Icon icon="mdi:close" className="text-gray-400 hover:text-gray-500" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={loading}
              >
                <option value="all">All Certificates</option>
                <option value="recent">Recent (Last 30 days)</option>
                <option value="course">Computer Courses</option>
              </select>
              
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                value={certificatesPerPage}
                onChange={(e) => {
                  setCertificatesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                disabled={loading}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>

          {/* Certificates Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                      <input
                        type="checkbox"
                        checked={selectedCertificates.length > 0 && selectedCertificates.length === currentCertificates.length}
                        onChange={() => {
                          if (selectedCertificates.length === currentCertificates.length) {
                            setSelectedCertificates([]);
                          } else {
                            setSelectedCertificates(currentCertificates.map(c => c._id));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={loading}
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentCertificates.map((cert) => (
                    <tr key={cert._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCertificates.includes(cert._id)}
                          onChange={() => {
                            setSelectedCertificates(prev =>
                              prev.includes(cert._id)
                                ? prev.filter(id => id !== cert._id)
                                : [...prev, cert._id]
                            );
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={loading}
                        />
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Icon icon="mdi:account-outline" className="text-blue-600 text-xl" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {cert.recipientName || "Unknown"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {cert.email || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {cert.courseName || "Unspecified Course"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {cert.duration || "No duration specified"}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {cert.completionDate
                            ? new Date(cert.completionDate).toLocaleDateString()
                            : "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {cert.createdAt
                            ? `Created: ${new Date(cert.createdAt).toLocaleDateString()}`
                            : ""}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          cert.status === "Verified" 
                            ? "bg-green-100 text-green-800"
                            : cert.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}>
                          {cert.status || "Unknown"}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button
                          onClick={() => navigate(`/certificates/${cert._id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View details"
                        >
                          <Icon icon="mdi:eye-outline" className="text-lg" />
                        </button>
                        
                        <PDFDownloadLink
                          document={<CertificatePDF certificate={cert} />}
                          fileName={`certificate_${cert._id}.pdf`}
                          className="text-gray-600 hover:text-gray-900"
                          title="Download PDF"
                        >
                          {({ loading: pdfLoading }) => (
                            pdfLoading ? (
                              <Icon icon="mdi:loading" className="animate-spin text-lg" />
                            ) : (
                              <Icon icon="mdi:download-outline" className="text-lg" />
                            )
                          )}
                        </PDFDownloadLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstCertificate + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(indexOfLastCertificate, filteredCertificates.length)}
                      </span>{" "}
                      of <span className="font-medium">{filteredCertificates.length}</span>{" "}
                      results
                    </p>
                  </div>
                  <nav className="relative z-0 inline-flex shadow-sm">
                    <button
                      onClick={() => paginate(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <Icon icon="mdi:chevron-left" />
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => paginate(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <Icon icon="mdi:chevron-right" />
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Certificates;