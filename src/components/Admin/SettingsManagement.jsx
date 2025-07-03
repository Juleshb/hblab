import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Sidebar from './Sidebar';
import Header from './Header';

const SettingsManagement = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    general: {
      companyName: 'HB-Lab',
      companyEmail: 'info@hb-lab.com',
      companyPhone: '+250 788 123 456',
      companyAddress: 'Kigali, Rwanda',
      timezone: 'Africa/Kigali',
      dateFormat: 'MM/DD/YYYY',
      language: 'en'
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      applicationAlerts: true,
      projectUpdates: true,
      systemMaintenance: false
    },
    security: {
      sessionTimeout: 30,
      requireTwoFactor: false,
      passwordExpiry: 90,
      maxLoginAttempts: 5,
      enableAuditLog: true
    },
    appearance: {
      theme: 'light',
      primaryColor: 'green',
      sidebarCollapsed: false,
      showAnimations: true
    }
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((open) => !open);
  const toggleMobileSidebar = () => setMobileSidebarOpen((open) => !open);

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSaveSettings = async (category) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Saving ${category} settings:`, settings[category]);
      // Here you would make an API call to save the settings
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: 'carbon:settings' },
    { id: 'notifications', label: 'Notifications', icon: 'carbon:notification' },
    { id: 'security', label: 'Security', icon: 'carbon:security' },
    { id: 'appearance', label: 'Appearance', icon: 'carbon:palette' }
  ];

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
        <Header toggleMobileSidebar={toggleMobileSidebar} activeTab="settings" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon icon={tab.icon} className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'general' && (
                <GeneralSettings
                  settings={settings.general}
                  onChange={(key, value) => handleSettingChange('general', key, value)}
                  onSave={() => handleSaveSettings('general')}
                  loading={loading}
                />
              )}

              {activeTab === 'notifications' && (
                <NotificationSettings
                  settings={settings.notifications}
                  onChange={(key, value) => handleSettingChange('notifications', key, value)}
                  onSave={() => handleSaveSettings('notifications')}
                  loading={loading}
                />
              )}

              {activeTab === 'security' && (
                <SecuritySettings
                  settings={settings.security}
                  onChange={(key, value) => handleSettingChange('security', key, value)}
                  onSave={() => handleSaveSettings('security')}
                  loading={loading}
                />
              )}

              {activeTab === 'appearance' && (
                <AppearanceSettings
                  settings={settings.appearance}
                  onChange={(key, value) => handleSettingChange('appearance', key, value)}
                  onSave={() => handleSaveSettings('appearance')}
                  loading={loading}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// General Settings Component
const GeneralSettings = ({ settings, onChange, onSave, loading }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Company Name</label>
          <input
            type="text"
            value={settings.companyName}
            onChange={(e) => onChange('companyName', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Company Email</label>
          <input
            type="email"
            value={settings.companyEmail}
            onChange={(e) => onChange('companyEmail', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Company Phone</label>
          <input
            type="tel"
            value={settings.companyPhone}
            onChange={(e) => onChange('companyPhone', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Company Address</label>
          <input
            type="text"
            value={settings.companyAddress}
            onChange={(e) => onChange('companyAddress', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">System Preferences</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Timezone</label>
          <select
            value={settings.timezone}
            onChange={(e) => onChange('timezone', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <option value="Africa/Kigali">Africa/Kigali</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Europe/London">Europe/London</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date Format</label>
          <select
            value={settings.dateFormat}
            onChange={(e) => onChange('dateFormat', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Language</label>
          <select
            value={settings.language}
            onChange={(e) => onChange('language', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="rw">Kinyarwanda</option>
          </select>
        </div>
      </div>
    </div>

    <div className="flex justify-end">
      <button
        onClick={onSave}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Saving...
          </>
        ) : (
          <>
            <Icon icon="carbon:save" className="h-4 w-4 mr-2" />
            Save Changes
          </>
        )}
      </button>
    </div>
  </div>
);

// Notification Settings Component
const NotificationSettings = ({ settings, onChange, onSave, loading }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
      <div className="space-y-4">
        {Object.entries(settings).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h4>
              <p className="text-sm text-gray-500">
                Receive notifications for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </p>
            </div>
            <button
              onClick={() => onChange(key, !value)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                value ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  value ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>

    <div className="flex justify-end">
      <button
        onClick={onSave}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Saving...
          </>
        ) : (
          <>
            <Icon icon="carbon:save" className="h-4 w-4 mr-2" />
            Save Changes
          </>
        )}
      </button>
    </div>
  </div>
);

// Security Settings Component
const SecuritySettings = ({ settings, onChange, onSave, loading }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Security Configuration</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
          <input
            type="number"
            value={settings.sessionTimeout}
            onChange={(e) => onChange('sessionTimeout', parseInt(e.target.value))}
            min="5"
            max="480"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password Expiry (days)</label>
          <input
            type="number"
            value={settings.passwordExpiry}
            onChange={(e) => onChange('passwordExpiry', parseInt(e.target.value))}
            min="30"
            max="365"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Max Login Attempts</label>
          <input
            type="number"
            value={settings.maxLoginAttempts}
            onChange={(e) => onChange('maxLoginAttempts', parseInt(e.target.value))}
            min="3"
            max="10"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>
    </div>

    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
          <p className="text-sm text-gray-500">Require 2FA for all users</p>
        </div>
        <button
          onClick={() => onChange('requireTwoFactor', !settings.requireTwoFactor)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
            settings.requireTwoFactor ? 'bg-green-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              settings.requireTwoFactor ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-900">Audit Logging</h4>
          <p className="text-sm text-gray-500">Track all system activities</p>
        </div>
        <button
          onClick={() => onChange('enableAuditLog', !settings.enableAuditLog)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
            settings.enableAuditLog ? 'bg-green-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              settings.enableAuditLog ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>

    <div className="flex justify-end">
      <button
        onClick={onSave}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Saving...
          </>
        ) : (
          <>
            <Icon icon="carbon:save" className="h-4 w-4 mr-2" />
            Save Changes
          </>
        )}
      </button>
    </div>
  </div>
);

// Appearance Settings Component
const AppearanceSettings = ({ settings, onChange, onSave, loading }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Visual Preferences</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => onChange('theme', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Primary Color</label>
          <select
            value={settings.primaryColor}
            onChange={(e) => onChange('primaryColor', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <option value="green">Green</option>
            <option value="blue">Blue</option>
            <option value="purple">Purple</option>
            <option value="red">Red</option>
          </select>
        </div>
      </div>
    </div>

    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-900">Collapsed Sidebar</h4>
          <p className="text-sm text-gray-500">Start with sidebar collapsed</p>
        </div>
        <button
          onClick={() => onChange('sidebarCollapsed', !settings.sidebarCollapsed)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
            settings.sidebarCollapsed ? 'bg-green-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              settings.sidebarCollapsed ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-900">Animations</h4>
          <p className="text-sm text-gray-500">Show interface animations</p>
        </div>
        <button
          onClick={() => onChange('showAnimations', !settings.showAnimations)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
            settings.showAnimations ? 'bg-green-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              settings.showAnimations ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>

    <div className="flex justify-end">
      <button
        onClick={onSave}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Saving...
          </>
        ) : (
          <>
            <Icon icon="carbon:save" className="h-4 w-4 mr-2" />
            Save Changes
          </>
        )}
      </button>
    </div>
  </div>
);

export default SettingsManagement; 