// pages/UsersManagement.jsx
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import UserModal from './UserModal';

const UsersManagement = () => {
  // State for users data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  // State for pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 5
  });
  // State for modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Load users data
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        role: roleFilter
      });
      const response = await axios.get(`http://localhost:3000/api/admin/users?${params}`);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter, pagination.limit]);

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle role filter
  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle page size change
  const handlePageSizeChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setPagination(prev => ({ 
      ...prev, 
      limit: newLimit,
      currentPage: 1 
    }));
  };

  // Handle pagination
  const handlePageChange = (page) => {
    fetchUsers(page);
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const totalPages = pagination.totalPages;
    const currentPage = pagination.currentPage;
    
    // Always show first page
    if (totalPages > 0) {
      pages.push(1);
    }
    
    // Show pages around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    if (start > 2) {
      pages.push('...');
    }
    
    for (let i = start; i <= end; i++) {
      if (i > 1 && i < totalPages) {
        pages.push(i);
      }
    }
    
    if (end < totalPages - 1) {
      pages.push('...');
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Handle user save (create or update)
  const handleSaveUser = async (userData, isEditing) => {
    try {
      if (isEditing) {
        await axios.put(`http://localhost:3000/api/admin/users/${editingUser.id}`, userData);
      } else {
        await axios.post('http://localhost:3000/api/admin/users', userData);
      }
      
      // Refresh the current page
      fetchUsers(pagination.currentPage);
      
      // Show success message (you can add toast notification here)
      console.log(`User ${isEditing ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Error saving user:', error);
      throw error; // Re-throw to show error in modal
    }
  };

  // Handle user delete
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3000/api/admin/users/${userId}`);
      fetchUsers(pagination.currentPage);
      console.log('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  // Handle add user
  const handleAddUser = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  // Get role display name
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'STUDENT': return 'Student';
      case 'APPLICANT': return 'Applicant';
      default: return role;
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800';
      case 'STUDENT': return 'bg-blue-100 text-blue-800';
      case 'APPLICANT': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Users Table Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-teal-900">Users</h2>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="pl-10 pr-4 py-2 border rounded-md text-sm w-full"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                  <Icon 
                    icon="carbon:search" 
                    className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" 
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={handleRoleFilter}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="STUDENT">Student</option>
                  <option value="APPLICANT">Applicant</option>
                </select>
                <button 
                  onClick={handleAddUser}
                  className="bg-teal-700 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-800 flex items-center whitespace-nowrap"
                >
                  <Icon icon="carbon:add" className="h-4 w-4 mr-2" />
                  Add User
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Icon icon="eos-icons:loading" className="h-8 w-8 animate-spin text-teal-700" />
            </div>
          ) : (
            <>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <Icon icon="carbon:user" className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                              {getRoleDisplayName(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {user.status}
                          </span>
                        </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => handleEditUser(user)}
                              className="text-teal-600 hover:text-teal-900 mr-3"
                            >
                            <Icon icon="carbon:edit" className="h-4 w-4 inline mr-1" />
                              Edit
                          </button>
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={user.role === 'ADMIN'}
                            >
                            <Icon icon="carbon:trash-can" className="h-4 w-4 inline mr-1" />
                              Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

              {/* Enhanced Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 bg-white rounded-lg shadow px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-700">
                        Showing page {pagination.currentPage} of {pagination.totalPages} 
                        ({pagination.totalUsers} total users)
                      </div>
                      
                      {/* Page Size Selector */}
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">Show:</label>
                        <select
                          value={pagination.limit}
                          onChange={handlePageSizeChange}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                        <span className="text-sm text-gray-600">per page</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Previous Button */}
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrevPage}
                        className="px-3 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center"
                      >
                        <Icon icon="carbon:chevron-left" className="h-4 w-4 mr-1" />
                        Previous
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center space-x-1">
                        {generatePageNumbers().map((page, index) => (
                          <button
                            key={index}
                            onClick={() => typeof page === 'number' && handlePageChange(page)}
                            disabled={page === '...'}
                            className={`px-3 py-2 text-sm border rounded-md ${
                              page === pagination.currentPage
                                ? 'bg-teal-600 text-white border-teal-600'
                                : page === '...'
                                ? 'border-gray-300 text-gray-400 cursor-default'
                                : 'hover:bg-gray-50 border-gray-300'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        className="px-3 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center"
                      >
                        Next
                        <Icon icon="carbon:chevron-right" className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

      {/* User Modal */}
      <UserModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        user={editingUser}
        onSave={handleSaveUser}
      />
    </div>
  );
};

export default UsersManagement;