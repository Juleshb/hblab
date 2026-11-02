import React, { useState } from 'react';
import { Icon } from '@iconify/react';

const StudentHeader = ({ user, onLogout, title = 'Student Dashboard', notifications = [], onClearNotifications, toggleSidebar }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notificationCount = notifications.length;

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          {/* Hamburger menu for mobile */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-green-100 transition-colors mr-2"
            onClick={toggleSidebar}
            aria-label="Open sidebar"
          >
            <Icon icon="carbon:menu" className="h-6 w-6 text-green-900" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block w-1 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 capitalize">{title}</h1>
              <p className="text-sm text-gray-500 hidden sm:block">Welcome, {user?.name || 'Student'}!</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group"
              onClick={() => setShowNotifDropdown((open) => !open)}
            >
              <Icon icon="carbon:notification" className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
              <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 text-white text-xs flex items-center justify-center rounded-full font-bold shadow-lg">
                  {notificationCount}
                </span>
              )}
            </button>
            {showNotifDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200/50 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                    <span className="font-semibold text-gray-900">Notifications</span>
                    {notificationCount > 0 && (
                      <button
                        className="text-xs text-red-600 hover:underline"
                        onClick={onClearNotifications}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notificationCount === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-400 text-sm">No notifications</div>
                    ) : (
                      notifications.map((notif, idx) => (
                        <div key={idx} className="px-4 py-3 border-b border-gray-50 flex items-start gap-2">
                          <Icon icon="carbon:warning" className="h-5 w-5 text-red-500 mt-0.5" />
                          <div>
                            <div className="text-gray-800 text-sm font-medium">{notif.message}</div>
                            <div className="text-xs text-gray-400 mt-1">{notif.date ? new Date(notif.date).toLocaleString() : ''}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group">
            <Icon icon="carbon:chat" className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-blue-500 rounded-full border-2 border-white animate-pulse"></span>
          </button>
          {/* User Dropdown */}
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
                <p className="text-sm font-semibold text-gray-900">{user?.name || 'Student'}</p>
                <p className="text-xs text-gray-500">{user?.email || 'student@hblab.com'}</p>
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
                        <p className="font-semibold text-gray-900">{user?.name || 'Student User'}</p>
                        <p className="text-sm text-gray-500">{user?.email || 'student@hblab.com'}</p>
                        <div className="flex items-center mt-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                          <span className="text-xs text-gray-500">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
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
        </div>
      </div>
    </header>
  );
};

export default StudentHeader; 