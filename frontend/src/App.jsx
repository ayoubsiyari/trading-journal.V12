// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Sidebar   from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Journal   from './pages/Journal';
import Analytics from './pages/Analytics';
import Trades    from './pages/Trades';
import Settings  from './pages/Settings';
import Login     from './pages/Login';
import Register  from './pages/Register'; // ← Make sure this file exists

function LayoutWithSidebar() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/journal"   element={<Journal />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/trades"    element={<Trades />} />
          <Route path="/settings"  element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  // Hide sidebar when on /, /login, or /register
  const hideSidebar =
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register';

  return hideSidebar ? (
    <Routes>
      {/* Root path and /login both show the login form */}
      <Route path="/"      element={<Login />} />
      <Route path="/login" element={<Login />} />

      {/* /register shows the registration form */}
      <Route path="/register" element={<Register />} />
    </Routes>
  ) : (
    <LayoutWithSidebar />
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
