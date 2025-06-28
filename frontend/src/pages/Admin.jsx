// src/pages/Admin.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Simple inline styles (or replace with your Tailwind classes as desired)
const cardStyle = "bg-white shadow rounded p-4 mb-4";

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false); // toggle to re-fetch

  // 1) Redirect non-admins
  useEffect(() => {
    const isAdmin = localStorage.getItem('is_admin') === "true";
    if (!isAdmin) {
      navigate('/dashboard'); // or wherever you want to send non-admins
    }
  }, [navigate]);

  // 2) Fetch the list of users whenever component mounts or refreshFlag toggles
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/admin/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Status ${res.status}`);
        }
        setUsers(data.users || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load user list.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [refreshFlag]);

  // 3) Handle create user form submit
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");

    if (!newEmail || !newPassword) {
      setError("Email and password are required.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          is_admin: newIsAdmin
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Status ${res.status}`);
      }
      // Clear form and re-fetch
      setNewEmail("");
      setNewPassword("");
      setNewIsAdmin(false);
      setRefreshFlag(f => !f);
    } catch (err) {
      console.error(err);
      setError("Error creating user: " + err.message);
    }
  };

  // 4) Handle delete user
  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Status ${res.status}`);
      }
      // Re-fetch
      setRefreshFlag(f => !f);
    } catch (err) {
      console.error(err);
      setError("Error deleting user: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading users…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Admin: Manage Users</h1>
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {/* Create User Form */}
      <div className={cardStyle}>
        <h2 className="text-xl font-semibold mb-2">Create New User</h2>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
              placeholder="user@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Secure password"
              required
            />
          </div>
          <div className="flex items-center">
            <input
              id="is_admin_checkbox"
              type="checkbox"
              checked={newIsAdmin}
              onChange={e => setNewIsAdmin(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="is_admin_checkbox" className="ml-2 text-sm">
              Grant admin rights
            </label>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create User
          </button>
        </form>
      </div>

      {/* Existing Users List */}
      <div className={cardStyle}>
        <h2 className="text-xl font-semibold mb-2">Existing Users</h2>
        {users.length === 0 ? (
          <p className="text-gray-600">No users found.</p>
        ) : (
          <table className="w-full table-auto">
            <thead>
              <tr>
                <th className="text-left py-2 px-4 font-medium">ID</th>
                <th className="text-left py-2 px-4 font-medium">Email</th>
                <th className="text-left py-2 px-4 font-medium">Admin?</th>
                <th className="text-right py-2 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="py-2 px-4">{u.id}</td>
                  <td className="py-2 px-4">{u.email}</td>
                  <td className="py-2 px-4">{u.is_admin ? "Yes" : "No"}</td>
                  <td className="py-2 px-4 text-right">
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
