import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import AddTrainerModal from './AddTrainerModal';
import AddStudentModal from './AddStudentModal';
import { apiOrigin } from '../../apiOrigin';

const TrainersManagement = () => {
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

  // Load data from API
  const loadTrainers = async (page = 1, search = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiOrigin}/api/admin/users/trainers?page=${page}&limit=10&search=${search}`, {
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
      const response = await axios.get(`${apiOrigin}/api/admin/users/students?page=${page}&limit=10&search=${search}`, {
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
      await axios.post(`${apiOrigin}/api/admin/users`, {
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
      await axios.post(`${apiOrigin}/api/admin/users`, {
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
    <div>
      {/* Trainers and Students Content */}
      {/* ...content here... */}
    </div>
  );
};

export default TrainersManagement;