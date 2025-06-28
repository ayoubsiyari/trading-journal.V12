// src/App.jsx
import React from 'react';
import { TooltipProvider } from './components/ui/tooltip';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';
import SetupAnalysis from './pages/analytics/SetupAnalysis'; // ✅ import this at the top
import PerformanceAnalysis from './pages/analytics/PerformanceAnalysis';
import StreakAnalyzer from './pages/analytics/StreakAnalyzer';

import Home      from './pages/Home';
import Sidebar   from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Journal   from './pages/Journal';
import Analytics from './pages/Analytics';
import Trades    from './pages/Trades';
import Settings  from './pages/Settings';
import Learn     from './pages/Learn';
import TagBreakdown from './pages/analytics/TagBreakdown';
import SymbolAnalysis from './pages/analytics/SymbolAnalysis';
import StrategyAnalysis from './pages/analytics/StrategyAnalysis';
import ReportGenerator from './pages/analytics/ReportGenerator';
import RiskDashboard from './pages/analytics/RiskDashboard';
import ExitAnalysis from './pages/analytics/ExitAnalysis';


import Equity from './pages/analytics/Equity';
import Calendar from './pages/analytics/Calendar';
import Highlights from './pages/analytics/Highlights';


import Breakdowns from './pages/analytics/Breakdowns';
import RecentTrades from './pages/analytics/RecentTrades';
import VariablesAnalysis from './pages/analytics/VariablesAnalysis';

import Features from './pages/Features';
import Login     from './pages/Login';
import Register  from './pages/Register';
import ImportTrades from './pages/ImportTrades';

/**
 * Layout that wraps all “protected” pages (i.e. those that should show the Sidebar).
 */
function LayoutWithSidebar() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/journal"   element={<Journal />} />
          <Route path="/import-trades" element={<ImportTrades />} />
          <Route path="/analytics/setup-analysis" element={<SetupAnalysis />} />
          <Route path="/analytics/variables" element={<VariablesAnalysis />} />
          {/* Analytics subpages */}
          
          <Route path="/analytics/exitanalysis" element={<ExitAnalysis />} />
          <Route path="/analytics/equity" element={<Equity />} />
          <Route path="/analytics/calendar" element={<Calendar />} />
          <Route path="/analytics/highlights" element={<Highlights />} />
          
          <Route path="/analytics/breakdowns" element={<Breakdowns />} />
          <Route path="/analytics/recent-trades" element={<RecentTrades />} />
          <Route path="/analytics/tags" element={<TagBreakdown />} />
          <Route path="/analytics/symbols" element={<SymbolAnalysis />} />
          <Route path="/analytics/strategies" element={<StrategyAnalysis />} />
          <Route path="/analytics/report" element={<ReportGenerator />} />
          <Route path="/analytics/risk" element={<RiskDashboard />} />
          <Route path="/analytics/performance-analysis" element={<PerformanceAnalysis />} />
          <Route path="/analytics/streaks" element={<StreakAnalyzer />} />

          <Route path="/analytics" element={<Analytics />} />
          <Route path="/trades"    element={<Trades />} />
          <Route path="/settings"  element={<Settings />} />
          <Route path="/learn"     element={<Learn />} />
          {/* If none of the above match under “protected,” redirect to /dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

/**
 * Decides which layout to render based on the current path.
 * - “public” routes (/, /login, /register) show only the Navbar + page (no Sidebar).
 * - All other routes render LayoutWithSidebar (sidebar + their respective pages).
 */
function AppRoutes() {
  const location = useLocation();

  // Paths on which we do NOT want to render the Sidebar:
  const isPublicPath =
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/features';

  return (
    <TooltipProvider>
      {isPublicPath ? (
        <>
          <div className="pt-4 px-4">
            {/* Navigation would go here */}
          </div>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/features" element={<Features />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </>
      ) : (
        <LayoutWithSidebar />
      )}
    </TooltipProvider>
  );

}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
