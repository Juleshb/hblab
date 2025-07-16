import React from 'react';
import UserSidebar from './UserSidebar';
import Header from '../Admin/Header';
import LessonList from './LessonList';
import CareerApplications from './CareerApplications';
import CertificateList from './CertificateList';
import ProfileCard from './ProfileCard';
import { useAuth } from '../../assets/context/AuthContext';

const UserDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <UserSidebar />
      <div className="flex-1">
        <Header userType="user" />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <ProfileCard user={user} />
            <CertificateList userId={user?.id} />
            <CareerApplications userId={user?.id} />
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-green-900 mb-4">Your Lessons</h2>
            <LessonList userId={user?.id} />
          </div>
        </main>
      </div>
    </div>
  );
};
export default UserDashboard; 