// frontend/src/pages/Settings.jsx

import React, { useEffect, useState } from 'react';

export default function Settings() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');           // new password
  const [profileImage, setProfileImage] = useState('');   // a URL string
  const [previewImage, setPreviewImage] = useState('');   // for <img> preview
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. On mount: fetch current profile
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setMsg('❌ You are not logged in.');
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 422) {
          setMsg('❌ Invalid or expired token. Please log in again.');
          return;
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setEmail(data.email || '');
        setProfileImage(data.profile_image || '');
        setPreviewImage(data.profile_image || '');
        setMsg('');
      } catch (err) {
        console.error('❌ Settings.jsx: fetchProfile error →', err);
        setMsg('❌ Failed to load profile. See console.');
      }
    };

    fetchProfile();
  }, []);

  // 2. Handle form submission (update profile)
  const handleSave = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setMsg('❌ You must be logged in.');
      setLoading(false);
      return;
    }

    // Validate email
    if (!email.trim()) {
      setMsg('❌ Email cannot be empty.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        // only include password if user typed something
        ...(password.trim() ? { password: password.trim() } : {}),
        // only include profile_image if user typed something
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

      console.log('📦 Settings.jsx PUT /api/auth/profile →', res.status);
      const data = await res.json();

      if (res.ok) {
        setMsg('✅ Profile updated successfully!');
        // If the user provided a new profileImage, update the preview
        if (payload.profile_image) {
          setPreviewImage(payload.profile_image);
        }
        // Clear the password field after successful update
        setPassword('');
      } else {
        setMsg(`❌ ${data.error || data.msg || 'Failed to update profile.'}`);
      }
    } catch (err) {
      console.error('❌ Settings.jsx: update error →', err);
      setMsg('❌ Server error while saving.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Whenever profileImage state changes, update preview (if valid URL)
  const handleImageChange = (e) => {
    const url = e.target.value;
    setProfileImage(url);
    setPreviewImage(url);
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">⚙️ Settings</h1>

      {msg && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            msg.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-800'
                                : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {msg}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        {/* 1. Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* 2. New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password <span className="text-xs text-gray-500">(leave blank to keep unchanged)</span></label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="••••••••"
          />
        </div>

        {/* 3. Profile Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image URL</label>
          <input
            type="text"
            value={profileImage}
            onChange={handleImageChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/my-avatar.jpg"
          />
          {previewImage && (
            <img
              src={previewImage}
              alt="Profile Preview"
              className="mt-3 h-24 w-24 rounded-full object-cover border"
            />
          )}
        </div>

        {/* 4. Save Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-6 rounded-lg font-medium transition ${
            loading
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Saving...' : '💾 Save Changes'}
        </button>
      </form>

      {/* 5. Logout Button */}
      <div className="mt-8 text-center">
        <button
          onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }}
          className="text-red-600 hover:underline"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}
