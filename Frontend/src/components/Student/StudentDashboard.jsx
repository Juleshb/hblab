import { useState, useEffect } from 'react';
import StudentSidebar from './StudentSidebar';
import LessonList from '../User/LessonList';
import CareerApplications from '../User/CareerApplications';
import CertificateList from '../User/CertificateList';
import ProfileCard from '../User/ProfileCard';
import ProgressTracker from './ProgressTracker';
import { useAuth } from '../../assets/context/AuthContext';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { StudentLayout } from './index';
import EditProfileModal from './EditProfileModal';
import toast from 'react-hot-toast';
import { apiOrigin } from '../../apiOrigin';

const StatCard = ({ icon, title, value, color }) => (
  <div className="bg-white rounded-lg shadow p-6 flex items-center border border-gray-200">
    <div className={`p-3 rounded-full bg-green-100 text-green-600`}>
      <Icon icon={icon} className="h-6 w-6" />
    </div>
    <div className="ml-4">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

const StudentHeader = ({ user }) => (
  <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm sticky top-0 z-30">
    <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="hidden sm:block w-1 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 capitalize">Student Dashboard</h1>
            <p className="text-sm text-gray-500 hidden sm:block">Welcome, {user?.name || 'Student'}!</p>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group">
          <Icon icon="carbon:notification" className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
          <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group">
          <Icon icon="carbon:chat" className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
          <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-blue-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm">
            <Icon icon="carbon:user" className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  </header>
);

const StudentDashboard = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [certLoading, setCertLoading] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [profileData, setProfileData] = useState(user);
  const [notifications, setNotifications] = useState([]);

  const handleEditProfile = () => {
    setProfileData(user);
    setEditModalOpen(true);
  };

  const handleProfileSave = async (updatedProfile) => {
    try {
      await axios.put(`${apiOrigin}/api/users/${user.id}`, updatedProfile);
      setEditModalOpen(false);
      toast.success('Profile updated successfully!', { icon: '🎉' });
    } catch (error) {
      toast.error('Failed to update profile. Please try again.', { icon: '❌' });
    }
  };

  const handleNotify = (message) => {
    setNotifications((prev) => [...prev, { message, date: new Date() }]);
  };

  const handleClearNotifications = () => setNotifications([]);

  // Fetch certificates
  useEffect(() => {
    const fetchCertificates = async () => {
      setCertLoading(true);
      try {
        if (user?.email) {
          const res = await fetch(`${apiOrigin}/api/certificates/email/${user.email}`);
          const data = await res.json();
          setCertificates(data);
        }
      } catch (err) {
        console.error('Error fetching certificates:', err);
      } finally {
        setCertLoading(false);
      }
    };
    fetchCertificates();
  }, [user]);

  // Fetch lessons
  useEffect(() => {
    const fetchLessons = async () => {
      setLessonsLoading(true);
      try {
        if (user?.id) {
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `${apiOrigin}/api/lessons?userId=${user.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setLessons(response.data.lessons || []);
        }
      } catch (err) {
        console.error('Error fetching lessons:', err);
      } finally {
        setLessonsLoading(false);
      }
    };
    fetchLessons();
  }, [user]);

  // Fetch career applications
  useEffect(() => {
    const fetchApplications = async () => {
      setApplicationsLoading(true);
      try {
        if (user?.id) {
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `${apiOrigin}/api/applications/by-user/${user.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setApplications(response.data.applications || []);
        }
      } catch (err) {
        console.error('Error fetching career applications:', err);
      } finally {
        setApplicationsLoading(false);
      }
    };
    fetchApplications();
  }, [user]);

  // Calculate progress (average of lesson progress, or 0 if none)
  const progress = lessons.length > 0
    ? Math.round(
        lessons.reduce((sum, lesson) => sum + (lesson.progress || 0), 0) / lessons.length
      )
    : 0;

  const stats = [
    { icon: 'carbon:book', title: 'Total Lessons', value: lessons.length },
    { icon: 'carbon:certificate', title: 'Certificates', value: certificates.length },
    { icon: 'carbon:user-activity', title: 'Applications', value: applications.length },
    { icon: 'carbon:progress-bar', title: 'Progress', value: `${progress}%` },
  ];

  return (
    <StudentLayout notifications={notifications} onClearNotifications={handleClearNotifications}>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
          <ProfileCard user={user} onEdit={handleEditProfile} />
          <ProgressTracker userId={user?.id} progress={progress} />
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
              <CertificateList userId={user?.id} certificates={certificates} loading={certLoading} />
          </div>
      </div>
      {editModalOpen && (
        <EditProfileModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          profile={profileData}
          onSave={handleProfileSave}
          onNotify={handleNotify}
        />
      )}
    </StudentLayout>
  );
};
export default StudentDashboard; 