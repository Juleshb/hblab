import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StudentLayout } from './index';
import { useAuth } from '../../assets/context/AuthContext';
import { Icon } from '@iconify/react';
import CertificateList from '../User/CertificateList';
import ProgressTracker from './ProgressTracker';

const DEFAULT_AVATAR = '/src/assets/avatar.png';
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80';

const TABS = [
  { key: 'about', label: 'About' },
  { key: 'certificates', label: 'Certificates' },
  { key: 'progress', label: 'Progress' },
];

// Custom confirmation dialog component
function ConfirmEditDialog({ open, onConfirm, onCancel, fieldLabel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-xl shadow-xl p-6 min-w-[260px] max-w-xs border border-green-200 animate-fade-in">
        <div className="text-green-900 font-semibold mb-3 text-center">Edit {fieldLabel}?</div>
        <div className="text-gray-600 text-sm mb-4 text-center">Do you want to edit this field?</div>
        <div className="flex justify-center gap-4">
          <button
            className="px-4 py-1.5 rounded bg-green-700 text-white font-semibold hover:bg-green-800 transition"
            onClick={onConfirm}
          >Yes</button>
          <button
            className="px-4 py-1.5 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
            onClick={onCancel}
          >No</button>
        </div>
      </div>
    </div>
  );
}

