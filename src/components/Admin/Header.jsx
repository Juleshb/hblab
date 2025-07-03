// components/Header.jsx
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../../assets/context/AuthContext.jsx';

const Header = ({ toggleMobileSidebar, activeTab }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Icon icon="carbon:menu" className="h-6 w-6 text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block w-1 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 capitalize">
                {activeTab.replace('-', ' ')}
              </h1>
              <p className="text-sm text-gray-500 hidden sm:block">
                Manage your {activeTab.replace('-', ' ')} efficiently
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <NotificationButton />
          <ChatButton />
          <UserDropdown 
            user={user} 
            showDropdown={showDropdown}
            setShowDropdown={setShowDropdown}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </header>
  );
};

const NotificationButton = () => (
  <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group">
    <Icon icon="carbon:notification" className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
      3
    </span>
  </button>
);

const ChatButton = () => (
  <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group">
    <Icon icon="carbon:chat" className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-blue-500 rounded-full border-2 border-white animate-pulse"></span>
  </button>
);

const UserDropdown = ({ user, showDropdown, setShowDropdown, onLogout }) => (
  <div className="relative">
    <button 
      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors group"
      onClick={() => setShowDropdown(!showDropdown)}
    >
      <div className="relative">
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm">
          <Icon icon="carbon:user" className="h-4 w-4 text-white" />
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
      </div>
      <div className="hidden md:block text-left">
        <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin'}</p>
        <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase() || 'admin'}</p>
      </div>
      <Icon 
        icon="carbon:chevron-down" 
        className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
      />
    </button>

    {showDropdown && (
      <>
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200/50 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <Icon icon="carbon:user" className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user?.name || 'Admin User'}</p>
                <p className="text-sm text-gray-500">{user?.email || 'admin@hblab.com'}</p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-500">Online</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="py-1">
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Icon icon="carbon:user-profile" className="h-4 w-4 mr-3 text-gray-500" />
              Profile Settings
            </button>
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Icon icon="carbon:settings" className="h-4 w-4 mr-3 text-gray-500" />
              Preferences
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button
              onClick={onLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Icon icon="carbon:logout" className="h-4 w-4 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      </>
    )}
  </div>
);

export default Header;