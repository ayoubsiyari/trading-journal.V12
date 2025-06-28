// src/pages/Features.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.webp';
import {
  TrendingUp,
  BarChart3,
  BookOpen,
  ClipboardList,
  Settings,
  Book,
  Star,
  Diamond,
  Crown,
} from 'lucide-react';

export default function Features() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStat, setCurrentStat] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { value: '50K+', label: 'Active Traders' },
    { value: '1M+', label: 'Trades Logged' },
    { value: '200+', label: 'Metrics Tracked' },
    { value: '99.9%', label: 'Platform Uptime' },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-lg border-b border-yellow-400/20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <img
                src={logo}
                alt="App Logo"
                className="w-10 h-10 rounded-lg"
              />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              TRADECIRCLE
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/features"
              className="text-gray-300 hover:text-yellow-400 transition-colors font-semibold"
            >
              Features
            </Link>
            <Link
              to="/analytics"
              className="text-gray-300 hover:text-yellow-400 transition-colors font-semibold"
            >
              Analytics
            </Link>
            <Link
              to="/pricing"
              className="text-gray-300 hover:text-yellow-400 transition-colors font-semibold"
            >
              Pricing
            </Link>
            <Link
              to="/contact"
              className="text-gray-300 hover:text-yellow-400 transition-colors font-semibold"
            >
              Contact
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="px-4 py-2 text-yellow-400 hover:text-white transition-colors font-semibold"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-lg hover:scale-105 transition-transform"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Animated Background Orbs */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute top-20 left-24 w-96 h-96 bg-yellow-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-24 right-24 w-80 h-80 bg-yellow-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-300 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 pt-20">
        <div className="container mx-auto px-6 pt-20 pb-32">
          <div
            className={`text-center max-w-5xl mx-auto transition-all duration-2000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative w-32 h-32 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-500">
                <img
                  src={logo}
                  alt="App Logo"
                  className="w-20 h-20 rounded-lg"
                />
              </div>
            </div>

            <div className="mb-6">
              <h1 className="text-8xl md:text-9xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent leading-none animate-pulse">
                FEATURES
              </h1>
              <div className="flex items-center justify-center space-x-4">
                <Star className="w-8 h-8 text-yellow-400 animate-spin" />
                <h2 className="text-4xl md:text-5xl font-bold text-yellow-400 tracking-widest">
                  PLATFORM OVERVIEW
                </h2>
                <Star className="w-8 h-8 text-yellow-400 animate-spin" />
              </div>
            </div>

            <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Explore the cutting-edge tools and modules we offer to help you
              log, analyze, and optimize your trading performance. Every
              feature is designed for professional traders who demand excellence.
            </p>
          </div>
        </div>
      </div>

      {/* Animated Stats */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-r from-yellow-400/5 to-yellow-600/5 rounded-3xl p-12 border border-yellow-400/20 backdrop-blur-sm">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={`transform transition-all duration-1000 ${
                    currentStat === index
                      ? 'scale-110 text-yellow-400'
                      : 'scale-100 text-white'
                  }`}
                >
                  <div className="text-5xl font-black mb-2 animate-pulse">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 font-semibold tracking-wide">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Details Sections */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Star className="w-8 h-8 text-yellow-400 animate-spin" />
              <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                CORE FEATURES
              </h2>
              <Star className="w-8 h-8 text-yellow-400 animate-spin" />
            </div>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Each module is tailored to provide you maximum insight and full
              control over your trading strategy.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Journal Entry */}
            <div className="space-y-10">
              <div className="group hover:scale-105 transition-all duration-500">
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl group-hover:shadow-yellow-500/50 transition-all duration-300">
                    <ClipboardList className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold mb-3 text-yellow-400">
                      PROFESSIONAL JOURNAL ENTRY
                    </h3>
                    <p className="text-gray-300 text-lg">
                      Log each trade with precision: symbol, direction, entry &
                      exit prices, position sizing, risk amounts, P&L, R:R,
                      and detailed notes. Our intuitive form ensures no detail
                      goes missing—perfect for keeping an accurate, audit-ready
                      record.
                    </p>
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="group hover:scale-105 transition-all duration-500">
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl group-hover:shadow-yellow-500/50 transition-all duration-300">
                    <BarChart3 className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold mb-3 text-yellow-400">
                      IN-DEPTH ANALYTICS
                    </h3>
                    <p className="text-gray-300 text-lg">
                      Gain actionable insights with over 200+ metrics: win/loss
                      rates, expectancy, Sharpe ratio, profit factor, max
                      drawdown, equity curves, P&L by date, and more. Our
                      interactive charts and downloadable reports help you
                      identify strengths, weaknesses, and opportunities.
                    </p>
                  </div>
                </div>
              </div>

              {/* Trades Overview */}
              <div className="group hover:scale-105 transition-all duration-500">
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl group-hover:shadow-yellow-500/50 transition-all duration-300">
                    <TrendingUp className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold mb-3 text-yellow-400">
                      TRADE HISTORY & FILTERS
                    </h3>
                    <p className="text-gray-300 text-lg">
                      View, filter, search, edit, and delete all past trades in
                      one place. Filter by P&L, direction (long/short), instrument
                      type, or date range. Export to Excel for offline analysis.
                      Import existing spreadsheets to get started instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Content Placeholder */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-black/50 rounded-3xl p-10 border border-yellow-400/30 backdrop-blur-sm">
                <div className="text-center mb-8">
                  <BarChart3 className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-3xl font-bold text-yellow-400 mb-2">
                    CUSTOM REPORTS
                  </h3>
                  <p className="text-gray-400">
                    Export & analyze your data in Excel, PDF, or shareable
                    dashboards—perfect for presentations and performance reviews.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center p-4 bg-yellow-400/5 rounded-xl">
                    <span className="text-gray-300">Win Rate</span>
                    <span className="text-yellow-400 font-bold">85.2%</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-yellow-400/5 rounded-xl">
                    <span className="text-gray-300">Avg R:R</span>
                    <span className="text-yellow-400 font-bold">2.8</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-yellow-400/5 rounded-xl">
                    <span className="text-gray-300">Total P&L</span>
                    <span className="text-yellow-400 font-bold">$120K</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-yellow-400/5 rounded-xl">
                    <span className="text-gray-300">Max Drawdown</span>
                    <span className="text-yellow-400 font-bold">-3.4%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Second Row: Settings & Learn */}
          <div className="mt-20 grid lg:grid-cols-2 gap-16 items-center">
            {/* Settings */}
            <div className="group hover:scale-105 transition-all duration-500">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl group-hover:shadow-yellow-500/50 transition-all duration-300">
                  <Settings className="w-8 h-8 text-black" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-3 text-yellow-400">
                    CUSTOMIZABLE SETTINGS
                  </h3>
                  <p className="text-gray-300 text-lg">
                    Personalize your trading environment: update email, password,
                    profile image, and notification preferences. Secure your
                    account with industry-leading encryption and two-factor
                    authentication (optional).
                  </p>
                </div>
              </div>
            </div>

            {/* Learn */}
            <div className="group hover:scale-105 transition-all duration-500">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl group-hover:shadow-yellow-500/50 transition-all duration-300">
                  <BookOpen className="w-8 h-8 text-black" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-3 text-yellow-400">
                    LEARN & SUPPORT
                  </h3>
                  <p className="text-gray-300 text-lg">
                    Access our comprehensive library of tutorials, FAQs, and
                    community forums. Get guidance from expert traders, watch
                    video walkthroughs, and join live Q&A sessions. Level up your
                    skills with in-depth articles on strategy, risk management,
                    and psychology.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Elite Membership CTA */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              UPGRADE TO ELITE
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Unlock advanced AI tools, quantum risk models, and institutional-grade analytics.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
              <div className="relative bg-black border-2 border-yellow-400 rounded-3xl p-12 text-center">
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <Crown className="w-12 h-12 text-yellow-400 animate-pulse" />
                  <h3 className="text-4xl font-black text-yellow-400">ELITE ACCESS</h3>
                  <Crown className="w-12 h-12 text-yellow-400 animate-pulse" />
                </div>

                <div className="mb-8">
                  <div className="text-7xl font-black text-white mb-4">
                    $299<span className="text-2xl text-gray-400">/mo</span>
                  </div>
                  <div className="text-yellow-400 text-lg">Pro Institutional Tier</div>
                </div>

                <div className="space-y-4 mb-10 text-left">
                  <div className="flex items-center space-x-3">
                    <Star className="w-6 h-6 text-yellow-400" />
                    <span className="text-gray-300">Unlimited Journal Entries</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="w-6 h-6 text-yellow-400" />
                    <span className="text-gray-300">AI Alpha Detection</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="w-6 h-6 text-yellow-400" />
                    <span className="text-gray-300">Quantum Risk Modeling</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="w-6 h-6 text-yellow-400" />
                    <span className="text-gray-300">24/7 Priority Support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="w-6 h-6 text-yellow-400" />
                    <span className="text-gray-300">Exclusive Market Alerts</span>
                  </div>
                </div>

                <Link
                  to="/register"
                  className="block w-full py-5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xl font-bold rounded-2xl shadow-2xl hover:shadow-yellow-500/50 transform hover:scale-105 transition-all duration-500 mb-4"
                >
                  UPGRADE NOW
                </Link>

                <p className="text-sm text-gray-500">
                  * Portfolio verification required • Subject to approval
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-8">
            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent animate-pulse">
              TAKE CONTROL OF YOUR TRADES
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Join thousands of elite traders who trust TradeCircle for
              cutting-edge insights and professional-grade analytics.
            </p>
          </div>

          <div className="flex items-center justify-center space-x-4 mb-8">
            <Diamond className="w-8 h-8 text-yellow-400 animate-spin" />
            <span className="text-yellow-400 text-lg font-bold tracking-widest">
              PROFESSIONAL • PRECISE • POWERFUL
            </span>
            <Diamond className="w-8 h-8 text-yellow-400 animate-spin" />
          </div>

          <Link
            to="/register"
            className="inline-block px-16 py-6 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-2xl font-black rounded-2xl shadow-2xl hover:shadow-yellow-500/50 transform hover:scale-110 transition-all duration-500"
          >
            START YOUR EDGE
          </Link>
        </div>
      </section>
    </div>
  );
}
