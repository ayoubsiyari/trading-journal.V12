// src/components/Layout.jsx
import React from 'react';
import Sidebar from './Sidebar'; // adjust path if different
import Navbar from './Navbar';   // adjust path if different

export default function Layout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* 1. Sidebar */}
      <Sidebar />

      {/* 2. Main area: Navbar + content */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* 2a. Top Navbar */}
        <Navbar />

        {/* 2b. Page content */}
        <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
