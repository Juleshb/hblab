import React from 'react';

const ProfileCard = ({ user, onEdit }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
      <div className="w-20 h-20 rounded-full bg-green-200 flex items-center justify-center text-3xl text-green-900 mb-4">
        {user?.name?.[0] || 'U'}
      </div>
      <h2 className="text-xl font-bold text-green-900 mb-1">{user?.name || 'User Name'}</h2>
      <p className="text-gray-600 mb-2">{user?.email || 'user@email.com'}</p>
      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mb-2">{user?.role || 'USER'}</span>
      <button className="mt-2 px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition" onClick={onEdit}>Edit Profile</button>
    </div>
  );
};
export default ProfileCard; 