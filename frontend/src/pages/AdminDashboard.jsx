// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, PlusCircle } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isAdminCheck, setIsAdminCheck] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1) On mount, verify admin token exists and has is_admin claim
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    // Decode token payload to check “is_admin”:
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.is_admin) {
        throw new Error('Not an admin token');
      }
      setIsAdminCheck(true);
    } catch (e) {
      localStorage.removeItem('adminToken');
      navigate('/admin/login');
    }
  }, [navigate]);

  // 2) Handle “Create new user” submission
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!newEmail || !newPassword) {
      setErrorMsg('Email & password required');
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:5000/api/admin/create_user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          is_admin: false, // always false when admin creates a “regular” user
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Creation failed');
      } else {
        setSuccessMsg(`Created user: ${data.user.email}`);
        setNewEmail('');
        setNewPassword('');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Server error');
    }
  };

  if (!isAdminCheck) {
    // can render a small spinner or text while verifying
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          <button
            onClick={() => {
              localStorage.removeItem('adminToken');
              navigate('/admin/login');
            }}
            className="text-red-600 hover:text-red-800"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold mb-4">Create New User Account</h2>
        {errorMsg && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4">
            {successMsg}
          </div>
        )}
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <div className="flex items-center border rounded">
              <Mail className="ml-2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                className="flex-1 px-3 py-2 outline-none"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <div className="flex items-center border rounded">
              <Lock className="ml-2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                className="flex-1 px-3 py-2 outline-none"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Create User
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
