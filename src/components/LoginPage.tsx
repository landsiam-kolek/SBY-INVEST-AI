import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { AuthUser } from '../types';
import { SataRobotLogo } from './SataRobotLogo';
import { SbyIntroductionModal } from './SbyIntroductionModal';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showIntroModal, setShowIntroModal] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser) {
      setErrorMsg('กรุณากรอก Username หรือชื่อผู้ใช้งาน');
      return;
    }

    if (!trimmedPass) {
      setErrorMsg('กรุณากรอกรหัสผ่าน (Password)');
      return;
    }

    // Authentication Logic:
    // 1. If username is 'admin' (case-insensitive), password MUST be 'kolek'
    // 2. For all other usernames, password MUST be 'saby'
    const isAdminUser = trimmedUser.toLowerCase() === 'admin';

    if (isAdminUser) {
      if (trimmedPass === 'kolek') {
        const user: AuthUser = {
          username: 'admin',
          role: 'admin',
          loginTime: new Date().toISOString(),
        };
        if (rememberMe) {
          localStorage.setItem('sby_auth_user', JSON.stringify(user));
        }
        onLoginSuccess(user);
      } else {
        setErrorMsg('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง');
      }
    } else {
      if (trimmedPass === 'saby') {
        const user: AuthUser = {
          username: trimmedUser,
          role: 'user',
          loginTime: new Date().toISOString(),
        };
        if (rememberMe) {
          localStorage.setItem('sby_auth_user', JSON.stringify(user));
        }
        onLoginSuccess(user);
      } else {
        setErrorMsg('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans select-none">
      {/* Dynamic Background Ambient Gradients */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Login Card Container */}
      <div className="w-full max-w-md bg-[#121215]/95 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <SataRobotLogo size={64} glow={true} className="hover:scale-105 transition-transform duration-300" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center space-x-2">
            <span>SBY Invest AI</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
              v2.5
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 font-medium">
            ระบบวิเคราะห์หุ้น & จัดพอร์ตการลงทุน AI อัจฉริยะ
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Username Field */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              ชื่อผู้ใช้งาน (Username):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="login-username-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ระบุชื่อผู้ใช้งาน"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              รหัสผ่าน (Password):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                id="login-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center space-x-2 text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>จดจำการเข้าสู่ระบบ</span>
            </label>
          </div>

          {/* Submit Login Button */}
          <button
            type="submit"
            id="submit-login-btn"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer mt-2"
          >
            <span>เข้าสู่ระบบ SBY Invest AI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Footer Info / Introduction Button */}
      <div className="mt-6 text-center max-w-sm w-full relative z-10">
        <button
          type="button"
          id="btn-open-intro-article"
          onClick={() => setShowIntroModal(true)}
          className="w-full text-center text-xs text-zinc-500 hover:text-indigo-300 p-2.5 rounded-2xl hover:bg-zinc-900/80 border border-transparent hover:border-indigo-500/30 transition-all duration-200 cursor-pointer group"
          title="คลิกเพื่ออ่านบทความแนะนำ SBY INVEST AI"
        >
          <div className="flex items-center justify-center space-x-1.5 text-zinc-400 group-hover:text-indigo-300 transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="font-semibold">SBY Invest AI — Intelligent Investment & Trading Platform</span>
          </div>
          <p className="text-[10px] mt-1 text-zinc-600 group-hover:text-zinc-400 transition-colors">
            ผสาน Fundamental Valuation & Technical Trading Strategy
          </p>
          <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-[11px] font-bold text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
            <BookOpen className="w-3.5 h-3.5" />
            <span>📖 แนะนำระบบ: ทำไมต้องใช้ SBY INVEST AI? (คลิกเพื่ออ่าน)</span>
          </div>
        </button>
      </div>

      {/* Introduction Article Modal */}
      <SbyIntroductionModal 
        isOpen={showIntroModal} 
        onClose={() => setShowIntroModal(false)} 
      />
    </div>
  );
};
