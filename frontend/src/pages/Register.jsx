// src/pages/Register.jsx

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Star, Crown, Sparkles, UserPlus } from 'lucide-react';
import logo from '../assets/logo.webp';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        // Registration succeeded → go to login page
        navigate('/login');
      } else {
        // Show backend‐provided error (it returns { error: "..." } on failure)
        setMsg(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Network error:', err);
      setMsg('Network error, please try again');
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes gradientFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(30px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes goldShimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes floatUp {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-25px) rotate(180deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.7; }
          }
          @keyframes goldGlow {
            0%, 100% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.4); }
            50% { box-shadow: 0 0 50px rgba(255, 215, 0, 0.7), 0 0 80px rgba(255, 215, 0, 0.4); }
          }
          @keyframes buttonPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.03); }
            100% { transform: scale(1); }
          }
          @keyframes sparkle {
            0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
            50% { opacity: 1; transform: scale(1) rotate(180deg); }
          }
          @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes scaleIn {
            0% { transform: scale(0.8) rotate(-10deg); opacity: 0; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
          .bg-premium {
            background: 
              radial-gradient(circle at 25% 75%, rgba(255, 215, 0, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 75% 25%, rgba(255, 193, 7, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(255, 235, 59, 0.08) 0%, transparent 70%),
              linear-gradient(135deg, #000000 0%, #1a1a1a 20%, #000000 40%, #2d2d2d 60%, #1a1a1a 80%, #000000 100%);
            animation: gradientFlow 20s ease infinite;
            background-size: 400% 400%;
          }
          .card-premium {
            background: linear-gradient(145deg, 
              rgba(20, 20, 20, 0.98) 0%, 
              rgba(40, 40, 40, 0.95) 30%,
              rgba(25, 25, 25, 0.98) 60%, 
              rgba(35, 35, 35, 0.95) 100%);
            border: 2px solid transparent;
            background-clip: padding-box;
            position: relative;
          }
          .card-premium::before {
            content: '';
            position: absolute;
            inset: 0;
            padding: 2px;
            background: linear-gradient(135deg, #FFD700, transparent, #FFA500, transparent, #FFD700);
            border-radius: inherit;
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: exclude;
            animation: rotate 4s linear infinite;
          }
          .gold-text {
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FFED4E 50%, #FFD700 75%, #FFA500 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            background-size: 200% 200%;
            animation: gradientFlow 3s ease infinite;
          }
          .shimmer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.4), transparent);
            animation: goldShimmer 2.5s infinite;
          }
          .input-premium {
            background: rgba(15, 15, 15, 0.9);
            border: 2px solid rgba(255, 215, 0, 0.4);
            color: #fff;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
          }
          .input-premium:focus {
            border-color: #FFD700;
            box-shadow: 
              0 0 25px rgba(255, 215, 0, 0.4),
              0 0 50px rgba(255, 215, 0, 0.2);
            background: rgba(20, 20, 20, 0.95);
            transform: translateY(-2px);
          }
          .btn-premium {
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FFED4E 50%, #FFD700 75%, #FFA500 100%);
            background-size: 200% 200%;
            border: 3px solid #1a1a1a;
            color: #000;
            font-weight: 800;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            position: relative;
            overflow: hidden;
            animation: gradientFlow 4s ease infinite;
          }
          .btn-premium:hover {
            animation: buttonPulse 0.8s ease infinite, gradientFlow 2s ease infinite;
            transform: translateY(-3px);
            box-shadow: 
              0 10px 30px rgba(255, 215, 0, 0.4),
              0 0 50px rgba(255, 215, 0, 0.3);
          }
          .sparkle-lg {
            position: absolute;
            width: 8px;
            height: 8px;
            background: radial-gradient(circle, #FFD700, #FFA500);
            border-radius: 50%;
            animation: sparkle 2s ease-in-out infinite;
          }
          .sparkle-sm {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #FFED4E;
            border-radius: 50%;
            animation: sparkle 1.8s ease-in-out infinite;
          }
          .floating-icon {
            position: absolute;
            opacity: 0.15;
            animation: floatUp 8s ease-in-out infinite;
            color: #FFD700;
          }
          .premium-glow {
            animation: goldGlow 3s ease-in-out infinite;
          }
          .scale-in {
            animation: scaleIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
        `}
      </style>

      <div className="min-h-screen flex items-center justify-center bg-premium px-6 relative overflow-hidden">
        {/* Floating Premium Icons */}
        <Crown className="floating-icon w-12 h-12" style={{ top: '8%', left: '12%', animationDelay: '0s' }} />
        <Star className="floating-icon w-8 h-8" style={{ top: '15%', right: '18%', animationDelay: '2.5s' }} />
        <Sparkles className="floating-icon w-10 h-10" style={{ bottom: '25%', left: '15%', animationDelay: '5s' }} />
        <Crown className="floating-icon w-6 h-6" style={{ bottom: '35%', right: '25%', animationDelay: '1.5s' }} />
        <Star className="floating-icon w-14 h-14" style={{ bottom: '8%', right: '8%', animationDelay: '3.5s' }} />

        {/* Large Sparkle Effects */}
        <div className="sparkle-lg" style={{ top: '20%', left: '30%', animationDelay: '0.8s' }}></div>
        <div className="sparkle-lg" style={{ top: '45%', right: '35%', animationDelay: '2.2s' }}></div>
        <div className="sparkle-sm" style={{ bottom: '30%', left: '25%', animationDelay: '1.5s' }}></div>
        <div className="sparkle-sm" style={{ bottom: '45%', right: '20%', animationDelay: '3.1s' }}></div>
        <div className="sparkle-lg" style={{ top: '65%', left: '45%', animationDelay: '2.8s' }}></div>

        {/* Rotating Premium Badge */}
        <div className="absolute top-8 right-8 ">
         <img
                         src={logo}
                         alt="Hermes Logo"
                         className="w-28 h-28 object-contain mb-6 rounded-full shadow-2xl border-4 border-yellow-400"
                         
                       />
        </div>

        <div className={`w-full max-w-md transition-all duration-1000 ${mounted ? 'scale-in' : 'opacity-0'}`}>
          <div className="card-premium rounded-3xl p-8 shadow-2xl relative overflow-hidden premium-glow">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <UserPlus className="w-16 h-16 text-yellow-400" />
                  <div className="absolute -top-2 -right-2">
                    <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                  </div>
                </div>
              </div>
              <h1 className="text-4xl font-black gold-text mb-2 shimmer relative">
                JOIN NOW
              </h1>
              <p className="text-gray-300 text-lg font-medium">
                Create your  account
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleRegister} className="space-y-6">
              {/* Email Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-6 w-6 text-yellow-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="input-premium block w-full pl-12 pr-4 py-4 rounded-xl text-lg font-medium placeholder-gray-400 focus:outline-none"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-6 w-6 text-yellow-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="input-premium block w-full pl-12 pr-4 py-4 rounded-xl text-lg font-medium placeholder-gray-400 focus:outline-none"
                  required
                />
              </div>

              {/* Error Message */}
              {msg && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-center font-medium">
                  {msg}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-premium w-full py-4 px-6 rounded-xl text-xl font-black uppercase tracking-wider transition-all duration-300 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-yellow-500/50"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <Crown className="w-6 h-6" />
                  CREATE ACCOUNT
                  <Sparkles className="w-6 h-6" />
                </span>
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-300 font-medium">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="gold-text font-bold hover:underline transition-all duration-300 hover:drop-shadow-lg"
                >
                  Sign In Here
                </Link>
              </p>
            </div>

            {/* Premium Features Badge */}
            
          </div>
        </div>
      </div>
    </>
  );
}