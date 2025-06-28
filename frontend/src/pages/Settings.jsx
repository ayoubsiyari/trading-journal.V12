import React, { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Image,
  Save,
  LogOut,
  Eye,
  EyeOff,
  Camera,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

export default function Settings() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState({ email: '', profileImage: '' });

  // ─── 1. On mount: fetch current profile ────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setMsg('You are not logged in.');
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/api/auth/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });

        if (res.status === 401 || res.status === 422) {
          setMsg('Invalid or expired token. Please log in again.');
          setTimeout(() => (window.location.href = '/login'), 2000);
          return;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setEmail(data.email || '');
        setProfileImage(data.profile_image || '');
        setPreviewImage(data.profile_image || '');
        setOriginalData({
          email: data.email || '',
          profileImage: data.profile_image || ''
        });
        setMsg('');
      } catch (err) {
        console.error('Settings.jsx: fetchProfile error →', err);
        setMsg('Failed to load profile. Please try again.');
      }
    };

    fetchProfile();
  }, []);

  // ─── 2. Track “unsaved changes” ───────────────────────────────────────────────
  useEffect(() => {
    const changed =
      email !== originalData.email ||
      password.trim() !== '' ||
      profileImage !== originalData.profileImage;
    setHasChanges(changed);
  }, [email, password, profileImage, originalData]);

  // ─── 3. Handle form submission (update profile) ───────────────────────────────
  const handleSave = async (e) => {
    console.log('🔴 handleSave called');
    e.preventDefault();
    setMsg('');
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setMsg('You must be logged in.');
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setMsg('Email cannot be empty.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        ...(password.trim() ? { password: password.trim() } : {}),
        ...(profileImage.trim() ? { profile_image: profileImage.trim() } : {})
      };

      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setMsg('Profile updated successfully!');
        if (payload.profile_image) {
          setPreviewImage(payload.profile_image);
        }
        setPassword('');
        setOriginalData({
          email: payload.email,
          profileImage: payload.profile_image || originalData.profileImage
        });
        // Clear success message after 3 seconds
        setTimeout(() => setMsg(''), 3000);
      } else {
        setMsg(data.error || data.msg || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Settings.jsx: update error →', err);
      setMsg('Server error while saving. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── 4. Handle image URL change ───────────────────────────────────────────────
  const handleImageChange = (e) => {
    const url = e.target.value;
    setProfileImage(url);
    setPreviewImage(url);
  };

  // ─── 5. Handle logout ─────────────────────────────────────────────────────────
  const handleLogout = () => {
    if (hasChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to logout?')) {
        return;
      }
    }
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const getMessageType = () => {
    if (msg.includes('successfully')) return 'success';
    if (msg.includes('Invalid') || msg.includes('Failed') || msg.includes('error')) return 'error';
    return 'info';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4 shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your profile and account preferences</p>
        </div>

        {/* Status Message */}
        {msg && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 shadow-sm ${
              getMessageType() === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : getMessageType() === 'error'
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}
          >
            {getMessageType() === 'success' && <Check className="w-5 h-5 flex-shrink-0" />}
            {getMessageType() === 'error' && <X className="w-5 h-5 flex-shrink-0" />}
            {getMessageType() === 'info' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="font-medium">{msg}</span>
          </div>
        )}

        {/* Main Settings Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
              {hasChanges && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                  <AlertCircle className="w-3 h-3" />
                  Unsaved changes
                </span>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Profile Image Section */}
            <div className="text-center pb-6 border-b border-gray-100">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center overflow-hidden shadow-lg">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={() => setPreviewImage('')}
                    />
                  ) : (
                    <User className="w-16 h-16 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3">Upload a photo to personalize your account</p>
            </div>

            {/* Profile Image URL */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Image className="w-4 h-4" />
                Profile Image URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={profileImage}
                  onChange={handleImageChange}
                  className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="https://example.com/your-photo.jpg"
                />
              </div>
              <p className="text-xs text-gray-500">Paste a URL to your profile image</p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Lock className="w-4 h-4" />
                New Password
                <span className="text-xs text-gray-500 font-normal">(leave blank to keep current)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">Must be at least 8 characters long</p>
            </div>

            {/* Save Button */}
            <div className="pt-6">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || !hasChanges}
                className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
                  loading || !hasChanges
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Logout Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Sign Out</h3>
                <p className="text-sm text-gray-600">Sign out of your account on this device</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors font-medium"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Your data is encrypted and secure. We never share your information.</p>
        </div>
      </div>
    </div>
  );
}
