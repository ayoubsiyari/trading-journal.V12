import React from 'react';

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <h2 className="text-xl font-bold mb-6">📘 Menu</h2>
      <ul className="space-y-3">
        <li><a href="/dashboard" className="hover:underline">Dashboard</a></li>
        <li><a href="/journal" className="hover:underline">Journal</a></li>
        <li><a href="/analytics" className="hover:underline">Analytics</a></li>
        <li><a href="/trades" className="hover:underline">Trades</a></li>
        <li><a href="/settings" className="hover:underline">Settings</a></li>
        <li>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
            className="text-red-400 hover:text-red-200 mt-2"
          >
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
}
