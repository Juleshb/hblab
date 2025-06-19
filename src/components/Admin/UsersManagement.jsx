// pages/UsersManagement.jsx
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Sidebar from './Sidebar'; // Import existing Sidebar component

const UsersManagement = () => {
  // State for sidebar (if needed)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // State for users data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Toggle functions (pass these to Sidebar)
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);

  // Load user data
  useEffect(() => {
    setTimeout(() => {
      setUsers([
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', lastActive: '2 hours ago' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Trainer', status: 'Active', lastActive: '5 minutes ago' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive', lastActive: '3 days ago' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter users
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Use existing Sidebar component */}
      <Sidebar 
        sidebarOpen={sidebarOpen}
        mobileSidebarOpen={mobileSidebarOpen}
        toggleSidebar={toggleSidebar}
        toggleMobileSidebar={toggleMobileSidebar}
        activeTab="users" // Highlight "Users" in sidebar
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button 
                onClick={toggleMobileSidebar}
                className="text-gray-500 hover:text-gray-600 lg:hidden mr-4"
              >
                <Icon icon="carbon:menu" className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-800">Users Management</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-1 text-gray-500 hover:text-gray-600">
                <Icon icon="carbon:notification" className="h-6 w-6" />
              </button>
              <button className="p-1 text-gray-500 hover:text-gray-600">
                <Icon icon="carbon:chat" className="h-6 w-6" />
              </button>
              <div className="relative">
                <button className="flex items-center space-x-2">
                  <Icon icon="carbon:user" className="h-8 w-8 text-gray-600 bg-gray-200 rounded-full p-1.5" />
                </button>
              </div>
            </div>
          </div>
        </header>

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
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Icon 
                    icon="carbon:search" 
                    className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" 
                  />
                </div>
                <button className="bg-teal-700 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-800 flex items-center whitespace-nowrap">
                  <Icon icon="carbon:add" className="h-4 w-4 mr-2" />
                  Add User
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Icon icon="eos-icons:loading" className="h-8 w-8 animate-spin text-teal-700" />
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
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
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.status === 'Active' ? 'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-teal-600 hover:text-teal-900 mr-3">
                            <Icon icon="carbon:edit" className="h-4 w-4 inline mr-1" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Icon icon="carbon:trash-can" className="h-4 w-4 inline mr-1" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UsersManagement;