const StudentProfile = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(authUser);
  const [activeTab, setActiveTab] = useState('about');
  // Cover photo removed
  const [avatarPreview, setAvatarPreview] = useState(user?.imageUrl || user?.avatar || DEFAULT_AVATAR);
  const [form, setForm] = useState({
    name: '',
    email: '',
    specialization: '',
    bio: '',
    phone: '',
    sex: '',
    address: '',
    dateOfBirth: '',
    nationality: '',
    image: null,
    // Cover photo removed
  });
  const [editingField, setEditingField] = useState(null);
  const [pendingField, setPendingField] = useState(null);
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef();
  // Cover photo removed
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    setFetchError(null);
    fetch('/api/student/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      credentials: 'include',
    })
      .then(async res => {
        if (!res.ok) {
          let errorMsg = 'Failed to fetch profile';
          try {
            const err = await res.json();
            errorMsg = err.error || errorMsg;
          } catch {}
          throw new Error(errorMsg);
        }
        return res.json();
      })
      .then(data => {
        setUser(data);
        setAvatarPreview(data?.imageUrl || data?.avatar || DEFAULT_AVATAR);
        setForm({
          name: data?.name || '',
          email: data?.email || '',
          specialization: data?.specialization || '',
          bio: data?.bio || '',
          phone: data?.phone || '',
          sex: data?.sex || '',
          address: data?.address || '',
          dateOfBirth: data?.dateOfBirth ? data.dateOfBirth.slice(0, 10) : '',
          nationality: data?.nationality || '',
          image: null,
        });
      })
      .catch(err => {
        setFetchError(err.message || 'Failed to load profile');
      });
  }, [authUser]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(f => ({ ...f, image: file }));
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Cover photo removed

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'image' && value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, value);
      }
    });
    try {
    const res = await fetch('/api/student/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData,
      credentials: 'include',
    });
    const data = await res.json();
    setUser(data);
      // Cover photo removed
      setAvatarPreview(data?.imageUrl || data?.avatar || DEFAULT_AVATAR);
    } finally {
      setSaving(false);
    }
  };

  // Helper to handle click on a field
  const handleFieldClick = useCallback((field) => {
    if (editingField === field) return;
    setPendingField(field);
  }, [editingField]);

  const handleConfirmEdit = useCallback(() => {
    setEditingField(pendingField);
    setPendingField(null);
  }, [pendingField]);

  const handleCancelEdit = useCallback(() => {
    setPendingField(null);
  }, []);

  // Helper to handle blur (exit edit mode)
  const handleFieldBlur = useCallback(() => {
    setEditingField(null);
  }, []);

  // --- Layout ---
  return (
    <StudentLayout title="My Profile">
      {/* Soft gradient background */}
      <div className="min-h-screen w-full bg-gradient-to-br from-green-50 via-white to-green-100 py-4">
        <ConfirmEditDialog
          open={!!pendingField}
          onConfirm={handleConfirmEdit}
          onCancel={handleCancelEdit}
          fieldLabel={
            pendingField === 'name' ? 'Name' :
            pendingField === 'specialization' ? 'Specialization' :
            pendingField === 'email' ? 'Email' :
            pendingField === 'phone' ? 'Phone' :
            pendingField === 'sex' ? 'Sex' :
            pendingField === 'bio' ? 'Bio' :
            pendingField === 'dateOfBirth' ? 'Date of Birth' :
            pendingField === 'address' ? 'Address' :
            pendingField === 'nationality' ? 'Nationality' :
            ''
          }
        />
        {fetchError ? (
          <div className="max-w-2xl mx-auto mt-12 p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl shadow text-center">
            <div className="font-bold text-lg mb-2">Profile Load Error</div>
            <div>{fetchError}</div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 px-2 mt-8 md:mt-12">
          {/* Left: Profile Summary */}
          <div className="w-full md:w-1/3 flex flex-col items-center md:items-start">
            <div className="relative z-10">
              {/* Avatar with colored ring and subtle glow */}
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-green-400 via-green-200 to-green-100 p-1 shadow-2xl border-4 border-white -mt-10 md:-mt-12 flex items-center justify-center transition-all duration-300 hover:shadow-green-300">
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-2 border-green-200 shadow-lg"
                  onError={e => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR; }}
                />
                <button
                  className="absolute bottom-2 right-2 bg-green-700 text-white rounded-full p-2 shadow-md border border-white hover:bg-green-800 transition"
                  type="button"
                  onClick={() => avatarInputRef.current.click()}
                  title="Change Profile Picture"
                >
                  <Icon icon="carbon:camera" className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={avatarInputRef}
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
              </div>
            </div>
            <div className="mt-2 text-center md:text-left w-full bg-white/80 rounded-xl shadow-lg border border-green-100 p-4 transition-all duration-300 hover:shadow-green-200">
              <h3 className="text-green-900 font-bold text-lg mb-2 flex items-center gap-2"><Icon icon="carbon:user" className="w-5 h-5 text-green-500" /> Personal Info</h3>
              <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">Name</label>
              {editingField === 'name' ? (
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  autoFocus
                  className="w-full border border-green-400 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 font-bold text-base text-gray-900"
                  required
                />
              ) : (
                <div
                  className="w-full px-2 py-1.5 rounded bg-gray-50 font-bold text-base text-gray-900 cursor-pointer hover:bg-green-50 transition"
                  onClick={() => handleFieldClick('name')}
                  tabIndex={0}
                >
                  {form.name || <span className="text-gray-400">(No name set)</span>}
                </div>
              )}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-semibold inline-block mt-1">{user?.status || 'Active'}</span>
              <label className="block text-[11px] font-semibold text-gray-500 mt-2 mb-0.5 flex items-center gap-1"><Icon icon="carbon:education" className="w-4 h-4 text-green-400" /> Specialization</label>
              {editingField === 'specialization' ? (
                <input
                  type="text"
                  name="specialization"
                  value={form.specialization}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  autoFocus
                  className="w-full border border-green-400 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 text-green-700 font-medium"
                />
              ) : (
                <div
                  className="w-full px-2 py-1.5 rounded bg-gray-50 text-green-700 font-medium cursor-pointer hover:bg-green-50 transition"
                  onClick={() => handleFieldClick('specialization')}
                  tabIndex={0}
                >
                  {form.specialization || <span className="text-gray-400">(No specialization set)</span>}
                </div>
              )}
              <label className="block text-[11px] font-semibold text-gray-500 mt-2 mb-0.5 flex items-center gap-1"><Icon icon="carbon:email" className="w-4 h-4 text-green-400" /> Email</label>
              {editingField === 'email' ? (
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  autoFocus
                  className="w-full border border-green-400 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                />
              ) : (
                <div
                  className="w-full px-2 py-1.5 rounded bg-gray-50 cursor-pointer hover:bg-green-50 transition"
                  onClick={() => handleFieldClick('email')}
                  tabIndex={0}
                >
                  {form.email || <span className="text-gray-400">(No email set)</span>}
                </div>
              )}
              <label className="block text-[11px] font-semibold text-gray-500 mt-2 mb-0.5 flex items-center gap-1"><Icon icon="carbon:phone" className="w-4 h-4 text-green-400" /> Phone</label>
              {editingField === 'phone' ? (
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  autoFocus
                  className="w-full border border-green-400 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="e.g. +2507xxxxxxx"
                />
              ) : (
                <div
                  className="w-full px-2 py-1.5 rounded bg-gray-50 cursor-pointer hover:bg-green-50 transition"
                  onClick={() => handleFieldClick('phone')}
                  tabIndex={0}
                >
                  {form.phone || <span className="text-gray-400">(No phone set)</span>}
                </div>
              )}
              <label className="block text-[11px] font-semibold text-gray-500 mt-2 mb-0.5 flex items-center gap-1"><Icon icon="carbon:user" className="w-4 h-4 text-green-400" /> Sex</label>
              {editingField === 'sex' ? (
                <select
                  name="sex"
                  value={form.sex}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  autoFocus
                  className="w-full border border-green-400 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <div
                  className="w-full px-2 py-1.5 rounded bg-gray-50 cursor-pointer hover:bg-green-50 transition"
                  onClick={() => handleFieldClick('sex')}
                  tabIndex={0}
                >
                  {form.sex || <span className="text-gray-400">(No sex set)</span>}
                </div>
              )}
            </div>
          </div>
          {/* Right: Details & Tabs */}
          <div className="w-full md:w-2/3 mt-4 md:mt-0">
            {/* Tabs */}
            <div className="flex gap-1 border-b border-green-200 mb-4">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  className={`px-3 py-2 text-sm font-semibold rounded-t-lg transition-all duration-200 focus:outline-none ${activeTab === tab.key ? 'bg-green-700 text-white shadow-lg' : 'bg-green-50 text-green-900 hover:bg-green-100'}`}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                >
                  <Icon icon={tab.key === 'about' ? 'carbon:user-profile' : tab.key === 'certificates' ? 'carbon:certificate' : 'carbon:progress-bar'} className="w-4 h-4 mr-1 inline-block align-text-bottom" />
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Tab Content */}
            <div className="bg-white/90 rounded-xl shadow-lg border border-green-100 p-6 min-h-[120px] transition-all duration-300 hover:shadow-green-200">
              {activeTab === 'about' && (
                <div>
                  <h3 className="text-green-900 font-bold text-base mb-2 flex items-center gap-2"><Icon icon="carbon:information" className="w-5 h-5 text-green-500" /> About</h3>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-0.5 flex items-center gap-1"><Icon icon="carbon:document" className="w-4 h-4 text-green-400" /> Bio</label>
                  {editingField === 'bio' ? (
                    <textarea
                      name="bio"
                      value={form.bio}
                      onChange={handleInputChange}
                      onBlur={handleFieldBlur}
                      autoFocus
                      className="w-full border border-green-400 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 mb-2"
                      rows={2}
                    />
                  ) : (
                    <div
                      className="w-full px-2 py-1.5 rounded bg-gray-50 cursor-pointer hover:bg-green-50 transition mb-2"
                      onClick={() => handleFieldClick('bio')}
                      tabIndex={0}
                    >
                      {form.bio || <span className="text-gray-400">(No bio set)</span>}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-0.5 flex items-center gap-1"><Icon icon="carbon:calendar" className="w-4 h-4 text-green-400" /> Date of Birth</label>
                      {editingField === 'dateOfBirth' ? (
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={form.dateOfBirth}
                          onChange={handleInputChange}
                          onBlur={handleFieldBlur}
                          autoFocus
                          className="w-full border border-green-400 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                      ) : (
                        <div
                          className="w-full px-2 py-1.5 rounded bg-gray-50 cursor-pointer hover:bg-green-50 transition"
                          onClick={() => handleFieldClick('dateOfBirth')}
                          tabIndex={0}
                        >
                          {form.dateOfBirth || <span className="text-gray-400">(No date of birth set)</span>}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-0.5 flex items-center gap-1"><Icon icon="carbon:location" className="w-4 h-4 text-green-400" /> Address</label>
                      {editingField === 'address' ? (
                        <input
                          type="text"
                          name="address"
                          value={form.address}
                          onChange={handleInputChange}
                          onBlur={handleFieldBlur}
                          autoFocus
                          className="w-full border border-green-400 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                      ) : (
                        <div
                          className="w-full px-2 py-1.5 rounded bg-gray-50 cursor-pointer hover:bg-green-50 transition"
                          onClick={() => handleFieldClick('address')}
                          tabIndex={0}
                        >
                          {form.address || <span className="text-gray-400">(No address set)</span>}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-0.5 flex items-center gap-1"><Icon icon="carbon:earth" className="w-4 h-4 text-green-400" /> Nationality</label>
                      {editingField === 'nationality' ? (
                        <input
                          type="text"
                          name="nationality"
                          value={form.nationality}
                          onChange={handleInputChange}
                          onBlur={handleFieldBlur}
                          autoFocus
                          className="w-full border border-green-400 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                      ) : (
                        <div
                          className="w-full px-2 py-1.5 rounded bg-gray-50 cursor-pointer hover:bg-green-50 transition"
                          onClick={() => handleFieldClick('nationality')}
                          tabIndex={0}
                        >
                          {form.nationality || <span className="text-gray-400">(No nationality set)</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'certificates' && (
                <div>
                  <h3 className="text-green-900 font-bold text-base mb-2 flex items-center gap-2"><Icon icon="carbon:certificate" className="w-5 h-5 text-green-500" /> Certificates</h3>
                  <CertificateList userId={user?.id} />
                </div>
              )}
              {activeTab === 'progress' && (
                <div>
                  <h3 className="text-green-900 font-bold text-base mb-2 flex items-center gap-2"><Icon icon="carbon:progress-bar" className="w-5 h-5 text-green-500" /> Progress</h3>
                  <ProgressTracker userId={user?.id} />
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white font-semibold py-2 px-8 rounded-lg text-base transition-all duration-300 shadow-lg hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 flex items-center gap-2"
                disabled={saving}
              >
                {saving && <Icon icon="carbon:loading" className="w-5 h-5 animate-spin" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      )}
      </div>
    </StudentLayout>
  );
};

export default StudentProfile; 