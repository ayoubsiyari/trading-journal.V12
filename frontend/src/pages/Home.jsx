import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.webp';


import { TrendingUp, BarChart3, Target, Shield, Calendar, PieChart, Award, Zap, Users, Clock, Star, Crown, Diamond } from 'lucide-react';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStat, setCurrentStat] = useState(0);
  
  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentStat(prev => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { value: "$2.5B+", label: "Capital Managed" },
    { value: "10,000+", label: "Elite Traders" },
    { value: "500M+", label: "Trades Analyzed" },
    { value: "99.9%", label: "Uptime" }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Premium Navbar with Working Routes */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-lg border-b border-yellow-400/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <img
                              src={logo}
                              alt="Hermes Logo"
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                            />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                HERMES
              </span>
            </Link>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/Features" className="text-gray-300 hover:text-yellow-400 transition-colors font-semibold">
                Features
              </Link>
              <Link to="/analytics" className="text-gray-300 hover:text-yellow-400 transition-colors font-semibold">
                Analytics
              </Link>
              <Link to="/pricing" className="text-gray-300 hover:text-yellow-400 transition-colors font-semibold">
                Pricing
              </Link>
              <Link to="/contact" className="text-gray-300 hover:text-yellow-400 transition-colors font-semibold">
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
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Animated Background */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-yellow-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-yellow-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-300 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 pt-20">
        <div className="container mx-auto px-6 pt-20 pb-32">
          <div className={`text-center max-w-5xl mx-auto transition-all duration-2000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative w-32 h-32 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-500">
                <img
                              src={logo}
                              alt="Hermes Logo"
                              className="w-19 h-19 rounded-lg flex items-center justify-center"
                            />
                
              </div>
            </div>
            
            <div className="mb-6">
              <h1 className="text-8xl md:text-9xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent leading-none animate-pulse">
                HERMES
              </h1>
              <div className="flex items-center justify-center space-x-4">
                <Star className="w-8 h-8 text-yellow-400 animate-spin" />
                <h2 className="text-4xl md:text-5xl font-bold text-yellow-400 tracking-widest">TRADER</h2>
                <Star className="w-8 h-8 text-yellow-400 animate-spin" />
              </div>
            </div>
            
            <div className="mb-6 flex items-center justify-center space-x-2">
              <Diamond className="w-6 h-6 text-yellow-400 animate-pulse" />
              <p className="text-2xl md:text-3xl font-light text-yellow-200 tracking-wide">
                ELITE TRADING INTELLIGENCE
              </p>
              <Diamond className="w-6 h-6 text-yellow-400 animate-pulse" />
            </div>
            
            <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              The world's most exclusive trading journal platform. Used by hedge funds, prop firms, and elite traders 
              who demand nothing less than perfection. This isn't just software—it's your competitive advantage.
            </p>
            
            <div className="mb-12 p-6 bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 rounded-2xl border border-yellow-400/30 backdrop-blur-sm">
              <div className="text-yellow-400 text-sm font-semibold mb-2 tracking-wider">PREMIUM MEMBERSHIP</div>
              <div className="text-4xl font-black text-white mb-2">
                $299<span className="text-xl text-gray-400">/month</span>
              </div>
              <div className="text-gray-400">Professional Tier • Institutional Grade</div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link 
                to="/register"
                className="group relative px-12 py-5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xl font-bold rounded-2xl shadow-2xl hover:shadow-yellow-500/50 transform hover:scale-105 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center space-x-2">
                  <Crown className="w-6 h-6" />
                  <span>JOIN THE ELITE</span>
                </span>
              </Link>
              <Link 
                to="/contact"
                className="px-12 py-5 bg-black border-2 border-yellow-400 text-yellow-400 text-xl font-bold rounded-2xl hover:bg-yellow-400 hover:text-black transition-all duration-300"
              >
                REQUEST DEMO
              </Link>
            </div>
            
            <p className="text-sm text-gray-500 mt-6">
              * Subject to qualification • Minimum $100K portfolio required
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
                  <div className="text-5xl font-black mb-2 animate-pulse">{stat.value}</div>
                  <div className="text-gray-400 font-semibold tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Exclusive Features */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Star className="w-8 h-8 text-yellow-400 animate-spin" />
              <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                EXCLUSIVE FEATURES
              </h2>
              <Star className="w-8 h-8 text-yellow-400 animate-spin" />
            </div>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Features so advanced, they're classified. Tools so powerful, they're restricted to elite traders only.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <div className="group hover:transform hover:scale-105 transition-all duration-500">
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl group-hover:shadow-yellow-500/50 transition-all duration-300">
                    <Zap className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold mb-3 text-yellow-400">AI ALPHA DETECTION</h3>
                    <p className="text-gray-300 text-lg">
                      Proprietary machine learning algorithms that identify profitable patterns invisible to the human eye. 
                      Our AI has analyzed over $10 billion in trades to give you superhuman edge detection.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="group hover:transform hover:scale-105 transition-all duration-500">
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl group-hover:shadow-yellow-500/50 transition-all duration-300">
                    <Target className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold mb-3 text-yellow-400">QUANTUM RISK MODELING</h3>
                    <p className="text-gray-300 text-lg">
                      Advanced quantum computing-inspired risk calculations that predict market movements with 
                      unprecedented accuracy. Risk management so sophisticated, it's used by major institutions.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="group hover:transform hover:scale-105 transition-all duration-500">
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl group-hover:shadow-yellow-500/50 transition-all duration-300">
                    <Crown className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold mb-3 text-yellow-400">INSTITUTIONAL ANALYTICS</h3>
                    <p className="text-gray-300 text-lg">
                      The same analytics suite used by Goldman Sachs and JP Morgan, now available to elite traders. 
                      200+ metrics, real-time market correlation, and predictive modeling capabilities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-black/50 rounded-3xl p-10 border border-yellow-400/30 backdrop-blur-sm">
                <div className="text-center mb-8">
                  <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-3xl font-bold text-yellow-400 mb-2">PERFORMANCE METRICS</h3>
                  <p className="text-gray-400">Institutional Grade Analytics</p>
                </div>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center p-4 bg-yellow-400/5 rounded-xl">
                    <span className="text-gray-300">Alpha Generation</span>
                    <span className="text-yellow-400 font-bold">+347%</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-yellow-400/5 rounded-xl">
                    <span className="text-gray-300">Sharpe Ratio</span>
                    <span className="text-yellow-400 font-bold">4.82</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-yellow-400/5 rounded-xl">
                    <span className="text-gray-300">Max Drawdown</span>
                    <span className="text-yellow-400 font-bold">-2.1%</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-yellow-400/5 rounded-xl">
                    <span className="text-gray-300">Win Rate</span>
                    <span className="text-yellow-400 font-bold">89.7%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Pricing */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              ELITE MEMBERSHIP
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Not everyone qualifies. This level of trading intelligence is reserved for serious professionals only.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
              <div className="relative bg-black border-2 border-yellow-400 rounded-3xl p-12 text-center">
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <Crown className="w-12 h-12 text-yellow-400 animate-pulse" />
                  <h3 className="text-4xl font-black text-yellow-400">HERMES ELITE</h3>
                  <Crown className="w-12 h-12 text-yellow-400 animate-pulse" />
                </div>
                
                <div className="mb-8">
                  <div className="text-7xl font-black text-white mb-4">
                    $299<span className="text-2xl text-gray-400">/month</span>
                  </div>
                  <div className="text-yellow-400 text-lg">Professional Institutional License</div>
                </div>
                
                <div className="space-y-4 mb-10 text-left">
                  <div className="flex items-center space-x-3">
                    <Star className="w-6 h-6 text-yellow-400" />
                    <span className="text-gray-300">Unlimited Trade Analysis</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="w-6 h-6 text-yellow-400" />
                    <span className="text-gray-300">AI Alpha Detection Engine</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="w-6 h-6 text-yellow-400" />
                    <span className="text-gray-300">Quantum Risk Modeling</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="w-6 h-6 text-yellow-400" />
                    <span className="text-gray-300">24/7 Dedicated Support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="w-6 h-6 text-yellow-400" />
                    <span className="text-gray-300">Exclusive Market Intelligence</span>
                  </div>
                </div>
                
                <Link 
                  to="/register"
                  className="block w-full py-5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xl font-bold rounded-2xl shadow-2xl hover:shadow-yellow-500/50 transform hover:scale-105 transition-all duration-500 mb-4"
                >
                  APPLY FOR MEMBERSHIP
                </Link>
                
                <p className="text-sm text-gray-500">
                  * Application required • Portfolio verification mandatory
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
              JOIN THE 1%
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Elite traders don't use ordinary tools. They use HERMES TRADER. 
              The difference between profit and loss is the quality of your intelligence.
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-4 mb-8">
            <Diamond className="w-8 h-8 text-yellow-400 animate-spin" />
            <span className="text-yellow-400 text-lg font-bold tracking-widest">EXCLUSIVE • ELITE • EXCEPTIONAL</span>
            <Diamond className="w-8 h-8 text-yellow-400 animate-spin" />
          </div>
          
          <Link 
            to="/register"
            className="inline-block px-16 py-6 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-2xl font-black rounded-2xl shadow-2xl hover:shadow-yellow-500/50 transform hover:scale-110 transition-all duration-500"
          >
            CLAIM YOUR EDGE
          </Link>
        </div>
      </section>
    </div>
  );
}