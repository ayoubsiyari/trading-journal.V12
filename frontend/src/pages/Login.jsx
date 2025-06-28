// src/pages/Login.jsx

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Star, Crown } from 'lucide-react';
import logo from '../assets/logo.webp';

export default function Login() {
  // Language state: "en" or "ar"
  const [lang, setLang] = useState('en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [mounted, setMounted] = useState(false);
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();
  const formRef = useRef(null);

  // Trigger fade & scale on mount
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // Remove shake animation
  useEffect(() => {
    if (shake) {
      const t = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [shake]);

  // Translations
  const t = {
    en: {
      titleMain: 'Hermes Trader Journal',
      subtitle:
        'Elevate your trading prowess with advanced journaling. Record each trade, analyze metrics, and refine your strategy using powerful, pro-grade tools.',
      signInTitle: 'Sign In to Your Account',
      signInSub: 'Enter your credentials to continue',
      emailLabel: 'Email Address',
      emailPlaceholder: 'you@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      signInButton: 'Sign In',
      noAccount: "Don't have an account?",
      createAccount: 'Create One',
      loginFailed: 'Login failed',
      networkError: 'Network error, please try again',
      dir: 'ltr',
    },
    ar: {
      titleMain: 'سجل هيرميس للتداول',
      subtitle:
        'ارتقِ بمهاراتك في التداول من خلال التدوين المتقدم. سجِّل كل صفقة، حلل البيانات، وحسِّن استراتيجيتك باستخدام أدوات احترافية قوية.',
      signInTitle: 'تسجيل الدخول إلى حسابك',
      signInSub: 'أدخل بياناتك للمتابعة',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'مثال: you@example.com',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: '••••••••',
      signInButton: 'تسجيل الدخول',
      noAccount: 'لا تملك حسابًا؟',
      createAccount: 'أنشئ حسابًا',
      loginFailed: 'فشل تسجيل الدخول',
      networkError: 'خطأ في الاتصال، حاول مرة أخرى',
      dir: 'rtl',
    },
  };

  const texts = t[lang];

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        setMsg(data.msg || texts.loginFailed);
        setShake(true);
      }
    } catch (err) {
      console.error(err);
      setMsg(texts.networkError);
      setShake(true);
    }
  };

  const toggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  return (
    <>
      {/* Global Keyframes & Styles */}
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
          @keyframes shakeX {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-10px); }
            40%, 80% { transform: translateX(10px); }
          }
          @keyframes goldShimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes floatUp {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
          @keyframes goldGlow {
            0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
            50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 215, 0, 0.3); }
          }
          @keyframes buttonPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
          }
          @keyframes sparkle {
            0%, 100% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; transform: scale(1); }
          }
          .bg-premium {
            background: 
              radial-gradient(circle at 20% 80%, rgba(255, 215, 0, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 193, 7, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(255, 235, 59, 0.05) 0%, transparent 50%),
              linear-gradient(135deg, #000000 0%, #1a1a1a 25%, #000000 50%, #2d2d2d 75%, #000000 100%);
          }
          .card-premium {
            background: linear-gradient(145deg, 
              rgba(26, 26, 26, 0.95) 0%, 
              rgba(45, 45, 45, 0.98) 50%, 
              rgba(26, 26, 26, 0.95) 100%);
            border: 1px solid rgba(255, 215, 0, 0.3);
            box-shadow: 
              0 25px 50px -12px rgba(0, 0, 0, 0.8),
              0 0 0 1px rgba(255, 215, 0, 0.1),
              inset 0 1px 0 rgba(255, 215, 0, 0.1);
          }
          .gold-text {
            background: linear-gradient(135deg, #FFD700, #FFA500, #FFED4E, #FFD700);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .shimmer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.4), transparent);
            animation: goldShimmer 2s infinite;
          }
          .input-premium {
            background: rgba(26, 26, 26, 0.8);
            border: 1px solid rgba(255, 215, 0, 0.3);
            color: #fff;
            transition: all 0.3s ease;
          }
          .input-premium:focus {
            border-color: #FFD700;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
            background: rgba(26, 26, 26, 0.9);
          }
          .btn-premium {
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
            border: 2px solid #000;
            color: #000;
            font-weight: 700;
            text-shadow: none;
            position: relative;
            overflow: hidden;
            animation: goldGlow 2s ease-in-out infinite;
          }
          .btn-premium:hover {
            background: linear-gradient(135deg, #FFED4E 0%, #FFD700 50%, #FFED4E 100%);
            transform: translateY(-2px);
            animation: buttonPulse 0.6s ease infinite;
          }
          .sparkle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #FFD700;
            border-radius: 50%;
            animation: sparkle 1.5s ease-in-out infinite;
          }
          .floating-shapes {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
          }
          .shape {
            position: absolute;
            opacity: 0.1;
            animation: floatUp 6s ease-in-out infinite;
          }
          .fade-in-up {
          animation: fadeInUp 1s ease-out forwards;
          } 
        `}
      </style>

      {/* Fullscreen Premium Background */}
      <div
        dir={texts.dir}
        className="min-h-screen flex items-center justify-center bg-premium px-6 relative overflow-hidden"
      >
        {/* Floating Background Shapes */}
        <div className="floating-shapes">
          <Star className="shape text-yellow-400 w-8 h-8" style={{ top: '10%', left: '10%', animationDelay: '0s' }} />
          <Crown className="shape text-yellow-400 w-6 h-6" style={{ top: '20%', right: '15%', animationDelay: '2s' }} />
          <Star className="shape text-yellow-400 w-4 h-4" style={{ bottom: '30%', left: '20%', animationDelay: '4s' }} />
          <Crown className="shape text-yellow-400 w-10 h-10" style={{ bottom: '10%', right: '10%', animationDelay: '1s' }} />
        </div>

        {/* Sparkle Effects */}
        <div className="sparkle" style={{ top: '15%', left: '25%', animationDelay: '0.5s' }}></div>
        <div className="sparkle" style={{ top: '35%', right: '30%', animationDelay: '1.2s' }}></div>
        <div className="sparkle" style={{ bottom: '25%', left: '15%', animationDelay: '2.1s' }}></div>
        <div className="sparkle" style={{ bottom: '40%', right: '20%', animationDelay: '1.8s' }}></div>

        <div
          ref={formRef}
          className={`
            relative w-full max-w-2xl card-premium backdrop-blur-xl
            rounded-3xl overflow-hidden transform transition-all 
            duration-1000 ease-out ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            ${shake ? 'animate-pulse' : ''}
          `}
          style={{ animation: shake ? 'shakeX 0.5s ease-in-out' : '' }}
        >
          {/* Language Toggle Switch */}
          <div className="absolute top-6 right-6 z-20 flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={lang === 'ar'}
                onChange={toggleLang}
              />
              <div className="w-14 h-7 bg-gray-700 rounded-full peer-focus:ring-2 peer-focus:ring-yellow-500 peer-checked:bg-gradient-to-r peer-checked:from-yellow-600 peer-checked:to-yellow-400 transition-all duration-300"></div>
              <span className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-lg peer-checked:translate-x-7 transition-transform duration-300"></span>
            </label>
            <span className="ml-3 text-sm font-semibold text-yellow-400">{lang === 'en' ? 'EN' : 'عر'}</span>
          </div>

          {/* Logo & Heading */}
          <div className="py-12 bg-gradient-to-br from-gray-900 via-black to-gray-800 flex flex-col items-center relative overflow-hidden">
            <div className="absolute inset-0 shimmer"></div>
            <div className="relative z-10">
              <img
                src={logo}
                alt="Hermes Logo"
                className="w-28 h-28 object-contain mb-6 rounded-full shadow-2xl border-4 border-yellow-400"
                style={{ animation: 'goldGlow 3s ease-in-out infinite' }}
              />
              <h1 className="text-5xl font-black gold-text mb-4 tracking-wider fade-in-up text-center">
                {texts.titleMain}
              </h1>
              <p
                className="mt-2 text-lg text-gray-300 max-w-lg text-center px-6 leading-relaxed opacity-0 fade-in-up"
                style={{ animationDelay: '0.5s' }}
              >
                {texts.subtitle}
              </p>
            </div>
          </div>

          {/* Premium Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-50" />

          {/* Login Form */}
          <div className="px-10 lg:px-16 py-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-black/50"></div>
            <form onSubmit={handleLogin} className="relative z-10 w-full max-w-md mx-auto space-y-8">
              <div className="text-center">
                <h2
                  className="text-4xl font-black text-white mb-2 opacity-0 fade-in-up"
                  style={{ animationDelay: '0.8s' }}
                >
                  <span className="gold-text">{texts.signInTitle}</span>
                </h2>
                <p
                  className="text-gray-400 text-sm tracking-wide opacity-0 fade-in-up"
                  style={{ animationDelay: '1s' }}
                >
                  {texts.signInSub}
                </p>
              </div>

              {msg && (
                <div className="bg-red-900/80 border border-red-500 text-red-200 px-6 py-4 rounded-xl text-center font-semibold animate-pulse backdrop-blur-sm">
                  {msg}
                </div>
              )}

              <div className="space-y-8">
                <label className="block">
                  <span
                    className="text-yellow-400 font-semibold text-sm uppercase tracking-wider opacity-0 fade-in-up flex items-center"
                    style={{ animationDelay: '1.2s' }}
                  >
                    <Mail className="mr-3 text-yellow-400" size={18} />
                    {texts.emailLabel}
                  </span>
                  <input
                    type="email"
                    placeholder={texts.emailPlaceholder}
                    className="mt-3 w-full px-6 py-4 input-premium rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-0 transition-all duration-300 opacity-0 fade-in-up"
                    style={{ animationDelay: '1.4s' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>

                <label className="block">
                  <span
                    className="text-yellow-400 font-semibold text-sm uppercase tracking-wider opacity-0 fade-in-up flex items-center"
                    style={{ animationDelay: '1.6s' }}
                  >
                    <Lock className="mr-3 text-yellow-400" size={18} />
                    {texts.passwordLabel}
                  </span>
                  <input
                    type="password"
                    placeholder={texts.passwordPlaceholder}
                    className="mt-3 w-full px-6 py-4 input-premium rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-0 transition-all duration-300 opacity-0 fade-in-up"
                    style={{ animationDelay: '1.8s' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>
              </div>

              {/* Premium Sign In Button */}
              <button
                type="submit"
                className="w-full py-4 btn-premium rounded-xl text-lg font-black uppercase tracking-wider transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-400/50 relative overflow-hidden"
                style={{ animationDelay: '2s' }}
              >
                <span className="relative z-10">{texts.signInButton}</span>
                <div className="absolute inset-0 shimmer"></div>
              </button>

              <p
                className="text-center text-gray-400 opacity-0 fade-in-up"
                style={{ animationDelay: '2.2s' }}
              >
                {texts.noAccount}{' '}
                <Link to="/register" className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors duration-300 hover:underline">
                  {texts.createAccount}
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}