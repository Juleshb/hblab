// pages/TrainersManagement.jsx
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Sidebar from '../Admin/Sidebar';

const TrainersManagement = () => {
  // State for sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // State for data
  const [activeTab, setActiveTab] = useState('trainers');
  const [trainers, setTrainers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Toggle functions
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);

  // Load data
  useEffect(() => {
    setTimeout(() => {
      setTrainers([
        { 
          id: 1, 
          name: 'Alex Johnson', 
          email: 'alex@example.com', 
          specialization: 'Frontend Development', 
          status: 'Active', 
          courses: 12,
          rating: 4.8
        },
        { 
          id: 2, 
          name: 'Sarah Williams', 
          email: 'sarah@example.com', 
          specialization: 'Data Science', 
          status: 'Active', 
          courses: 8,
          rating: 4.9
        }
      ]);

      setStudents([
        {
          id: 1,
          name: 'John Smith',
          email: 'john@example.com',
          enrolledCourses: 3,
          completion: '75%',
          lastActive: '2 days ago',
          status: 'Active'
        },
        {
          id: 2,
          name: 'Emily Davis',
          email: 'emily@example.com',
          enrolledCourses: 5,
          completion: '92%',
          lastActive: '5 hours ago',
          status: 'Active'
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  // Filter data based on active tab
  const filteredData = activeTab === 'trainers' 
    ? trainers.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : students.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Reuse existing Sidebar component */}
      <Sidebar 
        sidebarOpen={sidebarOpen}
        mobileSidebarOpen={mobileSidebarOpen}
        toggleSidebar={toggleSidebar}
        toggleMobileSidebar={toggleMobileSidebar}
        activeTab="trainers"
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
              <h1 className="text-xl font-semibold text-gray-800">
                {activeTab === 'trainers' ? 'Trainers' : 'Students'} Management
              </h1>
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

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {/* Tabs */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex border-b border-gray-200 w-full">
                <button
                  className={`py-2 px-4 font-medium text-sm ${activeTab === 'trainers' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('trainers')}
                >
                  Trainers
                </button>
                <button
                  className={`py-2 px-4 font-medium text-sm ${activeTab === 'students' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('students')}
                >
                  Students
                </button>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
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
                  Add {activeTab === 'trainers' ? 'Trainer' : 'Student'}
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
                      {activeTab === 'trainers' ? (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courses</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                        </>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        {/* Trainer/Student Info */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <Icon 
                                icon={activeTab === 'trainers' ? 'carbon:user-certification' : 'carbon:user'} 
                                className="h-5 w-5 text-gray-600" 
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500">{item.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Dynamic Columns */}
                        {activeTab === 'trainers' ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.specialization}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.courses}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Icon icon="carbon:star-filled" className="h-4 w-4 text-yellow-500 mr-1" />
                                <span>{item.rating}</span>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.enrolledCourses} courses
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-teal-600 h-2.5 rounded-full" 
                                  style={{ width: item.completion }}
                                ></div>
                              </div>
                              <span className="text-xs mt-1 block">{item.completion}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.lastActive}
                            </td>
                          </>
                        )}

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.status === 'Active' ? 'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-teal-600 hover:text-teal-900 mr-3">
                            <Icon icon="carbon:edit" className="h-4 w-4 inline mr-1" />
                          </button>
                          {activeTab === 'trainers' && (
                            <button className="text-blue-600 hover:text-blue-900 mr-3">
                              <Icon icon="carbon:view" className="h-4 w-4 inline mr-1" />
                            </button>
                          )}
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

export default TrainersManagement;