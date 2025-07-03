import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import Sidebar from './Sidebar';
import AddTrainerModal from './AddTrainerModal';
import AddStudentModal from './AddStudentModal';
import Header from './Header';

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
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Modal states
  const [showAddTrainer, setShowAddTrainer] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);

  // Toggle functions
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);

  // Load data from API
  const loadTrainers = async (page = 1, search = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3000/api/admin/users/trainers?page=${page}&limit=10&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrainers(response.data.trainers);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading trainers:', error);
    }
  };

  const loadStudents = async (page = 1, search = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3000/api/admin/users/students?page=${page}&limit=10&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.students);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (activeTab === 'trainers') {
        await loadTrainers();
      } else {
        await loadStudents();
      }
      setLoading(false);
    };
    loadData();
  }, [activeTab]);

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === 'trainers') {
        loadTrainers(1, searchTerm);
      } else {
        loadStudents(1, searchTerm);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, activeTab]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm('');
    setPagination({ currentPage: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false });
  };

  // Filter data based on active tab
  const filteredData = activeTab === 'trainers' ? trainers : students;

  // Add new trainer
  const handleAddTrainer = async (newTrainer) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/admin/users', {
        ...newTrainer,
        role: 'ADMIN' // Trainers are stored as ADMIN role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadTrainers(); // Reload data
    } catch (error) {
      console.error('Error adding trainer:', error);
    }
  };

  // Add new student
  const handleAddStudent = async (newStudent) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/admin/users', {
        ...newStudent,
        role: 'STUDENT'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadStudents(); // Reload data
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen}
        mobileSidebarOpen={mobileSidebarOpen}
        toggleSidebar={toggleSidebar}
        toggleMobileSidebar={toggleMobileSidebar}
      />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <Header toggleMobileSidebar={toggleMobileSidebar} activeTab="trainers" />

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {/* Tabs */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex border-b border-gray-200 w-full">
                <button
                  className={`py-2 px-4 font-medium text-sm ${activeTab === 'trainers' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => handleTabChange('trainers')}
                >
                  Trainers
                </button>
                <button
                  className={`py-2 px-4 font-medium text-sm ${activeTab === 'students' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => handleTabChange('students')}
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
                <button 
                  onClick={() => activeTab === 'trainers' ? setShowAddTrainer(true) : setShowAddStudent(true)}
                  className="bg-teal-700 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-800 flex items-center whitespace-nowrap"
                >
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

      {/* Modals */}
      <AddTrainerModal
        isOpen={showAddTrainer}
        onClose={() => setShowAddTrainer(false)}
        onAddTrainer={handleAddTrainer}
      />
      
      <AddStudentModal
        isOpen={showAddStudent}
        onClose={() => setShowAddStudent(false)}
        onAddStudent={handleAddStudent}
      />
    </div>
  );
};

export default TrainersManagement;