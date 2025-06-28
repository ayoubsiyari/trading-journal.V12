// Sidebar.jsx - with collapsible Analytics section
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';
import {
  Home,
  BookOpen,
  BarChart2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Flame,
  Info,
  UploadCloud,
  Settings as Cog,
  LogOut,
  User
} from 'lucide-react';

export default function Sidebar() {
  const [profileImage, setProfileImage] = useState('');
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (data.profile_image) setProfileImage(data.profile_image);
      } catch (err) {
        console.error('❌ Error fetching profile:', err);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    // Auto-open Analytics if on a subpage
    if (location.pathname.startsWith('/analytics')) {
      setAnalyticsOpen(true);
    }
  }, [location.pathname]);

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen flex flex-col">
      <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-200 mb-6">MyJournal</h1>
        <DarkModeToggle />
      </div>
      <div className="text-center mb-4">
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center overflow-hidden shadow-lg dark:shadow-none">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" onError={() => setProfileImage('')} />
            ) : (
              <User className="w-16 h-16 text-white" />
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Main</p>
          <NavLink to="/dashboard" className={({ isActive }) => `${isActive ? 'bg-gray-100 dark:bg-gray-700' : ''} flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
            <Home className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
            <span className="font-medium">Dashboard</span>
          </NavLink>

          <NavLink to="/journal" className={({ isActive }) => `${isActive ? 'bg-gray-100 dark:bg-gray-700' : ''} flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
            <BookOpen className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
            <span className="font-medium">Journal</span>
          </NavLink>

          <button
            onClick={() => setAnalyticsOpen(!analyticsOpen)}
            className="w-full flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <BarChart2 className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
            <span className="font-medium flex-1 text-left">Analytics</span>
            {analyticsOpen ? <ChevronUp className="h-4 w-4 dark:text-gray-400" /> : <ChevronDown className="h-4 w-4 dark:text-gray-400" />}
          </button>

          {analyticsOpen && (
            <div className="ml-8 space-y-1">
              
              <NavLink to="/analytics/equity" className={({ isActive }) => `${isActive ? 'text-blue-600 font-semibold' : ''} block text-sm py-1 hover:underline`}>
                Equity Curve
              </NavLink>

              
              <NavLink to="/analytics/performance-analysis" className={({ isActive }) => `${isActive ? 'text-blue-600 font-semibold' : ''} block text-sm py-1 hover:underline flex items-center`}>
                <TrendingUp className="h-3 w-3 mr-2" />
                Performance Analysis
              </NavLink>
              <NavLink to="/analytics/streaks" className={({ isActive }) => `${isActive ? 'text-blue-600 font-semibold' : ''} block text-sm py-1 hover:underline flex items-center`}>
                <Flame className="h-3 w-3 mr-2 text-orange-500" />
                Streak Analyzer
              </NavLink>
              <NavLink to="/analytics/exitanalysis" className={({ isActive }) => `${isActive ? 'text-blue-600 font-semibold' : ''} block text-sm py-1 hover:underline flex items-center`}>
                <BarChart2 className="h-3 w-3 mr-2 text-blue-500" />
                Exit Analysis (Select Trade)
              </NavLink>
              
              <NavLink to="/analytics/risk" className={({ isActive }) => `${isActive ? 'text-blue-600 font-semibold' : ''} block text-sm py-1 hover:underline`}>
                Risk Dashboard
              </NavLink>
              <NavLink to="/analytics/calendar" className={({ isActive }) => `${isActive ? 'text-blue-600 font-semibold' : ''} block text-sm py-1 hover:underline`}>
                Calendar
              </NavLink>
              <NavLink to="/analytics/highlights" className={({ isActive }) => `${isActive ? 'text-blue-600 font-semibold' : ''} block text-sm py-1 hover:underline`}>
                Highlights
              </NavLink>
              
              <NavLink to="/analytics/breakdowns" className={({ isActive }) => `${isActive ? 'text-blue-600 font-semibold' : ''} block text-sm py-1 hover:underline`}>
                Breakdowns
              </NavLink>
              <NavLink to="/analytics/recent-trades" className={({ isActive }) => `${isActive ? 'text-blue-600 font-semibold' : ''} block text-sm py-1 hover:underline`}>
                Recent Trades
              </NavLink>
              <NavLink to="/analytics/variables" className={({ isActive }) => `${isActive ? 'text-blue-600 font-semibold' : ''} block text-sm py-1 hover:underline`}>
                Variables Analysis
              </NavLink>
              <NavLink to="/analytics/symbols" className={({ isActive }) => `${isActive ? 'text-blue-600 font-semibold' : ''} block text-sm py-1 hover:underline`}>
                Symbol Analysis
              </NavLink>
              <NavLink to="/analytics/strategies" className={({ isActive }) => `${isActive ? 'text-blue-600 font-semibold' : ''} block text-sm py-1 hover:underline`}>
                Strategy Analysis
              </NavLink>
              <NavLink to="/analytics/setup-analysis"
                 className={({ isActive }) =>
                 `${isActive ? 'text-blue-600 font-semibold' : ''} block text-sm py-1 hover:underline`}>
                   Setup Analysis
              </NavLink>
              <NavLink to="/analytics/report" className={({ isActive }) => `${isActive ? 'text-blue-600 font-semibold' : ''} block text-sm py-1 hover:underline`}>
                Export Report
              </NavLink>
            </div>
          )}
        </div>
          

        <div className="mt-8 space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trades</p>
          <NavLink to="/trades" className={({ isActive }) => `${isActive ? 'bg-gray-100 dark:bg-gray-700' : ''} flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
            <TrendingUp className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
            <span className="font-medium">Trades</span>
          </NavLink>

          <NavLink to="/import-trades" className={({ isActive }) => `${isActive ? 'bg-gray-100 dark:bg-gray-700' : ''} flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
            <UploadCloud className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
            <span className="font-medium">Import Trades</span>
          </NavLink>

          <NavLink to="/learn" className={({ isActive }) => `${isActive ? 'bg-gray-100 dark:bg-gray-700' : ''} flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
            <Info className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
            <span className="font-medium">Learn</span>
          </NavLink>
        </div>

        <div className="mt-8 space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Settings</p>
          <NavLink to="/settings" className={({ isActive }) => `${isActive ? 'bg-gray-100 dark:bg-gray-700' : ''} flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
            <Cog className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
            <span className="font-medium">Settings</span>
          </NavLink>
        </div>
      </nav>

      <div className="px-4 py-6 border-t border-gray-200 dark:border-gray-700">
        <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/'; }} className="flex items-center w-full px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors">
          <LogOut className="h-5 w-5 mr-3 dark:text-gray-400" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
