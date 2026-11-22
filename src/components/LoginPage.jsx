import React, { useState } from 'react';
import { GraduationCap, Lock, Eye, EyeOff, Sparkles, Shield } from 'lucide-react';
import { loginToApi } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await loginToApi(password);

    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.error || 'Mật khẩu không đúng. Vui lòng thử lại.');
      setPassword('');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4 font-sans">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-sky-50 rounded-full blur-2xl opacity-80" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-sky-200/40 border border-sky-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-8 py-8 text-center relative overflow-hidden">
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                                   radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
                backgroundSize: '32px 32px'
              }}
            />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 border-2 border-white/40 shadow-inner backdrop-blur-sm">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-xl font-black text-white font-genz tracking-wide">
                GradInvite Admin
              </h1>
              <p className="text-sky-100 text-xs mt-1 font-medium">
                Hệ Thống Quản Trị Thiệp Mời Tốt Nghiệp
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-4 h-4 text-sky-500" />
              <span className="text-sm font-bold text-slate-700">Đăng Nhập Quản Trị</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 font-bold border border-sky-200">
                Admin Only
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Mật Khẩu Admin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-sky-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Nhập mật khẩu..."
                    autoFocus
                    className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 ${
                      error
                        ? 'border-rose-300 bg-rose-50 text-rose-800 placeholder:text-rose-300'
                        : 'border-sky-200 bg-sky-50/60 text-slate-900 placeholder:text-slate-400 hover:border-sky-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-sky-500 transition-colors cursor-pointer"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                  >
                    {showPassword
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />
                    }
                  </button>
                </div>

                {/* Error message */}
                {error && (
                  <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1">
                    <span>⚠️</span> {error}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl font-black text-sm text-white uppercase tracking-wider transition-all shadow-md shadow-sky-500/30 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                  boxShadow: '0 6px 20px rgba(14,165,233,0.35)',
                }}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Đăng Nhập Vào Trang Quản Trị
                  </>
                )}
              </button>
            </form>

            {/* Footer hint */}
            <div className="mt-5 pt-5 border-t border-sky-100 text-center">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Chỉ dành cho người tổ chức. Người được mời hãy dùng
                <br />
                link cá nhân hoá <span className="font-mono text-sky-500 font-bold">?invite=INV-...</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tagline below card */}
        <p className="text-center text-xs text-slate-400 mt-4 font-genz">
          ✨ GradInvite • Personalized Graduation Invitation System
        </p>
      </div>
    </div>
  );
}

